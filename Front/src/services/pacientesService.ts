/**
 * Servicio para gestionar pacientes
 * Se conecta a los endpoints del backend: POST /api/pacientes
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_URL = `${API_BASE_URL}/api`

interface PacienteData {
  idUsuario: number
  documentoIdentidad: string
  fechaNacimiento: string
  sexo: string
  direccion: string
  contactoEmergencia: string
  telefonoEmergencia: string
}

export const pacientesService = {
  /**
   * Registra un nuevo paciente
   * @param paciente Datos del paciente a registrar
   * @returns Respuesta del servidor con los datos del paciente registrado
   */
  async registrar(paciente: PacienteData) {
    try {
      console.log(`📡 POST ${API_URL}/pacientes`)
      const response = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paciente),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`${response.status} ${error.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error registrando paciente:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de todos los pacientes
   * @returns Lista de pacientes
   */
  async obtenerTodos() {
    try {
      const response = await fetch(`${API_URL}/pacientes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error obteniendo pacientes:', error)
      throw error
    }
  },

  /**
   * Obtiene un paciente por ID
   * @param id ID del paciente
   * @returns Datos del paciente
   */
  async obtenerPorId(id: string) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error obteniendo paciente ${id}:`, error)
      throw error
    }
  },

  /**
   * Actualiza los datos de un paciente
   * @param id ID del paciente
   * @param paciente Datos actualizados del paciente
   * @returns Paciente actualizado
   */
  async actualizar(id: string, paciente: Partial<PacienteData>) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paciente),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error actualizando paciente ${id}:`, error)
      throw error
    }
  },

  /**
   * Elimina un paciente
   * @param id ID del paciente a eliminar
   * @returns Respuesta de confirmación
   */
  async eliminar(id: string) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error eliminando paciente ${id}:`, error)
      throw error
    }
  },
}
