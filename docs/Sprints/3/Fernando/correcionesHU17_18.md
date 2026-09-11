# Correcciones HU-17 y HU-18 — Rama `HU-17--HU-18`

**Fecha:** 01/09/2026
**Rama original:** `HU-17--HU-18` (mergeado a `arreglos-dev` el mismo día)
**Contexto:** se reportaron errores en frontend relacionados a HU-17 (Asignación de Consultorio Físico) y HU-18 (Registro de Atención sin Cita). Se investigó comparando contra `MergeConDev`, se revisó el backlog (`docs/backlog/Sprint3.csv`) y el reporte de pruebas original (`docs/T8_HU17_18_Reporte_Pruebas.md`). Todo lo descrito aquí (backend, frontend y correcciones de datos) ya está incorporado en `arreglos-dev`.

---

## 1. Problemas identificados

### 1.1 Reseteo silencioso de contraseñas en cada arranque del backend (crítico)
`Back/src/server.ts` ejecutaba `await seedDatabase()` en **cada** arranque (`npm run dev`). `Back/src/config/seed.ts` sobrescribía sin aviso el `password_hash` de los usuarios de prueba (`admin@medicalsys.com`, `medico@medicalsys.com`, `recepcion@medicalsys.com`, `paciente@medicalsys.com`) con contraseñas fijas (`admin1234`, `medico1234`, etc.), distintas a las documentadas en `docs/usuariosdeprueba.txt` (`Admin123*`, `Medico123*`).

Como la base de datos es la instancia compartida de Supabase, cualquier desarrollador que levantara el backend localmente pisaba las credenciales reales de los demás. Esto explicaba el síntoma reportado: *"el usuario existe en la BD pero el login falla"*.

`MergeConDev` ya había resuelto esto eliminando por completo la llamada automática y el archivo `config/seed.ts`.

**Corrección aplicada:** se quitó la llamada a `seedDatabase()` y su import de `server.ts` (commit local, ver sección 3). El archivo `config/seed.ts` se dejó en el repo sin uso, a pedido explícito, por si se necesita ejecutar manualmente para poblar una base nueva.

### 1.2 `ConsultoriosPage.tsx`: falso positivo (no requirió corrección)
Se comparó contra `MergeConDev` y se encontró que esa rama tiene una versión mucho más simple de `ConsultoriosPage.tsx` (solo catálogo de solo lectura), mientras que `HU-17--HU-18` ya tenía implementado el flujo completo de HU-17: calendario de asignaciones, verificador de disponibilidad y modal de asignación/liberación de consultorio a una cita. Copiar `MergeConDev` habría sido un **retroceso** de funcionalidad, así que se descartó y no se tocó ese archivo por este motivo.

### 1.3 No existía forma de registrar un consultorio nuevo (bug funcional)
Se verificó en las tres capas del backend (`ConsultorioRepository`, `ConsultorioService`, `ConsultorioController`) y en las rutas (`consultorios.routes.ts`) que **no existía ningún método de creación** — solo `listar`, `asignarACita` y `liberarDeCita`. Es igual en `MergeConDev`, por lo que tampoco se había implementado ahí. Los 9 consultorios visibles en la app solo existían porque `config/seed.ts` los insertaba a mano en cada arranque (ver 1.1).

La matriz de permisos del backlog (`Sprint3.csv`, fila "Gestionar consultorios") ya definía Admin ✅ y Recepcionista ✅ para esta funcionalidad, y el permiso `CONSULTORIO_GESTIONAR` ya existía y estaba correctamente asignado a ambos roles en `rolePermissions.ts` — solo faltaba el endpoint.

### 1.4 No se validaba que la especialidad del consultorio coincida con la del médico (crítico, hallado en revisión posterior)
`ConsultorioService.asignarACita()` validaba solapamiento de horario del consultorio y del médico, pero **nunca comparaba `consultorio.tipo` contra las especialidades del médico de la cita**. Esto permitía asignar, por ejemplo, un consultorio de Pediatría a una cita de un médico de Cardiología.

