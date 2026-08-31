import { useEffect, useState } from 'react';
import { listarConsultorios, type ConsultorioItem } from '../../services/consultoriosService';

export default function ConsultoriosPage() {
  const [consultorios, setConsultorios] = useState<ConsultorioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarConsultorios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listarConsultorios();
      setConsultorios(res.consultorios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar consultorios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConsultorios();
  }, []);

  return (
    <section className="page consultorios-page">
      <div className="card">
        <h2>Catálogo de Consultorios Físicos</h2>
        <p className="hint">
          Espacios físicos registrados en el centro médico disponibles para asignación a profesionales médicos.
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando consultorios...</p>
        ) : consultorios.length === 0 ? (
          <p className="empty-state">No hay consultorios registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo / Especialidad</th>
                <th>Piso</th>
                <th>Capacidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {consultorios.map((c) => (
                <tr key={c.idConsultorio}>
                  <td><strong>#{c.idConsultorio}</strong></td>
                  <td><strong>🏥 {c.nombre}</strong></td>
                  <td>{c.tipo}</td>
                  <td>Piso {c.piso || '1'}</td>
                  <td>{c.capacidad} paciente(s)</td>
                  <td>
                    <span className={c.activo ? 'badge badge-confirmada' : 'badge badge-cancelada'}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
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
