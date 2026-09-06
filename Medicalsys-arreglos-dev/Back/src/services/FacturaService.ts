import { AppDataSource } from "../config/database";
import { FacturaRepository, DetalleFacturaRepository } from "../repositories/FacturaRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { ServicioRepository } from "../repositories/ServicioRepository";
import { ConsultaRepository } from "../repositories/ConsultaRepository";
import { AtencionServicioRepository } from "../repositories/AtencionServicioRepository";
import { EmitirFacturaDTO, FiltroFacturasDTO } from "../dtos/factura.dto";
import { Factura } from "../entities/Factura.entity";
import { DetalleFactura } from "../entities/DetalleFactura.entity";
import { AtencionServicio } from "../entities/AtencionServicio.entity";

export class FacturaService {
  static async emitir(dto: EmitirFacturaDTO, authUser?: { idUsuario: number; rol: string }): Promise<Factura> {
    if (!dto.idPaciente) {
      throw { status: 400, message: "El ID del paciente es obligatorio para emitir la factura." };
    }

    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw { status: 400, message: "Debe incluir al menos un servicio o ítem en la factura." };
    }

    const paciente = await PacienteRepository.buscarPorId(dto.idPaciente);
    if (!paciente) {
      throw { status: 404, message: "El paciente especificado no existe." };
    }

    // Datos fiscales por defecto si no se ingresaron
    const nombreCompletoPaciente = paciente.usuario
      ? `${paciente.usuario.nombres} ${paciente.usuario.apellidos}`.trim()
      : "CLIENTE";
    const nitCliente = dto.nitCliente?.trim() || paciente.documentoIdentidad || "0";
    const razonSocial = dto.razonSocial?.trim() || nombreCompletoPaciente;

    // Validar y calcular ítems
    let subtotalNumerico = 0;
    const detallesPreparados: {
      servicio: any;
      cantidad: number;
      precioUnitario: number;
      subtotalItem: number;
    }[] = [];

    for (const item of dto.items) {
      if (!item.idServicio) {
        throw { status: 400, message: "Cada ítem debe tener un ID de servicio válido." };
      }

      const cantidad = Number(item.cantidad) || 1;
      if (cantidad <= 0) {
        throw { status: 400, message: "La cantidad de cada servicio debe ser mayor a 0." };
      }

      const servicio = await ServicioRepository.buscarPorId(item.idServicio);
      if (!servicio) {
        throw { status: 404, message: `El servicio con ID ${item.idServicio} no existe.` };
      }

      const precioUnitario = item.precioUnitario !== undefined && !isNaN(Number(item.precioUnitario)) && Number(item.precioUnitario) >= 0
        ? Number(item.precioUnitario)
        : Number(servicio.precio);

      const subtotalItem = Number((cantidad * precioUnitario).toFixed(2));
      subtotalNumerico += subtotalItem;

      detallesPreparados.push({
        servicio,
        cantidad,
        precioUnitario,
        subtotalItem,
      });
    }

    subtotalNumerico = Number(subtotalNumerico.toFixed(2));

    // Descuentos
    let montoDescuento = 0;
    if (dto.porcentajeDescuento !== undefined && !isNaN(Number(dto.porcentajeDescuento))) {
      const porcentaje = Number(dto.porcentajeDescuento);
      if (porcentaje < 0 || porcentaje > 100) {
        throw { status: 400, message: "El porcentaje de descuento debe estar entre 0 y 100." };
      }
      montoDescuento = Number(((subtotalNumerico * porcentaje) / 100).toFixed(2));
    } else if (dto.descuento !== undefined && !isNaN(Number(dto.descuento))) {
      montoDescuento = Number(Number(dto.descuento).toFixed(2));
      if (montoDescuento < 0) {
        throw { status: 400, message: "El descuento no puede ser negativo." };
      }
    }

    if (montoDescuento > subtotalNumerico) {
      throw { status: 400, message: "El descuento no puede ser superior al subtotal de la factura." };
    }

    const impuestosNumerico = 0; // Desglose fiscal estándar
    const totalNumerico = Number((subtotalNumerico - montoDescuento + impuestosNumerico).toFixed(2));

    // Generar correlativo único
    const numeroFactura = await FacturaRepository.generarSiguienteNumero();
    const estado = dto.estado ? dto.estado.toUpperCase() : "EMITIDA";

    // Generar código de control hash simple para representación de respaldo digital
    const timestamp = Date.now().toString(16).toUpperCase();
    const codigoControl = `CC-${numeroFactura}-${timestamp.slice(-6)}`;

    // Transacción de guardado
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevaFactura = queryRunner.manager.create(Factura, {
        paciente,
        numeroFactura,
        nitCliente,
        razonSocial,
        subtotal: String(subtotalNumerico.toFixed(2)),
        impuestos: String(impuestosNumerico.toFixed(2)),
        total: String(totalNumerico.toFixed(2)),
        estado,
        codigoControl,
      });

