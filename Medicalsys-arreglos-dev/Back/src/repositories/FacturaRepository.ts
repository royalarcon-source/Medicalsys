import { AppDataSource } from "../config/database";
import { Factura } from "../entities/Factura.entity";
import { DetalleFactura } from "../entities/DetalleFactura.entity";
import { FiltroFacturasDTO } from "../dtos/factura.dto";

export const FacturaRepository = AppDataSource.getRepository(Factura).extend({
  async buscarPorId(idFactura: number): Promise<Factura | null> {
    return this.findOne({
      where: { idFactura },
      relations: {
        paciente: {
          usuario: true,
        },
        detalles: {
          servicio: true,
        },
      },
    });
  },

  async buscarPorNumero(numeroFactura: string): Promise<Factura | null> {
    return this.findOne({
      where: { numeroFactura },
      relations: {
        paciente: {
          usuario: true,
        },
        detalles: {
          servicio: true,
        },
      },
    });
  },

  async generarSiguienteNumero(): Promise<string> {
    const anioActual = new Date().getFullYear();
    const prefijo = `FAC-${anioActual}-`;

    const ultimaFactura = await this.createQueryBuilder("factura")
      .where("factura.numero_factura LIKE :prefijo", { prefijo: `${prefijo}%` })
      .orderBy("factura.id_factura", "DESC")
      .getOne();

    let siguienteSecuencia = 1;
    if (ultimaFactura && ultimaFactura.numeroFactura) {
      const partes = ultimaFactura.numeroFactura.split("-");
      if (partes.length === 3) {
        const num = parseInt(partes[2], 10);
        if (!isNaN(num)) {
          siguienteSecuencia = num + 1;
        }
      }
    }

    return `${prefijo}${String(siguienteSecuencia).padStart(5, "0")}`;
  },

  async listar(filtros: FiltroFacturasDTO = {}): Promise<Factura[]> {
    const qb = this.createQueryBuilder("factura")
      .leftJoinAndSelect("factura.paciente", "paciente")
      .leftJoinAndSelect("paciente.usuario", "usuario")
      .leftJoinAndSelect("factura.detalles", "detalles")
      .leftJoinAndSelect("detalles.servicio", "servicio")
      .orderBy("factura.fechaEmision", "DESC");

    if (filtros.idPaciente) {
      qb.andWhere("paciente.id_paciente = :idPaciente", { idPaciente: filtros.idPaciente });
    }

    if (filtros.nitCliente) {
      qb.andWhere("factura.nit_cliente ILIKE :nit", { nit: `%${filtros.nitCliente.trim()}%` });
    }

    if (filtros.estado) {
      qb.andWhere("factura.estado = :estado", { estado: filtros.estado.toUpperCase() });
    }

    if (filtros.fechaInicio) {
      qb.andWhere("factura.fecha_emision >= :fechaInicio", { fechaInicio: new Date(filtros.fechaInicio) });
    }

    if (filtros.fechaFin) {
      const fechaFinAjustada = new Date(filtros.fechaFin);
      fechaFinAjustada.setHours(23, 59, 59, 999);
      qb.andWhere("factura.fecha_emision <= :fechaFin", { fechaFin: fechaFinAjustada });
    }

    if (filtros.busqueda) {
      const busq = `%${filtros.busqueda.trim()}%`;
      qb.andWhere(
        "(factura.numero_factura ILIKE :busq OR factura.nit_cliente ILIKE :busq OR factura.razon_social ILIKE :busq OR usuario.nombres ILIKE :busq OR usuario.apellidos ILIKE :busq OR paciente.documento_identidad ILIKE :busq)",
        { busq }
      );
    }

    return qb.getMany();
  },
});

export const DetalleFacturaRepository = AppDataSource.getRepository(DetalleFactura);

