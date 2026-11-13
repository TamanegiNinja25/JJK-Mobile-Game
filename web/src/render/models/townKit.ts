// Street props from "PSX Japanese Town Kit Free" by heyheythere (https://heyheythere.itch.io/psx-japanese-town-kit-free,
// CC BY 4.0): utility poles with their overhead wires, a drinks vending machine, a curve mirror, a post box,
// a can bin and concrete block walls, the everyday clutter of a Japanese back street. They ship in
// www/models/town as small GLB files sharing one texture atlas, are read once at start-up, merged into one
// geometry each and handed to the prop library, so maps place them like any other prop. If they can't be
// read, the game's own procedural versions stay.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { G, PartBag } from '../geo';
import { PropDef, setPropBuilder } from './props';

const BASE = 'models/town/';
/** the atlas is the kit's 2048 x 2048 one cut to its used top 256 rows: v coordinates scale by 8 */
const V_SCALE = 2048 / 256;
/** a 1 x 1 PNG handed to the loader instead of the atlas the files name, so it isn't read nine times */
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface Piece { file: string; def: Omit<PropDef, 'geo'> }
const PIECES: Record<string, Piece> = {
  utilityPole: { file: 'utility_pole', def: { collide: { r: 0.2 }, outline: 0.012, shadow: true } },
  poleWires: { file: 'wires', def: { outline: false, shadow: false } },
  postBox: { file: 'post_box', def: { collide: { r: 0.28 }, outline: 0.012, shadow: true } },
  vendingWhite: { file: 'vending_drinks', def: { collide: { box: [1.0, 0.8] }, outline: 0.012, shadow: true, light: { y: 1.3, color: 0xcfe8ff, intensity: 2, range: 4 } } },
  curveMirror: { file: 'curve_mirror', def: { collide: { r: 0.12 }, outline: 0.01, shadow: true } },
  canBin: { file: 'can_bin', def: { collide: { r: 0.3 }, outline: 0.012, shadow: true } },
  blockWall: { file: 'wall_block', def: { collide: { box: [2, 0.24] }, outline: 0.012, shadow: true } },
  blockWallPost: { file: 'wall_block_post', def: { collide: { r: 0.14 }, outline: 0.012, shadow: true } },
  gatepost: { file: 'gatepost', def: { collide: { r: 0.24 }, outline: 0.012, shadow: true } },
};

// Stand-ins for the pieces the game had no prop for, used only if the kit can't be read.
setPropBuilder('curveMirror', () => {
  const b = new PartBag();
  b.add(G.cyl(0.04, 0.04, 2.8, 6), 0xc8c8c4, { pos: [0, 1.4, 0] });
  b.add(G.cyl(0.4, 0.4, 0.06, 14), 0xe8742a, { pos: [0, 2.85, 0.08], rot: [Math.PI / 2, 0, 0] });
  return { geo: b.build(), collide: { r: 0.12 }, outline: 0.01, shadow: true };
});
setPropBuilder('canBin', () => {
  const b = new PartBag();
  b.add(G.box(0.5, 0.85, 0.4), 0x3a6ab8, { pos: [0, 0.425, 0] });
  return { geo: b.build(), collide: { r: 0.3 }, outline: 0.012, shadow: true };
});
// (wires are only strung between kit poles; this is never placed, but keeps the name valid)
setPropBuilder('poleWires', () => { const b = new PartBag(); b.add(G.box(0.01, 0.01, 0.01), 0x222222, { pos: [0, 7, 0] }); return { geo: b.build(), outline: false, shadow: false }; });
for (const [name, h, w] of [['blockWall', 1.55, 2], ['blockWallPost', 1.56, 0.24], ['gatepost', 1.78, 0.44]] as const) {
  setPropBuilder(name, () => {
    const b = new PartBag();
    b.add(G.box(w, h, name === 'blockWall' ? 0.2 : w), 0xa8a49a, { pos: [0, h / 2, 0], topColor: 0xbcb8ae });
    return { geo: b.build(), collide: name === 'blockWall' ? { box: [2, 0.24] } : { r: w / 2 + 0.02 }, outline: 0.012, shadow: true };
  });
}

let loaded = false;
/** True once the kit's models have replaced the procedural ones. */
export function hasTownKit() { return loaded; }

let pending: Promise<void> | null = null;
/** Reads the kit (once). Resolves either way; on failure the procedural props stay. */
export function loadTownKit(): Promise<void> {
  pending ??= (async () => {
    try {
      const atlas = await new THREE.TextureLoader().loadAsync(BASE + 'atlas.png');
      atlas.colorSpace = THREE.SRGBColorSpace;
      atlas.flipY = false;
      // the kit's crisp texels; no mipmaps, which would bleed neighbouring atlas tiles into each other
      atlas.magFilter = THREE.NearestFilter;
      atlas.minFilter = THREE.LinearFilter;
      atlas.generateMipmaps = false;
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((u) => (/atlas\.png$/i.test(u) ? BLANK : u));
      const loader = new GLTFLoader(manager);
      const geos = await Promise.all(Object.values(PIECES).map(p => loader.loadAsync(BASE + p.file + '.glb').then(g => pieceGeometry(g.scene))));
      Object.entries(PIECES).forEach(([name, p], i) => {
        const geo = geos[i];
        setPropBuilder(name, () => ({ ...p.def, geo, map: atlas }));
      });
      loaded = true;
    } catch (e) {
      console.warn('Town kit not loaded, keeping the procedural street props', e);
    }
  })();
  return pending;
}

/** One geometry from a piece's meshes, in the layout the prop library uses. */
function pieceGeometry(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const parts: THREE.BufferGeometry[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const src = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    src.applyMatrix4(m.matrixWorld);
    const n = src.getAttribute('position').count;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', src.getAttribute('position'));
    g.setAttribute('normal', src.getAttribute('normal') ?? (src.computeVertexNormals(), src.getAttribute('normal')));
    const uv = src.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const uvs = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { uvs[i * 2] = uv ? uv.getX(i) : 0; uvs[i * 2 + 1] = uv ? uv.getY(i) * V_SCALE : 0; }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    // baked shading in the vertex colours (any width or encoding), as plain RGB
    const c = src.getAttribute('color') as THREE.BufferAttribute | undefined;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c ? c.getX(i) : 1; col[i * 3 + 1] = c ? c.getY(i) : 1; col[i * 3 + 2] = c ? c.getZ(i) : 1; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g);
  });
  const geo = mergeGeometries(parts) ?? new THREE.BufferGeometry();
  const n = geo.getAttribute('position').count;
  geo.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('snormal', smoothNormals(geo));
  geo.computeBoundingSphere();
  return geo;
}

/** Normals averaged over every corner at the same spot, so the ink outline runs unbroken round flat faces. */
function smoothNormals(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute, nor = geo.getAttribute('normal') as THREE.BufferAttribute;
  const key = (i: number) => `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`;
  const sum = new Map<string, THREE.Vector3>();
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    let v = sum.get(k);
    if (!v) { v = new THREE.Vector3(); sum.set(k, v); }
    v.x += nor.getX(i); v.y += nor.getY(i); v.z += nor.getZ(i);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = sum.get(key(i))!.clone().normalize();
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  return new THREE.BufferAttribute(out, 3);
}
