const API_URL = "http://127.0.0.1:3000/api";

export interface Consentimiento {
  idConsentimiento: number;
  idPaciente: number;
  idConsulta?: number | null;
  idDocumento?: number | null;
  tipo: string;
  version: string;
  estado: "PENDIENTE" | "FIRMADO" | "RECHAZADO";
  firmadoPor?: string | null;
  fechaEmision: string;
  fechaFirma?: string | null;
}

export const consentimientoService = {
  // HU-26: Emitir consentimiento
  async emitirConsentimiento(
    token: string,
    datos: { idPaciente: number; tipo: string; version: string; idConsulta?: number }
  ): Promise<{ mensaje: string; consentimiento: Consentimiento }> {
    const res = await fetch(`${API_URL}/consentimientos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || "Error al emitir consentimiento");
    }
    return data;
  },

  // HU-27: Firmar consentimiento
  async firmarConsentimiento(
    token: string,
    idConsentimiento: number,
    firmadoPor: string
  ): Promise<{ mensaje: string; consentimiento: Consentimiento }> {
    const res = await fetch(`${API_URL}/consentimientos/${idConsentimiento}/firmar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ firmadoPor }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || "Error al firmar consentimiento");
    }
    return data;
  },

  // Obtener por paciente
  async obtenerPorPaciente(token: string, idPaciente: number): Promise<Consentimiento[]> {
    const res = await fetch(`${API_URL}/consentimientos/paciente/${idPaciente}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || "Error al obtener consentimientos");
    }
    return data;
  },
};
