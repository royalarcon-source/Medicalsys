import { useEffect, useState } from 'react';
import { auditoriaService, type AuditLog } from '../../services/auditoriaService';
import { ShieldCheck, RefreshCw, Filter, Clock } from 'lucide-react';

const BADGE_POR_RESULTADO: Record<string, string> = {
  EXITO: 'badge badge-atendida',
  ERROR: 'badge badge-cancelada',
  ACCESO_DENEGADO: 'badge badge-pendiente',
};

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroResultado, setFiltroResultado] = useState('');
  const [pagina, setPagina] = useState(1);
  const limite = 20;

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditoriaService.listar({
        accion: filtroAccion.trim() || undefined,
        resultado: filtroResultado || undefined,
        page: pagina,
        limit: limite,
      });
      setRegistros(res.registros || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el registro de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargarDatos();
  };

  const formatearFechaHora = (fechaStr: string) => {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPaginas = Math.ceil(total / limite) || 1;

  return (
    <section className="page auditoria-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <ShieldCheck size={22} className="text-primary" />
              <span>Registro de Auditoría</span>
            </h2>
            <p className="page-header-subtitle">
              Historial de eventos de seguridad, inicios de sesión y operaciones del sistema.
            </p>
          </div>
          <button type="button" onClick={cargarDatos} className="button-secondary">
            <RefreshCw size={15} />
            <span>Actualizar</span>
          </button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

        <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px', background: 'var(--bg-page)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label className="form-field" style={{ flex: '1 1 200px' }}>
            <span className="label">Acción:</span>
            <input
              type="text"
              placeholder="Ej. LOGIN_OK, LOGIN_FAIL..."
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
            />
          </label>

          <label className="form-field" style={{ flex: '1 1 180px' }}>
            <span className="label">Resultado:</span>
            <select value={filtroResultado} onChange={(e) => setFiltroResultado(e.target.value)}>
              <option value="">Todos los resultados</option>
              <option value="EXITO">ÉXITO</option>
              <option value="ERROR">ERROR</option>
              <option value="ACCESO_DENEGADO">ACCESO DENEGADO</option>
            </select>
          </label>

          <button type="submit" className="button-primary" style={{ height: '38px' }}>
            <Filter size={15} />
            <span>Filtrar</span>
          </button>
        </form>

        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando registros de auditoría...</p>
          </div>
        ) : registros.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={32} className="empty-state-icon" />
            <p>No se encontraron registros de auditoría.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha / Hora</th>
                    <th>Acción</th>
                    <th>Resultado</th>
                    <th>IP</th>
                    <th>User Agent / Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((item) => (
                    <tr key={item.idLog}>
                      <td><strong>#{item.idLog}</strong></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatearFechaHora(item.fechaHora)}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.accion}</strong>
                        {item.idUsuario && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Usuario ID #{item.idUsuario} ({item.rol || 'Sin rol'})
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={BADGE_POR_RESULTADO[item.resultado] || 'badge'}>
                          {item.resultado}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{item.ip || '—'}</td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.detalle || item.userAgent || ''}>
                          {item.detalle ? item.detalle : item.userAgent || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Mostrando página {pagina} de {totalPaginas} ({total} registros totales)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="button-secondary button-sm"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => p - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="button-secondary button-sm"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((p) => p + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
