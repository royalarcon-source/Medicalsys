import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buscarHistoriaPorCI,
  abrirHistoriaManual,
  type HistoriaClinicaDetalleRespuesta,
} from '../../services/historiaClinicaService';

export default function HistoriaClinicaPage() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const ciParam = searchParams.get('ci') || '';

  const [ci, setCi] = useState(ciParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [resultado, setResultado] = useState<HistoriaClinicaDetalleRespuesta | null>(null);
  const [abriendoHistoria, setAbriendoHistoria] = useState(false);

  const esAdminORecep =
    usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const ejecutarBusqueda = async (documento: string) => {
    if (!documento.trim()) return;
    setLoading(true);
    setError(null);
    setMensajeExito(null);
    setResultado(null);

    try {
      const data = await buscarHistoriaPorCI(documento.trim());
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar historia clínica.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ciParam) {
      setCi(ciParam);
      ejecutarBusqueda(ciParam);
    }
  }, [ciParam]);

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault();
    if (!ci.trim()) return;
    setSearchParams({ ci: ci.trim() });
    ejecutarBusqueda(ci.trim());
  };

  const handleAbrirHistoria = async () => {
    if (!resultado?.paciente) return;
    setAbriendoHistoria(true);
    setError(null);
    setMensajeExito(null);

    try {
      await abrirHistoriaManual(resultado.paciente.idPaciente);
      setMensajeExito('Historia clínica abierta exitosamente.');
      await ejecutarBusqueda(resultado.paciente.documentoIdentidad);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la historia clínica.');
    } finally {
      setAbriendoHistoria(false);
    }
  };

  const calcularEdad = (fechaNac?: string) => {
    if (!fechaNac) return '—';
    const d = new Date(fechaNac);
    if (isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const ageDate = new Date(diff);
    return `${Math.abs(ageDate.getUTCFullYear() - 1970)} años`;
  };

  const formatearFecha = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="page historia-clinica-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Historia Clínica del Paciente</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">📋 Cola de Espera</button>
            </Link>
            <Link to="/pacientes" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">Volver a Pacientes</button>
            </Link>
          </div>
        </div>
        <p className="hint">
          Búsqueda de historial clínico completo por Documento de Identidad (CI / DNI).
        </p>

        <form onSubmit={handleBuscar} className="form" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="form-field" style={{ flex: '1', minWidth: '240px', margin: 0 }}>
              <span className="label">Documento de Identidad del Paciente *</span>
              <input
                type="text"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                placeholder="Ingresá CI (ej. 12345678)..."
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar Historia'}
            </button>
          </div>
        </form>

        {error && <p className="error" style={{ marginTop: '12px' }}>{error}</p>}
        {mensajeExito && <p className="success" style={{ marginTop: '12px' }}>{mensajeExito}</p>}
      </div>

      {resultado && (
        <>
          <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-confirmada" style={{ marginBottom: '6px' }}>Ficha del Paciente</span>
                <h3 style={{ margin: '4px 0', color: '#1e293b' }}>
                  {resultado.paciente.usuario
                    ? `${resultado.paciente.usuario.nombres} ${resultado.paciente.usuario.apellidos}`
                    : `Paciente #${resultado.paciente.idPaciente}`}
                </h3>
                <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px' }}>
                  <span><strong>CI:</strong> {resultado.paciente.documentoIdentidad}</span>
                  <span><strong>Edad:</strong> {calcularEdad(resultado.paciente.fechaNacimiento)}</span>
                  <span><strong>Sexo:</strong> {resultado.paciente.sexo || '—'}</span>
                  <span><strong>Teléfono:</strong> {resultado.paciente.usuario?.telefono || '—'}</span>
                  <span><strong>Email:</strong> {resultado.paciente.usuario?.email || '—'}</span>
                </div>
              </div>

              {resultado.historia ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Historia Clínica #</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>
                    HC-{resultado.historia.idHistoria}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Apertura: {new Date(resultado.historia.fechaApertura).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="badge badge-cancelada">Sin Historia Clínica Abierta</span>
                  {esAdminORecep && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleAbrirHistoria}
                        disabled={abriendoHistoria}
                      >
                        {abriendoHistoria ? 'Abriendo...' : '+ Abrir Historia Clínica'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {resultado.historia && (
            <div className="card">
              <h3>Historial de Atenciones y Consultas Médicas ({resultado.consultas.length})</h3>

              {resultado.consultas.length === 0 ? (
                <p className="empty-state" style={{ marginTop: '12px' }}>
                  No se registran atenciones clínicas previas para este paciente.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
                  {resultado.consultas.map((c) => {
                    const medicoNombre = c.medico?.usuario
                      ? `Dr(a). ${c.medico.usuario.nombres} ${c.medico.usuario.apellidos}`
                      : `Médico #${c.medico?.idMedico}`;
                    const specs = c.medico?.especialidades?.map((e) => e.nombre).join(', ');

                    return (
                      <div
                        key={c.idConsulta}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '16px',
                          background: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>
                              Consulta #{c.idConsulta} — {formatearFecha(c.fechaConsulta)}
                            </span>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              Atendido por: <strong>{medicoNombre}</strong> {specs ? `(${specs})` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {c.consultorio && (
                              <span className="badge badge-confirmada">🏥 {c.consultorio.nombre}</span>
                            )}
                            <span className={c.estadoConsulta === 'ATENDIDA' ? 'badge badge-atendida' : 'badge badge-pendiente'}>
                              {c.estadoConsulta}
                            </span>
                            <Link to={`/consultas/${c.idConsulta}/atender`} style={{ textDecoration: 'none' }}>
                              <button type="button" className="button-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                                Ver detalle
                              </button>
                            </Link>
                          </div>
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <strong>Motivo de consulta:</strong> {c.motivo || '—'}
                          </div>

                          {c.anamnesis && (
                            <div>
                              <strong>Anamnesis / Evolución:</strong>
                              <p style={{ margin: '4px 0 0 0', color: '#334155', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                {c.anamnesis}
                              </p>
                            </div>
                          )}

                          {c.examenFisico && (
                            <div>
                              <strong>Examen Físico:</strong>
                              <p style={{ margin: '4px 0 0 0', color: '#334155', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                {c.examenFisico}
                              </p>
                            </div>
                          )}

                          {c.diagnosticos && c.diagnosticos.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              <strong>Diagnósticos:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                {c.diagnosticos.map((dx, idx) => (
                                  <span
                                    key={dx.idDiagnostico || idx}
                                    style={{
                                      background: '#ecfdf5',
                                      color: '#065f46',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      fontSize: '13px',
                                    }}
                                  >
                                    {dx.codigo ? `[${dx.codigo}] ` : ''}{dx.descripcion} ({dx.tipo || 'DEFINITIVO'})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {c.tratamientos && c.tratamientos.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              <strong>Tratamientos / Indicaciones:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {c.tratamientos.map((tto, idx) => (
                                  <li key={tto.idTratamiento || idx} style={{ color: '#1e293b' }}>
                                    <strong>{tto.descripcion}</strong>
                                    {tto.indicaciones ? ` — ${tto.indicaciones}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {c.observaciones && (
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              <strong>Observaciones adicionales:</strong> {c.observaciones}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
