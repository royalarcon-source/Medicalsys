# T7_HU21 - Reporte de pruebas

- Fecha de ejecución: 2026-09-01T08:14:00.575Z
- Base URL: http://localhost:3000/api
- Resultado: 8 pasaron, 0 fallaron, 0 bloqueadas

| Subtarea | Resultado | Evidencia |
|---|---|---|
| ST21.1 Registro exitoso con rol MEDICO | PASÓ | HTTP 201; payload={"mensaje":"Diagnóstico registrado exitosamente.","diagnostico":{"idDiagnostico":"6","consulta":{"idConsulta":"8"},"codigo":"J00","descripcion":"Rinitis aguda","tipo":"DEFINITIVO"}} |
| ST21.2 Consulta inexistente devuelve 404 | PASÓ | HTTP 404; payload={"error":"La consulta indicada no existe."} |
| ST21.3 Paciente sin permiso recibe 403 | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST21.4 Recepcionista sin permiso recibe 403 | PASÓ | HTTP 403; payload={"error":"Acceso denegado"} |
| ST21.5 Validación de campos requeridos devuelve 400 | PASÓ | HTTP 400; payload={"error":"La descripción del diagnóstico es obligatoria."} |
| ST21.6 Sin autenticación recibe 401 | PASÓ | HTTP 401; payload={"error":"Token requerido"} |
| ST21.7 Token inválido recibe 401 | PASÓ | HTTP 401; payload={"error":"Token inválido"} |
| ST21.8 Acceso administrativo con token válido | PASÓ | HTTP 200; payload={"diagnostico":{"idDiagnostico":"6","consulta":{"idConsulta":"8","historia":{"idHistoria":"7","paciente":{"idPaciente":"23","usuario":{"idUsuario":"109","nombres":"PacienteHu21","apellidos":"Test","email":"hu21-pacientehu21-1788250430841@test.invalid","telefono":"70000000","activo":true,"fechaCreacion":"2026-09-01T12:13:53.335Z"},"documentoIdentidad":"CI-HU21-1788250430841","fechaNacimiento":"1992-03-08","sexo":"F","direccion":"Calle prueba 123","contactoEmergencia":"Contacto HU21","telefonoEmergencia":"71111111","fechaRegistro":"2026-09-01T12:13:54.102Z"},"fechaApertura":"2026-09-01T12:13:54.486Z","observaciones":"Historia creada para pruebas de diagnóstico HU21"},"medico":{"idMedico":"45","usuario":{"idUsuario":"107","nombres":"MedicoHu21","apellidos":"Test","email":"hu21-medicohu21-1788250430841@test.invalid","telefono":"70000000","activo":true,"fechaCreacion":"2026-09-01T12:13:52.568Z"},"numeroColegiatura":"HU21-COL-1788250430841","activo":true},"fechaConsulta":"2026-09-01T08:13:55.278Z","motivo":"Dolor torácico leve","anamnesis":null,"examenFisico":null,"observaciones":null,"tipoIngreso":"CONSULTA_ESPONTANEA","numeroTurno":1,"estadoConsulta":"EN_ESPERA"},"codigo":"J00","descripcion":"Rinitis aguda","tipo":"DEFINITIVO"}} |

## Criterio de ejecución

La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.

