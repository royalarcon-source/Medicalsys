# Documentación de Arquitectura y Diagramas UML — MedicalSys

Este documento contiene la representación visual en sintaxis **Mermaid** (compatible con GitHub, GitLab y Antigravity) de los tres diagramas principales del sistema **MedicalSys**:

1. **Diagrama de Componentes (Arquitectura)**
2. **Modelado UML (Diagrama de Clases del Dominio)**
3. **Diagrama de Tiempos y Secuencia (Ciclo de Vida de Petición con Auditoría y Cifrado)**

---

## 1. Diagrama de Componentes (Component Diagram)

El siguiente diagrama detalla la arquitectura de software de **MedicalSys**, mostrando la separación de capas entre el cliente React, los controladores y middlewares de Express, los servicios de aplicación, el ORM TypeORM con sus utilidades (cifrado AES-256-GCM) y los componentes de infraestructura persistente.

```mermaid
flowchart TB
    subgraph Front["Capa de Presentación (Frontend - React + Vite)"]
        UI["React App / UI"]
        AuthCtx["AuthContext / Token Storage"]
        APIClients["API Services (Fetch Clients)"]
    end

    subgraph Back["Capa de Aplicación y API (Backend - Node.js / Express 5)"]
        Router["Express Router / Endpoints"]
        
        subgraph Middlewares["Middlewares"]
            AuthMw["authMiddleware / requirePermission"]
            ErrorMw["errorHandler Middleware"]
            UploadMw["Multer Upload Middleware"]
        end
        
        subgraph Controllers["Controladores (Controllers)"]
            AuthCtrl["AuthController"]
            PacienteCtrl["PacienteController"]
            ConsultaCtrl["ConsultaController"]
            AuditCtrl["AuditLogController"]
            FacturaCtrl["FacturaController"]
        end
        
        subgraph Services["Servicios de Negocio (Services)"]
            PacienteSvc["PacienteService"]
            ConsultaSvc["ConsultaService"]
            AuditSvc["AuditLogService"]
            AnuncioSvc["AnuncioService"]
            FacturaSvc["FacturaService"]
        end

        subgraph Utils["Utilidades de Infraestructura"]
            CryptoUtil["crypto / AES-256-GCM (encryption.ts)"]
            EncTransformer["TypeORM ValueTransformer"]
        end
    end

    subgraph Infra["Capa de Persistencia e Infraestructura Externa"]
        TypeORM["TypeORM DataSource / Repositories"]
        PostgresDB[("PostgreSQL - Supabase DB")]
        Cloudinary["Cloudinary API"]
    end

    UI --> AuthCtx
    UI --> APIClients
    APIClients -->|HTTP / REST JSON + JWT| Router

    Router --> AuthMw
    AuthMw --> Router
    Router --> UploadMw
    Router --> AuthCtrl
    Router --> PacienteCtrl
    Router --> ConsultaCtrl
    Router --> AuditCtrl
    Router --> FacturaCtrl
    Router --> ErrorMw

    AuthCtrl --> AuditSvc
    PacienteCtrl --> PacienteSvc
    ConsultaCtrl --> ConsultaSvc
    AuditCtrl --> AuditSvc
    FacturaCtrl --> FacturaSvc

    PacienteSvc --> EncTransformer
    ConsultaSvc --> EncTransformer
    EncTransformer --> CryptoUtil
    ErrorMw -->|Log ERROR_INTERNO 500| AuditSvc

    PacienteSvc --> TypeORM
    ConsultaSvc --> TypeORM
    AuditSvc --> TypeORM
    FacturaSvc --> TypeORM
    TypeORM -->|SQL Queries| PostgresDB
    UploadMw -->|Subida de archivos| Cloudinary
```

---

## 2. Modelado UML — Diagrama de Clases (Class Diagram)

Modelado completo del dominio de **MedicalSys**, incluyendo entidades de usuarios y seguridad, módulo clínico, facturación, zona de anuncios y la entidad de auditoría `AuditLog` (HU-39).

