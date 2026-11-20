// Curses built on the humanoid skeleton: lanky curses, the Glutton, finger bearers, transfigured humans, Hanami, Jogo, Mahoraga, Rika and the training dummy.
import * as THREE from 'three';
import { G, V3 } from '../geo';
import { RigBuilder, RigModel, resetPose } from '../rig';
import { Humanoid, HumanoidAnimator, darken, lighten } from './humanoid';
import { ModelHandle, wrapHumanoid } from './model';
import { SPECS } from './characters';
import { Rng, TAU, clamp } from '../../core/util';
import { Dims, curseSkeleton, finishHumanoid, eyes, teeth, AnimFn, Creature } from './creatureParts';

export function buildLanky(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.52, torso: 0.6, arm: 0.42, shoulder: 0.2, spread: 0.1 };
  curseSkeleton(r, d);
  const skin = 0x8b927c, dk = 0x4f5446;
  r.part('spine', G.capsuleUp(0.13, 0.4), skin, { scale: [1, 1, 0.75], topColor: lighten(skin, 1.1) });
  r.part('chest', G.ellipsoid(0.2, 0.22, 0.15), skin, { pos: [0, 0.12, 0.03] });
  // ribs
  for (let i = 0; i < 4; i++) r.part('chest', G.torus(0.15 - i * 0.012, 0.012, 4, 14, Math.PI), dk, { pos: [0, 0.2 - i * 0.07, 0.04], rot: [0, 0, Math.PI] });
  r.part('neck', G.cyl(0.05, 0.06, 0.16, 8), skin, { pos: [0, 0.04, 0.03], rot: [0.5, 0, 0] });
  // long egg head with a vertical maw
  r.part('head', G.ellipsoid(0.17, 0.28, 0.2, 14, 12), skin, { pos: [0, 0.2, 0.08], topColor: lighten(skin, 1.15) });
  r.part('head', G.ellipsoid(0.07, 0.17, 0.05, 10, 8), 0x2a0a10, { pos: [0, 0.15, 0.26] });
  teeth(r, 'head', 0, 0.28, 0.27, 0.1, 4, 0.05, true);
  teeth(r, 'head', 0, 0.03, 0.27, 0.1, 4, 0.05, false);
  eyes(r, 'head', [[-0.06, 0.38, 0.22], [0.06, 0.38, 0.22], [0, 0.44, 0.2]], 0.035, 0xffd23a, 1.2);
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.05, 0.045, d.arm), skin);
    r.part('armLow' + s, G.limb(0.045, 0.035, d.arm * 0.9), skin);
    for (let i = 0; i < 3; i++) r.part('hand' + s, G.cone(0.02, 0.16, 5), 0x2a2420, { pos: [(i - 1) * 0.03, -0.08, 0.02], rot: [Math.PI, 0, (i - 1) * 0.2] });
    r.part('legUp' + s, G.limb(0.06, 0.05, d.leg), skin);
    r.part('legLow' + s, G.limb(0.05, 0.04, d.leg), dk);
    r.part('foot' + s, G.ellipsoid(0.06, 0.04, 0.12), dk, { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r);
}

