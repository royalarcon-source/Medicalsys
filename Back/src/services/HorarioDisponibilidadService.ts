// src/services/HorarioDisponibilidadService.ts
import { HorarioDisponibilidadRepository } from "../repositories/HorarioDisponibilidadRepository";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";
import {
  ActualizarDisponibilidadDTO,
  BuscarDisponibilidadDTO,
  DisponibilidadResultadoDTO,
  RegistrarDisponibilidadDTO,
} from "../dtos/disponibilidad/DisponibilidadDTO";
import { AppError } from "../utils/AppError";

const NOMBRE_ROL_ADMINISTRADOR = "ADMINISTRADOR";
const NOMBRE_ROL_MEDICO = "MEDICO";
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

interface UsuarioAutenticado {
  idUsuario: number;
  rol: string;
}

function validarDiaSemana(diaSemana: number): void {
  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
    throw new AppError("diaSemana debe ser un número entero entre 1 (lunes) y 7 (domingo)", 400);
  }
}

function validarHoras(horaInicio: string, horaFin: string): void {
  if (!HORA_REGEX.test(horaInicio) || !HORA_REGEX.test(horaFin)) {
    throw new AppError("horaInicio y horaFin deben tener formato HH:MM", 400);
  }
  if (horaInicio >= horaFin) {
    throw new AppError("horaInicio debe ser anterior a horaFin", 400);
  }
}

// Postgres siempre devuelve las columnas "time" como HH:MM:SS; normalizamos acá
// para que el objeto en memoria (lo que se devuelve tras save()) coincida con lo
// persistido, sin necesidad de un re-SELECT tras cada escritura.
function normalizarHora(hora: string): string {
  return hora.length === 5 ? `${hora}:00` : hora;
}

async function resolverIdMedicoPropio(idUsuario: number): Promise<number> {
  const medico = await MedicoRepository.buscarPorUsuario(idUsuario);
  if (!medico) {
    throw new AppError("Tu usuario no tiene un perfil de médico asociado", 404);
  }
  return medico.idMedico;
}

async function resolverIdMedicoObjetivo(
  usuarioActual: UsuarioAutenticado,
  idMedicoSolicitado?: number
): Promise<number> {
  if (usuarioActual.rol === NOMBRE_ROL_ADMINISTRADOR) {
    if (!idMedicoSolicitado) {
      throw new AppError("Como administrador debes indicar idMedico", 400);
    }
    const medico = await MedicoRepository.buscarPorId(idMedicoSolicitado);
    if (!medico) {
      throw new AppError("Médico no encontrado", 404);
    }
    return medico.idMedico;
  }

  if (usuarioActual.rol === NOMBRE_ROL_MEDICO) {
    return resolverIdMedicoPropio(usuarioActual.idUsuario);
  }

  throw new AppError("No tienes permiso para gestionar disponibilidad", 403);
}

async function verificarPropiedad(
  horario: HorarioDisponibilidad,
  usuarioActual: UsuarioAutenticado
): Promise<void> {
  if (usuarioActual.rol === NOMBRE_ROL_ADMINISTRADOR) {
    return;
  }

  if (usuarioActual.rol === NOMBRE_ROL_MEDICO) {
    const idMedicoPropio = await resolverIdMedicoPropio(usuarioActual.idUsuario);
    if (horario.medico.idMedico !== idMedicoPropio) {
      throw new AppError("No tienes permiso para modificar este horario", 403);
    }
    return;
  }

  throw new AppError("No tienes permiso para modificar este horario", 403);
}

