'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { setUnauthorizedHandler } from '@/lib/api';
import { clearStoredAuth, fetchSession, loginWithPassword, logoutOnServer } from '@/lib/auth';
import type { AuthModel } from '@/lib/auth/apiAuth';
import { isPublicAppRoute } from '@/lib/public-routes';
import { rotaInicialParaUsuario } from '@/lib/routePermissions';

interface LogoutOptions {
  /** Em rotas públicas o logout não redireciona por padrão; use true para forçar. */
  redirect?: boolean;
}

interface AuthContextValue {
  user: AuthModel | null;
  loading: boolean;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: (options?: LogoutOptions) => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthModel | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  const bootstrap = useCallback(async () => {
    try {
      const session = await fetchSession();
      setUser(session);
    } catch {
      clearStoredAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (cpf: string, senha: string) => {
      clearStoredAuth();
      const result = await loginWithPassword(cpf, senha);
      setUser(result);
      router.replace(rotaInicialParaUsuario(result));
    },
    [router]
  );

  const logout = useCallback(
    (options?: LogoutOptions) => {
      void logoutOnServer().finally(() => {
        clearStoredAuth();
        setUser(null);
        const shouldRedirect = options?.redirect ?? !isPublicAppRoute(pathname);
        if (shouldRedirect) router.replace('/login');
      });
    },
    [pathname, router]
  );

  const refreshSession = useCallback(async () => {
    const model = await fetchSession();
    setUser(model);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshSession, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
