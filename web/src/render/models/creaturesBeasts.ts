// Curses and shikigami with their own rigs: fly heads, crawlers, wombs, quadrupeds, the Great Serpent, Nue, toads, leeches, roots, hands, fish, pumpkins and Dagon.
import * as THREE from 'three';
import { G, V3 } from '../geo';
import { RigBuilder, RigModel, resetPose } from '../rig';
import { Humanoid, HumanoidAnimator, darken, lighten } from './humanoid';
import { ModelHandle, wrapHumanoid } from './model';
import { SPECS } from './characters';
import { Rng, TAU, clamp } from '../../core/util';
import { Dims, curseSkeleton, finishHumanoid, eyes, teeth, AnimFn, Creature } from './creatureParts';

export function flyHead(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.2, 0]);
  r.bone('head', 'body', [0, 0, 0]);
  r.bone('jaw', 'body', [0, -0.08, 0.08]);
  r.bone('wingL', 'body', [0.18, 0.15, -0.1]);
  r.bone('wingR', 'body', [-0.18, 0.15, -0.1]);
  const skin = 0x9aa38c;
  r.part('body', G.ellipsoid(0.3, 0.27, 0.28, 16, 12), skin, { topColor: lighten(skin, 1.15) });
  eyes(r, 'body', [[0, 0.06, 0.24]], 0.11, 0xf0e050, 1.2);
  r.part('body', G.ellipsoid(0.07, 0.04, 0.05), 0x7a8270, { pos: [0, 0.2, 0.2] });
  r.part('jaw', G.ellipsoid(0.2, 0.08, 0.16), darken(skin, 0.85), { pos: [0, -0.04, 0.02] });
  r.part('jaw', G.ellipsoid(0.15, 0.04, 0.1), 0x400c14, { pos: [0, 0.01, 0.06] });
  teeth(r, 'jaw', 0, 0.03, 0.15, 0.24, 6, 0.04, false, 0.04);
  for (let i = 0; i < 3; i++) r.part('body', G.limb(0.02, 0.012, 0.18), darken(skin, 0.7), { pos: [(i - 1) * 0.08, -0.2, -0.05], rot: [0.3, 0, 0] });
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    r.part('wing' + s, G.ellipsoid(0.32, 0.015, 0.14, 12, 4), 0xc8d4dc, { pos: [sx * 0.3, 0, -0.04], rot: [0, sx * 0.3, 0], glow: 0.15 });
    r.part('wing' + s, G.ellipsoid(0.2, 0.012, 0.1, 10, 4), 0xb8c4cc, { pos: [sx * 0.22, -0.03, -0.16], rot: [0, sx * -0.4, 0], glow: 0.1 });
  }
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const flap = Math.sin(c.t * 38);
    b.wingL.rotation.z = flap * 0.7;
    b.wingR.rotation.z = -flap * 0.7;
    b.body.position.y += Math.sin(c.t * 3) * 0.08;
    b.body.rotation.x = c.speed > 0.3 ? 0.25 : 0;
    const a = c.atk;
    b.jaw.rotation.x = 0.1 + Math.max(0, a) * 0.8;
    b.body.position.z += a * 0.35;
    if (c.hitT > 0) b.body.rotation.x -= c.hitT * 2;
  });
}

export function crawler(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.38, 0]);
  const legs: string[] = [];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? 1 : -1;
    const k = i % 3;
    const n = 'leg' + i;
    r.bone(n, 'body', [side * 0.26, -0.05, 0.18 - k * 0.18], [0, 0, side * 1.1]);
    r.bone(n + 'b', n, [0, -0.3, 0], [0, 0, side * -0.9]);
    legs.push(n);
  }
  const skin = 0x3d2c4e;
  r.part('body', G.ellipsoid(0.36, 0.26, 0.42, 16, 12), skin, { topColor: 0x6a4a7a });
  for (let i = 0; i < 7; i++) {
    r.part('body', G.ellipsoid(0.07, 0.02, 0.12), 0x24182e, { pos: [0, 0.22 - i * 0.01, -0.26 + i * 0.08], rot: [0.2, 0, 0] });
  }
  eyes(r, 'body', [[-0.12, 0.1, 0.34], [0.12, 0.1, 0.34], [0, 0.16, 0.36], [-0.2, 0.02, 0.3], [0.2, 0.02, 0.3]], 0.045, 0xff3048, 1.3);
  r.part('body', G.ellipsoid(0.14, 0.04, 0.06), 0x200610, { pos: [0, -0.04, 0.38] });
  teeth(r, 'body', 0, -0.02, 0.42, 0.2, 5, 0.04, true, 0.03);
  for (const n of legs) {
    r.part(n, G.limb(0.04, 0.03, 0.3), skin);
    r.part(n + 'b', G.limb(0.03, 0.012, 0.32), 0x1a1420);
  }
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    for (let i = 0; i < 6; i++) {
      const ph = c.phase + (i % 2) * Math.PI + (i >= 3 ? Math.PI : 0);
      const leg = b['leg' + i];
      leg.rotation.y += Math.sin(ph) * 0.35 * (c.speed > 0.2 ? 1 : 0.1);
      leg.rotation.z += Math.max(0, Math.cos(ph)) * 0.3 * (i < 3 ? 1 : -1) * (c.speed > 0.2 ? 1 : 0);
    }
    b.body.position.y += Math.sin(c.t * 2) * 0.015 + (c.speed > 0.2 ? Math.abs(Math.sin(c.phase)) * 0.03 : 0);
    const a = c.atk;
    b.body.position.z += a * 0.3;
    b.body.rotation.x = -a * 0.3;
  });
}

