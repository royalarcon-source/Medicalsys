# Implementación HU-32 y HU-33 — Sprint 4

**Fecha:** 07/09/2026
**Sprint:** Sprint 4
**Historias:** HU-32 (Crear campaña) y HU-33 (Crear promoción) — Módulo de Marketing
**Contexto:** El backlog exportado (`docs/backlog/Sprint3.csv`) tenía la numeración desactualizada de HU-32/33; el equipo la corrigió y confirmó que HU-32 = Crear campaña, HU-33 = Crear promoción, sin CA ni tareas definidas todavía. Las CA y el desglose de tareas/subtareas se documentaron primero en `docs/Sprints/4/Alan/HU32_HU33_Backlog.md`, siguiendo el mismo formato usado en HUs de sprints anteriores (HU-09 como referencia de estilo). Ambas historias se implementaron de punta a punta en backend y frontend, reutilizando el patrón CRUD ligero que ya usa el proyecto para catálogos simples (`ServicioService`/`ServicioController`), y no el patrón transaccional pesado de `FacturaService` ni el de integración externa de `SinIntegrationService`, ya que Campaña/Promoción son contenido de gestión sin integraciones externas.

---

## 1. Resumen de lo que se implementó

**HU-32 (Crear campaña)** permite a un Administrador crear campañas de marketing (nombre, descripción, vigencia) que nacen en estado `BORRADOR` y avanzan por una máquina de estados controlada (`BORRADOR → PROGRAMADA → ACTIVA → FINALIZADA`, con `CANCELADA` como salida anticipada desde cualquier estado no terminal). El listado de campañas es la "zona de anuncios" del kata arquitectónico: visible para los 4 roles, aunque solo el Administrador gestiona su ciclo de vida.

**HU-33 (Crear promoción)** permite crear promociones asociadas obligatoriamente a una campaña existente, con un porcentaje de descuento opcional (0-100%) y vigencia propia, validada para que caiga dentro del rango de la campaña padre. Nace `activa = true` y puede activarse/desactivarse manualmente. Igual que las campañas, su listado es visible para todos los roles.

---

## 2. Archivos creados y modificados

### Backend

| Archivo | Operación | Descripción |
|---|---|---|
| `Back/src/repositories/CampanaRepository.ts` | **Nuevo** | `buscarPorId`, `listar` con filtros de estado/fechas |
| `Back/src/repositories/PromocionRepository.ts` | **Nuevo** | `buscarPorId` (con relación a campaña), `listar` con filtros |
| `Back/src/services/CampanaService.ts` | **Nuevo** | Validaciones + máquina de estados (ver sección 3) |
| `Back/src/services/PromocionService.ts` | **Nuevo** | Validaciones + verificación de campaña padre (ver sección 4) |
| `Back/src/controllers/CampanaController.ts` | **Nuevo** | `crear`, `cambiarEstado`, `listar`, `obtenerPorId` |
| `Back/src/controllers/PromocionController.ts` | **Nuevo** | `crear`, `cambiarEstado`, `listar`, `obtenerPorId` |
| `Back/src/dtos/campana.dto.ts` | **Nuevo** | `CrearCampanaDTO`, `CambiarEstadoCampanaDTO`, `FiltroCampanasDTO` |
| `Back/src/dtos/promocion.dto.ts` | **Nuevo** | `CrearPromocionDTO`, `CambiarEstadoPromocionDTO`, `FiltroPromocionesDTO` |
| `Back/src/routes/campana.routes.ts` | **Nuevo** | Rutas de campaña (ver sección 6) |
| `Back/src/routes/promocion.routes.ts` | **Nuevo** | Rutas de promoción (ver sección 6) |
| `Back/src/scripts/test/test-hu32-hu33-marketing.ts` | **Nuevo** | Suite de pruebas de integración (ver sección 7) |
| `Back/src/server.ts` | **Modificado** | Montaje de `/api/campanas` y `/api/promociones` |
| `Back/src/permissions/rolePermissions.ts` | **Modificado** | Permisos `CAMPANA_VER/GESTIONAR`, `PROMOCION_VER/GESTIONAR` |
| `Back/package.json` | **Modificado** | Script `test:hu32-33` |

