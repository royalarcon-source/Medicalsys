import { AppError } from "../../utils/AppError";

export interface RegistrarTratamientoDTO {
  idConsulta: number;
  descripcion: string;
  indicaciones?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

function esFechaValida(fecha: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) {
    return false;
  }

  const parsed = new Date(`${fecha}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

export function validarTratamientoDTO(dto: Partial<RegistrarTratamientoDTO>): RegistrarTratamientoDTO {
  if (!dto || typeof dto !== "object") {
    throw new AppError("El cuerpo del tratamiento es obligatorio.", 400);
  }

  const idConsulta = Number(dto.idConsulta);
  if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
    throw new AppError("El idConsulta es obligatorio y debe ser un identificador válido.", 400);
  }

  const descripcion = typeof dto.descripcion === "string" ? dto.descripcion.trim() : "";
  if (!descripcion) {
    throw new AppError("La descripción del tratamiento es obligatoria.", 400);
  }

  const indicaciones = typeof dto.indicaciones === "string" ? dto.indicaciones.trim() : undefined;
  const fechaInicio = typeof dto.fechaInicio === "string" ? dto.fechaInicio.trim() : undefined;
  const fechaFin = typeof dto.fechaFin === "string" ? dto.fechaFin.trim() : undefined;

  if (fechaInicio && !esFechaValida(fechaInicio)) {
    throw new AppError("La fechaInicio debe tener formato YYYY-MM-DD.", 400);
  }

  if (fechaFin && !esFechaValida(fechaFin)) {
    throw new AppError("La fechaFin debe tener formato YYYY-MM-DD.", 400);
  }

  if (fechaInicio && fechaFin) {
    const inicio = new Date(`${fechaInicio}T00:00:00.000Z`).getTime();
    const fin = new Date(`${fechaFin}T00:00:00.000Z`).getTime();
    if (inicio > fin) {
      throw new AppError("La fechaFin debe ser mayor o igual que la fechaInicio.", 400);
    }
  }

  return {
    idConsulta,
    descripcion,
    indicaciones: indicaciones || undefined,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  };
}
