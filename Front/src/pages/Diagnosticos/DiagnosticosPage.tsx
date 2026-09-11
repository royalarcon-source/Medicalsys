import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarDiagnosticos,
  registrarDiagnostico,
  type DiagnosticoItem,
} from '../../services/diagnosticoService';
import { FileText, Plus, Save, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

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
    <section className="page diagnosticos-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <FileText size={22} className="text-primary" />
              <span>Diagnósticos Clínicos</span>
            </h2>
            <p className="page-header-subtitle">
              Registro y consulta de diagnósticos clínicos asociados a consultas médicas.
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
            <span>Registrar Nuevo Diagnóstico</span>
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
                  placeholder="Ej. 12"
                  required
                />
              </label>

              <label className="form-field">
                <span className="label">Código (CIE-10)</span>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
                  placeholder="Ej. E10.9"
                />
              </label>

              <label className="form-field">
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
                rows={3}
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                placeholder="Describa el diagnóstico clínico..."
                required
              />
            </label>

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
                <span>{guardando ? 'Guardando...' : 'Registrar diagnóstico'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 10px', borderBottom: '1px solid var(--border)' }}>
          <h3>
            <FileText size={18} className="text-primary" />
            <span>Listado de Diagnósticos</span>
          </h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Cargando diagnósticos...</p>
          </div>
        ) : tabla.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} className="empty-state-icon" />
            <p>No hay diagnósticos registrados.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Consulta</th>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((diagnostico) => (
                  <tr key={diagnostico.idDiagnostico}>
                    <td><strong>#{diagnostico.idDiagnostico}</strong></td>
                    <td>
                      <span className="badge badge-neutral">
                        Consulta #{diagnostico.consulta?.idConsulta ?? '—'}
                      </span>
                    </td>
                    <td>
                      {diagnostico.codigo ? (
                        <code>{diagnostico.codigo}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={diagnostico.tipo === 'DEFINITIVO' ? 'badge badge-atendida' : 'badge badge-pendiente'}>
                        {diagnostico.tipo || 'DEFINITIVO'}
                      </span>
                    </td>
                    <td>{diagnostico.descripcion}</td>
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
