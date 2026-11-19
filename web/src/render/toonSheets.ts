// Toon versions of the sprite-sheet effects, drawn in code to match the game's cel-shaded look: flat colour
// bands with a dark ink outline. They replace the pixel-art sheets (PVFX Foundry) unless the player picks
// "Pixel" under Settings → Effects. Every sheet is 8 frames of 128 x 128 in one row.

import * as THREE from 'three';
import type { FxSheet, FxSheetName } from './fxSheets';

const N = 8, S = 128;
const INK = '#140a1c';

export const TOON_SHEETS: Record<FxSheetName, FxSheet> = {
  hitSpark: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [40, 40, 45, 50, 55, 60, 60, 60] },
  critHit: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [35, 40, 45, 55, 60, 65, 70, 70] },
  groundSlam: { w: S, h: S, cols: N, rows: 1, px: 64, py: 96, ms: [50, 55, 60, 70, 80, 90, 100, 110] },
  shockRing: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [45, 50, 55, 60, 65, 70, 75, 80] },
  curseSkull: { w: S, h: S, cols: N, rows: 1, px: 64, py: 104, ms: [70, 80, 90, 100, 110, 120, 130, 140] },
  voidImplode: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [60, 70, 80, 90, 90, 90, 100, 120] },
  cursedBloom: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [50, 55, 60, 70, 80, 90, 100, 110] },
  staticBurst: { w: S, h: S, cols: N, rows: 1, px: 64, py: 64, ms: [40, 45, 50, 55, 60, 65, 70, 75] },
};

type Draw = (x: CanvasRenderingContext2D, k: number, i: number) => void;

