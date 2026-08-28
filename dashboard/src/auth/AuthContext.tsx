import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, getCurrentUser, login as apiLogin, logout as apiLogout } from '../api/client';
import type { CurrentUser } from '../api/client';

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: (usr: string, pwd: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On load, check if an existing session cookie is still valid so users
    // don't have to log in again on every page refresh.
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(usr: string, pwd: string) {
    setError(null);
    try {
      await apiLogin(usr, pwd);
      const me = await getCurrentUser();
      setUser(me);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
