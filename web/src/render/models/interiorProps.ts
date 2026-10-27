// Props for the enterable building interiors: themed wall segments and furniture.
// Built from a handful of flat boxes so they read cleanly from the top-down camera.
import type { PropDef } from './props';
import { G, PartBag } from '../geo';
import { darken, lighten } from './humanoid';

const H = 2.6; // interior wall height

/** 4m wall segment (scaled along X by MapBuilder.wall) with a lower band, an upper field and trim. */
function wall(lower: number, upper: number, trim: number, opts: { band?: number; bandY?: number; grid?: number; panels?: boolean; lowerH?: number } = {}): PropDef {
  const b = new PartBag();
  const lh = opts.lowerH ?? 0.95;
  b.add(G.box(4, lh, 0.3), lower, { pos: [0, lh / 2, 0], topColor: lighten(lower, 1.08) });
  b.add(G.box(4, H - lh, 0.26), upper, {
    pos: [0, lh + (H - lh) / 2, 0],
    colorFn: opts.grid || opts.panels ? (x, y, _z, c) => {
      if (opts.grid && (Math.abs(((x + 10) % opts.grid) - opts.grid / 2) > opts.grid / 2 - 0.03 || Math.abs(((y + 10) % opts.grid) - opts.grid / 2) > opts.grid / 2 - 0.03)) c.multiplyScalar(0.86);
      if (opts.panels && Math.abs(((x + 10) % 1.0) - 0.5) > 0.46) c.multiplyScalar(0.78);
    } : undefined,
  });
  if (opts.band !== undefined) b.add(G.box(4.02, 0.16, 0.3), opts.band, { pos: [0, opts.bandY ?? 1.3, 0] });
  b.add(G.box(4.04, 0.12, 0.34), trim, { pos: [0, H + 0.02, 0] });
  b.add(G.box(4.04, 0.1, 0.34), darken(lower, 0.7), { pos: [0, 0.05, 0] });
  return { geo: b.build(), collide: { box: [4, 0.4] }, outline: 0.01, shadow: true };
}

function wallPost(col = 0x4a4038, h = H + 0.1): PropDef {
  const b = new PartBag();
  b.add(G.box(0.42, h, 0.42), col, { pos: [0, h / 2, 0], topColor: lighten(col, 1.15) });
  return { geo: b.build(), collide: { box: [0.42, 0.42] }, outline: 0.01, shadow: true };
}

function desk(): PropDef {
  const b = new PartBag();
  const wood = 0xc8a070, metal = 0x6a7078;
  b.add(G.box(0.7, 0.05, 0.5), wood, { pos: [0, 0.72, 0] });
  for (const [x, z] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]]) b.add(G.box(0.04, 0.72, 0.04), metal, { pos: [x, 0.36, z] });
  b.add(G.box(0.6, 0.18, 0.4), darken(wood, 0.75), { pos: [0, 0.6, 0] });
  // chair behind the desk
  b.add(G.box(0.42, 0.04, 0.4), wood, { pos: [0, 0.44, 0.48] });
  b.add(G.box(0.42, 0.36, 0.04), wood, { pos: [0, 0.66, 0.68] });
  for (const [x, z] of [[-0.18, 0.32], [0.18, 0.32], [-0.18, 0.64], [0.18, 0.64]]) b.add(G.box(0.03, 0.44, 0.03), metal, { pos: [x, 0.22, z] });
  return { geo: b.build(), collide: { box: [0.7, 1.0] }, outline: 0.008, shadow: true };
}

function teacherDesk(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.6, 0.8, 0.7), 0x8a6a4a, { pos: [0, 0.4, 0], topColor: 0xa88a6a });
  b.add(G.box(1.7, 0.05, 0.75), 0x5a4a3a, { pos: [0, 0.82, 0] });
  b.add(G.box(0.3, 0.06, 0.22), 0xf0f0e8, { pos: [-0.4, 0.86, 0] });
  return { geo: b.build(), collide: { box: [1.7, 0.8] }, outline: 0.01, shadow: true };
}

