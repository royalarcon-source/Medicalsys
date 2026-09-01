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
import {
  UserPlus,
  PlusCircle,
  AlertTriangle,
  ClipboardList,
  Search,
  Ticket,
  Stethoscope,
  UserCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';

const TIPOS_INGRESO: { value: TipoIngreso; label: string; desc: string; icon: typeof UserPlus }[] = [
  {
    value: 'CONSULTA_ESPONTANEA',
    label: 'Consulta Espontánea (Walk-in)',
    desc: 'Paciente sin cita que acude directamente a recepción.',
    icon: UserPlus,
  },
  {
    value: 'SOBRECUPO',
    label: 'Sobrecupo Adicional',
    desc: 'Atención agregada por encima de los cupos estándar del médico.',
    icon: PlusCircle,
  },
  {
    value: 'URGENCIA_MENOR',
    label: 'Urgencia Menor',
    desc: 'Atención prioritaria para síntomas agudos no críticos.',
    icon: AlertTriangle,
  },
];

export default function RegistrarAtencionPage() {
  const navigate = useNavigate();

  const [ciBusqueda, setCiBusqueda] = useState('');
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteResumen | null>(null);
  const [mensajeBusqueda, setMensajeBusqueda] = useState<string | null>(null);

  const [medicos, setMedicos] = useState<MedicoDetalle[]>([]);
  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);

  const [idMedico, setIdMedico] = useState('');
  const [idConsultorio, setIdConsultorio] = useState('');
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>('CONSULTA_ESPONTANEA');
  const [motivo, setMotivo] = useState('');
  const [confirmarSobrecupo, setConfirmarSobrecupo] = useState(false);
  const [requiereConfirmacionSobrecupo, setRequiereConfirmacionSobrecupo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="page-header">
          <div>
            <h2>
              <UserPlus size={22} className="text-primary" />
              <span>Registro de Atención Sin Cita</span>
            </h2>
            <p className="page-header-subtitle">
              Registrá el ingreso inmediato de pacientes sin cita previa para integrarlos en la cola de atención del médico en turno.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">
                <ClipboardList size={16} />
                <span>Ver Cola de Espera</span>
              </button>
            </Link>
            <Link to="/citas" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">
                <span>Volver a Citas</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>
          <Search size={18} />
          <span>1. Identificación del Paciente</span>
        </h3>
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
              <Search size={16} />
              <span>{buscandoPaciente ? 'Buscando...' : 'Buscar Paciente'}</span>
            </button>
          </div>
        </form>

        {mensajeBusqueda && (
          <div className="alert-error" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)', color: 'var(--warning-text)' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{mensajeBusqueda}</p>
              <Link to="/pacientes/nuevo" style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning-text)', fontWeight: 600 }}>
                <Plus size={14} />
                <span>Crear ficha rápida de nuevo paciente</span>
              </Link>
            </div>
          </div>
        )}

        {pacienteSeleccionado && (
          <div style={{ marginTop: '14px', padding: '16px', background: 'var(--primary-bg)', borderRadius: '10px', border: '1.5px solid var(--primary-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-atendida">
                  <UserCheck size={12} />
                  <span>Paciente seleccionado</span>
                </span>
                <h4 style={{ margin: '6px 0 2px 0', color: 'var(--primary-text)', fontSize: '1.05rem' }}>
                  {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary-text)', opacity: 0.9 }}>
                  CI: {pacienteSeleccionado.documentoIdentidad} | ID Paciente: #{pacienteSeleccionado.idPaciente}
                </p>
              </div>
              <button
                type="button"
                className="button-secondary button-sm"
                onClick={() => setPacienteSeleccionado(null)}
              >
                Cambiar paciente
              </button>
            </div>
          </div>
        )}
      </div>

      {pacienteSeleccionado && (
        <div className="card">
          <h3>
            <Stethoscope size={18} />
            <span>2. Asignación Médica y Tipo de Ingreso</span>
          </h3>

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '6px' }}>
                {TIPOS_INGRESO.map((t) => {
                  const seleccionado = tipoIngreso === t.value;
                  const IconComp = t.icon;
                  return (
                    <div
                      key={t.value}
                      onClick={() => setTipoIngreso(t.value)}
                      style={{
                        padding: '14px',
                        border: seleccionado ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: '10px',
                        background: seleccionado ? 'var(--primary-bg)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', color: seleccionado ? 'var(--primary-text)' : 'var(--text-main)' }}>
                        <IconComp size={16} />
                        <span>{t.label}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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
              <div className="alert-error">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmarSobrecupo}
                    onChange={(e) => setConfirmarSobrecupo(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>
                    Autorizar sobrecupo adicional para este médico.
                  </span>
                </label>
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
              <Ticket size={16} />
              <span>{loading ? 'Generando ticket y asignando turno...' : 'Confirmar e Ingresar a la Cola de Espera'}</span>
            </button>
          </form>
        </div>
      )}

      {ticketGenerado && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', margin: '0 auto 8px' }}>
              <Ticket size={32} />
            </div>
            <h2 style={{ margin: '0 0 4px 0', color: 'var(--primary-text)', justifyContent: 'center' }}>
              ¡Turno Asignado con Éxito!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 16px 0' }}>
              El paciente fue integrado a la cola de atención médica.
            </p>

            <div
              style={{
                background: 'var(--bg-page)',
                border: '2px dashed var(--border-strong)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Número de Turno
              </div>
              <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--primary)', margin: '6px 0' }}>
                #{ticketGenerado.ticket.numeroTurno}
              </div>

              <hr style={{ borderColor: 'var(--border)', margin: '14px 0' }} />

              <div style={{ textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Paciente:</strong> {pacienteSeleccionado?.nombres} {pacienteSeleccionado?.apellidos} (CI: {pacienteSeleccionado?.documentoIdentidad})</div>
                <div><strong>Médico:</strong> {ticketGenerado.consulta.medico?.usuario?.nombres} {ticketGenerado.consulta.medico?.usuario?.apellidos}</div>
                {ticketGenerado.consulta.consultorio && (
                  <div><strong>Consultorio:</strong> {ticketGenerado.consulta.consultorio.nombre}</div>
                )}
                <div>
                  <strong>Tipo:</strong> <span className="badge badge-confirmada">{ticketGenerado.consulta.tipoIngreso}</span>
                </div>
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
                <Plus size={15} />
                <span>Registrar Otro Paciente</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/consultas/cola')}
              >
                <span>Ir a la Cola de Espera</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
