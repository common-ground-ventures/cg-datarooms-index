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
function canonical(pathname) {
  let p = pathname.replace(/\/{2,}/g, '/');
  if (p.startsWith('/.well-known/')) return p === pathname ? null : p;
  // cleanUrls: drop "index" and ".html"
  p = p.replace(/\/index(\.html)?\/?$/i, '/');
  p = p.replace(/\.html\/?$/i, '/');
  const last = p.slice(p.lastIndexOf('/') + 1);
  if (p !== '/' && p.endsWith('/')) {
    const seg = p.slice(0, -1).slice(p.slice(0, -1).lastIndexOf('/') + 1);
    if (seg.includes('.')) p = p.slice(0, -1); // a file never keeps a trailing slash
  } else if (last && !last.includes('.')) {
    p += '/'; // trailingSlash: every extensionless path gets one
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
