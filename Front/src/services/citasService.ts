const API_URL = "http://localhost:3000/api/citas";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const citasService = {
  async listarCitas() {
    const res = await fetch(API_URL, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener las citas.");
    return await res.json();
  },

  async reservarCita(datos: {
    id_medico: string;
    id_paciente?: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    motivo?: string;
  }) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al reservar.");
    return data;
  },

  async reprogramarCita(id_cita: string, datos: { fecha_hora_inicio: string; fecha_hora_fin: string }) {
    const res = await fetch(`${API_URL}/${id_cita}/reprogramar`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al reprogramar.");
    return data;
  },

  async cancelarCita(id_cita: string) {
    const res = await fetch(`${API_URL}/${id_cita}/cancelar`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cancelar.");
    return data;
  },
};
