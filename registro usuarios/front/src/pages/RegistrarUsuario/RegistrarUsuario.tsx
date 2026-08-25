import { useState, useEffect } from 'react'
import './RegistrarUsuario.css'
import { pacientesService } from '../../services/pacientesService'
import { usuariosService } from '../../services/usuariosService'
import { rolesService } from '../../services/rolesService'

interface FormData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  documentoIdentidad: string
  fechaNacimiento: string
  sexo: string
  direccion: string
  contactoEmergencia: string
  telefonoEmergencia: string
}

export default function RegistrarUsuario() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    sexo: '',
    direccion: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [idRolPaciente, setIdRolPaciente] = useState<number | null>(null)

  // Inicializar el rol PACIENTE
  useEffect(() => {
    const initializeRol = async () => {
      try {
        // Intentar crear el rol PACIENTE
        const result = await rolesService.crear({
          nombre: 'PACIENTE',
          descripcion: 'Paciente del sistema',
        })
        setIdRolPaciente(result.id || result.idRol)
        console.log('Rol PACIENTE creado o ya existe:', result)
      } catch (error) {
        console.error('Error inicializando rol PACIENTE:', error)
        // Si falla, asumimos que el rol ya existe con ID 2 (común en sistemas)
        setIdRolPaciente(2)
      }
    }

    initializeRol()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email inválido'
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido'
    if (!formData.documentoIdentidad.trim())
      newErrors.documentoIdentidad = 'El documento es requerido'
    if (!formData.fechaNacimiento)
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
    if (!formData.sexo) newErrors.sexo = 'El sexo es requerido'
    if (!formData.direccion.trim())
      newErrors.direccion = 'La dirección es requerida'
    if (!formData.contactoEmergencia.trim())
      newErrors.contactoEmergencia = 'El contacto de emergencia es requerido'
    if (!formData.telefonoEmergencia.trim())
      newErrors.telefonoEmergencia = 'El teléfono de emergencia es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    if (!validateForm()) return

    if (!idRolPaciente) {
      setErrorMessage('Error: Rol de paciente no inicializado')
      return
    }

    setLoading(true)

    try {
      // 1. Registrar el usuario
      console.log('🔄 Registrando usuario...')
      console.log('📍 URL:', `${import.meta.env.VITE_API_URL}/api/usuarios`)
      console.log('📦 Datos:', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        idRol: idRolPaciente,
      })
      
      const usuarioResponse = await usuariosService.registrar({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        idRol: idRolPaciente,
      })

      console.log('✅ Usuario registrado:', usuarioResponse)
      const idUsuario = usuarioResponse.id || usuarioResponse.idUsuario

      if (!idUsuario) {
        throw new Error('No se recibió ID del usuario registrado')
      }

      // 2. Registrar el paciente
      console.log('🔄 Registrando paciente...')
      console.log('📍 URL:', `${import.meta.env.VITE_API_URL}/api/pacientes`)
      console.log('📦 Datos:', {
        idUsuario: idUsuario,
        documentoIdentidad: formData.documentoIdentidad,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        direccion: formData.direccion,
        contactoEmergencia: formData.contactoEmergencia,
        telefonoEmergencia: formData.telefonoEmergencia,
      })
      
      const pacienteResponse = await pacientesService.registrar({
        idUsuario: idUsuario,
        documentoIdentidad: formData.documentoIdentidad,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        direccion: formData.direccion,
        contactoEmergencia: formData.contactoEmergencia,
        telefonoEmergencia: formData.telefonoEmergencia,
      })

      console.log('✅ Paciente registrado:', pacienteResponse)
      setSubmitted(true)

      // Limpiar formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          documentoIdentidad: '',
          fechaNacimiento: '',
          sexo: '',
          direccion: '',
          contactoEmergencia: '',
          telefonoEmergencia: '',
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error en el registro:', errorMsg)
      console.error('Detalle completo:', error)
      setErrorMessage(
        `Error: ${errorMsg}\n\n⚠️ Verifica la consola del navegador (F12) para más detalles.\n📍 Asegúrate de que el backend está corriendo en http://localhost:3000`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registrar-usuario-container">
      <div className="form-wrapper">
        <h1>Registrar Paciente</h1>
        <p className="subtitle">
          Complete el formulario para registrar un nuevo paciente en el sistema
        </p>

        {submitted && (
          <div className="success-message">
            ✓ Paciente registrado exitosamente en el sistema
          </div>
        )}

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="registro-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingrese el nombre"
                className={errors.nombre ? 'error' : ''}
                disabled={loading}
              />
              {errors.nombre && (
                <span className="error-text">{errors.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ingrese el apellido"
                className={errors.apellido ? 'error' : ''}
                disabled={loading}
              />
              {errors.apellido && (
                <span className="error-text">{errors.apellido}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@email.com"
                className={errors.email ? 'error' : ''}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ingrese el teléfono"
                className={errors.telefono ? 'error' : ''}
                disabled={loading}
              />
              {errors.telefono && (
                <span className="error-text">{errors.telefono}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="documentoIdentidad">
                Documento de Identidad *
              </label>
              <input
                type="text"
                id="documentoIdentidad"
                name="documentoIdentidad"
                value={formData.documentoIdentidad}
                onChange={handleChange}
                placeholder="Ingrese el documento"
                className={errors.documentoIdentidad ? 'error' : ''}
                disabled={loading}
              />
              {errors.documentoIdentidad && (
                <span className="error-text">{errors.documentoIdentidad}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                className={errors.fechaNacimiento ? 'error' : ''}
                disabled={loading}
              />
              {errors.fechaNacimiento && (
                <span className="error-text">{errors.fechaNacimiento}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sexo">Sexo *</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className={errors.sexo ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Seleccione un sexo</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
              {errors.sexo && <span className="error-text">{errors.sexo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección *</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, número, apartamento"
                className={errors.direccion ? 'error' : ''}
                disabled={loading}
              />
              {errors.direccion && (
                <span className="error-text">{errors.direccion}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactoEmergencia">
                Contacto de Emergencia *
              </label>
              <input
                type="text"
                id="contactoEmergencia"
                name="contactoEmergencia"
                value={formData.contactoEmergencia}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                className={errors.contactoEmergencia ? 'error' : ''}
                disabled={loading}
              />
              {errors.contactoEmergencia && (
                <span className="error-text">{errors.contactoEmergencia}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="telefonoEmergencia">
                Teléfono de Emergencia *
              </label>
              <input
                type="tel"
                id="telefonoEmergencia"
                name="telefonoEmergencia"
                value={formData.telefonoEmergencia}
                onChange={handleChange}
                placeholder="Teléfono del contacto"
                className={errors.telefonoEmergencia ? 'error' : ''}
                disabled={loading}
              />
              {errors.telefonoEmergencia && (
                <span className="error-text">{errors.telefonoEmergencia}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !idRolPaciente}
            >
              {loading ? 'Registrando...' : 'Registrar Paciente'}
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={() => {
                setFormData({
                  nombre: '',
                  apellido: '',
                  email: '',
                  telefono: '',
                  documentoIdentidad: '',
                  fechaNacimiento: '',
                  sexo: '',
                  direccion: '',
                  contactoEmergencia: '',
                  telefonoEmergencia: '',
                })
                setErrors({})
                setErrorMessage('')
              }}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
