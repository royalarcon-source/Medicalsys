import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listarServiciosPorConsulta,
  registrarServiciosAtencion,
  actualizarServicioAtencion,
  eliminarServicioAtencion,
  type AtencionServicioItem,
} from '../services/atencionServicioService';
import { listarServicios, type ServicioItem } from '../services/facturaService';
import {
  Receipt,
  Plus,
  Trash2,
  Lock,
  Edit2,
  Check,
  X,
  CreditCard,
  Layers,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Props {
  idConsulta?: number;
  idPaciente: number;
  nombrePaciente?: string;
  soloLectura?: boolean;
  onActualizarTotal?: (total: number) => void;
}

export default function SeccionServiciosConsulta({
  idConsulta,
  idPaciente,
  nombrePaciente,
  soloLectura = false,
  onActualizarTotal,
}: Props) {
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioItem[]>([]);
  const [serviciosRegistrados, setServiciosRegistrados] = useState<AtencionServicioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Formulario de nuevo servicio
  const [idServicioSeleccionado, setIdServicioSeleccionado] = useState<string>('');
  const [cantidadNueva, setCantidadNueva] = useState<number>(1);
  const [precioPersonalizado, setPrecioPersonalizado] = useState<string>('');
  const [observacionesNuevas, setObservacionesNuevas] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  // Edición en línea de un servicio ya registrado
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cantidadEdit, setCantidadEdit] = useState<number>(1);
  const [observacionesEdit, setObservacionesEdit] = useState<string>('');
  const [actualizando, setActualizando] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cat] = await Promise.all([
        listarServicios(),
      ]);
      setServiciosCatalogo(cat.filter((s) => s.activo));

      if (idConsulta) {
        const resConsulta = await listarServiciosPorConsulta(idConsulta);
        setServiciosRegistrados(resConsulta.items || []);
        if (onActualizarTotal) {
          onActualizarTotal(resConsulta.totalAcumulado || 0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [idConsulta, idPaciente]);

  // Manejar cambio de selección en el catálogo
  const handleSelectServicio = (idStr: string) => {
    setIdServicioSeleccionado(idStr);
    if (!idStr) {
      setPrecioPersonalizado('');
      return;
    }
    const serv = serviciosCatalogo.find((s) => s.idServicio === Number(idStr));
    if (serv) {
      setPrecioPersonalizado(String(serv.precio));
    }
  };

  // Registrar nuevo servicio
  const handleAgregarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idServicioSeleccionado) {
      setError('Debes seleccionar un servicio o procedimiento del catálogo.');
      return;
    }

    if (cantidadNueva <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(null);

    try {
      const precioNum = precioPersonalizado ? Number(precioPersonalizado) : undefined;
      await registrarServiciosAtencion({
        idPaciente,
        idConsulta,
        items: [
          {
            idServicio: Number(idServicioSeleccionado),
            cantidad: cantidadNueva,
            precioUnitario: precioNum,
            observaciones: observacionesNuevas.trim() || undefined,
          },
        ],
      });

      setExito('Servicio registrado exitosamente en la atención.');
      setIdServicioSeleccionado('');
      setCantidadNueva(1);
      setPrecioPersonalizado('');
      setObservacionesNuevas('');
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el servicio.');
    } finally {
      setGuardando(false);
    }
  };

  // Iniciar edición de un servicio existente
  const handleIniciarEdicion = (item: AtencionServicioItem) => {
    if (item.estado === 'FACTURADO' || item.idFactura) {
      setError('No se pueden modificar servicios que ya cuentan con una factura emitida.');
      return;
    }
    setEditandoId(item.idAtencionServicio);
    setCantidadEdit(item.cantidad);
    setObservacionesEdit(item.observaciones || '');
    setError(null);
  };

  // Guardar edición
  const handleGuardarEdicion = async (idAtencionServicio: number) => {
    if (cantidadEdit <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    setActualizando(true);
    setError(null);
    try {
      await actualizarServicioAtencion(idAtencionServicio, {
        cantidad: cantidadEdit,
        observaciones: observacionesEdit.trim() || undefined,
      });

      setExito('Servicio actualizado correctamente.');
      setEditandoId(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el servicio.');
    } finally {
      setActualizando(false);
    }
  };

  // Eliminar servicio
  const handleEliminar = async (idAtencionServicio: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio de la atención médica?')) {
      return;
    }

    setError(null);
    setExito(null);
    try {
      await eliminarServicioAtencion(idAtencionServicio);
      setExito('Servicio eliminado de la atención.');
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el servicio.');
    }
  };

  const totalAcumulado = serviciosRegistrados.reduce(
    (acc, curr) => acc + Number(curr.subtotal || 0),
    0
  );

  const hayFacturados = serviciosRegistrados.some(
    (s) => s.estado === 'FACTURADO' || s.idFactura !== null
  );

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.1rem' }}>
            <Receipt size={20} className="text-primary" />
            <span>Servicios, Procedimientos e Insumos Prestados (AR-31)</span>
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            {nombrePaciente ? `Prestaciones médicas para ${nombrePaciente}. ` : ''}
            Registra los servicios clínicos realizados durante la atención médica para su posterior facturación y cobro.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-confirmada" style={{ fontSize: '13px', padding: '4px 10px' }}>
            <Layers size={13} />
            <span>{serviciosRegistrados.length} {serviciosRegistrados.length === 1 ? 'servicio' : 'servicios'}</span>
          </span>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              background: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              padding: '4px 12px',
              borderRadius: '8px',
              border: '1px solid var(--primary-border)',
            }}
          >
            Total: {totalAcumulado.toFixed(2)} Bs
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '14px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="alert-success" style={{ marginBottom: '14px' }}>
          <Check size={16} />
          <span>{exito}</span>
        </div>
      )}

      {/* Formulario para agregar nuevo servicio si no es soloLectura */}
      {!soloLectura && (
        <form
          onSubmit={handleAgregarServicio}
          style={{
            background: 'var(--bg-page)',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          <span className="label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
            Añadir Servicio / Insumo a la Atención:
          </span>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-field" style={{ flex: '2 1 240px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Servicio del Tarifario *</span>
              <select
                value={idServicioSeleccionado}
                onChange={(e) => handleSelectServicio(e.target.value)}
                disabled={guardando}
                required
              >
                <option value="">-- Seleccionar servicio o procedimiento --</option>
                {serviciosCatalogo.map((s) => (
                  <option key={s.idServicio} value={s.idServicio}>
                    {s.nombre} — {Number(s.precio).toFixed(2)} Bs
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field" style={{ width: '100px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Cantidad *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={cantidadNueva}
                onChange={(e) => setCantidadNueva(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={guardando}
                required
              />
            </label>

            <label className="form-field" style={{ width: '120px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Precio (Bs)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioPersonalizado}
                onChange={(e) => setPrecioPersonalizado(e.target.value)}
                disabled={guardando}
                placeholder="0.00"
              />
            </label>

            <label className="form-field" style={{ flex: '2 1 200px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Observaciones / Detalle Clínico</span>
              <input
                type="text"
                value={observacionesNuevas}
                onChange={(e) => setObservacionesNuevas(e.target.value)}
                disabled={guardando}
                placeholder="Ej. Curación simple, 2 ampollas..."
              />
            </label>

            <button
              type="submit"
              disabled={guardando || !idServicioSeleccionado}
              style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>{guardando ? 'Agregando...' : 'Agregar Servicio'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de servicios registrados */}
      <div>
        <span className="label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
          Servicios Registrados en la Consulta:
        </span>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
            Cargando servicios asociados...
          </div>
        ) : serviciosRegistrados.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              background: 'var(--bg-page)',
              borderRadius: '8px',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
            No hay servicios ni insumos registrados todavía para esta atención.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Servicio / Procedimiento</th>
                  <th style={{ textAlign: 'left' }}>Observaciones</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Cant.</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>P. Unit (Bs)</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Subtotal (Bs)</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Estado</th>
                  {!soloLectura && <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {serviciosRegistrados.map((item) => {
                  const esFacturado = item.estado === 'FACTURADO' || item.idFactura !== null;
                  const enEdicion = editandoId === item.idAtencionServicio;

                  return (
                    <tr key={item.idAtencionServicio}>
                      <td style={{ fontWeight: 600 }}>
                        {item.servicio?.nombre || `Servicio #${item.idServicio}`}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {enEdicion ? (
                          <input
                            type="text"
                            value={observacionesEdit}
                            onChange={(e) => setObservacionesEdit(e.target.value)}
                            style={{ width: '100%', fontSize: '12px' }}
                            placeholder="Observación..."
                          />
                        ) : (
                          item.observaciones || '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {enEdicion ? (
                          <input
                            type="number"
                            min="1"
                            value={cantidadEdit}
                            onChange={(e) => setCantidadEdit(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '60px', textAlign: 'center', fontSize: '12px' }}
                          />
                        ) : (
                          item.cantidad
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {Number(item.precioUnitario).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-text)' }}>
                        {enEdicion
                          ? (cantidadEdit * Number(item.precioUnitario)).toFixed(2)
                          : Number(item.subtotal).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {esFacturado ? (
                          <span
                            className="badge badge-atendida"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              padding: '2px 8px',
                            }}
                            title="Servicio ya facturado formalmente. Modificaciones bloqueadas."
                          >
                            <Lock size={11} />
                            <span>FACTURADO</span>
                          </span>
                        ) : (
                          <span
                            className="badge badge-pendiente"
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                          >
                            PENDIENTE
                          </span>
                        )}
                      </td>
                      {!soloLectura && (
                        <td style={{ textAlign: 'center' }}>
                          {esFacturado ? (
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                              }}
                            >
                              Bloqueado
                            </span>
                          ) : enEdicion ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="button-primary button-sm"
                                style={{ padding: '4px 6px' }}
                                onClick={() => handleGuardarEdicion(item.idAtencionServicio)}
                                disabled={actualizando}
                                title="Guardar cambios"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                style={{ padding: '4px 6px' }}
                                onClick={() => setEditandoId(null)}
                                disabled={actualizando}
                                title="Cancelar edición"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                style={{ padding: '4px 6px' }}
                                onClick={() => handleIniciarEdicion(item)}
                                title="Editar cantidad u observaciones"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="button-outline-danger button-sm"
                                style={{ padding: '4px 6px' }}
                                onClick={() => handleEliminar(item.idAtencionServicio)}
                                title="Eliminar servicio"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer / Barra de Facturación rápida */}
      {serviciosRegistrados.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: 'var(--bg-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {hayFacturados ? (
              <span>
                🔒 Esta atención contiene servicios <strong>facturados</strong>.
              </span>
            ) : (
              <span>
                💡 Los servicios registrados están listos para ser emitidos en la factura digital.
              </span>
            )}
          </div>

          <Link
            to={`/facturacion?pacienteId=${idPaciente}${idConsulta ? `&consultaId=${idConsulta}` : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <button
              type="button"
              className="button-primary button-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CreditCard size={15} />
              <span>Ir a Facturar Esta Atención ({totalAcumulado.toFixed(2)} Bs)</span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
