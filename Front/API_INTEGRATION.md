# Formulario de Registro de Pacientes - Guía de Integración

## 📋 Descripción

Formulario React+TypeScript para el registro de pacientes integrado con APIs RESTful.

## 🚀 Instalación y Setup

### 1. Instalar dependencias
```bash
cd front
npm install
```

### 2. Configurar variables de ambiente
Crear archivo `.env.local` en la raíz del proyecto:
```
VITE_API_URL=http://localhost:3000
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173/`

## 📡 APIs Requeridas

### 1. Crear Rol PACIENTE (Opcional - se crea automáticamente)
```http
POST /api/roles
Content-Type: application/json

{
  "nombre": "PACIENTE",
  "descripcion": "Paciente del sistema"
}
```

**Respuesta esperada:**
```json
{
  "id": 2,
  "nombre": "PACIENTE",
  "descripcion": "Paciente del sistema"
}
```

### 2. Registrar Usuario
```http
POST /api/usuarios
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "3001234567",
  "idRol": 2
}
```

**Respuesta esperada:**
```json
{
  "id": 3,
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "3001234567",
  "idRol": 2
}
```

### 3. Registrar Paciente
```http
POST /api/pacientes
Content-Type: application/json

{
  "idUsuario": 3,
  "documentoIdentidad": "1234567890",
  "fechaNacimiento": "1990-05-20",
  "sexo": "M",
  "direccion": "Av. Principal 123",
  "contactoEmergencia": "Juan Pérez",
  "telefonoEmergencia": "3109999999"
}
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "idUsuario": 3,
  "documentoIdentidad": "1234567890",
  "fechaNacimiento": "1990-05-20",
  "sexo": "M",
  "direccion": "Av. Principal 123",
  "contactoEmergencia": "Juan Pérez",
  "telefonoEmergencia": "3109999999"
}
```

## 🛠️ Servicios Disponibles

### Servicio de Pacientes (`src/services/pacientesService.ts`)

```typescript
import { pacientesService } from '@/services/pacientesService'

// Registrar paciente
const resultado = await pacientesService.registrar({
  idUsuario: 3,
  documentoIdentidad: "1234567890",
  fechaNacimiento: "1990-05-20",
  sexo: "M",
  direccion: "Av. Principal",
  contactoEmergencia: "Juan Pérez",
  telefonoEmergencia: "999999999"
})

// Obtener todos los pacientes
const pacientes = await pacientesService.obtenerTodos()

// Obtener paciente por ID
const paciente = await pacientesService.obtenerPorId("1")

// Actualizar paciente
const actualizado = await pacientesService.actualizar("1", {
  direccion: "Nueva dirección"
})

// Eliminar paciente
const resultado = await pacientesService.eliminar("1")
```

### Servicio de Usuarios (`src/services/usuariosService.ts`)

```typescript
import { usuariosService } from '@/services/usuariosService'

// Registrar usuario
const usuario = await usuariosService.registrar({
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@example.com",
  telefono: "3001234567",
  idRol: 2
})

// Obtener usuarios
const usuarios = await usuariosService.obtenerTodos()

// Obtener usuario por ID
const usuario = await usuariosService.obtenerPorId(3)

// Actualizar usuario
const actualizado = await usuariosService.actualizar(3, {
  email: "nuevo@example.com"
})

// Eliminar usuario
const resultado = await usuariosService.eliminar(3)
```

### Servicio de Roles (`src/services/rolesService.ts`)

```typescript
import { rolesService } from '@/services/rolesService'

// Crear rol
const rol = await rolesService.crear({
  nombre: "PACIENTE",
  descripcion: "Paciente del sistema"
})

// Obtener roles
const roles = await rolesService.obtenerTodos()

// Obtener rol por ID
const rol = await rolesService.obtenerPorId("2")
```

## 📝 Flujo de Registro

El formulario sigue este flujo automáticamente:

1. **Validación** - Valida todos los campos del formulario
2. **Crear/Obtener Rol PACIENTE** - Se crea automáticamente si no existe (ID: 2)
3. **Registrar Usuario** - Crea un usuario con el rol PACIENTE
4. **Registrar Paciente** - Asocia los datos del paciente con el usuario creado
5. **Confirmación** - Muestra mensaje de éxito

## 🎨 Campos del Formulario

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| Nombre | text | ✓ | No vacío |
| Apellido | text | ✓ | No vacío |
| Email | email | ✓ | Formato email válido |
| Teléfono | tel | ✓ | No vacío |
| Documento | text | ✓ | No vacío |
| Fecha Nacimiento | date | ✓ | Formato ISO |
| Sexo | select | ✓ | M, F, O |
| Dirección | text | ✓ | No vacío |
| Contacto Emergencia | text | ✓ | No vacío |
| Teléfono Emergencia | tel | ✓ | No vacío |

## 🐛 Manejo de Errores

El formulario captura y muestra errores de:
- **Validación de campos** - Mensajes específicos por campo
- **Errores de API** - Mensajes de error del servidor
- **Conexión** - Notifica si no puede conectar con la API

## 🔧 Configuración Avanzada

### Cambiar URL de la API en producción

Editar `.env.local` o crear `.env.production`:
```
VITE_API_URL=https://tu-api.com
```

### Personalizar errores

Los servicios lanzan excepciones que incluyen mensajes del servidor:
```typescript
try {
  await pacientesService.registrar(datos)
} catch (error) {
  console.error('Error específico:', error.message)
}
```

## 📦 Estructura de Carpetas

```
src/
├── pages/
│   └── RegistrarUsuario/
│       ├── RegistrarUsuario.tsx      # Componente principal
│       ├── RegistrarUsuario.css      # Estilos
│       └── index.ts                  # Exportación
├── services/
│   ├── pacientesService.ts           # API pacientes
│   ├── usuariosService.ts            # API usuarios
│   └── rolesService.ts               # API roles
└── App.tsx                           # Componente raíz
```

## 🚀 Build para Producción

```bash
npm run build
```

Genera un build optimizado en la carpeta `dist/`

## 📝 Licencia

Este proyecto es propietario.
