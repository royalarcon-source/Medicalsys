# T8_HU10 - Reporte de pruebas

- Fecha de ejecución: 2026-08-27T09:30:47.443Z
- Base URL: http://localhost:3000/api
- Resultado: 17 pasaron, 0 fallaron, 0 bloqueadas

| Subtarea | Resultado | Evidencia |
|---|---|---|
| ST8.1 Buscar paciente por CI | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.2 Buscar por nombre | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.3 Buscar por apellido | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"},{"idPaciente":"8","documentoIdentidad":"HU10-CI-2-1787823035760","nombres":"Bruno","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Masculino"},{"idPaciente":"9","documentoIdentidad":"HU10-CI-3-1787823035760","nombres":"Carla","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":3,"page":1,"limit":10,"totalPages":1} |
| ST8.4 Buscar paciente inexistente | PASÓ | HTTP 200; payload={"resultados":[],"total":0,"page":1,"limit":10,"totalPages":0,"message":"No se encontraron pacientes."} |
| ST8.5 Múltiples resultados y paginación | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"9","documentoIdentidad":"HU10-CI-3-1787823035760","nombres":"Carla","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":3,"page":2,"limit":2,"totalPages":2} |
| ST8.6 Consultar detalle por ID | PASÓ | HTTP 200; payload={"paciente":{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino","telefono":"70000000","email":"hu10-paciente-1787823035760@test.invalid","direccion":"Dirección de prueba HU10","contactoEmergencia":"Contacto HU10","telefonoEmergencia":"71111111","fechaRegistro":"2026-08-27T13:30:38.690Z"}} |
| ST8.7 Consultar ID inexistente | PASÓ | HTTP 404; payload={"error":"Paciente no encontrado"} |
| ST8.8 Consultar como Administrador | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.9 Consultar como Médico | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.10 Consultar como Recepcionista | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.11 Paciente no accede a lista ni perfil ajeno | PASÓ | lista=HTTP 403; payload={"error":"No tienes permisos para realizar esta acción"}; detalle=HTTP 403; payload={"error":"No tienes permisos para realizar esta acción"} |
| ST8.12 Paciente consulta su propio perfil | PASÓ | Servicio propio permitido; endpoint general=HTTP 403; payload={"error":"No tienes permisos para realizar esta acción"} |
| ST8.13 Sin autenticación o token inválido | PASÓ | ausente=HTTP 401; payload={"error":"Debe iniciar sesión para acceder a este recurso"}; inválido=HTTP 401; payload={"error":"Token inválido"} |
| ST8.14 Estructura JSON HTTP y payload | PASÓ | HTTP 200; payload={"resultados":[{"idPaciente":"7","documentoIdentidad":"HU10-CI-1-1787823035760","nombres":"Ana","apellidos":"Pérez","fechaNacimiento":"1989-12-31","sexo":"Femenino"}],"total":1,"page":1,"limit":10,"totalPages":1} |
| ST8.15 Consultas ejecutadas correctamente en PostgreSQL | PASÓ | PostgreSQL conectado; count(paciente)=3 |
| ST8.16 Respuesta sin datos médicos de otras HU | PASÓ | Payload sin historia clínica, recetas ni diagnósticos |
| ST8.17 AppError sin exponer internals | PASÓ | HTTP 400; payload={"error":"El identificador del paciente debe ser un número válido"} |

## Criterio de ejecución

La suite crea datos temporales, usa PostgreSQL y llama los endpoints HTTP reales con tokens JWT por rol. Los datos se eliminan en el bloque `finally`, incluso cuando una prueba falla.

