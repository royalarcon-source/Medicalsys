import { useState } from 'react'
import './App.css'

// --- Permission matrix (mirrors Back/src/permissions/rolePermissions.ts) ---
type RoleName = 'ADMINISTRADOR' | 'MEDICO' | 'RECEPCIONISTA' | 'PACIENTE'

type Permission =
  | 'MEDICO_CREAR'
  | 'MEDICO_VER'
  | 'ESPECIALIDAD_LISTAR'
  | 'ESPECIALIDAD_GESTIONAR'
  | 'PACIENTE_GESTIONAR'
  | 'CITA_GESTIONAR'
  | 'CONSULTA_GESTIONAR'
  | 'HISTORIA_CLINICA_VER'
  | 'USUARIO_GESTIONAR'

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMINISTRADOR: [
    'MEDICO_CREAR',
    'MEDICO_VER',
    'ESPECIALIDAD_LISTAR',
    'ESPECIALIDAD_GESTIONAR',
    'PACIENTE_GESTIONAR',
    'CITA_GESTIONAR',
    'CONSULTA_GESTIONAR',
    'HISTORIA_CLINICA_VER',
    'USUARIO_GESTIONAR',
  ],
  MEDICO: ['MEDICO_VER', 'ESPECIALIDAD_LISTAR', 'CONSULTA_GESTIONAR', 'HISTORIA_CLINICA_VER'],
  RECEPCIONISTA: ['MEDICO_VER', 'ESPECIALIDAD_LISTAR', 'PACIENTE_GESTIONAR', 'CITA_GESTIONAR'],
  PACIENTE: ['ESPECIALIDAD_LISTAR'],
}

// --- Permission labels & descriptions ---
const PERMISSION_META: Record<Permission, { label: string; endpoint: string; method: string }> = {
  MEDICO_CREAR:         { label: 'Registrar médico',       endpoint: 'POST /api/medicos',                              method: 'POST' },
  MEDICO_VER:           { label: 'Ver médico',              endpoint: 'GET /api/medicos/:id',                           method: 'GET'  },
  ESPECIALIDAD_LISTAR:  { label: 'Listar especialidades',   endpoint: 'GET /api/especialidades',                        method: 'GET'  },
  ESPECIALIDAD_GESTIONAR:{ label: 'Gestionar especialidades',endpoint: 'POST/PUT /api/especialidades',                  method: 'PUT'  },
  PACIENTE_GESTIONAR:   { label: 'Gestionar pacientes',     endpoint: 'POST/PUT /api/pacientes',                        method: 'POST' },
  CITA_GESTIONAR:       { label: 'Gestionar citas',         endpoint: 'POST/PUT /api/citas',                            method: 'POST' },
  CONSULTA_GESTIONAR:   { label: 'Gestionar consultas',     endpoint: 'POST /api/consultas',                            method: 'POST' },
  HISTORIA_CLINICA_VER: { label: 'Ver historia clínica',   endpoint: 'GET /api/pacientes/:id/historia',                method: 'GET'  },
  USUARIO_GESTIONAR:    { label: 'Gestionar usuarios',      endpoint: 'POST/DELETE /api/usuarios',                      method: 'POST' },
}

const ALL_PERMISSIONS = Object.keys(PERMISSION_META) as Permission[]

const ROLE_META: Record<RoleName, { color: string; bg: string; abbr: string; description: string }> = {
  ADMINISTRADOR: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', abbr: 'ADM', description: 'Acceso completo al sistema' },
  MEDICO:        { color: '#10b981', bg: 'rgba(16,185,129,0.12)', abbr: 'MED', description: 'Funciones clínicas y consultas' },
  RECEPCIONISTA: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', abbr: 'REC', description: 'Gestión administrativa y citas' },
  PACIENTE:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', abbr: 'PAC', description: 'Acceso a sus propios datos' },
}

const METHOD_COLOR: Record<string, string> = {
  GET:    '#10b981',
  POST:   '#3b82f6',
  PUT:    '#f59e0b',
  DELETE: '#ef4444',
}

function App() {
  const [activeRole, setActiveRole] = useState<RoleName>('ADMINISTRADOR')

  const permissions = ROLE_PERMISSIONS[activeRole]
  const meta = ROLE_META[activeRole]

  return (
    <div className="demo-layout">
      {/* Header */}
      <header className="demo-header">
        <div className="demo-header-inner">
          <div className="demo-brand">
            <span className="demo-brand-name">MedicalSys</span>
          </div>
          <span className="demo-badge">DEMO — Control de Acceso por Rol</span>
        </div>
      </header>

      <main className="demo-main">
        {/* Role selector */}
        <section className="demo-roles-section">
          <p className="demo-section-label">Seleccioná un rol para ver sus permisos</p>
          <div className="demo-roles-grid">
            {(Object.keys(ROLE_PERMISSIONS) as RoleName[]).map((role) => {
              const m = ROLE_META[role]
              const isActive = activeRole === role
              return (
                <button
                  key={role}
                  className={`demo-role-card ${isActive ? 'active' : ''}`}
                  style={{
                    '--role-color': m.color,
                    '--role-bg': m.bg,
                  } as React.CSSProperties}
                  onClick={() => setActiveRole(role)}
                >
                  <span className="demo-role-abbr" style={{ color: m.color }}>{m.abbr}</span>
                  <span className="demo-role-name">{role}</span>
                  <span className="demo-role-desc">{m.description}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Permission matrix */}
        <section className="demo-matrix-section">
          <div
            className="demo-matrix-header"
            style={{ '--role-color': meta.color, '--role-bg': meta.bg } as React.CSSProperties}
          >
            <span className="demo-matrix-abbr" style={{ color: meta.color }}>{meta.abbr}</span>
            <div>
              <h2 className="demo-matrix-title">{activeRole}</h2>
              <p className="demo-matrix-subtitle">{meta.description}</p>
            </div>
            <span className="demo-matrix-count">
              {permissions.length}/{ALL_PERMISSIONS.length} permisos
            </span>
          </div>

          <div className="demo-permissions-list">
            {ALL_PERMISSIONS.map((perm) => {
              const allowed = permissions.includes(perm)
              const m = PERMISSION_META[perm]
              return (
                <div key={perm} className={`demo-perm-row ${allowed ? 'allowed' : 'denied'}`}>
                  <span className="demo-perm-status">{allowed ? '✓' : '✗'}</span>
                  <div className="demo-perm-info">
                    <span className="demo-perm-label">{m.label}</span>
                    <code className="demo-perm-endpoint">{m.endpoint}</code>
                  </div>
                  <span
                    className="demo-perm-method"
                    style={{ color: METHOD_COLOR[m.method] }}
                  >
                    {m.method}
                  </span>
                  <span className={`demo-perm-verdict ${allowed ? 'verdict-ok' : 'verdict-no'}`}>
                    {allowed ? '200 OK' : '403 Forbidden'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