Se detectaron 2 asignaciones ya existentes en la base con este problema:

| Cita | Estado | Especialidad del médico | Consultorio asignado (tipo) |
|---|---|---|---|
| #15 | ATENDIDA | Psiquiatria | Consultorio 202 (Dermatología) |
| #12 | CANCELADA | Psiquiatria | Consultorio 101 (Medicina General) |

**Corrección aplicada:** en `ConsultorioService.asignarACita()` se agregó una validación que compara `consultorio.tipo` contra `cita.medico.especialidades` (ya se cargaban en `CitaRepository.buscarPorId`); si no hay coincidencia, rechaza con `400` y detalla qué especialidad(es) sí tiene el médico. Se verificó en vivo: asignar un consultorio de Pediatría a una cita de un médico de Cardiología ahora se rechaza; asignar el consultorio correcto (misma especialidad) sigue funcionando igual que antes.

Las 2 citas con la asignación incorrecta (#15 y #12) se liberaron a pedido del usuario — #15 vía el endpoint normal (`DELETE /citas/:id/consultorio`), #12 requirió una corrección de datos directa porque está cancelada y en el pasado, y el endpoint normal bloquea liberar consultorios de citas que ya iniciaron (regla de negocio correcta, no se modificó).

### 1.5 Inconsistencia de datos: "especialidades" de consultorio que no existen en la BD
`consultorio.tipo` es un `varchar` libre **sin relación (FK) con la tabla `especialidad`** (confirmado en `docs/MER/BD.sql`). Se detectó que 5 de los 9 consultorios ya registrados tenían un `tipo` que no correspondía a ninguna especialidad real del catálogo:

| Consultorio | `tipo` registrado | ¿Existía en `especialidad`? |
|---|---|:---:|
| Consultorio 202 | Dermatología | ❌ |
| Consultorio 301 | Ginecología y Obstetricia | ❌ (solo existía "Ginecología") |
| Consultorio 302 | Traumatología | ❌ |
| Consultorio 401 | Oftalmología | ❌ |
| Consultorio 402 | Odontología | ❌ |

Esto ocurría porque nada validaba el valor de `tipo` contra el catálogo real de especialidades al insertar los datos de prueba.

---

## 2. Correcciones aplicadas

### Backend

1. **`Back/src/server.ts`** — se eliminó la llamada automática a `seedDatabase()` (y su import) en el arranque del servidor. Ver 1.1.

2. **`Back/src/dtos/consultorio/CrearConsultorioDTO.ts`** (nuevo) — DTO con `nombre`, `tipo`, `piso?`, `capacidad?`.

3. **`Back/src/repositories/ConsultorioRepository.ts`** — se agregó `buscarPorNombre` para validar unicidad.

4. **`Back/src/services/ConsultorioService.ts`** — se agregó el método `crear`, que valida:
   - Nombre obligatorio y único (no puede repetirse un consultorio con el mismo nombre).
   - `tipo` obligatorio y **debe coincidir con una especialidad existente** en la tabla `especialidad` (corrige de raíz la inconsistencia de 1.4 para todo consultorio creado de aquí en adelante).
   - `capacidad`, si se envía, debe ser un entero mayor a 0 (por defecto 1).

5. **`Back/src/controllers/ConsultorioController.ts`** — se agregó el método `crear`, que responde `201` con el consultorio creado.

6. **`Back/src/routes/consultorios.routes.ts`** — se agregó:
   ```
   POST /api/consultorios   (requiere permiso CONSULTORIO_GESTIONAR → Admin y Recepcionista)
   ```

7. **`Back/src/services/ConsultorioService.ts`** — en `asignarACita`, se agregó la validación de especialidad descrita en 1.4: `consultorio.tipo` debe estar entre las especialidades del médico de la cita, si no, rechaza con `400`.

8. **Corrección de datos existentes** — se registraron en la tabla `especialidad` (vía `POST /api/especialidades`, ya existente) las 5 especialidades faltantes detectadas en 1.5: Dermatología, Traumatología, Oftalmología, Odontología y Ginecología y Obstetricia. Con esto, los 9 consultorios activos ya existentes quedan alineados 1 a 1 con el catálogo real de especialidades, sin alterar sus datos originales (nombre, piso, capacidad).

9. **Corrección de datos existentes** — se liberó el consultorio de las 2 citas con especialidad incompatible detectadas en 1.4 (#15 vía API, #12 vía corrección de datos directa por estar cancelada y en el pasado).

### Frontend

8. **`Front/src/services/consultoriosService.ts`** — se agregó `crearConsultorio(datos)` → `POST /api/consultorios`.

9. **`Front/src/pages/Consultorios/ConsultoriosPage.tsx`** — en la pestaña "Catálogo" se agregó, solo visible para Admin/Recepcionista (`esAdminOGestor`):
   - Botón "➕ Nuevo Consultorio" que despliega un formulario inline.
   - Formulario con: nombre (texto), **especialidad/tipo como `<select>` poblado desde `/api/especialidades`** (ya no es texto libre, así la UI no puede volver a introducir la inconsistencia de 1.5), piso y capacidad.
   - Al guardar, recarga el catálogo y muestra mensaje de éxito; muestra el error del backend si el nombre está duplicado o si no hay especialidades registradas.

---

## 3. Pruebas realizadas

Todas las pruebas se hicieron en vivo contra el backend (`npm run dev` en `Back`, puerto 3000) y la base de datos real (Supabase), autenticando como `admin@medicalsys.com` / `admin1234` y como `medico@medicalsys.com` / `medico1234`.

| # | Prueba | Resultado |
|---|---|:---:|
| 1 | `npx tsc --noEmit` en `Back` tras quitar el auto-seed | ✅ 0 errores |
| 2 | Login admin tras el fix, sin que un reinicio del backend cambie la contraseña | ✅ OK |
| 3 | `GET /api/consultorios` y `GET /api/citas` devuelven datos consistentes con lo que espera el frontend | ✅ OK |
| 4 | `GET /api/consultorios?fecha&horaInicio&horaFin` (verificador de disponibilidad) | ✅ OK |
| 5 | `POST /api/consultorios` con `tipo` que **no** existe en el catálogo → rechazo | ✅ `400` con mensaje claro |
| 6 | `POST /api/consultorios` con `tipo` válido (coincide con especialidad real) → creación | ✅ `201`, consultorio creado |
| 7 | `POST /api/consultorios` con nombre duplicado | ✅ `409 Ya existe un consultorio registrado con ese nombre.` |
| 8 | `POST /api/consultorios` sin nombre | ✅ `400 El nombre del consultorio es obligatorio.` |
| 9 | `POST /api/consultorios` autenticado como Médico (rol sin `CONSULTORIO_GESTIONAR`) | ✅ `403` (permiso correctamente denegado) |
| 10 | `npx tsc -b --force` en `Front` tras agregar el formulario | ✅ 0 errores |
| 11 | Creación de especialidades faltantes vía `POST /api/especialidades` | ✅ 5/5 creadas |
| 12 | `GET /api/consultorios` tras el fix de datos: los 9 consultorios activos tienen `tipo` presente en `GET /api/especialidades` | ✅ 9/9 coinciden |
| 13 | Auditoría de las 8 citas con consultorio/médico asignado, cruzando `consultorio.tipo` contra `medico.especialidades` | Detectados 2 mismatches (#15, #12) antes del fix |
| 14 | `PATCH /citas/16/asignar-consultorio` con consultorio de especialidad distinta a la del médico de la cita (Pediatría vs. médico de Cardiología) | ✅ `400` con mensaje claro, rechazado |
| 15 | `PATCH /citas/16/asignar-consultorio` con consultorio de la misma especialidad que el médico | ✅ `200`, asignado correctamente |
| 16 | `DELETE /citas/15/consultorio` (liberar asignación incorrecta histórica) | ✅ `200`, liberado |
| 17 | Re-auditoría de las 8 citas tras las correcciones | ✅ 0 mismatches restantes |

Los consultorios y citas de prueba usados durante la verificación se dejaron en su estado original (o se limpiaron) al finalizar; no quedan datos de prueba residuales.

---

## 4. Investigado sin cambio de código: ¿quedan consultorios "ocupados" en citas ya atendidas?

Se investigó si el `consultorio` asignado a una cita `ATENDIDA` debía liberarse automáticamente al completarse la consulta (en `ConsultaService.completar()`, que es donde una cita pasa a `ATENDIDA`). Conclusión: **no es necesario, y hacerlo sería contraproducente.**

- La disponibilidad de un consultorio se calcula por **solapamiento de horario** (`ConsultorioRepository.buscarSolapamiento`), no por si el campo `consultorio` de una cita vieja sigue lleno. Una vez que el horario de una cita ya pasó, ningún rango futuro puede solaparse con él — el consultorio queda libre automáticamente para nuevas asignaciones, sin necesidad de "liberarlo" a mano.
- El campo `consultorio` en una cita `ATENDIDA` es el **registro histórico de dónde se atendió esa consulta**, usado por la pestaña "Calendario" de `ConsultoriosPage.tsx` para mostrar ocupación por día. Ponerlo en `null` al completar la consulta borraría esa trazabilidad (ej. "¿en qué consultorio se atendió al paciente X el mes pasado?").
- Se detectó una única cita (`#13`, ATENDIDA, horario ya pasado) con consultorio asignado en ese estado — no bloquea nada.
- También se detectó que la cita `#14` está marcada `ATENDIDA` con `fechaHoraFin` en el futuro (dato de prueba inconsistente, no relacionado a consultorios — el estado se marcó antes de que llegue el horario programado). No se corrigió porque no fue parte de lo solicitado; queda anotado por si se quiere revisar.
- **Caso límite real identificado** (no corregido, queda como mejora a futuro): si una consulta termina antes de su hora programada, el sistema sigue considerando el consultorio "ocupado" hasta el `fechaHoraFin` original, porque no existe una hora real de finalización. Resolverlo de forma correcta (sin perder el historial) requeriría registrar el momento real en que se completa la consulta.

Decisión: se deja el comportamiento actual sin cambios.

---

## 5. Pendientes / recomendaciones a futuro

- **La validación de especialidad (1.4) solo corre en `asignarACita`.** Si en el futuro se agrega otro camino para vincular un consultorio a una cita (por ejemplo, al reservar la cita directamente con consultorio incluido), hay que asegurarse de pasar por la misma regla.
- **No existe endpoint de edición ni de baja (soft-delete) de consultorios.** Si se necesita corregir un dato o desactivar un consultorio físico que ya no se usa, hoy solo se puede hacer por acceso directo a la base de datos.
- **`consultorio.tipo` sigue siendo un `varchar` libre, no una relación real (FK) a `especialidad`.** La validación agregada impide que se cree una inconsistencia nueva, pero no es una restricción a nivel de base de datos. Si se quiere una solución definitiva, se podría migrar `tipo` a una relación `ManyToOne` con `Especialidad` (requiere migración de esquema y actualizar todos los lugares que leen `consultorio.tipo` como texto, en Back y Front).
- **`Back/src/config/seed.ts` quedó en el repo sin usarse.** Si en algún momento se decide borrarlo (como ya se hizo en `MergeConDev`), no rompe nada porque no lo referencia ningún otro archivo.
- El documento `docs/usuariosdeprueba.txt` ya fue actualizado por el usuario con la contraseña real del admin (`admin1234`); conviene revisar si los otros usuarios de prueba documentados (médico, recepción, paciente) también quedaron desactualizados tras el fix de 1.1.
