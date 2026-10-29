// Character appearance specs for every sorcerer, NPC and human boss.
import * as THREE from 'three';
import { G } from '../geo';
import { RigBuilder } from '../rig';
import { buildHumanoid, Humanoid, HumanoidAnimator, HumanoidSpec } from './humanoid';

const NAVY = 0x1b1f33;
const GOLD = 0xe0b84e;

export const SPECS: Record<string, HumanoidSpec> = {
  yuji: {
    skin: 0xf3c9a6, hair: 0xf28da0, hairStyle: 'yuji', eyes: 0x7a4128, outfit: 'uniformHood',
    top: NAVY, bottom: NAVY, accent: GOLD, shoes: 0xd23a3a, inner: 0xc3262f, bulk: 1.05,
  },
  megumi: {
    skin: 0xf1d3b8, hair: 0x29324e, hairStyle: 'megumi', eyes: 0x2f5866, outfit: 'uniform',
    top: NAVY, bottom: NAVY, accent: GOLD, shoes: 0x16161a,
  },
  nobara: {
    skin: 0xf7d5bb, hair: 0xd9773a, hairStyle: 'nobara', eyes: 0x8c5a2e, outfit: 'uniformSkirt',
    top: NAVY, bottom: NAVY, accent: GOLD, shoes: 0x4a2e22, height: 0.95, bulk: 0.9, extras: ['hairpin'],
  },
  gojo: {
    skin: 0xf6dcc8, hair: 0xf3f6fb, hairStyle: 'gojo', eyes: 0x7fdcff, outfit: 'uniformHigh',
    top: 0x12141f, bottom: 0x12141f, accent: 0x12141f, shoes: 0x0e0e12, glasses: 'blindfold', height: 1.14,
  },
  nanami: {
    skin: 0xf0cfb0, hair: 0xe9d07b, hairStyle: 'nanami', eyes: 0x5a6a3a, outfit: 'suit',
    top: 0xd2c9ab, bottom: 0xd2c9ab, accent: 0xd2c9ab, shoes: 0x3a2a22, inner: 0xc7973a,
    glasses: 'goggles', height: 1.1, bulk: 1.18, extras: ['tie', 'leopardTie'],
  },
  maki: {
    skin: 0xf2d4b8, hair: 0x2b4a3c, hairStyle: 'maki', eyes: 0x6a5a2a, outfit: 'uniform',
    top: NAVY, bottom: NAVY, accent: GOLD, shoes: 0x1a1a1e, glasses: 'round', extras: ['backPolearm'],
  },
  inumaki: {
    skin: 0xf3d8c2, hair: 0xe9e6de, hairStyle: 'inumaki', eyes: 0x7a6aa0, outfit: 'uniformHigh',
    top: NAVY, bottom: NAVY, accent: NAVY, shoes: 0x1a1a1e, extras: ['collar', 'zipper'], height: 0.96,
  },
  shoko: {
    skin: 0xf1d6c0, hair: 0x5a3b2c, hairStyle: 'shoko', eyes: 0x4a3a32, outfit: 'labcoat',
    top: 0xeeeeea, bottom: 0x24242a, accent: 0xdddddd, shoes: 0x1e1e22, inner: 0x2a2a30, extras: ['eyeBags', 'mole'],
  },
  yaga: {
    skin: 0xd9b090, hair: 0x2a2420, hairStyle: 'yaga', eyes: 0x222222, outfit: 'casual',
    top: 0x2a2a2e, bottom: 0x22222a, accent: 0x2a2a2e, shoes: 0x111111, glasses: 'shades', height: 1.12, bulk: 1.4, extras: ['goatee'],
  },
  ijichi: {
    skin: 0xf0d4bc, hair: 0x2a2620, hairStyle: 'ijichi', eyes: 0x333333, outfit: 'suit',
    top: 0x1f1f25, bottom: 0x1f1f25, accent: 0x1f1f25, shoes: 0x111111, inner: 0x2c2c38,
    glasses: 'round', bulk: 0.9, extras: ['tie'],
  },
  todo: {
    skin: 0xd8a882, hair: 0x2c201a, hairStyle: 'todo', eyes: 0x3a2a20, outfit: 'tank',
    top: 0xf0f0ea, bottom: 0x2c2c3a, accent: 0x2c2c3a, shoes: 0x16161a, height: 1.16, bulk: 1.5, extras: ['facescar'],
  },
  meimei: {
    skin: 0xf4dccb, hair: 0xe4e0db, hairStyle: 'meimei', eyes: 0x6a6a7a, outfit: 'robe',
    top: 0x15151b, bottom: 0x15151b, accent: 0x15151b, shoes: 0x0f0f12, height: 1.06,
  },
  junpei: {
    skin: 0xefd6c4, hair: 0x2a2a34, hairStyle: 'junpei', eyes: 0x3a3a48, outfit: 'casual',
    top: 0x23232b, bottom: 0x23232b, accent: 0x23232b, shoes: 0x2a2a30, extras: ['eyeBags'],
  },
  miwa: {
    skin: 0xf6dccb, hair: 0x5f8fd8, hairStyle: 'miwa', eyes: 0x3a5a9a, outfit: 'suit',
    top: 0x22242c, bottom: 0x22242c, accent: 0x22242c, shoes: 0x111111, inner: 0x3a5a9a, height: 0.95, bulk: 0.88,
  },
  mahito: {
    skin: 0xdcdcd2, hair: 0x7f8fa6, hairStyle: 'mahito', eyes: 0x7ac0dc, outfit: 'patchwork',
    top: 0x2b2a35, bottom: 0x2b2a35, accent: 0x2b2a35, shoes: 0x1a1a20, extras: ['stitches', 'cursedEyes'], height: 1.04,
  },
  sukuna: {
    skin: 0xf0c4a2, hair: 0xe57b90, hairStyle: 'yuji', eyes: 0xff2a3a, outfit: 'kimono',
    top: 0xeeeae0, bottom: 0xeeeae0, accent: 0x111111, shoes: 0x1a1a1a, height: 1.35, bulk: 1.35,
    extras: ['sukunaMarks', 'cursedEyes'],
  },
  sasaki: {
    skin: 0xf6dccb, hair: 0x1e1a22, hairStyle: 'bob', eyes: 0x3a2a2a, outfit: 'uniformSkirt',
    top: 0x262a3a, bottom: 0x262a3a, accent: 0xd8d8d0, shoes: 0x3a2a22, height: 0.94, bulk: 0.88,
  },
  iguchi: {
    skin: 0xf0d0b2, hair: 0x2a2018, hairStyle: 'short', eyes: 0x333333, outfit: 'uniformHigh',
    top: 0x1c1c26, bottom: 0x1c1c26, accent: 0xd8d8d0, shoes: 0x222222, glasses: 'round', extras: ['bandage'],
  },
  choso: {
    skin: 0xe8c8b0, hair: 0x1a1418, hairStyle: 'choso', eyes: 0x6a3a2a, outfit: 'robe',
    top: 0x3a2836, bottom: 0x2a1e26, accent: 0xe8e0d8, shoes: 0x16121a, inner: 0xe8e0d8, height: 1.1, bulk: 1.08,
    extras: ['bloodStripe'],
  },
  kenjaku: {
    skin: 0xf0d4bc, hair: 0x1a1a20, hairStyle: 'geto', eyes: 0x4a3a2a, outfit: 'kimono',
    top: 0x2a2a2e, bottom: 0x2a2a2e, accent: 0x8a7a5a, shoes: 0x111111, height: 1.12, bulk: 1.05, extras: ['browStitch'],
  },
  tsukamoto: {
    skin: 0xc89a6a, hair: 0x6a4a2a, hairStyle: 'bald', eyes: 0x111111, outfit: 'patchwork',
    top: 0x8a6a4a, bottom: 0x6a4a2a, accent: 0x6a4a2a, shoes: 0x4a3420, height: 0.55, head: 1.7, bulk: 1.35,
    extras: ['stitches', 'gloves'],
  },
  mechamaru: {
    // Ultimate Mechamaru: a heavy steel puppet body with a visor glow
    skin: 0x8c939e, hair: 0x5a606a, hairStyle: 'bald', eyes: 0xffd23a, outfit: 'tank',
    top: 0x34465a, bottom: 0x26303c, accent: 0xffd23a, shoes: 0x1a1f26, height: 1.2, bulk: 1.5, head: 1.12,
    extras: ['mask', 'gloves', 'cursedEyes'],
  },
  grandpa: {
    skin: 0xe6c4a4, hair: 0xc8c4bc, hairStyle: 'short', eyes: 0x3a3030, outfit: 'casual',
    top: 0xc8d6de, bottom: 0xb8c6ce, accent: 0xc8d6de, shoes: 0x5a5a5a, height: 0.96, bulk: 0.95,
  },
  yuta: {
    skin: 0xf1d6c2, hair: 0x15151c, hairStyle: 'yuta', eyes: 0x2a2a3a, outfit: 'uniform',
    top: 0xeeeef0, bottom: 0xeeeef0, accent: 0xd8d8de, shoes: 0x1a1a1e, height: 1.04, extras: ['eyeBags', 'katana', 'ring'],
  },
  naoya: {
    skin: 0xf0d4bc, hair: 0xe8d48a, hairStyle: 'naoya', eyes: 0x5a3a2a, outfit: 'kimono',
    top: 0x2a2a34, bottom: 0x3a3a48, accent: 0xd8c8a0, shoes: 0x111111, height: 1.08, extras: ['piercings'],
  },
  higuruma: {
    skin: 0xe2c0a0, hair: 0x1e1a18, hairStyle: 'short', eyes: 0x2a2a2a, outfit: 'suit',
    top: 0x24262e, bottom: 0x24262e, accent: 0xd8b04a, shoes: 0x111111, inner: 0xe8e4dc, height: 1.1, extras: ['tie', 'stubble', 'eyeBags', 'gavel'],
  },
  hakari: {
    skin: 0xf0d0b4, hair: 0xb8b4a8, hairStyle: 'pompadour', eyes: 0x4a3a2a, outfit: 'uniformHigh',
    top: 0x1a1c2a, bottom: 0x1a1c2a, accent: GOLD, shoes: 0x16161a, height: 1.12, bulk: 1.12,
  },
  kashimo: {
    skin: 0xf2dcc8, hair: 0x9adfff, hairStyle: 'kashimo', eyes: 0x3a6a9a, outfit: 'robe',
    top: 0x2a3448, bottom: 0x1e2636, accent: 0x6adfff, shoes: 0x16161a, inner: 0xe8e8f0, height: 1.06, extras: ['staff', 'cursedEyes'],
  },
  ishigori: {
    skin: 0xdcb08a, hair: 0x15151a, hairStyle: 'pompadour', eyes: 0x2a2a2a, outfit: 'tank',
    top: 0x2e3440, bottom: 0x2a2e38, accent: 0x2a2e38, shoes: 0x111111, height: 1.22, bulk: 1.65, extras: ['scars'],
  },
  uro: {
    skin: 0xf2dac8, hair: 0x2a2030, hairStyle: 'uro', eyes: 0x5a4a6a, outfit: 'robe',
    top: 0x2a2236, bottom: 0x1e1828, accent: 0x9a8acc, shoes: 0x14121a, inner: 0xd8d0e8, height: 1.04, bulk: 0.92,
  },
  uraume: {
    skin: 0xf4e8e0, hair: 0xf0f2f8, hairStyle: 'bob', eyes: 0xc83a4a, outfit: 'kimono',
    top: 0xe8ecf4, bottom: 0xc8d0e0, accent: 0x9ab0d0, shoes: 0x2a2a34, height: 1.04, bulk: 0.9, extras: ['cursedEyes'],
  },
  mai: {
    skin: 0xf2d4b8, hair: 0x1e2a24, hairStyle: 'mai', eyes: 0x6a5a2a, outfit: 'uniformSkirt',
    top: 0x22242e, bottom: 0x22242e, accent: GOLD, shoes: 0x1a1a1e, height: 0.96, bulk: 0.88,
  },
  hei: {
    skin: 0xe4c4a6, hair: 0x1a1612, hairStyle: 'short', eyes: 0x2a2020, outfit: 'kimono',
    top: 0x22222a, bottom: 0x1a1a20, accent: 0x8a2a2a, shoes: 0x111111, height: 1.08, bulk: 1.15, extras: ['katana', 'mask'],
  },
  heiB: {
    skin: 0xdcbc9c, hair: 0x2a2018, hairStyle: 'bald', eyes: 0x2a2020, outfit: 'robe',
    top: 0x2a2a30, bottom: 0x1a1a20, accent: 0x9a7a3a, shoes: 0x111111, inner: 0x8a2a2a, height: 1.04, bulk: 1.05, extras: ['goatee'],
  },
  cgBrawler: {
    skin: 0xe8c4a2, hair: 0x6a3a1a, hairStyle: 'naoya', eyes: 0x2a2020, outfit: 'casual',
    top: 0x6a2a2a, bottom: 0x2a2e3a, accent: 0x6a2a2a, shoes: 0xe8e8e8, height: 1.06, bulk: 1.25, extras: ['scars', 'gloves'],
  },
  cgCaster: {
    skin: 0xf0d4bc, hair: 0x2a3a2a, hairStyle: 'junpei', eyes: 0x3a6a3a, outfit: 'casual',
    top: 0x2a3a2e, bottom: 0x1e2224, accent: 0x2a3a2e, shoes: 0x2a2a2a, extras: ['eyeBags', 'scarf'], inner: 0xc8a03a,
  },
  sukunaHeian: {
    skin: 0xf0c4a2, hair: 0xe57b90, hairStyle: 'yuji', eyes: 0xff2a3a, outfit: 'kimono',
    top: 0xf2eee4, bottom: 0x1a1a1e, accent: 0x111111, shoes: 0x1a1a1a, inner: 0x111111, height: 1.48, bulk: 1.55,
    extras: ['sukunaMarks', 'cursedEyes', 'secondFace', 'bellyMouth'],
  },
  // ---- Unlockable sorcerers ----
  sukunaYuji: {
    skin: 0xf3c9a6, hair: 0xf28da0, hairStyle: 'sukunaBack', eyes: 0xff2a3a, outfit: 'uniformHood',
    top: NAVY, bottom: NAVY, accent: GOLD, shoes: 0xd23a3a, inner: 0xc3262f, bulk: 1.08, extras: ['sukunaMarks', 'cursedEyes', 'wristMarks'],
  },
  sukunaMegumi: {
    skin: 0xf1d3b8, hair: 0x29324e, hairStyle: 'megumi', eyes: 0xff2a3a, outfit: 'kimono',
    top: 0xf2eee4, bottom: 0x1a1a1e, accent: 0x111111, shoes: 0x16161a, inner: 0x111111, extras: ['sukunaMarks', 'cursedEyes', 'wristMarks'],
  },
  moduloYuji: {
    skin: 0xefc29e, hair: 0xf28da0, hairStyle: 'yuji', eyes: 0x7a4128, outfit: 'robe',
    top: 0x1c1e26, bottom: 0x1a1a20, accent: 0xc3262f, shoes: 0x2a2226, inner: 0xc3262f, height: 1.06, bulk: 1.15, extras: ['facescar', 'eyeBags', 'wristMarks'],
  },
  // ---- Memories and the open world ----
  toji: {
    skin: 0xe8c4a2, hair: 0x141418, hairStyle: 'toji', eyes: 0x3a4a3a, outfit: 'casual',
    top: 0x1a1a1e, bottom: 0xd8d4cc, accent: 0x1a1a1e, shoes: 0x1a1a1a, height: 1.14, bulk: 1.32, extras: ['lipScar', 'wormCurse'],
  },
  geto: {
    skin: 0xf0d4bc, hair: 0x1a1a20, hairStyle: 'geto', eyes: 0x4a3a2a, outfit: 'robe',
    top: 0x1a1a1e, bottom: 0x1a1a1e, accent: 0x9a7a3a, shoes: 0x111111, inner: 0xd8d0c0, height: 1.14, bulk: 1.08, extras: ['kesa'],
  },
  kuchisake: {
    skin: 0xf4ece4, hair: 0x101014, hairStyle: 'long', eyes: 0x8a0d18, outfit: 'robe',
    top: 0xc8b89a, bottom: 0x2a2a2a, accent: 0xc8b89a, shoes: 0x2a1a1a, inner: 0x8a1a1a, height: 1.25, bulk: 0.9, extras: ['surgicalMask', 'scissors', 'cursedEyes'],
  },
  kamo: {
    skin: 0xf2dcc8, hair: 0x1a1a1e, hairStyle: 'kamo', eyes: 0x3a2a2a, outfit: 'robe',
    top: 0x2a2a34, bottom: 0x2a2a34, accent: 0xd8c8a0, shoes: 0x111111, inner: 0xe8e0d0, height: 1.06,
  },
  monk: {
    skin: 0xe0c0a0, hair: 0xd8d0c4, hairStyle: 'bald', eyes: 0x2a2420, outfit: 'robe',
    top: 0x22222a, bottom: 0x22222a, accent: 0xc8a050, shoes: 0x3a2a22, inner: 0xe8e0d0, height: 0.98, bulk: 1.05, extras: ['kesa', 'eyeBags'],
  },
  farmer: {
    skin: 0xd8b090, hair: 0x8a8278, hairStyle: 'short', eyes: 0x2a2420, outfit: 'casual',
    top: 0x6a7a4a, bottom: 0x3a3a2e, accent: 0x6a7a4a, shoes: 0x4a3a2a, height: 0.97, extras: ['stubble'],
  },
  tengen: {
    skin: 0xece8f2, hair: 0xece8f2, hairStyle: 'bald', eyes: 0x2a2a3a, outfit: 'robe',
    top: 0xf0ece4, bottom: 0xe0dcd4, accent: 0xc8b070, shoes: 0x8a7a6a, inner: 0xc8b070, head: 1.15, extras: ['fourEyes'],
  },
  civilianA: { skin: 0xf0d0b0, hair: 0x2a2420, hairStyle: 'short', eyes: 0x333333, outfit: 'casual', top: 0x5a6a8a, bottom: 0x2a2e3a, accent: 0x5a6a8a, shoes: 0x333333 },
  civilianB: { skin: 0xe8c8a8, hair: 0x6a4a30, hairStyle: 'long', eyes: 0x4a3020, outfit: 'casual', top: 0xb05a6a, bottom: 0x302a2a, accent: 0xb05a6a, shoes: 0x3a2a2a, bulk: 0.9 },
  civilianC: { skin: 0xd8b090, hair: 0x111111, hairStyle: 'bun', eyes: 0x222222, outfit: 'suit', top: 0x3a3a40, bottom: 0x3a3a40, accent: 0x3a3a40, shoes: 0x111111, inner: 0x7a2a2a, extras: ['tie'] },
  student: { skin: 0xf0d4bc, hair: 0x2a2018, hairStyle: 'short', eyes: 0x333333, outfit: 'uniformHigh', top: 0x1a1a22, bottom: 0x1a1a22, accent: GOLD, shoes: 0x222222 },
};

