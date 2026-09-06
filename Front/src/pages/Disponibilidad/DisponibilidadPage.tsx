import { useCallback, useEffect, useState } from 'react';
import { buscarDisponibilidad, type DisponibilidadResultado } from '../../services/disponibilidadService';
import { listarEspecialidades, type Especialidad } from '../../services/especialidadesService';
import { Clock, Search, Calendar, User } from 'lucide-react';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

function nombreDia(diaSemana: number): string {
  return DIAS_SEMANA.find((dia) => dia.value === diaSemana)?.label ?? String(diaSemana);
}

export default function DisponibilidadPage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [idMedico, setIdMedico] = useState('');

  const [resultados, setResultados] = useState<DisponibilidadResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutarBusqueda = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const respuesta = await buscarDisponibilidad({
        idMedico: idMedico ? Number(idMedico) : undefined,
        idEspecialidad: idEspecialidad ? Number(idEspecialidad) : undefined,
        diaSemana: diaSemana ? Number(diaSemana) : undefined,
      });

      setResultados(respuesta.resultados);
      if (respuesta.resultados.length === 0) {
        setError('No se encontró disponibilidad con esos criterios.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la búsqueda.');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [diaSemana, idEspecialidad, idMedico]);

  useEffect(() => {
    listarEspecialidades()
      .then((respuesta) => setEspecialidades(respuesta.especialidades))
      .catch(() => setEspecialidades([]));

    void ejecutarBusqueda();
  }, [ejecutarBusqueda]);

  return (
    <section className="page disponibilidad-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Clock size={22} className="text-primary" />
              <span>Consultar Disponibilidad Horaria</span>
            </h2>
            <p className="page-header-subtitle">
              Filtro y visualización de franjas horarias y turnos de atención del cuerpo médico.
            </p>
          </div>
        </div>

        <div className="search-row">
          <select
            value={idEspecialidad}
            onChange={(event) => setIdEspecialidad(event.target.value)}
            aria-label="Filtrar por especialidad"
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((especialidad) => (
              <option key={especialidad.idEspecialidad} value={especialidad.idEspecialidad}>
                {especialidad.nombre}
              </option>
            ))}
          </select>

          <select
            value={diaSemana}
            onChange={(event) => setDiaSemana(event.target.value)}
            aria-label="Filtrar por día"
          >
            <option value="">Todos los días</option>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={idMedico}
            onChange={(event) => setIdMedico(event.target.value)}
            placeholder="ID de médico (opcional)"
            aria-label="Filtrar por ID de médico"
          />

          <button type="button" onClick={ejecutarBusqueda}>
            <Search size={16} />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando disponibilidad...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '24px' }}>
            <div className="alert-error">{error}</div>
          </div>
        ) : resultados.length === 0 ? (
          <div className="empty-state">
            <Calendar size={32} className="empty-state-icon" />
            <p>No se encontró disponibilidad médica con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Médico</th>
                  <th>Colegiatura</th>
                  <th>Especialidades</th>
                  <th>Día</th>
                  <th>Horario</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((horario) => (
                  <tr key={horario.idHorario}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} className="text-primary" />
                        <strong>{horario.medicoNombre}</strong>
                      </div>
                    </td>
                    <td>{horario.numeroColegiatura}</td>
                    <td>{horario.especialidades.join(', ') || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">
                        <Calendar size={12} />
                        <span>{nombreDia(horario.diaSemana)}</span>
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-confirmada">
                        <Clock size={12} />
                        <span>{horario.horaInicio} - {horario.horaFin}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
