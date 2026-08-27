/**
 * Servicio para gestionar usuarios del sistema
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_URL = `${API_BASE_URL}/api`

interface UsuarioData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  idRol: number
}

export const usuariosService = {
  /**
   * Registra un nuevo usuario
   * @param usuario Datos del usuario
   * @returns Usuario creado con su ID
   */
  async registrar(usuario: UsuarioData) {
    try {
      console.log(`📡 POST ${API_URL}/usuarios`)
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`${response.status} ${error.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error registrando usuario:', error)
      throw error
    }
  },

  /**
   * Obtiene todos los usuarios
   * @returns Lista de usuarios
   */
  async obtenerTodos() {
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
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
      console.error('Error obteniendo usuarios:', error)
      throw error
    }
  },

  /**
   * Obtiene un usuario por ID
   * @param id ID del usuario
   * @returns Datos del usuario
   */
  async obtenerPorId(id: string | number) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
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
      console.error(`Error obteniendo usuario ${id}:`, error)
      throw error
    }
  },

  /**
   * Actualiza los datos de un usuario
   * @param id ID del usuario
   * @param usuario Datos actualizados
   * @returns Usuario actualizado
   */
  async actualizar(id: string | number, usuario: Partial<UsuarioData>) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error actualizando usuario ${id}:`, error)
      throw error
    }
  },

  /**
   * Elimina un usuario
   * @param id ID del usuario
   * @returns Respuesta de confirmación
   */
  async eliminar(id: string | number) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
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
      console.error(`Error eliminando usuario ${id}:`, error)
      throw error
    }
  },
}