export function buildCharacter(id: string): Humanoid {
  if (id === 'panda') return buildPanda();
  const spec = SPECS[id === 'heianSukuna' ? 'sukunaHeian' : id] ?? SPECS.civilianA;
  const h = buildHumanoid(spec);
  if (id === 'sukuna' || id === 'sukunaHeian' || id === 'heianSukuna') addSukunaArms(h);
  return h;
}

/** Panda: same skeleton as a humanoid so the shared animator drives him. */
function buildPanda(): Humanoid {
  const r = new RigBuilder();
  const hipY = 0.78;
  r.bone('hips', 'root', [0, hipY, 0]);
  r.bone('spine', 'hips', [0, 0.05, 0]);
  r.bone('chest', 'spine', [0, 0.3, 0]);
  r.bone('neck', 'chest', [0, 0.32, 0]);
  r.bone('head', 'neck', [0, 0.05, 0]);
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('armUp' + s, 'chest', [sx * 0.38, 0.2, 0]);
    r.bone('armLow' + s, 'armUp' + s, [0, -0.28, 0]);
    r.bone('hand' + s, 'armLow' + s, [0, -0.26, 0]);
    r.bone('legUp' + s, 'hips', [sx * 0.2, -0.05, 0]);
    r.bone('legLow' + s, 'legUp' + s, [0, -0.36, 0]);
    r.bone('foot' + s, 'legLow' + s, [0, -0.3, 0]);
  }
  const W = 0xf4f2ee, K = 0x18181c;
  r.part('spine', G.ellipsoid(0.42, 0.42, 0.36, 18, 14), W, { pos: [0, 0.18, 0] });
  r.part('chest', G.ellipsoid(0.46, 0.3, 0.38, 18, 12), K, { pos: [0, 0.12, 0] });
  r.part('neck', G.cyl(0.18, 0.22, 0.1, 12), W);
  r.part('head', G.ellipsoid(0.3, 0.27, 0.27, 18, 14), W, { pos: [0, 0.24, 0] });
  for (const sx of [1, -1]) {
    r.part('head', G.sphere(0.1, 10, 8), K, { pos: [sx * 0.22, 0.46, -0.02] });
    r.part('head', G.ellipsoid(0.075, 0.06, 0.03, 10, 6), K, { pos: [sx * 0.11, 0.27, 0.24], rot: [0, 0, sx * 0.4] });
    r.part('head', G.sphere(0.022, 6, 5), 0xffffff, { pos: [sx * 0.11, 0.28, 0.265], glow: 0.1 });
  }
  r.part('head', G.ellipsoid(0.11, 0.08, 0.09, 10, 8), W, { pos: [0, 0.16, 0.22] });
  r.part('head', G.ellipsoid(0.04, 0.03, 0.03, 8, 6), K, { pos: [0, 0.2, 0.31] });
  // scar
  r.part('head', G.box(0.012, 0.12, 0.012), 0x8a6a6a, { pos: [-0.16, 0.3, 0.2], rot: [0, 0, 0.4] });
  for (const s of ['L', 'R'] as const) {
    r.part('armUp' + s, G.limb(0.13, 0.12, 0.28), K);
    r.part('armLow' + s, G.limb(0.12, 0.11, 0.24), K);
    r.part('hand' + s, G.sphere(0.12, 10, 8), K, { pos: [0, -0.05, 0] });
    r.part('legUp' + s, G.limb(0.16, 0.14, 0.36), K);
    r.part('legLow' + s, G.limb(0.14, 0.13, 0.28), K);
    r.part('foot' + s, G.ellipsoid(0.14, 0.08, 0.18, 10, 6), K, { pos: [0, 0, 0.04] });
  }
  const m = r.build({ outline: 0.02 }) as Humanoid;
  m.spec = SPECS.civilianA;
  m.hand = m.bones.handR;
  m.handL = m.bones.handL;
  m.anim = new HumanoidAnimator(m);
  return m;
}