function blackboard(): PropDef {
  const b = new PartBag();
  b.add(G.box(3.2, 1.3, 0.08), 0x2e4a3a, { pos: [0, 1.5, 0], colorFn: (x, y, _z, c) => { if (Math.sin(x * 9 + y * 3) > 0.96) c.setHex(0xd8e0d8); } });
  b.add(G.box(3.3, 0.08, 0.18), 0x7a5a3a, { pos: [0, 0.82, 0.04] });
  b.add(G.box(3.3, 1.4, 0.05), 0x6a4a2a, { pos: [0, 1.5, -0.04] });
  return { geo: b.build(), collide: { box: [3.3, 0.3] }, outline: 0.01, shadow: false };
}

function lockerRow(): PropDef {
  const b = new PartBag();
  for (let i = 0; i < 3; i++) {
    const col = i % 2 ? 0x6a8aa8 : 0x5a7a98;
    b.add(G.box(0.58, 2.0, 0.5), col, { pos: [-0.6 + i * 0.6, 1.0, 0], topColor: lighten(col, 1.1), colorFn: (_x, y, z, c) => { if (z > 0.24 && Math.abs(((y * 6) % 1) - 0.5) < 0.06 && y > 1.5) c.multiplyScalar(0.7); } });
    b.add(G.box(0.05, 0.12, 0.04), 0xd8d8d8, { pos: [-0.42 + i * 0.6, 1.05, 0.27] });
  }
  return { geo: b.build(), collide: { box: [1.8, 0.55] }, outline: 0.01, shadow: true };
}

function theaterSeats(): PropDef {
  const b = new PartBag();
  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * 0.8;
    b.add(G.box(0.66, 0.16, 0.6), 0xa81a2a, { pos: [x, 0.45, 0], topColor: 0xc8303a });
    b.add(G.box(0.66, 0.7, 0.14), 0x8a1420, { pos: [x, 0.8, 0.3], topColor: 0xb02a36 });
    b.add(G.box(0.08, 0.6, 0.6), 0x2a2026, { pos: [x - 0.37, 0.4, 0.05] });
  }
  b.add(G.box(0.08, 0.6, 0.6), 0x2a2026, { pos: [1.57, 0.4, 0.05] });
  return { geo: b.build(), collide: { box: [3.3, 0.8] }, outline: 0.008, shadow: true };
}

function cinemaScreen(): PropDef {
  const b = new PartBag();
  b.add(G.box(6, 2.6, 0.12), 0xe8eef8, { pos: [0, 1.6, 0], glow: 0.35 });
  b.add(G.box(6.4, 0.3, 0.3), 0x3a0a12, { pos: [0, 3.0, 0.05] });
  for (const sx of [-1, 1]) b.add(G.box(0.4, 3.0, 0.3), 0x5a0a18, { pos: [sx * 3.2, 1.5, 0.05], colorFn: (x, _y, _z, c) => { if (Math.abs(((x * 12) % 1)) < 0.2) c.multiplyScalar(0.75); } });
  return { geo: b.build(), collide: { box: [6.4, 0.4] }, outline: 0.01, shadow: false };
}

function ticketBooth(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.8, 1.1, 0.9), 0x5a2a2a, { pos: [0, 0.55, 0], topColor: 0x7a3a3a });
  b.add(G.box(1.9, 0.06, 1.0), 0xd8b04a, { pos: [0, 1.12, 0] });
  b.add(G.box(1.6, 0.9, 0.05), 0x9ad0ff, { pos: [0, 1.6, 0], glow: 0.15 });
  b.add(G.box(1.9, 0.2, 1.0), 0xd8b04a, { pos: [0, 2.1, 0], glow: 0.3 });
  return { geo: b.build(), collide: { box: [1.9, 1.0] }, outline: 0.01, shadow: true };
}

