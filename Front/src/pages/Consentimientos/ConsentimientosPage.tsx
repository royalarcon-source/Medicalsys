import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  consentimientoService,
  TIPOS_CONSENTIMIENTO,
  type Consentimiento,
} from '../../services/consentimientoService';
import { buscarPacientes, type PacienteResumen } from '../../services/pacientesService';
import {
  FileCheck,
  Search,
  PenTool,
  Clock,
  CheckCircle2,
  User,
  Plus,
} from 'lucide-react';

export default function ConsentimientosPage() {
  const { token, usuario } = useAuth();

  const [ciBusqueda, setCiBusqueda] = useState('');
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteResumen | null>(null);

  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [tipo, setTipo] = useState<string>('CONSENTIMIENTO_CIRUGIA_MENOR');
  const [version, setVersion] = useState('1.0');
  const [firmasPorId, setFirmasPorId] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esMedicoOAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO';

  const cargarConsentimientos = async (idPaciente: number) => {
    if (!token) return;
    try {
      setCargando(true);
      setError(null);
      const datos = await consentimientoService.obtenerPorPaciente(token, idPaciente);
      setConsentimientos(datos);
    } catch (err: any) {
      setError(err.message || 'Error al cargar consentimientos.');
    } finally {
      setCargando(false);
    }
  };

  const handleBuscarPaciente = async (e: FormEvent) => {
    e.preventDefault();
    if (!ciBusqueda.trim()) return;

    setBuscandoPaciente(true);
    setError(null);
    setMensaje(null);
    setConsentimientos([]);

    try {
      const res = await buscarPacientes({ criterio: 'ci', valor: ciBusqueda.trim() });
      if (res.resultados && res.resultados.length > 0) {
        const p = res.resultados[0];
        setPacienteSeleccionado(p);
        await cargarConsentimientos(p.idPaciente);
      } else {
        setPacienteSeleccionado(null);
        setError('No se encontró ningún paciente con el documento indicado.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar el paciente.');
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // HU-26: Emisión
  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('No hay sesión activa.');
      return;
    }
    if (!pacienteSeleccionado) {
      setError('Por favor busque y seleccione un paciente primero.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      setMensaje(null);

      await consentimientoService.emitirConsentimiento(token, {
        idPaciente: pacienteSeleccionado.idPaciente,
        tipo,
        version,
      });

      setMensaje('Consentimiento informado emitido con éxito.');
      await cargarConsentimientos(pacienteSeleccionado.idPaciente);
    } catch (err: any) {
      setError(err.message || 'Error al emitir el consentimiento.');
    } finally {
      setCargando(false);
    }
  };

  // HU-27: Firma
  const handleFirmar = async (idConsentimiento: number) => {
    const nombreFirma = firmasPorId[idConsentimiento]?.trim();
    if (!nombreFirma) {
      setError('Por favor ingrese el nombre completo para la firma del consentimiento.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      setMensaje(null);

      await consentimientoService.firmarConsentimiento(token || '', idConsentimiento, nombreFirma);
      setMensaje('Consentimiento firmado y registrado correctamente.');
      setFirmasPorId((prev) => ({ ...prev, [idConsentimiento]: '' }));

      if (pacienteSeleccionado) {
        await cargarConsentimientos(pacienteSeleccionado.idPaciente);
      }
    } catch (err: any) {
      setError(err.message || 'Error al firmar el consentimiento.');
    } finally {
      setCargando(false);
    }
  };

  const obtenerEtiquetaTipo = (tipoVal: string) => {
    const item = TIPOS_CONSENTIMIENTO.find((t) => t.value === tipoVal);
    return item ? item.label : tipoVal;
  };

  return (
    <section className="page consentimientos-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <FileCheck size={22} className="text-primary" />
              <span>Gestión de Consentimientos Informados (HU-26 / HU-27)</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Emisión de consentimientos por parte del médico y registro de firma informada del paciente.
            </p>
          </div>
        </div>

        {mensaje && <div className="alert-success" style={{ marginTop: '12px' }}>{mensaje}</div>}
        {error && <div className="alert-error" style={{ marginTop: '12px' }}>{error}</div>}

        {/* Buscador de Paciente */}
        <form onSubmit={handleBuscarPaciente} style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label className="form-field" style={{ flex: '1 1 280px', margin: 0 }}>
            <span className="label">Buscar Paciente por Cédula / Documento (CI) *</span>
            <input
              type="text"
              placeholder="Ingrese el documento CI del paciente..."
              value={ciBusqueda}
              onChange={(e) => setCiBusqueda(e.target.value)}
              disabled={buscandoPaciente}
            />
          </label>
          <button type="submit" disabled={buscandoPaciente || !ciBusqueda.trim()} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} />
            <span>{buscandoPaciente ? 'Buscando...' : 'Buscar Paciente'}</span>
          </button>
        </form>

        {pacienteSeleccionado && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              borderLeft: '4px solid var(--primary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} className="text-primary" />
              <div>
                <strong>{pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  CI: {pacienteSeleccionado.documentoIdentidad} | ID: #{pacienteSeleccionado.idPaciente}
                </div>
              </div>
            </div>
            <span className="badge badge-confirmada">Paciente Seleccionado</span>
          </div>
        )}
      </div>

      {/* HU-26: Emisión de consentimiento */}
      {esMedicoOAdmin && pacienteSeleccionado && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', margin: '0 0 14px 0' }}>
            <Plus size={18} className="text-primary" />
            <span>Emitir Nuevo Consentimiento Informado (HU-26)</span>
          </h3>

          <form onSubmit={handleEmitir} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-field" style={{ flex: '2 1 260px', margin: 0 }}>
              <span className="label">Tipo de Procedimiento / Consentimiento *</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={cargando}>
                {TIPOS_CONSENTIMIENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field" style={{ flex: '1 1 120px', margin: 0 }}>
              <span className="label">Versión *</span>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                disabled={cargando}
              />
            </label>

            <button type="submit" disabled={cargando} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={16} />
              <span>{cargando ? 'Emitiendo...' : 'Emitir Consentimiento'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Lista de Consentimientos & HU-27 Firma */}
      {pacienteSeleccionado && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', margin: 0 }}>
              <PenTool size={18} className="text-primary" />
              <span>Consentimientos del Paciente ({consentimientos.length})</span>
            </h3>
          </div>

          {cargando && consentimientos.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando consentimientos...
            </div>
          ) : consentimientos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'var(--bg-page)',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              No se registran consentimientos informados emitidos para este paciente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {consentimientos.map((c) => {
                const firmado = c.estado === 'FIRMADO';
                return (
                  <div
                    key={c.idConsentimiento}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '16px',
                      background: 'var(--bg-page)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>
                          {obtenerEtiquetaTipo(c.tipo)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Versión: <strong>{c.version}</strong> • ID #{c.idConsentimiento} • Emitido:{' '}
                          {new Date(c.fechaEmision).toLocaleDateString()}
                        </div>
                      </div>

                      <span
                        className={firmado ? 'badge badge-confirmada' : 'badge badge-pendiente'}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {firmado ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                        <span>{c.estado}</span>
                      </span>
                    </div>

                    {firmado ? (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <strong>Firmado por:</strong> {c.firmadoPor} •{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          Fecha:{' '}
                          {c.fechaFirma ? new Date(c.fechaFirma).toLocaleString() : 'Registrada'}
                        </span>
                      </div>
                    ) : (
                      /* HU-27: Acción de Firma */
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'var(--bg-surface)',
                          border: '1px dashed var(--primary)',
                          borderRadius: '6px',
                        }}
                      >
                        <span className="label" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                          [HU-27] Firmar Consentimiento Informado:
                        </span>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Nombre y Apellidos completos del firmante *"
                            style={{ flex: 1, minWidth: '220px' }}
                            value={firmasPorId[c.idConsentimiento] || ''}
                            onChange={(e) =>
                              setFirmasPorId({
                                ...firmasPorId,
                                [c.idConsentimiento]: e.target.value,
                              })
                            }
                            disabled={cargando}
                          />
                          <button
                            type="button"
                            onClick={() => handleFirmar(c.idConsentimiento)}
                            disabled={cargando || !(firmasPorId[c.idConsentimiento] || '').trim()}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <PenTool size={14} />
                            <span>Firmar Consentimiento</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