export function buildGlutton(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.3, torso: 0.5, arm: 0.32, shoulder: 0.55, spread: 0.28 };
  curseSkeleton(r, d);
  const skin = 0x6e5c80, belly = 0x9c86a8;
  r.part('spine', G.ellipsoid(0.62, 0.55, 0.52, 20, 16), skin, { pos: [0, 0.22, 0], topColor: lighten(skin, 1.15) });
  r.part('spine', G.ellipsoid(0.48, 0.4, 0.2, 16, 12), belly, { pos: [0, 0.18, 0.36] });
  // gaping belly mouth
  r.part('spine', G.ellipsoid(0.36, 0.2, 0.12, 16, 10), 0x5a0e1c, { pos: [0, 0.16, 0.5], glow: 0.15 });
  teeth(r, 'spine', 0, 0.34, 0.54, 0.62, 9, 0.11, true, 0.12);
  teeth(r, 'spine', 0, -0.02, 0.54, 0.56, 8, 0.1, false, 0.12);
  r.part('spine', G.ellipsoid(0.15, 0.06, 0.12), 0xc23a5a, { pos: [0, 0.06, 0.52] });
  // tiny head with eye cluster
  r.part('head', G.ellipsoid(0.22, 0.18, 0.2, 14, 10), skin, { pos: [0, 0.05, 0.05] });
  eyes(r, 'head', [[-0.1, 0.1, 0.17], [0.1, 0.1, 0.17], [0, 0.17, 0.15], [-0.15, 0.02, 0.12], [0.15, 0.02, 0.12]], 0.045, 0xff4a2a, 1.1);
  for (let i = 0; i < 5; i++) r.part('chest', G.cone(0.06, 0.25, 6), darken(skin, 0.6), { pos: [(i - 2) * 0.18, 0.15, -0.35], rot: [-0.6, 0, (i - 2) * 0.25] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.12, 0.1, d.arm), skin);
    r.part('armLow' + s, G.limb(0.1, 0.09, d.arm), skin);
    for (let i = 0; i < 4; i++) r.part('hand' + s, G.cone(0.035, 0.18, 5), 0x1a1418, { pos: [(i - 1.5) * 0.05, -0.08, 0.03], rot: [Math.PI, 0, (i - 1.5) * 0.15] });
    r.part('hand' + s, G.sphere(0.11, 10, 8), skin);
    r.part('legUp' + s, G.limb(0.16, 0.14, d.leg), skin);
    r.part('legLow' + s, G.limb(0.14, 0.13, d.leg), darken(skin, 0.8));
    r.part('foot' + s, G.ellipsoid(0.15, 0.07, 0.2), darken(skin, 0.6), { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r, 0.025);
}

export function buildWretch(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.4, torso: 0.5, arm: 0.33, shoulder: 0.26, spread: 0.12 };
  curseSkeleton(r, d);
  const skin = 0x54423a, shell = 0x2a2224;
  r.part('spine', G.capsuleUp(0.18, 0.38), skin, { scale: [1, 1, 0.8] });
  r.part('chest', G.ellipsoid(0.27, 0.22, 0.2), skin, { pos: [0, 0.12, 0] });
  r.part('chest', G.ellipsoid(0.3, 0.3, 0.2), shell, { pos: [0, 0.12, -0.14], topColor: 0x4a3a3a });
  for (let i = 0; i < 5; i++) r.part('chest', G.cone(0.05, 0.28, 6), 0xd8ccb0, { pos: [(i - 2) * 0.1, 0.25 - Math.abs(i - 2) * 0.04, -0.28], rot: [-1.0, 0, (i - 2) * 0.2] });
  r.part('head', G.ellipsoid(0.18, 0.17, 0.17), skin, { pos: [0, 0.14, 0.06] });
  eyes(r, 'head', [[0, 0.2, 0.2]], 0.075, 0xe8f04a, 1.2);
  r.part('head', G.ellipsoid(0.13, 0.05, 0.1), 0x200808, { pos: [0, 0.05, 0.16] });
  teeth(r, 'head', 0, 0.08, 0.22, 0.18, 6, 0.04, true, 0.04);
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.08, 0.07, d.arm), skin);
    r.part('armLow' + s, G.limb(0.08, 0.065, d.arm), shell);
    for (let i = 0; i < 3; i++) r.part('hand' + s, G.cone(0.03, 0.2, 5), 0xd8ccb0, { pos: [(i - 1) * 0.045, -0.1, 0.02], rot: [Math.PI, 0, (i - 1) * 0.2] });
    r.part('legUp' + s, G.limb(0.09, 0.08, d.leg), skin);
    r.part('legLow' + s, G.limb(0.08, 0.06, d.leg), shell);
    r.part('foot' + s, G.ellipsoid(0.07, 0.05, 0.13), shell, { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r);
}

