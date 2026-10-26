# Correcciones HU-28 y HU-29 — Rama `HU-28--HU-29`

**Fecha:** 06/09/2026
**Rama:** `HU-28--HU-29` (commit `b4ca9a4 HU 28- HU 29 nuevo`)
**Contexto:** se evaluó si HU-28 (Registrar servicios, AR-31) y HU-29 (Generar factura, AR-32) están bien implementadas. El backlog (`docs/backlog/Sprint3.csv`, filas 442-443) solo tiene el título de cada historia, sin criterios de aceptación, así que la evaluación se hizo contra el modelo de datos real (`docs/MER/BD.sql`) y contra el patrón de calidad ya usado en HU-17/18 (`docs/correcionesHU17_18.md`). De los hallazgos, se corrigieron los que resultaron ser bugs reales; uno se descartó tras revisión más profunda (no era un bug).

---

## 1. Resumen de la evaluación inicial

**HU-28 (Registrar servicios)** se implementó como dos piezas: un catálogo de servicios (`Servicio`: crear/listar, con validación de nombre/precio/unicidad) y el registro de servicios prestados por atención (`AtencionServicio`, vinculado a `Consulta`/`Paciente`, con regla de bloqueo una vez facturado). **HU-29 (Generar factura)** genera la factura con cálculo de subtotal/descuento/total en el backend (no confía en el cálculo del frontend), persiste todo en una transacción real y marca automáticamente los `AtencionServicio` pendientes como `FACTURADO`.

Ambas están **funcionalmente implementadas de punta a punta** (entidad → repositorio → servicio → controlador → ruta → frontend), pero con brechas. Las corregidas en esta rama se detallan abajo.

---

## 2. Problemas identificados y corregidos

### 2.1 Fuga de datos entre pacientes (IDOR) en servicios prestados (crítico)
`AtencionServicioController.listarPorConsulta` y `listarPorPaciente` no verificaban en absoluto quién hacía la petición (`req.authUser` nunca se leía). Como el rol `PACIENTE` tiene el permiso `ATENCION_SERVICIO_VER`, cualquier paciente autenticado podía pedir `GET /atencion-servicio/paciente/:idPaciente` o `GET /atencion-servicio/consulta/:idConsulta` con el ID de **otro** paciente y ver sus servicios registrados, precios y observaciones. El patrón correcto ya existía en `FacturaService.obtenerPorId` (valida propiedad para el rol `PACIENTE`) pero no se había replicado aquí.

### 2.2 Condición de carrera en la numeración de facturas (alto)
`FacturaRepository.generarSiguienteNumero()` leía el último `numero_factura` del año y le sumaba 1 en código de aplicación, sin ningún lock. Dos emisiones de factura simultáneas podían leer el mismo "último número" y generar el mismo correlativo; solo el `UNIQUE` de la base de datos lo hubiera evitado, pero lanzando un error 500 sin manejar en vez de prevenir la colisión.

### 2.3 Inconsistencia de esquema: `factura.estado` (menor, latente)
En `docs/MER/BD.sql:122`, la columna `estado` de `factura` tiene `DEFAULT 'borrador'` (minúscula) pero su propio `CHECK` solo permite valores en mayúscula (`BORRADOR|EMITIDA|ANULADA|PAGADA`). En la práctica no afecta porque el código siempre setea `estado` explícito al insertar, pero cualquier inserción que dependiera del default violaría su propio `CHECK`.

### 2.4 Descartado tras revisión: "precio personalizado" en facturación/servicios
En la primera revisión se marcó como posible problema que `FacturaService.emitir` y `AtencionServicioService.registrar` aceptan un `precioUnitario` enviado por el cliente en vez de forzar siempre el precio del catálogo. Al revisar el frontend (`Front/src/components/SeccionServiciosConsulta.tsx`, campo "precio personalizado", líneas 49, 96 y 118-126) se confirmó que es una función de negocio intencional: el personal autorizado (médico/recepción/admin — nunca el paciente, que no tiene el permiso `ATENCION_SERVICIO_REGISTRAR` ni `FACTURA_CREAR`) puede ajustar el precio de un servicio prestado. **No se modificó nada** relacionado a esto.

