import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarConsultas,
  actualizarEstadoConsulta,
  type ConsultaItem,
  type EstadoConsulta,
} from '../../services/consultasService';

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
        return <span className="badge badge-confirmada" style={{ background: '#dbeafe', color: '#1e40af' }}>📅 Cita</span>;
      case 'URGENCIA_MENOR':
        return <span className="badge badge-danger" style={{ background: '#fee2e2', color: '#991b1b' }}>🚨 Urgencia</span>;
      case 'SOBRECUPO':
        return <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#92400e' }}>➕ Sobrecupo</span>;
      default:
        return <span className="badge badge-info" style={{ background: '#e0e7ff', color: '#3730a3' }}>🚶 Sin cita</span>;
    }
  };

  const badgeEstado = (estado: EstadoConsulta) => {
    switch (estado) {
      case 'EN_ESPERA':
        return <span className="badge badge-pendiente">⏳ En Espera</span>;
      case 'EN_ATENCION':
        return <span className="badge badge-confirmada">🩺 En Atención</span>;
      case 'ATENDIDA':
        return <span className="badge badge-atendida">✅ Atendida</span>;
      default:
        return <span className="badge badge-cancelada">Cancelada</span>;
    }
  };

  return (
    <section className="page cola-atencion-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Cola de Espera y Atenciones Clínicas</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/historia-clinica" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">📖 Buscar Historia Clínica</button>
            </Link>
            {esAdminORecep && (
              <Link to="/consultas/sin-cita" style={{ textDecoration: 'none' }}>
                <button type="button">+ Nueva Atención Walk-in</button>
              </Link>
            )}
            <button type="button" className="button-secondary" onClick={cargarConsultas}>
              🔄 Actualizar
            </button>
          </div>
        </div>
        <p className="hint">
          Panel de seguimiento en tiempo real de pacientes en espera y consultorios activos.
        </p>

        {error && <p className="error">{error}</p>}
        {mensajeExito && <p className="success">{mensajeExito}</p>}
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando lista de espera...</p>
        ) : consultas.length === 0 ? (
          <p className="empty-state">No hay atenciones o pacientes en espera registrados hoy.</p>
        ) : (
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
                          background: 'var(--accent)',
                          color: '#fff',
                          fontWeight: 800,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '14px',
                        }}
                      >
                        #{c.numeroTurno || c.idConsulta}
                      </span>
                    </td>
                    <td>
                      <strong>{nombrePaciente}</strong>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        CI: {paciente?.documentoIdentidad}{' '}
                        {paciente?.documentoIdentidad && (
                          <Link
                            to={`/historia-clinica?ci=${encodeURIComponent(paciente.documentoIdentidad)}`}
                            style={{ color: 'var(--accent)', marginLeft: '4px' }}
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
                        <span className="badge badge-confirmada">🏥 {c.consultorio.nombre}</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>En sala</span>
                      )}
                    </td>
                    <td>{badgeTipo(c.tipoIngreso)}</td>
                    <td>{c.motivo || '—'}</td>
                    <td>{new Date(c.fechaConsulta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{badgeEstado(c.estadoConsulta)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {c.estadoConsulta === 'EN_ESPERA' && (
                          <button
                            type="button"
                            className="button-secondary"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => handleLlamarYAtender(c.idConsulta)}
                          >
                            ▶️ Llamar y Atender
                          </button>
                        )}
                        {c.estadoConsulta === 'EN_ATENCION' && (
                          <button
                            type="button"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => navigate(`/consultas/${c.idConsulta}/atender`)}
                          >
                            🩺 Atender
                          </button>
                        )}
                        {c.estadoConsulta === 'ATENDIDA' && (
                          <button
                            type="button"
                            className="button-secondary"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => navigate(`/consultas/${c.idConsulta}/atender`)}
                          >
                            Ver Ficha
                          </button>
                        )}
                        {c.estadoConsulta !== 'ATENDIDA' && c.estadoConsulta !== 'CANCELADA' && (
                          <button
                            type="button"
                            className="button-danger"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => handleCambiarEstado(c.idConsulta, 'CANCELADA')}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
