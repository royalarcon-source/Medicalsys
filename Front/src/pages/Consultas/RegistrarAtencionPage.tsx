// src/pages/Consultas/RegistrarAtencionPage.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buscarPacientes, type PacienteResumen } from '../../services/pacientesService';
import { listarMedicos, type MedicoDetalle } from '../../services/medicosService';
import { listarConsultorios, type ConsultorioItem } from '../../services/consultoriosService';
import {
  registrarAtencionSinCita,
  type TipoIngreso,
  type TicketTurno,
  type ConsultaItem,
} from '../../services/consultasService';

const TIPOS_INGRESO: { value: TipoIngreso; label: string; desc: string }[] = [
  {
    value: 'CONSULTA_ESPONTANEA',
    label: '🚶 Consulta Espontánea (Walk-in)',
    desc: 'Paciente sin cita que acude directamente a recepción.',
  },
  {
    value: 'SOBRECUPO',
    label: '➕ Sobrecupo Adicional',
    desc: 'Atención agregada por encima de los cupos estándar del médico.',
  },
  {
    value: 'URGENCIA_MENOR',
    label: '🚨 Urgencia Menor',
    desc: 'Atención prioritaria para síntomas agudos no críticos.',
  },
];

export default function RegistrarAtencionPage() {
  const navigate = useNavigate();

  // Búsqueda de Paciente
  const [ciBusqueda, setCiBusqueda] = useState('');
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteResumen | null>(null);
  const [mensajeBusqueda, setMensajeBusqueda] = useState<string | null>(null);

  // Médicos y Consultorios
  const [medicos, setMedicos] = useState<MedicoDetalle[]>([]);
  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);

  // Formulario
  const [idMedico, setIdMedico] = useState('');
  const [idConsultorio, setIdConsultorio] = useState('');
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>('CONSULTA_ESPONTANEA');
  const [motivo, setMotivo] = useState('');
  const [confirmarSobrecupo, setConfirmarSobrecupo] = useState(false);
  const [requiereConfirmacionSobrecupo, setRequiereConfirmacionSobrecupo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ticket Modal
  const [ticketGenerado, setTicketGenerado] = useState<{
    ticket: TicketTurno;
    consulta: ConsultaItem;
  } | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [resMed, resCons] = await Promise.all([
          listarMedicos(),
          listarConsultorios(),
        ]);
        setMedicos(resMed.medicos || []);
        setConsultorios(resCons.consultorios || []);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    }
    cargar();
  }, []);

  const handleBuscarPaciente = async (e: FormEvent) => {
    e.preventDefault();
    if (!ciBusqueda.trim()) return;

    setBuscandoPaciente(true);
    setMensajeBusqueda(null);
    setPacienteSeleccionado(null);

    try {
      const res = await buscarPacientes({ criterio: 'ci', valor: ciBusqueda.trim() });
      if (res.resultados && res.resultados.length > 0) {
        setPacienteSeleccionado(res.resultados[0]);
      } else {
        setMensajeBusqueda('Paciente no encontrado con ese CI. Podés registrarlo antes de continuar.');
      }
    } catch (err) {
      setMensajeBusqueda('Error al buscar paciente.');
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pacienteSeleccionado) {
      setError('Debes buscar y seleccionar un paciente antes de registrar la atención.');
      return;
    }

    if (!idMedico) {
      setError('Debes seleccionar el médico tratante.');
      return;
    }

    if (!motivo.trim()) {
      setError('El motivo de la consulta es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const res = await registrarAtencionSinCita({
        idPaciente: pacienteSeleccionado.idPaciente,
        idMedico: Number(idMedico),
        idConsultorio: idConsultorio ? Number(idConsultorio) : undefined,
        motivo: motivo.trim(),
        tipoIngreso,
        confirmarSobrecupo,
      });

      setTicketGenerado(res);
      setRequiereConfirmacionSobrecupo(false);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Error al registrar atención.';
      if (msg.includes('límite preventivo')) {
        setRequiereConfirmacionSobrecupo(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page registrar-atencion-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Registro de Atención Sin Cita (Walk-in / Sobrecupo - HU-18)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">📋 Ver Cola de Espera</button>
            </Link>
            <Link to="/citas" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">Volver a Citas</button>
            </Link>
          </div>
        </div>
        <p className="hint">
          Registrá el ingreso inmediato de pacientes sin cita previa para integrarlos en la cola de atención del médico en turno.
        </p>
      </div>

      {/* 1. Búsqueda de Paciente */}
      <div className="card">
        <h3>1. Identificación del Paciente</h3>
        <form onSubmit={handleBuscarPaciente} className="form" style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="form-field" style={{ flex: '1', minWidth: '240px', margin: 0 }}>
              <span className="label">Buscar por Documento de Identidad (CI / DNI) *</span>
              <input
                type="text"
                value={ciBusqueda}
                onChange={(e) => setCiBusqueda(e.target.value)}
                placeholder="Ingresá CI del paciente..."
                required
              />
            </label>
            <button type="submit" disabled={buscandoPaciente}>
              {buscandoPaciente ? 'Buscando...' : '🔍 Buscar Paciente'}
            </button>
          </div>
        </form>

        {mensajeBusqueda && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <p style={{ margin: 0, color: '#92400e', fontWeight: 600 }}>{mensajeBusqueda}</p>
            <Link to="/pacientes/nuevo" style={{ marginTop: '6px', display: 'inline-block', color: '#b45309' }}>
              + Crear ficha rápida de nuevo paciente
            </Link>
          </div>
        )}

        {pacienteSeleccionado && (
          <div style={{ marginTop: '14px', padding: '14px', background: '#f0fdf4', borderRadius: '8px', border: '1.5px solid #86efac' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-confirmada">Paciente seleccionado</span>
                <h4 style={{ margin: '6px 0 2px 0', color: '#166534' }}>
                  {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                  CI: {pacienteSeleccionado.documentoIdentidad} | ID Paciente: #{pacienteSeleccionado.idPaciente}
                </p>
              </div>
              <button
                type="button"
                className="button-secondary"
                style={{ fontSize: '12px' }}
                onClick={() => setPacienteSeleccionado(null)}
              >
                Cambiar paciente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Datos de la Atención */}
      {pacienteSeleccionado && (
        <div className="card">
          <h3>2. Asignación Médica y Tipo de Ingreso</h3>

          <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
            <div className="form-row">
              <label className="form-field">
                <span className="label">Médico Tratante en Turno *</span>
                <select
                  value={idMedico}
                  onChange={(e) => setIdMedico(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar médico disponible --</option>
                  {medicos.map((m) => {
                    const nombre = m.usuario ? `Dr(a). ${m.usuario.nombres} ${m.usuario.apellidos}` : `Médico #${m.idMedico}`;
                    const specs = m.especialidades?.map((e) => e.nombre).join(', ');
                    return (
                      <option key={m.idMedico} value={m.idMedico}>
                        {nombre} {specs ? `(${specs})` : ''} - Col: {m.numeroColegiatura}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="form-field">
                <span className="label">Consultorio Físico Asignado (opcional)</span>
                <select
                  value={idConsultorio}
                  onChange={(e) => setIdConsultorio(e.target.value)}
                >
                  <option value="">-- Consultorio por defecto / En sala --</option>
                  {consultorios.map((c) => (
                    <option key={c.idConsultorio} value={c.idConsultorio}>
                      {c.nombre} (Piso {c.piso || '1'} - {c.tipo})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-field">
              <span className="label">Clasificación / Tipo de Ingreso *</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '6px' }}>
                {TIPOS_INGRESO.map((t) => {
                  const seleccionado = tipoIngreso === t.value;
                  return (
                    <div
                      key={t.value}
                      onClick={() => setTipoIngreso(t.value)}
                      style={{
                        padding: '12px',
                        border: seleccionado ? '2px solid var(--accent)' : '1px solid var(--border)',
                        borderRadius: '8px',
                        background: seleccionado ? '#f5f3ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '14px', color: seleccionado ? 'var(--accent)' : 'inherit' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {t.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <label className="form-field">
              <span className="label">Motivo general de consulta *</span>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Fiebre alta, malestar general, curación de herida..."
                required
              />
            </label>

            {requiereConfirmacionSobrecupo && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmarSobrecupo}
                    onChange={(e) => setConfirmarSobrecupo(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, color: '#991b1b', fontSize: '13px' }}>
                    Autorizar sobrecupo adicional para este médico.
                  </span>
                </label>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Generando ticket y asignando turno...' : '🎫 Confirmar e Ingresar a la Cola de Espera'}
            </button>
          </form>
        </div>
      )}

      {/* Modal de Ticket Generado / Comprobante de Turno */}
      {ticketGenerado && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎫</div>
            <h2 style={{ margin: '0 0 4px 0', color: '#166534' }}>¡Turno Asignado con Éxito!</h2>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
              El paciente fue integrado a la cola de atención médica.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '2px dashed #94a3b8',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Número de Turno
              </div>
              <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--accent)', margin: '8px 0' }}>
                #{ticketGenerado.ticket.numeroTurno}
              </div>

              <hr style={{ borderColor: '#e2e8f0', margin: '14px 0' }} />

              <div style={{ textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Paciente:</strong> {pacienteSeleccionado?.nombres} {pacienteSeleccionado?.apellidos} (CI: {pacienteSeleccionado?.documentoIdentidad})</div>
                <div><strong>Médico:</strong> {ticketGenerado.consulta.medico?.usuario?.nombres} {ticketGenerado.consulta.medico?.usuario?.apellidos}</div>
                {ticketGenerado.consulta.consultorio && (
                  <div><strong>Consultorio:</strong> {ticketGenerado.consulta.consultorio.nombre}</div>
                )}
                <div><strong>Tipo:</strong> <span className="badge badge-confirmada">{ticketGenerado.consulta.tipoIngreso}</span></div>
                <div><strong>Hora de Registro:</strong> {new Date().toLocaleTimeString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setTicketGenerado(null);
                  setPacienteSeleccionado(null);
                  setCiBusqueda('');
                  setMotivo('');
                }}
              >
                + Registrar Otro Paciente
              </button>
              <button
                type="button"
                onClick={() => navigate('/consultas/cola')}
              >
                Ir a la Cola de Espera
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