### 2.5 `tsconfig.app.json` marcado en rojo en el editor (Front) — no es un bug del código
Se revisó `Front/tsconfig.app.json`: el archivo en sí es un `tsconfig` de Vite/React estándar y válido (`"types": ["vite/client"]`, `moduleResolution: "bundler"`, etc.). El error en rojo del editor es porque **`Medicalsys-arreglos-dev/Front/node_modules` no existe** en este checkout — nunca se corrió `npm install` ahí — por lo que TypeScript no puede resolver el paquete `vite` (que es quien provee `vite/client.d.ts`). Se confirmó lo mismo en `Medicalsys-arreglos-dev/Back` (tampoco tiene `node_modules`, por lo que tampoco se pudo correr `tsc --noEmit` para verificar los cambios de este documento por esa vía — se revisaron a mano en su lugar). Ambos `node_modules` están correctamente en `.gitignore`; el archivo `package-lock.json` sí existe en ambos proyectos, así que el fix es simplemente instalar dependencias, no tocar el tsconfig. Ver sección 5.

### 2.6 Emitir una factura parcial cerraba TODOS los servicios pendientes del paciente (alto)
Encontrado en una sesión de verificación posterior a este documento, tras correr la migración (sección 5) y confirmar que el backend/frontend levantan correctamente.

`FacturaService.emitir` marcaba `AtencionServicio.estado = FACTURADO` con un `UPDATE` masivo por `id_consulta` (o por `id_paciente` si no había consulta) filtrando solo por `estado = 'PENDIENTE'` — nunca por los ítems que realmente traía la factura. `FacturacionPage.tsx` (Front) nunca envía `idConsulta` en el payload, así que en la práctica siempre se ejecutaba la rama por `id_paciente`: **facturar solo 1 de varios servicios pendientes de un paciente marcaba como facturados también los que no se cobraron**, sin que existiera ninguna fila correspondiente en `detalle_factura` para ellos. Esos servicios "desaparecían" de la lista de pendientes sin haberse cobrado nunca.

**Corregido:** la factura ahora declara explícitamente qué `atencion_servicio` cierra (`idsAtencionServicio: number[]`), en vez de que el backend lo infiera por consulta/paciente:
- `Back/src/dtos/factura.dto.ts`: `EmitirFacturaDTO.idConsulta` → `idsAtencionServicio?: number[]`.
- `Back/src/controllers/FacturaController.ts`: lee `req.body.idsAtencionServicio`.
- `Back/src/services/FacturaService.ts`: el `UPDATE` de cierre ahora es `WHERE id_atencion_servicio IN (:...ids) AND id_paciente = :idPaciente AND estado = 'PENDIENTE'` (el filtro por `id_paciente` es una verificación de propiedad extra, no solo el `IN`).
- `Front/src/services/facturaService.ts`: `EmitirFacturaPayload.idConsulta` → `idsAtencionServicio?: number[]`.
- `Front/src/pages/Facturacion/FacturacionPage.tsx`: cada `LineaFactura` ahora recuerda de qué `atencion_servicio` viene (`idsAtencionServicio`); al emitir se juntan y se mandan al backend. Los ítems agregados manualmente desde el catálogo (sin `atencion_servicio` de por medio) no cierran nada, que es el comportamiento correcto.
- `Back/src/scripts/test/test-atencion-servicio.ts`: actualizado para pasar `idsAtencionServicio` en vez de `idConsulta` al emitir la factura de prueba (el campo viejo ya no existe en el DTO).

Verificado con `npm run typecheck` (Back) y `npx tsc -b` (Front) una vez instaladas las dependencias — ambos sin errores.

---

## 3. Cambios aplicados

### Backend

