# HU-32 y HU-33 — Módulo de Marketing (Campañas y Promociones)

**Sprint:** 4
**Historias:** HU-32 (Crear campaña, AR-38) y HU-33 (Crear promoción, AR-39)
**Nota sobre numeración:** El backlog exportado en `docs/backlog/Sprint3.csv` quedó desactualizado — ahí HU-32/33 figuran como "Generar notificación de cita"/"Enviar recordatorio por WhatsApp" (AR-35/AR-36) y "Crear campaña"/"Crear promoción" aparecen como AR-38/AR-39. El equipo renumeró el backlog real: **HU-32 = Crear campaña, HU-33 = Crear promoción**. Este documento define las CA y tareas que faltaban en el backlog para estas dos historias, siguiendo el mismo formato usado en HUs de sprints anteriores (ver HU-09 como referencia de estilo).

**Origen funcional:** Kata arquitectónico (`docs/PrimerDesafioKataArquitectónico.docx`), sección 3 — *"Módulo de Marketing: Zona de anuncios, promociones de salud, campañas preventivas y gestión de fidelización de pacientes."*

---

## HU-32 — Crear campaña

**Historia:** Como Administrador, quiero crear y gestionar campañas de marketing (campañas preventivas, de salud o de fidelización), para anunciarlas a pacientes y personal del centro médico y luego asociarles promociones concretas.

### h1. Objetivo

Permitir que un **Administrador** cree campañas con nombre, descripción, rango de fechas y estado. La campaña nace en `BORRADOR` y avanza por un ciclo de vida controlado (`BORRADOR → PROGRAMADA → ACTIVA → FINALIZADA`, con `CANCELADA` como salida anticipada) antes de poder asociarle promociones. El listado de campañas actúa como la "zona de anuncios" del kata: cualquier rol autenticado puede consultarlo, pero solo el Administrador gestiona su ciclo de vida.

### h2. CA-01 — Acceso a la creación

El formulario/endpoint de creación de campañas solo está disponible para el rol **Administrador** (permiso `CAMPANA_GESTIONAR`).

---

### h2. CA-02 — Datos obligatorios

El sistema debe exigir como mínimo: nombre y fecha de inicio. La descripción y la fecha de fin son opcionales.

---

### h2. CA-03 — Validación de datos

- Nombre: no vacío, máximo 150 caracteres.
- Fecha de inicio: fecha válida.
- Fecha de fin (si se especifica): fecha válida y mayor o igual a la fecha de inicio.

---

### h2. CA-04 — Estado inicial

Toda campaña creada queda en `estado = "BORRADOR"`, sin importar lo que se envíe en la petición (el estado no es asignable en la creación).

---

### h2. CA-05 — Transición de estados

El sistema debe validar transiciones de estado según la máquina de estados:

```
BORRADOR ──▶ PROGRAMADA ──▶ ACTIVA ──▶ FINALIZADA
   │              │             │
   └──────────────┴─────────────┴──▶ CANCELADA
```

- `CANCELADA` es alcanzable desde `BORRADOR`, `PROGRAMADA` o `ACTIVA`.
- `FINALIZADA` y `CANCELADA` son estados terminales: ninguna transición es válida desde ellos.
- Cualquier transición fuera de este mapa (ej. `FINALIZADA → ACTIVA`, o saltar de `BORRADOR → FINALIZADA`) se rechaza con `400`.

---

### h2. CA-06 — Listado con filtros (zona de anuncios)

Cualquier usuario autenticado (permiso `CAMPANA_VER`, asignado a los 4 roles) puede listar campañas, opcionalmente filtradas por `estado` y rango de fechas.

---

### h2. CA-07 — Consulta por ID

Cualquier usuario con `CAMPANA_VER` puede consultar el detalle de una campaña por su identificador.

---

### h2. CA-08 — Acceso no autorizado

Un usuario sin `CAMPANA_GESTIONAR` que intente crear una campaña o cambiar su estado recibe `403 Acceso denegado`.

---

### h2. CA-09 — Persistencia

Una campaña creada correctamente debe poder consultarse posteriormente desde PostgreSQL, reflejando el estado actualizado tras cada transición.

---

### h2. CA-10 — Manejo de errores

Los errores no deben exponer SQL, stack traces ni información interna del backend — solo mensajes comprensibles para el usuario.

---

