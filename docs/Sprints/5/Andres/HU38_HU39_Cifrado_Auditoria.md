# Implementación HU-38 y HU-39 — Sprint 5

**Fecha:** 12/09/2026  
**Sprint:** Sprint 5  
**Desarrollador:** Andrés  
**Historias:** HU-38 (Cifrar información sensible) y HU-39 (Registrar auditoría)

---

## 1. Resumen de la Implementación

### **HU-38: Cifrar información sensible**
Se implementó un esquema de cifrado simétrico en capa de aplicación usando el algoritmo **AES-256-GCM** mediante la librería nativa `crypto` de Node.js, almacenando los datos en formato `iv_hex:authTag_hex:ciphertext_hex`. 

Para una integración limpia y transparente sin alterar la lógica de negocio ni las firmas de los servicios, se creó un `ValueTransformer` de TypeORM (`encryptionTransformer`) aplicado directamente sobre los decoradores `@Column` de las entidades sensibles (`Paciente`, `Consulta`, `Diagnostico`, `Tratamiento`, `HistoriaClinica` y `Factura`).

**Decisión Arquitectónica sobre `documentoIdentidad` (CI)**:
Se acordó explícitamente mantener el campo `documentoIdentidad` en texto plano para permitir búsquedas SQL rápidas e indexadas (`WHERE documento_identidad = :ci`). Se cifraron los demás datos sensibles de contacto, notas médicas y facturación.

**Resiliencia ante datos legados**:
El mecanismo de descifrado (`decrypt`) detecta automáticamente si el string ingresado no posee la estructura `iv:authTag:ciphertext`. Si se trata de datos antiguos en texto plano, los retorna intactos sin arrojar excepciones.

---

### **HU-39: Registrar auditoría**
Se desarrolló un subsistema completo de auditoría y trazabilidad de eventos de seguridad.
- **Base de Datos**: Tabla `audit_log` con índices en `id_usuario`, `fecha_hora` y `accion`.
- **Backend**:
  - `AuditLogService.ts`: Servicio asíncrono (*fire-and-forget*) que registra eventos sin bloquear el flujo principal.
  - Integración en `auth.controller.ts` para auditar `LOGIN_OK`, `LOGIN_FAIL`, `USUARIO_REGISTRAR`.
  - Integración en `errorHandler.ts` para auditar errores internos 500 (`ERROR_INTERNO`).
  - Endpoint `GET /api/auditoria` con filtros (acción, resultado, paginación) protegido por el permiso `AUDITORIA_VER` asignado al rol `ADMINISTRADOR`.
- **Frontend**:
  - `auditoriaService.ts`: Cliente HTTP en React.
  - `AuditoriaPage.tsx`: Consola de administración interactiva para visualizar y filtrar el historial de auditoría con badges por resultado (`ÉXITO`, `ERROR`, `ACCESO DENEGADO`).
  - Ruta `/auditoria` en `AppRoutes.tsx` y enlace de navegación en `Nav.tsx` exclusivo para el rol `ADMINISTRADOR`.

---

## 2. Archivos Creados y Modificados

### Backend