1. **`Back/src/services/AtencionServicioService.ts`**
   - **Se implementó:** validación de propiedad para el rol `PACIENTE` en `listarPorConsulta` (resuelve el dueño real de la consulta vía `ConsultaRepository.buscarPorId` y compara `consulta.historia.paciente.usuario.idUsuario` contra el usuario autenticado) y en `listarPorPaciente` (resuelve el `idPaciente` propio vía `PacienteRepository.buscarPorUsuario` y lo compara contra el `idPaciente` solicitado). Si no coincide, se lanza `403`.
   - **Se cambió:** ambos métodos ahora reciben un parámetro opcional `authUser: { idUsuario: number; rol: string }`.
   - No se eliminó nada.

2. **`Back/src/controllers/AtencionServicioController.ts`**
   - **Se cambió:** `listarPorConsulta` y `listarPorPaciente` ahora pasan `req.authUser` al servicio (antes no se usaba en absoluto en estas dos rutas).

3. **`Back/src/repositories/FacturaRepository.ts`**
   - **Se implementó:** `generarSiguienteNumero` ahora adquiere un advisory lock transaccional de Postgres (`pg_advisory_xact_lock(hashtext($1))`, con el prefijo `FAC-<año>-` como clave) antes de leer el último correlativo. El lock se libera solo al hacer commit/rollback de la transacción, serializando la generación del número entre emisiones concurrentes.
   - **Se cambió:** la firma pasó de `generarSiguienteNumero()` a `generarSiguienteNumero(manager: EntityManager)`; las consultas usan `manager` en vez de `this` (el repositorio) para operar dentro de la transacción del llamador. Se agregó el import de `EntityManager` de `typeorm`.

4. **`Back/src/services/FacturaService.ts`**
   - **Se cambió:** el cálculo de `numeroFactura` y `codigoControl` se movió de *antes* de abrir la transacción a *dentro* del bloque `try` de la transacción (usando `queryRunner.manager`), para que el advisory lock realmente cubra toda la ventana entre "leer el último número" e "insertar la factura". No cambió ninguna otra lógica de cálculo (subtotal, descuento, total, impuestos siguen igual).

5. **`Back/src/migrations/1788566700000-FixFacturaEstadoDefault.ts`** (nuevo)
   - **Se implementó:** migración que corrige `factura.estado` en la base de datos real de `DEFAULT 'borrador'` a `DEFAULT 'BORRADOR'`, alineándolo con el `CHECK` constraint existente. Incluye `down()` para revertir.

6. **`Back/src/config/database.ts`**
   - **Se cambió:** se agregó el import y el registro de `FixFacturaEstadoDefault1788566700000` en el arreglo `migrations` de `AppDataSource`, para que quede disponible para `npm run migration:run` (ver sección 5).

### Frontend
En la revisión original de este documento: **ningún cambio** (el frontend ya enviaba siempre el precio correcto — ver 2.4 — y no confía en su propio cálculo de totales). Eso sigue siendo cierto; el único cambio de Front vino después, con el hallazgo de 2.6 (`FacturacionPage.tsx` y `facturaService.ts`, para mandar `idsAtencionServicio` en vez del `idConsulta` que nunca se usaba). El error de `tsconfig.app.json` (2.5) no requirió ningún cambio de código, solo instalar dependencias.

---

## 4. Verificación

En la revisión original no fue posible correr `npx tsc --noEmit` ni en `Back` ni en `Front` porque ninguno tenía `node_modules` instalado (ver 2.5); se revisaron a mano los 6 archivos modificados/creados de ese momento, confirmando:
- Los nombres de campos usados en las nuevas validaciones (`consulta.historia.paciente.usuario.idUsuario`) coinciden con las relaciones reales de `Consulta.entity.ts`, `HistoriaClinica.entity.ts` y `Paciente.entity.ts`.
- No quedaron referencias rotas a la firma anterior de `generarSiguienteNumero()` (`grep` confirmó un único call site, ya actualizado).
- `numeroFactura`/`codigoControl` solo se usan dentro del mismo bloque `try` donde ahora se declaran, sin fugas de scope.

