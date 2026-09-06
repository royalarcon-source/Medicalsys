import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UsuarioAutenticado } from '../services/authService';

type AuthContextValue = {
  token: string | null;
  usuario: UsuarioAutenticado | null;
  login: (newToken: string, usuario: UsuarioAutenticado) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function leerUsuarioGuardado(): UsuarioAutenticado | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('usuario');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UsuarioAutenticado;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('token');
  });

  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(leerUsuarioGuardado);

  const login = useCallback((newToken: string, nuevoUsuario: UsuarioAutenticado) => {
    setToken(newToken);
    setUsuario(nuevoUsuario);
    window.localStorage.setItem('token', newToken);
    window.localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsuario(null);
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('usuario');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      usuario,
      login,
      logout,
    }),
    [login, logout, token, usuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
