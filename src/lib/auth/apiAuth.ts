import { resolveApiBaseURLForClient } from '@/lib/apiBaseUrl';
import type { SessionUser } from '@/lib/jwt';

export interface AuthModel extends SessionUser {
  roles?: string[];
  authorities?: string[];
  permissoes?: string[];
  gruposCodigos?: string[];
  grupoNome?: string | null;
  cargo?: string | null;
  id?: number;
  codigo?: string;
  username?: string;
}

export async function loginWithPassword(cpf: string, senha: string): Promise<AuthModel> {
  const base = resolveApiBaseURLForClient();
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ cpf, senha }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const msg =
      data?.userMessage ??
      data?.detail ??
      data?.title ??
      'CPF ou senha incorretos. Verifique seus dados e tente novamente.';
    throw new Error(typeof msg === 'string' ? msg : 'Falha no login');
  }

  const session = await fetchSession();
  if (!session) throw new Error('Sessão não estabelecida após login');
  return session;
}

export async function fetchSession(): Promise<AuthModel | null> {
  const base = resolveApiBaseURLForClient();
  const response = await fetch(`${base}/auth/session`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Não foi possível validar a sessão');
  const data = (await response.json()) as AuthModel;
  return mapAuthModel(data);
}

export async function logoutOnServer(): Promise<void> {
  const base = resolveApiBaseURLForClient();
  await fetch(`${base}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
}

export async function refreshSessionFromToken(_accessToken: string): Promise<AuthModel> {
  const session = await fetchSession();
  if (!session) throw new Error('Sessão inválida');
  return session;
}

function mapAuthModel(data: AuthModel): AuthModel {
  return {
    nome: data.nome,
    cpf: data.cpf ?? data.username,
    email: data.email,
    cargo: data.cargo ?? null,
    roles: data.roles,
    authorities: data.authorities,
    permissoes: data.permissoes ?? data.authorities,
    gruposCodigos: data.gruposCodigos,
    grupoNome: data.grupoNome,
    id: data.id,
    codigo: data.codigo,
    username: data.username,
  };
}
