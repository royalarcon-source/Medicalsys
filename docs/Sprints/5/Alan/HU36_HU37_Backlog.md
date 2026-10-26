# HU-36 y HU-37 — Notificaciones y Zona de Anuncios

**Sprint:** 5
**Historias:** HU-36 (Registrar estado de notificación) y HU-37 (Publicar anuncios)
**Nota sobre numeración:** El backlog exportado en `docs/backlog/Sprint3.csv` quedó desactualizado desde el Sprint 4 (ver `docs/Sprints/4/Alan/HU32_HU33_Backlog.md`) — ahí HU-36/37 figuran como "Crear promoción" (AR-39, ya implementada como HU-33) y "Publicar anuncios" (AR-40). El equipo confirmó la numeración vigente para este sprint: **HU-36 = Registrar estado de notificación** (continuación de HU-34/HU-35, el módulo de notificaciones de citas de Roy) y **HU-37 = Publicar anuncios** (AR-40 del backlog original, la "zona de anuncios" del kata que hasta ahora solo cubrían campañas/promociones). Este documento define las CA y tareas que faltaban para estas dos historias, siguiendo el mismo formato usado en HUs de sprints anteriores (ver HU-09 y HU-32/33 como referencia de estilo).

**Origen funcional:**
- HU-36 continúa el módulo de notificaciones de citas (`docs/Sprints/4/Roy/HU-26_HU27.md`, implementado como HU-34/HU-35 en el código: `Back/src/services/notificacion.service.ts`), que generaba y enviaba recordatorios de WhatsApp pero no tenía un mecanismo formal para registrar y consultar el estado de esas notificaciones (solo dos transiciones ad-hoc dentro del método de envío, sin permisos ni endpoints de consulta).
- HU-37 retoma la "zona de anuncios" del kata arquitectónico (`docs/PrimerDesafioKataArquitectónico.docx`, sección 3), que HU-32/33 cubrieron parcialmente con campañas/promociones de marketing, pero sin un canal para comunicados generales (avisos administrativos, horarios especiales, etc.) que no están atados a una campaña.

---

## HU-36 — Registrar estado de notificación

**Historia:** Como Administrador o Recepcionista, quiero registrar y consultar el estado de las notificaciones enviadas a los pacientes (recordatorios de citas), para llevar trazabilidad de cuáles se enviaron, cuáles fallaron y cuáles quedaron pendientes o canceladas.

### h1. Objetivo

Formalizar el ciclo de vida de una notificación (`PENDIENTE → ENVIADA/FALLIDA/CANCELADA`, con `ENVIADA → FALLIDA` como único tramo adicional para reportar fallos de entrega posteriores al envío) mediante un endpoint dedicado de cambio de estado, un listado con filtros y permisos explícitos — hoy inexistentes: las rutas de notificaciones solo exigían un token válido (`authenticateJWT`), sin restricción por rol ni por propiedad.

### h2. CA-01 — Acceso a registrar estado

El endpoint de cambio de estado solo está disponible para **Administrador** y **Recepcionista** (permiso `NOTIFICACION_GESTIONAR`).

---

### h2. CA-02 — Máquina de estados

El sistema debe validar transiciones de estado según el mapa:

```
PENDIENTE ──▶ ENVIADA ──▶ FALLIDA
   │
   ├──▶ FALLIDA
   └──▶ CANCELADA
```

- `FALLIDA` y `CANCELADA` son estados terminales.
- Cualquier transición fuera de este mapa (ej. `ENVIADA → PENDIENTE`) se rechaza con `400`.

---

### h2. CA-03 — Notificación inexistente

Registrar estado sobre un `idNotificacion` que no existe responde `404 Notificación no encontrada`.

---

### h2. CA-04 — Envío de WhatsApp reutiliza el registro de estado

El endpoint existente de HU-35 (`POST /:id/enviar-whatsapp`) internamente registra el cambio de estado (`ENVIADA` o `FALLIDA`) a través del mismo mecanismo validado de HU-36, en vez de escribir el campo `estado` directamente — un solo camino para mutar el estado de una notificación.

---

### h2. CA-05 — Cancelación en cascada

Al cancelar una cita (`CitaService.cancelar`), todas sus notificaciones en estado `PENDIENTE` se registran automáticamente como `CANCELADA`.

---