export function buildFingerBearer(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.48, torso: 0.6, arm: 0.42, shoulder: 0.3, spread: 0.13 };
  curseSkeleton(r, d);
  const skin = 0x3c4a3e, bone = 0xd9cfb4, robe = 0x23282a;
  r.part('spine', G.capsuleUp(0.2, 0.45), skin, { scale: [1, 1, 0.75] });
  r.part('chest', G.ellipsoid(0.32, 0.25, 0.22), skin, { pos: [0, 0.12, 0], topColor: lighten(skin, 1.2) });
  // bony shoulder plates
  for (const sx of [1, -1]) r.part('chest', G.ellipsoid(0.17, 0.08, 0.17), bone, { pos: [sx * 0.3, 0.3, 0], rot: [0, 0, sx * 0.4] });
  // ragged robe of flesh
  const rag = G.cyl(0.28, 0.55, 0.8, 18, true);
  const p = rag.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.3) p.setY(i, p.getY(i) - ((i * 37) % 7) * 0.035);
  r.part('hips', rag, robe, { pos: [0, -0.35, 0] });
  // avian skull head with four glowing eyes and a beak
  r.part('head', G.ellipsoid(0.2, 0.22, 0.24), skin, { pos: [0, 0.18, 0.04] });
  r.part('head', G.cone(0.1, 0.36, 8), bone, { pos: [0, 0.12, 0.3], rot: [Math.PI / 2 + 0.25, 0, 0] });
  eyes(r, 'head', [[-0.1, 0.28, 0.15], [0.1, 0.28, 0.15], [-0.08, 0.2, 0.2], [0.08, 0.2, 0.2]], 0.04, 0xff3a2e, 1.4);
  for (let i = 0; i < 6; i++) r.part('head', G.cone(0.035, 0.3, 5), bone, { pos: [(i - 2.5) * 0.06, 0.38, -0.08], rot: [-0.9, 0, (i - 2.5) * 0.25] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.08, 0.07, d.arm), skin);
    r.part('armLow' + s, G.limb(0.07, 0.06, d.arm), skin);
    for (let i = 0; i < 4; i++) r.part('hand' + s, G.cone(0.025, 0.24, 5), bone, { pos: [(i - 1.5) * 0.04, -0.12, 0.02], rot: [Math.PI, 0, (i - 1.5) * 0.15] });
    r.part('legUp' + s, G.limb(0.09, 0.08, d.leg), skin);
    r.part('legLow' + s, G.limb(0.08, 0.06, d.leg), skin);
    r.part('foot' + s, G.ellipsoid(0.08, 0.05, 0.16), bone, { pos: [0, 0, 0.06] });
  }
  return finishHumanoid(r, 0.024);
}

