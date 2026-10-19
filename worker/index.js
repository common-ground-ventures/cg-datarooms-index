// Serves the static files with Vercel's cleanUrls + trailingSlash rules, so every
// URL answers exactly as it did on Vercel (measured live 2026-10-19, parity-paths.txt).
// Runs before the asset lookup; anything it does not redirect goes to env.ASSETS.

const CACHE = 'public, max-age=0, must-revalidate';

function redirect(url, pathname) {
  return new Response(`Redirecting to ${pathname}${url.search}`, {
    status: 308,
    headers: {
      Location: pathname + url.search,
      'Content-Type': 'text/plain',
      'Cache-Control': CACHE,
    },
  });
}

// Vercel's canonical form for a path, or null when it is already canonical.
// Rules measured against the live site 2026-10-19 (and Vercel's routing-utils):
// a cleanUrls redirect (drop index or .html) is final; a trailing slash comes off
// only when the last segment ends in a .word extension; one is added only when the
// last segment has no dot; /.well-known/ skips the slash rules but not cleanUrls.
function canonical(pathname) {
  let p = pathname.replace(/\/{2,}/g, '/');
  const clean = p.replace(/\/index(\.html)?\/?$/i, '/').replace(/\.html\/?$/i, '/');
  if (clean !== p) return clean;
  if (!p.startsWith('/.well-known/')) {
    const seg = (p.endsWith('/') ? p.slice(0, -1) : p).split('/').pop();
    if (p !== '/' && p.endsWith('/') && /\.\w+$/.test(seg)) p = p.slice(0, -1);
    else if (!p.endsWith('/') && seg && !seg.includes('.')) p += '/';
  }
  return p === pathname ? null : p;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = canonical(url.pathname);
    if (target) return redirect(url, target);

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', CACHE);
    out.headers.set('Access-Control-Allow-Origin', '*');
    if (res.status === 404) {
      return new Response('The page could not be found\n\nNOT_FOUND\n', {
        status: 404,
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': CACHE },
      });
    }
    return out;
  },
};