### h2. CA-06 — Listado con filtros

Cualquier usuario autenticado (permiso `NOTIFICACION_VER`, asignado a los 4 roles) puede listar notificaciones, filtrando opcionalmente por `estado`, `canal` e `idCita`.

---

### h2. CA-07 — Restricción de propiedad para PACIENTE

Un usuario con rol **Paciente** solo puede ver (listar y consultar por ID) sus propias notificaciones, sin importar los filtros enviados. El intento de consultar por ID una notificación de otro usuario responde `403`.

---

### h2. CA-08 — Consulta por ID

Cualquier usuario con `NOTIFICACION_VER` puede consultar el detalle de una notificación por su identificador (sujeto a CA-07 si es Paciente).

---

### h2. CA-09 — Acceso no autorizado

Un usuario sin `NOTIFICACION_GESTIONAR` que intente registrar un estado recibe `403 Acceso denegado`.

---

### h2. CA-10 — Persistencia

El estado y la fecha de envío actualizados deben reflejarse en PostgreSQL tras cada transición.

---

### h2. CA-11 — Manejo de errores

Los errores no deben exponer SQL, stack traces ni información interna del backend.

---

**Definition of Done (HU-36)**
- ☐ Entidad `Notificacion` revisada y confirmada (ya existente, sin cambios de esquema).
- ☐ `NotificacionRepository.listar(filtros)` implementado.
- ☐ `NotificacionService.registrarEstado()` implementado con la máquina de estados.
- ☐ `enviarRecordatorioWhatsApp()` refactorizado para usar `registrarEstado()` internamente.
- ☐ `NotificacionService.cancelarPendientesPorCita()` implementado e integrado en `CitaService.cancelar()`.
- ☐ `NotificacionService.listar()`/`obtenerPorId()` con restricción de propiedad para PACIENTE.
- ☐ Endpoint `GET /api/notificaciones` con filtros implementado.
- ☐ Endpoint `GET /api/notificaciones/:id` implementado.
- ☐ Endpoint `PATCH /api/notificaciones/:id/estado` implementado.
- ☐ Rutas migradas de `authenticateJWT` a `requirePermission` (`NOTIFICACION_VER`/`NOTIFICACION_GESTIONAR`).
- ☐ Permisos añadidos a `rolePermissions.ts` y asignados correctamente (ADMINISTRADOR y RECEPCIONISTA gestionan, los 4 roles consultan).
- ☐ Errores manejados sin exponer detalles internos.
- ☐ Frontend: página de notificaciones con listado, filtros y acciones de cambio de estado para quienes gestionan.
- ☐ Corrección del bug preexistente en `Front/src/services/notificacionService.ts` (ver sección 9 del informe de implementación).
- ☐ Pruebas automatizadas (`npm run test:hu36-37`) en verde.
- ☐ Typecheck backend y frontend limpios.
- ☐ Código revisado/integrado.

---

## HU-37 — Publicar anuncios

**Historia:** Como Administrador, quiero publicar anuncios generales (avisos, comunicados, horarios especiales) visibles para pacientes y personal del centro médico, para informar novedades que no están atadas a una campaña de marketing específica.

### h1. Objetivo

Permitir que un **Administrador** cree anuncios con título, contenido y una fecha de expiración opcional. El anuncio nace en `BORRADOR` y avanza por un ciclo de vida controlado (`BORRADOR → PUBLICADO → ARCHIVADO`). La zona de anuncios pública solo muestra anuncios `PUBLICADO` y vigentes (sin expirar); el Administrador puede consultar el listado completo (incluyendo borradores, archivados y vencidos).

### h2. CA-01 — Acceso a la creación

El endpoint de creación de anuncios solo está disponible para el rol **Administrador** (permiso `ANUNCIO_GESTIONAR`).

---

### h2. CA-02 — Datos obligatorios

El sistema debe exigir como mínimo: título y contenido. La fecha de expiración es opcional.

---

### h2. CA-03 — Validación de datos

- Título: no vacío, máximo 150 caracteres.
- Contenido: no vacío.
- Fecha de expiración (si se especifica): fecha válida.

---

### h2. CA-04 — Estado inicial

Todo anuncio creado queda en `estado = "BORRADOR"`, sin importar lo que se envíe en la petición.

---

### h2. CA-05 — Transición de estados

