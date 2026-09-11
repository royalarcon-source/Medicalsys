# Reporte de Pruebas de Integración: HU-17 y HU-18

**Fecha:** 30/08/2026  
**Rama:** `arreglos-dev`  
**Estado:** ✅ **100% Aprobado (0 fallos)**

---

## 1. Alcance de las Historias de Usuario

### HU-17: Asignación de Consultorio Físico a Personal Médico
- **Disponibilidad de espacios:** Consulta en tiempo real de consultorios disponibles para un rango de fecha/hora.
- **Control de solapamiento:** Bloqueo de asignación cuando el consultorio ya se encuentra ocupado en ese horario (`"El consultorio ya cuenta con una asignación activa en el horario seleccionado."`).
- **Validación de médico:** Bloqueo si el médico ya cuenta con otro consultorio asignado en el mismo bloque.
- **Liberación / reasignación:** Permitido antes del inicio del bloque horario.

### HU-18: Registro de Atención Médica Sin Cita Previa (Walk-in / Sobrecupo)
- **Búsqueda e integración de paciente:** Búsqueda rápida por CI y auto-creación de Historia Clínica en primera atención.
- **Asignación de turno y orden de cola:** Cálculo secuencial del número de turno (`#1`, `#2`, ...) para el médico del día.
- **Clasificación del ingreso:** `CONSULTA_ESPONTANEA`, `SOBRECUPO`, `URGENCIA_MENOR`.
- **Panel de cola y control de estados:** Transición de estados (`EN_ESPERA` ➡️ `EN_ATENCION` ➡️ `ATENDIDA` / `CANCELADA`).
- **Validación y alerta de sobrecupo:** Requerimiento de confirmación si se supera el umbral preventivo de sobrecupos.
- **Generación de Ticket de Turno:** Comprobante visual con número de turno asignado y datos de espera.

---

## 2. Matriz de Ejecución de Pruebas Automatizadas

| ID Prueba | Descripción | Criterio de Aceptación | Resultado |
|---|---|---|:---:|
| **HU17.1** | Listado de consultorios activos | Retorna catálogo de consultorios físicos | ✅ APROBADO |
| **HU17.2** | Asignación de consultorio a cita | Vinculación correcta de `id_consultorio` en `Cita` | ✅ APROBADO |
| **HU17.3** | Bloqueo de solapamiento de consultorio | Rechaza intento de doble ocupación en el mismo horario (409) | ✅ APROBADO |
| **HU17.4** | Asignación de consultorio alternativo | Asigna consultorio libre sin conflictos | ✅ APROBADO |
| **HU17.5** | Liberación de consultorio | Desvincula consultorio antes del inicio del horario | ✅ APROBADO |
| **HU18.1** | Registro walk-in y auto-creación de Historia Clínica | Crea `Consulta` con `cita=null` y apertura de Historia Clínica (Turno #1) | ✅ APROBADO |
| **HU18.2** | Turno secuencial incrementado | Asigna correctamente el Turno #2 para el médico del día | ✅ APROBADO |
| **HU18.3** | Cola de atención visualizada por médico | Aislamiento y consulta de pacientes en espera del médico | ✅ APROBADO |
| **HU18.4** | Transición de estado de consulta | Flujo de `EN_ESPERA` a `EN_ATENCION` | ✅ APROBADO |

---

## 3. Comandos de Verificación
- **Backend Typecheck:** `npm run typecheck` en `Back` (código 0).
- **Pruebas de Integración:** `npx ts-node src/test/hu17_18.integration.test.ts` en `Back` (código 0).
- **Frontend Build:** `npm run build` en `Front` (código 0).
