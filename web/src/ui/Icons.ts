// Procedurally painted icons for items and skills (cached data URLs).
// Every icon shares one look: a dark tile with a wave pattern, a soft glow and a
// cel-shaded, ink-outlined glyph lit from the top-left, rendered at device resolution.
import { IconSpec } from '../rpg/items';
import { SKILLS } from '../rpg/skills';

type Ctx = CanvasRenderingContext2D;
const cache = new Map<string, string>();
const INK = '#0b0812';
// Icons show at 40-64 CSS px, so 2x is already sharp; 3x only tripled the PNG work on phones.
const DPR = () => Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function rgb(hex: string) { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function css(r: number, g: number, b: number, a = 1) { return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`; }
/** Multiply towards black (f < 1) or brighten (f > 1). */
function shade(hex: string, f: number, a = 1) { const [r, g, b] = rgb(hex); return css(Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f), a); }
/** Mix with white. */
function tint(hex: string, t: number, a = 1) { const [r, g, b] = rgb(hex); return css(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t, a); }

// ---------------------------------------------------------------------------
// Drawing primitives (all glyphs are authored in a 100×100 unit space)
// ---------------------------------------------------------------------------
function rr(p: Path2D | Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  p.closePath();
}
function circ(p: Path2D, x: number, y: number, r: number) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
function ell(p: Path2D, x: number, y: number, rx: number, ry: number, rot = 0) { p.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function poly(p: Path2D, pts: number[]) { p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); }

/** Fill a path with flat colour plus hard-edged toon light and shadow bands, then ink it. */
let baseT: DOMMatrix | null = null;

function cel(x: Ctx, p: Path2D, base: string, line = 3.2) {
  x.fillStyle = base;
  x.fill(p);
  x.save();
  x.clip(p);
  // light bands are laid out in tile space so every glyph shares one light direction
  if (baseT) x.setTransform(baseT);
  const lg = x.createLinearGradient(8, 8, 92, 92);
  lg.addColorStop(0, tint(base, 0.5)); lg.addColorStop(0.36, tint(base, 0.32)); lg.addColorStop(0.361, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = lg; x.fillRect(0, 0, 100, 100);
  const dg = x.createLinearGradient(8, 8, 92, 92);
  dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(0.66, 'rgba(0,0,0,0)'); dg.addColorStop(0.661, 'rgba(12,6,24,0.34)'); dg.addColorStop(1, 'rgba(12,6,24,0.46)');
  x.fillStyle = dg; x.fillRect(0, 0, 100, 100);
  x.restore();
  if (line > 0) { x.lineWidth = line; x.strokeStyle = INK; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(p); }
}

/** Runs fn with a translate/rotate/scale applied around (cx, cy). */
function at(x: Ctx, cx: number, cy: number, rot: number, sc: number, fn: () => void) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.translate(-50, -50); fn(); x.restore();
}

function strokeLine(x: Ctx, pts: number[], color: string, w: number) {
  x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]);
  x.lineWidth = w + 2.4; x.strokeStyle = INK; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
  x.lineWidth = w; x.strokeStyle = color; x.stroke();
}

function sparks(x: Ctx, color: string, pts: [number, number, number][]) {
  x.save();
  x.shadowColor = color; x.shadowBlur = 6;
  for (const [cx, cy, r] of pts) {
    const p = new Path2D();
    poly(p, [cx, cy - r, cx + r * 0.28, cy - r * 0.28, cx + r, cy, cx + r * 0.28, cy + r * 0.28, cx, cy + r, cx - r * 0.28, cy + r * 0.28, cx - r, cy, cx - r * 0.28, cy - r * 0.28]);
    x.fillStyle = tint(color, 0.6); x.fill(p);
  }
  x.restore();
}

function speedLines(x: Ctx, color: string, n: number, x0: number, y0: number, x1: number, spread: number) {
  x.save(); x.globalAlpha = 0.75; x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + (i - (n - 1) / 2) * spread;
    x.beginPath(); x.moveTo(x0, y); x.lineTo(x1 - (i % 2) * 6, y);
    x.strokeStyle = tint(color, 0.4); x.lineWidth = 2.4; x.stroke();
  }
  x.restore();
}

function glowRing(x: Ctx, cx: number, cy: number, r: number, color: string, w = 3) {
  x.save(); x.shadowColor = color; x.shadowBlur = 10;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.strokeStyle = tint(color, 0.3, 0.9); x.lineWidth = w; x.stroke();
  x.restore();
}

function lightning(x: Ctx, pts: number[], color: string, w = 3.2) {
  x.save(); x.shadowColor = color; x.shadowBlur = 8;
  strokeLine(x, pts, color, w);
  x.restore();
}

// ---------------------------------------------------------------------------
// Glyph shapes
// ---------------------------------------------------------------------------
const G = {
  fist(): Path2D {
    const p = new Path2D();
    rr(p, 28, 36, 46, 36, 11);
    for (let i = 0; i < 4; i++) circ(p, 34.5 + i * 11.3, 38, 6.6);
    rr(p, 20, 50, 17, 20, 8);
    return p;
  },
  knuckleLines(x: Ctx) {
    x.save(); x.strokeStyle = INK; x.lineWidth = 2; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(40.2 + i * 11.3, 42); x.lineTo(40.2 + i * 11.3, 52); x.stroke(); }
    x.restore();
  },
  foot(): Path2D {
    const p = new Path2D();
    poly(p, [38, 14, 54, 14, 56, 54, 82, 62, 84, 76, 36, 76, 34, 56]);
    return p;
  },
  nail(): Path2D {
    const p = new Path2D();
    rr(p, 40, 12, 20, 8, 3);
    poly(p, [46, 20, 54, 20, 53, 74, 50, 90, 47, 74]);
    return p;
  },
  hammerHead(): Path2D { const p = new Path2D(); rr(p, 22, 16, 56, 24, 6); rr(p, 16, 20, 10, 16, 3); return p; },
  hammerHandle(): Path2D { const p = new Path2D(); rr(p, 45, 38, 10, 52, 4); return p; },
  blade(len = 74): Path2D { const p = new Path2D(); poly(p, [46.5, 70, 53.5, 70, 52.5, 70 - len * 0.72, 50, 70 - len * 0.82, 47.5, 70 - len * 0.72]); return p; },
  guard(): Path2D { const p = new Path2D(); ell(p, 50, 72, 13, 4.5); return p; },
  grip(): Path2D { const p = new Path2D(); rr(p, 46, 74, 8, 20, 3); return p; },
  knife(): Path2D { const p = new Path2D(); poly(p, [44, 62, 56, 62, 54, 30, 50, 14, 45, 30]); return p; },
  doll(): Path2D {
    const p = new Path2D();
    circ(p, 50, 26, 12);
    poly(p, [40, 38, 60, 38, 64, 66, 36, 66]);
    rr(p, 22, 42, 56, 8, 4);
    poly(p, [38, 64, 48, 64, 46, 88, 38, 88]);
    poly(p, [52, 64, 62, 64, 62, 88, 54, 88]);
    return p;
  },
  dollStraw(x: Ctx) {
    x.save(); x.strokeStyle = 'rgba(80,50,20,0.55)'; x.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(42 + i * 4, 40); x.lineTo(40 + i * 5, 64); x.stroke(); }
    x.beginPath(); x.moveTo(36, 66); x.lineTo(64, 66); x.lineWidth = 3; x.strokeStyle = '#8a2a2a'; x.stroke();
    x.restore();
  },
  dogHead(): Path2D {
    const p = new Path2D();
    ell(p, 46, 54, 22, 20);
    poly(p, [52, 46, 86, 54, 84, 68, 54, 70]);
    poly(p, [30, 40, 34, 14, 46, 36]);
    poly(p, [44, 36, 52, 12, 58, 38]);
    return p;
  },
  bird(): Path2D {
    const p = new Path2D();
    poly(p, [50, 44, 10, 26, 16, 40, 8, 44, 20, 52, 14, 58, 40, 60]);
    poly(p, [50, 44, 90, 26, 84, 40, 92, 44, 80, 52, 86, 58, 60, 60]);
    ell(p, 50, 56, 11, 16);
    circ(p, 50, 38, 9);
    return p;
  },
  toad(): Path2D {
    const p = new Path2D();
    ell(p, 50, 62, 32, 22);
    circ(p, 34, 40, 10); circ(p, 66, 40, 10);
    return p;
  },
  elephant(): Path2D {
    const p = new Path2D();
    ell(p, 50, 44, 22, 20);
    ell(p, 24, 44, 14, 18); ell(p, 76, 44, 14, 18);
    p.moveTo(44, 56); p.quadraticCurveTo(42, 78, 56, 88); p.lineTo(62, 82); p.quadraticCurveTo(54, 74, 56, 56); p.closePath();
    return p;
  },
  rabbit(): Path2D {
    const p = new Path2D();
    ell(p, 50, 62, 18, 16);
    ell(p, 42, 30, 6, 18, -0.15); ell(p, 58, 30, 6, 18, 0.15);
    return p;
  },
  serpent(): Path2D {
    const p = new Path2D();
    p.moveTo(30, 88); p.bezierCurveTo(10, 70, 70, 66, 52, 46); p.bezierCurveTo(42, 34, 52, 24, 62, 22);
    p.lineTo(66, 30); p.bezierCurveTo(58, 32, 54, 36, 62, 46); p.bezierCurveTo(82, 70, 26, 70, 42, 88); p.closePath();
    ell(p, 68, 22, 13, 9, -0.3);
    return p;
  },
  ox(): Path2D {
    const p = new Path2D();
    rr(p, 32, 34, 36, 40, 14);
    ell(p, 50, 72, 16, 10);
    p.moveTo(34, 38); p.quadraticCurveTo(10, 36, 12, 14); p.quadraticCurveTo(22, 28, 38, 30); p.closePath();
    p.moveTo(66, 38); p.quadraticCurveTo(90, 36, 88, 14); p.quadraticCurveTo(78, 28, 62, 30); p.closePath();
    return p;
  },
  wolf(): Path2D {
    const p = new Path2D();
    poly(p, [50, 88, 28, 66, 22, 40, 28, 20, 40, 34, 50, 30, 60, 34, 72, 20, 78, 40, 72, 66]);
    return p;
  },
  deer(): Path2D {
    const p = new Path2D();
    ell(p, 50, 56, 15, 20);
    ell(p, 50, 74, 9, 8);
    return p;
  },
  antlers(x: Ctx, color: string) {
    strokeLine(x, [42, 40, 34, 22, 26, 16], color, 3.2); strokeLine(x, [34, 22, 36, 12], color, 3.2); strokeLine(x, [38, 30, 26, 28], color, 3);
    strokeLine(x, [58, 40, 66, 22, 74, 16], color, 3.2); strokeLine(x, [66, 22, 64, 12], color, 3.2); strokeLine(x, [62, 30, 74, 28], color, 3);
  },
  shield(): Path2D { const p = new Path2D(); p.moveTo(50, 12); p.lineTo(80, 22); p.quadraticCurveTo(80, 66, 50, 88); p.quadraticCurveTo(20, 66, 20, 22); p.closePath(); return p; },
  heart(): Path2D { const p = new Path2D(); p.moveTo(50, 84); p.bezierCurveTo(14, 60, 14, 26, 34, 24); p.bezierCurveTo(44, 23, 50, 32, 50, 36); p.bezierCurveTo(50, 32, 56, 23, 66, 24); p.bezierCurveTo(86, 26, 86, 60, 50, 84); p.closePath(); return p; },
  drop(): Path2D { const p = new Path2D(); p.moveTo(50, 12); p.bezierCurveTo(56, 30, 74, 46, 74, 62); p.arc(50, 62, 24, 0, Math.PI); p.bezierCurveTo(26, 46, 44, 30, 50, 12); p.closePath(); return p; },
  bolt(): Path2D { const p = new Path2D(); poly(p, [58, 8, 26, 54, 46, 54, 38, 92, 74, 42, 54, 42]); return p; },
  eye(): Path2D { const p = new Path2D(); p.moveTo(12, 50); p.quadraticCurveTo(50, 18, 88, 50); p.quadraticCurveTo(50, 82, 12, 50); p.closePath(); return p; },
  orb(r = 26): Path2D { const p = new Path2D(); circ(p, 50, 50, r); return p; },
  shrine(): Path2D {
    const p = new Path2D();
    poly(p, [6, 34, 50, 14, 94, 34, 84, 38, 50, 26, 16, 38]);
    rr(p, 22, 38, 56, 8, 2);
    rr(p, 28, 46, 8, 42, 2); rr(p, 64, 46, 8, 42, 2);
    rr(p, 36, 56, 28, 6, 2);
    return p;
  },
  hand(): Path2D {
    const p = new Path2D();
    rr(p, 30, 46, 40, 40, 12);
    rr(p, 30, 22, 9, 32, 4.5); rr(p, 40.5, 14, 9, 38, 4.5); rr(p, 51, 16, 9, 36, 4.5); rr(p, 61.5, 24, 9, 30, 4.5);
    rr(p, 18, 52, 18, 9, 4.5);
    return p;
  },
  arrowUp(): Path2D { const p = new Path2D(); poly(p, [50, 10, 80, 42, 62, 42, 62, 66, 38, 66, 38, 42, 20, 42]); return p; },
  paw(): Path2D { const p = new Path2D(); ell(p, 50, 64, 20, 16); circ(p, 26, 42, 8); circ(p, 40, 28, 8); circ(p, 60, 28, 8); circ(p, 74, 42, 8); return p; },
  flame(): Path2D { const p = new Path2D(); p.moveTo(50, 8); p.bezierCurveTo(64, 30, 80, 44, 76, 66); p.bezierCurveTo(72, 84, 58, 92, 50, 92); p.bezierCurveTo(30, 92, 22, 76, 24, 62); p.bezierCurveTo(26, 48, 38, 44, 40, 30); p.bezierCurveTo(46, 40, 50, 44, 52, 50); p.bezierCurveTo(56, 36, 54, 22, 50, 8); p.closePath(); return p; },
  leaf(): Path2D { const p = new Path2D(); p.moveTo(18, 84); p.quadraticCurveTo(14, 20, 84, 16); p.quadraticCurveTo(84, 84, 18, 84); p.closePath(); return p; },
  slashMarks(x: Ctx, color: string) {
    x.save(); x.shadowColor = color; x.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const p = new Path2D();
      const o = i * 16 - 16;
      p.moveTo(24 + o, 86); p.quadraticCurveTo(46 + o, 50, 70 + o, 12); p.quadraticCurveTo(52 + o, 52, 30 + o, 88); p.closePath();
      cel(x, p, color, 2.4);
    }
    x.restore();
  },
  chainLink(cx: number, cy: number, rot: number): Path2D {
    const p = new Path2D();
    const c = Math.cos(rot), s = Math.sin(rot);
    p.ellipse(cx, cy, 16, 9, rot, 0, Math.PI * 2);
    p.moveTo(cx + c * 9, cy + s * 9);
    p.ellipse(cx, cy, 9, 3.5, rot, 0, Math.PI * 2, true);
    return p;
  },
  ring(): Path2D { const p = new Path2D(); circ(p, 50, 54, 26); p.moveTo(68, 54); p.arc(50, 54, 18, 0, Math.PI * 2, true); return p; },
};

// ---------------------------------------------------------------------------
// Tile backgrounds
// ---------------------------------------------------------------------------
type Frame = 'active' | 'buff' | 'passive' | 'reaction' | 'ultimate' | 'item';

function waves(x: Ctx, color: string, alpha: number) {
  // seigaiha: overlapping wave arcs, a classic Japanese pattern
  x.save(); x.globalAlpha = alpha; x.strokeStyle = color; x.lineWidth = 1.1;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) {
      const cx = col * 16 + (row % 2 ? 8 : 0), cy = row * 8 + 64;
      for (let k = 1; k <= 3; k++) { x.beginPath(); x.arc(cx, cy, k * 4.2, Math.PI, 0); x.stroke(); }
    }
  }
  x.restore();
}

function tile(x: Ctx, color: string, frame: Frame, watermark?: string) {
  const T = new Path2D(); rr(T, 2, 2, 96, 96, 20);
  const bg = x.createLinearGradient(0, 0, 0, 100);
  bg.addColorStop(0, shade(color, 0.42)); bg.addColorStop(0.55, shade(color, 0.2)); bg.addColorStop(1, shade(color, 0.09));
  x.fillStyle = bg; x.fill(T);
  x.save(); x.clip(T);
  const gl = x.createRadialGradient(50, 46, 4, 50, 50, 56);
  gl.addColorStop(0, tint(color, 0.15, 0.55)); gl.addColorStop(0.55, shade(color, 0.6, 0.18)); gl.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gl; x.fillRect(0, 0, 100, 100);
  waves(x, tint(color, 0.4), 0.13);
  if (watermark) {
    x.globalAlpha = 0.09; x.fillStyle = '#ffffff';
    x.font = '900 70px "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(watermark, 54, 56);
    x.globalAlpha = 1;
  }
  // top bevel
  const bv = x.createLinearGradient(0, 0, 0, 44);
  bv.addColorStop(0, 'rgba(255,255,255,0.16)'); bv.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = bv; x.fillRect(0, 0, 100, 44);
  x.restore();
  // frame
  x.lineJoin = 'round';
  x.lineWidth = 2; x.strokeStyle = INK; x.stroke(T);
  const inner = new Path2D(); rr(inner, 5.5, 5.5, 89, 89, 17);
  if (frame === 'ultimate') {
    const g = x.createLinearGradient(0, 0, 100, 100);
    g.addColorStop(0, '#fff2b0'); g.addColorStop(0.5, '#e0a83a'); g.addColorStop(1, '#8a5a12');
    x.lineWidth = 3.2; x.strokeStyle = g; x.stroke(inner);
    const in2 = new Path2D(); rr(in2, 10, 10, 80, 80, 13);
    x.lineWidth = 1; x.strokeStyle = 'rgba(255,220,140,0.55)'; x.stroke(in2);
    for (const [cx, cy] of [[11, 11], [89, 11], [11, 89], [89, 89]]) { const d = new Path2D(); poly(d, [cx, cy - 5, cx + 5, cy, cx, cy + 5, cx - 5, cy]); x.fillStyle = '#ffe08a'; x.fill(d); x.lineWidth = 1; x.strokeStyle = INK; x.stroke(d); }
  } else {
    x.lineWidth = 1.4; x.strokeStyle = tint(color, 0.45, 0.55); x.stroke(inner);
  }
  if (frame === 'passive') {
    const h = new Path2D(); const r = 41;
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = 50 + Math.cos(a) * r, py = 50 + Math.sin(a) * r; i ? h.lineTo(px, py) : h.moveTo(px, py); } h.closePath();
    x.lineWidth = 1.2; x.setLineDash([3, 3]); x.strokeStyle = tint(color, 0.5, 0.45); x.stroke(h); x.setLineDash([]);
  }
  if (frame === 'buff') {
    const c = new Path2D(); poly(c, [80, 30, 88, 20, 96, 30, 91, 30, 91, 36, 85, 36, 85, 30]);
    x.fillStyle = '#9ae6ff'; x.fill(c); x.lineWidth = 1.2; x.strokeStyle = INK; x.stroke(c);
  }
  if (frame === 'reaction') {
    const b = new Path2D(); poly(b, [86, 6, 76, 20, 83, 20, 78, 32, 92, 15, 85, 15]);
    x.fillStyle = '#ffd04a'; x.fill(b); x.lineWidth = 1.2; x.strokeStyle = INK; x.stroke(b);
  }
}

function makeCanvas(size: number) {
  const R = DPR();
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(size * R);
  const x = c.getContext('2d')!;
  x.scale(c.width / 100, c.height / 100);
  x.lineCap = 'round'; x.lineJoin = 'round';
  baseT = x.getTransform();
  return { c, x };
}

// ---------------------------------------------------------------------------
// Skill glyphs
// ---------------------------------------------------------------------------
const KANJI: Record<string, string> = {
  divergent: '逕', manji: '卍', rush: '連', slam: '撃', blackflash: '黒', slaughter: '屠', physique: '体', martial: '武', bfInstinct: '閃', unyielding: '忍', shrine: '魔',
  cursedSurge: '昂', counterStrike: '返', vesselBody: '器', ironWill: '剛', secondWind: '息', piercingBlood: '穿', fightingSpirit: '魂', supernova: '星', dismantleY: '解',
  dogs: '犬', nue: '鵺', toad: '蟇', shadowStep: '影', elephant: '象', rabbits: '兎', reserves: '呪', bond: '絆', swordsman: '剣', insight: '十', garden: '庭',
  shadowCloak: '隠', shadowGuard: '沈', tenShadows: '式', roundDeer: '鹿', loyalHounds: '忠', orochi: '蛇', shadowArsenal: '蔵', piercingOx: '牛', totality: '渾',
  hairpin: '簪', volley: '釘', resonance: '共', smash: '槌', dollField: '芻', nailRain: '雨', nerves: '胆', nailcraft: '匠', grit: '根', feedback: '還', thousand: '千',
  steadyAim: '狙', thornDoll: '棘', dollCraft: '縫', ironGirl: '誇', finalNail: '終', nailLance: '槍', heavyHitter: '重', chainResonance: '鎖', bloodResonance: '血',
};

Object.assign(KANJI, {
  sy_dismantle: '解', sy_cleave: '捌', sy_flame: '炎', sy_web: '網', sy_blackflash: '黒', sy_blast: '波', sy_rct: '反', sy_amplify: '拡', sy_swat: '払', sy_regrow: '再',
  sy_king: '王', sy_fingers: '指', sy_vessel: '器', sy_cruelty: '虐', sy_shrine: '魔',
  sm_dismantle: '解', sm_totality: '渾', sm_nue: '鵺', sm_kamutoke: '雷', sm_cleave: '捌', sm_agito: '顎', sm_fuga: '竈', sm_shroud: '隠', sm_rct: '反', sm_swap: '沈',
  sm_vessel: '式', sm_king: '王', sm_adapt: '適', sm_talent: '才', sm_worldCut: '界',
  hs_barrage: '腕', hs_dismantle: '解', hs_cleave: '捌', hs_fuga: '竈', hs_stomp: '災', hs_worldCut: '界', hs_blackflash: '黒', hs_incant: '詠', hs_rct: '反', hs_simple: '籠',
  hs_calamity: '災', hs_arms: '四', hs_faces: '面', hs_millennium: '千', hs_shrine: '魔',
  my_divergent: '逕', my_piercing: '穿', my_supernova: '星', my_dismantle: '解', my_soul: '魂', my_zone: '閃', my_redScale: '赤', my_winters: '冬', my_counter: '返', my_secondWind: '息',
  my_body: '体', my_mastery: '黒', my_blood: '血', my_unbreakable: '忍', my_domain: '域',
});

/** The unlockable sorcerers reuse the art of the technique they share with a first-year. */
const ART_ALIAS: Record<string, string> = {
  sy_dismantle: 'dismantleY', sy_blackflash: 'blackflash', sy_swat: 'counterStrike', sy_regrow: 'secondWind', sy_vessel: 'vesselBody', sy_shrine: 'shrine',
  sm_dismantle: 'dismantleY', sm_nue: 'nue', sm_shroud: 'shadowCloak', sm_swap: 'shadowGuard', sm_vessel: 'tenShadows', sm_agito: 'roundDeer',
  hs_barrage: 'rush', hs_dismantle: 'dismantleY', hs_stomp: 'slam', hs_blackflash: 'blackflash', hs_shrine: 'shrine',
  my_divergent: 'divergent', my_piercing: 'piercingBlood', my_supernova: 'supernova', my_dismantle: 'dismantleY', my_zone: 'blackflash', my_counter: 'counterStrike',
  my_secondWind: 'secondWind', my_body: 'physique', my_mastery: 'bfInstinct', my_unbreakable: 'unyielding', my_redScale: 'cursedSurge', my_winters: 'ironWill',
};

const SKILL_ART: Record<string, (x: Ctx, c: string) => void> = {
  // ---- Yuji ----
  divergent: (x, c) => { x.save(); x.globalAlpha = 0.45; at(x, 58, 46, -0.15, 0.95, () => cel(x, G.fist(), c, 0)); x.restore(); at(x, 46, 54, -0.15, 0.95, () => { cel(x, G.fist(), '#f2c7a2'); G.knuckleLines(x); }); glowRing(x, 58, 46, 30, c, 2); },
  manji: (x, c) => {
    x.save(); x.shadowColor = c; x.shadowBlur = 8; x.beginPath(); x.arc(50, 52, 36, -2.8, 0.2); x.strokeStyle = tint(c, 0.3); x.lineWidth = 5; x.stroke(); x.restore();
    const leg = new Path2D(); poly(leg, [12, 30, 26, 22, 60, 50, 50, 62]); cel(x, leg, '#262a44');
    at(x, 64, 58, -0.65, 0.62, () => ITEM_ART.shoes(x, '#f0f0f0', '#d23a3a'));
    speedLines(x, c, 3, 8, 74, 30, 8);
  },
  rush: (x, c) => { speedLines(x, c, 5, 8, 50, 36, 9); for (const [cx, cy, s] of [[62, 30, 0.55], [70, 70, 0.55], [52, 52, 0.7]] as const) at(x, cx, cy, -0.2, s, () => { cel(x, G.fist(), '#f2c7a2'); G.knuckleLines(x); }); },
  slam: (x, c) => { at(x, 50, 40, Math.PI / 2 - 0.1, 0.85, () => { cel(x, G.fist(), '#f2c7a2'); }); x.save(); x.shadowColor = c; x.shadowBlur = 8; for (const k of [-1, 1]) strokeLine(x, [50, 80, 50 + k * 18, 74, 50 + k * 34, 84], tint(c, 0.2), 3); x.restore(); sparks(x, c, [[22, 70, 5], [78, 68, 5]]); },
  blackflash: (x) => { lightning(x, [16, 20, 36, 40, 30, 52, 50, 68], '#ff1a2a', 3.6); lightning(x, [84, 22, 66, 38, 72, 50, 54, 70], '#ff4a5a', 2.6); at(x, 50, 54, -0.25, 0.85, () => { cel(x, G.fist(), '#141016'); G.knuckleLines(x); }); sparks(x, '#ff2a3a', [[30, 28, 6], [76, 74, 5], [22, 72, 4]]); },
  slaughter: (x, c) => at(x, 50, 52, 0.7, 1.05, () => { cel(x, G.knife(), '#d8dce8'); const h = new Path2D(); rr(h, 44, 62, 12, 22, 3); cel(x, h, shade(c, 0.6)); const g = new Path2D(); rr(g, 38, 60, 24, 5, 2); cel(x, g, '#e0b84e'); }),
  physique: (x) => { cel(x, G.heart(), '#ff6a7a'); x.save(); x.strokeStyle = INK; x.lineWidth = 2.4; x.beginPath(); x.moveTo(36, 52); x.lineTo(44, 52); x.lineTo(48, 42); x.lineTo(54, 62); x.lineTo(58, 52); x.lineTo(66, 52); x.stroke(); x.restore(); },
  martial: (x, c) => { glowRing(x, 50, 50, 34, c, 3); at(x, 50, 52, -0.1, 0.92, () => { cel(x, G.fist(), '#f2c7a2'); G.knuckleLines(x); const w = new Path2D(); rr(w, 27, 60, 48, 8, 3); cel(x, w, '#e8dcc0', 2); }); },
  bfInstinct: (x) => { cel(x, G.bolt(), '#ff2a3a'); sparks(x, '#ff4a5a', [[24, 24, 7], [78, 76, 6]]); },
  unyielding: (x, c) => { cel(x, G.shield(), shade(c, 0.95)); const s = new Path2D(); poly(s, [50, 26, 66, 32, 64, 58, 50, 72, 36, 58, 34, 32]); x.save(); x.globalAlpha = 0.35; x.fillStyle = '#ffffff'; x.fill(s); x.restore(); },
  shrine: (x) => { cel(x, G.shrine(), '#d81a2a'); x.save(); x.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const t = new Path2D(); poly(t, [38 + i * 6, 62, 41 + i * 6, 70, 44 + i * 6, 62]); x.fill(t); } x.restore(); sparks(x, '#ff2a3a', [[18, 70, 5], [82, 70, 5]]); },
  cursedSurge: (x, c) => { x.save(); x.shadowColor = c; x.shadowBlur = 12; cel(x, G.flame(), shade(c, 0.9)); x.restore(); at(x, 50, 58, 0, 0.5, () => cel(x, G.arrowUp(), '#ffffff')); },
  counterStrike: (x, c) => { x.save(); x.beginPath(); x.arc(52, 52, 32, 0.4, 4.4); x.strokeStyle = tint(c, 0.2); x.lineWidth = 4.5; x.stroke(); const h = new Path2D(); poly(h, [26, 22, 40, 20, 30, 34]); x.fillStyle = tint(c, 0.2); x.fill(h); x.restore(); at(x, 54, 54, 0.3, 0.7, () => { cel(x, G.fist(), '#f2c7a2'); G.knuckleLines(x); }); },
  vesselBody: (x) => { cel(x, G.eye(), '#f4ecf0'); const i = new Path2D(); circ(i, 50, 50, 12); cel(x, i, '#c81a2a', 2); const pu = new Path2D(); circ(pu, 50, 50, 5); x.fillStyle = INK; x.fill(pu); for (const k of [-1, 1]) strokeLine(x, [50 + k * 10, 70, 50 + k * 24, 80], '#2a1014', 2.6); },
  ironWill: (x, c) => { cel(x, G.shield(), shade(c, 0.8)); at(x, 50, 50, 0, 0.5, () => cel(x, G.heart(), '#ff6a7a')); },
  secondWind: (x, c) => { cel(x, G.heart(), c); x.save(); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.globalAlpha = 0.85; for (let i = 0; i < 2; i++) { x.beginPath(); x.arc(50, 52 + i * 10, 14 - i * 3, Math.PI * 1.1, Math.PI * 2.2); x.stroke(); } x.restore(); },
  piercingBlood: (x, c) => { lightning(x, [10, 86, 90, 14], c, 6); strokeLine(x, [10, 86, 90, 14], '#ffd0d8', 1.6); at(x, 34, 40, 0, 0.55, () => cel(x, G.drop(), c)); },
  fightingSpirit: (x, c) => { x.save(); x.shadowColor = c; x.shadowBlur = 10; cel(x, G.flame(), c); x.restore(); at(x, 50, 64, 0, 0.5, () => cel(x, G.flame(), '#ffe08a', 2)); },
  supernova: (x, c) => { glowRing(x, 50, 50, 26, c, 2); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 2; const o = new Path2D(); circ(o, 50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28, 9); cel(x, o, c, 2.4); } const core = new Path2D(); circ(core, 50, 50, 8); cel(x, core, '#ffd0d8', 2); },
  dismantleY: (x, c) => G.slashMarks(x, tint(c, 0.1)),
  // ---- Megumi ----
  dogs: (x) => { at(x, 40, 54, 0, 0.72, () => { cel(x, G.dogHead(), '#2a2a34'); }); at(x, 60, 46, 0, 0.72, () => { cel(x, G.dogHead(), '#f2f2f6'); const e = new Path2D(); circ(e, 50, 50, 4); x.fillStyle = INK; x.fill(e); }); },
  nue: (x, c) => { lightning(x, [50, 66, 42, 78, 52, 82, 44, 96], c, 2.6); cel(x, G.bird(), '#e8e8f0'); const m = new Path2D(); ell(m, 50, 38, 7, 4); x.fillStyle = INK; x.fill(m); },
  toad: (x) => { cel(x, G.toad(), '#5a9a4a'); for (const ex of [34, 66]) { const e = new Path2D(); circ(e, ex, 40, 4.5); x.fillStyle = INK; x.fill(e); } x.save(); x.strokeStyle = '#d84a6a'; x.lineWidth = 3.4; x.beginPath(); x.moveTo(50, 70); x.quadraticCurveTo(76, 86, 92, 66); x.stroke(); x.restore(); },
  shadowStep: (x, c) => { const p = new Path2D(); ell(p, 50, 72, 36, 12); cel(x, p, '#14141e', 2.4); x.save(); x.globalAlpha = 0.9; at(x, 54, 40, Math.PI / 2, 0.5, () => cel(x, G.arrowUp(), tint(c, 0.4))); x.restore(); speedLines(x, c, 3, 10, 40, 34, 8); },
  elephant: (x, c) => { cel(x, G.elephant(), '#8a96a8'); for (const [dx, dy] of [[78, 80], [86, 66]]) at(x, dx, dy, 0, 0.18, () => cel(x, G.drop(), tint(c, 0.2), 6)); },
  rabbits: (x) => { at(x, 34, 58, -0.15, 0.62, () => cel(x, G.rabbit(), '#f4f4f8')); at(x, 66, 60, 0.15, 0.62, () => cel(x, G.rabbit(), '#f4f4f8')); at(x, 50, 46, 0, 0.72, () => cel(x, G.rabbit(), '#ffffff')); },
  reserves: (x, c) => { x.save(); x.shadowColor = c; x.shadowBlur = 14; cel(x, G.orb(26), shade(c, 0.9)); x.restore(); x.save(); x.globalAlpha = 0.5; x.beginPath(); x.arc(50, 50, 16, 0, Math.PI * 1.4); x.strokeStyle = '#fff'; x.lineWidth = 2.4; x.stroke(); x.restore(); },
  bond: (x, c) => { cel(x, G.chainLink(38, 50, -0.6), tint(c, 0.2), 2.4); cel(x, G.chainLink(62, 50, -0.6), tint(c, 0.2), 2.4); },
  swordsman: (x) => at(x, 50, 50, 0.75, 1, () => { cel(x, G.blade(), '#e8ecf4'); cel(x, G.guard(), '#c8a040', 2.4); cel(x, G.grip(), '#2a2030', 2.4); }),
  insight: (x, c) => { const s = new Path2D(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 18 : 38; const px = 50 + Math.cos(a) * r, py = 50 + Math.sin(a) * r; i ? s.lineTo(px, py) : s.moveTo(px, py); } s.closePath(); cel(x, s, shade(c, 0.95), 2.4); const e = new Path2D(); circ(e, 50, 50, 8); cel(x, e, '#ffffff', 2); },
  garden: (x, c) => { const p = new Path2D(); ell(p, 50, 70, 40, 14); cel(x, p, '#101018', 2.4); x.save(); for (let i = 0; i < 5; i++) { const sp = new Path2D(); const bx = 22 + i * 14; poly(sp, [bx - 5, 72, bx, 28 + (i % 2) * 12, bx + 5, 72]); cel(x, sp, shade(c, 0.7), 2); } x.restore(); },
  shadowCloak: (x, c) => { const p = new Path2D(); p.moveTo(50, 14); p.quadraticCurveTo(82, 30, 80, 86); p.lineTo(20, 86); p.quadraticCurveTo(18, 30, 50, 14); p.closePath(); cel(x, p, shade(c, 0.55)); const f = new Path2D(); ell(f, 50, 42, 12, 14); x.fillStyle = '#0a0a12'; x.fill(f); for (const ex of [45, 55]) { const e = new Path2D(); circ(e, ex, 42, 2.4); x.fillStyle = '#9ae6ff'; x.fill(e); } },
  shadowGuard: (x, c) => { const p = new Path2D(); ell(p, 50, 76, 36, 10); cel(x, p, '#101018', 2.2); at(x, 50, 44, 0, 0.7, () => cel(x, G.shield(), tint(c, 0.1))); },
  tenShadows: (x, c) => { cel(x, G.hand(), '#f0d0b0'); glowRing(x, 50, 50, 40, c, 2); },
  roundDeer: (x, c) => { cel(x, G.deer(), '#d8c8a8'); G.antlers(x, '#f0e8d8'); const pl = new Path2D(); rr(pl, 66, 64, 8, 22, 2); rr(pl, 59, 71, 22, 8, 2); cel(x, pl, c, 2); },
  loyalHounds: (x) => { cel(x, G.paw(), '#f2f2f6'); at(x, 76, 24, 0.3, 0.32, () => cel(x, G.paw(), '#2a2a34', 4)); },
  orochi: (x) => { cel(x, G.serpent(), '#7a6ac0', 3.6); x.save(); x.globalAlpha = 0.5; x.strokeStyle = '#e8e4f0'; x.lineWidth = 2; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(36, 84); x.bezierCurveTo(20, 70, 66, 66, 54, 48); x.stroke(); x.restore(); const e = new Path2D(); circ(e, 72, 20, 3); x.fillStyle = '#ffd04a'; x.fill(e); },
  shadowArsenal: (x) => { at(x, 50, 50, 0.75, 0.95, () => { cel(x, G.blade(), '#e8ecf4'); cel(x, G.guard(), '#c8a040', 2.4); cel(x, G.grip(), '#2a2030', 2.4); }); at(x, 50, 50, -0.75, 0.95, () => { const sp = new Path2D(); rr(sp, 48, 30, 4, 62, 2); cel(x, sp, '#5a3a2a', 2); const tip = new Path2D(); poly(tip, [44, 32, 50, 8, 56, 32]); cel(x, tip, '#d8d8e0', 2.4); }); },
  piercingOx: (x, c) => { speedLines(x, c, 4, 4, 54, 24, 10); cel(x, G.ox(), '#2e2a36'); for (const hx of [16, 84]) { const h = new Path2D(); circ(h, hx, 16, 3.5); x.fillStyle = '#e8dcc0'; x.fill(h); } for (const ex of [42, 58]) { const e = new Path2D(); circ(e, ex, 48, 3); x.fillStyle = '#ffb04a'; x.fill(e); } },
  totality: (x) => { cel(x, G.wolf(), '#1e1e28'); const m = new Path2D(); poly(m, [50, 34, 64, 40, 60, 56, 50, 62, 40, 56, 36, 40]); x.fillStyle = '#f0f0f6'; x.fill(m); for (const ex of [43, 57]) { const e = new Path2D(); circ(e, ex, 46, 2.6); x.fillStyle = INK; x.fill(e); } },
  // ---- Nobara ----
  hairpin: (x, c) => { at(x, 44, 56, -0.6, 0.8, () => cel(x, G.nail(), '#d8dce4', 2.6)); sparks(x, c, [[70, 30, 12], [80, 48, 6], [58, 18, 5]]); },
  volley: (x) => { for (const [r, dx] of [[-0.45, -10], [0, 0], [0.45, 10]] as const) at(x, 50 + dx, 50, r, 0.82, () => cel(x, G.nail(), '#d8dce4', 2.4)); },
  resonance: (x, c) => { glowRing(x, 50, 54, 34, c, 2); cel(x, G.doll(), '#d8b05a', 2.6); G.dollStraw(x); at(x, 50, 36, 0.9, 0.55, () => cel(x, G.nail(), '#e8e8f0', 3)); },
  smash: (x, c) => at(x, 50, 50, -0.5, 1, () => { cel(x, G.hammerHandle(), '#8a6a4a'); cel(x, G.hammerHead(), '#a8aeb8'); sparks(x, c, [[82, 30, 6], [86, 52, 4]]); }),
  dollField: (x, c) => { const p = new Path2D(); ell(p, 50, 80, 36, 10); x.save(); x.strokeStyle = tint(c, 0.2); x.lineWidth = 3; x.stroke(p); x.restore(); at(x, 50, 46, 0, 0.82, () => { cel(x, G.doll(), '#d8b05a', 3); G.dollStraw(x); }); },
  nailRain: (x) => { for (const [dx, dy] of [[-22, -6], [0, 6], [22, -4], [-11, 22], [11, 20]] as const) at(x, 50 + dx, 40 + dy, Math.PI, 0.42, () => cel(x, G.nail(), '#d8dce4', 4.5)); },
  nerves: (x, c) => { x.save(); x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.arc(50, 50, 28, 0, Math.PI * 2); x.stroke(); x.strokeStyle = tint(c, 0.2); x.lineWidth = 4; x.stroke(); for (const [a, b, cx, cy] of [[50, 10, 50, 30], [50, 70, 50, 90], [10, 50, 30, 50], [70, 50, 90, 50]]) strokeLine(x, [a, b, cx, cy], tint(c, 0.2), 3.4); const d = new Path2D(); circ(d, 50, 50, 5); x.fillStyle = '#ff3a3a'; x.fill(d); x.restore(); },
  nailcraft: (x) => { at(x, 50, 50, 0.6, 0.85, () => { cel(x, G.hammerHandle(), '#8a6a4a'); cel(x, G.hammerHead(), '#a8aeb8'); }); at(x, 50, 50, -0.6, 0.85, () => cel(x, G.nail(), '#e8e8f0', 2.8)); },
  grit: (x, c) => { cel(x, G.leaf(), shade(c, 0.85)); strokeLine(x, [22, 80, 76, 22], '#e8ffd0', 2); },
  feedback: (x, c) => { x.save(); x.strokeStyle = tint(c, 0.15); x.lineWidth = 5; for (const s of [0, Math.PI]) { x.beginPath(); x.arc(50, 50, 30, s + 0.3, s + 2.6); x.stroke(); } x.restore(); at(x, 50, 50, 0, 0.5, () => cel(x, G.drop(), c)); },
  thousand: (x, c) => { glowRing(x, 50, 50, 14, c, 3); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; at(x, 50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26, a + Math.PI / 2, 0.42, () => cel(x, G.nail(), '#e8e8f0', 4.5)); } },
  steadyAim: (x, c) => { SKILL_ART.nerves(x, c); at(x, 76, 24, 0, 0.32, () => cel(x, G.arrowUp(), '#9ae6ff', 4)); },
  thornDoll: (x, c) => { at(x, 50, 50, 0, 0.8, () => { cel(x, G.doll(), '#d8b05a', 3); G.dollStraw(x); }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; at(x, 50 + Math.cos(a) * 36, 50 + Math.sin(a) * 36, a + Math.PI / 2, 0.3, () => cel(x, G.nail(), tint(c, 0.4), 5)); } },
  dollCraft: (x) => { at(x, 50, 52, 0, 0.82, () => { cel(x, G.doll(), '#d8b05a', 3); G.dollStraw(x); }); x.save(); x.strokeStyle = '#e8e8f0'; x.lineWidth = 2; x.beginPath(); x.moveTo(70, 18); x.quadraticCurveTo(86, 40, 64, 56); x.stroke(); x.restore(); },
  ironGirl: (x, c) => { cel(x, G.shield(), shade(c, 0.8)); at(x, 50, 48, -0.5, 0.6, () => { cel(x, G.hammerHandle(), '#8a6a4a', 4); cel(x, G.hammerHead(), '#d8dce4', 4); }); },
  finalNail: (x, c) => { sparks(x, c, [[50, 64, 18]]); at(x, 50, 44, 0, 0.82, () => cel(x, G.nail(), '#e8e8f0', 2.8)); },
  nailLance: (x, c) => { speedLines(x, c, 4, 4, 50, 22, 9); at(x, 54, 50, Math.PI / 2, 1.1, () => cel(x, G.nail(), '#e8ecf4', 2.4)); },
  heavyHitter: (x, c) => at(x, 50, 52, -0.35, 1.08, () => { cel(x, G.hammerHandle(), '#7a5a3a'); cel(x, G.hammerHead(), shade(c, 0.85)); }),
  chainResonance: (x, c) => { lightning(x, [12, 70, 36, 52, 60, 64, 88, 34], c, 3); cel(x, G.chainLink(32, 44, 0.5), '#c8c8d0', 2.4); cel(x, G.chainLink(62, 58, 0.5), '#c8c8d0', 2.4); },
  bloodResonance: (x, c) => { at(x, 44, 52, 0, 0.8, () => { cel(x, G.doll(), '#d8b05a', 3); G.dollStraw(x); }); at(x, 72, 30, 0, 0.42, () => cel(x, G.drop(), c, 4)); },
};

/**
 * Icons are painted once at full size and shared by every display size (CSS scales the image):
 * painting and PNG-encoding an icon is the expensive part, and it used to happen per size.
 */
const ICON_PX = 96;

export function skillIcon(id: string, _size = 96): string {
  const key = `s:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = paintSkill(id).toDataURL();
  cache.set(key, url);
  return url;
}

function paintSkill(id: string) {
  const size = ICON_PX;
  const s = SKILLS[id];
  const color = s?.color ?? '#9a7aff';
  const { c, x } = makeCanvas(size);
  const frame: Frame = s?.type ?? 'active';
  tile(x, color, frame, KANJI[id]);
  const art = SKILL_ART[id] ?? SKILL_ART[ART_ALIAS[id]];
  x.save();
  if (art) art(x, color);
  else { x.fillStyle = '#fff'; x.font = '900 56px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(KANJI[id] ?? '呪', 50, 53); }
  x.restore();
  return c;
}

// ---------------------------------------------------------------------------
// Item glyphs
// ---------------------------------------------------------------------------
/** Tile tint per item family so the bag reads by category at a glance. */
const ITEM_TINT: Record<string, string> = {
  fist: '#5a6a8a', blade: '#5a6a8a', knife: '#5a6a8a', spear: '#5a6a8a', hammer: '#5a6a8a',
  headband: '#3a7a7a', glasses: '#3a7a7a', mask: '#3a7a7a', hood: '#3a7a7a', circlet: '#3a7a7a', blindfold: '#3a7a7a',
  uniform: '#4a4290', charm: '#8a6a3a', bead: '#8a6a3a', eye: '#8a6a3a', bracelet: '#8a7a2a', ring: '#8a7a2a', shoes: '#7a3a4a',
  potion: '#7a2a4a', potionCe: '#2a4a8a', onigiri: '#5a6a3a', crystal: '#5a3a8a', finger: '#4a2a2a', cotton: '#3a6a4a', leaf: '#3a6a3a', ticket: '#6a4a2a', nametag: '#3a4a6a',
};

type ItemArt = (x: Ctx, c1: string, c2: string) => void;
const ITEM_ART: Record<string, ItemArt> = {
  fist: (x, c1, c2) => at(x, 50, 50, -0.25, 1, () => { cel(x, G.fist(), c1); x.save(); x.clip(G.fist()); x.fillStyle = c2; for (let i = 0; i < 3; i++) x.fillRect(20, 52 + i * 7, 60, 3); x.restore(); G.knuckleLines(x); }),
  blade: (x, c1, c2) => at(x, 50, 50, 0.78, 1.02, () => { cel(x, G.blade(), c1); cel(x, G.guard(), c2, 2.4); cel(x, G.grip(), '#2a1e1a', 2.4); }),
  knife: (x, c1, c2) => at(x, 50, 52, 0.78, 1.05, () => { cel(x, G.knife(), c1 === '#2a2a30' ? '#c8ccd8' : c1); const h = new Path2D(); rr(h, 44, 62, 12, 22, 3); cel(x, h, c2); }),
  spear: (x, c1, c2) => at(x, 50, 50, 0.78, 1, () => { const sh = new Path2D(); rr(sh, 47.5, 32, 5, 64, 2); cel(x, sh, c2, 2.2); const tip = new Path2D(); poly(tip, [42, 34, 50, 4, 58, 34, 50, 28]); cel(x, tip, c1, 2.4); }),
  hammer: (x, c1, c2) => at(x, 50, 50, -0.6, 1, () => { cel(x, G.hammerHandle(), c1); cel(x, G.hammerHead(), c2); }),
  uniform: (x, c1, c2) => {
    const p = new Path2D(); poly(p, [30, 16, 42, 12, 50, 22, 58, 12, 70, 16, 90, 40, 78, 48, 72, 40, 72, 88, 28, 88, 28, 40, 22, 48, 10, 40]);
    cel(x, p, c1);
    const col = new Path2D(); poly(col, [42, 12, 50, 22, 58, 12, 56, 26, 44, 26]); cel(x, col, shade(c1, 0.7), 2);
    for (let i = 0; i < 4; i++) { const b = new Path2D(); circ(b, 50, 34 + i * 13, 3.4); cel(x, b, c2, 1.6); }
  },
  charm: (x, c1, c2) => at(x, 50, 50, 0.12, 1, () => {
    const p = new Path2D(); rr(p, 33, 12, 34, 76, 3); cel(x, p, tint(c1, 0.2));
    x.save(); x.fillStyle = c2; x.font = '900 20px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('呪', 50, 34); x.fillText('封', 50, 62); x.restore();
    x.save(); x.strokeStyle = c2; x.lineWidth = 1.6; x.strokeRect(37, 18, 26, 64); x.restore();
  }),
  bead: (x, c1, c2) => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const b = new Path2D(); circ(b, 50 + Math.cos(a) * 28, 52 + Math.sin(a) * 28, 8); cel(x, b, i === 0 ? c2 : c1, 2); } },
  eye: (x, c1) => { cel(x, G.eye(), '#f6f9ff'); const i = new Path2D(); circ(i, 50, 50, 15); cel(x, i, c1, 2); const pu = new Path2D(); circ(pu, 50, 50, 6); x.fillStyle = '#0a1020'; x.fill(pu); sparks(x, '#ffffff', [[44, 44, 3]]); },
  shoes: (x, c1, c2) => {
    const p = new Path2D(); p.moveTo(14, 64); p.quadraticCurveTo(16, 30, 40, 30); p.lineTo(50, 46); p.quadraticCurveTo(80, 48, 88, 64); p.lineTo(88, 74); p.lineTo(14, 74); p.closePath();
    cel(x, p, c1);
    const sole = new Path2D(); rr(sole, 13, 68, 76, 8, 3); cel(x, sole, c2, 2);
    x.save(); x.strokeStyle = c2; x.lineWidth = 2.4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(38 + i * 6, 38 + i * 3); x.lineTo(46 + i * 6, 42 + i * 3); x.stroke(); } x.restore();
  },
  potion: (x, c1, c2) => {
    const glass = new Path2D(); circ(glass, 50, 60, 26); rr(glass, 43, 24, 14, 16, 3);
    x.fillStyle = 'rgba(220,235,255,0.25)'; x.fill(glass);
    x.save(); x.clip(glass); const liq = new Path2D(); rr(liq, 20, 52, 60, 40, 0); cel(x, liq, c1, 0); x.restore();
    x.lineWidth = 3; x.strokeStyle = INK; x.stroke(glass);
    const cork = new Path2D(); rr(cork, 42, 16, 16, 10, 3); cel(x, cork, '#9a7a5a', 2.2);
    const lab = new Path2D(); rr(lab, 38, 58, 24, 10, 3); cel(x, lab, c2, 1.6);
    sparks(x, '#ffffff', [[40, 46, 4]]);
  },
  potionCe: (x, c1, c2) => {
    const glass = new Path2D(); rr(glass, 34, 24, 32, 64, 12);
    x.fillStyle = 'rgba(220,235,255,0.25)'; x.fill(glass);
    x.save(); x.clip(glass); const liq = new Path2D(); rr(liq, 20, 44, 60, 50, 0); cel(x, liq, c1, 0); x.restore();
    x.lineWidth = 3; x.strokeStyle = INK; x.stroke(glass);
    const cork = new Path2D(); rr(cork, 42, 14, 16, 12, 3); cel(x, cork, '#9a7a5a', 2.2);
    const lab = new Path2D(); rr(lab, 36, 56, 28, 10, 3); cel(x, lab, c2, 1.6);
    sparks(x, '#ffffff', [[42, 36, 4]]);
  },
  onigiri: (x, c1, c2) => { const p = new Path2D(); p.moveTo(50, 14); p.quadraticCurveTo(92, 76, 82, 84); p.lineTo(18, 84); p.quadraticCurveTo(8, 76, 50, 14); p.closePath(); cel(x, p, c1); const n = new Path2D(); rr(n, 34, 58, 32, 27, 2); cel(x, n, c2, 2); },
  crystal: (x, c1, c2) => { const p = new Path2D(); poly(p, [50, 10, 80, 40, 62, 90, 38, 90, 20, 40]); cel(x, p, c1); x.save(); x.strokeStyle = tint(c2, 0.3, 0.7); x.lineWidth = 1.6; x.beginPath(); x.moveTo(50, 10); x.lineTo(50, 90); x.moveTo(20, 40); x.lineTo(80, 40); x.stroke(); x.restore(); sparks(x, c2, [[70, 22, 5]]); },
  finger: (x, c1, c2) => at(x, 50, 50, -0.5, 1, () => { x.save(); x.shadowColor = c2; x.shadowBlur = 12; const p = new Path2D(); rr(p, 40, 12, 20, 76, 10); cel(x, p, c1); x.restore(); const n = new Path2D(); rr(n, 43, 14, 14, 14, 5); x.fillStyle = '#0a0606'; x.fill(n); x.save(); x.strokeStyle = INK; x.lineWidth = 2; for (const y of [42, 62]) { x.beginPath(); x.moveTo(41, y); x.lineTo(59, y); x.stroke(); } x.restore(); }),
  cotton: (x, c1, c2) => { const p = new Path2D(); for (const [a, b, r] of [[40, 50, 18], [60, 45, 20], [50, 62, 20], [35, 65, 14], [66, 64, 15]] as const) circ(p, a, b, r); cel(x, p, c1); x.save(); x.strokeStyle = c2; x.lineWidth = 2.4; x.beginPath(); x.arc(50, 52, 30, 0.3, 2.5); x.stroke(); x.restore(); },
  leaf: (x, c1, c2) => { cel(x, G.leaf(), c2); strokeLine(x, [22, 80, 76, 22], tint(c1, 0.6), 1.8); },
  ticket: (x, c1, c2) => at(x, 50, 50, -0.25, 1, () => { const p = new Path2D(); rr(p, 14, 30, 72, 40, 5); cel(x, p, c1); x.save(); x.fillStyle = c2; x.font = '900 15px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ADMIT', 50, 50); x.setLineDash([3, 3]); x.strokeStyle = c2; x.lineWidth = 1.4; x.beginPath(); x.moveTo(70, 32); x.lineTo(70, 68); x.stroke(); x.restore(); }),
  nametag: (x, c1, c2) => at(x, 50, 54, 0.12, 1, () => {
    const p = new Path2D(); rr(p, 18, 30, 64, 46, 5); cel(x, p, c1);
    const clip = new Path2D(); rr(clip, 40, 16, 20, 18, 4); cel(x, clip, '#9aa0a8', 2);
    x.save(); x.fillStyle = c2; const bar = new Path2D(); rr(bar, 18, 30, 64, 12, 4); x.fill(bar);
    x.strokeStyle = tint(c2, 0, 0.8); x.lineWidth = 2.6; for (const [y, w] of [[54, 40], [64, 28]] as const) { x.beginPath(); x.moveTo(28, y); x.lineTo(28 + w, y); x.stroke(); }
    const ph = new Path2D(); rr(ph, 62, 48, 13, 18, 2); x.fillStyle = tint(c2, 0.4, 0.5); x.fill(ph); x.restore();
  }),
  headband: (x, c1, c2) => { const p = new Path2D(); p.moveTo(10, 46); p.quadraticCurveTo(50, 30, 90, 46); p.lineTo(90, 58); p.quadraticCurveTo(50, 42, 10, 58); p.closePath(); cel(x, p, c1); const t = new Path2D(); poly(t, [76, 52, 92, 74, 84, 78, 72, 58]); poly(t, [72, 54, 78, 82, 70, 82, 66, 58]); cel(x, t, c1, 2.4); const m = new Path2D(); circ(m, 50, 42, 6); cel(x, m, c2, 2); },
  glasses: (x, c1, c2) => { x.save(); for (const cx of [32, 68]) { const l = new Path2D(); rr(l, cx - 16, 40, 32, 22, 7); x.fillStyle = tint(c2, 0.2, 0.55); x.fill(l); x.lineWidth = 4.5; x.strokeStyle = INK; x.stroke(l); x.lineWidth = 2.4; x.strokeStyle = c1; x.stroke(l); sparks(x, '#ffffff', [[cx - 6, 46, 3]]); } strokeLine(x, [48, 48, 52, 48], c1, 2.4); strokeLine(x, [16, 46, 6, 40], c1, 2.4); strokeLine(x, [84, 46, 94, 40], c1, 2.4); x.restore(); },
  mask: (x, c1, c2) => { const p = new Path2D(); p.moveTo(50, 12); p.quadraticCurveTo(86, 16, 82, 52); p.quadraticCurveTo(76, 84, 50, 90); p.quadraticCurveTo(24, 84, 18, 52); p.quadraticCurveTo(14, 16, 50, 12); p.closePath(); cel(x, p, c1); for (const ex of [36, 64]) { const e = new Path2D(); ell(e, ex, 44, 8, 5); x.fillStyle = INK; x.fill(e); } x.save(); x.strokeStyle = c2; x.lineWidth = 3; x.beginPath(); x.moveTo(30, 62); x.quadraticCurveTo(50, 70, 70, 62); x.stroke(); for (const k of [-1, 1]) { x.beginPath(); x.moveTo(50 + k * 14, 22); x.lineTo(50 + k * 20, 34); x.stroke(); } x.restore(); },
  hood: (x, c1, c2) => { const p = new Path2D(); p.moveTo(50, 10); p.quadraticCurveTo(88, 20, 86, 88); p.lineTo(14, 88); p.quadraticCurveTo(12, 20, 50, 10); p.closePath(); cel(x, p, c1); const f = new Path2D(); ell(f, 50, 50, 18, 22); x.fillStyle = '#06060c'; x.fill(f); for (const ex of [43, 57]) { const e = new Path2D(); circ(e, ex, 48, 2.6); x.fillStyle = c2; x.fill(e); } },
  circlet: (x, c1, c2) => { const p = new Path2D(); p.moveTo(14, 60); p.quadraticCurveTo(50, 44, 86, 60); p.lineTo(84, 70); p.quadraticCurveTo(50, 56, 16, 70); p.closePath(); poly(p, [44, 52, 50, 24, 56, 52]); poly(p, [26, 58, 30, 40, 36, 55]); poly(p, [64, 55, 70, 40, 74, 58]); cel(x, p, c1); const g = new Path2D(); circ(g, 50, 44, 6); cel(x, g, c2, 2); },
  blindfold: (x, c1, c2) => { const p = new Path2D(); p.moveTo(8, 44); p.quadraticCurveTo(50, 32, 92, 44); p.lineTo(92, 60); p.quadraticCurveTo(50, 48, 8, 60); p.closePath(); cel(x, p, c1); x.save(); x.shadowColor = c2; x.shadowBlur = 8; for (const ex of [32, 68]) { const e = new Path2D(); ell(e, ex, 49, 9, 3); x.fillStyle = tint(c2, 0.3, 0.8); x.fill(e); } x.restore(); const t = new Path2D(); poly(t, [8, 52, 2, 74, 10, 76, 14, 56]); cel(x, t, c1, 2.2); },
  bracelet: (x, c1, c2) => { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const b = new Path2D(); ell(b, 50 + Math.cos(a) * 26, 54 + Math.sin(a) * 18, 8, 7); cel(x, b, i % 3 === 0 ? c2 : c1, 2); } },
  ring: (x, c1, c2) => { cel(x, G.ring(), c1, 2.8); const g = new Path2D(); poly(g, [50, 14, 62, 26, 50, 38, 38, 26]); cel(x, g, c2, 2.4); sparks(x, '#ffffff', [[46, 22, 3.5]]); },
};

