import type { AuthModel } from '@/lib/auth/apiAuth';

const HREF_MENU_PERMISSION: Record<string, string> = {
  '/home': 'inicio.menu',
  '/musicos': 'musico.menu',
  '/frequencias': 'frequencia.menu',
  '/instrumentos': 'instrumento.menu',
  '/locais': 'local.menu',
  '/celebracoes': 'celebracao.menu',
  '/escalas': 'escala.menu',
  '/repertorios': 'repertorio.menu',
  '/musicas': 'musica.menu',
  '/whatsapp': 'whatsapp.menu',
  '/minha-escala': 'minha-escala.menu',
  '/meu-repertorio': 'meu-repertorio.menu',
  '/usuarios': 'usuario.menu',
  '/grupos': 'grupo.menu',
  '/permissoes': 'permissao.menu',
  '/relatorios': 'relatorio.menu',
};

export function getUserPermissoes(user: AuthModel | null | undefined): string[] {
  if (!user) return [];
  if (user.permissoes != null && user.permissoes.length > 0) return user.permissoes;
  if (user.authorities != null && user.authorities.length > 0) return user.authorities;
  return [];
}

export function hasPermission(user: AuthModel | null | undefined, permission: string): boolean {
  if (!permission) return false;
  return getUserPermissoes(user).includes(permission);
}

export function hasAnyPermission(user: AuthModel | null | undefined, permissions: string[]): boolean {
  if (!permissions.length) return false;
  const set = new Set(getUserPermissoes(user));
  return permissions.some((p) => set.has(p));
}

export function hasAllPermissions(user: AuthModel | null | undefined, permissions: string[]): boolean {
  if (!permissions.length) return false;
  const set = new Set(getUserPermissoes(user));
  return permissions.every((p) => set.has(p));
}

/** Acesso à rota/tela — exige {@code recurso.pagina}. */
export function usuarioPodeAcessarPagina(
  user: AuthModel | null | undefined,
  recurso: string
): boolean {
  return hasPermission(user, `${recurso}.pagina`);
}

/** Listagem na API/tela — exige {@code recurso.listar}. */
export function usuarioPodeListarRecurso(
  user: AuthModel | null | undefined,
  recurso: string
): boolean {
  return hasPermission(user, `${recurso}.listar`);
}

export function usuarioPodeAcessarInicio(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'inicio');
}

export function usuarioPodeVerMenuInicio(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'inicio.menu');
}

export function userCanSeeMenuHref(user: AuthModel | null | undefined, href: string): boolean {
  const permission = HREF_MENU_PERMISSION[href];
  if (!permission) return false;
  return hasPermission(user, permission);
}

export function podeListarUsuarios(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'usuario');
}

export function podeAcessarPaginaUsuarios(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'usuario');
}

export function podeGerenciarUsuarios(user: AuthModel | null | undefined): boolean {
  return hasAnyPermission(user, ['usuario.editar', 'usuario.criar', 'usuario.excluir']);
}

export function podeListarGrupos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'grupo');
}

export function podeAcessarPaginaGrupos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'grupo');
}

export function podeGerenciarGrupos(user: AuthModel | null | undefined): boolean {
  return hasAnyPermission(user, ['grupo.editar', 'grupo.criar', 'grupo.excluir', 'grupo.gerenciar-permissoes']);
}

export function podeListarPermissoes(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'permissao');
}

export function podeAcessarPaginaPermissoes(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'permissao');
}

export function podeVerMenuRelatorios(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'relatorio.menu');
}

export function podeAcessarPaginaRelatorios(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'relatorio');
}

export function podeAcessarPaginaRelatorioUsuarios(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'relatorio-usuarios');
}

export function podeGerarRelatorioUsuariosPdf(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'relatorio-usuarios.gerar');
}

export function podeVerRelatorio(user: AuthModel | null | undefined, recurso: string): boolean {
  return hasPermission(user, `${recurso}.pagina`);
}

export function podeGerarRelatorio(user: AuthModel | null | undefined, recurso: string): boolean {
  return hasPermission(user, `${recurso}.gerar`);
}

export function podeListarMusicos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'musico');
}

export function podeAcessarPaginaMusicos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'musico');
}

export function podeVerMenuMusicos(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'musico.menu');
}

export function podeListarFrequencias(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'frequencia');
}

export function podeVerMenuFrequencias(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'frequencia.menu');
}

export function podeListarInstrumentos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'instrumento');
}

export function podeAcessarPaginaInstrumentos(user: AuthModel | null | undefined): boolean {
  return usuarioPodeAcessarPagina(user, 'instrumento');
}

export function podeVerMenuInstrumentos(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'instrumento.menu');
}

export function podeListarLocais(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'local');
}

export function podeVerMenuLocais(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'local.menu');
}

export function podeListarCelebracoes(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'celebracao');
}

export function podeVerMenuCelebracoes(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'celebracao.menu');
}

export function podeListarEscalas(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'escala');
}

export function podeVerMenuEscalas(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'escala.menu');
}

export function podeListarRepertorios(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'repertorio');
}

export function podeVerMenuRepertorios(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'repertorio.menu');
}

export function podeListarMusicas(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'musica');
}

export function podeVerMenuMusicas(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'musica.menu');
}

export function podeListarWhatsApp(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'whatsapp');
}

export function podeVerMenuWhatsApp(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'whatsapp.menu');
}

export function podeListarMinhaEscala(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'minha-escala');
}

export function podeVerMenuMinhaEscala(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'minha-escala.menu');
}

export function podeListarMeuRepertorio(user: AuthModel | null | undefined): boolean {
  return usuarioPodeListarRecurso(user, 'meu-repertorio');
}

export function podeVerMenuMeuRepertorio(user: AuthModel | null | undefined): boolean {
  return hasPermission(user, 'meu-repertorio.menu');
}

/** Músico sem painel administrativo: usa início/escalas/repertórios/perfil. */
export function usuarioUsaNavegacaoMusico(user: AuthModel | null | undefined): boolean {
  return podeVerMenuMinhaEscala(user) && !podeVerMenuEscalas(user);
}

