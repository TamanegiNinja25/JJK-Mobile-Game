export const name = 'models';
export const about = 'your own 3D models: an FBX file through the on-demand FBX reader, and a GLB file';

import { readFileSync, readdirSync } from 'node:fs';

export async function run(t) {
  const fbx = [...readFileSync(new URL('../fixtures/triangle.fbx', import.meta.url))];
  const kitDir = new URL('../../../android/app/src/main/assets/www/models/town/', import.meta.url);
  const glbName = readdirSync(kitDir).find(f => f.endsWith('.glb'));
  const glb = [...readFileSync(new URL(glbName, kitDir))];
  const r = await t.eval(async ([fbx, glb, glbName]) => {
    const out = {};
    out.before = typeof window.__ccFBX;
    for (const [name, bytes] of [['triangle.fbx', fbx], [glbName, glb]]) {
      try {
        const data = new Uint8Array(bytes).buffer;
        const tpl = await window.__dbg.prepareModel([{ name, data }]);
        let meshes = 0;
        (tpl.root ?? tpl.scene ?? tpl).traverse?.(o => { if (o.isMesh) meshes++; });
        out[name.endsWith('.fbx') ? 'fbx' : 'glb'] = { ok: true, meshes, format: tpl.format ?? null };
      } catch (e) { out[name.endsWith('.fbx') ? 'fbx' : 'glb'] = { ok: false, err: String(e?.message ?? e) }; }
    }
    out.after = typeof window.__ccFBX;
    out.script = !!document.querySelector('script[src="fbx.js"]');
    return out;
  }, [fbx, glb, glbName]);
  t.check(r.before === 'undefined', 'the FBX reader was loaded before anyone picked an FBX file');
  t.check(r.fbx?.ok && r.fbx.meshes >= 1, `FBX model: ${JSON.stringify(r.fbx)}`);
  t.check(r.after === 'function' && r.script, 'the FBX reader (fbx.js) was not loaded on demand');
  t.check(r.glb?.ok && r.glb.meshes >= 1, `GLB model: ${JSON.stringify(r.glb)}`);
  t.note(`FBX ${r.fbx?.meshes} mesh, GLB ${r.glb?.meshes} meshes`);
}