export function buildTransfigured(seed: number, bloated = false): ModelHandle {
  const rng = new Rng(seed * 7919 + 13);
  const r = new RigBuilder();
  const d: Dims = bloated
    ? { leg: 0.36, torso: 0.5, arm: 0.3, shoulder: 0.34, spread: 0.17 }
    : { leg: 0.38 + rng.range(-0.04, 0.06), torso: 0.48, arm: 0.28 + rng.range(0, 0.12), shoulder: 0.22, spread: 0.1 };
  curseSkeleton(r, d);
  const skin = rng.pick([0xc9bfb0, 0xb9b0a6, 0xc4b2a2, 0xa9a2b4]);
  const patch = rng.pick([0x8a7a9a, 0x7a8a8a, 0x9a6a6a]);
  const stitch = 0x2a2030;
  if (bloated) {
    r.part('spine', G.ellipsoid(0.42, 0.45, 0.38, 18, 14), skin, { pos: [0, 0.15, 0.04] });
    r.part('spine', G.ellipsoid(0.25, 0.2, 0.1), patch, { pos: [0.1, 0.25, 0.32] });
  } else {
    r.part('spine', G.capsuleUp(0.17, 0.38), skin, { scale: [1, 1, 0.75] });
    r.part('chest', G.ellipsoid(0.24, 0.2, 0.17), skin, { pos: [0, 0.12, 0] });
    r.part('chest', G.ellipsoid(0.12, 0.1, 0.06), patch, { pos: [-0.08, 0.15, 0.14] });
  }
  for (let i = 0; i < 6; i++) r.part('spine', G.box(0.06, 0.01, 0.01), stitch, { pos: [-0.12 + i * 0.05, 0.3, bloated ? 0.43 : 0.15], rot: [0, 0, 0.6] });
  const hs = bloated ? 0.15 : rng.range(0.16, 0.24);
  r.part('head', G.ellipsoid(hs, hs * rng.range(0.9, 1.3), hs, 14, 10), skin, { pos: [rng.range(-0.04, 0.04), hs, 0.04], rot: [0, 0, rng.range(-0.3, 0.3)] });
  // mismatched eyes
  r.part('head', G.sphere(0.035, 8, 6), 0x111111, { pos: [-0.06, hs * 1.1, hs * 0.95] });
  r.part('head', G.sphere(rng.range(0.03, 0.06), 8, 6), 0xd8e070, { pos: [0.07, hs * 1.15, hs * 0.9], glow: 0.6 });
  r.part('head', G.ellipsoid(hs * 0.7, 0.03, 0.03), 0x301018, { pos: [0, hs * 0.55, hs * 0.92], rot: [0, 0, rng.range(-0.3, 0.3)] });
  for (let i = 0; i < 4; i++) r.part('head', G.box(0.008, 0.06, 0.008), stitch, { pos: [-0.02 + i * 0.03, hs * 1.6, hs * 0.6] });
  const armBig = rng.int(0, 1) ? 'L' : 'R';
  for (const s of ['L', 'R']) {
    const big = s === armBig ? (bloated ? 1.6 : 1.5) : 1;
    r.part('armUp' + s, G.limb(0.07 * big, 0.06 * big, d.arm), s === armBig ? patch : skin);
    r.part('armLow' + s, G.limb(0.06 * big, 0.06 * big, d.arm), skin);
    r.part('hand' + s, G.ellipsoid(0.07 * big, 0.08 * big, 0.06 * big), skin, { pos: [0, -0.05, 0] });
    r.part('legUp' + s, G.limb(0.08 * (bloated ? 1.5 : 1), 0.07, d.leg), 0x3a3a44);
    r.part('legLow' + s, G.limb(0.07, 0.06, d.leg), skin);
    r.part('foot' + s, G.ellipsoid(0.07, 0.05, 0.12), skin, { pos: [0, 0, 0.04] });
  }
  return finishHumanoid(r);
}

export function buildHanami(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.5, torso: 0.58, arm: 0.36, shoulder: 0.26, spread: 0.12 };
  curseSkeleton(r, d);
  const wood = 0xa99a82, groove = 0x5a4a3a, cloth = 0xf2efe6;
  const woodFn = (x: number, y: number, z: number, c: THREE.Color) => {
    const s = Math.sin(y * 40 + Math.sin(x * 9) * 2) * 0.5 + 0.5;
    if (s > 0.85) c.setHex(groove);
  };
  r.part('spine', G.capsuleUp(0.17, 0.42), wood, { scale: [1, 1, 0.8], colorFn: woodFn });
  r.part('chest', G.ellipsoid(0.26, 0.24, 0.18), wood, { pos: [0, 0.12, 0], colorFn: woodFn });
  // white cloth wrapping the lower body and left arm
  r.part('hips', G.cyl(0.24, 0.42, 0.95, 16, true), cloth, { pos: [0, -0.42, 0] });
  r.part('hips', G.cyl(0.25, 0.25, 0.12, 16, false), 0x8a2a2a, { pos: [0, 0.04, 0] });
  r.part('head', G.ellipsoid(0.17, 0.2, 0.18), wood, { pos: [0, 0.18, 0.03], colorFn: woodFn });
  // faceless face with a mouth-line and eye sockets that sprout branches
  for (const sx of [1, -1]) {
    r.part('head', G.sphere(0.04, 8, 6), 0x1a120c, { pos: [sx * 0.07, 0.22, 0.16] });
    const base: V3 = [sx * 0.07, 0.24, 0.17];
    r.part('head', G.cone(0.035, 0.42, 6), 0x6b4a2e, { pos: [base[0] + sx * 0.09, base[1] + 0.15, base[2] + 0.08], rot: [-0.6, 0, -sx * 0.55], topColor: 0x8a6a4a });
    r.part('head', G.cone(0.02, 0.2, 5), 0x6b4a2e, { pos: [base[0] + sx * 0.18, base[1] + 0.28, base[2] + 0.03], rot: [-0.2, 0, -sx * 1.1] });
    for (let i = 0; i < 4; i++) r.part('head', G.sphere(0.035, 6, 5), i % 2 ? 0x6ab04a : 0xf4c6d8, { pos: [base[0] + sx * (0.12 + i * 0.05), base[1] + 0.25 + i * 0.03, base[2] + 0.05], glow: 0.2 });
  }
  r.part('head', G.box(0.1, 0.01, 0.01), 0x3a2a1a, { pos: [0, 0.1, 0.18] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.07, 0.065, d.arm), s === 'L' ? cloth : wood, { colorFn: s === 'L' ? undefined : woodFn });
    r.part('armLow' + s, G.limb(0.065, 0.055, d.arm), s === 'L' ? cloth : wood);
    r.part('hand' + s, G.ellipsoid(0.065, 0.08, 0.05), wood, { pos: [0, -0.05, 0] });
    r.part('legUp' + s, G.limb(0.08, 0.07, d.leg), wood);
    r.part('legLow' + s, G.limb(0.07, 0.06, d.leg), wood);
    r.part('foot' + s, G.ellipsoid(0.07, 0.05, 0.13), groove, { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r);
}

