// Bundles the game into a single script and copies static files into the
// Android app's assets folder, so the APK works fully offline.
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'android', 'app', 'src', 'main', 'assets', 'www');
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
for (const f of ['index.html', 'style.css']) copyFileSync(join(here, 'static', f), join(outDir, f));

// Recorded sound effects (Kenney's CC0 packs): the folder is mirrored, and every clip src/audio/Samples.ts
// names must be there, so a renamed or missing file fails the build instead of going quiet in the game.
const sfxSrc = join(here, 'static', 'sfx'), sfxOut = join(outDir, 'sfx');
rmSync(sfxOut, { recursive: true, force: true });
mkdirSync(sfxOut, { recursive: true });
const sfxHave = new Set(readdirSync(sfxSrc));
for (const f of sfxHave) copyFileSync(join(sfxSrc, f), join(sfxOut, f));
{
  const src = readFileSync(join(here, 'src', 'audio', 'Samples.ts'), 'utf8');
  const named = new Set();
  for (const [, base, n, from = '0', pad = '3'] of src.matchAll(/takes\('([^']+)', (\d+)(?:, (\d+))?(?:, (\d+))?\)/g))
    for (let i = 0; i < +n; i++) named.add(base + String(+from + i).padStart(+pad, '0'));
  for (const [, list] of src.matchAll(/files: \[((?:'[^']+',? ?)+)\]/g)) for (const [, f] of list.matchAll(/'([^']+)'/g)) named.add(f);
  const missing = [...named].filter(f => !sfxHave.has(f + '.ogg'));
  if (missing.length) { console.error('Sound clips named in Samples.ts but missing from static/sfx: ' + missing.join(', ')); process.exit(1); }
  console.log(`sfx: ${sfxHave.size - 1} clips, ${named.size} named in Samples.ts`);
}

const options = {
  entryPoints: [join(here, 'src', 'main.ts')],
  bundle: true,
  format: 'iife',
  target: ['chrome90'],
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
