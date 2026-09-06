import { HistoriaClinicaRepository } from "../repositories/HistoriaClinicaRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { ConsultaRepository } from "../repositories/ConsultaRepository";
import { HistoriaClinica } from "../entities/HistoriaClinica.entity";
import { Consulta } from "../entities/Consulta.entity";
import { Paciente } from "../entities/Paciente.entity";
import { AppError } from "../utils/AppError";

export interface HistoriaClinicaDetalleDTO {
  historia: HistoriaClinica | null;
  paciente: Paciente;
  consultas: Consulta[];
}

export class HistoriaClinicaService {
  async buscarPorCI(ci: string): Promise<HistoriaClinicaDetalleDTO> {
    if (!ci || !ci.trim()) {
      throw new AppError("Debe ingresar un documento de identidad para buscar.", 400);
    }

    const paciente = await PacienteRepository.buscarPorCI(ci.trim());
    if (!paciente) {
      throw new AppError("No se encontró ningún paciente con el documento indicado.", 404);
    }

    const historia = await HistoriaClinicaRepository.buscarPorPaciente(paciente.idPaciente);
    if (!historia) {
      return {
        historia: null,
        paciente,
        consultas: [],
      };
    }

    const consultas = await ConsultaRepository.buscarPorHistoria(historia.idHistoria);

    return {
      historia,
      paciente,
      consultas,
    };
  }

  async abrirManual(
    idPaciente: number,
    observaciones?: string
  ): Promise<HistoriaClinica> {
    if (!idPaciente) {
      throw new AppError("El ID del paciente es requerido.", 400);
    }

    const paciente = await PacienteRepository.buscarPorId(idPaciente);
    if (!paciente) {
      throw new AppError("El paciente indicado no existe.", 404);
    }

    const existente = await HistoriaClinicaRepository.buscarPorPaciente(idPaciente);
    if (existente) {
      throw new AppError("El paciente ya cuenta con una historia clínica abierta.", 409);
    }

    return HistoriaClinicaRepository.crearParaPaciente(
      idPaciente,
      observaciones || "Apertura manual de historia clínica"
    );
  }
}