export function buildJogo(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.27, torso: 0.42, arm: 0.26, shoulder: 0.22, spread: 0.1 };
  curseSkeleton(r, d);
  const skin = 0xdccab2, robe = 0xece4d0, obi = 0x2a2a2a;
  r.part('spine', G.capsuleUp(0.2, 0.32), robe, { scale: [1, 1, 0.85] });
  r.part('chest', G.ellipsoid(0.26, 0.2, 0.21), robe, { pos: [0, 0.08, 0] });
  r.part('hips', G.cyl(0.22, 0.32, 0.45, 16, true), robe, { pos: [0, -0.18, 0] });
  r.part('spine', G.cyl(0.21, 0.22, 0.08, 14), obi, { pos: [0, 0.03, 0] });
  // volcano head
  r.part('head', G.cyl(0.13, 0.27, 0.42, 18, false), skin, { pos: [0, 0.22, 0.02], topColor: 0x8a7a68 });
  r.part('head', G.cyl(0.11, 0.11, 0.03, 16, false), 0xff5a10, { pos: [0, 0.43, 0.02], glow: 2.0 });
  // single big eye + toothy grin
  r.part('head', G.ellipsoid(0.07, 0.06, 0.03), 0xf6f2e0, { pos: [0, 0.23, 0.22] });
  r.part('head', G.sphere(0.03, 8, 6), 0x111111, { pos: [0, 0.22, 0.245] });
  r.part('head', G.ellipsoid(0.14, 0.035, 0.03), 0x301010, { pos: [0, 0.1, 0.24] });
  teeth(r, 'head', 0, 0.115, 0.255, 0.22, 7, 0.035, true, 0.02);
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.08, 0.075, d.arm), robe);
    r.part('armLow' + s, G.limb(0.08, 0.075, d.arm), robe);
    r.part('hand' + s, G.ellipsoid(0.06, 0.07, 0.05), skin, { pos: [0, -0.04, 0] });
    r.part('legUp' + s, G.limb(0.08, 0.07, d.leg), robe);
    r.part('legLow' + s, G.limb(0.07, 0.06, d.leg), skin);
    r.part('foot' + s, G.ellipsoid(0.07, 0.04, 0.11), 0x3a2a1a, { pos: [0, 0, 0.04] });
  }
  return finishHumanoid(r);
}

