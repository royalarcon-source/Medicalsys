import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buscarPacientes,
  obtenerDetallePaciente,
  type CriterioBusqueda,
  type PacienteDetalle,
  type PacienteResumen,
} from '../../services/pacientesService';
import {
  Users,
  Search,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  User,
} from 'lucide-react';

const CRITERIOS: { value: CriterioBusqueda; label: string }[] = [
  { value: 'ci', label: 'Documento CI' },
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
        <div className="page-header">
          <div>
            <h2>
              <Users size={22} className="text-primary" />
              <span>Consultar Pacientes</span>
            </h2>
            <p className="page-header-subtitle">
              Búsqueda en el padrón de pacientes registrados y acceso directo a historias clínicas.
            </p>
          </div>
        </div>

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
                ? 'Ingrese el documento CI...'
                : criterio === 'nombre'
                  ? 'Ingrese el nombre del paciente...'
                  : 'Ingrese el apellido del paciente...'
            }
            aria-label="Buscar paciente"
          />

          <button type="button" onClick={() => ejecutarBusqueda(1, valorBusqueda)}>
            <Search size={16} />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <Search size={32} className="empty-state-icon" />
            <p>Cargando pacientes...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '24px' }}>
            <div className="alert-error">{error}</div>
          </div>
        ) : resultados.length === 0 ? (
          <div className="empty-state">
            <Users size={32} className="empty-state-icon" />
            <p>No se encontraron pacientes para mostrar.</p>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Documento CI</th>
                    <th>Nombre Completo</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((paciente) => (
                    <tr key={paciente.idPaciente}>
                      <td>
                        <strong>{paciente.documentoIdentidad}</strong>
                      </td>
                      <td>{`${paciente.nombres} ${paciente.apellidos}`.trim()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="button-secondary button-sm"
                            onClick={() => abrirDetalle(paciente.idPaciente)}
                          >
                            <Eye size={14} />
                            <span>Ver Ficha</span>
                          </button>
                          <Link
                            to={`/historia-clinica?ci=${encodeURIComponent(paciente.documentoIdentidad)}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <button type="button" className="button-sm">
                              <FileText size={14} />
                              <span>Historia</span>
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                type="button"
                className="button-secondary button-sm"
                onClick={() => cambiarPagina(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </button>
              <span>
                Página {page} de {totalPages || 1}
              </span>
              <button
                type="button"
                className="button-secondary button-sm"
                onClick={() => cambiarPagina(page + 1)}
                disabled={page >= totalPages}
              >
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {pacienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setPacienteSeleccionado(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <User size={20} className="text-primary" />
                <span>Detalle del Paciente</span>
              </h3>
              <button type="button" className="button-secondary button-sm button-icon" onClick={() => setPacienteSeleccionado(null)}>
                <X size={16} />
              </button>
            </div>

            {loadingDetalle ? (
              <div className="empty-state">
                <p>Cargando detalle...</p>
              </div>
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
                <div style={{ gridColumn: '1 / -1', marginTop: '12px', background: 'transparent', border: 'none', padding: 0 }}>
                  <Link
                    to={`/historia-clinica?ci=${encodeURIComponent(pacienteSeleccionado.documentoIdentidad)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button type="button" style={{ width: '100%', justifyContent: 'center' }}>
                      <FileText size={16} />
                      <span>Ir a Historia Clínica Completa</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