```
BORRADOR ──▶ PUBLICADO ──▶ ARCHIVADO
```

- Cualquier transición fuera de este mapa (ej. `PUBLICADO → BORRADOR`) se rechaza con `400`.
- Al pasar a `PUBLICADO`, si el anuncio no tiene `fechaPublicacion` asignada, se establece automáticamente a la fecha actual.
- No se puede publicar un anuncio cuya fecha de expiración ya pasó (`400`).

---

### h2. CA-06 — Zona de anuncios pública

Cualquier usuario autenticado (permiso `ANUNCIO_VER`) puede listar anuncios; por defecto el listado solo incluye anuncios `PUBLICADO` y vigentes (sin `fechaExpiracion` o con `fechaExpiracion >= hoy`). Un usuario con `ANUNCIO_GESTIONAR` puede pedir el listado completo con el parámetro `todos=true`; este parámetro se ignora (aplicando siempre el filtro público) para roles sin `ANUNCIO_GESTIONAR` — la restricción se aplica en el backend, no solo en la interfaz.

---

### h2. CA-07 — Consulta por ID

Aplica el mismo criterio de visibilidad de CA-06: un usuario sin `ANUNCIO_GESTIONAR` que consulta por ID un anuncio no publicado o vencido recibe `404` (no se revela su existencia).

---

### h2. CA-08 — Acceso no autorizado

Un usuario sin `ANUNCIO_GESTIONAR` que intente crear un anuncio o cambiar su estado recibe `403 Acceso denegado`.

---

### h2. CA-09 — Persistencia

Un anuncio creado correctamente debe poder consultarse posteriormente desde PostgreSQL, reflejando el estado actualizado tras cada transición. Requiere una migración nueva (`anuncio` no existía en el esquema).

---

### h2. CA-10 — Manejo de errores

Los errores no deben exponer SQL, stack traces ni información interna del backend.

---

**Definition of Done (HU-37)**
- ☐ Entidad `Anuncio` creada.
- ☐ Migración `CreateAnuncioTable` creada y ejecutada.
- ☐ `AnuncioRepository` implementado (`buscarPorId`, `listar` con filtro público/administrativo).
- ☐ `AnuncioService` implementado (creación + máquina de estados + listado).
- ☐ Endpoint `POST /api/anuncios` implementado.
- ☐ Endpoint `PATCH /api/anuncios/:id/estado` implementado con validación de transición.
- ☐ Endpoints `GET /api/anuncios` y `GET /api/anuncios/:id` implementados con el filtro de visibilidad de CA-06/07.
- ☐ Permisos `ANUNCIO_VER`/`ANUNCIO_GESTIONAR` añadidos a `rolePermissions.ts` y asignados correctamente.
- ☐ Validaciones de CA-02/03/05 implementadas.
- ☐ Errores manejados sin exponer detalles internos.
- ☐ Frontend: zona de anuncios visible para todos, formulario de creación y botones de transición solo para Administrador.
- ☐ `docs/MER/BD.sql` actualizado con la tabla `anuncio`.
- ☐ Pruebas automatizadas (`npm run test:hu36-37`) en verde.
- ☐ Typecheck backend y frontend limpios.
- ☐ Código revisado/integrado.

---

## Desglose de Tareas y Subtareas

### HU-36

**T1_HU36 Extender el modelo y la persistencia de notificaciones**
- ST1.1 Confirmar que `Notificacion.entity.ts` ya cubre los 4 estados requeridos (sin migración nueva).
- ST1.2 Crear `Back/src/dtos/notificacion.dto.ts` (`EstadoNotificacion`, `RegistrarEstadoNotificacionDTO`, `FiltroNotificacionesDTO`).
- ST1.3 Implementar `NotificacionRepository.listar(filtros)` con filtros por estado/canal/idCita/idUsuario.

**T2_HU36 Implementar lógica de negocio**
- ST2.1 Definir el mapa `TRANSICIONES_VALIDAS` de la máquina de estados en `notificacion.service.ts`.
- ST2.2 Implementar `registrarEstado(id, dto)` validando la transición.
- ST2.3 Refactorizar `enviarRecordatorioWhatsApp()` para delegar el cambio de estado en `registrarEstado()`.
- ST2.4 Implementar `cancelarPendientesPorCita(idCita)`.
- ST2.5 Implementar `listar(filtros, authUser)` y `obtenerPorId(id, authUser)` con restricción de propiedad para PACIENTE.