**Actualización:** ya se corrió `npm install` en `Back/` y `Front/`, se aplicó la migración (sección 5) y se corrigió el hallazgo de 2.6. `npm run typecheck` (Back, `tsc --noEmit`) y `npx tsc -b` (Front) corren ambos sin errores sobre el estado actual de la rama.

---

## 5. Cómo instalar dependencias y aplicar la migración

Ver la conversación / mensaje de Claude para el paso a paso detallado de `npm install` (Front y Back) y `npm run migration:run` (Back), incluyendo qué corrige la migración y por qué es segura de correr.

---

## 6. Comparación con la implementación original (`docs/HU28.-29Fernando.pdf`)

Ese PDF documenta la sesión original donde el compañero (Fernando) implementó ambas historias: primero HU-29/AR-32 "Generar factura", luego HU-28/AR-31 "Registrar servicios". Esa sesión reportó ambas HUs **implementadas de punta a punta**, con `test-facturacion.ts` y `test-atencion-servicio.ts` pasando al 100% y compilación limpia (`npm run build`) en Backend y Frontend — y en efecto, esa base es real: las entidades, rutas, cálculo de totales, la transacción de emisión y la UI de `FacturacionPage.tsx`/`SeccionServiciosConsulta.tsx` descritas ahí son las que siguen en pie hoy. Nada de esta rama las reescribió.

Lo que ninguna de esas dos suites de prueba originales cubría era: multi-rol/propiedad, concurrencia, o una factura que no cierre el 100% de lo pendiente. Por eso los siguientes 4 problemas pasaron el "100%" reportado en el PDF y solo aparecieron en las dos rondas de revisión de este documento:

| # | Lo que Fernando implementó / afirmó | Qué se encontró después (esta rama) | Por qué sus pruebas no lo detectaron |
|---|---|---|---|
| 1 | Permisos (`FACTURA_VER`, `ATENCION_SERVICIO_VER`, etc.) definidos en `rolePermissions.ts` para controlar quién llama cada endpoint | **2.1 (IDOR):** los controladores nunca comparaban el `idPaciente`/`idConsulta` de la URL contra el usuario autenticado — cualquier paciente con el permiso podía ver los servicios de **otro** paciente | `test-atencion-servicio.ts` llama a los `Service` directamente (sin pasar por HTTP ni por un `authUser` de rol `PACIENTE`), así que nunca ejercita el chequeo de propiedad que sí corre en producción |
| 2 | Correlativo automático `FAC-YYYY-NNNNN`, leyendo el último número e incrementando en código de aplicación | **2.2 (race condition):** sin lock, dos emisiones simultáneas podían leer el mismo "último número" y colisionar (500 sin manejar) | Los tests corren secuenciales, uno a la vez — una condición de carrera no puede aparecer en una suite que nunca dispara dos requests en paralelo |
| 3 | Esquema de `factura` ya existente en Supabase (fuera de las migraciones del repo) | **2.3 (esquema):** `factura.estado` tenía `DEFAULT 'borrador'` (minúscula) mientras el `CHECK` solo acepta mayúsculas | El código siempre setea `estado` explícito al insertar, así que el `DEFAULT` roto nunca se ejecuta en el flujo normal — solo se detecta leyendo el DDL real de la tabla, no corriendo la app ni sus tests |
| 4 | HU-28 registra servicios "PENDIENTE"; HU-29 los cierra a "FACTURADO" automáticamente al facturar | **2.6 (esta sesión):** al emitir una factura que cubre solo *parte* de los servicios pendientes de un paciente, el backend cerraba igual **todos** los pendientes, no solo los facturados | El propio Escenario 4 de `test-atencion-servicio.ts` siempre facturaba el 100% de lo que acababa de registrar (`s1` y `s2` completos) — nunca simuló una factura parcial, que es justo el caso donde el bug aparece |

**En corto:** la implementación de Fernando es la base funcional real y sigue siéndolo; lo agregado en las dos rondas de revisión no reemplaza nada de eso, cierra brechas de propiedad/concurrencia/consistencia que un test de integración feliz (un solo usuario, secuencial, facturando el 100% de lo pendiente) no está diseñado para exponer.
