import type { AuthModel } from '@/lib/auth/apiAuth';

/** Nome do perfil (grupo) local do usuário no BRMusics — no máximo um vínculo. */
export function grupoNomeDoUsuario(user: AuthModel | null | undefined): string | null {
  const direto = user?.grupoNome?.trim();
  if (direto) return direto;
  const primeiro = user?.roles?.map((r) => r.trim()).find(Boolean);
  return primeiro ?? null;
}