function popcornCart(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.9, 0.8, 0.6), 0xc8302a, { pos: [0, 0.6, 0] });
  b.add(G.box(0.9, 0.6, 0.6), 0xf4f0e0, { pos: [0, 1.3, 0], glow: 0.2, colorFn: (_x, y, _z, c) => { if (y < -0.1) c.setHex(0xffd870); } });
  b.add(G.box(1.0, 0.08, 0.7), 0xc8302a, { pos: [0, 1.66, 0] });
  for (const sx of [-0.35, 0.35]) b.add(G.cyl(0.12, 0.12, 0.06, 8), 0x222222, { pos: [sx, 0.12, 0.3], rot: [Math.PI / 2, 0, 0] });
  return { geo: b.build(), collide: { box: [1.0, 0.7] }, outline: 0.01, shadow: true };
}

function stationPillar(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.8, H + 0.4, 0.8), 0xe8eae8, { pos: [0, (H + 0.4) / 2, 0], colorFn: (x, y, z, c) => { if (Math.abs(((y * 3) % 1) - 0.5) > 0.47 || Math.abs(((x * 3 + z * 3) % 1) - 0.5) > 0.47) c.multiplyScalar(0.88); } });
  b.add(G.box(0.84, 0.22, 0.84), 0x2a8a4a, { pos: [0, 1.4, 0] });
  b.add(G.box(0.6, 0.3, 0.05), 0x1a1a1a, { pos: [0, 2.1, 0.42], colorFn: (_x, _y, _z, c) => c.setHex(0xf0f0f0) });
  return { geo: b.build(), collide: { box: [0.85, 0.85] }, outline: 0.01, shadow: true };
}

function ticketGate(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.3, 1.0, 1.4), 0xd8dce0, { pos: [0, 0.5, 0], topColor: 0x3a3a40 });
  b.add(G.box(0.32, 0.06, 0.4), 0x2aa0ff, { pos: [0, 1.0, 0.4], glow: 0.6 });
  b.add(G.box(0.05, 0.4, 0.6), 0xe84a4a, { pos: [0.4, 0.75, 0], glow: 0.2 });
  return { geo: b.build(), collide: { box: [0.4, 1.4] }, outline: 0.008, shadow: true };
}

function bunkBed(): PropDef {
  const b = new PartBag();
  const metal = 0x6a6e74;
  for (const [x, z] of [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]]) b.add(G.box(0.06, 1.8, 0.06), metal, { pos: [x, 0.9, z] });
  for (const y of [0.4, 1.4]) {
    b.add(G.box(0.95, 0.08, 1.95), metal, { pos: [0, y, 0] });
    b.add(G.box(0.85, 0.12, 1.85), 0xe0dcd0, { pos: [0, y + 0.1, 0] });
    b.add(G.box(0.85, 0.06, 0.9), 0x5a6a7a, { pos: [0, y + 0.18, 0.4] });
  }
  return { geo: b.build(), collide: { box: [1.0, 2.0] }, outline: 0.008, shadow: true };
}

function metalTable(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.6, 0.06, 0.8), 0x9aa0a8, { pos: [0, 0.74, 0] });
  for (const [x, z] of [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]]) b.add(G.box(0.05, 0.74, 0.05), 0x5a5e64, { pos: [x, 0.37, z] });
  return { geo: b.build(), collide: { box: [1.6, 0.8] }, outline: 0.008, shadow: true };
}

function futon(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.0, 0.12, 2.0), 0xf0ece0, { pos: [0, 0.06, 0] });
  b.add(G.box(0.95, 0.1, 1.2), 0x4a6aa8, { pos: [0, 0.16, 0.35], colorFn: (x, _y, z, c) => { if (Math.sin(x * 14) * Math.sin(z * 14) > 0.6) c.multiplyScalar(1.25); } });
  b.add(G.box(0.5, 0.12, 0.3), 0xffffff, { pos: [0, 0.18, -0.75] });
  return { geo: b.build(), outline: 0.008, shadow: false };
}

