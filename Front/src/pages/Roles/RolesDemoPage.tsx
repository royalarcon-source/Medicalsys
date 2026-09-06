import { useState } from 'react';
import { Check, X } from 'lucide-react';

// --- Permission matrix (mirrors Back/src/permissions/rolePermissions.ts) ---
type RoleName = 'ADMINISTRADOR' | 'MEDICO' | 'RECEPCIONISTA' | 'PACIENTE';

type Permission =
  | 'MEDICO_CREAR'
  | 'MEDICO_VER'
  | 'ESPECIALIDAD_LISTAR'
  | 'ESPECIALIDAD_GESTIONAR'
  | 'PACIENTE_GESTIONAR'
  | 'PACIENTE_CONSULTAR'
  | 'PACIENTE_CREAR'
  | 'ROL_CREAR'
  | 'CITA_GESTIONAR'
  | 'CONSULTA_GESTIONAR'
  | 'HISTORIA_CLINICA_VER'
  | 'USUARIO_GESTIONAR';

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMINISTRADOR: [
    'MEDICO_CREAR',
    'MEDICO_VER',
    'ESPECIALIDAD_LISTAR',
    'ESPECIALIDAD_GESTIONAR',
    'PACIENTE_GESTIONAR',
    'PACIENTE_CONSULTAR',
    'PACIENTE_CREAR',
    'ROL_CREAR',
    'CITA_GESTIONAR',
    'CONSULTA_GESTIONAR',
    'HISTORIA_CLINICA_VER',
    'USUARIO_GESTIONAR',
  ],
  MEDICO: [
    'MEDICO_VER',
    'ESPECIALIDAD_LISTAR',
    'PACIENTE_CONSULTAR',
    'CONSULTA_GESTIONAR',
    'HISTORIA_CLINICA_VER',
  ],
  RECEPCIONISTA: [
    'MEDICO_VER',
    'ESPECIALIDAD_LISTAR',
    'PACIENTE_GESTIONAR',
    'PACIENTE_CONSULTAR',
    'PACIENTE_CREAR',
    'CITA_GESTIONAR',
  ],
  PACIENTE: ['ESPECIALIDAD_LISTAR'],
};

// --- Permission labels & descriptions ---
const PERMISSION_META: Record<Permission, { label: string; endpoint: string; method: string }> = {
  MEDICO_CREAR: { label: 'Registrar médico', endpoint: 'POST /api/medicos', method: 'POST' },
  MEDICO_VER: { label: 'Ver médico', endpoint: 'GET /api/medicos/:id', method: 'GET' },
  ESPECIALIDAD_LISTAR: { label: 'Listar especialidades', endpoint: 'GET /api/especialidades', method: 'GET' },
  ESPECIALIDAD_GESTIONAR: { label: 'Gestionar especialidades', endpoint: 'POST/PUT /api/especialidades', method: 'PUT' },
  PACIENTE_GESTIONAR: { label: 'Gestionar pacientes', endpoint: 'POST/PUT /api/pacientes', method: 'POST' },
  PACIENTE_CONSULTAR: { label: 'Consultar pacientes', endpoint: 'GET /api/pacientes', method: 'GET' },
  PACIENTE_CREAR: { label: 'Registrar paciente', endpoint: 'POST /api/pacientes/registrar', method: 'POST' },
  ROL_CREAR: { label: 'Crear rol', endpoint: 'POST /api/roles', method: 'POST' },
  CITA_GESTIONAR: { label: 'Gestionar citas', endpoint: 'POST/PUT /api/citas', method: 'POST' },
  CONSULTA_GESTIONAR: { label: 'Gestionar consultas', endpoint: 'POST /api/consultas', method: 'POST' },
  HISTORIA_CLINICA_VER: { label: 'Ver historia clínica', endpoint: 'GET /api/pacientes/:id/historia', method: 'GET' },
  USUARIO_GESTIONAR: { label: 'Gestionar usuarios', endpoint: 'POST/DELETE /api/usuarios', method: 'POST' },
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_META) as Permission[];

const ROLE_META: Record<RoleName, { color: string; bg: string; abbr: string; description: string }> = {
  ADMINISTRADOR: { color: '#0f172a', bg: '#f1f5f9', abbr: 'ADM', description: 'Acceso completo al sistema' },
  MEDICO: { color: '#059669', bg: '#ecfdf5', abbr: 'MED', description: 'Funciones clínicas y consultas' },
  RECEPCIONISTA: { color: '#0284c7', bg: '#f0f9ff', abbr: 'REC', description: 'Gestión administrativa y citas' },
  PACIENTE: { color: '#475569', bg: '#f8fafc', abbr: 'PAC', description: 'Acceso a sus propios datos' },
};

const METHOD_COLOR: Record<string, string> = {
  GET: '#059669',
  POST: '#0284c7',
  PUT: '#d97706',
  DELETE: '#dc2626',
};

export default function RolesDemoPage() {
  const [activeRole, setActiveRole] = useState<RoleName>('ADMINISTRADOR');

  const permissions = ROLE_PERMISSIONS[activeRole];
  const meta = ROLE_META[activeRole];

  return (
    <div className="demo-layout">
      <main className="demo-main">
        {/* Role selector */}
        <section className="demo-roles-section">
          <p className="demo-section-label">Seleccioná un rol para ver su matriz de permisos clínicos</p>
          <div className="demo-roles-grid">
            {(Object.keys(ROLE_PERMISSIONS) as RoleName[]).map((role) => {
              const m = ROLE_META[role];
              const isActive = activeRole === role;
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
              );
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
              const allowed = permissions.includes(perm);
              const m = PERMISSION_META[perm];
              return (
                <div key={perm} className={`demo-perm-row ${allowed ? 'allowed' : 'denied'}`}>
                  <span className="demo-perm-status">
                    {allowed ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                  </span>
                  <div className="demo-perm-info">
                    <span className="demo-perm-label">{m.label}</span>
                    <code className="demo-perm-endpoint">{m.endpoint}</code>
                  </div>
                  <span className="demo-perm-method" style={{ color: METHOD_COLOR[m.method] }}>
                    {m.method}
                  </span>
                  <span className={`demo-perm-verdict ${allowed ? 'verdict-ok' : 'verdict-no'}`}>
                    {allowed ? '200 OK' : '403 Forbidden'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