**T3_HU36 Implementar endpoints**
- ST3.1 Agregar `listar`, `obtenerPorId` y `registrarEstado` a `notificacion.controller.ts`.
- ST3.2 Agregar rutas `GET /`, `GET /:id` y `PATCH /:id/estado` en `notificaciones.routes.ts`.
- ST3.3 Migrar las rutas existentes de `authenticateJWT` a `requirePermission`.

**T4_HU36 Implementar autorización**
- ST4.1 Agregar `NOTIFICACION_VER`/`NOTIFICACION_GESTIONAR` al union type `Permission` en `rolePermissions.ts`.
- ST4.2 Asociar `NOTIFICACION_VER` a los 4 roles.
- ST4.3 Asociar `NOTIFICACION_GESTIONAR` a ADMINISTRADOR y RECEPCIONISTA.

**T5_HU36 Integración con Citas**
- ST5.1 Invocar `cancelarPendientesPorCita(idCita)` desde `CitaService.cancelar()`.

**T6_HU36 Frontend**
- ST6.1 Corregir el bug preexistente de `Front/src/services/notificacionService.ts` (contenía código de backend copiado, no compilaba).
- ST6.2 Agregar `listarNotificaciones` y `registrarEstadoNotificacion` al servicio frontend.
- ST6.3 Crear `NotificacionesPage.tsx` con listado, filtro por estado y botones de transición para quienes gestionan.
- ST6.4 Registrar ruta `/notificaciones` y enlace de navegación.

**T7_HU36 Pruebas**
- ST7.1 Crear `Back/src/scripts/test/test-hu36-hu37.ts` con los casos de HU-36.
- ST7.2 Agregar script `test:hu36-37` en `Back/package.json`.

### HU-37

**T1_HU37 Modelo y persistencia**
- ST1.1 Crear `Back/src/entities/Anuncio.entity.ts`.
- ST1.2 Crear la migración `CreateAnuncioTable` y ejecutarla (`npm run migration:run`).
- ST1.3 Crear `Back/src/repositories/AnuncioRepository.ts` con `buscarPorId` y `listar(filtros)`.

**T2_HU37 Implementar lógica de negocio**
- ST2.1 Crear `Back/src/dtos/anuncio.dto.ts`.
- ST2.2 Crear `Back/src/services/AnuncioService.ts`: `crear(dto)` con validaciones.
- ST2.3 Definir el mapa `TRANSICIONES_VALIDAS` (`BORRADOR → PUBLICADO → ARCHIVADO`).
- ST2.4 Implementar `cambiarEstado(id, dto)`, asignando `fechaPublicacion` automáticamente al publicar.
- ST2.5 Implementar `listar(filtros)`/`obtenerPorId(id, todos)` con el filtro de visibilidad pública vs. administrativa.

**T3_HU37 Implementar endpoints**
- ST3.1 Crear `Back/src/controllers/AnuncioController.ts`.
- ST3.2 Crear `Back/src/routes/anuncio.routes.ts` con las 4 rutas.
- ST3.3 Montar la ruta `/api/anuncios` en `Back/src/server.ts`.

**T4_HU37 Implementar autorización**
- ST4.1 Agregar `ANUNCIO_VER`/`ANUNCIO_GESTIONAR` al union type `Permission`.
- ST4.2 Asociar `ANUNCIO_VER` a los 4 roles.
- ST4.3 Asociar `ANUNCIO_GESTIONAR` solo a ADMINISTRADOR.

**T5_HU37 Frontend**
- ST5.1 Crear `Front/src/services/anuncioService.ts` (listar/crear/cambiar estado).
- ST5.2 Crear `AnunciosPage.tsx` con listado + badge de estado.
- ST5.3 Crear formulario de creación y botones de transición, visibles solo para Administrador.
- ST5.4 Registrar ruta `/anuncios` y enlace de navegación.

**T6_HU37 Documentación y pruebas**
- ST6.1 Actualizar `docs/MER/BD.sql` con la tabla `anuncio`.
- ST6.2 Extender `test-hu36-hu37.ts` con los casos de HU-37.
- ST6.3 Ejecutar `npm run test:hu36-37` y verificar 100% verde.
