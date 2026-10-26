# Implementación HU-36 y HU-37 — Sprint 5

**Fecha:** 11/09/2026
**Sprint:** Sprint 5
**Historias:** HU-36 (Registrar estado de notificación) y HU-37 (Publicar anuncios)
**Contexto:** El backlog exportado (`docs/backlog/Sprint3.csv`) seguía apuntando a la numeración previa al reajuste del Sprint 4 (ahí HU-36/37 figuran como "Crear promoción"/"Publicar anuncios", AR-39/AR-40). El equipo confirmó la numeración vigente: **HU-36 = Registrar estado de notificación** (continuación del módulo de notificaciones de Roy, HU-34/HU-35) y **HU-37 = Publicar anuncios** (AR-40 original, la "zona de anuncios" genérica del kata que HU-32/33 no cubrían). Las CA y el desglose de tareas/subtareas se documentaron primero en `docs/Sprints/5/Alan/HU36_HU37_Backlog.md`, siguiendo el mismo formato usado en HUs de sprints anteriores (HU-09 y HU-32/33 como referencia de estilo). Ambas historias se implementaron de punta a punta en backend y frontend.

---

## 1. Resumen de lo que se implementó

**HU-36 (Registrar estado de notificación)** formaliza el ciclo de vida de las notificaciones de citas que Roy había implementado en el Sprint 4: se agregó una máquina de estados validada (`PENDIENTE → ENVIADA/FALLIDA/CANCELADA`, con `ENVIADA → FALLIDA` como único tramo adicional), un endpoint para registrar el estado (`PATCH /:id/estado`), un listado con filtros y permisos (`NOTIFICACION_VER`/`NOTIFICACION_GESTIONAR`) — que antes no existían: las rutas solo exigían un token válido, sin distinción por rol. El envío de WhatsApp (HU-35) ahora delega el cambio de estado en el mismo mecanismo validado, y cancelar una cita cancela en cascada sus notificaciones pendientes.

**HU-37 (Publicar anuncios)** agrega una "zona de anuncios" genérica e independiente de las campañas de marketing (HU-32/33): un Administrador publica anuncios (título, contenido, expiración opcional) que nacen en `BORRADOR` y avanzan por `BORRADOR → PUBLICADO → ARCHIVADO`. El listado público solo muestra anuncios `PUBLICADO` y vigentes; el filtro se aplica en el backend (no solo ocultando en la interfaz), de modo que un rol sin `ANUNCIO_GESTIONAR` no puede ver borradores ni anuncios vencidos ni forzando el parámetro `todos=true`.

Al integrar HU-36 se detectó y corrigió un **bug preexistente**: `Front/src/services/notificacionService.ts` contenía una copia literal del servicio de backend (importaba `../repositories/NotificacionRepository`, `../entities/Cita.entity` y `../utils/AppError`, inexistentes en el frontend) en vez de un cliente HTTP — el build de Front (`npx tsc -b`) fallaba de raíz por esto desde que se integró la rama de Roy. Ver sección 9.

---

## 2. Archivos creados y modificados

### Backend

