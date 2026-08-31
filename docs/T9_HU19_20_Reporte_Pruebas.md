# Reporte de Pruebas de Integración: HU-19 y HU-20

**Fecha:** 30/08/2026  
**Rama:** `arreglos-dev`  
**Estado:** ✅ **100% Aprobado (0 fallos)**

---

## 1. Alcance de las Historias de Usuario

### HU-19: Crear / Ver Historia Clínica
- **Apertura automática:** Apertura automática de historia clínica al recibir la primera atención (walk-in o cita).
- **Apertura manual:** Permite a Administradores y Recepcionistas abrir manualmente la historia clínica de un paciente sin requerir consulta previa.
- **Búsqueda por CI/DNI:** Acceso y consulta del historial clínico completo por Documento de Identidad del paciente.
- **Trazabilidad cronológica:** Visualización de atenciones ordenadas por fecha con médico tratante, motivo, anamnesis, examen físico, diagnósticos CIE-10 y tratamientos/prescripciones.
- **Prevención de duplicidad:** Bloqueo de apertura si el paciente ya cuenta con historia clínica activa (`409 Conflict`).

### HU-20: Registrar Consulta Médica (Atención Clínica Completa)
- **Punto de entrada:** Inicio de la atención desde la Cola de Espera o Gestión de Citas.
- **Campos clínicos estructurados:** Registro de motivo (obligatorio), anamnesis/enfermedad actual, examen físico y observaciones generales.
- **Diagnósticos clínicos:** Inserción dinámica de diagnósticos con código CIE-10 (opcional), descripción y tipo (`DEFINITIVO` / `PRESUNTIVO`).
- **Tratamientos y prescripción:** Inserción dinámica de medicamentos/tratamientos con indicaciones, dosis y fechas de vigencia.
- **Control de seguridad:** Bloqueo si un médico intenta registrar o modificar la consulta asignada a otro colega (`403 Forbidden`).
- **Inmutabilidad de la consulta:** Una vez en estado `ATENDIDA`, la consulta queda bloqueada contra modificaciones posteriores (`409 Conflict`).
- **Sincronización de citas:** Sincronización automática del estado de la cita a `ATENDIDA` al finalizar la consulta.

---

## 2. Matriz de Ejecución de Pruebas Automatizadas

| ID Prueba | Descripción | Criterio de Aceptación | Resultado |
|---|---|---|:---:|
| **HU19.1** | Búsqueda de paciente sin historia previa | Identifica al paciente por CI y reporta ausencia de historia clínica | ✅ APROBADO |
| **HU19.2** | Apertura manual de Historia Clínica | Crea registro de historia clínica (`HC-id`) para el paciente indicado | ✅ APROBADO |
| **HU19.3** | Bloqueo de duplicidad de Historia Clínica | Rechaza intento de reapertura manual si ya existe (409 Conflict) | ✅ APROBADO |
| **HU20.1** | Creación e inicio de consulta médica | Genera registro de consulta en estado `EN_ESPERA` con datos de ingreso | ✅ APROBADO |
| **HU20.2** | Control de autorización médica | Bloquea a médico no asignado que intente completar la consulta (403 Forbidden) | ✅ APROBADO |
| **HU20.3** | Registro clínico completo | Guarda motivo, anamnesis, examen físico, diagnósticos CIE-10 y tratamientos | ✅ APROBADO |
| **HU20.4** | Transición y cierre de consulta | Cambia estado a `ATENDIDA` y finaliza la cita vinculada | ✅ APROBADO |
| **HU20.5** | Inmutabilidad de consulta atendida | Rechaza cualquier modificación posterior sobre consulta en `ATENDIDA` (409 Conflict) | ✅ APROBADO |
| **HU19.4** | Trazabilidad en Historia Clínica | Recupera consultas completas con sus diagnósticos y tratamientos vinculados | ✅ APROBADO |

---

## 3. Comandos de Verificación
- **Backend Typecheck:** `npx tsc --noEmit` en `Back` (código 0).
- **Pruebas de Integración:** `npx ts-node src/test/hu19_20.integration.test.ts` en `Back` (código 0).
- **Frontend Build:** `npm run build` en `Front` (código 0).
