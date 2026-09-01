const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'host', 'transfer-encoding']);

/** Repassa headers do upstream; Set-Cookie exige getSetCookie() + append (fetch não expõe via forEach). */
export function forwardProxyResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === 'set-cookie') return;
    headers.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append('set-cookie', cookie);
  }
  return headers;
}
