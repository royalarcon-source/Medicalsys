import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  reservarCita,
  obtenerSlotsMedico,
  type SlotDisponibilidad,
} from '../../services/citasService';
import { listarEspecialidades, type Especialidad } from '../../services/especialidadesService';
import { buscarDisponibilidad, type DisponibilidadResultado } from '../../services/disponibilidadService';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ReservarCitaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const esPaciente = usuario?.rol === 'PACIENTE';

  // Catálogos
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<string>('');
  const [horariosDisponibles, setHorariosDisponibles] = useState<DisponibilidadResultado[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  // Selección de Médico y Horario base
  const [horarioActivo, setHorarioActivo] = useState<DisponibilidadResultado | null>(null);

  // Slots calculados en vivo para la fecha elegida
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // Formulario
  const [idPaciente, setIdPaciente] = useState('');
  const [idMedico, setIdMedico] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar especialidades y disponibilidad inicial
  useEffect(() => {
    async function inicializar() {
      try {
        const resEsp = await listarEspecialidades();
        setEspecialidades(resEsp.especialidades || []);
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
      }
      cargarDisponibilidad();
    }
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDisponibilidad = async (idEspecialidad?: number) => {
    setCargandoHorarios(true);
    setError(null);
    try {
      const res = await buscarDisponibilidad(idEspecialidad ? { idEspecialidad } : {});
      setHorariosDisponibles((res.resultados || []).filter((h) => h.activo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la disponibilidad médica.');
    } finally {
      setCargandoHorarios(false);
    }
  };

  const handleCambioEspecialidad = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEspecialidadSeleccionada(val);
    setHorarioActivo(null);
    setIdMedico('');
    setSlots([]);
    setHoraInicio('');
    setHoraFin('');
    await cargarDisponibilidad(val ? Number(val) : undefined);
  };

  // Calcular la próxima fecha del día de la semana seleccionado (1=Lunes .. 7=Domingo)
  const calcularProximaFecha = (diaSemanaObjetivo: number): string => {
    const hoy = new Date();
    const diaActual = hoy.getDay() === 0 ? 7 : hoy.getDay();
    let diasFaltantes = diaSemanaObjetivo - diaActual;
    if (diasFaltantes <= 0) {
      diasFaltantes += 7;
    }
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + diasFaltantes);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
  };

  // 2. Cargar turnos (slots) en vivo cuando cambia médico o fecha
  const cargarSlotsFecha = async (medId: number, fecha: string) => {
    if (!medId || !fecha) return;
    setCargandoSlots(true);
    try {
      const res = await obtenerSlotsMedico(medId, fecha);
      setSlots(res.slots || []);
    } catch (err) {
      console.warn('Error al cargar slots:', err);
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  };

  const seleccionarHorario = async (horario: DisponibilidadResultado) => {
    setHorarioActivo(horario);
    setIdMedico(String(horario.idMedico));

    // Sugerir fecha correspondiente a ese día de atención
    const fechaSugerida = calcularProximaFecha(horario.diaSemana);
    setFechaCita(fechaSugerida);

    // Reset de horas hasta elegir un slot específico
    setHoraInicio('');
    setHoraFin('');
    setError(null);

    await cargarSlotsFecha(horario.idMedico, fechaSugerida);
  };

  const handleCambioFecha = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value;
    setFechaCita(nuevaFecha);
    setHoraInicio('');
    setHoraFin('');
    if (idMedico) {
      await cargarSlotsFecha(Number(idMedico), nuevaFecha);
    }
  };

  const seleccionarSlot = (slot: SlotDisponibilidad) => {
    if (!slot.disponible) return;
    setHoraInicio(slot.horaInicio);
    setHoraFin(slot.horaFin);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const medId = Number(idMedico);
    if (!medId || medId <= 0) {
      setError('Debes seleccionar un médico u horario disponible.');
      return;
    }

    if (!esPaciente) {
      const pacId = Number(idPaciente);
      if (!pacId || pacId <= 0) {
        setError('Como administrador o recepcionista debes indicar el ID del paciente.');
        return;
      }
    }

    if (!fechaCita || !horaInicio || !horaFin) {
      setError('Debes seleccionar un turno disponible (en verde) de la lista.');
      return;
    }

    const inicio = new Date(`${fechaCita}T${horaInicio}:00`);
    const fin = new Date(`${fechaCita}T${horaFin}:00`);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      setError('Rango de fecha y horario inválido.');
      return;
    }

    if (inicio.getTime() < Date.now()) {
      setError('No se pueden agendar citas en fechas u horas pasadas.');
      return;
    }

    setLoading(true);
    try {
      await reservarCita({
        idMedico: medId,
        idPaciente: !esPaciente ? Number(idPaciente) : undefined,
        fechaHoraInicio: inicio.toISOString(),
        fechaHoraFin: fin.toISOString(),
        motivo: motivo.trim() || undefined,
      });

      navigate('/citas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reservar la cita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page reservar-cita-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Reservar Cita Médica (HU-15)</h2>
          <Link to="/citas" style={{ textDecoration: 'none' }}>
            <button type="button" className="button-secondary">Volver al listado</button>
          </Link>
        </div>
        <p className="hint">
          Paso 1: Filtrá por especialidad y seleccioná el médico de tu preferencia.
        </p>

        {/* 1. Filtro por Especialidad */}
        <div className="form-field" style={{ marginTop: '8px' }}>
          <span className="label">Filtrar por Especialidad médica</span>
          <select
            value={especialidadSeleccionada}
            onChange={handleCambioEspecialidad}
          >
            <option value="">-- Todas las especialidades --</option>
            {especialidades.map((esp) => (
              <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                {esp.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Lista de Médicos y Horarios disponibles */}
        <div style={{ marginTop: '16px' }}>
          <span className="label">Médicos Disponibles:</span>
          {cargandoHorarios ? (
            <p>Cargando disponibilidad...</p>
          ) : horariosDisponibles.length === 0 ? (
            <p className="empty-state" style={{ marginTop: '8px' }}>
              No hay médicos con horarios disponibles para esta especialidad.
            </p>
          ) : (
            <div className="schedule-grid">
              {horariosDisponibles.map((h) => {
                const esActivo = horarioActivo?.idHorario === h.idHorario;
                return (
                  <div
                    key={h.idHorario}
                    className={`schedule-card ${esActivo ? 'active' : ''}`}
                    onClick={() => seleccionarHorario(h)}
                  >
                    <div className="schedule-card-header">
                      <span className="schedule-card-title">
                        {h.medicoNombre ? `Dr(a). ${h.medicoNombre}` : `Médico #${h.idMedico}`}
                      </span>
                      <span className="badge badge-confirmada">
                        {DIAS[h.diaSemana] || `Día ${h.diaSemana}`}
                      </span>
                    </div>

                    <div className="schedule-card-time">
                      🕒 {h.horaInicio.slice(0, 5)} a {h.horaFin.slice(0, 5)}
                    </div>

                    {h.especialidades && h.especialidades.length > 0 && (
                      <div className="schedule-card-specs">
                        🏷️ {h.especialidades.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Selección de Fecha y Matriz de Turnos (Slots en Verde y Rojo) */}
      {idMedico && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3>Paso 2: Elegí Fecha y Turno</h3>
            <div className="form-field" style={{ minWidth: '220px' }}>
              <span className="label">Fecha a consultar</span>
              <input
                type="date"
                value={fechaCita}
                onChange={handleCambioFecha}
                required
              />
            </div>
          </div>

          <div className="slots-container">
            <div className="slots-header">
              <span className="label">
                Turnos para el Dr(a). {horarioActivo?.medicoNombre || `Médico #${idMedico}`} ({fechaCita}):
              </span>
              <div className="slots-legend">
                <span className="legend-item">
                  <span className="legend-dot disponible"></span>
                  <span>🟢 Disponible</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot ocupado"></span>
                  <span>🔴 Ocupado / No disp.</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot seleccionado"></span>
                  <span>🟣 Seleccionado</span>
                </span>
              </div>
            </div>

            {cargandoSlots ? (
              <p>Consultando disponibilidad de turnos...</p>
            ) : slots.length === 0 ? (
              <p className="empty-state">
                El médico no tiene turno de atención configurado para la fecha seleccionada. Probá con otro día de la semana.
              </p>
            ) : (
              <div className="slots-grid">
                {slots.map((slot) => {
                  const esSeleccionado = horaInicio === slot.horaInicio && horaFin === slot.horaFin;
                  const clase = esSeleccionado
                    ? 'slot-btn seleccionado'
                    : slot.disponible
                    ? 'slot-btn disponible'
                    : 'slot-btn ocupado';

                  return (
                    <button
                      key={slot.horaInicio}
                      type="button"
                      className={clase}
                      onClick={() => seleccionarSlot(slot)}
                      disabled={!slot.disponible}
                      title={
                        esSeleccionado
                          ? 'Turno seleccionado'
                          : slot.disponible
                          ? 'Turno disponible para reservar'
                          : 'Turno ocupado por otra cita'
                      }
                    >
                      <span>{slot.horaInicio} - {slot.horaFin}</span>
                      <span className="slot-status-label">
                        {esSeleccionado ? 'ELEGIDO' : slot.disponible ? 'LIBRE' : 'OCUPADO'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulario final de envío */}
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: '16px' }}>
            {!esPaciente && (
              <label className="form-field">
                <span className="label">ID del Paciente *</span>
                <input
                  type="number"
                  min={1}
                  value={idPaciente}
                  onChange={(e) => setIdPaciente(e.target.value)}
                  placeholder="Ingresá el ID numérico del paciente"
                  required
                />
              </label>
            )}

            <div className="form-row">
              <label className="form-field">
                <span className="label">Horario seleccionado</span>
                <input
                  type="text"
                  value={horaInicio && horaFin ? `${horaInicio} a ${horaFin} (${fechaCita})` : 'Hacé clic en un turno verde arriba'}
                  readOnly
                  style={{ background: '#f3f4f6', fontWeight: horaInicio ? 600 : 400 }}
                  required
                />
              </label>

              <label className="form-field">
                <span className="label">Motivo de la consulta</span>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Chequeo de rutina, control de presión..."
                />
              </label>
            </div>

            {error && <p className="error">{error}</p>}

            <button
              type="submit"
              disabled={loading || !idMedico || !horaInicio || !horaFin}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Confirmando reserva...' : 'Confirmar Reserva de Cita'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
