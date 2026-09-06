# T7_HU14 - Reporte de pruebas

- Fecha de ejecución: 2026-08-28T15:35:53.828Z
- Base URL: http://localhost:3000/api
- Resultado: 10 pasaron, 0 fallaron, 0 bloqueadas

| Subtarea | Resultado | Evidencia |
|---|---|---|
| ST2.1 Consultar disponibilidad por médico | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.2 No incluye horarios inactivos | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.3 No incluye horarios de médicos inactivos | PASÓ | HTTP 200; payload={"resultados":[]} |
| ST2.4 Consultar disponibilidad por especialidad | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.5 Consultar disponibilidad por día de la semana | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.6 Médico sin filtros ve su propia disponibilidad por defecto | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.7 Estructura de la respuesta incluye datos del médico | PASÓ | HTTP 200; payload={"resultados":[{"idHorario":"13","idMedico":"23","medicoNombre":"MedicoActivo HU14","numeroColegiatura":"HU14-COL-ACT-1787931342395","especialidades":["Cardiología HU14 1787931342395"],"diaSemana":2,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}]} |
| ST2.8 Sin autenticación es rechazado | PASÓ | HTTP 401; payload={"error":"Token requerido"} |
| ST2.9 Token inválido es rechazado | PASÓ | HTTP 401; payload={"error":"Token inválido"} |
| ST2.10 Consultas ejecutadas correctamente en PostgreSQL | PASÓ | PostgreSQL conectado; count(horario_disponibilidad)=2 |

## Criterio de ejecución

La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.