export function womb(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.38, 0]);
  const flesh = 0xc9798b;
  const veinFn = (x: number, y: number, z: number, c: THREE.Color) => {
    const v = Math.sin(x * 22 + Math.sin(y * 13) * 3) * Math.sin(z * 17 + y * 6);
    if (v > 0.75) c.setHex(0x7a1a2e);
  };
  r.part('body', G.ellipsoid(0.34, 0.38, 0.34, 18, 14), flesh, { colorFn: veinFn });
  r.part('body', G.ellipsoid(0.16, 0.18, 0.1), 0xe8aab4, { pos: [0, 0.05, 0.26], glow: 0.35 });
  eyes(r, 'body', [[0, 0.06, 0.32]], 0.06, 0xffe14a, 1.3);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    r.part('body', G.limb(0.035, 0.02, 0.22), 0x9a4a5a, { pos: [Math.sin(a) * 0.24, -0.25, Math.cos(a) * 0.24], rot: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5] });
  }
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const pulse = 1 + Math.sin(c.t * 6) * 0.06 + (c.action ? c.actionT * 0.5 : 0);
    b.body.scale.set(pulse, 2 - pulse, pulse);
    b.body.position.y += c.speed > 0.2 ? Math.abs(Math.sin(c.phase * 0.8)) * 0.12 : 0;
    b.body.rotation.y = Math.sin(c.t * 1.3) * 0.3;
  });
}

export interface QuadSpec {
  bodyLen: number; bodyR: number; legLen: number; legR: number; neck: number; headR: number; snout: number;
  ears: 'pointy' | 'long' | 'elephant' | 'none'; tail: 'long' | 'short' | 'none'; trunk?: boolean;
  color: number; belly: number; dark: number; eye: number; eyeGlow: number; spikes?: boolean; mask?: number;
  /** horn colour (Piercing Ox) */
  horns?: number;
}

