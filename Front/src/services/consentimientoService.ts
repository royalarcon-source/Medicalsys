export interface Consentimiento {
  idConsentimiento: number;
  paciente?: {
    idPaciente: number;
    documentoIdentidad?: string;
    usuario?: {
      nombres: string;
      apellidos: string;
    };
  };
  idPaciente?: number;
  idConsulta?: number | null;
  idDocumento?: number | null;
  tipo: string;
  version: string;
  estado: 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'REVOCADO';
  firmadoPor?: string | null;
  fechaEmision: string;
  fechaFirma?: string | null;
}

export const TIPOS_CONSENTIMIENTO = [
  { value: 'CONSENTIMIENTO_CIRUGIA_MENOR', label: 'Consentimiento para Cirugía Menor' },
  { value: 'CONSENTIMIENTO_PROCEDIMIENTO_INVASIVO', label: 'Consentimiento para Procedimiento Invasivo' },
  { value: 'CONSENTIMIENTO_TRATAMIENTO_ESPECIAL', label: 'Consentimiento para Tratamiento Especial' },
  { value: 'CONSENTIMIENTO_TELEMEDICINA', label: 'Consentimiento para Atención por Telemedicina' },
  { value: 'CONSENTIMIENTO_INFORMADO_GENERAL', label: 'Consentimiento Informado General' },
] as const;

function getAuthHeaders(tokenParam?: string): Record<string, string> {
  const token = tokenParam || window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const consentimientoService = {
  // HU-26: Emitir consentimiento
  async emitirConsentimiento(
    token: string,
    datos: { idPaciente: number; tipo: string; version: string; idConsulta?: number }
  ): Promise<{ mensaje: string; consentimiento: Consentimiento }> {
    const res = await fetch('/api/consentimientos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token),
      },
      body: JSON.stringify(datos),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || 'Error al emitir consentimiento');
    }
    return data;
  },

  // HU-27: Firmar consentimiento
  async firmarConsentimiento(
    token: string,
    idConsentimiento: number,
    firmadoPor: string
  ): Promise<{ mensaje: string; consentimiento: Consentimiento }> {
    const res = await fetch(`/api/consentimientos/${idConsentimiento}/firmar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token),
      },
      body: JSON.stringify({ firmadoPor }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || 'Error al firmar consentimiento');
    }
    return data;
  },

  // Obtener por paciente
  async obtenerPorPaciente(token: string, idPaciente: number): Promise<Consentimiento[]> {
    const res = await fetch(`/api/consentimientos/paciente/${idPaciente}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.mensaje || 'Error al obtener consentimientos');
    }
    return Array.isArray(data) ? data : [];
  },
};
