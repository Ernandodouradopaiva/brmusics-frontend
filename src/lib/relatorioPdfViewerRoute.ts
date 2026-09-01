/** Rota do visualizador PDF (sem sidebar/header — igual aba do Chrome). */
export function isRelatorioPdfViewerRoute(pathname: string | null | undefined): boolean {
  if (pathname == null || pathname === '') {
    return false;
  }
  const path = pathname.split('?')[0] || '';
  return path === '/relatorios/visualizador-pdf' || path.endsWith('/relatorios/visualizador-pdf');
}