export function quadruped(q: QuadSpec): ModelHandle {
  const r = new RigBuilder();
  const bodyY = q.legLen + q.bodyR * 0.55;
  r.bone('body', 'root', [0, bodyY, 0]);
  r.bone('neck', 'body', [0, q.bodyR * 0.35, q.bodyLen * 0.48]);
  r.bone('head', 'neck', [0, q.neck, q.headR * 0.4]);
  r.bone('jaw', 'head', [0, -q.headR * 0.35, q.headR * 0.5]);
  r.bone('tail', 'body', [0, q.bodyR * 0.3, -q.bodyLen * 0.48]);
  const legs = [['FL', 1, 1], ['FR', -1, 1], ['BL', 1, -1], ['BR', -1, -1]] as const;
  for (const [n, sx, sz] of legs) {
    r.bone('leg' + n, 'body', [sx * q.bodyR * 0.55, -q.bodyR * 0.4, sz * q.bodyLen * 0.36]);
    r.bone('low' + n, 'leg' + n, [0, -(q.legLen - q.bodyR * 0.15) * 0.5, 0]);
  }
  r.part('body', G.ellipsoid(q.bodyR, q.bodyR * 0.9, q.bodyLen * 0.62, 16, 12), q.color, { topColor: lighten(q.color, 1.12) });
  r.part('body', G.ellipsoid(q.bodyR * 0.8, q.bodyR * 0.5, q.bodyLen * 0.5), q.belly, { pos: [0, -q.bodyR * 0.4, 0] });
  if (q.spikes) for (let i = 0; i < 6; i++) r.part('body', G.cone(0.05, 0.22, 5), q.dark, { pos: [0, q.bodyR * 0.85, q.bodyLen * (0.35 - i * 0.14)], rot: [-0.5, 0, 0] });
  r.part('neck', G.limb(q.bodyR * 0.55, q.headR * 0.8, q.neck + 0.05), q.color, { rot: [Math.PI, 0, 0], pos: [0, -0.05, 0] });
  r.part('head', G.ellipsoid(q.headR, q.headR * 0.9, q.headR * 1.05, 14, 10), q.color, { topColor: lighten(q.color, 1.12) });
  if (q.snout > 0) r.part('head', G.ellipsoid(q.headR * 0.55, q.headR * 0.45, q.snout), q.color, { pos: [0, -q.headR * 0.15, q.headR * 0.8] });
  if (q.snout > 0) r.part('head', G.sphere(q.headR * 0.14, 8, 6), 0x111111, { pos: [0, -q.headR * 0.05, q.headR * 0.8 + q.snout * 0.95] });
  if (q.mask !== undefined) {
    r.part('head', G.ellipsoid(q.headR * 0.95, q.headR * 0.35, q.headR * 0.7), q.mask, { pos: [0, q.headR * 0.25, q.headR * 0.35] });
  }
  for (const sx of [1, -1]) {
    r.part('head', G.sphere(q.headR * 0.17, 8, 6), q.eye, { pos: [sx * q.headR * 0.45, q.headR * 0.22, q.headR * 0.82], glow: q.eyeGlow });
    if (q.ears === 'pointy') r.part('head', G.cone(q.headR * 0.32, q.headR * 0.9, 5), q.color, { pos: [sx * q.headR * 0.5, q.headR * 0.9, -q.headR * 0.1], rot: [-0.2, 0, -sx * 0.25] });
    if (q.ears === 'long') r.part('head', G.ellipsoid(q.headR * 0.22, q.headR * 1.2, q.headR * 0.12), q.color, { pos: [sx * q.headR * 0.35, q.headR * 1.3, -q.headR * 0.2], rot: [-0.25, 0, -sx * 0.15] });
    if (q.ears === 'elephant') r.part('head', G.ellipsoid(q.headR * 0.1, q.headR * 0.9, q.headR * 0.8), darken(q.color, 0.9), { pos: [sx * q.headR * 1.0, q.headR * 0.05, -q.headR * 0.2], rot: [0, sx * 0.3, 0] });
  }
  if (q.horns !== undefined) for (const sx of [1, -1]) {
    r.part('head', G.cone(q.headR * 0.16, q.headR * 0.9, 6), q.horns, { pos: [sx * q.headR * 0.75, q.headR * 0.45, q.headR * 0.15], rot: [0.9, 0, -sx * 1.1], topColor: 0xffffff });
    r.part('head', G.cone(q.headR * 0.1, q.headR * 0.55, 6), q.horns, { pos: [sx * q.headR * 1.25, q.headR * 0.85, q.headR * 0.45], rot: [1.3, 0, -sx * 0.35] });
  }
  r.part('jaw', G.ellipsoid(q.headR * 0.45, q.headR * 0.15, q.snout > 0 ? q.snout * 0.9 : q.headR * 0.4), q.belly, { pos: [0, -q.headR * 0.05, q.headR * 0.3] });
  if (q.trunk) {
    r.part('head', G.limb(q.headR * 0.22, q.headR * 0.12, q.headR * 1.6), q.color, { pos: [0, -q.headR * 0.2, q.headR * 0.9], rot: [-0.25, 0, 0] });
    for (const sx of [1, -1]) r.part('head', G.cone(q.headR * 0.08, q.headR * 0.6, 6), 0xf4efe0, { pos: [sx * q.headR * 0.3, -q.headR * 0.5, q.headR * 0.9], rot: [-1.3, 0, 0] });
  }
  if (q.tail === 'long') r.part('tail', G.limb(q.bodyR * 0.2, q.bodyR * 0.08, q.bodyLen * 0.6), q.color, { rot: [-2.3, 0, 0] });
  if (q.tail === 'short') r.part('tail', G.sphere(q.bodyR * 0.25, 8, 6), q.belly);
  for (const [n] of legs) {
    r.part('leg' + n, G.limb(q.legR * 1.3, q.legR, (q.legLen - q.bodyR * 0.15) * 0.5), q.color);
    r.part('low' + n, G.limb(q.legR, q.legR * 0.85, (q.legLen - q.bodyR * 0.15) * 0.5), q.dark);
  }
  const rig = r.build({ outline: 0.018 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const mv = c.speed > 0.2 ? 1 : 0;
    const ph = c.phase;
    const amp = 0.55 * mv;
    b.legFL.rotation.x = Math.sin(ph) * amp;
    b.legBR.rotation.x = Math.sin(ph) * amp;
    b.legFR.rotation.x = Math.sin(ph + Math.PI) * amp;
    b.legBL.rotation.x = Math.sin(ph + Math.PI) * amp;
    b.lowFL.rotation.x = Math.max(0, Math.cos(ph)) * -0.6 * mv;
    b.lowBR.rotation.x = Math.max(0, Math.cos(ph)) * 0.6 * mv;
    b.lowFR.rotation.x = Math.max(0, -Math.cos(ph)) * -0.6 * mv;
    b.lowBL.rotation.x = Math.max(0, -Math.cos(ph)) * 0.6 * mv;
    b.body.position.y += Math.abs(Math.sin(ph)) * 0.04 * mv + Math.sin(c.t * 2) * 0.01;
    b.tail.rotation.y = Math.sin(c.t * (mv ? 12 : 4)) * 0.4;
    b.head.rotation.x = Math.sin(c.t * 1.7) * 0.05;
    const a = c.atk;
    b.neck.rotation.x = a * 0.5;
    b.jaw.rotation.x = Math.max(0, a) * 0.7;
    b.body.position.z += a * 0.3;
    if (c.hitT > 0) b.body.rotation.x = -c.hitT;
  });
}