### Frontend

| Archivo | Operación | Descripción |
|---|---|---|
| `Front/src/services/marketingService.ts` | **Nuevo** | Cliente HTTP de campañas y promociones |
| `Front/src/pages/Marketing/MarketingPage.tsx` | **Nuevo** | Página con tabs "Campañas" y "Promociones" |
| `Front/src/routes/AppRoutes.tsx` | **Modificado** | Ruta `/marketing` (todos los roles autenticados) |
| `Front/src/components/Nav.tsx` | **Modificado** | Enlace "Marketing" en la barra de navegación |

No se requirió ninguna migración de base de datos: las tablas `campana` y `promocion` y sus entidades TypeORM ya existían en el proyecto (greenfield parcial).

---

## 3. Máquina de estados — `CampanaService.ts`

```
BORRADOR ──▶ PROGRAMADA ──▶ ACTIVA ──▶ FINALIZADA
   │              │             │
   └──────────────┴─────────────┴──▶ CANCELADA
```

Implementada como un mapa de transiciones válidas:

```typescript
const TRANSICIONES_VALIDAS: Record<EstadoCampana, EstadoCampana[]> = {
  BORRADOR: ["PROGRAMADA", "CANCELADA"],
  PROGRAMADA: ["ACTIVA", "CANCELADA"],
  ACTIVA: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: [],
  CANCELADA: [],
};
```

`cambiarEstado()` rechaza con `AppError(400)` cualquier transición fuera de ese mapa (ej. `FINALIZADA → ACTIVA`). El mismo mapa se replica en el frontend (`MarketingPage.tsx`) para renderizar únicamente los botones de transición válidos desde el estado actual de cada campaña.

---

## 4. Validaciones — `PromocionService.crear()`

1. `idCampana` obligatorio y debe corresponder a una campaña existente (`CampanaRepository.buscarPorId`); si no existe → `404`.
2. Nombre obligatorio, máximo 150 caracteres.
3. Fecha de inicio obligatoria y válida; fecha de fin (si se especifica) debe ser ≥ fecha de inicio.
4. La vigencia de la promoción debe caer dentro del rango de la campaña padre (no puede iniciar antes que la campaña, ni exceder su fecha de fin si esta tiene una definida).
5. `porcentajeDesc` (si se especifica) debe estar entre 0 y 100.

Toda promoción nace con `activa = true`; `cambiarEstado()` permite alternar ese campo (activar/desactivar) sin restricciones adicionales de máquina de estados.

---

## 5. Decisiones de diseño y tradeoffs

### Uso consistente de `AppError`

Se detectó que dos servicios existentes del proyecto (`ServicioService.ts`, `FacturaService.ts`) usan `throw { status, message }` (objeto plano) en lugar de la clase `AppError`. Como `Back/src/middlewares/errorHandler.ts` solo reconoce `instanceof AppError` para devolver el status/mensaje correctos (cualquier otro throw cae al branch `500` genérico), ese patrón alterno es inconsistente con el manejador de errores actual — probablemente un defecto preexistente no detectado porque esos servicios no tienen pruebas que verifiquen el código de estado HTTP específico. Para HU-32/33 se usó `AppError` de forma consistente en ambos servicios nuevos; no se modificaron `ServicioService.ts` ni `FacturaService.ts` por estar fuera del alcance de estas dos historias.

### Persistencia de fechas como string, no como `Date`

