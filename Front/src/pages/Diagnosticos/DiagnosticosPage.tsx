import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarDiagnosticos,
  registrarDiagnostico,
  type DiagnosticoItem,
} from '../../services/diagnosticoService';

export default function DiagnosticosPage() {
  const { usuario } = useAuth();
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    idConsulta: '',
    codigo: '',
    descripcion: '',
    tipo: 'DEFINITIVO',
  });

  const puedeRegistrar = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'MEDICO';

  const cargarDiagnosticos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listarDiagnosticos();
      setDiagnosticos(res.diagnosticos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de diagnósticos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDiagnosticos();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);

    if (!form.descripcion.trim()) {
      setError('La descripción del diagnóstico es obligatoria.');
      return;
    }

    const idConsulta = Number(form.idConsulta);
    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      setError('Debe indicar una consulta válida.');
      return;
    }

    setGuardando(true);
    try {
      await registrarDiagnostico({
        idConsulta,
        codigo: form.codigo.trim() || undefined,
        descripcion: form.descripcion.trim(),
        tipo: form.tipo,
      });

      setExito('Diagnóstico registrado correctamente.');
      setForm({ idConsulta: '', codigo: '', descripcion: '', tipo: 'DEFINITIVO' });
      await cargarDiagnosticos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el diagnóstico.');
    } finally {
      setGuardando(false);
    }
  };

  const tabla = useMemo(() => diagnosticos, [diagnosticos]);

  return (
    <section className="page">
      <div className="card">
        <h2>Diagnósticos</h2>
        <p style={{ marginTop: '6px' }}>Registro y consulta de diagnósticos clínicos por consulta.</p>
      </div>

      {puedeRegistrar && (
        <div className="card">
          <h3>Registrar diagnóstico</h3>
          <form onSubmit={handleSubmit} className="form">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <label className="form-field" style={{ minWidth: '180px', flex: '1' }}>
                <span className="label">ID de consulta *</span>
                <input
                  type="number"
                  min="1"
                  value={form.idConsulta}
                  onChange={(event) => setForm((current) => ({ ...current, idConsulta: event.target.value }))}
                  placeholder="Ej: 12"
                  required
                />
              </label>

              <label className="form-field" style={{ minWidth: '160px', flex: '1' }}>
                <span className="label">Código</span>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
                  placeholder="E10.9"
                />
              </label>

              <label className="form-field" style={{ minWidth: '180px', flex: '1' }}>
                <span className="label">Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}
                >
                  <option value="DEFINITIVO">DEFINITIVO</option>
                  <option value="PRESUNTIVO">PRESUNTIVO</option>
                </select>
              </label>
            </div>

            <label className="form-field">
              <span className="label">Descripción *</span>
              <textarea
                rows={4}
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                placeholder="Describa el diagnóstico clínico..."
                required
              />
            </label>

            {error && <p className="error">{error}</p>}
            {exito && <p className="success">{exito}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar diagnóstico'}
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
          <p>Cargando diagnósticos...</p>
        ) : tabla.length === 0 ? (
          <p>No hay diagnósticos registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Consulta</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((diagnostico) => (
                  <tr key={diagnostico.idDiagnostico}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{diagnostico.idDiagnostico}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {diagnostico.consulta?.idConsulta ?? '—'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {diagnostico.codigo || '—'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {diagnostico.tipo || 'DEFINITIVO'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {diagnostico.descripcion}
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
