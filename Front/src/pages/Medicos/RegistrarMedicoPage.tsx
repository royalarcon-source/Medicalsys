import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { crearMedico, obtenerMedico, type MedicoDetalle } from '../../services/medicosService';
import { asignarEspecialidades, listarEspecialidades, type Especialidad } from '../../services/especialidadesService';
import { Stethoscope, Tag, Save, CheckCircle2, AlertCircle, Search } from 'lucide-react';

type Tab = 'registrar' | 'especialidades';

interface FormState {
  idUsuario: string;
  numeroColegiatura: string;
}

function estadoInicial(idUsuario = ''): FormState {
  return { idUsuario, numeroColegiatura: '' };
}

export default function RegistrarMedicoPage() {
  const location = useLocation();
  const idUsuarioPrellenado = (location.state as { idUsuario?: number } | null)?.idUsuario;

  const [tab, setTab] = useState<Tab>('registrar');

  const [form, setForm] = useState<FormState>(
    estadoInicial(idUsuarioPrellenado ? String(idUsuarioPrellenado) : ''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [medicoRecienCreado, setMedicoRecienCreado] = useState<number | null>(null);

  const [idMedicoInput, setIdMedicoInput] = useState('');
  const [catalogo, setCatalogo] = useState<Especialidad[]>([]);
  const [medico, setMedico] = useState<MedicoDetalle | null>(null);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [loadingMedico, setLoadingMedico] = useState(false);
  const [errorEspecialidades, setErrorEspecialidades] = useState<string | null>(null);
  const [exitoEspecialidades, setExitoEspecialidades] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarEspecialidades()
      .then((respuesta) => setCatalogo(respuesta.especialidades))
      .catch(() => setCatalogo([]));
  }, []);

  const actualizarCampo = (campo: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(null);
    setMedicoRecienCreado(null);

    const idUsuario = Number(form.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      setError('Debes indicar el ID de un usuario con rol MEDICO.');
      return;
    }

    if (!form.numeroColegiatura.trim()) {
      setError('El número de colegiatura es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const respuesta = await crearMedico({
        idUsuario,
        numeroColegiatura: form.numeroColegiatura.trim(),
      });

      setExito(`Médico registrado correctamente (colegiatura ${respuesta.medico.numeroColegiatura}).`);
      setMedicoRecienCreado(respuesta.medico.idMedico);
      setForm(estadoInicial());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el médico.');
    } finally {
      setLoading(false);
    }
  };

  const cargarMedico = async (idMedico: string) => {
    const id = Number(idMedico);

    if (!Number.isInteger(id) || id <= 0) {
      setErrorEspecialidades('Debes indicar el ID de un médico válido.');
      return;
    }

    setErrorEspecialidades(null);
    setExitoEspecialidades(null);
    setLoadingMedico(true);
    try {
      const respuesta = await obtenerMedico(id);
      setMedico(respuesta.medico);
      setSeleccionadas(new Set(respuesta.medico.especialidades.map((especialidad) => especialidad.idEspecialidad)));
    } catch (err) {
      setMedico(null);
      setErrorEspecialidades(err instanceof Error ? err.message : 'No se pudo cargar el médico.');
    } finally {
      setLoadingMedico(false);
    }
  };

  const irAAsignarEspecialidades = (idMedico: number) => {
    setTab('especialidades');
    setIdMedicoInput(String(idMedico));
    cargarMedico(String(idMedico));
  };

  const alternarEspecialidad = (idEspecialidad: number) => {
    setSeleccionadas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(idEspecialidad)) {
        siguiente.delete(idEspecialidad);
      } else {
        siguiente.add(idEspecialidad);
      }
      return siguiente;
    });
  };

  const guardarEspecialidades = async () => {
    if (!medico) {
      return;
    }

    setErrorEspecialidades(null);
    setExitoEspecialidades(null);
    setGuardando(true);
    try {
      await asignarEspecialidades(medico.idMedico, Array.from(seleccionadas));
      setExitoEspecialidades('Especialidades actualizadas correctamente.');
    } catch (err) {
      setErrorEspecialidades(err instanceof Error ? err.message : 'No se pudieron guardar las especialidades.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="page registrar-medico-page">
      <div className="tabs">
        <button
          type="button"
          className={tab === 'registrar' ? 'active' : ''}
          onClick={() => setTab('registrar')}
        >
          <Stethoscope size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
          Registrar Médico
        </button>
        <button
          type="button"
          className={tab === 'especialidades' ? 'active' : ''}
          onClick={() => setTab('especialidades')}
        >
          <Tag size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
          Asignar Especialidades
        </button>
      </div>

      {tab === 'registrar' && (
        <div className="card">
          <div className="page-header">
            <div>
              <h2>
                <Stethoscope size={22} className="text-primary" />
                <span>Registrar Médico</span>
              </h2>
              <p className="page-header-subtitle">
                El profesional debe tener previamente una cuenta con rol MEDICO (ver{' '}
                <Link to="/registrar-usuario">Registrar usuario</Link>).
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form" style={{ marginTop: '12px' }}>
            <div className="form-row">
              <label className="form-field">
                <span className="label">ID de usuario (rol MEDICO) *</span>
                <input
                  type="number"
                  min={1}
                  value={form.idUsuario}
                  onChange={actualizarCampo('idUsuario')}
                  placeholder="Ej. 2"
                  required
                />
              </label>

              <label className="form-field">
                <span className="label">Número de colegiatura *</span>
                <input
                  type="text"
                  value={form.numeroColegiatura}
                  onChange={actualizarCampo('numeroColegiatura')}
                  placeholder="Ej. MED-10492"
                  required
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
              <button type="submit" disabled={loading}>
                <Save size={16} />
                <span>{loading ? 'Registrando...' : 'Registrar médico'}</span>
              </button>
            </div>
          </form>

          {medicoRecienCreado && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--primary-bg)', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
              <p style={{ color: 'var(--primary-text)', fontWeight: 600, margin: '0 0 8px 0' }}>
                ¿Deseas configurar las especialidades para este nuevo médico?
              </p>
              <button type="button" onClick={() => irAAsignarEspecialidades(medicoRecienCreado)}>
                <Tag size={15} />
                <span>Asignar especialidades ahora</span>
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'especialidades' && (
        <div className="card">
          <div className="page-header">
            <div>
              <h2>
                <Tag size={22} className="text-primary" />
                <span>Asignar Especialidades Médicas</span>
              </h2>
              <p className="page-header-subtitle">
                Indica el ID del médico para ver y editar las especialidades que puede atender.
              </p>
            </div>
          </div>

          <div className="search-row" style={{ marginTop: '8px' }}>
            <input
              type="number"
              min={1}
              value={idMedicoInput}
              onChange={(event) => setIdMedicoInput(event.target.value)}
              placeholder="Ingrese ID del médico..."
              aria-label="ID de médico"
            />
            <button type="button" onClick={() => cargarMedico(idMedicoInput)} disabled={loadingMedico}>
              <Search size={16} />
              <span>{loadingMedico ? 'Cargando...' : 'Cargar médico'}</span>
            </button>
          </div>

          {errorEspecialidades && (
            <div className="alert-error" style={{ marginTop: '12px' }}>
              <AlertCircle size={16} />
              <span>{errorEspecialidades}</span>
            </div>
          )}

          {medico && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong>Dr(a). {medico.usuario.nombres} {medico.usuario.apellidos}</strong>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Colegiatura: {medico.numeroColegiatura} | ID Médico: #{medico.idMedico}
                </div>
              </div>

              {catalogo.length === 0 ? (
                <div className="empty-state">
                  <p>No hay especialidades registradas todavía.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                  {catalogo.map((especialidad) => {
                    const checked = seleccionadas.has(especialidad.idEspecialidad);
                    return (
                      <label
                        key={especialidad.idEspecialidad}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: checked ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                          background: checked ? 'var(--primary-bg)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          fontWeight: checked ? 600 : 400,
                          color: checked ? 'var(--primary-text)' : 'var(--text-main)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => alternarEspecialidad(especialidad.idEspecialidad)}
                        />
                        <span>{especialidad.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {exitoEspecialidades && (
                <div className="alert-success">
                  <CheckCircle2 size={16} />
                  <span>{exitoEspecialidades}</span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={guardarEspecialidades} disabled={guardando}>
                  <Save size={16} />
                  <span>{guardando ? 'Guardando...' : 'Guardar especialidades'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
