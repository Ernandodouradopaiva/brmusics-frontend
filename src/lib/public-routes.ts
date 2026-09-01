const PUBLIC_PREFIXES = ['/login', '/recuperar-senha'];

export function isPublicAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
