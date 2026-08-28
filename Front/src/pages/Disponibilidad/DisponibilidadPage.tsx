import { useEffect, useState } from 'react';
import {
  buscarDisponibilidad,
  listarEspecialidades,
  type DisponibilidadResultado,
  type Especialidad,
} from '../../services/disponibilidadService';

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

  const ejecutarBusqueda = async () => {
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
  };

  useEffect(() => {
    listarEspecialidades()
      .then((respuesta) => setEspecialidades(respuesta.especialidades))
      .catch(() => setEspecialidades([]));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de resultados, no deriva estado de props
    ejecutarBusqueda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="page">
      <div className="card">
        <h2>Consultar disponibilidad</h2>

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
            Buscar
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando disponibilidad...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : resultados.length === 0 ? (
          <p className="empty-state">No se encontró disponibilidad.</p>
        ) : (
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
                  <td>{horario.medicoNombre}</td>
                  <td>{horario.numeroColegiatura}</td>
                  <td>{horario.especialidades.join(', ') || '—'}</td>
                  <td>{nombreDia(horario.diaSemana)}</td>
                  <td>
                    {horario.horaInicio} - {horario.horaFin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
