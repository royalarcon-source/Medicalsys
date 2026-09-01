import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarConsultas,
  actualizarEstadoConsulta,
  type ConsultaItem,
  type EstadoConsulta,
} from '../../services/consultasService';
import {
  Calendar,
  AlertTriangle,
  PlusCircle,
  UserCheck,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Building2,
  Play,
  Plus,
} from 'lucide-react';

export default function ColaAtencionPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const esAdminORecep = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const cargarConsultas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listarConsultas();
      setConsultas(res.consultas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la lista de atención.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConsultas();
  }, []);

  const handleLlamarYAtender = async (idConsulta: number) => {
    setError(null);
    setMensajeExito(null);
    try {
      await actualizarEstadoConsulta(idConsulta, 'EN_ATENCION');
      navigate(`/consultas/${idConsulta}/atender`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo llamar al paciente.');
    }
  };

  const handleCambiarEstado = async (idConsulta: number, nuevoEstado: EstadoConsulta) => {
    setError(null);
    setMensajeExito(null);
    try {
      await actualizarEstadoConsulta(idConsulta, nuevoEstado);
      setMensajeExito(`Turno actualizado a ${nuevoEstado}.`);
      await cargarConsultas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado de la consulta.');
    }
  };

  const badgeTipo = (tipo: string | null) => {
    switch (tipo) {
      case 'CITA_PROGRAMADA':
        return (
          <span className="badge badge-confirmada">
            <Calendar size={13} />
            <span>Cita</span>
          </span>
        );
      case 'URGENCIA_MENOR':
        return (
          <span className="badge badge-danger">
            <AlertTriangle size={13} />
            <span>Urgencia</span>
          </span>
        );
      case 'SOBRECUPO':
        return (
          <span className="badge badge-warning">
            <PlusCircle size={13} />
            <span>Sobrecupo</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral">
            <UserCheck size={13} />
            <span>Sin cita</span>
          </span>
        );
    }
  };

  const badgeEstado = (estado: EstadoConsulta) => {
    switch (estado) {
      case 'EN_ESPERA':
        return (
          <span className="badge badge-pendiente">
            <Clock size={13} />
            <span>En Espera</span>
          </span>
        );
      case 'EN_ATENCION':
        return (
          <span className="badge badge-confirmada">
            <Stethoscope size={13} />
            <span>En Atención</span>
          </span>
        );
      case 'ATENDIDA':
        return (
          <span className="badge badge-atendida">
            <CheckCircle2 size={13} />
            <span>Atendida</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-cancelada">
            <XCircle size={13} />
            <span>Cancelada</span>
          </span>
        );
    }
  };

  return (
    <section className="page cola-atencion-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Clock size={22} className="text-primary" />
              <span>Cola de Espera y Atenciones Clínicas</span>
            </h2>
            <p className="page-header-subtitle">
              Panel de seguimiento en tiempo real de pacientes en espera y consultorios activos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/historia-clinica" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">
                <FileText size={16} />
                <span>Buscar Historia Clínica</span>
              </button>
            </Link>
            {esAdminORecep && (
              <Link to="/consultas/sin-cita" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-primary">
                  <Plus size={16} />
                  <span>Nueva Atención Walk-in</span>
                </button>
              </Link>
            )}
            <button type="button" className="button-secondary" onClick={cargarConsultas}>
              <RefreshCw size={15} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando lista de espera...</p>
          </div>
        ) : consultas.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={32} className="empty-state-icon" />
            <p>No hay atenciones o pacientes en espera registrados hoy.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Consultorio</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => {
                  const paciente = c.historia?.paciente;
                  const nombrePaciente = paciente?.usuario
                    ? `${paciente.usuario.nombres} ${paciente.usuario.apellidos}`
                    : `CI: ${paciente?.documentoIdentidad || '—'}`;

                  const nombreMedico = c.medico?.usuario
                    ? `Dr(a). ${c.medico.usuario.nombres} ${c.medico.usuario.apellidos}`
                    : `Médico #${c.medico?.idMedico || '—'}`;

                  return (
                    <tr key={c.idConsulta}>
                      <td>
                        <span
                          style={{
                            background: 'var(--primary-bg)',
                            color: 'var(--primary-text)',
                            border: '1px solid var(--primary-border)',
                            fontWeight: 700,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.85rem',
                          }}
                        >
                          #{c.numeroTurno || c.idConsulta}
                        </span>
                      </td>
                      <td>
                        <strong>{nombrePaciente}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          CI: {paciente?.documentoIdentidad}{' '}
                          {paciente?.documentoIdentidad && (
                            <Link
                              to={`/historia-clinica?ci=${encodeURIComponent(paciente.documentoIdentidad)}`}
                              style={{ color: 'var(--primary)', marginLeft: '4px', fontWeight: 600 }}
                              title="Ver historia clínica"
                            >
                              [HC]
                            </Link>
                          )}
                        </div>
                      </td>
                      <td>{nombreMedico}</td>
                      <td>
                        {c.consultorio ? (
                          <span className="badge badge-confirmada">
                            <Building2 size={13} />
                            <span>{c.consultorio.nombre}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>En sala</span>
                        )}
                      </td>
                      <td>{badgeTipo(c.tipoIngreso)}</td>
                      <td>{c.motivo || '—'}</td>
                      <td>{new Date(c.fechaConsulta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{badgeEstado(c.estadoConsulta)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {c.estadoConsulta === 'EN_ESPERA' && (
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => handleLlamarYAtender(c.idConsulta)}
                            >
                              <Play size={13} />
                              <span>Llamar y Atender</span>
                            </button>
                          )}
                          {c.estadoConsulta === 'EN_ATENCION' && (
                            <button
                              type="button"
                              className="btn-primary button-sm"
                              onClick={() => navigate(`/consultas/${c.idConsulta}/atender`)}
                            >
                              <Stethoscope size={13} />
                              <span>Atender</span>
                            </button>
                          )}
                          {c.estadoConsulta === 'ATENDIDA' && (
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => navigate(`/consultas/${c.idConsulta}/atender`)}
                            >
                              <FileText size={13} />
                              <span>Ver Ficha</span>
                            </button>
                          )}
                          {c.estadoConsulta !== 'ATENDIDA' && c.estadoConsulta !== 'CANCELADA' && (
                            <button
                              type="button"
                              className="button-outline-danger button-sm"
                              onClick={() => handleCambiarEstado(c.idConsulta, 'CANCELADA')}
                            >
                              <XCircle size={13} />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