/** Megumi's Great Serpent: a masked serpent rising out of the shadow. */
export function serpent(): ModelHandle {
  const r = new RigBuilder();
  const segs = 6;
  let parent = 'root';
  for (let i = 0; i < segs; i++) {
    r.bone('s' + i, parent, [0, i === 0 ? 0 : 0.42, 0]);
    parent = 's' + i;
  }
  r.bone('head', parent, [0, 0.4, 0.05]);
  r.bone('jaw', 'head', [0, -0.08, 0.12]);
  const skin = 0x2e2a40, belly = 0xb8b0c8, mark = 0xe8e4f0;
  for (let i = 0; i < segs; i++) {
    const rad = 0.42 - i * 0.035;
    r.part('s' + i, G.ellipsoid(rad, 0.3, rad * 0.92, 12, 8), skin, { pos: [0, 0.18, 0], topColor: 0x4a4466 });
    r.part('s' + i, G.ellipsoid(rad * 0.7, 0.26, rad * 0.5, 10, 6), belly, { pos: [0, 0.18, rad * 0.52] });
    r.part('s' + i, G.cone(0.06, 0.18, 4), mark, { pos: [0, 0.22, -rad * 0.9], rot: [-1.2, 0, 0] });
  }
  r.part('head', G.ellipsoid(0.36, 0.24, 0.5, 12, 8), skin, { topColor: 0x4a4466 });
  // ceremonial mask with the Ten Shadows markings
  r.part('head', G.ellipsoid(0.3, 0.12, 0.32), mark, { pos: [0, 0.12, 0.12] });
  for (const sx of [1, -1]) {
    r.part('head', G.sphere(0.06, 8, 6), 0xffd04a, { pos: [sx * 0.2, 0.12, 0.3], glow: 1.6 });
    r.part('head', G.cone(0.05, 0.3, 4), mark, { pos: [sx * 0.22, 0.2, -0.25], rot: [-1.0, 0, -sx * 0.3] });
  }
  r.part('jaw', G.ellipsoid(0.3, 0.08, 0.42), belly, { pos: [0, -0.02, 0.12] });
  for (const sx of [1, -1]) r.part('jaw', G.cone(0.03, 0.14, 4), 0xffffff, { pos: [sx * 0.15, 0.08, 0.38], rot: [Math.PI, 0, 0] });
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    for (let i = 0; i < segs; i++) {
      b['s' + i].rotation.z = Math.sin(c.t * 3 + i * 0.7) * 0.12;
      b['s' + i].rotation.x = Math.sin(c.t * 2.2 + i * 0.5) * 0.08 + (i > 3 ? 0.18 : 0);
    }
    const a = Math.max(0, c.atk);
    b.head.rotation.x = 0.5 - a * 0.6;
    b.jaw.rotation.x = 0.15 + a * 0.8;
  });
}

