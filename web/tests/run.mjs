// End-to-end tests: plays the built game in headless Chromium and checks what a player would see.
//
//   npm run build && npm run test:e2e                 every suite against the APK's files
//   node tests/run.mjs smoke bosses                   only these suites
//   node tests/run.mjs --list                         the suites
//
// Each suite in tests/suites/ exports `name`, an optional `dir` ('www' for the APK's files, 'dist' for the
// web app) and `run(t)`. A suite fails if a check fails, it throws, or the page logs an uncaught error.
// WebGL runs on SwiftShader, so no GPU is needed.

import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { helpers } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DIRS = { www: join(here, '..', '..', 'android', 'app', 'src', 'main', 'assets', 'www'), dist: join(here, '..', 'dist') };
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.glb': 'model/gltf-binary', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

/** A static file server over one of the build outputs, on a free port. */
function serve(root) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

const args = process.argv.slice(2);
const files = (await readdir(join(here, 'suites'))).filter(f => f.endsWith('.mjs')).sort();
const suites = [];
for (const f of files) suites.push({ file: f, ...(await import(pathToFileURL(join(here, 'suites', f)).href)) });
if (args.includes('--list')) { for (const s of suites) console.log(`${s.name.padEnd(12)} ${s.about ?? ''}`); process.exit(0); }
const pick = args.filter(a => !a.startsWith('-'));
const todo = pick.length ? suites.filter(s => pick.includes(s.name)) : suites;
if (pick.length && todo.length !== pick.length) { console.error('Unknown suite in: ' + pick.join(' ')); process.exit(2); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const servers = {};
let failed = 0;
const t0 = Date.now();
for (const s of todo) {
  const root = DIRS[s.dir ?? 'www'];
  if (!existsSync(join(root, 'index.html'))) { console.log(`- ${s.name}: skipped (no build in ${root}; run npm run build)`); continue; }
  servers[root] ??= await serve(root);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, ...(s.context ?? {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const t = helpers(page, servers[root].url, ctx);
  const start = Date.now();
  try {
    await page.goto(servers[root].url + (s.query ?? ''));
    await page.waitForFunction(() => window.game && document.getElementById('boot') === null, null, { timeout: 60000 });
    await s.run(t);
  } catch (e) {
    t.fail('threw: ' + (e?.message ?? e).split('\n')[0]);
  }
  for (const e of errors) t.fail('page error: ' + e.split('\n')[0]);
  const secs = ((Date.now() - start) / 1000).toFixed(0);
  if (t.failures.length) {
    failed++;
    console.log(`✗ ${s.name} (${secs}s)`);
    for (const f of t.failures) console.log('    ' + f);
  } else console.log(`✓ ${s.name} (${secs}s)${t.notes.length ? '  ' + t.notes.join('; ') : ''}`);
  await ctx.close();
}
await browser.close();
for (const { server } of Object.values(servers)) server.close();
console.log(`\n${todo.length - failed}/${todo.length} suites passed in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
process.exit(failed ? 1 : 0);
