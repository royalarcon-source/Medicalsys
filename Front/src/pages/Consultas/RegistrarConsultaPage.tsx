import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  obtenerConsultaPorId,
  completarConsulta,
  type ConsultaItem,
} from '../../services/consultasService';
import {
  listarDocumentos,
  subirDocumento,
  TIPOS_DOCUMENTO,
  type DocumentoItem,
} from '../../services/documentosService';
import ModalVisorDocumento from '../../components/ModalVisorDocumento';
import {
  Stethoscope,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Save,
  User,
  Activity,
  AlertCircle,
  Upload,
  Paperclip,
  Eye,
  FileDown,
  Image as ImageIcon,
} from 'lucide-react';

interface DiagnosticoForm {
  codigo: string;
  descripcion: string;
  tipo: string;
}

interface TratamientoForm {
  descripcion: string;
  indicaciones: string;
  fechaInicio: string;
  fechaFin: string;
}

export default function RegistrarConsultaPage() {
  const { id } = useParams<{ id: string }>();

  const [consulta, setConsulta] = useState<ConsultaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [motivo, setMotivo] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [examenFisico, setExamenFisico] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoForm[]>([
    { codigo: '', descripcion: '', tipo: 'DEFINITIVO' },
  ]);

  const [tratamientos, setTratamientos] = useState<TratamientoForm[]>([]);

  // HU-24 & HU-25: Documentos médicos
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoItem | null>(null);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [exitoDoc, setExitoDoc] = useState<string | null>(null);
  const [tipoDoc, setTipoDoc] = useState<string>('LABORATORIO');
  const [archivoDoc, setArchivoDoc] = useState<File | null>(null);

  const esAtendida = consulta?.estadoConsulta === 'ATENDIDA';

  const cargarDocumentos = async (idConsulta: number) => {
    try {
      setCargandoDocs(true);
      const res = await listarDocumentos(idConsulta);
      setDocumentos(res.documentos || []);
    } catch (err) {
      console.error('Error al listar documentos:', err);
    } finally {
      setCargandoDocs(false);
    }
  };

  useEffect(() => {
    async function cargar() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await obtenerConsultaPorId(Number(id));
        setConsulta(res.consulta);
        setMotivo(res.consulta.motivo || '');
        setAnamnesis(res.consulta.anamnesis || '');
        setExamenFisico(res.consulta.examenFisico || '');
        setObservaciones(res.consulta.observaciones || '');

        if (res.consulta.diagnosticos && res.consulta.diagnosticos.length > 0) {
          setDiagnosticos(
            res.consulta.diagnosticos.map((d) => ({
              codigo: d.codigo || '',
              descripcion: d.descripcion,
              tipo: d.tipo || 'DEFINITIVO',
            }))
          );
        }

        if (res.consulta.tratamientos && res.consulta.tratamientos.length > 0) {
          setTratamientos(
            res.consulta.tratamientos.map((t) => ({
              descripcion: t.descripcion,
              indicaciones: t.indicaciones || '',
              fechaInicio: t.fechaInicio ? t.fechaInicio.slice(0, 10) : '',
              fechaFin: t.fechaFin ? t.fechaFin.slice(0, 10) : '',
            }))
          );
        }

        await cargarDocumentos(Number(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la consulta.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

  const handleSubirDocumento = async (e: FormEvent) => {
    e.preventDefault();
    if (!consulta || !archivoDoc) {
      setErrorDoc('Por favor seleccione un archivo para adjuntar.');
      return;
    }

    if (archivoDoc.size > 10 * 1024 * 1024) {
      setErrorDoc('El archivo supera el límite de 10 MB.');
      return;
    }

    const extensionesPermitidas = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const nombre = archivoDoc.name.toLowerCase();
    const esValido = extensionesPermitidas.some((ext) => nombre.endsWith(ext));
    if (!esValido) {
      setErrorDoc('Formato no permitido. Solo se aceptan archivos PDF, PNG, JPG o WEBP.');
      return;
    }

    setSubiendoDoc(true);
    setErrorDoc(null);
    setExitoDoc(null);

    try {
      await subirDocumento(consulta.idConsulta, tipoDoc, archivoDoc);
      setExitoDoc(`Documento "${archivoDoc.name}" subido exitosamente a Cloudinary.`);
      setArchivoDoc(null);
      const input = document.getElementById('input-archivo-doc') as HTMLInputElement | null;
      if (input) input.value = '';
      await cargarDocumentos(consulta.idConsulta);
    } catch (err) {
      setErrorDoc(err instanceof Error ? err.message : 'Error al subir el documento.');
    } finally {
      setSubiendoDoc(false);
    }
  };

  const formatearTamano = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const obtenerEtiquetaTipo = (tipo: string) => {
    const item = TIPOS_DOCUMENTO.find((t) => t.value === tipo);
    return item ? item.label : tipo;
  };

  const handleAgregarDiagnostico = () => {
    setDiagnosticos([...diagnosticos, { codigo: '', descripcion: '', tipo: 'DEFINITIVO' }]);
  };

  const handleEliminarDiagnostico = (index: number) => {
    setDiagnosticos(diagnosticos.filter((_, i) => i !== index));
  };

  const handleDiagnosticoChange = (index: number, campo: keyof DiagnosticoForm, valor: string) => {
    const nuevos = [...diagnosticos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setDiagnosticos(nuevos);
  };

  const handleAgregarTratamiento = () => {
    setTratamientos([
      ...tratamientos,
      { descripcion: '', indicaciones: '', fechaInicio: '', fechaFin: '' },
    ]);
  };

  const handleEliminarTratamiento = (index: number) => {
    setTratamientos(tratamientos.filter((_, i) => i !== index));
  };

  const handleTratamientoChange = (index: number, campo: keyof TratamientoForm, valor: string) => {
    const nuevos = [...tratamientos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setTratamientos(nuevos);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consulta) return;
    setError(null);
    setMensajeExito(null);

    if (!motivo.trim()) {
      setError('El motivo de la consulta es obligatorio.');
      return;
    }

    const diagnosticosValidos = diagnosticos
      .filter((d) => d.descripcion.trim().length > 0)
      .map((d) => ({
        codigo: d.codigo.trim() || undefined,
        descripcion: d.descripcion.trim(),
        tipo: d.tipo,
      }));

    const tratamientosValidos = tratamientos
      .filter((t) => t.descripcion.trim().length > 0)
      .map((t) => ({
        descripcion: t.descripcion.trim(),
        indicaciones: t.indicaciones.trim() || undefined,
        fechaInicio: t.fechaInicio || undefined,
        fechaFin: t.fechaFin || undefined,
      }));

    setGuardando(true);
    try {
      await completarConsulta(consulta.idConsulta, {
        motivo: motivo.trim(),
        anamnesis: anamnesis.trim() || undefined,
        examenFisico: examenFisico.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        diagnosticos: diagnosticosValidos,
        tratamientos: tratamientosValidos,
      });

      setMensajeExito('Consulta médica completada y registrada exitosamente en la Historia Clínica.');
      const res = await obtenerConsultaPorId(consulta.idConsulta);
      setConsulta(res.consulta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la consulta médica.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <p>Cargando información de la consulta...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!consulta) {
    return (
      <section className="page">
        <div className="card">
          <div className="alert-error">
            <AlertCircle size={16} />
            <span>Consulta no encontrada.</span>
          </div>
          <Link to="/consultas/cola">
            <button type="button" className="button-secondary">Volver a la Cola</button>
          </Link>
        </div>
      </section>
    );
  }

  const paciente = consulta.historia?.paciente;
  const nombrePaciente = paciente?.usuario
    ? `${paciente.usuario.nombres} ${paciente.usuario.apellidos}`
    : `CI: ${paciente?.documentoIdentidad}`;

  return (
    <section className="page registrar-consulta-page">
      <div className="card">
        <div className="page-header">
          <div>
            <h2>
              <Stethoscope size={22} className="text-primary" />
              <span>Atención Médica — Consulta #{consulta.idConsulta}</span>
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Turno: <strong>#{consulta.numeroTurno || consulta.idConsulta}</strong> | Tipo: <strong>{consulta.tipoIngreso}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {paciente?.documentoIdentidad && (
              <Link
                to={`/historia-clinica?ci=${encodeURIComponent(paciente.documentoIdentidad)}`}
                target="_blank"
                style={{ textDecoration: 'none' }}
              >
                <button type="button" className="button-secondary">
                  <FileText size={15} />
                  <span>Ver Historia Clínica</span>
                </button>
              </Link>
            )}
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">Volver a Cola</button>
            </Link>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensajeExito && <div className="alert-success">{mensajeExito}</div>}
      </div>

      <div className="card" style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span className="badge badge-confirmada">
              <User size={12} />
              <span>Paciente en Consulta</span>
            </span>
            <h3 style={{ margin: '6px 0 2px 0', color: 'var(--text-main)', fontSize: '1.15rem' }}>{nombrePaciente}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              CI: <strong>{paciente?.documentoIdentidad}</strong> | Sexo: {paciente?.sexo || '—'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Médico: <strong>Dr(a). {consulta.medico?.usuario?.nombres} {consulta.medico?.usuario?.apellidos}</strong>
            </div>
            {consulta.consultorio && (
              <div style={{ fontSize: '13px', color: 'var(--primary-text)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <Building2 size={13} />
                <span>Consultorio: {consulta.consultorio.nombre}</span>
              </div>
            )}
            <div style={{ marginTop: '6px' }}>
              <span className={esAtendida ? 'badge badge-atendida' : 'badge badge-pendiente'}>
                {esAtendida ? <CheckCircle2 size={12} /> : <Stethoscope size={12} />}
                <span>{esAtendida ? 'CONSULTA ATENDIDA' : 'EN ATENCIÓN CLÍNICA'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>
          <Activity size={18} />
          <span>Registro Clínico de la Consulta (HU-20)</span>
        </h3>

        {esAtendida ? (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong>Motivo de consulta:</strong>
              <p style={{ margin: '6px 0', background: 'var(--bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {consulta.motivo || '—'}
              </p>
            </div>

            <div>
              <strong>Anamnesis / Historia clínica de la consulta:</strong>
              <p style={{ margin: '6px 0', background: 'var(--bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {consulta.anamnesis || 'No registrada'}
              </p>
            </div>

            <div>
              <strong>Examen Físico:</strong>
              <p style={{ margin: '6px 0', background: 'var(--bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {consulta.examenFisico || 'No registrado'}
              </p>
            </div>

            <div>
              <strong>Diagnósticos Establecidos:</strong>
              {consulta.diagnosticos && consulta.diagnosticos.length > 0 ? (
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {consulta.diagnosticos.map((dx) => (
                    <li key={dx.idDiagnostico} style={{ marginBottom: '4px' }}>
                      <strong>{dx.codigo ? `[${dx.codigo}] ` : ''}{dx.descripcion}</strong> ({dx.tipo || 'DEFINITIVO'})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>Sin diagnósticos registrados.</p>
              )}
            </div>

            <div>
              <strong>Tratamientos / Prescripción:</strong>
              {consulta.tratamientos && consulta.tratamientos.length > 0 ? (
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {consulta.tratamientos.map((t) => (
                    <li key={t.idTratamiento} style={{ marginBottom: '4px' }}>
                      <strong>{t.descripcion}</strong>
                      {t.indicaciones ? ` — Indicaciones: ${t.indicaciones}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>Sin tratamientos registrados.</p>
              )}
            </div>

            {consulta.observaciones && (
              <div>
                <strong>Observaciones Generales:</strong>
                <p style={{ margin: '6px 0', background: 'var(--bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {consulta.observaciones}
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: '16px' }}>
            <label className="form-field">
              <span className="label">Motivo de Consulta *</span>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo principal por el cual consulta el paciente"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Anamnesis / Enfermedad Actual</span>
              <textarea
                rows={4}
                value={anamnesis}
                onChange={(e) => setAnamnesis(e.target.value)}
                placeholder="Relato cronológico de síntomas, antecedentes y evolución..."
              />
            </label>

            <label className="form-field">
              <span className="label">Examen Físico</span>
              <textarea
                rows={3}
                value={examenFisico}
                onChange={(e) => setExamenFisico(e.target.value)}
                placeholder="Signos vitales, hallazgos clínicos, inspección, palpación, auscultación..."
              />
            </label>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="label" style={{ fontSize: '0.85rem', margin: 0 }}>Diagnósticos Clínicos</span>
                <button
                  type="button"
                  className="button-secondary button-sm"
                  onClick={handleAgregarDiagnostico}
                >
                  <Plus size={14} />
                  <span>Agregar Diagnóstico</span>
                </button>
              </div>

              {diagnosticos.map((dx, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '10px',
                    background: 'var(--bg-page)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="CIE-10 (opcional)"
                    style={{ width: '130px' }}
                    value={dx.codigo}
                    onChange={(e) => handleDiagnosticoChange(idx, 'codigo', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Descripción del diagnóstico *"
                    style={{ flex: 1 }}
                    value={dx.descripcion}
                    onChange={(e) => handleDiagnosticoChange(idx, 'descripcion', e.target.value)}
                  />
                  <select
                    style={{ width: '140px' }}
                    value={dx.tipo}
                    onChange={(e) => handleDiagnosticoChange(idx, 'tipo', e.target.value)}
                  >
                    <option value="DEFINITIVO">DEFINITIVO</option>
                    <option value="PRESUNTIVO">PRESUNTIVO</option>
                  </select>
                  {diagnosticos.length > 1 && (
                    <button
                      type="button"
                      className="button-outline-danger button-sm"
                      onClick={() => handleEliminarDiagnostico(idx)}
                      title="Eliminar diagnóstico"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="label" style={{ fontSize: '0.85rem', margin: 0 }}>Plan de Tratamiento y Prescripción</span>
                <button
                  type="button"
                  className="button-secondary button-sm"
                  onClick={handleAgregarTratamiento}
                >
                  <Plus size={14} />
                  <span>Agregar Tratamiento</span>
                </button>
              </div>

              {tratamientos.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' }}>
                  No se han agregado indicaciones o tratamientos farmacológicos.
                </p>
              ) : (
                tratamientos.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '10px',
                      background: 'var(--bg-page)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Descripción o Medicamento *"
                        style={{ flex: 1 }}
                        value={t.descripcion}
                        onChange={(e) => handleTratamientoChange(idx, 'descripcion', e.target.value)}
                      />
                      <button
                        type="button"
                        className="button-outline-danger button-sm"
                        onClick={() => handleEliminarTratamiento(idx)}
                        title="Eliminar tratamiento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Indicaciones / Dosis / Frecuencia"
                        style={{ flex: 2, minWidth: '180px' }}
                        value={t.indicaciones}
                        onChange={(e) => handleTratamientoChange(idx, 'indicaciones', e.target.value)}
                      />
                      <input
                        type="date"
                        style={{ flex: 1, minWidth: '130px' }}
                        value={t.fechaInicio}
                        onChange={(e) => handleTratamientoChange(idx, 'fechaInicio', e.target.value)}
                        title="Fecha de inicio"
                      />
                      <input
                        type="date"
                        style={{ flex: 1, minWidth: '130px' }}
                        value={t.fechaFin}
                        onChange={(e) => handleTratamientoChange(idx, 'fechaFin', e.target.value)}
                        title="Fecha de fin"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <label className="form-field" style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span className="label">Observaciones y Recomendaciones Generales</span>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Recomendaciones de cuidado, signos de alarma, fecha estimada de control..."
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
                <button type="button" className="button-secondary" disabled={guardando}>
                  Cancelar
                </button>
              </Link>
              <button type="submit" disabled={guardando}>
                <Save size={16} />
                <span>{guardando ? 'Guardando consulta...' : 'Finalizar Atención y Guardar en Historia Clínica'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* HU-24 / HU-25: Sección de Gestión Documental Médica (Cloudinary) */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.1rem' }}>
              <Paperclip size={20} className="text-primary" />
              <span>Documentos Médicos y Exámenes Adjuntos (HU-24 / HU-25)</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Almacenamiento seguro en Cloudinary para exámenes de laboratorio, radiografías, ecografías e informes.
            </p>
          </div>
          <span className="badge badge-confirmada" style={{ fontSize: '12px' }}>
            {documentos.length} {documentos.length === 1 ? 'documento adjunto' : 'documentos adjuntos'}
          </span>
        </div>

        {errorDoc && <div className="alert-error" style={{ marginBottom: '14px' }}>{errorDoc}</div>}
        {exitoDoc && <div className="alert-success" style={{ marginBottom: '14px' }}>{exitoDoc}</div>}

        {/* HU-24: Formulario de Subida de Archivos */}
        <form
          onSubmit={handleSubirDocumento}
          style={{
            background: 'var(--bg-page)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          <span className="label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
            Subir nuevo documento o examen a esta consulta:
          </span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-field" style={{ flex: '1 1 200px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Categoría / Tipo *</span>
              <select
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value)}
                disabled={subiendoDoc}
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field" style={{ flex: '2 1 250px', margin: 0 }}>
              <span className="label" style={{ fontSize: '12px' }}>Archivo (PDF, PNG, JPG, WEBP — Máx. 10 MB) *</span>
              <input
                id="input-archivo-doc"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setArchivoDoc(e.target.files[0]);
                  }
                }}
                disabled={subiendoDoc}
              />
            </label>

            <button
              type="submit"
              disabled={subiendoDoc || !archivoDoc}
              style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={16} />
              <span>{subiendoDoc ? 'Subiendo a Cloudinary...' : 'Adjuntar Documento'}</span>
            </button>
          </div>
        </form>

        {/* HU-25: Lista de Documentos Consultados */}
        <div>
          <span className="label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
            Documentos cargados en esta consulta:
          </span>

          {cargandoDocs ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando documentos adjuntos...
            </div>
          ) : documentos.length === 0 ? (
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
              <FileDown size={30} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
              No hay documentos ni exámenes adjuntos para esta consulta.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documentos.map((doc) => {
                const esPdf = doc.mimeType?.toLowerCase().includes('pdf');
                return (
                  <div
                    key={doc.idDocumento}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'var(--bg-page)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {esPdf ? (
                        <FileText size={24} className="text-primary" />
                      ) : (
                        <ImageIcon size={24} className="text-primary" />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {doc.nombreArchivo}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                          <span className="badge badge-confirmada" style={{ fontSize: '11px', padding: '2px 6px' }}>
                            {obtenerEtiquetaTipo(doc.tipo)}
                          </span>
                          <span>{formatearTamano(doc.tamanoBytes)}</span>
                          <span>•</span>
                          <span>{new Date(doc.fechaSubida).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDocumentoSeleccionado(doc)}
                      className="button-secondary button-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={14} />
                      <span>Ver Vista Previa</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Visor de Documentos */}
      <ModalVisorDocumento
        documento={documentoSeleccionado}
        onClose={() => setDocumentoSeleccionado(null)}
      />
    </section>
  );
}