export function nue(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.9, 0]);
  r.bone('head', 'body', [0, 0.3, 0.2]);
  r.bone('wingL', 'body', [0.22, 0.15, 0]);
  r.bone('wingL2', 'wingL', [0.7, 0, 0]);
  r.bone('wingR', 'body', [-0.22, 0.15, 0]);
  r.bone('wingR2', 'wingR', [-0.7, 0, 0]);
  r.bone('tail', 'body', [0, -0.05, -0.35]);
  const feather = 0xdedfe8, dark = 0x22232e;
  r.part('body', G.ellipsoid(0.3, 0.34, 0.42, 16, 12), feather, { topColor: 0xffffff });
  r.part('body', G.ellipsoid(0.24, 0.28, 0.2), 0xf4f0e6, { pos: [0, -0.04, 0.22] });
  r.part('head', G.ellipsoid(0.24, 0.22, 0.22), feather);
  // ceremonial mask over the face
  r.part('head', G.ellipsoid(0.2, 0.16, 0.08), dark, { pos: [0, 0.02, 0.17] });
  for (const sx of [1, -1]) r.part('head', G.sphere(0.035, 8, 6), 0x7ad8ff, { pos: [sx * 0.08, 0.04, 0.24], glow: 1.4 });
  r.part('head', G.cone(0.05, 0.14, 6), 0xe0c060, { pos: [0, -0.06, 0.26], rot: [Math.PI / 2 + 0.6, 0, 0] });
  for (const sx of [1, -1]) r.part('head', G.cone(0.05, 0.2, 5), feather, { pos: [sx * 0.15, 0.2, 0], rot: [0, 0, -sx * 0.4] });
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    r.part('wing' + s, G.ellipsoid(0.4, 0.04, 0.28), feather, { pos: [sx * 0.35, 0, 0] });
    r.part('wing' + s + '2', G.ellipsoid(0.42, 0.03, 0.24), feather, { pos: [sx * 0.38, 0, -0.04], topColor: 0xffffff });
    for (let i = 0; i < 4; i++) r.part('wing' + s + '2', G.ellipsoid(0.08, 0.02, 0.22), dark, { pos: [sx * (0.2 + i * 0.16), -0.01, -0.22], rot: [0, sx * 0.2, 0] });
    r.part('wing' + s + '2', G.sphere(0.05, 6, 4), 0x9ae6ff, { pos: [sx * 0.8, 0, 0], glow: 2 });
  }
  r.part('tail', G.ellipsoid(0.16, 0.03, 0.3), feather, { pos: [0, 0, -0.15] });
  for (const sx of [1, -1]) r.part('body', G.limb(0.03, 0.02, 0.3), 0xd0a040, { pos: [sx * 0.1, -0.3, 0.05] });
  const rig = r.build({ outline: 0.018 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const f = Math.sin(c.t * 9);
    b.wingL.rotation.z = f * 0.55; b.wingR.rotation.z = -f * 0.55;
    b.wingL2.rotation.z = f * 0.35; b.wingR2.rotation.z = -f * 0.35;
    b.body.position.y += Math.sin(c.t * 9 + 1) * 0.08;
    const a = c.atk;
    b.body.position.y -= Math.max(0, a) * 1.0;
    b.body.rotation.x = Math.max(0, a) * 0.6;
  });
}

export function toad(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.55, 0]);
  r.bone('jaw', 'body', [0, -0.05, 0.3]);
  r.bone('tongue', 'jaw', [0, 0.05, 0.1]);
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('front' + s, 'body', [sx * 0.35, -0.25, 0.3]);
    r.bone('back' + s, 'body', [sx * 0.45, -0.25, -0.25]);
  }
  const skin = 0x6a8a5a, belly = 0xd8d0a8;
  r.part('body', G.ellipsoid(0.62, 0.48, 0.6, 18, 14), skin, { topColor: 0x8aa66e, colorFn: (x, y, z, c) => { if (Math.sin(x * 14) * Math.cos(z * 12) > 0.82 && y > 0) c.setHex(0x4a6a3a); } });
  r.part('body', G.ellipsoid(0.5, 0.3, 0.4), belly, { pos: [0, -0.18, 0.22] });
  for (const sx of [1, -1]) {
    r.part('body', G.sphere(0.15, 10, 8), skin, { pos: [sx * 0.3, 0.4, 0.3] });
    r.part('body', G.sphere(0.1, 10, 8), 0xf0d040, { pos: [sx * 0.32, 0.45, 0.38], glow: 0.4 });
    r.part('body', G.box(0.03, 0.12, 0.03), 0x111111, { pos: [sx * 0.32, 0.45, 0.47] });
  }
  r.part('jaw', G.ellipsoid(0.5, 0.12, 0.3), belly, { pos: [0, -0.05, 0.05] });
  r.part('tongue', G.limb(0.07, 0.07, 0.5), 0xd84a6a, { rot: [-Math.PI / 2, 0, 0] });
  for (const s of ['L', 'R']) {
    r.part('front' + s, G.limb(0.08, 0.06, 0.3), skin);
    r.part('back' + s, G.ellipsoid(0.2, 0.15, 0.28), skin);
  }
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.scale.y = 1 + Math.sin(c.t * 3) * 0.03;
    const a = c.atk;
    b.jaw.rotation.x = Math.max(0, a) * 0.5;
    b.tongue.scale.set(1, 1, 1);
    b.tongue.scale.y = 1;
    b.tongue.scale.z = 1;
    b.tongue.position.z += Math.max(0, a) * 2.5;
    b.body.position.y += c.speed > 0.2 ? Math.abs(Math.sin(c.phase * 0.5)) * 0.35 : 0;
  });
}