export function buildMahoraga(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.46, torso: 0.58, arm: 0.36, shoulder: 0.3, spread: 0.13 };
  curseSkeleton(r, d);
  const skin = 0xe9e5dc, dk = 0xa9a49a, gold = 0xd8b04a;
  r.part('spine', G.capsuleUp(0.2, 0.45), skin, { scale: [1, 1, 0.8] });
  r.part('chest', G.ellipsoid(0.34, 0.27, 0.23), skin, { pos: [0, 0.12, 0], topColor: 0xffffff });
  for (let i = 0; i < 3; i++) r.part('spine', G.box(0.3 - i * 0.02, 0.03, 0.03), dk, { pos: [0, 0.1 + i * 0.08, 0.16] });
  r.part('hips', G.cyl(0.24, 0.36, 0.4, 14, true), 0x2a2a30, { pos: [0, -0.12, 0] });
  r.part('head', G.ellipsoid(0.16, 0.19, 0.17), skin, { pos: [0, 0.17, 0.03] });
  // wing-like head fins over the eyes
  for (const sx of [1, -1]) for (let i = 0; i < 2; i++) {
    r.part('head', G.ellipsoid(0.04, 0.16, 0.02), skin, { pos: [sx * (0.1 + i * 0.05), 0.25 - i * 0.06, 0.16], rot: [0.2, 0, sx * (0.9 + i * 0.3)] });
  }
  r.part('head', G.box(0.08, 0.02, 0.02), 0x111111, { pos: [0, 0.08, 0.17] });
  // dharma wheel floating above
  r.part('head', G.torus(0.3, 0.025, 6, 24), gold, { pos: [0, 0.62, -0.05], glow: 0.3 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    r.part('head', G.box(0.02, 0.3, 0.02), gold, { pos: [Math.sin(a) * 0.15, 0.62 + Math.cos(a) * 0.15, -0.05], rot: [0, 0, -a], glow: 0.2 });
    r.part('head', G.sphere(0.04, 6, 4), gold, { pos: [Math.sin(a) * 0.33, 0.62 + Math.cos(a) * 0.33, -0.05], glow: 0.3 });
  }
  r.part('head', G.box(0.04, 0.3, 0.04), dk, { pos: [0, 0.4, -0.05] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.1, 0.085, d.arm), skin);
    r.part('armLow' + s, G.limb(0.085, 0.07, d.arm), skin);
    r.part('hand' + s, G.ellipsoid(0.07, 0.09, 0.06), skin, { pos: [0, -0.05, 0] });
    r.part('legUp' + s, G.limb(0.11, 0.09, d.leg), skin);
    r.part('legLow' + s, G.limb(0.09, 0.07, d.leg), skin);
    r.part('foot' + s, G.ellipsoid(0.08, 0.05, 0.15), dk, { pos: [0, 0, 0.05] });
  }
  // Sword of Extermination fused to the right forearm
  r.part('armLowR', G.box(0.06, 0.95, 0.02), 0xdedad2, { pos: [0, -0.7, 0.05], glow: 0.15 });
  r.part('armLowR', G.cone(0.03, 0.2, 4), 0xdedad2, { pos: [0, -1.27, 0.05], rot: [Math.PI, 0, 0] });
  return finishHumanoid(r, 0.024);
}

