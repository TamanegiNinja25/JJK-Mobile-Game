// A map of any area for the Map tab, without loading it: the terrain is painted from the area's own paint
// recipe, and the buildings, walls, water, landmarks and caches come from replaying its build script into a
// recorder (the same trick as the atlas). Doors, travel gates, NPCs and bosses come from the atlas, so the
// preview shows what the area holds right now for this save.

import type { PlayerState } from '../rpg/PlayerState';
import type { MapDef } from '../world/MapBuilder';
import { MAPS, TRAVEL_LIST } from '../world/maps';
import { getAtlas } from '../world/atlas';
import { SplatPainter } from '../render/textures';
import { getBuilding } from '../render/models/buildings';
import { CLASSES } from '../rpg/classes';
import { NPC_SHORT } from '../data/story';
import { ENEMIES } from '../rpg/enemies';

interface Layout {
  bg: HTMLCanvasElement;
  boxes: [number, number, number, number][];
  walls: [number, number, number, number][];
  water: [number, number, number, number][];
  landmarks: { x: number; z: number; name: string; flag: string }[];
  caches: { x: number; z: number; flag: string }[];
}

const cache = new Map<string, Layout>();

/** Ground colours from the area's paint recipe, at 2 px a metre. */
function paintGround(def: MapDef) {
  const [W, D] = def.size;
  const S = 2;
  const sp = new SplatPainter(W, D, 1);
  try { def.terrain.paint?.(sp as never); } catch { /* an area that can't paint keeps its base ground */ }
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W * S)); c.height = Math.max(1, Math.round(D * S));
  const x = c.getContext('2d')!;
  const palette = def.terrain.minimap ?? [[60, 90, 50], [130, 128, 120], [120, 100, 74], [70, 70, 78]];
  const img = x.createImageData(c.width, c.height);
  const k = def.night ? 0.65 : 1;
  for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
    const tx = Math.min(sp.size - 1, Math.floor(px / c.width * sp.size)), ty = Math.min(sp.size - 1, Math.floor(py / c.height * sp.size));
    const i = (ty * sp.size + tx) * 4;
    let r = 0, g = 0, b = 0;
    for (let ch = 0; ch < 4; ch++) { const w = sp.data[i + ch]; r += palette[ch][0] * w; g += palette[ch][1] * w; b += palette[ch][2] * w; }
    const o = (py * c.width + px) * 4;
    img.data[o] = r * k; img.data[o + 1] = g * k; img.data[o + 2] = b * k; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

function layout(id: string): Layout | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = MAPS[id];
  if (!def) return null;
  const out: Layout = { bg: paintGround(def), boxes: [], walls: [], water: [], landmarks: [], caches: [] };
  const calls: Record<string, (...a: any[]) => void> = {
    building: (name: string, x: number, z: number, q = 0, o = {}) => {
      try {
        const d = getBuilding(name, { night: def.night, ...o });
        for (const c of d.colliders) {
          const cx = q === 0 ? c.x : q === 1 ? c.z : q === 2 ? -c.x : -c.z;
          const cz = q === 0 ? c.z : q === 1 ? -c.x : q === 2 ? -c.z : c.x;
          out.boxes.push([x + cx, z + cz, q % 2 ? c.d : c.w, q % 2 ? c.w : c.d]);
        }
      } catch { /* an unknown building is left out */ }
    },
    wall: (_n: string, x0: number, z0: number, x1: number, z1: number) => out.walls.push([x0, z0, x1, z1]),
    water: (x: number, z: number, w: number, d: number) => out.water.push([x, z, w, d]),
    landmark: (l: { x: number; z: number; name: string }) => out.landmarks.push({ x: l.x, z: l.z, name: l.name, flag: `lm_${def.id}_${out.landmarks.length}` }),
    cache: (x: number, z: number) => out.caches.push({ x, z, flag: `cache_${def.id}_${out.caches.length}` }),
  };
  const stub: any = new Proxy({}, {
    get: (_t, k: string) => {
      if (k === 'def') return def;
      if (k === 'night') return def.night;
      const f = calls[k];
      return (...a: any[]) => { f?.(...a); return stub; };
    },
    set: () => true,
  });
  try { def.build(stub); } catch { /* a map that can't be replayed shows what was recorded */ }
  cache.set(id, out);
  return out;
}