**Definition of Done (HU-32)**
- ☐ Entidad `Campana` revisada y confirmada (ya existente, sin cambios de esquema).
- ☐ `CampanaRepository` implementado.
- ☐ `CampanaService` implementado (creación + máquina de estados + listado).
- ☐ Endpoint `POST /api/campanas` implementado.
- ☐ Endpoint `PATCH /api/campanas/:id/estado` implementado con validación de transición.
- ☐ Endpoints `GET /api/campanas` y `GET /api/campanas/:id` implementados.
- ☐ Permisos `CAMPANA_VER`/`CAMPANA_GESTIONAR` añadidos a `rolePermissions.ts` y asignados correctamente.
- ☐ Validaciones de CA-02/03/05 implementadas.
- ☐ Errores manejados sin exponer detalles internos.
- ☐ Frontend: listado visible para todos, formulario de gestión solo para Administrador.
- ☐ Pruebas automatizadas (`npm run test:hu32-33`) en verde.
- ☐ Typecheck backend y frontend limpios.
- ☐ Código revisado/integrado.

---

## HU-33 — Crear promoción

**Historia:** Como Administrador, quiero crear promociones de salud asociadas a una campaña existente, con un porcentaje de descuento y vigencia propia, para ofrecerlas a los pacientes dentro del marco de una campaña activa.

### h1. Objetivo

Una promoción siempre pertenece a una campaña (`id_campana` obligatorio). Permite definir un porcentaje de descuento opcional (0-100) y un rango de vigencia propio, que debe caer dentro del rango de la campaña padre. Nace `activa = true` y puede activarse/desactivarse manualmente. Al igual que las campañas, el listado de promociones es parte de la "zona de anuncios" visible para todos los roles.

### h2. CA-01 — Acceso a la creación

El formulario/endpoint de creación de promociones solo está disponible para el rol **Administrador** (permiso `PROMOCION_GESTIONAR`).

---

### h2. CA-02 — Promoción ligada a campaña existente

Toda promoción requiere un `idCampana` válido. Si la campaña referenciada no existe, el sistema responde `404 Campaña no encontrada`.

Ejemplo:
```
POST /api/promociones { idCampana: 999, ... }
        ↓
❌ 404 Campaña no encontrada
```

---

### h2. CA-03 — Datos obligatorios

El sistema debe exigir como mínimo: `idCampana`, nombre y fecha de inicio.

---

### h2. CA-04 — Validación de datos

- Nombre: no vacío, máximo 150 caracteres.
- `porcentajeDesc` (si se especifica): numérico entre 0 y 100.
- Fecha de inicio: fecha válida; fecha de fin (si se especifica) ≥ fecha de inicio.
- La vigencia de la promoción (`fechaInicio`/`fechaFin`) debe caer dentro del rango de vigencia de la campaña padre, cuando esta tiene `fechaFin` definida.

---

### h2. CA-05 — Estado inicial

Toda promoción creada queda con `activa = true`.

---

### h2. CA-06 — Activar / desactivar promoción

Un Administrador puede cambiar el campo `activa` de una promoción existente (`PATCH /api/promociones/:id/estado`).

---

### h2. CA-07 — Listado con filtros

Cualquier usuario autenticado (`PROMOCION_VER`) puede listar promociones, filtrando opcionalmente por `idCampana`, `activa` y vigencia (promociones vigentes hoy).

---

### h2. CA-08 — Consulta por ID

Cualquier usuario con `PROMOCION_VER` puede consultar el detalle de una promoción por su identificador, incluyendo los datos de su campaña asociada.

---

### h2. CA-09 — Acceso no autorizado

Un usuario sin `PROMOCION_GESTIONAR` que intente crear una promoción o cambiar su estado recibe `403 Acceso denegado`.

---

### h2. CA-10 — Persistencia

Una promoción creada correctamente debe poder consultarse posteriormente desde PostgreSQL, con su relación a la campaña intacta.

---

### h2. CA-11 — Manejo de errores

Los errores no deben exponer SQL, stack traces ni información interna del backend.

---

**Definition of Done (HU-33)**
- ☐ Entidad `Promocion` revisada y confirmada (ya existente, sin cambios de esquema).
- ☐ `PromocionRepository` implementado.
- ☐ `PromocionService` implementado (creación con validación de campaña padre + vigencia + porcentaje).
- ☐ Endpoint `POST /api/promociones` implementado.
- ☐ Endpoint `PATCH /api/promociones/:id/estado` implementado.
- ☐ Endpoints `GET /api/promociones` y `GET /api/promociones/:id` implementados.
- ☐ Permisos `PROMOCION_VER`/`PROMOCION_GESTIONAR` añadidos a `rolePermissions.ts` y asignados correctamente.
- ☐ Validaciones de CA-02/03/04 implementadas.
- ☐ Errores manejados sin exponer detalles internos.
- ☐ Frontend: listado visible para todos, formulario de gestión solo para Administrador, selector de campaña existente.
- ☐ Pruebas automatizadas (`npm run test:hu32-33`) en verde.
- ☐ Typecheck backend y frontend limpios.
- ☐ Código revisado/integrado.

---

## Desglose de Tareas y Subtareas

### HU-32