| Archivo | Operación | Descripción |
|---|---|---|
| `Back/src/utils/encryption.ts` | **Nuevo** | Módulo de cifrado AES-256-GCM y TypeORM `ValueTransformer` |
| `Back/src/entities/AuditLog.entity.ts` | **Nuevo** | Entidad de auditoría (`idLog`, `idUsuario`, `rol`, `accion`, `entidad`, `idEntidad`, `ip`, `userAgent`, `resultado`, `detalle`, `fechaHora`) |
| `Back/src/services/AuditLogService.ts` | **Nuevo** | Servicio asíncrono para registro y lectura con filtros |
| `Back/src/controllers/AuditLogController.ts` | **Nuevo** | Controlador HTTP para listar registros de auditoría |
| `Back/src/routes/auditlog.routes.ts` | **Nuevo** | Ruta `GET /api/auditoria` protegida por `AUDITORIA_VER` |
| `Back/src/migrations/1789000000000-CreateAuditLogTable.ts` | **Nuevo** | Migración SQL para crear tabla `audit_log` e índices |
| `Back/src/migrations/1789000000001-ExpandColumnsForEncryption.ts` | **Nuevo** | Migración SQL para ampliar columnas `varchar` cortas a `text` |
| `Back/src/scripts/test/test-hu38-encryption.ts` | **Nuevo** | Script de pruebas unitarias para cifrado/descifrado |
| `Back/src/scripts/test/verificar-bd-hu38-hu39.ts` | **Nuevo** | Script de verificación en tiempo de ejecución sobre PostgreSQL Supabase real |
| `Back/src/entities/Paciente.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `direccion`, `contactoEmergencia`, `telefonoEmergencia` |
| `Back/src/entities/Consulta.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `motivo`, `anamnesis`, `examenFisico`, `observaciones` |
| `Back/src/entities/Diagnostico.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `descripcion` |
| `Back/src/entities/Tratamiento.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `descripcion`, `indicaciones` |
| `Back/src/entities/HistoriaClinica.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `observaciones` |
| `Back/src/entities/Factura.entity.ts` | **Modificado** | Aplicado `encryptionTransformer` en `nitCliente`, `razonSocial` |
| `Back/src/controllers/auth.controller.ts` | **Modificado** | Registro de eventos `LOGIN_OK`, `LOGIN_FAIL`, `USUARIO_REGISTRAR` |
| `Back/src/middlewares/errorHandler.ts` | **Modificado** | Registro de eventos `ERROR_INTERNO` en fallos 500 |
| `Back/src/permissions/rolePermissions.ts` | **Modificado** | Agregado permiso `AUDITORIA_VER` asignado a `ADMINISTRADOR` |
| `Back/src/config/database.ts` | **Modificado** | Registro de entidad `AuditLog` y migraciones |
| `Back/src/server.ts` | **Modificado** | Montaje de rutas `/api/auditoria` |
| `Back/.env` / `Back/.env.example` | **Modificado** | Agregada clave AES `ENCRYPTION_KEY` |
| `Back/package.json` | **Modificado** | Agregados scripts `test:hu38` y `verificar:bd` |

### Frontend

| Archivo | Operación | Descripción |
|---|---|---|
| `Front/src/services/auditoriaService.ts` | **Nuevo** | Cliente HTTP `fetch` para consulta de logs de auditoría |
| `Front/src/pages/Auditoria/AuditoriaPage.tsx` | **Nuevo** | Vista interactiva de auditoría para Administrador |
| `Front/src/routes/AppRoutes.tsx` | **Modificado** | Registro de ruta `/auditoria` protegida con `RequireAuth` para `ADMINISTRADOR` |
| `Front/src/components/Nav.tsx` | **Modificado** | Enlace "Auditoría" en la barra de navegación |

---

## 3. Detalle de Campos Protegidos (HU-38)

| Entidad | Campo | Estado | Motivo / Técnica |
|---|---|---|---|
| `Paciente` | `documentoIdentidad` (CI) | **Legible** | Preservar búsquedas indexadas directas por SQL |
| `Paciente` | `direccion`, `contactoEmergencia`, `telefonoEmergencia` | **Cifrado** | AES-256-GCM (`iv:authTag:ciphertext`) |
| `Consulta` | `motivo`, `anamnesis`, `examenFisico`, `observaciones` | **Cifrado** | Datos médicos sensibles en formato `text` |
| `Diagnostico` | `descripcion` | **Cifrado** | Descripción clínica protegida |
| `Tratamiento` | `descripcion`, `indicaciones` | **Cifrado** | Prescripción médica y tratamiento protegidos |
| `HistoriaClinica` | `observaciones` | **Cifrado** | Observaciones clínicas |
| `Factura` | `nitCliente`, `razonSocial` | **Cifrado** | Datos financieros / PII del cliente |

---

## 4. Verificación y Pruebas

- **Compilación de Backend (`npm run typecheck`)**: 0 errores.
- **Compilación de Frontend (`npx tsc --noEmit`)**: 0 errores.
- **Pruebas unitarias de Cifrado (`npm run test:hu38`)**: 5/5 pruebas pasadas.
- **Verificación en BD Real (`npm run verificar:bd`)**:
  - Inserción y consulta en `audit_log` verificada.
  - Verificación SQL Raw en PostgreSQL Supabase: Los datos se confirman almacenados en formato cifrado `iv:authTag:ciphertext`.
  - Verificación TypeORM: La aplicación descifra de forma transparente al consultar.