/** How big text and markers are drawn on a map of this size (CSS pixels): full size on a tablet, smaller on a phone. */
export function mapTextScale(w: number, h: number) {
  return Math.max(0.75, Math.min(1, Math.min(w, h * 1.45) / 700));
}

/**
 * Draw area `id` into the canvas, in a `box` of CSS pixels (the caller has scaled the canvas to the
 * screen) with text and markers at scale `f`. `goal` marks where the tracked quest leads, if it is here.
 */
export function drawAreaPreview(c: HTMLCanvasElement, id: string, ps: PlayerState, goal: { x: number; z: number; label: string } | null, goalHere: boolean,
  box: { w: number; h: number } = { w: c.width, h: c.height }, f = 1) {
  const def = MAPS[id], L = layout(id);
  const x = c.getContext('2d')!;
  const cw = box.w, ch = box.h;
  x.fillStyle = '#0a0812'; x.fillRect(0, 0, cw, ch);
  if (!def || !L) return;
  const [W, D] = def.size;
  const top = Math.round(34 * f);
  const k = Math.min((cw - 20) / W, (ch - top - 10) / D);
  const ox = (cw - W * k) / 2, oy = top + (ch - top - 10 - D * k) / 2;
  const toM = (wx: number, wz: number): [number, number] => [ox + (wx + W / 2) * k, oy + (wz + D / 2) * k];
  x.drawImage(L.bg, ox, oy, W * k, D * k);
  x.fillStyle = 'rgba(20,16,30,0.85)';
  for (const [bx, bz, bw, bd] of L.boxes) { const [mx, my] = toM(bx - bw / 2, bz - bd / 2); x.fillRect(mx, my, bw * k, bd * k); }
  x.strokeStyle = 'rgba(20,16,30,0.9)'; x.lineWidth = Math.max(2, 0.5 * k);
  for (const [x0, z0, x1, z1] of L.walls) { const [a, b] = toM(x0, z0), [c2, d2] = toM(x1, z1); x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d2); x.stroke(); }
  x.fillStyle = 'rgba(60,140,220,0.9)';
  for (const [wx, wz, ww, wd] of L.water) { const [mx, my] = toM(wx - ww / 2, wz - wd / 2); x.fillRect(mx, my, ww * k, wd * k); }
  x.strokeStyle = 'rgba(200,180,255,0.5)'; x.lineWidth = 2; x.strokeRect(ox, oy, W * k, D * k);
  // labels stay inside the canvas: one that would fall off the bottom goes above its marker (`above`)
  const label = (t: string, mx: number, my: number, col: string, above?: number) => {
    x.font = `bold ${Math.round(12 * f)}px sans-serif`; x.textAlign = 'center';
    const hw = x.measureText(t).width / 2 + 3;
    if (above !== undefined && my > ch - 4) my = above;
    mx = Math.max(hw, Math.min(cw - hw, mx)); my = Math.max(top + 10 * f, Math.min(ch - 4, my));
    x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.85)'; x.strokeText(t, mx, my); x.fillStyle = col; x.fillText(t, mx, my);
  };
  const A = getAtlas()[id];
  const self = CLASSES[ps.d.cls]?.self;
  if (A) {
    for (const b of A.bosses) {
      // only the fights this save can still have: quest bosses while their quest is taken, and the rest
      const q = b.quest ? ps.questState(b.quest) : null;
      if (b.quest && (!q || q.state === 'done')) continue;
      if (b.cond && !b.cond(ps)) continue;
      const [mx, my] = toM(b.x, b.z);
      x.strokeStyle = 'rgba(255,60,80,0.6)'; x.lineWidth = 2; x.beginPath(); x.arc(mx, my, b.r * k, 0, Math.PI * 2); x.stroke();
      label('☠ ' + (ENEMIES[b.id]?.name ?? b.id), mx, my + 4, '#ff8a9a');
    }
    for (const n of A.npcs) {
      if (n.id === self || (n.cond && !n.cond(ps))) continue;
      const [mx, my] = toM(n.x, n.z);
      const mk = ps.turnInsFor(n.id).some(q => ps.questState(q.id)?.state === 'ready') ? '?' : ps.offersFor(n.id).length ? '!' : null;
      x.fillStyle = mk === '!' ? '#ffd23a' : mk === '?' ? '#7affb0' : '#e8e8ff';
      x.beginPath(); x.arc(mx, my, 4.5 * f, 0, Math.PI * 2); x.fill();
      if (mk || n.shop) label((NPC_SHORT[n.id] ?? n.id) + (mk ? ' ' + mk : ''), mx, my - 9 * f, x.fillStyle as string);
    }
    for (const po of A.portals) {
      const [mx, my] = toM(po.x, po.z);
      const r = 6 * f;
      if (po.style === 'door') { x.fillStyle = '#ffd890'; x.fillRect(mx - r, my - r, r * 2, r * 2); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.strokeRect(mx - r, my - r, r * 2, r * 2); label('▣ ' + po.label, mx, my + 20 * f, '#ffd890', my - 10 * f); }
      else if (po.style === 'travel') { x.strokeStyle = '#6adfff'; x.lineWidth = 3 * f; x.beginPath(); x.arc(mx, my, 8 * f, 0, Math.PI * 2); x.stroke(); label('⛩ Travel', mx, my + 22 * f, '#6adfff', my - 12 * f); }
      else if (po.style === 'road') { x.fillStyle = '#ffe08a'; x.beginPath(); x.arc(mx, my, 7 * f, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.stroke(); label('➜ ' + po.label, mx, my + 20 * f, '#ffe08a', my - 11 * f); }
      else { x.fillStyle = '#b08aff'; x.beginPath(); x.arc(mx, my, r, 0, Math.PI * 2); x.fill(); label(po.label, mx, my + 20 * f, '#c8b0ff', my - 10 * f); }
    }
  }
  const flags = ps.d.flags;
  for (const lm of L.landmarks) { const [mx, my] = toM(lm.x, lm.z); label(flags[lm.flag] ? '★ ' + lm.name : '?', mx, my + 4, flags[lm.flag] ? '#ffe08a' : 'rgba(255,224,138,0.55)'); }
  if (goal) {
    const [mx, my] = toM(goal.x, goal.z);
    const r = 7 * f;
    x.save(); x.translate(mx, my); x.rotate(Math.PI / 4); x.fillStyle = '#ffd23a'; x.strokeStyle = '#000'; x.lineWidth = 2; x.fillRect(-r, -r, r * 2, r * 2); x.strokeRect(-r, -r, r * 2, r * 2); x.restore();
    label('◆ ' + goal.label, mx, my - 13 * f, '#ffd23a');
  }
  // the header: name, level, and what's been found
  const base = Math.round(22 * f);
  x.textAlign = 'left'; x.font = `bold ${Math.round(16 * f)}px serif`; x.fillStyle = '#fff';
  x.fillText(def.name, 12, base);
  const nameW = x.measureText(def.name).width;
  x.font = `${Math.round(12 * f)}px sans-serif`; x.fillStyle = 'rgba(220,210,255,0.75)';
  // the same level text as the Areas list
  const lv = TRAVEL_LIST.find(t => t.id === id)?.level ?? `Lv ${def.levelRange?.[0] ?? '?'}–${def.levelRange?.[1] ?? '?'}`;
  x.fillText(`${def.jp} · ${lv}${goalHere ? (f < 1 ? '  ◆' : '  ◆ your quest leads here') : ''}`, 20 + nameW, base);
  if (L.landmarks.length || L.caches.length) {
    const fl = L.landmarks.filter(l => flags[l.flag]).length, fc = L.caches.filter(cc => flags[cc.flag]).length;
    x.textAlign = 'right'; x.fillStyle = '#ffe08a';
    x.fillText(`★ ${fl}/${L.landmarks.length}  ▤ ${fc}/${L.caches.length}`, cw - 12, base);
  }
}