```mermaid
classDiagram
    class Usuario {
        +bigint idUsuario
        +string nombres
        +string apellidos
        +string email
        +string passwordHash
        +string telefono
        +boolean activo
        +Date fechaRegistro
    }

    class Rol {
        +bigint idRol
        +string nombre
        +string descripcion
    }

    class Paciente {
        +bigint idPaciente
        +string documentoIdentidad
        +Date fechaNacimiento
        +string sexo
        +string direccion
        +string contactoEmergencia
        +string telefonoEmergencia
        +Date fechaRegistro
    }

    class Medico {
        +bigint idMedico
        +string numeroLicencia
        +string telefonoProfesional
    }

    class Especialidad {
        +bigint idEspecialidad
        +string nombre
        +string descripcion
    }

    class HistoriaClinica {
        +bigint idHistoria
        +Date fechaApertura
        +string observaciones
    }

    class Consulta {
        +bigint idConsulta
        +Date fechaConsulta
        +string motivo
        +string anamnesis
        +string examenFisico
        +string observaciones
        +string tipoIngreso
        +int numeroTurno
        +string estadoConsulta
    }

    class Diagnostico {
        +bigint idDiagnostico
        +string codigo
        +string descripcion
        +string tipo
    }

    class Tratamiento {
        +bigint idTratamiento
        +string descripcion
        +string indicaciones
        +Date fechaInicio
        +Date fechaFin
    }

    class Cita {
        +bigint idCita
        +Date fechaHora
        +string estado
        +string motivo
    }

    class Factura {
        +bigint idFactura
        +string numeroFactura
        +Date fechaEmision
        +string nitCliente
        +string razonSocial
        +decimal subtotal
        +decimal impuestos
        +decimal total
        +string estado
        +string codigoControl
    }

    class AuditLog {
        +bigint idLog
        +bigint idUsuario
        +string rol
        +string accion
        +string entidad
        +bigint idEntidad
        +string ip
        +text userAgent
        +string resultado
        +text detalle
        +Date fechaHora
    }

    class Anuncio {
        +bigint idAnuncio
        +string titulo
        +text contenido
        +Date fechaPublicacion
        +Date fechaExpiracion
        +string estado
    }

    Usuario "1" -- "1" Rol : tiene
    Paciente "0..1" -- "1" Usuario : asociado_a
    Medico "0..1" -- "1" Usuario : asociado_a
    Medico "*" -- "*" Especialidad : especialidades
    HistoriaClinica "1" -- "1" Paciente : pertenece_a
    Consulta "*" -- "1" HistoriaClinica : registrada_en
    Consulta "*" -- "1" Medico : atendida_por
    Consulta "0..1" -- "0..1" Cita : vinculada_a
    Diagnostico "*" -- "1" Consulta : genera
    Tratamiento "*" -- "1" Consulta : prescribe
    Factura "*" -- "1" Paciente : facturada_a
    AuditLog "*" -- "0..1" Usuario : ejecutado_por
```

---

## 3. Diagrama de Tiempos y Secuencia (Timing / Sequence Diagram)

Representación del **ciclo de vida en el tiempo** de una petición sensible (ej. Registro de consulta médica con datos cifrados en HU-38 y registro de auditoría en HU-39).

```mermaid
sequenceDiagram
    autonumber
    actor MedicoUser as Médico (Frontend)
    participant Express as Express Router / Middleware
    participant Controller as ConsultaController
    participant Service as ConsultaService
    participant Encrypter as AES-256-GCM (encryption.ts)
    participant TypeORM as TypeORM / DB Driver
    participant Postgres as PostgreSQL (Supabase)
    participant AuditSvc as AuditLogService

    Note over MedicoUser, Postgres: T0: Envío de Petición HTTP POST /api/consultas
    MedicoUser->>Express: POST /api/consultas (JWT + Payload plano)
    
    Note over Express: T1: Autenticación y Autorización (JWT Check)
    Express->>Express: Validar JWT y Permiso "CONSULTA_CREAR"
    
    alt Token o Permiso Inválido
        Express-->>AuditSvc: auditLog.registrar("ACCESO_DENEGADO", 403)
        Express-->>MedicoUser: 403 Forbidden
    else Token Válido
        Express->>Controller: req.user + req.body
        Controller->>Service: crearConsulta(datos)
        
        Note over Service, Encrypter: T2: Transformación y Cifrado AES-256-GCM
        Service->>Encrypter: encrypt(anamnesis, examenFisico, motivo)
        Encrypter-->>Service: iv:authTag:ciphertext (hex)
        
        Note over Service, Postgres: T3: Inserción en Base de Datos
        Service->>TypeORM: save(ConsultaEntity)
        TypeORM->>Postgres: INSERT INTO consulta (motivo, anamnesis, ...) VALUES ('cifrado...', 'cifrado...')
        Postgres-->>TypeORM: OK (id_consulta: 105)
        TypeORM-->>Service: Consulta Guardada
        
        Note over Service, AuditSvc: T4: Auditoría Asíncrona (Fire-and-Forget)
        Service-)AuditSvc: AuditLogService.registrar("CONSULTA_CREAR", "EXITO")
        AuditSvc-)Postgres: INSERT INTO audit_log (...)
        
        Note over Service, MedicoUser: T5: Respuesta al Cliente (Descifrado transparente)
        Service-->>Controller: DTO Consulta
        Controller-->>MedicoUser: 201 Created (Payload JSON)
    end
```

---

### Resumen de Cumplimiento

- ✅ **Diagrama de Componentes**: Muestra la arquitectura en capas (React Front, Controllers/Middlewares Express, Cifrado AES, AuditLogService, TypeORM y PostgreSQL).
- ✅ **Modelado UML**: Diagrama de clases completo del dominio del sistema incluyendo las relaciones entre `Usuario`, `Paciente`, `Medico`, `Consulta`, `Diagnostico`, `Tratamiento`, `Factura`, `Anuncio` y `AuditLog`.
- ✅ **Diagrama de Tiempos / Secuencia**: Ilustra la secuencia temporal $T_0 \to T_5$ desde que el usuario envía una petición HTTP hasta el cifrado de datos, persistencia en BD y registro asíncrono de auditoría.
