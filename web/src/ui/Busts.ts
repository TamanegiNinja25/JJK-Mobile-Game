// Standing character art for visual-novel dialogue, rendered from the 3D models: a three-quarter bust
// with a clean ink outline, in a handful of expressions, each with the mouth shut and open for talking.
import * as THREE from 'three';
import { Renderer } from '../render/Renderer';
import { buildCharacter } from '../render/models/characters';
import { buildCreature, CreatureKind } from '../render/models/creatures';
import { wrapHumanoid, ModelHandle } from '../render/models/model';
import { withCustomModel, customModels } from '../render/models/imported';
import { occlusion, outlineMaterial } from '../render/toon';
import { CREATURE_IDS } from './Portraits';
import { media } from '../core/CustomMedia';

export type Mood = 'neutral' | 'happy' | 'angry' | 'surprised' | 'sad';

const W = 300, H = 400;
/** ids with nobody to draw */
const NO_ART = new Set(['narrator', 'board']);

/** Face bone poses per mood: [eye height, brow lift, brow tilt (+ = inner end down), mouth width, mouth height]. */
const FACE: Record<Mood, [number, number, number, number, number]> = {
  neutral: [1, 0, 0.12, 1, 1],
  happy: [0.14, 0.012, 0.02, 1.3, 1.6],
  angry: [0.78, -0.012, 0.42, 1.1, 1],
  surprised: [1.18, 0.024, -0.06, 0.6, 2.6],
  sad: [0.8, 0.008, -0.32, 0.85, 1],
};

export class Busts {
  private cache = new Map<string, [HTMLCanvasElement, HTMLCanvasElement]>();
  private modelsSeen = 0;
  private rt: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(20, W / H, 0.1, 40);
  private px = new Uint8Array(W * H * 4);