| Archivo | Operación | Descripción |
|---|---|---|
| `Back/src/entities/Anuncio.entity.ts` | **Nuevo** | Entidad `Anuncio` (título, contenido, fechas de publicación/expiración, estado) |
| `Back/src/migrations/1788566900000-CreateAnuncioTable.ts` | **Nuevo** | Crea la tabla `anuncio` (no existía en el esquema) |
| `Back/src/repositories/AnuncioRepository.ts` | **Nuevo** | `buscarPorId`, `listar` (zona pública vs. listado administrativo `todos=true`) |
| `Back/src/services/AnuncioService.ts` | **Nuevo** | Validaciones + máquina de estados (ver sección 4) |
| `Back/src/controllers/AnuncioController.ts` | **Nuevo** | `crear`, `cambiarEstado`, `listar`, `obtenerPorId` |
| `Back/src/dtos/anuncio.dto.ts` | **Nuevo** | `CrearAnuncioDTO`, `CambiarEstadoAnuncioDTO`, `FiltroAnunciosDTO` |
| `Back/src/routes/anuncio.routes.ts` | **Nuevo** | Rutas de anuncio (ver sección 6) |
| `Back/src/dtos/notificacion.dto.ts` | **Nuevo** | `EstadoNotificacion`, `RegistrarEstadoNotificacionDTO`, `FiltroNotificacionesDTO` |
| `Back/src/scripts/test/test-hu36-hu37.ts` | **Nuevo** | Suite de pruebas de integración (ver sección 7) |
| `Back/src/entities/Notificacion.entity.ts` | Sin cambios | Ya cubría los 4 estados requeridos |
| `Back/src/repositories/NotificacionRepository.ts` | **Modificado** | Se agregó `listar(filtros)` con filtro por estado/canal/idCita/idUsuario |
| `Back/src/services/notificacion.service.ts` | **Modificado** | Máquina de estados, `registrarEstado`, `cancelarPendientesPorCita`, `listar`/`obtenerPorId` con restricción de propiedad (ver sección 3) |
| `Back/src/controllers/notificacion.controller.ts` | **Modificado** | Se agregaron `listar`, `obtenerPorId`, `registrarEstado` |
| `Back/src/routes/notificaciones.routes.ts` | **Modificado** | Migradas de `authenticateJWT` a `requirePermission`; nuevas rutas `GET /`, `GET /:id`, `PATCH /:id/estado` |
| `Back/src/services/CitaService.ts` | **Modificado** | `cancelar()` invoca `cancelarPendientesPorCita` (HU-36 CA-05) |
| `Back/src/config/database.ts` | **Modificado** | Registro de la entidad `Anuncio` y la migración `CreateAnuncioTable` |
| `Back/src/server.ts` | **Modificado** | Montaje de `/api/anuncios` |
| `Back/src/permissions/rolePermissions.ts` | **Modificado** | Permisos `NOTIFICACION_VER/GESTIONAR`, `ANUNCIO_VER/GESTIONAR` |
| `Back/package.json` | **Modificado** | Script `test:hu36-37` |

### Frontend

| Archivo | Operación | Descripción |
|---|---|---|
| `Front/src/services/anuncioService.ts` | **Nuevo** | Cliente HTTP de anuncios |
| `Front/src/pages/Anuncios/AnunciosPage.tsx` | **Nuevo** | Zona de anuncios: listado + gestión para Administrador |
| `Front/src/pages/Notificaciones/NotificacionesPage.tsx` | **Nuevo** | Listado de notificaciones con filtro y cambio de estado |
| `Front/src/services/notificacionService.ts` | **Reescrito** | Bug preexistente corregido: ahora es un cliente HTTP real (ver sección 9) |
| `Front/src/pages/Citas/GestionCitasPage.tsx` | **Modificado** | Ajustado a la nueva firma de `notificacionService` (sin `token` explícito) |
| `Front/src/routes/AppRoutes.tsx` | **Modificado** | Rutas `/anuncios` y `/notificaciones` |
| `Front/src/components/Nav.tsx` | **Modificado** | Enlaces "Anuncios" y "Notificaciones" en la barra de navegación |

### Documentación

| Archivo | Operación | Descripción |
|---|---|---|
| `docs/MER/BD.sql` | **Modificado** | Tabla `anuncio` agregada |
| `docs/Sprints/5/Alan/HU36_HU37_Backlog.md` | **Nuevo** | CA y desglose de tareas/subtareas |
| `docs/Sprints/5/Alan/HU36_HU37_Notificaciones_Anuncios.md` | **Nuevo** | Este informe |

---

## 3. Máquina de estados — `notificacion.service.ts`

```
PENDIENTE ──▶ ENVIADA ──▶ FALLIDA
   │
   ├──▶ FALLIDA
   └──▶ CANCELADA
```

```typescript
const TRANSICIONES_VALIDAS: Record<EstadoNotificacion, EstadoNotificacion[]> = {
  PENDIENTE: ["ENVIADA", "FALLIDA", "CANCELADA"],
  ENVIADA: ["FALLIDA"],
  FALLIDA: [],
  CANCELADA: [],
};
```

`enviarRecordatorioWhatsApp()` (HU-35) ya no asigna `estado`/`fechaEnvio` directamente: delega en `registrarEstado()`, tanto para el caso feliz (`ENVIADA`) como para el fallo por falta de teléfono (`FALLIDA`). Esto deja un único camino validado para mutar el estado de una notificación, evitando que dos piezas de código diverjan en la definición de transiciones válidas.

