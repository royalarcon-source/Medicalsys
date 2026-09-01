# T7_HU22 - Reporte de pruebas

- Fecha de ejecución: 2026-09-01T08:14:42.027Z
- Base URL: http://localhost:3000/api
- Resultado: 8 pasaron, 0 fallaron, 0 bloqueadas

| Subtarea | Resultado | Evidencia |
|---|---|---|
| ST22.1 Registro exitoso con rol MEDICO | PASÓ | HTTP 201; payload={"mensaje":"Tratamiento registrado exitosamente.","tratamiento":{"idTratamiento":"3","consulta":{"idConsulta":"9"},"descripcion":"Amoxicilina 500mg","indicaciones":"Tomar cada 12 horas por 5 días","fechaInicio":"2026-09-01T00:00:00.000Z","fechaFin":"2026-09-05T00:00:00.000Z"}} |
| ST22.2 Consulta inexistente devuelve 404 | PASÓ | HTTP 404; payload={"error":"La consulta indicada no existe."} |
| ST22.3 Paciente sin permiso recibe 403 | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST22.4 Recepcionista sin permiso recibe 403 | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST22.5 Validación de campos y coherencia de fechas devuelve 400 | PASÓ | HTTP 400; payload={"error":"La descripción del tratamiento es obligatoria."} |
| ST22.6 Sin autenticación recibe 401 | PASÓ | HTTP 401; payload={"error":"Token requerido"} |
| ST22.7 Token inválido recibe 401 | PASÓ | HTTP 401; payload={"error":"Token inválido"} |
| ST22.8 Acceso administrativo con token válido | PASÓ | HTTP 200; payload={"tratamiento":{"idTratamiento":"3","consulta":{"idConsulta":"9","historia":{"idHistoria":"8","paciente":{"idPaciente":"24","usuario":{"idUsuario":"113","nombres":"PacienteHu22","apellidos":"Test","email":"hu22-pacientehu22-1788250472196@test.invalid","telefono":"70000000","activo":true,"fechaCreacion":"2026-09-01T12:14:34.733Z"},"documentoIdentidad":"CI-HU22-1788250472196","fechaNacimiento":"1987-05-14","sexo":"M","direccion":"Avenida prueba 456","contactoEmergencia":"Contacto HU22","telefonoEmergencia":"72222222","fechaRegistro":"2026-09-01T12:14:35.494Z"},"fechaApertura":"2026-09-01T12:14:35.876Z","observaciones":"Historia creada para pruebas de tratamiento HU22"},"medico":{"idMedico":"46","usuario":{"idUsuario":"111","nombres":"MedicoHu22","apellidos":"Test","email":"hu22-medicohu22-1788250472196@test.invalid","telefono":"70000000","activo":true,"fechaCreacion":"2026-09-01T12:14:33.970Z"},"numeroColegiatura":"HU22-COL-1788250472196","activo":true},"fechaConsulta":"2026-09-01T08:14:36.673Z","motivo":"Tratamiento por seguimiento","anamnesis":null,"examenFisico":null,"observaciones":null,"tipoIngreso":"CONSULTA_ESPONTANEA","numeroTurno":1,"estadoConsulta":"EN_ESPERA"},"descripcion":"Amoxicilina 500mg","indicaciones":"Tomar cada 12 horas por 5 días","fechaInicio":"2026-08-31","fechaFin":"2026-09-04"}} |

## Criterio de ejecución

La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.

