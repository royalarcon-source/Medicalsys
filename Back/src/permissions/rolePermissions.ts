export const Permisos = {
  // ... permisos existentes
  CITAS_RESERVAR: "CITAS_RESERVAR",
  CITAS_CONSULTAR: "CITAS_CONSULTAR",
  CITAS_GESTIONAR: "CITAS_GESTIONAR", // Para reprogramar y cancelar
} as const;

export const RolePermissions: Record<string, string[]> = {
  ADMINISTRADOR: [
    Permisos.CITAS_RESERVAR,
    Permisos.CITAS_CONSULTAR,
    Permisos.CITAS_GESTIONAR,
  ],
  RECEPCIONISTA: [
    Permisos.CITAS_RESERVAR,
    Permisos.CITAS_CONSULTAR,
    Permisos.CITAS_GESTIONAR,
  ],
  MEDICO: [
    Permisos.CITAS_CONSULTAR,
    Permisos.CITAS_GESTIONAR,
  ],
  PACIENTE: [
    Permisos.CITAS_RESERVAR,
    Permisos.CITAS_CONSULTAR,
    Permisos.CITAS_GESTIONAR, // Restringido a sus propias citas a nivel servicio
  ],
};