`CitaService.cancelar()` invoca `notificacionService.cancelarPendientesPorCita(idCita)` después de marcar la cita como `CANCELADA`, envuelto en `try/catch` (igual criterio que la generación de notificación en `reservar()`): un fallo al cancelar notificaciones no debe impedir que la cita se cancele.

---

## 4. Máquina de estados — `AnuncioService.ts`

```
BORRADOR ──▶ PUBLICADO ──▶ ARCHIVADO
```

Al transicionar a `PUBLICADO`: si el anuncio no tiene `fechaPublicacion`, se asigna la fecha actual automáticamente; si tiene `fechaExpiracion` y esta ya pasó, se rechaza con `400`. Igual que en `CampanaService`/`AnuncioService` reutiliza el criterio ya usado en HU-32/33 de guardar fechas como string `"YYYY-MM-DD"` (no como `Date` parseado) para evitar el desfase de huso horario en columnas `date` documentado en `docs/Sprints/4/Alan/HU32_HU33_Campanas_Promociones.md` (sección 5).

---

## 5. Visibilidad pública vs. administrativa de anuncios

`AnuncioRepository.listar()` aplica el filtro de "zona de anuncios" **en el backend**, no en la interfaz:

```typescript
if (filtros?.todos) {
  // reservado a ANUNCIO_GESTIONAR: filtro libre por estado
} else {
  // solo PUBLICADO y (sin fecha_expiracion O fecha_expiracion >= hoy)
}
```

`AnuncioController` solo activa `todos=true` si `req.authUser` tiene el permiso `ANUNCIO_GESTIONAR` (`hasPermission`); para cualquier otro rol el parámetro de query se ignora silenciosamente y siempre se aplica el filtro público. Se verificó con una llamada HTTP real que un usuario `MEDICO` autenticado obtiene `200` al listar anuncios pero no ve un anuncio en `BORRADOR` recién creado por un Administrador (Prueba 9 del script de pruebas cubre el mismo caso a nivel de servicio).

---

