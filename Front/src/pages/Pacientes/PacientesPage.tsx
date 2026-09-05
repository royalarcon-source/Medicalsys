import { useState } from 'react';
import {
  buscarPacientes,
  obtenerDetallePaciente,
  type CriterioBusqueda,
  type PacienteDetalle,
  type PacienteResumen,
} from '../../services/pacientesService';

const CRITERIOS: { value: CriterioBusqueda; label: string }[] = [
  { value: 'ci', label: 'CI' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'apellido', label: 'Apellido' },
];

const LIMIT = 5;

export default function PacientesPage() {
  const [criterio, setCriterio] = useState<CriterioBusqueda>('ci');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [resultados, setResultados] = useState<PacienteResumen[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteDetalle | null>(null);

  const ejecutarBusqueda = async (pagina = 1, valor = valorBusqueda) => {
    const termino = valor.trim();

    if (!termino) {
      setError('Debes ingresar un valor para buscar.');
      setResultados([]);
      setTotalPages(1);
      setPage(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const respuesta = await buscarPacientes({
        criterio,
        valor: termino,
        page: pagina,
        limit: LIMIT,
      });

      setResultados(respuesta.resultados || []);
      setTotalPages(respuesta.totalPages || 1);
      setPage(respuesta.page || 1);

      if ((respuesta.resultados || []).length === 0) {
        setError('No se encontraron pacientes.');
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo completar la búsqueda.';
      setError(mensaje);
      setResultados([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = async (idPaciente: number) => {
    setLoadingDetalle(true);
    setError(null);

    try {
      const respuesta = await obtenerDetallePaciente(idPaciente);
      setPacienteSeleccionado(respuesta.paciente);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el detalle del paciente.';
      setError(mensaje);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cambiarPagina = async (nuevaPagina: number) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPages) {
      return;
    }

    await ejecutarBusqueda(nuevaPagina, valorBusqueda);
  };

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) {
      return '—';
    }

    const fechaDate = new Date(fecha);
    if (Number.isNaN(fechaDate.getTime())) {
      return fecha;
    }

    return fechaDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <section className="page pacientes-page">
      <div className="card">
        <h2>Consultar paciente</h2>

        <div className="search-row">
          <select
            value={criterio}
            onChange={(event) => setCriterio(event.target.value as CriterioBusqueda)}
            aria-label="Seleccionar criterio de búsqueda"
          >
            {CRITERIOS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={valorBusqueda}
            onChange={(event) => setValorBusqueda(event.target.value)}
            placeholder={
              criterio === 'ci'
                ? 'Ingrese el CI'
                : criterio === 'nombre'
                  ? 'Ingrese el nombre'
                  : 'Ingrese el apellido'
            }
            aria-label="Buscar paciente"
          />

          <button type="button" onClick={() => ejecutarBusqueda(1, valorBusqueda)}>
            Buscar
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando pacientes...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : resultados.length === 0 ? (
          <p className="empty-state">No se encontraron pacientes.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>CI</th>
                  <th>Nombre Completo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((paciente) => (
                  <tr key={paciente.idPaciente}>
                    <td>{paciente.documentoIdentidad}</td>
                    <td>{`${paciente.nombres} ${paciente.apellidos}`.trim()}</td>
                    <td>
                      <button type="button" onClick={() => abrirDetalle(paciente.idPaciente)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button type="button" onClick={() => cambiarPagina(page - 1)} disabled={page <= 1}>
                Anterior
              </button>
              <span>
                Página {page} de {totalPages || 1}
              </span>
              <button type="button" onClick={() => cambiarPagina(page + 1)} disabled={page >= totalPages}>
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      {pacienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setPacienteSeleccionado(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle del paciente</h3>
              <button type="button" onClick={() => setPacienteSeleccionado(null)}>
                Volver
              </button>
            </div>

            {loadingDetalle ? (
              <p>Cargando detalle...</p>
            ) : (
              <div className="detail-grid">
                <div>
                  <span className="label">CI</span>
                  <strong>{pacienteSeleccionado.documentoIdentidad}</strong>
                </div>
                <div>
                  <span className="label">Nombres</span>
                  <strong>{pacienteSeleccionado.nombres}</strong>
                </div>
                <div>
                  <span className="label">Apellidos</span>
                  <strong>{pacienteSeleccionado.apellidos}</strong>
                </div>
                <div>
                  <span className="label">Teléfono</span>
                  <strong>{pacienteSeleccionado.telefono || '—'}</strong>
                </div>
                <div>
                  <span className="label">Correo</span>
                  <strong>{pacienteSeleccionado.email || '—'}</strong>
                </div>
                <div>
                  <span className="label">Fecha de nacimiento</span>
                  <strong>{formatearFecha(pacienteSeleccionado.fechaNacimiento)}</strong>
                </div>
                <div>
                  <span className="label">Sexo</span>
                  <strong>{pacienteSeleccionado.sexo || '—'}</strong>
                </div>
                <div>
                  <span className="label">Dirección</span>
                  <strong>{pacienteSeleccionado.direccion || '—'}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
