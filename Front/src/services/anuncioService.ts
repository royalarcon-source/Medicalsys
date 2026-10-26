export type EstadoAnuncio = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';

export interface AnuncioItem {
  idAnuncio: number;
  titulo: string;
  contenido: string;
  fechaPublicacion: string | null;
  fechaExpiracion: string | null;
  estado: EstadoAnuncio;
}

export interface FiltrosAnuncios {
  estado?: string;
  todos?: boolean;
}

export interface CrearAnuncioPayload {
  titulo: string;
  contenido: string;
  fechaExpiracion?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data?.message || data?.error || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export async function listarAnuncios(filtros: FiltrosAnuncios = {}): Promise<AnuncioItem[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.todos) params.set('todos', 'true');

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/anuncios${queryStr}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.anuncios;
}

export async function crearAnuncio(payload: CrearAnuncioPayload): Promise<{ mensaje: string; anuncio: AnuncioItem }> {
  const res = await fetch('/api/anuncios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function cambiarEstadoAnuncio(id: number, estado: EstadoAnuncio): Promise<{ mensaje: string; anuncio: AnuncioItem }> {
  const res = await fetch(`/api/anuncios/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
