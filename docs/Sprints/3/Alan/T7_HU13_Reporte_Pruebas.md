# T7_HU13 - Reporte de pruebas

- Fecha de ejecución: 2026-08-28T15:36:20.777Z
- Base URL: http://localhost:3000/api
- Resultado: 14 pasaron, 0 fallaron, 0 bloqueadas

| Subtarea | Resultado | Evidencia |
|---|---|---|
| ST1.1 Médico registra su propia disponibilidad | PASÓ | HTTP 201; payload={"mensaje":"Disponibilidad registrada correctamente","horario":{"idHorario":"16","diaSemana":1,"horaInicio":"08:00:00","horaFin":"12:00:00","activo":true}} |
| ST1.2 Rechaza horario solapado para el mismo médico y día | PASÓ | HTTP 409; payload={"error":"Ya existe un horario que se solapa con ese día y rango horario"} |
| ST1.3 Permite horario distinto sin solaparse (mismo día) | PASÓ | HTTP 201; payload={"mensaje":"Disponibilidad registrada correctamente","horario":{"idHorario":"17","diaSemana":1,"horaInicio":"14:00:00","horaFin":"18:00:00","activo":true}} |
| ST1.4 Rechaza diaSemana inválido | PASÓ | HTTP 400; payload={"error":"diaSemana debe ser un número entero entre 1 (lunes) y 7 (domingo)"} |
| ST1.5 Rechaza horaInicio >= horaFin | PASÓ | HTTP 400; payload={"error":"horaInicio debe ser anterior a horaFin"} |
| ST1.6 Administrador registra disponibilidad para otro médico | PASÓ | HTTP 201; payload={"mensaje":"Disponibilidad registrada correctamente","horario":{"idHorario":"18","diaSemana":3,"horaInicio":"09:00:00","horaFin":"13:00:00","activo":true}} |
| ST1.7 Administrador sin idMedico es rechazado | PASÓ | HTTP 400; payload={"error":"Como administrador debes indicar idMedico"} |
| ST1.8 Recepcionista no puede registrar disponibilidad | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST1.9 Paciente no puede registrar disponibilidad | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST1.10 Médico no puede editar el horario de otro médico | PASÓ | HTTP 403; payload={"error":"No tienes permiso para modificar este horario"} |
| ST1.11 Médico edita su propio horario | PASÓ | HTTP 200; payload={"mensaje":"Disponibilidad actualizada correctamente","horario":{"idHorario":"16","diaSemana":1,"horaInicio":"08:00:00","horaFin":"13:00:00","activo":true}} |
| ST1.12 Médico desactiva su propio horario (baja lógica) | PASÓ | HTTP 200; payload={"mensaje":"Disponibilidad desactivada correctamente"} |
| ST1.13 Sin autenticación es rechazado | PASÓ | HTTP 401; payload={"error":"Token requerido"} |
| ST1.14 Persistencia verificada en PostgreSQL | PASÓ | PostgreSQL conectado; count(horario_disponibilidad)=2 |

## Criterio de ejecución

La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.

