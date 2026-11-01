// Bundles the game into a single script and copies static files into the
// Android app's assets folder, so the APK works fully offline.
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
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