/** Heian-era Sukuna gets a second pair of arms; we mirror the main arm poses onto them. */
function addSukunaArms(h: Humanoid) {
  const extra = new THREE.Group();
  const mat = h.mesh.material as THREE.Material;
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    const r = new RigBuilder();
    r.bone('up', 'root', [0, 0, 0]);
    r.bone('low', 'up', [0, -0.35, 0]);
    r.part('up', G.limb(0.09, 0.08, 0.35), 0xeeeae0);
    r.part('low', G.limb(0.08, 0.065, 0.3), 0xf0c4a2);
    r.part('low', G.ellipsoid(0.07, 0.085, 0.055), 0xf0c4a2, { pos: [0, -0.33, 0] });
    for (let i = 0; i < 2; i++) r.part('low', G.box(0.13, 0.012, 0.012), 0x111111, { pos: [0, -0.12 - i * 0.06, 0.06] });
    const arm = r.build({ outline: 0.02 });
    arm.root.position.set(sx * 0.3, -0.12, -0.02);
    arm.root.userData.side = s;
    arm.root.userData.rig = arm;
    h.bones.chest.add(arm.root);
    void mat;
  }
  void extra;
  const orig = h.anim.update.bind(h.anim);
  h.anim.update = (dt: number) => {
    orig(dt);
    h.bones.chest.children.forEach(c => {
      const rig = c.userData.rig;
      if (!rig) return;
      const s = c.userData.side as 'L' | 'R';
      const src = h.bones['armUp' + s], srcLow = h.bones['armLow' + s];
      rig.bones.up.rotation.set(src.rotation.x * 0.7 - 0.4, 0, src.rotation.z + (s === 'L' ? 0.5 : -0.5));
      rig.bones.low.rotation.set(srcLow.rotation.x * 0.8 - 0.5, 0, 0);
    });
  };
}
