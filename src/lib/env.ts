function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

const DEFAULT_LOCAL_API_URL = 'http://localhost:8081';
const DEFAULT_PROD_API_URL = 'http://projeto-a-api:8081';
const DEFAULT_LOCAL_APP_URL = 'http://localhost:3002';

function isLoopbackOrUnspecified(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::' ||
      host === '[::]'
    );
  } catch {
    return false;
  }
}

/**
 * URL pública do frontend.
 * Precedência (runtime-friendly no K8s): APP_URL → NEXT_PUBLIC_APP_URL → localhost só em não-prod.
 */
export function getAppUrl(): string {
  const candidates = [
    process.env.APP_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const normalized = trimTrailingSlash(raw);
    if (process.env.NODE_ENV === 'production' && isLoopbackOrUnspecified(normalized)) {
      continue;
    }
    return normalized;
  }
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  return DEFAULT_LOCAL_APP_URL;
}

/**
 * URL interna do projetoA-api (somente servidor — proxy BFF).
 * Precedência: PROJETO_A_API_INTERNAL_URL → vars do Service K8s → produção → local.
 */
export function getProjetoAApiInternalUrl(): string {
  const explicit = process.env.PROJETO_A_API_INTERNAL_URL?.trim();
  if (explicit) return trimTrailingSlash(explicit);

  const k8sHost = process.env.PROJETO_A_API_SERVICE_HOST?.trim();
  if (k8sHost) {
    const port = process.env.PROJETO_A_API_SERVICE_PORT?.trim() || '8081';
    return `http://${k8sHost}:${port}`;
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PROD_API_URL;
  }

  return DEFAULT_LOCAL_API_URL;
}
