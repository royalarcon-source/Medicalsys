import { AppError } from "../../utils/AppError";

export interface RegistrarDiagnosticoDTO {
  idConsulta: number;
  codigo?: string;
  descripcion: string;
  tipo?: string;
}

export function validarDiagnosticoDTO(dto: Partial<RegistrarDiagnosticoDTO>): RegistrarDiagnosticoDTO {
  if (!dto || typeof dto !== "object") {
    throw new AppError("El cuerpo del diagnóstico es obligatorio.", 400);
  }

  const idConsulta = Number(dto.idConsulta);
  if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
    throw new AppError("El idConsulta es obligatorio y debe ser un identificador válido.", 400);
  }

  const descripcion = typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
  if (!descripcion) {
    throw new AppError("La descripción del diagnóstico es obligatoria.", 400);
  }

  const codigo = typeof dto.codigo === "string" ? dto.codigo.trim() : undefined;
  const tipo = typeof dto.tipo === "string" ? dto.tipo.trim() : undefined;

  return {
    idConsulta,
    codigo: codigo || undefined,
    descripcion,
    tipo: tipo || undefined,
  };
}