Durante las pruebas se detectó un bug real: construir `new Date("2026-01-01")` e insertarlo directamente en una columna TypeORM `type: "date"` provoca un desfase de un día en hosts con huso horario negativo respecto a UTC (`new Date(string)` interpreta la fecha en UTC, pero el driver de PostgreSQL serializa columnas `date` usando los componentes *locales* del objeto `Date`). La corrección aplicada fue conservar el string `"YYYY-MM-DD"` recibido del DTO para el `create()` de la entidad (evitando así la conversión con huso horario), usando el `Date` parseado únicamente para las validaciones en memoria (comparaciones de orden y rango). Se verificó con `npm run test:hu32-33` y con pruebas HTTP reales que las fechas se persisten exactamente como se envían. Este mismo patrón (`new Date(...)` pasado directo a `.create()`) existe en al menos un lugar más del código base (`PacienteRepository.crear`, HU-09) — queda fuera de alcance corregirlo aquí, pero se deja documentado por si el equipo quiere revisarlo.

### Autorización a nivel de ruta, no de servicio

A diferencia de `CitaService`/`FacturaService` (que reciben un `usuarioActual` y aplican restricciones de propiedad internamente, por ejemplo "el paciente solo ve sus propias facturas"), `CampanaService`/`PromocionService` no necesitan ese filtrado: todo el contenido de marketing es visible para cualquier rol autenticado. La única restricción es "quién puede gestionar" (`CAMPANA_GESTIONAR`/`PROMOCION_GESTIONAR`), que se resuelve completamente en la capa de rutas con `requirePermission`, igual que en `servicio.routes.ts`. Por esto la Prueba 10 del script de pruebas valida los permisos directamente contra `rolePermissions.ts` en lugar de simular una llamada HTTP.

---

