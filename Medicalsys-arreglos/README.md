# MedicalSys

Sistema de Gestión Médica (Backend + Frontend).

---

## 🛠️ Requisitos Previos

1. **Node.js** v20+ y **npm**.
2. **PostgreSQL** instalado y en ejecución en el puerto `5432` con una base de datos creada llamada `medicalsys` (o la que definas en tu `.env`).

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Variables de Entorno (Backend)
El archivo `Back/.env` ya está configurado:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_postgres
DB_DATABASE=medicalsys
DB_SSL=false

JWT_SECRET=supersecretjwtkeymedicalsys2025
JWT_EXPIRATION=1h
JWT_EXPIRES_IN=1h
```
> *Si la contraseña de tu PostgreSQL local no es `postgres`, cámbiala en `Back/.env`.*

### 2. Iniciar Backend
Abre una terminal en la raíz o en la carpeta `Back`:
```bash
# Desde la raíz:
npm run dev:back

# O dentro de Back/:
cd Back
npm run dev
```

### 3. Iniciar Frontend
Abre otra terminal en la raíz o en la carpeta `Front`:
```bash
# Desde la raíz:
npm run dev:front

# O dentro de Front/:
cd Front
npm run dev
```
El frontend se abrirá en `http://localhost:5173`.

---

## 👥 Usuarios de Prueba (Pre-cargados)

Al iniciar el Backend por primera vez, se sembrarán automáticamente los siguientes usuarios según cada rol para que puedas probar todo el sistema:

| Rol | Correo / Usuario | Contraseña | Permisos / Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@medicalsys.com` | `admin1234` | Control total, crear usuarios, médicos, consultorios |
| **Médico** | `medico@medicalsys.com` | `medico1234` | Atenciones, consultas, historias clínicas, disponibilidad |
| **Recepcionista** | `recepcion@medicalsys.com` | `recepcion1234` | Registro de pacientes, gestión y reserva de citas, cola |
| **Paciente** | `paciente@medicalsys.com` | `paciente1234` | Reservar sus citas, ver su información |

---

## 📦 Scripts Disponibles desde la Raíz
- `npm run install:all`: Instala dependencias de Back y Front.
- `npm run dev:back`: Inicia el servidor Backend en modo desarrollo.
- `npm run dev:front`: Inicia el cliente Frontend con Vite.
- `npm run build`: Compila ambos proyectos TypeScript/Vite para producción.
