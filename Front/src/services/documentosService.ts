export interface DocumentoItem {
  idDocumento: number;
  idConsulta: number | null;
  idPaciente: number;
  tipo: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  storageKey: string;
  fechaSubida: string;
  activo: boolean;
  url: string;
}

export const TIPOS_DOCUMENTO = [
  { value: 'LABORATORIO', label: 'Análisis / Laboratorio' },
  { value: 'RAYOS_X', label: 'Rayos X / Radiografía' },
  { value: 'ECOGRAFIA', label: 'Ecografía / Ultrasonido' },
  { value: 'TOMOGRAFIA', label: 'Tomografía / Resonancia' },
  { value: 'INFORME_MEDICO', label: 'Informe / Epicrisis' },
  { value: 'RECETA_ORDEN', label: 'Receta / Orden Médica' },
  { value: 'CONSENTIMIENTO', label: 'Consentimiento Informado' },
  { value: 'OTRO', label: 'Otro Documento' },
] as const;

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * HU-24: Subir documento médico adjunto a una consulta
 */
export async function subirDocumento(
  idConsulta: number,
  tipo: string,
  archivo: File
): Promise<{ mensaje: string; documento: DocumentoItem }> {
  const formData = new FormData();
  formData.append('idConsulta', String(idConsulta));
  formData.append('tipo', tipo);
  formData.append('archivo', archivo);

  const response = await fetch('/api/documentos', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || data?.mensaje || 'Error al subir el documento');
  }

  return data;
}

/**
 * HU-25: Consultar documentos médicos (por consulta o globales)
 */
export async function listarDocumentos(
  idConsulta?: number
): Promise<{ documentos: DocumentoItem[] }> {
  const query = idConsulta ? `?idConsulta=${idConsulta}` : '';
  const response = await fetch(`/api/documentos${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || data?.mensaje || 'Error al listar los documentos');
  }

  return data;
}