## 6. Endpoints disponibles

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/notificaciones` | `NOTIFICACION_VER` | Listado con filtros (`estado`, `canal`, `idCita`); un PACIENTE solo ve las suyas |
| `GET` | `/api/notificaciones/:id` | `NOTIFICACION_VER` | Detalle (403 si un PACIENTE consulta una notificación ajena) |
| `GET` | `/api/notificaciones/cita/:idCita` | `NOTIFICACION_VER` | Notificaciones de una cita (HU-34, sin cambios) |
| `POST` | `/api/notificaciones/:id/enviar-whatsapp` | `NOTIFICACION_GESTIONAR` | Enviar recordatorio (HU-35, ahora vía `registrarEstado`) |
| `PATCH` | `/api/notificaciones/:id/estado` | `NOTIFICACION_GESTIONAR` | Registrar estado según la máquina de estados (HU-36) |
| `GET` | `/api/anuncios` | `ANUNCIO_VER` | Listado (público: solo publicados/vigentes; `todos=true` con `ANUNCIO_GESTIONAR`) |
| `GET` | `/api/anuncios/:id` | `ANUNCIO_VER` | Detalle (mismo criterio de visibilidad) |
| `POST` | `/api/anuncios` | `ANUNCIO_GESTIONAR` | Crear anuncio (estado inicial `BORRADOR`) |
| `PATCH` | `/api/anuncios/:id/estado` | `ANUNCIO_GESTIONAR` | Cambiar estado según la máquina de estados |

Permisos asignados: `ADMINISTRADOR` tiene las 4 combinaciones de gestión (`NOTIFICACION_GESTIONAR`, `ANUNCIO_GESTIONAR`, más `*_VER`); `RECEPCIONISTA` gestiona notificaciones (envía y registra el estado de los recordatorios a pacientes) pero solo consulta anuncios; `MEDICO` y `PACIENTE` solo tienen los permisos `*_VER` (el `PACIENTE` restringido además a sus propias notificaciones, aplicado en el service).

---

## 7. Suite de pruebas — `test-hu36-hu37.ts`

Ejecutar con:
```bash
cd Back && npm run test:hu36-37
```

Resultado del último run: **10/10 pruebas pasadas — exit code 0**.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Registro de transición válida `PENDIENTE → ENVIADA` (asigna `fechaEnvio`) | ✅ |
| 2 | Rechazo de transición inválida `ENVIADA → PENDIENTE` (400) | ✅ |
| 3 | Rechazo de registro de estado sobre notificación inexistente (404) | ✅ |
| 4 | Un PACIENTE solo ve sus propias notificaciones; acceso a notificación ajena → 403 | ✅ |
| 5 | Creación de anuncio válido → estado `BORRADOR` | ✅ |
| 6 | Rechazo de anuncio sin título (400) | ✅ |
| 7 | Publicación de anuncio → asigna `fechaPublicacion` automáticamente | ✅ |
| 8 | Rechazo de transición inválida `PUBLICADO → BORRADOR` (400) | ✅ |
| 9 | Listado público excluye `BORRADOR`; listado `todos=true` los incluye | ✅ |
| 10 | Permisos por rol: gestión vs. solo lectura en notificaciones y anuncios | ✅ |

No se limpiaron los registros de prueba (notificación y anuncios creados por el script) al finalizar, siguiendo el mismo criterio que `test-hu32-hu33-marketing.ts` (que tampoco elimina las campañas/promociones de prueba que crea).

Typecheck limpio en ambos proyectos:
```bash
cd Back && npm run typecheck   # exit 0
cd Front && npx tsc -b         # exit 0
cd Front && npm run build      # build de producción exitoso
```

Adicionalmente se verificó el flujo completo por HTTP real (backend levantado con `npm run dev`, login con los usuarios de `docs/usuariosdeprueba.txt`):
- Un Administrador creó un anuncio (`BORRADOR`), confirmó que no aparecía en el listado público, lo publicó (`PATCH /estado`) y confirmó que sí aparecía después.
- Un Médico recibió `403` al intentar crear un anuncio, `200` al listar anuncios (zona pública) y al listar notificaciones, y `403` al intentar registrar el estado de una notificación (no tiene `NOTIFICACION_GESTIONAR`).

---

## 8. Frontend

**`NotificacionesPage.tsx`** (ruta `/notificaciones`, visible para todos): tabla con canal, tipo, fechas y badge de estado, con filtro por estado. Para Administrador/Recepcionista se muestran botones de transición (solo los estados alcanzables desde el estado actual, según el mismo mapa del backend); para Médico y Paciente es de solo lectura (Paciente ve únicamente sus propias notificaciones, filtrado por el backend).

**`AnunciosPage.tsx`** (ruta `/anuncios`, visible para todos): zona de anuncios con tarjetas/tabla de título, contenido, fechas de publicación/expiración y badge de estado; para Administrador, formulario de creación y botones de transición de estado. Para los demás roles, listado de solo lectura limitado a anuncios publicados y vigentes (reforzado por el backend, no solo ocultado en la interfaz).

---

## 9. Corrección de bug preexistente: `Front/src/services/notificacionService.ts`

Al extender el módulo de notificaciones para HU-36 se detectó que este archivo, integrado junto con la rama de notificaciones de Roy, era una **copia literal del servicio de backend** en lugar de un cliente HTTP:

```typescript
// Front/src/services/notificacionService.ts (antes de la corrección)
import { NotificacionRepository } from "../repositories/NotificacionRepository"; // no existe en Front
import { Cita } from "../entities/Cita.entity"; // no existe en Front
import { AppError } from "../utils/AppError"; // no existe en Front
```

**Impacto:** el build de frontend (`npx tsc -b`) fallaba desde la integración de esa rama con 6 errores de compilación (3 módulos inexistentes + 3 usos de métodos que la clase exportada no tenía: `GestionCitasPage.tsx` llamaba a `notificacionService.obtenerPorCita(token, idCita)` y `notificacionService.enviarWhatsApp(token, id)`, ninguno de los cuales existía en el archivo real).

**Corrección:** se reescribió el archivo como un cliente HTTP (`fetch` contra `/api/notificaciones/...`), siguiendo el mismo patrón de funciones exportadas + `getAuthHeaders()` interno que ya usan `marketingService.ts` y `citasService.ts` (en vez del patrón de clase con `token` explícito que tenía la versión rota, inconsistente con el resto del proyecto). Se ajustaron los dos call sites en `GestionCitasPage.tsx` (`obtenerNotificacionesPorCita`, `enviarWhatsApp`) para la nueva firma sin `token`. Verificado con `npx tsc -b` y `npm run build` en Front, ambos en verde.
