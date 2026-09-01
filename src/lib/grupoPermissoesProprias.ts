export const CHAVES_MINIMAS_PROPRIO_GRUPO = [
  'grupo.menu',
  'grupo.pagina',
  'grupo.listar',
  'grupo.visualizar',
  'grupo.editar',
  'grupo.gerenciar-permissoes',
] as const;

export function usuarioEditaProprioGrupo(
  editCodigoGrupo: string | null | undefined,
  gruposCodigos: string[] | undefined,
  roles?: string[],
  nomeGrupo?: string
): boolean {
  if (!editCodigoGrupo) return false;
  if (gruposCodigos?.includes(editCodigoGrupo)) return true;
  const alvo = nomeGrupo?.trim().toUpperCase();
  if (!alvo || !roles?.length) return false;
  return roles.some((r) => r.trim().toUpperCase() === alvo);
}