function chabudai(): PropDef {
  const b = new PartBag();
  b.add(G.cyl(0.55, 0.55, 0.06, 10), 0x7a4a2a, { pos: [0, 0.36, 0] });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; b.add(G.box(0.06, 0.34, 0.06), 0x5a3a20, { pos: [Math.cos(a) * 0.38, 0.17, Math.sin(a) * 0.38] }); }
  b.add(G.cyl(0.08, 0.06, 0.12, 8), 0xe8e0d0, { pos: [0.15, 0.45, 0.1] });
  return { geo: b.build(), collide: { r: 0.55 }, outline: 0.008, shadow: true };
}

function bookshelf(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.4, 1.9, 0.4), 0x6a4a30, { pos: [0, 0.95, 0] });
  const cols = [0xc83a3a, 0x3a6ac8, 0xe0c04a, 0x4aa86a, 0x8a4ac8, 0xe8e0d0];
  for (let s = 0; s < 4; s++) for (let i = 0; i < 6; i++) b.add(G.box(0.16, 0.34, 0.3), cols[(s * 3 + i) % cols.length], { pos: [-0.5 + i * 0.2, 0.3 + s * 0.45, 0.06] });
  return { geo: b.build(), collide: { box: [1.4, 0.45] }, outline: 0.008, shadow: true };
}

function tvSet(): PropDef {
  const b = new PartBag();
  b.add(G.box(1.2, 0.5, 0.45), 0x4a3a2a, { pos: [0, 0.25, 0] });
  b.add(G.box(1.1, 0.65, 0.08), 0x101014, { pos: [0, 0.85, 0] });
  b.add(G.box(1.0, 0.55, 0.02), 0x6ac8ff, { pos: [0, 0.85, 0.05], glow: 0.7 });
  return { geo: b.build(), collide: { box: [1.2, 0.5] }, outline: 0.008, shadow: true };
}

function pottedPlant(): PropDef {
  const b = new PartBag();
  b.add(G.cyl(0.22, 0.17, 0.4, 8), 0xb86a3a, { pos: [0, 0.2, 0] });
  for (let i = 0; i < 5; i++) { const a = i * 1.26; b.add(G.cone(0.12, 0.7, 4), 0x3a8a4a, { pos: [Math.cos(a) * 0.1, 0.7, Math.sin(a) * 0.1], rot: [Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4], topColor: 0x6ac06a }); }
  return { geo: b.build(), collide: { r: 0.25 }, outline: 0.01, shadow: true };
}

/** Sunken track bed along a platform edge, with rails and the yellow tactile strip. */
function trackBed(): PropDef {
  const b = new PartBag();
  b.add(G.box(9.6, 0.04, 2.0), 0x18181c, { pos: [0, 0.02, 0] });
  for (let i = 0; i < 12; i++) b.add(G.box(0.18, 0.06, 1.6), 0x4a3a2a, { pos: [-4.4 + i * 0.8, 0.05, 0] });
  for (const z of [-0.45, 0.45]) b.add(G.box(9.6, 0.08, 0.08), 0x9aa0a8, { pos: [0, 0.1, z] });
  b.add(G.box(9.6, 0.05, 0.3), 0xf0c020, { pos: [0, 0.03, 1.15], colorFn: (x, _y, _z, c) => { if (Math.abs(((x * 4) % 1)) < 0.15) c.multiplyScalar(0.8); } });
  return { geo: b.build(), collide: { box: [9.6, 1.9] }, outline: false, shadow: false };
}

/** Six tatami mats in a 3x2 layout with dark cloth borders. */
function tatami(): PropDef {
  const b = new PartBag();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = -2.4 + i * 1.6, z = -1.6 + j * 3.2;
    b.add(G.box(1.56, 0.03, 3.16), 0xc8c890, { pos: [x, 0.015, z], colorFn: (px, _y, _z, c) => { if (Math.abs(((px * 9) % 1)) < 0.12) c.multiplyScalar(0.94); } });
    b.add(G.box(0.08, 0.035, 3.16), 0x2a3a2a, { pos: [x - 0.74, 0.017, z] });
    b.add(G.box(0.08, 0.035, 3.16), 0x2a3a2a, { pos: [x + 0.74, 0.017, z] });
  }
  return { geo: b.build(), outline: false, shadow: false };
}