/** Rika Orimoto, the Queen of Curses: a towering pale body, a ragged mane, a mouth full of teeth, long arms, and the ring. */
export function buildRika(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.4, torso: 0.62, arm: 0.5, shoulder: 0.36, spread: 0.15 };
  curseSkeleton(r, d);
  const skin = 0xe6e2ea, dk = 0x9a94a6, hair = 0x1a1820, mouth = 0x2a0a14, teeth = 0xfffaf2;
  r.part('spine', G.capsuleUp(0.24, 0.5), skin, { scale: [1.1, 1, 0.85] });
  r.part('chest', G.ellipsoid(0.42, 0.32, 0.28), skin, { pos: [0, 0.12, 0], topColor: 0xffffff });
  // a ridge of bony plates down the back
  for (let i = 0; i < 5; i++) r.part('chest', G.cone(0.05, 0.18, 5), dk, { pos: [0, 0.3 - i * 0.12, -0.26], rot: [-0.9, 0, 0] });
  r.part('hips', G.cyl(0.26, 0.32, 0.34, 12, true), dk, { pos: [0, -0.1, 0] });
  // the head: wide, with a grin that runs ear to ear
  r.part('head', G.ellipsoid(0.26, 0.24, 0.24), skin, { pos: [0, 0.2, 0.02] });
  r.part('head', G.ellipsoid(0.2, 0.08, 0.06), mouth, { pos: [0, 0.1, 0.2] });
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.042;
    r.part('head', G.cone(0.016, 0.06, 4), teeth, { pos: [x, 0.15, 0.24 - Math.abs(x) * 0.3], rot: [Math.PI, 0, 0] });
    r.part('head', G.cone(0.016, 0.055, 4), teeth, { pos: [x, 0.05, 0.24 - Math.abs(x) * 0.3] });
  }
  for (const sx of [1, -1]) r.part('head', G.sphere(0.035, 8, 6), 0xff6ab0, { pos: [sx * 0.1, 0.27, 0.21], glow: 1.6 });
  // a ragged mane of black hair
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + i * 0.3;
    r.part('head', G.ellipsoid(0.07, 0.24, 0.06), hair, { pos: [Math.sin(a) * 0.24, 0.3 + Math.cos(a) * 0.06, -0.08 - Math.cos(a) * 0.05], rot: [0.5, 0, -a * 0.8] });
  }
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.12, 0.1, d.arm), skin);
    r.part('armLow' + s, G.limb(0.1, 0.085, d.arm), skin);
    r.part('hand' + s, G.ellipsoid(0.12, 0.13, 0.08), skin, { pos: [0, -0.08, 0] });
    for (let k = 0; k < 4; k++) r.part('hand' + s, G.cone(0.022, 0.16, 4), dk, { pos: [(k - 1.5) * 0.05, -0.24, 0.02], rot: [Math.PI, 0, 0] });
    r.part('legUp' + s, G.limb(0.12, 0.1, d.leg), skin);
    r.part('legLow' + s, G.limb(0.1, 0.08, d.leg), dk);
    r.part('foot' + s, G.ellipsoid(0.09, 0.05, 0.16), dk, { pos: [0, 0, 0.05] });
  }
  // the ring that bound her to Yuta
  r.part('handL', G.torus(0.04, 0.012, 6, 14), 0xe8ecf4, { pos: [0.03, -0.16, 0.02], rot: [Math.PI / 2, 0, 0], glow: 0.6 });
  return finishHumanoid(r, 0.026);
}

export function buildDummy(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.22, torso: 0.4, arm: 0.2, shoulder: 0.26, spread: 0.12 };
  curseSkeleton(r, d);
  const fab = 0xb38d5e, patch = 0x7a5a8a;
  r.part('spine', G.ellipsoid(0.3, 0.3, 0.25), fab, { pos: [0, 0.15, 0] });
  r.part('spine', G.ellipsoid(0.1, 0.08, 0.03), patch, { pos: [0.1, 0.25, 0.24] });
  r.part('head', G.ellipsoid(0.32, 0.28, 0.28), fab, { pos: [0, 0.22, 0] });
  for (const sx of [1, -1]) {
    r.part('head', G.cyl(0.05, 0.05, 0.02, 10), 0x1a1a1a, { pos: [sx * 0.12, 0.26, 0.27], rot: [Math.PI / 2, 0, 0] });
    r.part('head', G.ellipsoid(0.07, 0.1, 0.05), fab, { pos: [sx * 0.22, 0.48, 0] });
  }
  for (let i = 0; i < 5; i++) r.part('head', G.box(0.01, 0.04, 0.01), 0x3a2a1a, { pos: [-0.08 + i * 0.04, 0.12, 0.27] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.08, 0.07, d.arm), fab);
    r.part('armLow' + s, G.limb(0.07, 0.07, d.arm), fab);
    r.part('legUp' + s, G.limb(0.09, 0.08, d.leg), fab);
    r.part('legLow' + s, G.limb(0.08, 0.08, d.leg), fab);
    r.part('foot' + s, G.ellipsoid(0.08, 0.05, 0.1), darken(fab, 0.7), { pos: [0, 0, 0.03] });
  }
  return finishHumanoid(r);
}
