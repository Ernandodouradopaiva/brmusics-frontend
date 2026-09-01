import type { AuthModel } from '@/lib/auth/apiAuth';
import { hasPermission, usuarioPodeAcessarPagina } from '@/lib/permissions';

export const MENSAGEM_SEM_PERMISSAO_PAGINA = 'Você não tem permissão para acessar esta página.';

export const ROTA_SEM_ACESSO = '/sem-acesso';

type RotaRule = { prefix: string; permission: string };

const ROTAS: RotaRule[] = [
  { prefix: '/musicos', permission: 'musico.pagina' },
  { prefix: '/instrumentos', permission: 'instrumento.pagina' },
  { prefix: '/locais', permission: 'local.pagina' },
  { prefix: '/celebracoes', permission: 'celebracao.pagina' },
  { prefix: '/escalas', permission: 'escala.pagina' },
  { prefix: '/repertorios', permission: 'repertorio.pagina' },
  { prefix: '/musicas', permission: 'musica.pagina' },
  { prefix: '/whatsapp', permission: 'whatsapp.pagina' },
  { prefix: '/minha-escala', permission: 'minha-escala.pagina' },
  { prefix: '/meu-repertorio', permission: 'meu-repertorio.pagina' },
  { prefix: '/usuarios', permission: 'usuario.pagina' },
  { prefix: '/grupos', permission: 'grupo.pagina' },
  { prefix: '/permissoes', permission: 'permissao.pagina' },
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Acesso à rota exige a permissão {@code *.pagina} correspondente — sem atalhos por menu/listar. */
function permissaoPaginaAtendida(user: AuthModel | null | undefined, permission: string): boolean {
  return hasPermission(user, permission);
}

export function usuarioTemAlgumaRotaAcessivel(user: AuthModel | null | undefined): boolean {
  if (usuarioPodeAcessarPagina(user, 'inicio')) return true;
  if (usuarioPodeAcessarPagina(user, 'minha-escala')) return true;
  return ROTAS.some((rule) => permissaoPaginaAtendida(user, rule.permission));
}

export function rotaNegadaParaUsuario(pathname: string, user: AuthModel | null | undefined): boolean {
  if (pathname === ROTA_SEM_ACESSO) return false;

  if (pathname === '/home' || pathname === '/') {
    return !usuarioPodeAcessarPagina(user, 'inicio') && !usuarioPodeAcessarPagina(user, 'minha-escala');
  }

  for (const rule of ROTAS) {
    if (!pathMatchesPrefix(pathname, rule.prefix)) continue;
    return !permissaoPaginaAtendida(user, rule.permission);
  }

  return false;
}

export function rotaInicialParaUsuario(user: AuthModel | null | undefined): string {
  if (usuarioPodeAcessarPagina(user, 'minha-escala')) return '/home';
  if (usuarioPodeAcessarPagina(user, 'inicio')) return '/home';
  if (usuarioPodeAcessarPagina(user, 'meu-repertorio')) return '/meu-repertorio';
  if (usuarioPodeAcessarPagina(user, 'musico')) return '/musicos';
  if (usuarioPodeAcessarPagina(user, 'instrumento')) return '/instrumentos';
  if (usuarioPodeAcessarPagina(user, 'local')) return '/locais';
  if (usuarioPodeAcessarPagina(user, 'celebracao')) return '/celebracoes';
  if (usuarioPodeAcessarPagina(user, 'escala')) return '/escalas';
  if (usuarioPodeAcessarPagina(user, 'repertorio')) return '/repertorios';
  if (usuarioPodeAcessarPagina(user, 'musica')) return '/musicas';
  if (usuarioPodeAcessarPagina(user, 'whatsapp')) return '/whatsapp';
  if (usuarioPodeAcessarPagina(user, 'usuario')) return '/usuarios';
  if (usuarioPodeAcessarPagina(user, 'grupo')) return '/grupos';
  if (usuarioPodeAcessarPagina(user, 'permissao')) return '/permissoes';
  return ROTA_SEM_ACESSO;
}
