/* BRMusic PWA — cacheia somente estáticos. APIs autenticadas passam direto na rede. */
const CACHE_VERSION = 'brmusic-static-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
];

function mesmoOrigem(url) {
  return url.origin === self.location.origin;
}

function ehRequisicaoSensivel(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.get('RSC') === '1') return true;
  if (request.headers.has('Next-Router-State-Tree')) return true;
  if (url.searchParams.has('_rsc')) return true;
  if (url.pathname.startsWith('/projetoA-api')) return true;
  if (url.pathname.startsWith('/auth')) return true;
  if (url.pathname.startsWith('/_next/data')) return true;
  if (url.pathname.startsWith('/_next/image')) return true;
  return false;
}

function ehEstaticoCacheavel(url) {
  if (!mesmoOrigem(url)) return false;
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (url.pathname === '/apple-touch-icon.png') return true;
  if (url.pathname === '/favicon.ico') return true;
  if (url.pathname === '/manifest.webmanifest') return true;
  if (url.pathname === OFFLINE_URL) return true;
  if (url.pathname.startsWith('/pdfjs/')) return true;
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const chaves = await caches.keys();
      await Promise.all(chaves.filter((chave) => chave !== CACHE_VERSION).map((chave) => caches.delete(chave)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (!mesmoOrigem(url)) return;
  if (ehRequisicaoSensivel(request, url)) return;

  const navegacao = request.mode === 'navigate' || request.destination === 'document';
  if (navegacao) {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }),
    );
    return;
  }

  if (!ehEstaticoCacheavel(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const copia = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
        return response;
      });
    }),
  );
});
