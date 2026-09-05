import React, { useState, useEffect } from "react";
import { consentimientoService, Consentimiento } from "../services/consentimientoService";

export const ConsentimientosPage: React.FC = () => {
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [idPaciente, setIdPaciente] = useState<number>(2);
  const [tipo, setTipo] = useState("CONSENTIMIENTO_CIRUGIA_MENOR");
  const [version, setVersion] = useState("1.0");
  const [nombreFirma, setNombreFirma] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token") || "";

  const cargarConsentimientos = async () => {
    if (!token) return;
    try {
      setCargando(true);
      setError(null);
      const datos = await consentimientoService.obtenerPorPaciente(token, idPaciente);
      setConsentimientos(Array.isArray(datos) ? datos : []);
    } catch (err: any) {
      setError(err.message || "Error al cargar consentimientos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConsentimientos();
  }, [idPaciente]);

  // HU-26: Emisión
  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("No hay sesión activa.");
      return;
    }
    try {
      setCargando(true);
      setError(null);
      await consentimientoService.emitirConsentimiento(token, {
        idPaciente: Number(idPaciente),
        tipo,
        version,
      });
      setMensaje("Consentimiento emitido con éxito.");
      await cargarConsentimientos();
    } catch (err: any) {
      setError(err.message || "Error al emitir.");
    } finally {
      setCargando(false);
    }
  };

  // HU-27: Firma
  const handleFirmar = async (idConsentimiento: number) => {
    if (!nombreFirma.trim()) {
      setError("Escriba su nombre completo para firmar.");
      return;
    }
    try {
      setCargando(true);
      setError(null);
      await consentimientoService.firmarConsentimiento(token, idConsentimiento, nombreFirma);
      setMensaje("Consentimiento firmado correctamente.");
      setNombreFirma("");
      await cargarConsentimientos();
    } catch (err: any) {
      setError(err.message || "Error al firmar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Gestión de Consentimientos Informados (HU-26 / HU-27)
      </h1>

      {mensaje && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* HU-26: Emisión por Médico */}
      <div className="bg-white shadow rounded-lg p-5 mb-6 border border-gray-200">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          [HU-26] Emitir Nuevo Consentimiento
        </h2>
        <form onSubmit={handleEmitir} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ID Paciente</label>
            <input
              type="number"
              min="1"
              value={idPaciente}
              onChange={(e) => setIdPaciente(Number(e.target.value))}
              className="w-full border rounded px-3 py-1.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Procedimiento</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            >
              <option value="CONSENTIMIENTO_CIRUGIA_MENOR">Cirugía Menor</option>
              <option value="CONSENTIMIENTO_TRATAMIENTO_INVASIVO">Tratamiento Invasivo</option>
              <option value="CONSENTIMIENTO_GENERAL">Procedimiento General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Versión</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
              required
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded text-sm disabled:opacity-50"
            >
              {cargando ? "Guardando..." : "Emitir Consentimiento"}
            </button>
          </div>
        </form>
      </div>

      {/* HU-27: Firma por Paciente */}
      <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h2 className="text-base font-semibold text-gray-800">
            [HU-27] Consentimientos del Paciente #{idPaciente}
          </h2>
          <input
            type="text"
            placeholder="Nombre para firmar..."
            value={nombreFirma}
            onChange={(e) => setNombreFirma(e.target.value)}
            className="border rounded px-3 py-1 text-sm w-full md:w-64"
          />
        </div>

        {cargando ? (
          <p className="text-gray-500 text-sm py-3">Cargando...</p>
        ) : consentimientos.length === 0 ? (
          <p className="text-gray-500 text-sm py-3">No hay consentimientos para este paciente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Tipo</th>
                  <th className="p-2.5">Versión</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5">Fecha Emisión</th>
                  <th className="p-2.5">Firmado Por</th>
                  <th className="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {consentimientos.map((c) => (
                  <tr key={c.idConsentimiento} className="border-b hover:bg-gray-50">
                    <td className="p-2.5 font-medium">#{c.idConsentimiento}</td>
                    <td className="p-2.5">{c.tipo}</td>
                    <td className="p-2.5">{c.version}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          c.estado === "FIRMADO"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td className="p-2.5">{new Date(c.fechaEmision).toLocaleDateString()}</td>
                    <td className="p-2.5">{c.firmadoPor || "—"}</td>
                    <td className="p-2.5 text-center">
                      {c.estado === "PENDIENTE" ? (
                        <button
                          onClick={() => handleFirmar(c.idConsentimiento)}
                          disabled={cargando}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                        >
                          Firmar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Firmado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentimientosPage;
