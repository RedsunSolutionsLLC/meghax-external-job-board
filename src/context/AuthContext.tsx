import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('job_board_user');
    return stored ? JSON.parse(stored) as User : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('job_board_token'),
  );

  const setAuth = useCallback((u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('job_board_user', JSON.stringify(u));
    localStorage.setItem('job_board_token', t);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('job_board_user');
    localStorage.removeItem('job_board_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
