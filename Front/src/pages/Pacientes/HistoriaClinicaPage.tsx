import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buscarHistoriaPorCI,
  abrirHistoriaManual,
  type HistoriaClinicaDetalleRespuesta,
} from '../../services/historiaClinicaService';
import {
  listarDocumentos,
  type DocumentoItem,
} from '../../services/documentosService';
import ModalVisorDocumento from '../../components/ModalVisorDocumento';
import {
  FileText,
  ClipboardList,
  Search,
  Building2,
  Plus,
  User,
  Activity,
  CheckCircle2,
  Clock,
  Paperclip,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

export default function HistoriaClinicaPage() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const ciParam = searchParams.get('ci') || '';

  const [ci, setCi] = useState(ciParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [resultado, setResultado] = useState<HistoriaClinicaDetalleRespuesta | null>(null);
  const [documentosPorConsulta, setDocumentosPorConsulta] = useState<Record<number, DocumentoItem[]>>({});
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoItem | null>(null);
  const [abriendoHistoria, setAbriendoHistoria] = useState(false);

  const esAdminORecep =
    usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const ejecutarBusqueda = async (documento: string) => {
    if (!documento.trim()) return;
    setLoading(true);
    setError(null);
    setMensajeExito(null);
    setResultado(null);
    setDocumentosPorConsulta({});

    try {
      const data = await buscarHistoriaPorCI(documento.trim());
      setResultado(data);

      if (data?.consultas && data.consultas.length > 0) {
        try {
          const resDocs = await listarDocumentos();
          const agrupados: Record<number, DocumentoItem[]> = {};
          resDocs.documentos.forEach((d) => {
            if (d.idConsulta) {
              if (!agrupados[d.idConsulta]) agrupados[d.idConsulta] = [];
              agrupados[d.idConsulta].push(d);
            }
          });
          setDocumentosPorConsulta(agrupados);
        } catch (docErr) {
          console.error('Error al cargar documentos adjuntos:', docErr);
        }
      }
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
        <div className="page-header">
          <div>
            <h2>
              <FileText size={22} className="text-primary" />
              <span>Historia Clínica del Paciente (HU-19)</span>
            </h2>
            <p className="page-header-subtitle">
              Búsqueda de historial clínico completo por Documento de Identidad (CI / DNI).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">
                <ClipboardList size={16} />
                <span>Cola de Espera</span>
              </button>
            </Link>
            <Link to="/pacientes" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">Volver a Pacientes</button>
            </Link>
          </div>
        </div>

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
              <Search size={16} />
              <span>{loading ? 'Buscando...' : 'Buscar Historia'}</span>
            </button>
          </div>
        </form>

        {error && <div className="alert-error" style={{ marginTop: '12px' }}>{error}</div>}
        {mensajeExito && <div className="alert-success" style={{ marginTop: '12px' }}>{mensajeExito}</div>}
      </div>

      {resultado && (
        <>
          <div className="card" style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-confirmada" style={{ marginBottom: '6px' }}>
                  <User size={12} />
                  <span>Ficha del Paciente</span>
                </span>
                <h3 style={{ margin: '4px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                  {resultado.paciente.usuario
                    ? `${resultado.paciente.usuario.nombres} ${resultado.paciente.usuario.apellidos}`
                    : `Paciente #${resultado.paciente.idPaciente}`}
                </h3>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px' }}>
                  <span><strong>CI:</strong> {resultado.paciente.documentoIdentidad}</span>
                  <span><strong>Edad:</strong> {calcularEdad(resultado.paciente.fechaNacimiento)}</span>
                  <span><strong>Sexo:</strong> {resultado.paciente.sexo || '—'}</span>
                  <span><strong>Teléfono:</strong> {resultado.paciente.usuario?.telefono || '—'}</span>
                  <span><strong>Email:</strong> {resultado.paciente.usuario?.email || '—'}</span>
                </div>
              </div>

              {resultado.historia ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Historia Clínica #</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                    HC-{resultado.historia.idHistoria}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
                        <Plus size={15} />
                        <span>{abriendoHistoria ? 'Abriendo...' : 'Abrir Historia Clínica'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {resultado.historia && (
            <div className="card">
              <h3>
                <Activity size={18} />
                <span>Historial de Atenciones y Consultas Médicas ({resultado.consultas.length})</span>
              </h3>

              {resultado.consultas.length === 0 ? (
                <div className="empty-state">
                  <Clock size={32} className="empty-state-icon" />
                  <p>No se registran atenciones clínicas previas para este paciente.</p>
                </div>
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
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '18px',
                          background: 'var(--bg-surface)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>
                              Consulta #{c.idConsulta} — {formatearFecha(c.fechaConsulta)}
                            </span>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              Atendido por: <strong>{medicoNombre}</strong> {specs ? `(${specs})` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {c.consultorio && (
                              <span className="badge badge-confirmada">
                                <Building2 size={13} />
                                <span>{c.consultorio.nombre}</span>
                              </span>
                            )}
                            <span className={c.estadoConsulta === 'ATENDIDA' ? 'badge badge-atendida' : 'badge badge-pendiente'}>
                              {c.estadoConsulta === 'ATENDIDA' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              <span>{c.estadoConsulta}</span>
                            </span>
                            <Link to={`/consultas/${c.idConsulta}/atender`} style={{ textDecoration: 'none' }}>
                              <button type="button" className="button-secondary button-sm">
                                Ver detalle
                              </button>
                            </Link>
                          </div>
                        </div>

                        <div style={{ marginTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>Motivo de consulta:</strong> {c.motivo || '—'}
                          </div>

                          {c.anamnesis && (
                            <div>
                              <strong>Anamnesis / Evolución:</strong>
                              <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--bg-page)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {c.anamnesis}
                              </p>
                            </div>
                          )}

                          {c.examenFisico && (
                            <div>
                              <strong>Examen Físico:</strong>
                              <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--bg-page)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {c.examenFisico}
                              </p>
                            </div>
                          )}

                          {c.diagnosticos && c.diagnosticos.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              <strong>Diagnósticos:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                {c.diagnosticos.map((dx, idx) => (
                                  <span
                                    key={dx.idDiagnostico || idx}
                                    style={{
                                      background: 'var(--primary-bg)',
                                      color: 'var(--primary-text)',
                                      border: '1px solid var(--primary-border)',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      fontSize: '13px',
                                      fontWeight: 500,
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
                              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                                {c.tratamientos.map((tto, idx) => (
                                  <li key={tto.idTratamiento || idx} style={{ color: 'var(--text-main)', marginBottom: '4px' }}>
                                    <strong>{tto.descripcion}</strong>
                                    {tto.indicaciones ? ` — ${tto.indicaciones}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {c.observaciones && (
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              <strong>Observaciones adicionales:</strong> {c.observaciones}
                            </div>
                          )}

                          {/* HU-25: Documentos Médicos y Exámenes Adjuntos */}
                          {documentosPorConsulta[c.idConsulta] && documentosPorConsulta[c.idConsulta].length > 0 && (
                            <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                <Paperclip size={14} className="text-primary" />
                                <span>Documentos y Exámenes Adjuntos ({documentosPorConsulta[c.idConsulta].length}):</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {documentosPorConsulta[c.idConsulta].map((doc) => {
                                  const esPdf = doc.mimeType?.toLowerCase().includes('pdf');
                                  return (
                                    <button
                                      key={doc.idDocumento}
                                      type="button"
                                      onClick={() => setDocumentoSeleccionado(doc)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'var(--bg-page)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {esPdf ? (
                                        <FileText size={14} className="text-primary" />
                                      ) : (
                                        <ImageIcon size={14} className="text-primary" />
                                      )}
                                      <span style={{ fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {doc.nombreArchivo}
                                      </span>
                                      <span className="badge badge-confirmada" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                        {doc.tipo}
                                      </span>
                                      <Eye size={12} style={{ opacity: 0.7 }} />
                                    </button>
                                  );
                                })}
                              </div>
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

      {/* Modal Visor de Documentos */}
      <ModalVisorDocumento
        documento={documentoSeleccionado}
        onClose={() => setDocumentoSeleccionado(null)}
      />
    </section>
  );
}
