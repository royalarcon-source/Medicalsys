import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  obtenerConsultaPorId,
  completarConsulta,
  type ConsultaItem,
} from '../../services/consultasService';

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

  const esAtendida = consulta?.estadoConsulta === 'ATENDIDA';

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la consulta.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

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
          <p>Cargando información de la consulta...</p>
        </div>
      </section>
    );
  }

  if (!consulta) {
    return (
      <section className="page">
        <div className="card">
          <p className="error">Consulta no encontrada.</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2>Atención Médica — Consulta #{consulta.idConsulta}</h2>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Turno: <strong>#{consulta.numeroTurno || consulta.idConsulta}</strong> | Tipo: <strong>{consulta.tipoIngreso}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {paciente?.documentoIdentidad && (
              <Link
                to={`/historia-clinica?ci=${encodeURIComponent(paciente.documentoIdentidad)}`}
                target="_blank"
                style={{ textDecoration: 'none' }}
              >
                <button type="button" className="button-secondary" style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}>
                  📖 Ver Historia Clínica
                </button>
              </Link>
            )}
            <Link to="/consultas/cola" style={{ textDecoration: 'none' }}>
              <button type="button" className="button-secondary">Volver a Cola</button>
            </Link>
          </div>
        </div>

        {error && <p className="error" style={{ marginTop: '10px' }}>{error}</p>}
        {mensajeExito && <p className="success" style={{ marginTop: '10px' }}>{mensajeExito}</p>}
      </div>

      <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="badge badge-confirmada">Paciente en Consulta</span>
            <h3 style={{ margin: '4px 0', color: '#1e293b' }}>{nombrePaciente}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
              CI: <strong>{paciente?.documentoIdentidad}</strong> | Sexo: {paciente?.sexo || '—'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Médico: <strong>Dr(a). {consulta.medico?.usuario?.nombres} {consulta.medico?.usuario?.apellidos}</strong>
            </div>
            {consulta.consultorio && (
              <div style={{ fontSize: '13px', color: '#166534', marginTop: '2px' }}>
                Consultorio: 🏥 {consulta.consultorio.nombre}
              </div>
            )}
            <div style={{ marginTop: '4px' }}>
              <span className={esAtendida ? 'badge badge-atendida' : 'badge badge-pendiente'}>
                {esAtendida ? '✅ CONSULTA ATENDIDA (INMUTABLE)' : '🩺 EN ATENCIÓN CLÍNICA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Registro Clínico de la Consulta (HU-20)</h3>

        {esAtendida ? (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong>Motivo de consulta:</strong>
              <p style={{ margin: '4px 0', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                {consulta.motivo || '—'}
              </p>
            </div>

            <div>
              <strong>Anamnesis / Historia clínica de la consulta:</strong>
              <p style={{ margin: '4px 0', background: '#f1f5f9', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                {consulta.anamnesis || 'No registrada'}
              </p>
            </div>

            <div>
              <strong>Examen Físico:</strong>
              <p style={{ margin: '4px 0', background: '#f1f5f9', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                {consulta.examenFisico || 'No registrado'}
              </p>
            </div>

            <div>
              <strong>Diagnósticos Establecidos:</strong>
              {consulta.diagnosticos && consulta.diagnosticos.length > 0 ? (
                <ul style={{ margin: '6px 0 0 20px', padding: 0 }}>
                  {consulta.diagnosticos.map((dx) => (
                    <li key={dx.idDiagnostico}>
                      <strong>{dx.codigo ? `[${dx.codigo}] ` : ''}{dx.descripcion}</strong> ({dx.tipo || 'DEFINITIVO'})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '4px 0', color: '#64748b' }}>Sin diagnósticos registrados.</p>
              )}
            </div>

            <div>
              <strong>Tratamientos / Prescripción:</strong>
              {consulta.tratamientos && consulta.tratamientos.length > 0 ? (
                <ul style={{ margin: '6px 0 0 20px', padding: 0 }}>
                  {consulta.tratamientos.map((t) => (
                    <li key={t.idTratamiento}>
                      <strong>{t.descripcion}</strong>
                      {t.indicaciones ? ` — Indicaciones: ${t.indicaciones}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '4px 0', color: '#64748b' }}>Sin tratamientos registrados.</p>
              )}
            </div>

            {consulta.observaciones && (
              <div>
                <strong>Observaciones Generales:</strong>
                <p style={{ margin: '4px 0', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
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

            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="label" style={{ fontSize: '15px', margin: 0 }}>Diagnósticos Clínicos</span>
                <button
                  type="button"
                  className="button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={handleAgregarDiagnostico}
                >
                  + Agregar Diagnóstico
                </button>
              </div>

              {diagnosticos.map((dx, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '8px',
                    background: '#f8fafc',
                    padding: '8px',
                    borderRadius: '6px',
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
                      className="button-danger"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      onClick={() => handleEliminarDiagnostico(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="label" style={{ fontSize: '15px', margin: 0 }}>Plan de Tratamiento y Prescripción</span>
                <button
                  type="button"
                  className="button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={handleAgregarTratamiento}
                >
                  + Agregar Tratamiento
                </button>
              </div>

              {tratamientos.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0' }}>
                  No se han agregado indicaciones o tratamientos farmacológicos.
                </p>
              ) : (
                tratamientos.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '10px',
                      background: '#f8fafc',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
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
                        className="button-danger"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => handleEliminarTratamiento(idx)}
                      >
                        ✕
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

            <label className="form-field" style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
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
                {guardando ? 'Guardando consulta...' : '✅ Finalizar Atención y Guardar en Historia Clínica'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