      const facturaGuardada = await queryRunner.manager.save(Factura, nuevaFactura);

      const entidadesDetalles: DetalleFactura[] = [];
      for (const d of detallesPreparados) {
        const nuevoDetalle = queryRunner.manager.create(DetalleFactura, {
          factura: facturaGuardada,
          servicio: d.servicio,
          cantidad: d.cantidad,
          precioUnitario: String(d.precioUnitario.toFixed(2)),
          subtotal: String(d.subtotalItem.toFixed(2)),
        });
        entidadesDetalles.push(nuevoDetalle);
      }

      await queryRunner.manager.save(DetalleFactura, entidadesDetalles);

      // Actualizar estado de AtencionServicio a FACTURADO si corresponde
      if (dto.idConsulta) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(AtencionServicio)
          .set({ estado: "FACTURADO", factura: facturaGuardada })
          .where("id_consulta = :idConsulta AND (estado = 'PENDIENTE' OR estado IS NULL)", {
            idConsulta: dto.idConsulta,
          })
          .execute();
      } else {
        await queryRunner.manager
          .createQueryBuilder()
          .update(AtencionServicio)
          .set({ estado: "FACTURADO", factura: facturaGuardada })
          .where("id_paciente = :idPaciente AND estado = 'PENDIENTE'", {
            idPaciente: dto.idPaciente,
          })
          .execute();
      }

      await queryRunner.commitTransaction();

      facturaGuardada.detalles = entidadesDetalles;
      return facturaGuardada;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  static async obtenerPorId(idFactura: number, authUser?: { idUsuario: number; rol: string }): Promise<Factura> {
    const factura = await FacturaRepository.buscarPorId(idFactura);
    if (!factura) {
      throw { status: 404, message: "La factura solicitada no existe." };
    }

    // Validación de propiedad para rol PACIENTE
    if (authUser?.rol === "PACIENTE") {
      const pacienteIdUsuario = factura.paciente?.usuario?.idUsuario;
      if (pacienteIdUsuario !== authUser.idUsuario) {
        throw { status: 403, message: "Acceso denegado: solo puede consultar sus propias facturas." };
      }
    }

    return factura;
  }

  static async listar(filtros: FiltroFacturasDTO = {}, authUser?: { idUsuario: number; rol: string }): Promise<Factura[]> {
    if (authUser?.rol === "PACIENTE") {
      const paciente = await PacienteRepository.findOne({
        where: { usuario: { idUsuario: authUser.idUsuario } },
      });
      if (!paciente) {
        return [];
      }
      filtros.idPaciente = paciente.idPaciente;
    }

    return FacturaRepository.listar(filtros);
  }

  static async obtenerPendientesDeFacturacion(idPaciente: number): Promise<any[]> {
    const paciente = await PacienteRepository.buscarPorId(idPaciente);
    if (!paciente) {
      throw { status: 404, message: "Paciente no encontrado." };
    }

    // Buscar consultas del paciente
    const consultas = await ConsultaRepository.find({
      where: { historia: { paciente: { idPaciente } } },
      relations: {
        medico: {
          usuario: true,
          especialidades: true,
        },
        consultorio: true,
      },
      order: { fechaConsulta: "DESC" },
      take: 10,
    });

    const atencionesServiciosPendientes = await AtencionServicioRepository.listarPorPaciente(idPaciente, "PENDIENTE");
    const servicios = await ServicioRepository.listarActivos();
    const servicioConsultaGeneral = servicios.find((s) => s.nombre.toLowerCase().includes("general")) || servicios[0];

    return consultas.map((c) => {
      const serviciosDeConsulta = atencionesServiciosPendientes.filter(
        (as) => as.consulta && as.consulta.idConsulta === c.idConsulta
      );

      return {
        idConsulta: c.idConsulta,
        fecha: c.fechaConsulta,
        motivo: c.motivo || "Consulta médica",
        medico: c.medico?.usuario ? `Dr(a). ${c.medico.usuario.nombres} ${c.medico.usuario.apellidos}` : "Médico de turno",
        especialidad: c.medico?.especialidades?.[0]?.nombre || "Medicina General",
        serviciosRegistrados: serviciosDeConsulta.map((s) => ({
          idAtencionServicio: s.idAtencionServicio,
          idServicio: s.servicio.idServicio,
          nombre: s.servicio.nombre,
          precioUnitario: Number(s.precioUnitario),
          cantidad: s.cantidad,
          subtotal: Number(s.subtotal),
          observaciones: s.observaciones,
        })),
        totalServiciosRegistrados: Number(
          serviciosDeConsulta.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)
        ),
        servicioSugerido: serviciosDeConsulta.length === 0 && servicioConsultaGeneral
          ? {
              idServicio: servicioConsultaGeneral.idServicio,
              nombre: servicioConsultaGeneral.nombre,
              precio: Number(servicioConsultaGeneral.precio),
            }
          : null,
      };
    });
  }
}