**T1_HU32 Revisar modelo y persistencia de campaña**
- ST1.1 Confirmar mapeo de `Campana.entity.ts` contra `docs/MER/BD.sql` (sin migración nueva requerida).
- ST1.2 Crear `Back/src/repositories/CampanaRepository.ts`.
- ST1.3 Implementar `listar(filtros)` y `buscarPorId(id)`.

**T2_HU32 Implementar lógica de negocio**
- ST2.1 Crear `Back/src/services/CampanaService.ts`.
- ST2.2 Implementar `crear(dto)`: validar nombre/fechas, forzar estado inicial `BORRADOR`.
- ST2.3 Definir el mapa `TRANSICIONES_VALIDAS` de la máquina de estados.
- ST2.4 Implementar `cambiarEstado(id, nuevoEstado)` validando la transición.
- ST2.5 Implementar `listar(filtros)` / `obtenerPorId(id)`.
- ST2.6 Manejar errores de negocio con `AppError`.

**T3_HU32 Implementar endpoints**
- ST3.1 Crear `Back/src/controllers/CampanaController.ts`.
- ST3.2 Crear `Back/src/dtos/campana.dto.ts` (`CrearCampanaDTO`, `CambiarEstadoCampanaDTO`).
- ST3.3 Crear `Back/src/routes/campana.routes.ts` con las 4 rutas.
- ST3.4 Montar la ruta en `Back/src/server.ts`.
- ST3.5 Documentar los endpoints (comentarios en el archivo de rutas).

**T4_HU32 Implementar autorización**
- ST4.1 Agregar `CAMPANA_VER`/`CAMPANA_GESTIONAR` al union type `Permission` en `rolePermissions.ts`.
- ST4.2 Asociar `CAMPANA_VER` a los 4 roles.
- ST4.3 Asociar `CAMPANA_GESTIONAR` solo a Administrador.
- ST4.4 Proteger cada ruta con `requirePermission`.

**T5_HU32 Frontend**
- ST5.1 Crear el servicio frontend de campañas (listar/crear/cambiar estado).
- ST5.2 Crear la sección "Campañas" con listado + badge de estado.
- ST5.3 Crear formulario de creación y selector de transición de estado, visibles solo para Administrador.
- ST5.4 Registrar ruta y enlace de navegación.

**T6_HU32 Pruebas**
- ST6.1 Crear `Back/src/scripts/test/test-hu32-hu33-marketing.ts` con los casos de HU-32.
- ST6.2 Agregar script `test:hu32-33` en `Back/package.json`.

### HU-33

**T1_HU33 Revisar modelo y persistencia de promoción**
- ST1.1 Confirmar mapeo de `Promocion.entity.ts` contra `docs/MER/BD.sql`.
- ST1.2 Crear `Back/src/repositories/PromocionRepository.ts`.
- ST1.3 Implementar `listar(filtros)` y `buscarPorId(id)`.

**T2_HU33 Implementar lógica de negocio**
- ST2.1 Crear `Back/src/services/PromocionService.ts`.
- ST2.2 Implementar `crear(dto)`: validar que la campaña exista (`CampanaRepository.buscarPorId`).
- ST2.3 Validar `porcentajeDesc` (0-100) y fechas dentro del rango de la campaña padre.
- ST2.4 Implementar `cambiarEstado(id, activa)`.
- ST2.5 Implementar `listar(filtros)` / `obtenerPorId(id)`.
- ST2.6 Manejar errores de negocio con `AppError`.

**T3_HU33 Implementar endpoints**
- ST3.1 Crear `Back/src/controllers/PromocionController.ts`.
- ST3.2 Crear `Back/src/dtos/promocion.dto.ts` (`CrearPromocionDTO`, `CambiarEstadoPromocionDTO`).
- ST3.3 Crear `Back/src/routes/promocion.routes.ts` con las 4 rutas.
- ST3.4 Montar la ruta en `Back/src/server.ts`.
- ST3.5 Documentar los endpoints.

**T4_HU33 Implementar autorización**
- ST4.1 Agregar `PROMOCION_VER`/`PROMOCION_GESTIONAR` al union type `Permission`.
- ST4.2 Asociar `PROMOCION_VER` a los 4 roles.
- ST4.3 Asociar `PROMOCION_GESTIONAR` solo a Administrador.
- ST4.4 Proteger cada ruta con `requirePermission`.

**T5_HU33 Frontend**
- ST5.1 Crear el servicio frontend de promociones (listar/crear/cambiar estado).
- ST5.2 Crear la sección "Promociones" con listado filtrable por campaña.
- ST5.3 Crear formulario de creación con selector de campaña existente, visible solo para Administrador.
- ST5.4 Integrar en la misma página/ruta que campañas (tabs).

**T6_HU33 Pruebas**
- ST6.1 Extender `test-hu32-hu33-marketing.ts` con los casos de HU-33.
- ST6.2 Ejecutar `npm run test:hu32-33` y verificar 100% verde.
