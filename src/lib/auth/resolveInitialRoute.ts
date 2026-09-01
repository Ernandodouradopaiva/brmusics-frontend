import type { AuthModel } from '@/lib/auth/apiAuth';
import { ROTA_SEM_ACESSO } from '@/lib/routePermissions';
import { usuarioPodeAcessarPagina } from '@/lib/permissions';

/** Rota inicial após login. */
export function resolveInitialRouteFromSession(session: AuthModel): string {
  if (usuarioPodeAcessarPagina(session, 'inicio')) return '/home';
  if (usuarioPodeAcessarPagina(session, 'musico')) return '/musicos';
  if (usuarioPodeAcessarPagina(session, 'instrumento')) return '/instrumentos';
  if (usuarioPodeAcessarPagina(session, 'local')) return '/locais';
  if (usuarioPodeAcessarPagina(session, 'celebracao')) return '/celebracoes';
  if (usuarioPodeAcessarPagina(session, 'escala')) return '/escalas';
  if (usuarioPodeAcessarPagina(session, 'repertorio')) return '/repertorios';
  if (usuarioPodeAcessarPagina(session, 'musica')) return '/musicas';
  if (usuarioPodeAcessarPagina(session, 'usuario')) return '/usuarios';
  if (usuarioPodeAcessarPagina(session, 'grupo')) return '/grupos';
  if (usuarioPodeAcessarPagina(session, 'permissao')) return '/permissoes';
  return ROTA_SEM_ACESSO;
}