## 6. Endpoints disponibles

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/campanas` | `CAMPANA_VER` | Listado con filtros (`estado`, `fechaInicio`, `fechaFin`) |
| `GET` | `/api/campanas/:id` | `CAMPANA_VER` | Detalle de campaña |
| `POST` | `/api/campanas` | `CAMPANA_GESTIONAR` | Crear campaña (estado inicial `BORRADOR`) |
| `PATCH` | `/api/campanas/:id/estado` | `CAMPANA_GESTIONAR` | Cambiar estado según la máquina de estados |
| `GET` | `/api/promociones` | `PROMOCION_VER` | Listado con filtros (`idCampana`, `activa`, `vigente`) |
| `GET` | `/api/promociones/:id` | `PROMOCION_VER` | Detalle de promoción (con campaña asociada) |
| `POST` | `/api/promociones` | `PROMOCION_GESTIONAR` | Crear promoción asociada a una campaña existente |
| `PATCH` | `/api/promociones/:id/estado` | `PROMOCION_GESTIONAR` | Activar / desactivar promoción |

Permisos asignados: `ADMINISTRADOR` tiene las 4 (`CAMPANA_VER`, `CAMPANA_GESTIONAR`, `PROMOCION_VER`, `PROMOCION_GESTIONAR`); `MEDICO`, `RECEPCIONISTA` y `PACIENTE` tienen solo `CAMPANA_VER`/`PROMOCION_VER` (mismo patrón que `ESPECIALIDAD_LISTAR`/`ESPECIALIDAD_GESTIONAR`).

---

## 7. Suite de pruebas — `test-hu32-hu33-marketing.ts`

Ejecutar con:
```bash
cd Back && npm run test:hu32-33
```

Resultado del último run: **10/10 pruebas pasadas — exit code 0**.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Creación de campaña válida → estado `BORRADOR` | ✅ |
| 2 | Rechazo de campaña sin nombre (400) | ✅ |
| 3 | Transición completa `BORRADOR→PROGRAMADA→ACTIVA→FINALIZADA` | ✅ |
| 4 | Rechazo de transición inválida `FINALIZADA→ACTIVA` (400) | ✅ |
| 5 | Creación de promoción asociada a campaña existente → `activa=true` | ✅ |
| 6 | Rechazo de promoción con campaña inexistente (404) | ✅ |
| 7 | Rechazo de porcentaje de descuento fuera de rango, 150% (400) | ✅ |
| 8 | Rechazo de promoción con vigencia fuera del rango de su campaña (400) | ✅ |
| 9 | Listados con filtros (estado, idCampana, activa) | ✅ |
| 10 | Permisos por rol: solo ADMINISTRADOR gestiona, los demás solo ven | ✅ |

Typecheck limpio en ambos proyectos:
```bash
cd Back && npm run typecheck   # exit 0
cd Front && npx tsc -b         # exit 0
```

Adicionalmente se verificó el flujo completo por HTTP real (backend levantado con `npm run dev`, login contra `/api/auth/login` con los usuarios de `npm run seed`): un Administrador pudo crear una campaña y una promoción asociada con las fechas persistidas correctamente, mientras que un Paciente recibió `403` al intentar crear una campaña y `200` al listarlas.

---

## 8. Frontend

`MarketingPage.tsx` (ruta `/marketing`, visible para los 4 roles) muestra dos pestañas:

- **Campañas**: tabla con nombre, vigencia y badge de estado; para Administrador, un formulario de creación y botones de transición de estado (solo se muestran los estados alcanzables desde el estado actual, según el mismo mapa de transiciones del backend).
- **Promociones**: tabla con nombre, campaña asociada, porcentaje de descuento, vigencia y badge activa/inactiva; para Administrador, un formulario de creación (con selector de campaña existente) y un botón de activar/desactivar.

Para los roles sin `*_GESTIONAR` (Médico, Recepcionista, Paciente), la página se comporta como una "zona de anuncios" de solo lectura, sin formularios ni botones de gestión.

---

## 9. Corrección adicional (fuera de alcance de HU-32/33): vista previa de documentos (HU-24/25)

Durante el sprint se reportó que, al abrir un documento (imagen o archivo) subido a una consulta/paciente desde `ModalVisorDocumento.tsx`, la app reconocía el archivo (metadatos correctos) pero no mostraba vista previa — había que ir directo a Cloudinary para verlo.

**Causa raíz:** en `Back/src/services/DocumentoService.ts`, los archivos se suben con `resource_type: "auto"` (Cloudinary decide si es `image`, `video` o `raw`), pero solo se guardaba el `public_id`, nunca el `resource_type` real resultante. Al construir después la URL de vista previa, el código lo *adivinaba* (`"image"` si el nombre terminaba en `.pdf`, `"auto"` para todo lo demás — incluidas las imágenes). Un `resource_type: "auto"` en una URL de *entrega* de Cloudinary no es válido para un recurso ya subido como `image`, así que la URL generada para imágenes no resolvía al archivo real.

**Corrección:**
- Migración `Back/src/migrations/1788566800000-AddResourceTypeToDocumento.ts`: agrega la columna `resource_type` (varchar 20, nullable) a `documento`. Ya aplicada a la BD de desarrollo con `npm run migration:run`; documentos subidos antes del fix quedan con `NULL` y usan el heurístico anterior como mejor esfuerzo, sin romperse.
- `Documento.entity.ts`: nueva columna `resourceType`.
- `DocumentoService.ts`: `cargarCloudinary()` ahora captura el `resource_type` real que devuelve Cloudinary al subir y lo persiste; `respuestaDocumento()` lo usa tal cual para construir la URL de vista previa en vez de adivinarlo. De paso se corrigió el mismo problema en el rollback de subida fallida (`cloudinary.uploader.destroy` también usaba `"auto"`, inválido ahí, lo que podía dejar archivos huérfanos en Cloudinary).
- `docs/MER/BD.sql` actualizado con la columna nueva.

**Verificación:** se subió una imagen PNG real por `POST /api/documentos` y se confirmó con `curl -I` que la URL generada responde `200 OK`, `Content-Type: image/png` y `Access-Control-Allow-Origin: *` (carga correctamente en `<img>`/dentro del modal). El documento y archivo de prueba se eliminaron después de verificar. `npm run typecheck` sigue limpio.

Nota: `documentoUpload.ts` solo permite subir PDF/PNG/JPEG, por lo que en la práctica todos los documentos de esta app caen en `resource_type: "image"` de Cloudinary — la corrección cubre exactamente los casos reales que el sistema puede producir.
