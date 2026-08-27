# T1_HU10 — Diseño técnico del flujo de consulta de pacientes

> Documento formal de diseño. Contiene las seis subtareas requeridas: ST1.1, ST1.2, ST1.3, ST1.4, ST1.5 y ST1.6.

## 1. Objetivo

Definir el flujo funcional y técnico para la historia de usuario HU-10: Consultar paciente, con foco en búsqueda, listado, detalle, paginación y restricciones por rol.

Se plantea un flujo donde un usuario autenticado y autorizado puede:

- buscar pacientes por CI, nombre o apellido,
- visualizar resultados paginados,
- abrir el detalle de un paciente sin incluir historia clínica,
- restringir la consulta del paciente a su propio perfil cuando su rol sea PACIENTE.

---

## 2. Alcance funcional

### 2.1 Endpoints del diseño

- GET /api/pacientes
  - Búsqueda general con filtros.
  - Requiere autenticación + permiso `PACIENTE_CONSULTAR`.
- GET /api/pacientes/:id
  - Consulta de detalle del paciente.
  - Requiere autenticación + permiso `PACIENTE_CONSULTAR`.

### 2.2 Roles considerados

- Administrador: acceso total a la búsqueda general.
- Recepcionista: acceso total a la búsqueda general.
- Médico: acceso total a la búsqueda general.
- Paciente: no puede usar la búsqueda ni el detalle general; su perfil propio debe consultarse mediante un endpoint propio, por ejemplo `GET /api/me`.

---

## 3. Subtareas técnicas

### ST1.1 — Criterios de búsqueda admitidos

#### Diseño

El endpoint de búsqueda soporta al menos los siguientes filtros:

- `ci`
- `nombre`
- `apellido`

Se debe exigir al menos un filtro no vacío. Si la solicitud llega sin ninguno o con valores vacíos, el sistema debe devolver un error claro con `400 Bad Request`.

#### Especificación de comportamiento

- `GET /api/pacientes?ci=12345678`
- `GET /api/pacientes?nombre=Juan`
- `GET /api/pacientes?apellido=Perez`

Regla de validación:

- Si `ci`, `nombre` y `apellido` están ausentes o `trim() === ""`, responder:
  - `400 Bad Request`
  - mensaje: `Debe proporcionar al menos un criterio de búsqueda: CI, nombre o apellido`

#### Estado actual en código

La lógica de validación se implementa en [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts), donde se valida que exista al menos uno de los tres criterios antes de consultar.

---

### ST1.2 — Campos mostrados en resultados de lista

#### Diseño

La respuesta de búsqueda debe devolver una lista de resultados con los campos mínimos:

- `idPaciente`
- `ci`
- `nombres`
- `apellidos`
- `fechaNacimiento`

#### Estructura esperada

```json
{
  "total": 2,
  "pagina": 1,
  "limite": 10,
  "totalPaginas": 1,
  "resultados": [
    {
      "idPaciente": 1,
      "ci": "12345678",
      "nombres": "Juan Carlos",
      "apellidos": "Pérez López",
      "fechaNacimiento": "2000-05-20"
    }
  ]
}
```

#### Estado actual en código

El código actual devuelve un payload con campos equivalentes en la respuesta de búsqueda:

- `idPaciente`
- `documentoIdentidad`
- `nombres`
- `apellidos`
- `fechaNacimiento`

Se encuentra en [Back/src/dtos/paciente/BuscarPacienteDTO.ts](../Back/src/dtos/paciente/BuscarPacienteDTO.ts) y [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts).

> Nota: el diseño de esta tarea usa nombres de campo más descriptivos (`ci`, `pagina`, `limite`, `totalPaginas`), mientras que la implementación actual usa `documentoIdentidad`, `page`, `limit`, `totalPages`.

---

### ST1.3 — Información en detalle

#### Diseño

El endpoint de detalle debe devolver la información básica del paciente y del usuario asociado, sin incluir:

- diagnósticos,
- tratamientos,
- consultas médicas,
- documentos médicos,
- consentimientos,
- historia clínica.

#### Campos esperados

- `idPaciente`
- `documentoIdentidad` / `ci`
- `nombres`
- `apellidos`
- `fechaNacimiento`
- `sexo`
- `telefono`
- `email`
- `direccion`
- `contactoEmergencia`
- `telefonoEmergencia`
- `fechaRegistro`

#### Estructura esperada

```json
{
  "paciente": {
    "idPaciente": 1,
    "documentoIdentidad": "12345678",
    "nombres": "Juan Carlos",
    "apellidos": "Pérez López",
    "fechaNacimiento": "2000-05-20",
    "sexo": "Masculino",
    "telefono": "70000000",
    "email": "juan@example.com",
    "direccion": "Av. Principal 123",
    "contactoEmergencia": "María Pérez",
    "telefonoEmergencia": "71111111",
    "fechaRegistro": "2025-08-20T12:00:00.000Z"
  }
}
```