export function rabbit(): ModelHandle {
  return quadruped({ bodyLen: 0.32, bodyR: 0.14, legLen: 0.1, legR: 0.03, neck: 0.04, headR: 0.11, snout: 0.03, ears: 'long', tail: 'short', color: 0xf6f6f8, belly: 0xffffff, dark: 0xe0e0e6, eye: 0xd03050, eyeGlow: 0.5 });
}

export function leech(): ModelHandle {
  const r = new RigBuilder();
  const N = 8;
  r.bone('body', 'root', [0, 0.3, 0.7]);
  let prev = 'body';
  for (let i = 1; i < N; i++) { const n = 'seg' + i; r.bone(n, prev, [0, 0, -0.2]); prev = n; }
  const skin = 0x5d4a3a;
  r.part('body', G.ellipsoid(0.24, 0.24, 0.2), skin, { topColor: 0x7a6a4a });
  r.part('body', G.cyl(0.16, 0.16, 0.06, 14), 0x400a12, { pos: [0, 0, 0.17], rot: [Math.PI / 2, 0, 0], glow: 0.2 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    r.part('body', G.cone(0.025, 0.08, 4), 0xf0e8d0, { pos: [Math.sin(a) * 0.13, Math.cos(a) * 0.13, 0.2], rot: [Math.PI / 2, 0, 0] });
  }
  for (let i = 1; i < N; i++) {
    const rr = 0.23 * (1 - i / (N + 2));
    r.part('seg' + i, G.ellipsoid(rr, rr * 0.9, 0.14), i % 2 ? skin : darken(skin, 0.85), { topColor: 0x7a6a4a });
  }
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    for (let i = 1; i < N; i++) {
      b['seg' + i].rotation.y = Math.sin(c.t * 5 - i * 0.7) * 0.3;
      b['seg' + i].position.y = Math.sin(c.t * 5 - i * 0.9) * 0.03;
    }
    b.body.rotation.y = Math.sin(c.t * 5) * 0.2;
    const a = c.atk;
    b.body.position.y += Math.max(0, a) * 0.4;
    b.body.position.z += a * 0.4;
    b.body.rotation.x = -Math.max(0, a) * 0.5;
  });
}

export function rootCurse(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.0, 0]);
  r.bone('trunk2', 'body', [0, 0.6, 0]);
  r.bone('head', 'trunk2', [0, 0.6, 0]);
  r.bone('vineL', 'trunk2', [0.2, 0.3, 0]);
  r.bone('vineR', 'trunk2', [-0.2, 0.3, 0]);
  const bark = 0x5c4a30, moss = 0x4a6a32;
  const barkFn = (x: number, y: number, z: number, c: THREE.Color) => { if (Math.sin(Math.atan2(x, z) * 9 + y * 4) > 0.7) c.setHex(0x3a2c1c); };
  r.part('body', G.cyl(0.28, 0.42, 0.7, 12), bark, { pos: [0, 0.35, 0], colorFn: barkFn });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    r.part('body', G.cone(0.08, 0.5, 5), bark, { pos: [Math.sin(a) * 0.4, 0.08, Math.cos(a) * 0.4], rot: [Math.cos(a) * 1.3, 0, -Math.sin(a) * 1.3] });
  }
  r.part('trunk2', G.cyl(0.22, 0.28, 0.65, 12), bark, { pos: [0, 0.3, 0], colorFn: barkFn });
  r.part('head', G.ellipsoid(0.3, 0.32, 0.3), bark, { pos: [0, 0.15, 0], colorFn: barkFn });
  r.part('head', G.ellipsoid(0.32, 0.12, 0.32), moss, { pos: [0, 0.38, 0] });
  for (let i = 0; i < 5; i++) r.part('head', G.sphere(0.06, 6, 5), 0xe86aa0, { pos: [Math.sin(i * 1.3) * 0.25, 0.44, Math.cos(i * 1.3) * 0.25], glow: 0.4 });
  eyes(r, 'head', [[-0.1, 0.2, 0.25], [0.1, 0.2, 0.25]], 0.05, 0x9aff6a, 1.4);
  r.part('head', G.ellipsoid(0.13, 0.05, 0.04), 0x14100a, { pos: [0, 0.05, 0.27] });
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    r.part('vine' + s, G.limb(0.06, 0.03, 0.8), moss, { rot: [0, 0, sx * 1.2] });
    for (let i = 0; i < 4; i++) r.part('vine' + s, G.cone(0.025, 0.1, 4), 0xd8d0a0, { pos: [sx * (0.2 + i * 0.15), -0.02 - i * 0.05, 0.04], rot: [0, 0, sx * 0.4] });
  }
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.trunk2.rotation.z = Math.sin(c.t * 1.2) * 0.08;
    b.head.rotation.z = Math.sin(c.t * 1.2 + 0.5) * 0.1;
    b.vineL.rotation.z = Math.sin(c.t * 2) * 0.3 - c.atk * 0.8;
    b.vineR.rotation.z = -Math.sin(c.t * 2) * 0.3 + c.atk * 0.8;
    b.trunk2.rotation.x = c.atk * 0.3;
  });
}

