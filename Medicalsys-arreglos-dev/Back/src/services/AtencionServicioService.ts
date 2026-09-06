import { AppDataSource } from "../config/database";
import { AtencionServicioRepository } from "../repositories/AtencionServicioRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { ServicioRepository } from "../repositories/ServicioRepository";
import { ConsultaRepository } from "../repositories/ConsultaRepository";
import {
  RegistrarAtencionServicioDTO,
  ActualizarAtencionServicioDTO,
} from "../dtos/atencionServicio.dto";
import { AtencionServicio } from "../entities/AtencionServicio.entity";

export class AtencionServicioService {
  static async registrar(dto: RegistrarAtencionServicioDTO): Promise<AtencionServicio[]> {
    if (!dto.idPaciente) {
      throw { status: 400, message: "El ID del paciente es obligatorio." };
    }

    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw { status: 400, message: "Debe incluir al menos un servicio en el registro." };
    }

    const paciente = await PacienteRepository.buscarPorId(dto.idPaciente);
    if (!paciente) {
      throw { status: 404, message: "El paciente especificado no existe." };
    }

    let consulta: any = null;
    if (dto.idConsulta) {
      consulta = await ConsultaRepository.findOne({
        where: { idConsulta: dto.idConsulta },
        relations: { historia: { paciente: true } },
      });
      if (!consulta) {
        throw { status: 404, message: "La consulta médica especificada no existe." };
      }
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entidadesAGuardar: AtencionServicio[] = [];

      for (const item of dto.items) {
        if (!item.idServicio) {
          throw { status: 400, message: "Cada ítem debe contar con un idServicio válido." };
        }

        const cantidad = Number(item.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
          throw { status: 400, message: "La cantidad de cada servicio debe ser mayor a 0." };
        }

        const servicio = await ServicioRepository.buscarPorId(item.idServicio);
        if (!servicio) {
          throw { status: 404, message: `El servicio con ID ${item.idServicio} no existe.` };
        }

        const precioUnitario =
          item.precioUnitario !== undefined && !isNaN(Number(item.precioUnitario)) && Number(item.precioUnitario) >= 0
            ? Number(item.precioUnitario)
            : Number(servicio.precio);

        const subtotal = Number((cantidad * precioUnitario).toFixed(2));

        const nuevaAtencionServicio = queryRunner.manager.create(AtencionServicio, {
          paciente,
          consulta: consulta || undefined,
          servicio,
          cantidad,
          precioUnitario: String(precioUnitario.toFixed(2)),
          subtotal: String(subtotal.toFixed(2)),
          observaciones: item.observaciones || dto.observacionesGenerales || undefined,
          estado: "PENDIENTE",
        });

        entidadesAGuardar.push(nuevaAtencionServicio);
      }

      const guardados = await queryRunner.manager.save(AtencionServicio, entidadesAGuardar);
      await queryRunner.commitTransaction();

      return guardados;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  static async actualizar(idAtencionServicio: number, dto: ActualizarAtencionServicioDTO): Promise<AtencionServicio> {
    const atencionServicio = await AtencionServicioRepository.buscarPorId(idAtencionServicio);
    if (!atencionServicio) {
      throw { status: 404, message: "El registro del servicio de atención no existe." };
    }

    if (atencionServicio.estado === "FACTURADO" || atencionServicio.factura) {
      throw {
        status: 400,
        message: "No se pueden modificar ni eliminar servicios de una atención que ya cuenta con una factura emitida.",
      };
    }

    if (dto.cantidad !== undefined) {
      const cantidad = Number(dto.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw { status: 400, message: "La cantidad debe ser mayor a 0." };
      }
      atencionServicio.cantidad = cantidad;
    }

    if (dto.precioUnitario !== undefined) {
      const precio = Number(dto.precioUnitario);
      if (isNaN(precio) || precio < 0) {
        throw { status: 400, message: "El precio unitario no puede ser negativo." };
      }
      atencionServicio.precioUnitario = String(precio.toFixed(2));
    }

    if (dto.observaciones !== undefined) {
      atencionServicio.observaciones = dto.observaciones;
    }

    const subtotalCalculado = Number(
      (Number(atencionServicio.cantidad) * Number(atencionServicio.precioUnitario)).toFixed(2)
    );
    atencionServicio.subtotal = String(subtotalCalculado.toFixed(2));

    return AtencionServicioRepository.save(atencionServicio);
  }

  static async eliminar(idAtencionServicio: number): Promise<{ message: string }> {
    const atencionServicio = await AtencionServicioRepository.buscarPorId(idAtencionServicio);
    if (!atencionServicio) {
      throw { status: 404, message: "El registro del servicio de atención no existe." };
    }

    if (atencionServicio.estado === "FACTURADO" || atencionServicio.factura) {
      throw {
        status: 400,
        message: "No se pueden modificar ni eliminar servicios de una atención que ya cuenta con una factura emitida.",
      };
    }

    await AtencionServicioRepository.remove(atencionServicio);
    return { message: "Servicio de la atención médica eliminado correctamente." };
  }

  static async listarPorConsulta(idConsulta: number): Promise<{
    items: AtencionServicio[];
    totalAcumulado: number;
    totalItems: number;
    estaFacturado: boolean;
  }> {
    const items = await AtencionServicioRepository.listarPorConsulta(idConsulta);
    const totalAcumulado = Number(
      items.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)
    );
    const estaFacturado = items.some((i) => i.estado === "FACTURADO" || !!i.factura);

    return {
      items,
      totalAcumulado,
      totalItems: items.length,
      estaFacturado,
    };
  }

  static async listarPorPaciente(idPaciente: number, estado?: string): Promise<AtencionServicio[]> {
    return AtencionServicioRepository.listarPorPaciente(idPaciente, estado);
  }
}