#### Estado actual en código

La función `obtenerDetalle` devuelve exactamente ese tipo de información y no expone los campos de historia clínica en la transformación de datos. Ver [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts).

---

### ST1.4 — Comportamiento sin resultados

#### Diseño

- Búsqueda general: si no hay coincidencias, la lista debe responder con:
  - `resultados: []`
  - `total: 0`
  - `pagina`/`page` según el formato adoptado
  - `totalPaginas: 0`
- Búsqueda directa por ID inexistente: `404 Not Found`

#### Mensajes esperados

- Lista vacía: `No se encontraron pacientes.`
- ID inexistente: `Paciente no encontrado`

#### Estado actual en código

La implementación actual cumple este comportamiento en el servicio:

- si no existe paciente por CI, devuelve lista vacía con `total: 0`,
- si no existe el paciente por ID, lanza `AppError("Paciente no encontrado", 404)`.

Ver [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts).

---

### ST1.5 — Paginación y múltiples resultados

#### Diseño

Cuando una búsqueda coincide con varios pacientes, la respuesta debe paginarse y debe incluir:

- `total`
- `pagina`
- `limite`
- `totalPaginas`
- `resultados`

#### Reglas

- `page` debe ser entero positivo.
- `limit` debe limitar la cantidad máxima por página.
- `totalPaginas = ceil(total / limit)`.

#### Estado actual en código

El servicio calcula la paginación y aplica `skip`/`take` en el repositorio. Ver:

- [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts)
- [Back/src/repositories/PacienteRepository.ts](../Back/src/repositories/PacienteRepository.ts)

El código actual usa `page`, `limit`, `totalPages`; el diseño de esta tarea usa `pagina`, `limite`, `totalPaginas`.

---

### ST1.6 — Restricciones según rol

#### Diseño

Regla de autorización:

- Administrador → acceso general permitido.
- Recepcionista → acceso general permitido.
- Médico → acceso general permitido.
- Paciente → solo su propio perfil.

La validación debe estar basada en propiedad del recurso, no solo en el rol. Para los endpoints generales de HU-10, el rol PACIENTE queda excluido por la matriz de autorización; la consulta de su propio perfil corresponde a un endpoint propio.

#### Implementación esperada

- Si el usuario autenticado es `PACIENTE` y solicita un endpoint general de HU-10: `403 Forbidden`.
- En el endpoint propio del paciente, debe existir un paciente asociado al usuario autenticado y el recurso debe coincidir con esa asociación.

#### Estado actual en código

La lógica se encuentra en [Back/src/services/PacienteService.ts](../Back/src/services/PacienteService.ts):

- `requirePermission` permite los endpoints generales únicamente a `ADMINISTRADOR`, `MEDICO` y `RECEPCIONISTA`;
- si el rol es `PACIENTE`, lanza `AppError("No tienes permisos para realizar esta acción", 403)`;
- la validación de propiedad del perfil propio queda disponible en el servicio para el endpoint específico correspondiente.

La autenticación real por middleware está implementada en [Back/src/middlewares/requirePermission.ts](../Back/src/middlewares/requirePermission.ts) usando JWT.

---

## 4. Matriz de cumplimiento

| Subtarea | Estado | Observación |
|---|---|---|
| ST1.1 Criterios de búsqueda | Cumple | Se exige al menos un filtro no vacío |
| ST1.2 Campos de resultados | Cumple | Muestra la lista esencial del paciente |
| ST1.3 Información de detalle | Cumple | Devuelve datos básicos sin historia clínica |
| ST1.4 Sin resultados | Cumple | Lista vacía y 404 por ID inexistente |
| ST1.5 Paginación | Cumple con lógica | Nombres de respuesta en inglés en código actual |
| ST1.6 Restricciones por rol | Cumple | Endpoints generales para Administrador/Médico/Recepcionista; PACIENTE queda restringido a su endpoint propio |

---

## 5. Observación de alineación técnica

La versión actual del backend cumple con la intención funcional de la HU-10 y con la mayoría de las reglas de negocio descritas en esta subtarea. La diferencia principal es terminológica:

- código actual usa `page`, `limit`, `totalPages` en vez de `pagina`, `limite`, `totalPaginas`;
- código actual usa `documentoIdentidad` en vez de `ci` en la respuesta de los resultados.

Esto no invalida la funcionalidad, pero sí hace que el payload no coincida exactamente con el nombre de campos propuesto en el diseño técnico del caso de uso.

---

## 6. Conclusión

La tarea T1_HU10 queda diseñada y documentada con base en la arquitectura actual del backend. El archivo contiene las seis subtareas completas (ST1.1 a ST1.6), y la implementación en [Back/src](../Back/src) cubre funcionalmente sus reglas, con una leve diferencia de nomenclatura de respuesta paginada y de campo de identidad respecto al formato de diseño esperado.
