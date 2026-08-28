import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { crearMedico, obtenerMedico, type MedicoDetalle } from '../../services/medicosService';
import { asignarEspecialidades, listarEspecialidades, type Especialidad } from '../../services/especialidadesService';

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
    <section className="page">
      <div className="tabs">
        <button type="button" className={tab === 'registrar' ? 'active' : ''} onClick={() => setTab('registrar')}>
          Registrar médico
        </button>
        <button
          type="button"
          className={tab === 'especialidades' ? 'active' : ''}
          onClick={() => setTab('especialidades')}
        >
          Asignar especialidades
        </button>
      </div>

      {tab === 'registrar' && (
        <div className="card">
          <h2>Registrar médico</h2>
          <p className="hint">
            El médico debe tener primero un usuario con rol MEDICO (ver{' '}
            <Link to="/registrar-usuario">Registrar usuario</Link>). Luego completa aquí su número de
            colegiatura indicando el ID de ese usuario.
          </p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label className="form-field">
                <span className="label">ID de usuario (rol MEDICO)</span>
                <input
                  type="number"
                  min={1}
                  value={form.idUsuario}
                  onChange={actualizarCampo('idUsuario')}
                  required
                />
              </label>

              <label className="form-field">
                <span className="label">Número de colegiatura</span>
                <input
                  type="text"
                  value={form.numeroColegiatura}
                  onChange={actualizarCampo('numeroColegiatura')}
                  required
                />
              </label>
            </div>

            {error && <p className="error">{error}</p>}
            {exito && <p className="success">{exito}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar médico'}
            </button>
          </form>

          {medicoRecienCreado && (
            <p className="hint">
              <button type="button" onClick={() => irAAsignarEspecialidades(medicoRecienCreado)}>
                Asignar especialidades a este médico
              </button>
            </p>
          )}
        </div>
      )}

      {tab === 'especialidades' && (
        <div className="card">
          <h2>Asignar especialidades</h2>
          <p className="hint">Indica el ID del médico para ver y editar sus especialidades.</p>

          <div className="search-row">
            <input
              type="number"
              min={1}
              value={idMedicoInput}
              onChange={(event) => setIdMedicoInput(event.target.value)}
              placeholder="ID de médico"
              aria-label="ID de médico"
            />
            <button type="button" onClick={() => cargarMedico(idMedicoInput)} disabled={loadingMedico}>
              {loadingMedico ? 'Cargando...' : 'Cargar médico'}
            </button>
          </div>

          {errorEspecialidades && <p className="error">{errorEspecialidades}</p>}

          {medico && (
            <>
              <p className="hint">
                {medico.usuario.nombres} {medico.usuario.apellidos} · Colegiatura {medico.numeroColegiatura}
              </p>

              {catalogo.length === 0 ? (
                <p className="empty-state">No hay especialidades registradas todavía.</p>
              ) : (
                <ul className="checklist">
                  {catalogo.map((especialidad) => (
                    <li key={especialidad.idEspecialidad}>
                      <label>
                        <input
                          type="checkbox"
                          checked={seleccionadas.has(especialidad.idEspecialidad)}
                          onChange={() => alternarEspecialidad(especialidad.idEspecialidad)}
                        />
                        {especialidad.nombre}
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {exitoEspecialidades && <p className="success">{exitoEspecialidades}</p>}

              <button type="button" onClick={guardarEspecialidades} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar especialidades'}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