export const HorarioDisponibilidadService = {
  async registrar(
    datos: RegistrarDisponibilidadDTO,
    usuarioActual: UsuarioAutenticado
  ): Promise<HorarioDisponibilidad> {
    validarDiaSemana(datos.diaSemana);
    validarHoras(datos.horaInicio, datos.horaFin);
    const horaInicio = normalizarHora(datos.horaInicio);
    const horaFin = normalizarHora(datos.horaFin);

    const idMedico = await resolverIdMedicoObjetivo(usuarioActual, datos.idMedico);

    const solapado = await HorarioDisponibilidadRepository.buscarSolapado(
      idMedico,
      datos.diaSemana,
      horaInicio,
      horaFin
    );
    if (solapado) {
      throw new AppError("Ya existe un horario que se solapa con ese día y rango horario", 409);
    }

    return HorarioDisponibilidadRepository.crear({
      idMedico,
      diaSemana: datos.diaSemana,
      horaInicio,
      horaFin,
    });
  },

  async buscar(
    filtros: BuscarDisponibilidadDTO,
    usuarioActual: UsuarioAutenticado
  ): Promise<DisponibilidadResultadoDTO[]> {
    let idMedico = filtros.idMedico;

    if (!idMedico && !filtros.idEspecialidad && usuarioActual.rol === NOMBRE_ROL_MEDICO) {
      idMedico = await resolverIdMedicoPropio(usuarioActual.idUsuario);
    }

    const horarios = await HorarioDisponibilidadRepository.buscar({
      idMedico,
      idEspecialidad: filtros.idEspecialidad,
      diaSemana: filtros.diaSemana,
    });

    return horarios.map(mapHorarioAResultado);
  },

  async actualizar(
    idHorario: number,
    cambios: ActualizarDisponibilidadDTO,
    usuarioActual: UsuarioAutenticado
  ): Promise<HorarioDisponibilidad> {
    const horario = await HorarioDisponibilidadRepository.buscarPorId(idHorario);
    if (!horario) {
      throw new AppError("Horario no encontrado", 404);
    }

    await verificarPropiedad(horario, usuarioActual);

    const diaSemana = cambios.diaSemana ?? horario.diaSemana;
    const horaInicio = cambios.horaInicio ?? horario.horaInicio;
    const horaFin = cambios.horaFin ?? horario.horaFin;

    if (cambios.diaSemana !== undefined) validarDiaSemana(cambios.diaSemana);
    if (cambios.horaInicio !== undefined || cambios.horaFin !== undefined) {
      validarHoras(horaInicio, horaFin);
    }

    const cambiosNormalizados: ActualizarDisponibilidadDTO = {
      ...cambios,
      horaInicio: cambios.horaInicio !== undefined ? normalizarHora(cambios.horaInicio) : undefined,
      horaFin: cambios.horaFin !== undefined ? normalizarHora(cambios.horaFin) : undefined,
    };

    if (cambios.diaSemana !== undefined || cambios.horaInicio !== undefined || cambios.horaFin !== undefined) {
      const solapado = await HorarioDisponibilidadRepository.buscarSolapado(
        horario.medico.idMedico,
        diaSemana,
        normalizarHora(horaInicio),
        normalizarHora(horaFin),
        idHorario
      );
      if (solapado) {
        throw new AppError("Ya existe un horario que se solapa con ese día y rango horario", 409);
      }
    }

    return HorarioDisponibilidadRepository.actualizar(horario, cambiosNormalizados);
  },

  async desactivar(idHorario: number, usuarioActual: UsuarioAutenticado): Promise<HorarioDisponibilidad> {
    const horario = await HorarioDisponibilidadRepository.buscarPorId(idHorario);
    if (!horario) {
      throw new AppError("Horario no encontrado", 404);
    }

    await verificarPropiedad(horario, usuarioActual);

    return HorarioDisponibilidadRepository.actualizar(horario, { activo: false });
  },
};

function mapHorarioAResultado(horario: HorarioDisponibilidad): DisponibilidadResultadoDTO {
  return {
    idHorario: horario.idHorario,
    idMedico: horario.medico.idMedico,
    medicoNombre: `${horario.medico.usuario?.nombres ?? ""} ${horario.medico.usuario?.apellidos ?? ""}`.trim(),
    numeroColegiatura: horario.medico.numeroColegiatura,
    especialidades: (horario.medico.especialidades ?? []).map((especialidad) => especialidad.nombre),
    diaSemana: horario.diaSemana,
    horaInicio: horario.horaInicio,
    horaFin: horario.horaFin,
    activo: horario.activo,
  };
}
