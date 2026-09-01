'use client';

import { useLayoutEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { notifyError } from '@/lib/notify';
import { useAuth } from '@/contexts/AuthContext';
import { isPublicAppRoute } from '@/lib/public-routes';
import {
  MENSAGEM_SEM_PERMISSAO_PAGINA,
  rotaInicialParaUsuario,
  rotaNegadaParaUsuario,
} from '@/lib/routePermissions';

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const acessoNegado = useMemo(() => {
    if (loading) return false;
    if (isPublicAppRoute(pathname)) return false;
    if (!user) return false;
    return rotaNegadaParaUsuario(pathname, user);
  }, [loading, pathname, user]);

  useLayoutEffect(() => {
    if (!acessoNegado || !user) return;
    const destino = rotaInicialParaUsuario(user);
    if (destino === pathname) return;
    notifyError(MENSAGEM_SEM_PERMISSAO_PAGINA, { toastId: 'acesso-negado-estatico' });
    router.replace(destino);
  }, [acessoNegado, pathname, router, user]);

  if (acessoNegado) return null;
  return <>{children}</>;
}