function exitSign(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.05, 1.6, 0.05), 0x5a5e64, { pos: [0, 0.8, 0] });
  b.add(G.box(0.7, 0.28, 0.08), 0x1aa05a, { pos: [0, 1.7, 0], glow: 0.9, colorFn: (x, y, _z, c) => { if (Math.abs(x) < 0.26 && Math.abs(y - 1.7) < 0.07) c.setHex(0xe8fff0); } });
  return { geo: b.build(), outline: 0.008, shadow: false, light: { y: 1.7, color: 0x3aff8a, intensity: 1.2, range: 3 } };
}

/** Lacquered cache sealed with a paper talisman: breaks open for loot. */
function treasureChest(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.9, 0.5, 0.6), 0x7a1a1a, { pos: [0, 0.27, 0], topColor: 0x9a2a24 });
  b.add(G.box(0.96, 0.16, 0.66), 0x5a1010, { pos: [0, 0.6, 0], topColor: 0x7a1a1a });
  for (const x of [-0.38, 0.38]) b.add(G.box(0.06, 0.66, 0.68), 0xd8b04a, { pos: [x, 0.34, 0], glow: 0.15 });
  b.add(G.box(0.98, 0.05, 0.05), 0xd8b04a, { pos: [0, 0.52, 0.31], glow: 0.15 });
  b.add(G.box(0.14, 0.42, 0.02), 0xf2ead2, { pos: [0, 0.42, 0.315], colorFn: (_x, y, _z, c) => { if (Math.abs(((y * 14) % 1) - 0.5) < 0.12) c.setHex(0xb02020); } });
  return { geo: b.build(), outline: 0.01, shadow: true };
}

function cursedBox(): PropDef {
  const b = new PartBag();
  b.add(G.box(0.5, 0.3, 0.35), 0x3a2a24, { pos: [0, 0.15, 0] });
  b.add(G.box(0.52, 0.06, 0.37), 0x1a1210, { pos: [0, 0.32, 0] });
  b.add(G.box(0.08, 0.36, 0.04), 0xf0e8d0, { pos: [0, 0.18, 0.19] });
  b.add(G.box(0.08, 0.36, 0.04), 0xf0e8d0, { pos: [0.12, 0.18, 0.19], rot: [0, 0, 0.3] });
  return { geo: b.build(), outline: 0.008, shadow: false };
}

export const INTERIOR_PROPS: Record<string, () => PropDef> = {
  iwSchool: () => wall(0x7a5a3a, 0xe6dec6, 0x5a4a3a),
  iwTheater: () => wall(0x2a1a1a, 0x7a1424, 0xc8a040, { panels: true, band: 0xc8a040, bandY: 0.95 }),
  iwStation: () => wall(0x3a3c40, 0xeceeec, 0x2a2a2e, { grid: 0.33, band: 0x2a8a4a, bandY: 1.25 }),
  iwPrison: () => wall(0x5a5c5e, 0x8e908c, 0x4a4c4e, { band: 0xe0b020, bandY: 0.5, lowerH: 0.4 }),
  iwDorm: () => wall(0x6a4a2e, 0xf2eee2, 0x4a3420, { grid: 0.45 }),
  iwStore: () => wall(0x2a1e16, 0x5a4634, 0x1e1610, { grid: 0.33, band: 0x8a2a2a, bandY: 1.4 }),
  wallPost: () => wallPost(),
  wallPostDark: () => wallPost(0x241c1c),
  wallPostLow: () => wallPost(0x4a4038, H * 0.42 + 0.1),
  wallPostDarkLow: () => wallPost(0x241c1c, H * 0.42 + 0.1),
  trackBed, tatami, exitSign, treasureChest,
  desk, teacherDesk, blackboard, lockerRow, theaterSeats, cinemaScreen, ticketBooth, popcornCart,
  stationPillar, ticketGate, bunkBed, metalTable, futon, chabudai, bookshelf, tvSet, pottedPlant, cursedBox,
};
