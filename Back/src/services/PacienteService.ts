// src/services/PacienteService.ts
import { PacienteRepository } from "../repositories/PacienteRepository";
import { Paciente } from "../entities/Paciente.entity";
import { Usuario } from "../entities/Usuario.entity";
import {
  BuscarPacienteDTO,
  BuscarPacientesResponseDTO,
  PacienteResultadoDTO,
} from "../dtos/paciente/BuscarPacienteDTO";
import { DetallePacienteDTO } from "../dtos/paciente/DetallePacienteDTO";
import { AppError } from "../utils/AppError";

const NOMBRE_ROL_PACIENTE = "PACIENTE";

function normalizarCriterio(valor?: string): string | undefined {
  if (valor === undefined) {
    return undefined;
  }

  const normalizado = valor.trim();
  return normalizado.length > 0 ? normalizado : undefined;
}

export const PacienteService = {
  async buscarPacientes(criterios: BuscarPacienteDTO): Promise<BuscarPacientesResponseDTO> {
    return this.buscar(criterios);
  },

  async buscar(criterios: BuscarPacienteDTO): Promise<BuscarPacientesResponseDTO> {
    const ci = normalizarCriterio(criterios.ci);
    const nombre = normalizarCriterio(criterios.nombre);
    const apellido = normalizarCriterio(criterios.apellido);
    const page = Math.max(1, Number(criterios.page ?? 1));
    const limit = Math.max(1, Number(criterios.limit ?? 10));

    if (!ci && !nombre && !apellido) {
      throw new AppError(
        "Debe proporcionar al menos un criterio de búsqueda: CI, nombre o apellido",
        400
      );
    }

    if (ci) {
      const paciente = await PacienteRepository.buscarPorCi(ci);
      if (!paciente) {
        return {
          resultados: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          message: "No se encontraron pacientes.",
        };
      }

      return {
        resultados: [mapPacienteAResultado(paciente)],
        total: 1,
        page,
        limit,
        totalPages: 1,
        message: undefined,
      };
    }

    let resultados: Paciente[] = [];
    let total = 0;

    if (nombre) {
      const response = await PacienteRepository.buscarPorNombre(nombre, page, limit);
      resultados = response.pacientes;
      total = response.total;
    } else if (apellido) {
      const response = await PacienteRepository.buscarPorApellido(apellido, page, limit);
      resultados = response.pacientes;
      total = response.total;
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      resultados: resultados.map((paciente) => mapPacienteAResultado(paciente)),
      total,
      page,
      limit,
      totalPages,
      message: total === 0 ? "No se encontraron pacientes." : undefined,
    };
  },

  async consultarPorId(
    idPaciente: number,
    usuarioActual: Usuario
  ): Promise<DetallePacienteDTO> {
    return this.obtenerDetalle(idPaciente, usuarioActual);
  },

  async obtenerDetalle(
    idPaciente: number,
    usuarioActual: Usuario
  ): Promise<DetallePacienteDTO> {
    if (usuarioActual.rol?.nombre === NOMBRE_ROL_PACIENTE) {
      const pacienteDelUsuario = await PacienteRepository.buscarPorUsuario(
        usuarioActual.idUsuario
      );

      if (!pacienteDelUsuario || pacienteDelUsuario.idPaciente !== idPaciente) {
        throw new AppError(
          "No tienes permiso para acceder a la información de este paciente",
          403
        );
      }
    }

    const paciente = await PacienteRepository.buscarPorId(idPaciente);
    if (!paciente) {
      throw new AppError("Paciente no encontrado", 404);
    }

    return mapPacienteADetalle(paciente);
  },
};

function mapPacienteAResultado(paciente: Paciente): PacienteResultadoDTO {
  return {
    idPaciente: paciente.idPaciente,
    documentoIdentidad: paciente.documentoIdentidad,
    nombres: paciente.usuario?.nombres || "",
    apellidos: paciente.usuario?.apellidos || "",
    fechaNacimiento: paciente.fechaNacimiento,
    sexo: paciente.sexo,
  };
}

function mapPacienteADetalle(paciente: Paciente): DetallePacienteDTO {
  return {
    idPaciente: paciente.idPaciente,
    documentoIdentidad: paciente.documentoIdentidad,
    nombres: paciente.usuario?.nombres || "",
    apellidos: paciente.usuario?.apellidos || "",
    fechaNacimiento: paciente.fechaNacimiento,
    sexo: paciente.sexo,
    telefono: paciente.usuario?.telefono || null,
    email: paciente.usuario?.email || "",
    direccion: paciente.direccion,
    contactoEmergencia: paciente.contactoEmergencia,
    telefonoEmergencia: paciente.telefonoEmergencia,
    fechaRegistro: paciente.fechaRegistro,
  };
}
