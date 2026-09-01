export function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('Token inválido');
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json) as Record<string, unknown>;
}

export interface SessionUser {
  codigo?: string;
  cpf?: string;
  nome?: string;
  email?: string;
  sistemas?: string[];
  roles?: string[];
  authorities?: string[];
}

export function isTokenExpired(token: string): boolean {
  try {
    const exp = decodeJwtPayload(token).exp;
    if (typeof exp !== 'number') return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export function sessionFromToken(token: string): SessionUser {
  const p = decodeJwtPayload(token);
  return {
    codigo: String(p.sub ?? ''),
    cpf: p.cpf as string | undefined,
    nome: p.nome as string | undefined,
    email: p.email as string | undefined,
    sistemas: p.sistemas as string[] | undefined,
  };
}
