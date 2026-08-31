import { ConsultorioRepository } from "../repositories/ConsultorioRepository";
import { CitaRepository } from "../repositories/CitaRepository";
import { AppDataSource } from "../config/database";
import { Cita } from "../entities/Cita.entity";
import { Consultorio } from "../entities/Consultorio.entity";
import { AppError } from "../utils/AppError";

export class ConsultorioService {
  async listarTodos(): Promise<Consultorio[]> {
    return ConsultorioRepository.listar();
  }

  async listarDisponibles(fecha: string, horaInicio: string, horaFin: string, excludeCitaId?: number): Promise<Array<Consultorio & { disponible: boolean }>> {
    if (!fecha || !horaInicio || !horaFin) {
      const todos = await ConsultorioRepository.listar();
      return todos.map((c) => ({ ...c, disponible: true }));
    }

    const inicio = new Date(`${fecha}T${horaInicio}:00`);
    const fin = new Date(`${fecha}T${horaFin}:00`);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      throw new AppError("Rango horario inválido para consulta de consultorios.", 400);
    }

    const todos = await ConsultorioRepository.listar();
    const resultados = await Promise.all(
      todos.map(async (c) => {
        const solapado = await ConsultorioRepository.buscarSolapamiento(
          c.idConsultorio,
          inicio,
          fin,
          excludeCitaId
        );
        return {
          ...c,
          disponible: !solapado,
        };
      })
    );

    return resultados;
  }

  async asignarACita(
    idCita: number,
    idConsultorio: number,
    _usuarioActual: { idUsuario: number; rol: string }
  ): Promise<Cita> {
    const cita = await CitaRepository.buscarPorId(idCita);
    if (!cita) {
      throw new AppError("La cita especificada no existe.", 404);
    }

    if (cita.estado === "CANCELADA") {
      throw new AppError("No se puede asignar consultorio a una cita cancelada.", 400);
    }

    if (new Date(cita.fechaHoraInicio).getTime() <= Date.now()) {
      throw new AppError("No se puede modificar la asignación de un consultorio para una cita que ya inició o está en el pasado.", 400);
    }

    const consultorio = await ConsultorioRepository.buscarPorId(idConsultorio);
    if (!consultorio) {
      throw new AppError("El consultorio especificado no existe o no está activo.", 404);
    }

    const consultorioOcupado = await ConsultorioRepository.buscarSolapamiento(
      idConsultorio,
      cita.fechaHoraInicio,
      cita.fechaHoraFin,
      cita.idCita
    );
    if (consultorioOcupado) {
      throw new AppError(
        "El consultorio ya cuenta con una asignación activa en el horario seleccionado.",
        409
      );
    }

    const solapamientoMedicoOtroConsultorio = await AppDataSource.getRepository(Cita)
      .createQueryBuilder("c")
      .where("c.id_medico = :idMedico", { idMedico: cita.medico.idMedico })
      .andWhere("c.id_cita != :idCita", { idCita: cita.idCita })
      .andWhere("c.estado != :cancelado", { cancelado: "CANCELADA" })
      .andWhere("c.id_consultorio IS NOT NULL")
      .andWhere("c.fecha_hora_inicio < :fin AND c.fecha_hora_fin > :inicio", {
        inicio: cita.fechaHoraInicio,
        fin: cita.fechaHoraFin,
      })
      .getOne();

    if (solapamientoMedicoOtroConsultorio) {
      throw new AppError(
        "El médico ya tiene asignado otro consultorio en ese mismo bloque horario.",
        409
      );
    }

    cita.consultorio = consultorio;
    await AppDataSource.getRepository(Cita).save(cita);

    return CitaRepository.buscarPorId(idCita) as Promise<Cita>;
  }

  async liberarDeCita(
    idCita: number,
    _usuarioActual: { idUsuario: number; rol: string }
  ): Promise<Cita> {
    const cita = await CitaRepository.buscarPorId(idCita);
    if (!cita) {
      throw new AppError("La cita especificada no existe.", 404);
    }

    if (new Date(cita.fechaHoraInicio).getTime() <= Date.now()) {
      throw new AppError("No se puede liberar el consultorio de una cita que ya inició o está en el pasado.", 400);
    }

    cita.consultorio = null;
    await AppDataSource.getRepository(Cita).save(cita);

    return CitaRepository.buscarPorId(idCita) as Promise<Cita>;
  }
}