export function bud(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.35, 0]);
  r.bone('petals', 'body', [0, 0.2, 0]);
  const stem = 0x4a8a3a, petal = 0xe85a9a;
  r.part('body', G.ellipsoid(0.22, 0.24, 0.22), stem, { topColor: 0x6aaa4a });
  eyes(r, 'body', [[0, 0.04, 0.19]], 0.07, 0xfff06a, 1.2);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    r.part('petals', G.ellipsoid(0.1, 0.2, 0.04), petal, { pos: [Math.sin(a) * 0.1, 0.1, Math.cos(a) * 0.1], rot: [Math.cos(a) * 0.5, a, 0], topColor: 0xffc0de });
  }
  for (const sx of [1, -1]) r.part('body', G.limb(0.03, 0.025, 0.2), stem, { pos: [sx * 0.08, -0.18, 0] });
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.position.y += c.speed > 0.2 ? Math.abs(Math.sin(c.phase * 0.7)) * 0.25 : Math.sin(c.t * 3) * 0.02;
    b.petals.rotation.y = c.t * 0.8;
    const open = 1 + Math.max(0, c.atk) * 0.6;
    b.petals.scale.set(open, 1, open);
  });
}

export function cursedHand(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.55, 0]);
  const fingers: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -1.0 + i * 0.5;
    const n = 'f' + i;
    r.bone(n, 'body', [Math.sin(a) * 0.3, -0.05, Math.cos(a) * 0.28], [0, a, 0]);
    r.bone(n + 'b', n, [0, -0.22, 0.12]);
    fingers.push(n);
  }
  const skin = 0x9d8c88, nail = 0x2a1a1a;
  r.part('body', G.ellipsoid(0.42, 0.14, 0.38, 16, 10), skin, { topColor: 0xb8a8a4 });
  eyes(r, 'body', [[0, 0.12, 0.05]], 0.12, 0xff4a3a, 1.2);
  for (let i = 0; i < 6; i++) r.part('body', G.box(0.02, 0.01, 0.2), 0x6a4a4a, { pos: [-0.25 + i * 0.1, 0.12, -0.15] });
  for (const n of fingers) {
    r.part(n, G.limb(0.065, 0.055, 0.24), skin, { rot: [0.5, 0, 0] });
    r.part(n + 'b', G.limb(0.055, 0.04, 0.3), skin);
    r.part(n + 'b', G.cone(0.04, 0.08, 5), nail, { pos: [0, -0.32, 0], rot: [Math.PI, 0, 0] });
  }
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    for (let i = 0; i < 5; i++) {
      const ph = c.phase + i * 1.2;
      b['f' + i].rotation.x += Math.sin(ph) * 0.35 * (c.speed > 0.2 ? 1 : 0.15);
    }
    b.body.position.y += Math.sin(c.t * 2) * 0.03;
    const a = c.atk;
    b.body.rotation.x = -Math.max(0, a) * 0.8;
    b.body.position.y += Math.max(0, a) * 0.4;
  });
}

export function fish(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.1, 0]);
  r.bone('tail', 'body', [0, 0, -0.32]);
  const skin = 0x2f7f9f, belly = 0xd8e8e0;
  r.part('body', G.ellipsoid(0.18, 0.24, 0.42, 14, 10), skin, { colorFn: (x, y, z, c) => { if (y < -0.05) c.setHex(belly); else if (Math.sin(z * 30) > 0.6) c.setHex(0x1a4a6a); } });
  r.part('body', G.ellipsoid(0.03, 0.16, 0.18), 0x1a4a6a, { pos: [0, 0.24, -0.05] });
  eyes(r, 'body', [[0.12, 0.06, 0.28], [-0.12, 0.06, 0.28]], 0.05, 0xf0f0d0, 0.6);
  r.part('body', G.ellipsoid(0.08, 0.04, 0.05), 0x301010, { pos: [0, -0.06, 0.4] });
  teeth(r, 'body', 0, -0.04, 0.43, 0.12, 5, 0.03, true, 0.02);
  r.part('tail', G.ellipsoid(0.03, 0.22, 0.16), skin, { pos: [0, 0, -0.12] });
  const rig = r.build({ outline: 0.014 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.tail.rotation.y = Math.sin(c.t * 14) * 0.6;
    b.body.rotation.y = Math.sin(c.t * 14) * 0.08;
    b.body.position.y += Math.sin(c.t * 2.5) * 0.12;
    b.body.position.z += c.atk * 0.5;
  });
}

