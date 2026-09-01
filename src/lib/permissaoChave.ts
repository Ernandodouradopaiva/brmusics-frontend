import type { Permissao } from '@/types/api';

/** Resolve a chave funcional usada na árvore e no RBAC. */
export function extrairChavePermissao(p: Permissao): string | null {
  const chave = p.chave?.trim();
  if (chave) return chave;

  const recurso = p.recurso?.trim();
  const acao = p.acao?.trim();
  if (recurso && acao) return `${recurso}.${acao}`;

  return null;
}

export function extrairChavesPermissoes(permissoes: Permissao[]): Set<string> {
  const out = new Set<string>();
  for (const p of permissoes) {
    const chave = extrairChavePermissao(p);
    if (chave) out.add(chave);
  }
  return out;
}
