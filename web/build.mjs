// Bundles the game into a single script and writes two copies of it:
// - the Android app's assets folder (android/app/src/main/assets/www, committed), so the APK works offline;
// - web/dist, the iPhone/iPad web app published to GitHub Pages: the same files plus what only a browser
//   needs (AAC copies of the sound clips for Safari, home-screen icons, the manifest and a service worker).
import * as esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'android', 'app', 'src', 'main', 'assets', 'www');
const webDir = join(here, 'dist');
const args = new Set(process.argv.slice(2));

// The game compares its own version with the latest release to tell players about updates, so the web
// build and the APK must agree on it.
const version = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).version;
const gradle = readFileSync(join(here, '..', 'android', 'app', 'build.gradle.kts'), 'utf8');
const apkVersion = /versionName\s*=\s*"([^"]+)"/.exec(gradle)?.[1];
if (apkVersion !== version) {
  console.error(`Version mismatch: package.json says ${version}, android/app/build.gradle.kts says ${apkVersion}. Bump both.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(join(here, 'static', 'style.css'), join(outDir, 'style.css'));
// index.html: the APK's copy leaves out the web app's tags (between the web-app markers)
const indexHtml = readFileSync(join(here, 'static', 'index.html'), 'utf8');
writeFileSync(join(outDir, 'index.html'), indexHtml.replace(/[ \t]*<!-- web-app -->[\s\S]*?<!-- \/web-app -->\n/g, ''));
for (const f of ['icons', 'manifest.webmanifest', 'sw.js']) rmSync(join(outDir, f), { recursive: true, force: true });
// 3D street props (static/models/town, CC BY 4.0) and sprite-sheet effects (static/fx, CC0) from itch.io:
// each folder's CREDITS.txt says where they come from
for (const dir of ['models', 'fx']) {
  rmSync(join(outDir, dir), { recursive: true, force: true });
  cpSync(join(here, 'static', dir), join(outDir, dir), { recursive: true });
}
// Japanese: static/lang/ja/*.json merged into one dictionary (read only when Japanese is picked)
{
  const ja = {};
  const dir = join(here, 'static', 'lang', 'ja');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) Object.assign(ja, JSON.parse(readFileSync(join(dir, f), 'utf8')));
  rmSync(join(outDir, 'lang'), { recursive: true, force: true });
  mkdirSync(join(outDir, 'lang'), { recursive: true });
  writeFileSync(join(outDir, 'lang', 'ja.json'), JSON.stringify(ja));
  console.log(`lang: ${Object.keys(ja).length} Japanese strings`);
}

// Recorded sound effects (Kenney's CC0 packs): the folder is mirrored, and every clip src/audio/Samples.ts
// names must be there, so a renamed or missing file fails the build instead of going quiet in the game.
const sfxSrc = join(here, 'static', 'sfx'), sfxOut = join(outDir, 'sfx');
rmSync(sfxOut, { recursive: true, force: true });
mkdirSync(sfxOut, { recursive: true });
const sfxHave = new Set(readdirSync(sfxSrc));
// the APK plays the Ogg clips; the AAC copies are for Safari and go to the web app only
for (const f of sfxHave) if (!f.endsWith('.m4a')) copyFileSync(join(sfxSrc, f), join(sfxOut, f));
{
  const src = readFileSync(join(here, 'src', 'audio', 'Samples.ts'), 'utf8');
  const named = new Set();
  for (const [, base, n, from = '0', pad = '3'] of src.matchAll(/takes\('([^']+)', (\d+)(?:, (\d+))?(?:, (\d+))?\)/g))
    for (let i = 0; i < +n; i++) named.add(base + String(+from + i).padStart(+pad, '0'));
  for (const [, list] of src.matchAll(/files: \[((?:'[^']+',? ?)+)\]/g)) for (const [, f] of list.matchAll(/'([^']+)'/g)) named.add(f);
  const missing = [...named].flatMap(f => ['.ogg', '.m4a'].filter(x => !sfxHave.has(f + x)).map(x => f + x));
  if (missing.length) { console.error('Sound clips named in Samples.ts but missing from static/sfx: ' + missing.join(', ')); process.exit(1); }
  console.log(`sfx: ${(sfxHave.size - 1) / 2} clips (Ogg and AAC), ${named.size} named in Samples.ts`);
}

const options = {
  entryPoints: [join(here, 'src', 'main.ts')],
  bundle: true,
  format: 'iife',
  target: ['chrome90', 'safari15'],
  outfile: join(outDir, 'game.js'),
  minify: !args.has('--watch') && !args.has('--serve'),
  sourcemap: args.has('--watch') || args.has('--serve') ? 'inline' : false,
  legalComments: 'none',
  define: { __APP_VERSION__: JSON.stringify(version) },
  logLevel: 'info',
};

if (args.has('--watch') || args.has('--serve')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  if (args.has('--serve')) {
    const { port } = await ctx.serve({ servedir: outDir, port: 8080 });
    console.log(`Serving on http://localhost:${port}`);
  }
} else {
  await esbuild.build(options);
}
if (!args.has('--watch') && !args.has('--serve')) writeWebApp();

/** web/dist: the APK's files, the browser-only extras, and the service worker. */
function writeWebApp() {
  rmSync(webDir, { recursive: true, force: true });
  cpSync(outDir, webDir, { recursive: true });
  writeFileSync(join(webDir, 'index.html'), indexHtml.replace(/[ \t]*<!-- \/?web-app -->\n/g, ''));
  copyFileSync(join(here, 'static', 'manifest.webmanifest'), join(webDir, 'manifest.webmanifest'));
  cpSync(join(here, 'static', 'icons'), join(webDir, 'icons'), { recursive: true });
  for (const f of readdirSync(sfxSrc)) if (f.endsWith('.m4a')) copyFileSync(join(sfxSrc, f), join(webDir, 'sfx', f));
  writeFileSync(join(webDir, '.nojekyll'), '');
  writeServiceWorker();
}

/**
 * The web app's service worker (the same files are hosted on GitHub Pages for iPhone and iPad): it keeps
 * every file of this version on the device, so the game starts offline from the home screen. Its cache is
 * named after the version and the files' contents, so a new release replaces the old copy in one go.
 */
function writeServiceWorker() {
  const files = [];
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name), rel + e.name + '/');
      else if (e.name !== 'sw.js' && !e.name.startsWith('.')) files.push(rel + e.name);
    }
  };
  walk(webDir, '');
  files.sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update(readFileSync(join(webDir, f)));
  const cache = `cc-${version}-${hash.digest('hex').slice(0, 10)}`;
  const list = JSON.stringify(['./', ...files]);
  writeFileSync(join(webDir, 'sw.js'), `// Generated by build.mjs: offline copy of Cursed Chronicles ${version}.
const CACHE = '${cache}';
const FILES = ${list};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cc-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).catch(() => r.mode === 'navigate' ? c.match('./') : Response.error()))));
});
`);
  console.log(`sw.js: ${files.length} files cached as ${cache}`);
}