export function pumpkin(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.9, 0]);
  r.bone('head', 'body', [0, 0.35, 0]);
  r.bone('handL', 'body', [0.35, 0.05, 0.1]);
  r.bone('handR', 'body', [-0.35, 0.05, 0.1]);
  const orange = 0xe2781e, cloak = 0x2a1e30;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    r.part('head', G.ellipsoid(0.14, 0.26, 0.14), orange, { pos: [Math.sin(a) * 0.18, 0, Math.cos(a) * 0.18], topColor: 0xf09a3a });
  }
  r.part('head', G.cyl(0.03, 0.05, 0.14, 6), 0x4a6a2a, { pos: [0, 0.28, 0], rot: [0.3, 0, 0] });
  const glowC = 0xffd04a;
  for (const sx of [1, -1]) r.part('head', G.cone(0.06, 0.1, 3), glowC, { pos: [sx * 0.1, 0.06, 0.29], rot: [Math.PI / 2, 0, 0], glow: 2.2 });
  r.part('head', G.ellipsoid(0.15, 0.04, 0.03), glowC, { pos: [0, -0.08, 0.3], glow: 2.2 });
  const cl = G.cyl(0.12, 0.42, 0.85, 14, true);
  const p = cl.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.3) p.setY(i, p.getY(i) - ((i * 13) % 5) * 0.05);
  r.part('body', cl, cloak, { pos: [0, -0.3, 0] });
  for (const s of ['L', 'R']) r.part('hand' + s, G.ellipsoid(0.06, 0.06, 0.08), 0xd0c8b8);
  const rig = r.build({ outline: 0.018 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.position.y += Math.sin(c.t * 2.4) * 0.12;
    b.body.rotation.z = Math.sin(c.t * 1.7) * 0.08;
    b.head.rotation.y = Math.sin(c.t * 0.9) * 0.3;
    const a = c.atk;
    b.handL.position.z += Math.max(0, a) * 0.4; b.handR.position.z += Math.max(0, a) * 0.4;
  });
}

export function dagon(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.4, 0]);
  r.bone('head', 'body', [0, 0.6, 0]);
  const tent: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    let prev = 'body';
    for (let k = 0; k < 3; k++) {
      const n = `t${i}_${k}`;
      r.bone(n, prev, k === 0 ? [Math.sin(a) * 0.45, -0.5, Math.cos(a) * 0.45] : [0, -0.33, 0], k === 0 ? [Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4] : [0, 0, 0]);
      prev = n;
      tent.push(n);
    }
  }
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('arm' + s, 'body', [sx * 0.6, 0.2, 0], [0, 0, sx * 0.5]);
  }
  const skin = 0xc7553a, lips = 0xd92a3e;
  r.part('body', G.ellipsoid(0.62, 0.6, 0.55, 18, 14), skin, { topColor: 0xe07a5a });
  r.part('head', G.ellipsoid(0.55, 0.6, 0.52, 18, 14), skin, { topColor: 0xe88a6a });
  for (const sx of [1, -1]) {
    r.part('head', G.sphere(0.07, 8, 6), 0x111111, { pos: [sx * 0.18, 0.12, 0.47] });
    r.part('head', G.sphere(0.025, 6, 4), 0xffffff, { pos: [sx * 0.18 + 0.02, 0.15, 0.53], glow: 0.5 });
  }
  r.part('head', G.torus(0.13, 0.06, 8, 16), lips, { pos: [0, -0.15, 0.48] });
  r.part('head', G.ellipsoid(0.1, 0.06, 0.04), 0x300810, { pos: [0, -0.15, 0.5] });
  for (const n of tent) {
    const k = +n.split('_')[1];
    r.part(n, G.limb(0.13 - k * 0.03, 0.1 - k * 0.03, 0.34), k === 2 ? 0xe07a5a : skin);
  }
  for (const s of ['L', 'R']) r.part('arm' + s, G.limb(0.1, 0.08, 0.6), skin);
  const rig = r.build({ outline: 0.026 });
  return new Creature(rig, (c) => {
    const b = c.b;
    for (const n of tent) {
      const [i, k] = n.slice(1).split('_').map(Number);
      b[n].rotation.x += Math.sin(c.t * 3 + i + k * 0.8) * 0.25;
    }
    b.body.position.y += Math.sin(c.t * 1.5) * 0.08;
    const a = c.atk;
    b.armL.rotation.x = -Math.max(0, a) * 1.6;
    b.armR.rotation.x = -Math.max(0, a) * 1.6;
    b.head.rotation.x = -a * 0.2;
  });
}

// ---------------------------------------------------------------------------
