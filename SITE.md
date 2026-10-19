# datarooms.commonground.ventures

Public index of Common Ground data rooms. Pure static: index.html, two stylesheets, robots.txt, sitemap.xml (in public/).
Live today on Vercel project cgdr-index (team jesse-fowlers-projects), CLI-deployed, settings cleanUrls + trailingSlash (vercel.json).
First commit on main = the exact files served live on 2026-10-19 (sha1 of all 5 served files matched live).
Upstream copy: the data room kit (rooms/_index). Migration pilot for the move to Cloudflare Workers; see BUILD-PLAN-2026-10-19.

## How it builds and deploys (Cloudflare, after the pilot merges)
- Cloudflare Worker cg-datarooms-index with static assets from public/ (wrangler.jsonc). No build step.
- worker/index.js runs first and copies Vercel's URL rules exactly: 308 to drop index and .html, a trailing slash on every extensionless path, none on files, query strings kept, Cache-Control public max-age=0 must-revalidate, plain-text 404.
- Workers Builds, connected to this repo: a push to main deploys production (`npx wrangler deploy`); any other branch builds a preview (`npx wrangler preview`, which needs `"previews": {}` in wrangler.jsonc) and Cloudflare posts its preview URL on the PR. These are the commands set in the Worker's build settings on 10/19. No manual deploys from a laptop.
- Parity proof before any cutover: python3 tools/http_parity.py <live> <preview> parity-paths.txt must print every path identical (tools/http_parity.py). Full output is kept in receipts/.
- After cutover: rerun the same check against the custom domain (https://datarooms.commonground.ventures, now served by the Worker) vs the workers.dev production URL, and save it in receipts/.

## Local
npm install, then npm run dev (http://localhost:8787).

## Review
Changes go through a pull request and stay open until Robbie (robbyproc87) has reviewed any infrastructure change (Worker code, wrangler.jsonc, build settings, DNS, routes). Codex reviews as well.
