import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarTratamientos,
  registrarTratamiento,
  type TratamientoItem,
} from '../../services/tratamientoService';

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
    <section className="page">
      <div className="card">
        <h2>Tratamientos</h2>
        <p style={{ marginTop: '6px' }}>Registro y consulta de tratamientos indicados en atención.</p>
      </div>

      {puedeRegistrar && (
        <div className="card">
          <h3>Registrar tratamiento</h3>
          <form onSubmit={handleSubmit} className="form">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <label className="form-field" style={{ minWidth: '180px', flex: '1' }}>
                <span className="label">ID de consulta *</span>
                <input
                  type="number"
                  min="1"
                  value={form.idConsulta}
                  onChange={(event) => setForm((current) => ({ ...current, idConsulta: event.target.value }))}
                  placeholder="Ej: 14"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span className="label">Descripción *</span>
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                placeholder="Ej: Metformina 850 mg cada 12 horas"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Indicaciones</span>
              <textarea
                rows={3}
                value={form.indicaciones}
                onChange={(event) => setForm((current) => ({ ...current, indicaciones: event.target.value }))}
                placeholder="Instrucciones, dosis, horario, precauciones..."
              />
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <label className="form-field" style={{ minWidth: '180px', flex: '1' }}>
                <span className="label">Fecha de inicio</span>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(event) => setForm((current) => ({ ...current, fechaInicio: event.target.value }))}
                />
              </label>

              <label className="form-field" style={{ minWidth: '180px', flex: '1' }}>
                <span className="label">Fecha de fin</span>
                <input
                  type="date"
                  value={form.fechaFin}
                  onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
                />
              </label>
            </div>

            {error && <p className="error">{error}</p>}
            {exito && <p className="success">{exito}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar tratamiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3>Listado</h3>
          <Link to="/consultas/cola">
            <button type="button" className="button-secondary">Ir a atención</button>
          </Link>
        </div>

        {loading ? (
          <p>Cargando tratamientos...</p>
        ) : tabla.length === 0 ? (
          <p>No hay tratamientos registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Consulta</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Indicaciones</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Desde</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Hasta</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((tratamiento) => (
                  <tr key={tratamiento.idTratamiento}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{tratamiento.idTratamiento}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {tratamiento.consulta?.idConsulta ?? '—'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{tratamiento.descripcion}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {tratamiento.indicaciones || '—'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {tratamiento.fechaInicio ? tratamiento.fechaInicio.slice(0, 10) : '—'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {tratamiento.fechaFin ? tratamiento.fechaFin.slice(0, 10) : '—'}
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
