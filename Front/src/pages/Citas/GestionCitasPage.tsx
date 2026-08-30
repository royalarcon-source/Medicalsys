import React, { useEffect, useState } from "react";
import { citasService } from "../../services/citasService";

export const GestionCitasPage: React.FC = () => {
  const [citas, setCitas] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const cargarCitas = async () => {
    try {
      const data = await citasService.listarCitas();
      setCitas(data.citas || []);
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const handleCancelar = async (id_cita: string) => {
    if (!confirm("¿Está seguro de cancelar esta cita médica?")) return;
    try {
      await citasService.cancelarCita(id_cita);
      setMensaje({ tipo: "exito", texto: "Cita cancelada correctamente." });
      cargarCitas();
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Citas Médicas</h1>
        <a
          href="/citas/reservar"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow"
        >
          + Nueva Reserva (HU-15)
        </a>
      </div>

      {mensaje && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm ${
            mensaje.tipo === "exito" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-600 text-sm">
              <th className="p-3">ID</th>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Motivo</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones (HU-16)</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id_cita} className="border-b hover:bg-slate-50 text-sm">
                <td className="p-3 font-semibold">#{cita.id_cita}</td>
                <td className="p-3">
                  {new Date(cita.fecha_hora_inic).toLocaleString()}
                </td>
                <td className="p-3">{cita.motivo}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      cita.estado === "PROGRAMADA"
                        ? "bg-blue-100 text-blue-800"
                        : cita.estado === "CANCELADA"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {cita.estado}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {cita.estado === "PROGRAMADA" && (
                    <button
                      onClick={() => handleCancelar(cita.id_cita)}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 text-xs font-medium"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {citas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-6 text-slate-400">
                  No hay citas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
