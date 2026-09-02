import { NextRequest, NextResponse } from 'next/server';
import { getBrmusicsApiInternalUrl } from '@/lib/env';
import { forwardProxyResponseHeaders } from '@/lib/proxyResponseHeaders';

export const dynamic = 'force-dynamic';

const ALLOWED_ROUTE_PREFIXES = [
  '/auth/login',
  '/auth/logout',
  '/auth/session',
  '/usuarios/recuperar-senha',
  '/usuarios',
  '/grupos',
  '/musicos',
  '/instrumentos',
  '/locais',
  '/celebracoes',
  '/escalas',
  '/repertorios',
  '/musicas',
  '/whatsapp',
  '/minha-escala',
  '/meu-repertorio',
  '/inicio',
  '/permissoes',
  '/estados',
  '/municipios',
  '/relatorios',
];

const BLOCKED_PREFIXES = ['/actuator', '/swagger-ui', '/v3/api-docs', '/internal'];

const STRIP_REQUEST = new Set(['host', 'connection']);

function shouldForwardBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
}

function isAllowed(subPath: string): boolean {
  if (BLOCKED_PREFIXES.some((p) => subPath === p || subPath.startsWith(`${p}/`))) {
    return false;
  }
  return ALLOWED_ROUTE_PREFIXES.some((p) => subPath === p || subPath.startsWith(`${p}/`));
}

async function proxy(req: NextRequest, segments: string[]) {
  const backend = getBrmusicsApiInternalUrl();

  const sub = segments.length ? '/' + segments.join('/') : '';
  if (!isAllowed(sub)) {
    return NextResponse.json(
      {
        message: 'Rota não permitida pelo proxy',
        userMessage: 'Este recurso não está disponível no momento. Contate o suporte se o problema persistir.',
      },
      { status: 403 },
    );
  }

  const url = backend + sub + req.nextUrl.search;
  const method = req.method;
  let body: ArrayBuffer | undefined;
  if (shouldForwardBody(method)) {
    const raw = await req.arrayBuffer();
    body = raw.byteLength > 0 ? raw : undefined;
  }

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!STRIP_REQUEST.has(k.toLowerCase())) headers.set(k, v);
  });
  if (!body) {
    headers.delete('content-length');
  }

  try {
    const res = await fetch(url, { method, headers, body, cache: 'no-store' });
    return new NextResponse(res.body, { status: res.status, headers: forwardProxyResponseHeaders(res) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'erro desconhecido';
    console.error(`[brmusics-api proxy] falha ao conectar: ${detail}`);
    return NextResponse.json(
      { message: 'Não foi possível conectar ao brmusics-api' },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };
const h = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path ?? []));
export const GET = h;
export const POST = h;
export const PUT = h;
export const PATCH = h;
export const DELETE = h;