  constructor(private r: Renderer) {
    this.rt = new THREE.WebGLRenderTarget(W, H);
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    const key = new THREE.DirectionalLight(0xfff2e4, 2.7);
    key.position.set(-1.8, 2.6, 3);
    const rim = new THREE.DirectionalLight(0xa8c4ff, 1.9);
    rim.position.set(2.4, 1.6, -2.2);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x3a3448, 1.35));
  }

  has(id: string) { return !NO_ART.has(id); }
  private urls = new Map<string, string>();
  /** The neutral art as an image URL, for menus (the status page, the sorcerer select). */
  url(id: string): string {
    const own = media.images.get(id);
    if (own) return own;
    let u = this.urls.get(id);
    if (!u) { const a = this.get(id); u = a ? a[0].toDataURL() : ''; if (u) this.urls.set(id, u); }
    return u;
  }

  /** A picture the player chose (shown as is, never mirrored). */
  isOwn(id: string) { return media.images.has(id); }

  /** [mouth shut, mouth open] art for a character in a mood. Rendered on first use and kept for a while. */
  get(id: string, mood: Mood = 'neutral'): [HTMLCanvasElement, HTMLCanvasElement] | null {
    if (NO_ART.has(id)) return null;
    const own = this.ownArt(id);
    if (own) return own;
    if (this.modelsSeen !== customModels.version) { this.modelsSeen = customModels.version; this.cache.clear(); }
    const key = id + '|' + mood;
    const hit = this.cache.get(key);
    if (hit) { this.cache.delete(key); this.cache.set(key, hit); return hit; }
    let model: ModelHandle;
    try {
      model = withCustomModel(id, CREATURE_IDS.has(id) ? buildCreature(id as CreatureKind) : wrapHumanoid(buildCharacter(id === 'civilian' ? 'civilianA' : id === 'student' ? 'student' : id)));
    } catch {
      return null;
    }
    const creature = CREATURE_IDS.has(id);
    const pair: [HTMLCanvasElement, HTMLCanvasElement] = [this.render(model, mood, false, creature), this.render(model, mood, true, creature)];
    this.scene.remove(model.root);
    model.root.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.shared) m.geometry.dispose(); });
    this.cache.set(key, pair);
    // about a dozen expressions stay ready; older ones are dropped (each is two 300x400 images)
    while (this.cache.size > 12) this.cache.delete(this.cache.keys().next().value!);
    return pair;
  }

  private ownImgs = new Map<string, { url: string; img: HTMLImageElement; art?: [HTMLCanvasElement, HTMLCanvasElement] }>();

  /** The player's own picture for a character, framed as a card (it has no mouth to move). */
  private ownArt(id: string): [HTMLCanvasElement, HTMLCanvasElement] | null {
    const url = media.images.get(id);
    if (!url) return null;
    let e = this.ownImgs.get(id);
    if (!e || e.url !== url) { const img = new Image(); img.src = url; e = { url, img }; this.ownImgs.set(id, e); }
    if (e.art) return e.art;
    if (!e.img.complete || !e.img.naturalWidth) return null;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d')!;
    const m = 14, r = 18, w = W - m * 2, h = H - m * 2 - 30;
    x.save();
    x.beginPath();
    x.moveTo(m + r, m); x.arcTo(m + w, m, m + w, m + h, r); x.arcTo(m + w, m + h, m, m + h, r); x.arcTo(m, m + h, m, m, r); x.arcTo(m, m, m + w, m, r);
    x.closePath();
    x.clip();
    const k = Math.max(w / e.img.naturalWidth, h / e.img.naturalHeight);
    const dw = e.img.naturalWidth * k, dh = e.img.naturalHeight * k;
    x.drawImage(e.img, m + (w - dw) / 2, m + (h - dh) * 0.3, dw, dh);
    x.restore();
    x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.85)';
    x.beginPath();
    x.moveTo(m + r, m); x.arcTo(m + w, m, m + w, m + h, r); x.arcTo(m + w, m + h, m, m + h, r); x.arcTo(m, m + h, m, m, r); x.arcTo(m, m, m + w, m, r);
    x.closePath();
    x.stroke();
    e.art = [c, c];
    return e.art;
  }

  private render(model: ModelHandle, mood: Mood, open: boolean, creature: boolean): HTMLCanvasElement {
    model.update(0.016);
    const b = model.rig.bones;
    const f = FACE[mood];
    for (const s of ['L', 'R'] as const) {
      const sx = s === 'L' ? 1 : -1;
      b['eye' + s]?.scale.set(1, f[0], 1);
      const brow = b['brow' + s];
      if (brow) { brow.position.y = model.rig.rest['brow' + s].pos.y + f[1]; brow.rotation.z = sx * f[2]; }
    }
    // mouth: the open frame drops the jaw a little further for each mood
    b.mouth?.scale.set(f[3] * (open ? 0.85 : 1), f[4] * (open ? 3.1 : 1), 1);
    const root = model.root;
    root.rotation.y = -0.42; // three-quarter view, looking toward screen left
    // the in-game ink hull is sized for a figure across the street; up close it swallows noses and
    // eyelids, so the art uses a fine line and the silhouette gets its own outline below
    const hull = model.rig.outline;
    const hullMat = hull?.material;
    if (hull) hull.material = outlineMaterial(0.0035);
    this.scene.add(root);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const h = box.max.y - Math.max(0, box.min.y);
    const top = box.max.y + h * 0.07;
    // humanoids from the waist up; curses come in all shapes, so show more of them
    const span = h * (creature ? 0.7 : 0.62);
    const cy = top - span / 2;
    const dist = (span / 2) / Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2)) * 1.04;
    this.cam.position.set(-0.08 * dist, cy + span * 0.04, dist);
    this.cam.lookAt(0, cy, 0);
    const gl = this.r.gl;
    const prevTarget = gl.getRenderTarget();
    const prevClear = gl.getClearColor(new THREE.Color());
    const prevAlpha = gl.getClearAlpha();
    const occ = occlusion.uOccOn.value;
    occlusion.uOccOn.value = 0;
    gl.setRenderTarget(this.rt);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(this.scene, this.cam);
    occlusion.uOccOn.value = occ;
    gl.readRenderTargetPixels(this.rt, 0, 0, W, H, this.px);
    gl.setRenderTarget(prevTarget);
    gl.setClearColor(prevClear, prevAlpha);
    this.scene.remove(root);
    if (hull && hullMat) hull.material = hullMat;

    // flip into a canvas, then ink a soft outline around the silhouette and fade the cut-off at the bottom
    const img = new ImageData(W, H);
    for (let row = 0; row < H; row++) img.data.set(this.px.subarray((H - 1 - row) * W * 4, (H - row) * W * 4), row * W * 4);
    const raw = document.createElement('canvas');
    raw.width = W; raw.height = H;
    raw.getContext('2d')!.putImageData(img, 0, 0);
    const ink = document.createElement('canvas');
    ink.width = W; ink.height = H;
    const ix = ink.getContext('2d')!;
    ix.drawImage(raw, 0, 0);
    ix.globalCompositeOperation = 'source-in';
    ix.fillStyle = '#0c0a14';
    ix.fillRect(0, 0, W, H);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d')!;
    for (let a = 0; a < 8; a++) x.drawImage(ink, Math.round(Math.cos(a * Math.PI / 4) * 2.5), Math.round(Math.sin(a * Math.PI / 4) * 2.5));
    x.drawImage(raw, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    const g = x.createLinearGradient(0, H * 0.8, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = g;
    x.fillRect(0, H * 0.8, W, H * 0.2);
    return c;
  }
}
