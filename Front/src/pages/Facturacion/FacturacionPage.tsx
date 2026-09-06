import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listarServicios,
  crearServicio,
  emitirFactura,
  listarFacturas,
  obtenerPendientesDeFacturacion,
  type ServicioItem,
  type FacturaItem,
  type PendienteFacturacion,
} from '../../services/facturaService';
import { buscarPacientes, type PacienteResumen } from '../../services/pacientesService';
import ModalVisorFactura from '../../components/ModalVisorFactura';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Trash2,
  Printer,
  FileText,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LineaFactura {
  idServicio: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  // AtencionServicio pendientes que esta línea representa (si viene de "Atenciones recientes").
  // Ausente cuando la línea se agregó manualmente desde el catálogo.
  idsAtencionServicio?: number[];
}

export default function FacturacionPage() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const esCajero = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RECEPCIONISTA';

  const [tab, setTab] = useState<'emitir' | 'historial' | 'catalogo'>(esCajero ? 'emitir' : 'historial');

  // Estados generales
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Visor de Factura Modal
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaItem | null>(null);

  // Estados para EMITIR FACTURA
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [resultadosPacientes, setResultadosPacientes] = useState<PacienteResumen[]>([]);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteResumen | null>(null);

  const [pendientes, setPendientes] = useState<PendienteFacturacion[]>([]);

  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState<number | ''>('');
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

  const [nitCliente, setNitCliente] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<'ninguno' | 'porcentaje' | 'monto'>('ninguno');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const [estadoPago, setEstadoPago] = useState<'EMITIDA' | 'PAGADA'>('PAGADA');
  const [emitiendo, setEmitiendo] = useState(false);

  // Estados para HISTORIAL
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados para CATÁLOGO DE SERVICIOS
  const [nombreNuevoServicio, setNombreNuevoServicio] = useState('');
  const [descripcionNuevoServicio, setDescripcionNuevoServicio] = useState('');
  const [precioNuevoServicio, setPrecioNuevoServicio] = useState<number | ''>('');
  const [creandoServicio, setCreandoServicio] = useState(false);

  // Carga inicial
  useEffect(() => {
    cargarDatos();
  }, []);

  // Prellenar paciente si viene en searchParams (?pacienteId=X&consultaId=Y)
  useEffect(() => {
    const pacienteIdParam = searchParams.get('pacienteId');
    const consultaIdParam = searchParams.get('consultaId');
    if (pacienteIdParam) {
      cargarPacienteDesdeParams(Number(pacienteIdParam), consultaIdParam ? Number(consultaIdParam) : undefined);
    }
  }, [searchParams]);

  const cargarPacienteDesdeParams = async (idPaciente: number, idConsulta?: number) => {
    try {
      const res = await buscarPacientes({ criterio: 'nombre', valor: '', limit: 100 });
      const pac = res.resultados?.find((p) => p.idPaciente === idPaciente);
      if (pac) {
        setPacienteSeleccionado(pac);
        setNitCliente(pac.documentoIdentidad || '');
        setRazonSocial(`${pac.nombres} ${pac.apellidos}`.trim());

        const pends = await obtenerPendientesDeFacturacion(pac.idPaciente);
        setPendientes(pends);

        if (idConsulta) {
          const consultaPend = pends.find((p) => p.idConsulta === idConsulta);
          if (consultaPend) {
            handleAgregarPendiente(consultaPend);
          }
        }
      }
    } catch (err) {
      console.error('Error al prellenar paciente desde URL:', err);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [servs, facts] = await Promise.all([
        listarServicios(),
        listarFacturas(),
      ]);
      setServicios(servs);
      setFacturas(facts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de facturación');
    } finally {
      setCargando(false);
    }
  };

  // Buscar paciente por CI o nombre
  const handleBuscarPaciente = async () => {
    if (!busquedaPaciente.trim()) return;
    setBuscandoPaciente(true);
    setError(null);
    try {
      const res = await buscarPacientes({
        criterio: 'nombre',
        valor: busquedaPaciente.trim(),
        limit: 5,
      });
      let lista = res.resultados || [];
      if (lista.length === 0) {
        const resCI = await buscarPacientes({
          criterio: 'ci',
          valor: busquedaPaciente.trim(),
          limit: 5,
        });
        lista = resCI.resultados || [];
      }
      setResultadosPacientes(lista);
      if (lista.length === 0) {
        setError('No se encontraron pacientes con ese criterio.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar paciente');
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // Seleccionar paciente
  const handleSeleccionarPaciente = async (paciente: PacienteResumen) => {
    setPacienteSeleccionado(paciente);
    setResultadosPacientes([]);
    setBusquedaPaciente('');

    // Prellenar datos fiscales
    setNitCliente(paciente.documentoIdentidad || '');
    setRazonSocial(`${paciente.nombres} ${paciente.apellidos}`.trim());

    // Cargar atenciones/consultas pendientes
    try {
      const pends = await obtenerPendientesDeFacturacion(paciente.idPaciente);
      setPendientes(pends);
    } catch {
      setPendientes([]);
    }
  };

  // Agregar ítem desde catálogo
  const handleAgregarLinea = () => {
    if (!servicioSeleccionadoId) return;
    const serv = servicios.find((s) => s.idServicio === Number(servicioSeleccionadoId));
    if (!serv) return;

    const existeIndex = lineas.findIndex((l) => l.idServicio === serv.idServicio);
    if (existeIndex >= 0) {
      const actualizadas = [...lineas];
      actualizadas[existeIndex].cantidad += cantidadSeleccionada;
      setLineas(actualizadas);
    } else {
      setLineas([
        ...lineas,
        {
          idServicio: serv.idServicio,
          nombre: serv.nombre,
          precioUnitario: Number(serv.precio),
          cantidad: cantidadSeleccionada,
        },
      ]);
    }
    setServicioSeleccionadoId('');
    setCantidadSeleccionada(1);
  };

  // Agregar consulta pendiente sugerida o servicios registrados
  const handleAgregarPendiente = (pend: PendienteFacturacion) => {
    if (pend.serviciosRegistrados && pend.serviciosRegistrados.length > 0) {
      const actualizadas = [...lineas];
      for (const s of pend.serviciosRegistrados) {
        const existeIndex = actualizadas.findIndex((l) => l.idServicio === s.idServicio);
        if (existeIndex >= 0) {
          actualizadas[existeIndex].cantidad += s.cantidad;
          actualizadas[existeIndex].idsAtencionServicio = [
            ...(actualizadas[existeIndex].idsAtencionServicio || []),
            s.idAtencionServicio,
          ];
        } else {
          actualizadas.push({
            idServicio: s.idServicio,
            nombre: `${s.nombre}${s.observaciones ? ` (${s.observaciones})` : ''}`,
            precioUnitario: s.precioUnitario,
            cantidad: s.cantidad,
            idsAtencionServicio: [s.idAtencionServicio],
          });
        }
      }
      setLineas(actualizadas);
      return;
    }

    if (pend.servicioSugerido) {
      const idServ = pend.servicioSugerido.idServicio;
      const existeIndex = lineas.findIndex((l) => l.idServicio === idServ);
      if (existeIndex >= 0) {
        const actualizadas = [...lineas];
        actualizadas[existeIndex].cantidad += 1;
        setLineas(actualizadas);
      } else {
        setLineas([
          ...lineas,
          {
            idServicio: idServ,
            nombre: `${pend.servicioSugerido.nombre} (${pend.especialidad})`,
            precioUnitario: pend.servicioSugerido.precio,
            cantidad: 1,
          },
        ]);
      }
    } else if (servicios.length > 0) {
      const primerServ = servicios[0];
      setLineas([
        ...lineas,
        {
          idServicio: primerServ.idServicio,
          nombre: `${primerServ.nombre} (${pend.motivo})`,
          precioUnitario: Number(primerServ.precio),
          cantidad: 1,
        },
      ]);
    }
  };

  const handleEliminarLinea = (index: number) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const handleCambiarCantidad = (index: number, delta: number) => {
    const actualizadas = [...lineas];
    const nuevaCant = actualizadas[index].cantidad + delta;
    if (nuevaCant > 0) {
      actualizadas[index].cantidad = nuevaCant;
      setLineas(actualizadas);
    }
  };

  // Cálculos matemáticos
  const subtotalCalculado = lineas.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);

  let montoDescuentoCalculado = 0;
  if (tipoDescuento === 'porcentaje') {
    montoDescuentoCalculado = Number(((subtotalCalculado * (valorDescuento || 0)) / 100).toFixed(2));
  } else if (tipoDescuento === 'monto') {
    montoDescuentoCalculado = Number((valorDescuento || 0).toFixed(2));
  }
  if (montoDescuentoCalculado > subtotalCalculado) {
    montoDescuentoCalculado = subtotalCalculado;
  }

  const totalCalculado = Number((subtotalCalculado - montoDescuentoCalculado).toFixed(2));

  // Enviar y Emitir Factura
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado) {
      setError('Debe seleccionar un paciente para emitir la factura.');
      return;
    }
    if (lineas.length === 0) {
      setError('Debe añadir al menos un servicio a la factura.');
      return;
    }

    setEmitiendo(true);
    setError(null);
    setMensajeExito(null);

    try {
      const payload = {
        idPaciente: pacienteSeleccionado.idPaciente,
        nitCliente: nitCliente.trim(),
        razonSocial: razonSocial.trim(),
        items: lineas.map((l) => ({
          idServicio: l.idServicio,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
        descuento: tipoDescuento === 'monto' ? valorDescuento : undefined,
        porcentajeDescuento: tipoDescuento === 'porcentaje' ? valorDescuento : undefined,
        estado: estadoPago,
        idsAtencionServicio: lineas.flatMap((l) => l.idsAtencionServicio || []),
      };

      const res = await emitirFactura(payload);
      setMensajeExito(`¡Factura ${res.factura.numeroFactura} emitida exitosamente por Bs. ${res.factura.total}!`);
      setFacturaSeleccionada(res.factura);

      // Limpiar formulario
      setPacienteSeleccionado(null);
      setLineas([]);
      setNitCliente('');
      setRazonSocial('');
      setValorDescuento(0);
      setTipoDescuento('ninguno');
      setPendientes([]);

      // Recargar historial
      const facts = await listarFacturas();
      setFacturas(facts);
    } catch (err: any) {
      setError(err.message || 'Error al emitir factura');
    } finally {
      setEmitiendo(false);
    }
  };

  // Crear nuevo servicio
  const handleCrearServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoServicio.trim() || precioNuevoServicio === '') {
      setError('El nombre y precio son obligatorios.');
      return;
    }

    setCreandoServicio(true);
    setError(null);
    try {
      const nuevo = await crearServicio({
        nombre: nombreNuevoServicio.trim(),
        descripcion: descripcionNuevoServicio.trim(),
        precio: Number(precioNuevoServicio),
      });
      setServicios([...servicios, nuevo]);
      setMensajeExito(`Servicio "${nuevo.nombre}" agregado con éxito.`);
      setNombreNuevoServicio('');
      setDescripcionNuevoServicio('');
      setPrecioNuevoServicio('');
    } catch (err: any) {
      setError(err.message || 'Error al crear servicio');
    } finally {
      setCreandoServicio(false);
    }
  };

  // Filtrado de historial
  const facturasFiltradas = facturas.filter((f) => {
    if (filtroEstado && f.estado !== filtroEstado) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      const num = f.numeroFactura?.toLowerCase() || '';
      const nit = f.nitCliente?.toLowerCase() || '';
      const rz = f.razonSocial?.toLowerCase() || '';
      const pac = `${f.paciente?.usuario?.nombres || ''} ${f.paciente?.usuario?.apellidos || ''}`.toLowerCase();
      if (!num.includes(q) && !nit.includes(q) && !rz.includes(q) && !pac.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                backgroundColor: '#e0f2fe',
                padding: '8px',
                borderRadius: '8px',
                color: '#0284c7',
                display: 'flex',
              }}
            >
              <Receipt size={24} />
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Facturación y Cobro de Servicios (AR-32)
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Emisión de comprobantes digitales vinculados a servicios y atenciones médicas.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
          {esCajero && (
            <button
              type="button"
              onClick={() => { setTab('emitir'); setError(null); setMensajeExito(null); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: tab === 'emitir' ? '#ffffff' : 'transparent',
                color: tab === 'emitir' ? '#0284c7' : '#64748b',
                boxShadow: tab === 'emitir' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Emitir Factura
            </button>
          )}

          <button
            type="button"
            onClick={() => { setTab('historial'); setError(null); setMensajeExito(null); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === 'historial' ? '#ffffff' : 'transparent',
              color: tab === 'historial' ? '#0284c7' : '#64748b',
              boxShadow: tab === 'historial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Historial de Facturas
          </button>

          {esCajero && (
            <button
              type="button"
              onClick={() => { setTab('catalogo'); setError(null); setMensajeExito(null); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: tab === 'catalogo' ? '#ffffff' : 'transparent',
                color: tab === 'catalogo' ? '#0284c7' : '#64748b',
                boxShadow: tab === 'catalogo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Catálogo de Servicios
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {mensajeExito && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: EMITIR FACTURA */}
      {tab === 'emitir' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Left Column: Form & Item Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Paciente */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#0284c7" />
                1. Selección del Paciente
              </h3>

              {!pacienteSeleccionado ? (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por CI, nombre o apellido..."
                      value={busquedaPaciente}
                      onChange={(e) => setBusquedaPaciente(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBuscarPaciente()}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleBuscarPaciente}
                      disabled={buscandoPaciente}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Search size={16} />
                      <span>{buscandoPaciente ? 'Buscando...' : 'Buscar'}</span>
                    </button>
                  </div>

                  {resultadosPacientes.length > 0 && (
                    <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                      {resultadosPacientes.map((p) => (
                        <div
                          key={p.idPaciente}
                          onClick={() => handleSeleccionarPaciente(p)}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {p.nombres} {p.apellidos}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              CI: {p.documentoIdentidad} • Sexo: {p.sexo || 'N/E'}
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>Seleccionar →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '12px 16px',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '15px' }}>
                      {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                    </div>
                    <div style={{ fontSize: '13px', color: '#0284c7', marginTop: '2px' }}>
                      CI: {pacienteSeleccionado.documentoIdentidad} • Sexo: {pacienteSeleccionado.sexo || 'N/E'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPacienteSeleccionado(null);
                      setPendientes([]);
                      setLineas([]);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Atenciones Pendientes Sugeridas */}
            {pacienteSeleccionado && pendientes.length > 0 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#d97706" />
                  Atenciones recientes del paciente (Clic para agregar a factura)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendientes.map((pend) => (
                    <div
                      key={pend.idConsulta}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#92400e' }}>
                          {pend.motivo} — {pend.especialidad}
                        </div>
                        <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                          Atendido por: {pend.medico}
                        </div>
                        {pend.serviciosRegistrados && pend.serviciosRegistrados.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#78350f', marginTop: '4px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                            Servicios registrados: {pend.serviciosRegistrados.map((s) => `${s.nombre} (x${s.cantidad})`).join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarPendiente(pend)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        <span>
                          Añadir (Bs. {pend.totalServiciosRegistrados ? Number(pend.totalServiciosRegistrados).toFixed(2) : (pend.servicioSugerido?.precio ? Number(pend.servicioSugerido.precio).toFixed(2) : '150.00')})
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Añadir Servicios del Catálogo */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#0284c7" />
                2. Agregar Servicios Médicos
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Servicio del Catálogo
                  </label>
                  <select
                    className="form-control"
                    value={servicioSeleccionadoId}
                    onChange={(e) => setServicioSeleccionadoId(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="">-- Seleccionar servicio --</option>
                    {servicios.map((s) => (
                      <option key={s.idServicio} value={s.idServicio}>
                        {s.nombre} — Bs. {Number(s.precio).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={cantidadSeleccionada}
                    onChange={(e) => setCantidadSeleccionada(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAgregarLinea}
                  disabled={!servicioSeleccionadoId}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                >
                  <Plus size={16} />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Detalle de ítems añadidos */}
              <div style={{ marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '8px 4px', textAlign: 'left' }}>Servicio</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center', width: '80px' }}>Cant.</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right', width: '90px' }}>P. Unit</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right', width: '90px' }}>Subtotal</th>
                      <th style={{ padding: '8px 4px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.length > 0 ? (
                      lineas.map((linea, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 4px', fontWeight: 600, color: '#0f172a' }}>
                            {linea.nombre}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidad(idx, -1)}
                                style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 600, minWidth: '20px' }}>{linea.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidad(idx, 1)}
                                style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                            Bs. {linea.precioUnitario.toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                            Bs. {(linea.precioUnitario * linea.cantidad).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleEliminarLinea(idx)}
                              style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Eliminar ítem"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          No hay servicios añadidos a la factura aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Fiscal Data & Emission Summary */}
          <div>
            <form
              onSubmit={handleEmitirFactura}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0284c7" />
                3. Datos Fiscales y Emisión
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  NIT o CI del Cliente / Paciente *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej. 12345678 o 10293847"
                  value={nitCliente}
                  onChange={(e) => setNitCliente(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Razón Social / Nombre a Facturar *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej. Juan Pérez o Empresa S.R.L."
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              {/* Descuentos */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Tag size={16} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Descuentos y Promociones</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipoDesc"
                      checked={tipoDescuento === 'ninguno'}
                      onChange={() => { setTipoDescuento('ninguno'); setValorDescuento(0); }}
                    />
                    Ninguno
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipoDesc"
                      checked={tipoDescuento === 'porcentaje'}
                      onChange={() => setTipoDescuento('porcentaje')}
                    />
                    Porcentaje (%)
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipoDesc"
                      checked={tipoDescuento === 'monto'}
                      onChange={() => setTipoDescuento('monto')}
                    />
                    Monto Fijo (Bs)
                  </label>
                </div>

                {tipoDescuento !== 'ninguno' && (
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={tipoDescuento === 'porcentaje' ? 'Porcentaje de descuento (ej. 10%)' : 'Monto de descuento en Bs'}
                    value={valorDescuento || ''}
                    onChange={(e) => setValorDescuento(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                )}
              </div>

              {/* Estado inicial */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Estado Inicial de la Factura
                </label>
                <select
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="PAGADA">PAGADA (Cobro efectuado en caja)</option>
                  <option value="EMITIDA">EMITIDA (Pendiente de pago)</option>
                </select>
              </div>

              {/* Totales Card */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>Bs. {subtotalCalculado.toFixed(2)}</span>
                </div>

                {montoDescuentoCalculado > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#16a34a' }}>
                    <span>Descuento aplicado:</span>
                    <span style={{ fontWeight: 600 }}>- Bs. {montoDescuentoCalculado.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                    borderTop: '2px solid #cbd5e1',
                    paddingTop: '10px',
                    marginTop: '6px',
                  }}
                >
                  <span>TOTAL A COBRAR:</span>
                  <span style={{ color: '#0284c7' }}>Bs. {totalCalculado.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={emitiendo || lineas.length === 0 || !pacienteSeleccionado}
                className="btn btn-primary"
                style={{
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: emitiendo || lineas.length === 0 || !pacienteSeleccionado ? 'not-allowed' : 'pointer',
                  opacity: emitiendo || lineas.length === 0 || !pacienteSeleccionado ? 0.6 : 1,
                }}
              >
                <Receipt size={18} />
                <span>{emitiendo ? 'Emitiendo comprobante...' : 'Emitir Factura Digital'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE FACTURAS */}
      {tab === 'historial' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Buscar por N° factura, NIT, razón social o paciente..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ width: '160px' }}>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="">Todos los estados</option>
                <option value="EMITIDA">EMITIDA</option>
                <option value="PAGADA">PAGADA</option>
                <option value="ANULADA">ANULADA</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={cargarDatos}
              disabled={cargando}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              {cargando ? 'Actualizando...' : 'Refrescar'}
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>N° Factura</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Fecha Emisión</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Razón Social / Paciente</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>NIT / CI</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (Bs)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.length > 0 ? (
                  facturasFiltradas.map((f) => (
                    <tr key={f.idFactura} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {f.numeroFactura}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(f.fechaEmision).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.razonSocial || 'Cliente General'}</div>
                        {f.paciente?.usuario && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Pac: {f.paciente.usuario.nombres} {f.paciente.usuario.apellidos}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#334155' }}>
                        {f.nitCliente || f.paciente?.documentoIdentidad || '0'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                        Bs. {Number(f.total).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: f.estado === 'PAGADA' ? '#dcfce7' : f.estado === 'EMITIDA' ? '#e0f2fe' : '#fee2e2',
                            color: f.estado === 'PAGADA' ? '#166534' : f.estado === 'EMITIDA' ? '#0369a1' : '#991b1b',
                          }}
                        >
                          {f.estado}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setFacturaSeleccionada(f)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Printer size={14} />
                          <span>Ver / Imprimir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron facturas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGO DE SERVICIOS */}
      {tab === 'catalogo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Listado de servicios */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Servicios Médicos Disponibles ({servicios.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {servicios.map((s) => (
                <div
                  key={s.idServicio}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.nombre}</div>
                    {s.descripcion && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.descripcion}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7' }}>
                    Bs. {Number(s.precio).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario nuevo servicio */}
          <div>
            <form
              onSubmit={handleCrearServicio}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#0284c7" />
                Registrar Nuevo Servicio Médico
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Resonancia Magnética Cerebral"
                  value={nombreNuevoServicio}
                  onChange={(e) => setNombreNuevoServicio(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el procedimiento..."
                  value={descripcionNuevoServicio}
                  onChange={(e) => setDescripcionNuevoServicio(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Precio Base (Bs) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={precioNuevoServicio}
                  onChange={(e) => setPrecioNuevoServicio(e.target.value ? parseFloat(e.target.value) : '')}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <button
                type="submit"
                disabled={creandoServicio}
                className="btn btn-primary"
                style={{
                  padding: '10px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} />
                <span>{creandoServicio ? 'Guardando...' : 'Crear Servicio'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor / Impresión de Factura */}
      {facturaSeleccionada && (
        <ModalVisorFactura
          factura={facturaSeleccionada}
          onClose={() => setFacturaSeleccionada(null)}
        />
      )}
    </div>
  );
}
