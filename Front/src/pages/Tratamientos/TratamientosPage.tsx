import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarTratamientos,
  registrarTratamiento,
  type TratamientoItem,
} from '../../services/tratamientoService';
import { Pill, Plus, Save, CheckCircle2, AlertCircle, ArrowRight, Calendar } from 'lucide-react';

export default function TratamientosPage() {
  const { usuario } = useAuth();
  const [tratamientos, setTratamientos] = useState<TratamientoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    idConsulta: '',
    descripcion: '',
    indicaciones: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const puedeRegistrar = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO';

  const cargarTratamientos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listarTratamientos();
      setTratamientos(res.tratamientos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de tratamientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarTratamientos();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);

    if (!form.descripcion.trim()) {
      setError('La descripción del tratamiento es obligatoria.');
      return;
    }

    const idConsulta = Number(form.idConsulta);
    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      setError('Debe indicar una consulta válida.');
      return;
    }

    const inicio = form.fechaInicio?.trim();
    const fin = form.fechaFin?.trim();
    if (inicio && fin) {
      const inicioMs = new Date(`${inicio}T00:00:00.000Z`).getTime();
      const finMs = new Date(`${fin}T00:00:00.000Z`).getTime();
      if (Number.isNaN(inicioMs) || Number.isNaN(finMs) || inicioMs > finMs) {
        setError('La fecha fin debe ser mayor o igual a la fecha de inicio.');
        return;
      }
    }

    setGuardando(true);
    try {
      await registrarTratamiento({
        idConsulta,
        descripcion: form.descripcion.trim(),
        indicaciones: form.indicaciones.trim() || undefined,
        fechaInicio: inicio || undefined,
        fechaFin: fin || undefined,
      });

      setExito('Tratamiento registrado correctamente.');
      setForm({ idConsulta: '', descripcion: '', indicaciones: '', fechaInicio: '', fechaFin: '' });
      await cargarTratamientos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el tratamiento.');
    } finally {
      setGuardando(false);
    }
  };

  const tabla = useMemo(() => tratamientos, [tratamientos]);

  return (
    <section className="page tratamientos-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Pill size={22} className="text-primary" />
              <span>Tratamientos y Prescripciones</span>
            </h2>
            <p className="page-header-subtitle">
              Registro y consulta de planes de tratamiento e indicaciones farmacológicas emitidas en consulta.
            </p>
          </div>
          <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
            <button type="button" className="button-secondary">
              <span>Ir a Cola de Atención</span>
              <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      </div>

      {puedeRegistrar && (
        <div className="card">
          <h3>
            <Plus size={18} className="text-primary" />
            <span>Registrar Nuevo Tratamiento</span>
          </h3>
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
            <div className="form-row">
              <label className="form-field">
                <span className="label">ID de consulta *</span>
                <input
                  type="number"
                  min="1"
                  value={form.idConsulta}
                  onChange={(event) => setForm((current) => ({ ...current, idConsulta: event.target.value }))}
                  placeholder="Ej. 14"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span className="label">Descripción o Medicamento *</span>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                placeholder="Ej. Amoxicilina 500mg cápsulas / Fisioterapia kinesiológica..."
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Indicaciones / Posología</span>
              <textarea
                rows={2}
                value={form.indicaciones}
                onChange={(event) => setForm((current) => ({ ...current, indicaciones: event.target.value }))}
                placeholder="Instrucciones, dosis, frecuencia, precauciones..."
              />
            </label>

            <div className="form-row">
              <label className="form-field">
                <span className="label">Fecha de inicio</span>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(event) => setForm((current) => ({ ...current, fechaInicio: event.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="label">Fecha de fin</span>
                <input
                  type="date"
                  value={form.fechaFin}
                  onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
                />
              </label>
            </div>

            {error && (
              <div className="alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {exito && (
              <div className="alert-success">
                <CheckCircle2 size={16} />
                <span>{exito}</span>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={guardando}>
                <Save size={16} />
                <span>{guardando ? 'Guardando...' : 'Registrar tratamiento'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 10px', borderBottom: '1px solid var(--border)' }}>
          <h3>
            <Pill size={18} className="text-primary" />
            <span>Listado de Tratamientos</span>
          </h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Cargando tratamientos...</p>
          </div>
        ) : tabla.length === 0 ? (
          <div className="empty-state">
            <Pill size={32} className="empty-state-icon" />
            <p>No hay tratamientos registrados.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Consulta</th>
                  <th>Descripción</th>
                  <th>Indicaciones</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((tratamiento) => (
                  <tr key={tratamiento.idTratamiento}>
                    <td><strong>#{tratamiento.idTratamiento}</strong></td>
                    <td>
                      <span className="badge badge-neutral">
                        Consulta #{tratamiento.consulta?.idConsulta ?? '—'}
                      </span>
                    </td>
                    <td><strong>{tratamiento.descripcion}</strong></td>
                    <td>{tratamiento.indicaciones || '—'}</td>
                    <td>
                      {tratamiento.fechaInicio ? (
                        <span className="badge badge-confirmada">
                          <Calendar size={11} />
                          <span>{tratamiento.fechaInicio.slice(0, 10)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {tratamiento.fechaFin ? (
                        <span className="badge badge-confirmada">
                          <Calendar size={11} />
                          <span>{tratamiento.fechaFin.slice(0, 10)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
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