function star(x: CanvasRenderingContext2D, n: number, r0: number, r1: number, rot: number, fill: string, ink = 5) {
  x.beginPath();
  for (let j = 0; j < n * 2; j++) {
    const r = j % 2 ? r0 : r1, a = rot + (j / (n * 2)) * Math.PI * 2;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  x.lineWidth = ink; x.strokeStyle = INK; x.stroke();
  x.fillStyle = fill; x.fill();
}

function blob(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, shade: string) {
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
  x.fillStyle = fill; x.fill();
  // the cel shadow: a flat darker crescent along the bottom
  x.save(); x.clip();
  x.beginPath(); x.arc(cx + r * 0.25, cy + r * 0.35, r, 0, Math.PI * 2); x.fillStyle = shade; x.fill();
  x.restore();
}

const DRAW: Record<FxSheetName, Draw> = {
  hitSpark: (x, k) => {
    const g = k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75;
    star(x, 4, 8 + g * 6, 18 + g * 34, 0.4 + k * 0.6, k < 0.4 ? '#ffffff' : '#fff2a0', 4);
    star(x, 4, 4, 6 + g * 16, 1.2 + k, '#ffffff', 2);
  },
  critHit: (x, k) => {
    const g = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
    star(x, 7, 14 + g * 10, 26 + g * 34, k * 0.5, '#ff6a2a', 5);
    star(x, 7, 8 + g * 6, 16 + g * 22, 0.2 + k * 0.5, '#ffd84a', 4);
    star(x, 5, 4, 6 + g * 12, k, '#ffffff', 3);
    x.strokeStyle = '#ffffff'; x.lineWidth = 3;
    for (let j = 0; j < 8; j++) { const a = j * 0.785 + 0.2, r = 30 + k * 30; x.beginPath(); x.moveTo(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(Math.cos(a) * (r + 12 * g), Math.sin(a) * (r + 12 * g)); x.stroke(); }
  },
  groundSlam: (x, k, i) => {
    const spread = 14 + k * 46, rise = k * 26, r = 9 + (1 - Math.abs(k - 0.4)) * 10;
    for (let j = -3; j <= 3; j++) {
      const sx = (j / 3) * spread, sy = 30 - rise * (1 - Math.abs(j) / 4) - ((i + j) % 2) * 4;
      blob(x, sx, sy, r * (1 - Math.abs(j) * 0.12) * (1 - k * 0.5), '#e8dcc8', '#b8a48a');
    }
    if (k < 0.35) { x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.beginPath(); x.ellipse(0, 34, spread * 1.2, 8, 0, 0, Math.PI * 2); x.stroke(); }
  },
  shockRing: (x, k) => {
    const r = 10 + k * 52;
    x.lineWidth = 12 * (1 - k) + 2; x.strokeStyle = INK; x.beginPath(); x.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 8 * (1 - k) + 1; x.strokeStyle = '#c8e8ff'; x.stroke();
  },
  curseSkull: (x, k) => {
    const up = k * 50, r = 14 + k * 10;
    for (let j = 0; j < 5; j++) {
      const a = j * 1.26 + k * 2, d = 10 + k * 22;
      blob(x, Math.cos(a) * d, 20 - up * 0.6 + Math.sin(a) * d * 0.4, r * (1 - k * 0.7), '#9a5ac8', '#5a2a8a');
    }
    if (k < 0.7) {
      // the skull: a pale dome with dark eye holes, rising out of the smoke
      const sy = -up, sr = 16 * (1 - k * 0.4);
      blob(x, 0, sy, sr, '#f0e0ff', '#c8a8e8');
      x.fillStyle = INK;
      for (const ex of [-6, 6]) { x.beginPath(); x.ellipse(ex * (sr / 16), sy - 1, 4 * (sr / 16), 5 * (sr / 16), 0, 0, Math.PI * 2); x.fill(); }
      x.fillRect(-5 * (sr / 16), sy + 7 * (sr / 16), 10 * (sr / 16), 3);
    }
  },
  voidImplode: (x, k) => {
    const r = k < 0.5 ? 10 + k * 70 : 45 * (1 - (k - 0.5) * 1.8);
    if (r <= 1) return;
    x.save();
    x.rotate(k * 4);
    for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(0, 0, r + 10, j * 1.57, j * 1.57 + 0.9); x.lineWidth = 8; x.strokeStyle = '#a04aff'; x.stroke(); }
    x.restore();
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fillStyle = '#0a0410'; x.fill();
    x.lineWidth = 5; x.strokeStyle = '#c08aff'; x.stroke();
  },
  cursedBloom: (x, k) => {
    const r = 12 + k * 46, petal = 14 * (1 - k * 0.6) + 4;
    for (let j = 0; j < 8; j++) {
      const a = j * 0.785 + k;
      x.save(); x.translate(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); x.rotate(a);
      x.beginPath(); x.ellipse(0, 0, petal * 1.6, petal * 0.7, 0, 0, Math.PI * 2);
      x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); x.fillStyle = j % 2 ? '#ff7ad8' : '#c86aff'; x.fill();
      x.restore();
    }
    if (k < 0.5) blob(x, 0, 0, 10 * (1 - k), '#ffffff', '#f0d0ff');
  },
  staticBurst: (x, k, i) => {
    x.lineCap = 'round';
    for (let j = 0; j < 6; j++) {
      let a = j * 1.05 + i * 0.3, px = 0, py = 0;
      x.beginPath(); x.moveTo(0, 0);
      for (let s = 0; s < 4; s++) { a += (s % 2 ? 0.5 : -0.5); px += Math.cos(a) * (10 + k * 8); py += Math.sin(a) * (10 + k * 8); x.lineTo(px, py); }
      x.lineWidth = 8 * (1 - k) + 2; x.strokeStyle = INK; x.stroke();
      x.lineWidth = 4 * (1 - k) + 1; x.strokeStyle = '#bfefff'; x.stroke();
    }
  },
};

const cache = new Map<FxSheetName, THREE.Texture>();
/** The toon sheet for an effect, drawn on first use. */
export function toonSheet(name: FxSheetName): THREE.Texture {
  let t = cache.get(name);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = S * N; c.height = S;
  const x = c.getContext('2d')!;
  for (let i = 0; i < N; i++) {
    x.save();
    const m = TOON_SHEETS[name];
    x.translate(i * S + m.px, m.py);
    x.lineJoin = 'round';
    DRAW[name](x, i / (N - 1), i);
    x.restore();
  }
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  cache.set(name, t);
  return t;
}