export function itemIcon(spec: IconSpec, _size = 96): string {
  const key = `i:${spec.shape}:${spec.c1}:${spec.c2 ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = paintItem(spec).toDataURL();
  cache.set(key, url);
  return url;
}

function paintItem(spec: IconSpec) {
  const size = ICON_PX;
  const { c, x } = makeCanvas(size);
  tile(x, ITEM_TINT[spec.shape] ?? '#4a4a6a', 'item');
  const art = ITEM_ART[spec.shape];
  x.save();
  if (art) art(x, spec.c1, spec.c2 ?? spec.c1);
  else cel(x, G.orb(26), spec.c1);
  x.restore();
  return c;
}

/** The icon if it has already been painted; otherwise queues it (first) and returns null. */
export function itemIconIfReady(spec: IconSpec): string | null {
  const hit = cache.get(`i:${spec.shape}:${spec.c1}:${spec.c2 ?? ''}`);
  if (!hit) warmIcons([], [spec], true);
  return hit ?? null;
}

// ---------------------------------------------------------------------------
// Background pre-painting
// ---------------------------------------------------------------------------
const warmQueue: (() => void)[] = [];
/** keys waiting in the queue, so repeated requests (every loot pickup) don't pile up */
const queued = new Set<string>();
/** keys painted and waiting for their PNG */
const encoding = new Set<string>();
let warming = false;

/**
 * Paint now, encode later: toBlob compresses the PNG off the main thread, where toDataURL used to
 * stall the frame for every icon, which in a crowd fight with loot raining down was most of the CPU.
 */
function warmOne(key: string, paint: () => HTMLCanvasElement) {
  queued.delete(key);
  if (cache.has(key) || encoding.has(key)) return;
  const c = paint();
  if (!c.toBlob) { cache.set(key, c.toDataURL()); return; }
  encoding.add(key);
  c.toBlob((b) => {
    encoding.delete(key);
    if (b && !cache.has(key)) cache.set(key, URL.createObjectURL(b));
  });
}
type Idle = { timeRemaining(): number; didTimeout: boolean };
const onIdle: (cb: (d: Idle) => void) => void = (window as any).requestIdleCallback
  ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 2500 })
  : (cb) => setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: false }), 80);

/**
 * Paints icons in the background, only in the idle part of frames, so menus and buff icons open
 * without a hitch and gameplay never pays for it. `first` jumps the queue (the bag, the skills).
 */
let warmGate: (() => boolean) | null = null;
/** While the gate returns true (a fight is on), background painting waits. */
export function setIconWarmGate(busy: () => boolean) { warmGate = busy; }

export function warmIcons(skills: string[], items: IconSpec[], first = false) {
  const jobs: (() => void)[] = [];
  for (const id of skills) {
    const key = `s:${id}`;
    if (cache.has(key) || encoding.has(key) || (queued.has(key) && !first)) continue;
    queued.add(key);
    jobs.push(() => warmOne(key, () => paintSkill(id)));
  }
  for (const spec of items) {
    const key = `i:${spec.shape}:${spec.c1}:${spec.c2 ?? ''}`;
    if (cache.has(key) || encoding.has(key) || (queued.has(key) && !first)) continue;
    queued.add(key);
    jobs.push(() => warmOne(key, () => paintItem(spec)));
  }
  if (first) warmQueue.unshift(...jobs); else warmQueue.push(...jobs);
  if (warming || !warmQueue.length) return;
  warming = true;
  const step = (d: Idle) => {
    if (warmGate?.()) { onIdle(step); return; }
    // always make some progress, otherwise only paint while the frame has room to spare
    do warmQueue.shift()?.(); while (warmQueue.length && d.timeRemaining() > 6);
    if (warmQueue.length) onIdle(step); else warming = false;
  };
  onIdle(step);
}
