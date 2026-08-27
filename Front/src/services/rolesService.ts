/**
 * Servicio para gestionar roles del sistema
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_URL = `${API_BASE_URL}/api`

interface RolData {
  nombre: string
  descripcion: string
}

export const rolesService = {
  /**
   * Crea un nuevo rol en el sistema
   * @param rol Datos del rol
   * @returns Rol creado
   */
  async crear(rol: RolData) {
    try {
      console.log(`📡 POST ${API_URL}/roles`)
      const response = await fetch(`${API_URL}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rol),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`${response.status} ${error.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creando rol:', error)
      throw error
    }
  },

  /**
   * Obtiene todos los roles
   * @returns Lista de roles
   */
  async obtenerTodos() {
    try {
      const response = await fetch(`${API_URL}/roles`, {
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
      console.error('Error obteniendo roles:', error)
      throw error
    }
  },

  /**
   * Obtiene un rol por ID
   * @param id ID del rol
   * @returns Datos del rol
   */
  async obtenerPorId(id: string) {
    try {
      const response = await fetch(`${API_URL}/roles/${id}`, {
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
      console.error(`Error obteniendo rol ${id}:`, error)
      throw error
    }
  },
}
