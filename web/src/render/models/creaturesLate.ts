// Death Paintings, Culling Game and Shinjuku curses, the Rainbow Dragon, the Smallpox Deity and Naoya as a curse.
import * as THREE from 'three';
import { G, V3 } from '../geo';
import { RigBuilder, RigModel, resetPose } from '../rig';
import { Humanoid, HumanoidAnimator, darken, lighten } from './humanoid';
import { ModelHandle, wrapHumanoid } from './model';
import { SPECS } from './characters';
import { Rng, TAU, clamp } from '../../core/util';
import { Dims, curseSkeleton, finishHumanoid, eyes, teeth, AnimFn, Creature } from './creatureParts';

// ---------------------------------------------------------------------------
// Death Paintings, Culling Game and Shinjuku curses
// ---------------------------------------------------------------------------

/** Kechizu: the squat third Death Painting, all head and eyes, spitting corrosive blood. */
export function buildKechizu(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.2, torso: 0.36, arm: 0.2, shoulder: 0.34, spread: 0.16 };
  curseSkeleton(r, d);
  const skin = 0x9aa088, dk = 0x5a6048, loin = 0x2a1e1a;
  r.part('spine', G.ellipsoid(0.36, 0.3, 0.32, 14, 10), skin, { pos: [0, 0.12, 0], topColor: lighten(skin, 1.12) });
  r.part('hips', G.cyl(0.28, 0.32, 0.2, 12, true), loin, { pos: [0, -0.04, 0] });
  // the head is most of the body: a wide face with a ring of eyes and a downturned mouth
  r.part('head', G.ellipsoid(0.38, 0.34, 0.34, 16, 12), skin, { pos: [0, 0.18, 0.06], topColor: lighten(skin, 1.15) });
  eyes(r, 'head', [[-0.16, 0.26, 0.3], [0.16, 0.26, 0.3], [-0.24, 0.14, 0.24], [0.24, 0.14, 0.24], [0, 0.36, 0.26]], 0.05, 0xf0e070, 1.2);
  r.part('head', G.ellipsoid(0.18, 0.05, 0.06), 0x4a0a10, { pos: [0, 0.02, 0.34], glow: 0.2 });
  teeth(r, 'head', 0, 0.05, 0.37, 0.3, 7, 0.04, true, 0.05);
  // blood dribbling from the lips
  r.part('head', G.ellipsoid(0.03, 0.08, 0.02), 0x8a0a14, { pos: [0.08, -0.06, 0.35], glow: 0.3 });
  for (let i = 0; i < 4; i++) r.part('head', G.cone(0.03, 0.12, 5), dk, { pos: [(i - 1.5) * 0.12, 0.48, -0.08], rot: [-0.5, 0, (i - 1.5) * 0.25] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.07, 0.06, d.arm), skin);
    r.part('armLow' + s, G.limb(0.06, 0.05, d.arm), dk);
    for (let i = 0; i < 3; i++) r.part('hand' + s, G.cone(0.02, 0.1, 4), 0x2a2420, { pos: [(i - 1) * 0.03, -0.05, 0.02], rot: [Math.PI, 0, (i - 1) * 0.25] });
    r.part('legUp' + s, G.limb(0.1, 0.09, d.leg), skin);
    r.part('legLow' + s, G.limb(0.08, 0.07, d.leg), dk);
    r.part('foot' + s, G.ellipsoid(0.09, 0.05, 0.13), dk, { pos: [0, 0, 0.04] });
  }
  return finishHumanoid(r, 0.022);
}

/** Eso: the second Death Painting. A split, two-toned face and a body striped like old blood. */
export function buildEso(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.44, torso: 0.52, arm: 0.33, shoulder: 0.24, spread: 0.11 };
  curseSkeleton(r, d);
  const pale = 0xd8d0b8, green = 0x3e6a4a, hakama = 0x2a2a34, blood = 0x8a0a14;
  const split = (x: number, _y: number, _z: number, c: THREE.Color) => { if (x < 0) c.setHex(green); };
  r.part('spine', G.capsuleUp(0.18, 0.4), pale, { scale: [1, 1, 0.78], colorFn: split });
  r.part('chest', G.ellipsoid(0.26, 0.21, 0.19), pale, { pos: [0, 0.12, 0], colorFn: split });
  for (let i = 0; i < 3; i++) r.part('chest', G.box(0.42, 0.018, 0.02), blood, { pos: [0, 0.2 - i * 0.08, 0.17], glow: 0.2 });
  r.part('hips', G.cyl(0.22, 0.34, 0.5, 14, true), hakama, { pos: [0, -0.2, 0] });
  r.part('spine', G.cyl(0.2, 0.21, 0.07, 12), blood, { pos: [0, 0.02, 0] });
  // head: half green, half pale, black sclera and a band of blood across the bridge of the nose
  r.part('head', G.ellipsoid(0.17, 0.2, 0.17, 14, 12), pale, { pos: [0, 0.16, 0.03], colorFn: split });
  for (const sx of [1, -1]) {
    r.part('head', G.ellipsoid(0.045, 0.03, 0.02), 0x0a0a0a, { pos: [sx * 0.07, 0.19, 0.18] });
    r.part('head', G.sphere(0.014, 6, 4), 0xff3a3a, { pos: [sx * 0.07, 0.19, 0.198], glow: 1.4 });
  }
  r.part('head', G.box(0.26, 0.022, 0.02), blood, { pos: [0, 0.155, 0.18], glow: 0.3 });
  r.part('head', G.box(0.07, 0.01, 0.01), 0x2a0808, { pos: [0, 0.07, 0.18] });
  // dark topknot horns
  for (const sx of [1, -1]) r.part('head', G.cone(0.05, 0.18, 6), 0x1a1a1a, { pos: [sx * 0.08, 0.38, -0.02], rot: [-0.3, 0, sx * -0.4] });
  // the second mouth on his back
  r.part('chest', G.ellipsoid(0.12, 0.06, 0.04), 0x3a0810, { pos: [0, 0.16, -0.19], glow: 0.2 });
  teeth(r, 'chest', 0, 0.19, -0.22, 0.18, 5, 0.035, true, 0.02);
  for (const s of ['L', 'R']) {
    const col = s === 'L' ? pale : green;
    r.part('armUp' + s, G.limb(0.07, 0.065, d.arm), col);
    r.part('armLow' + s, G.limb(0.065, 0.055, d.arm), col);
    r.part('hand' + s, G.ellipsoid(0.055, 0.07, 0.045), col, { pos: [0, -0.04, 0] });
    r.part('legUp' + s, G.limb(0.085, 0.075, d.leg), hakama);
    r.part('legLow' + s, G.limb(0.075, 0.06, d.leg), hakama);
    r.part('foot' + s, G.ellipsoid(0.065, 0.045, 0.12), 0x1a1a1a, { pos: [0, 0, 0.04] });
  }
  return finishHumanoid(r, 0.02);
}

/** Drowned curse from under Yasohachi Bridge: hunched, wet, hair hanging over its face. */
export function buildRiverCurse(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.42, torso: 0.48, arm: 0.44, shoulder: 0.2, spread: 0.11 };
  curseSkeleton(r, d);
  const skin = 0x7a8e96, dk = 0x3e4e58, hair = 0x101418;
  r.part('spine', G.capsuleUp(0.14, 0.38), skin, { scale: [1, 1, 0.75], topColor: lighten(skin, 1.1) });
  r.part('chest', G.ellipsoid(0.21, 0.2, 0.16), skin, { pos: [0, 0.12, 0.05] });
  for (let i = 0; i < 4; i++) r.part('chest', G.torus(0.14 - i * 0.01, 0.01, 4, 12, Math.PI), dk, { pos: [0, 0.18 - i * 0.06, 0.06], rot: [0, 0, Math.PI] });
  r.part('head', G.ellipsoid(0.15, 0.18, 0.15), skin, { pos: [0, 0.14, 0.1] });
  // a curtain of black hair over the face, with one eye showing through
  r.part('head', G.ellipsoid(0.17, 0.26, 0.17), hair, { pos: [0, 0.08, 0.08], scale: [1, 1, 1.02] });
  for (let i = -3; i <= 3; i++) r.part('head', G.box(0.04, 0.34, 0.02), hair, { pos: [i * 0.04, -0.05, 0.24 - Math.abs(i) * 0.012] });
  eyes(r, 'head', [[0.05, 0.16, 0.26]], 0.035, 0xd8f0ff, 1.4);
  r.part('head', G.ellipsoid(0.06, 0.08, 0.03), 0x1a0808, { pos: [0, 0.0, 0.25] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.05, 0.045, d.arm), skin);
    r.part('armLow' + s, G.limb(0.045, 0.035, d.arm), dk);
    for (let i = 0; i < 4; i++) r.part('hand' + s, G.cone(0.016, 0.14, 4), 0x1a2024, { pos: [(i - 1.5) * 0.025, -0.08, 0.02], rot: [Math.PI, 0, (i - 1.5) * 0.18] });
    r.part('legUp' + s, G.limb(0.06, 0.05, d.leg), skin);
    r.part('legLow' + s, G.limb(0.05, 0.04, d.leg), dk);
    r.part('foot' + s, G.ellipsoid(0.06, 0.035, 0.12), dk, { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r);
}

/** A cursed womb that never finished becoming a Death Painting: curled, floating, trailing its cord. */
export function bloodFetus(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.2, 0]);
  r.bone('head', 'body', [0, 0.12, 0.1]);
  r.bone('cord', 'body', [0, -0.12, -0.15]);
  const skin = 0xc87a7a, dk = 0x8a3a42;
  r.part('body', G.ellipsoid(0.2, 0.22, 0.2, 12, 10), skin, { rot: [0.5, 0, 0], topColor: lighten(skin, 1.1), colorFn: (x, y, _z, c) => { if (Math.sin(x * 20 + y * 14) > 0.85) c.setHex(dk); } });
  r.part('head', G.ellipsoid(0.2, 0.19, 0.19, 12, 10), skin, { pos: [0, 0.08, 0.06], topColor: lighten(skin, 1.12) });
  eyes(r, 'head', [[0, 0.1, 0.22]], 0.065, 0xff2a2a, 1.6);
  r.part('head', G.ellipsoid(0.07, 0.03, 0.02), 0x3a0810, { pos: [0, -0.02, 0.2] });
  for (const sx of [1, -1]) r.part('body', G.limb(0.04, 0.03, 0.16), skin, { pos: [sx * 0.14, 0.02, 0.12], rot: [1.2, 0, sx * 0.3] });
  for (let i = 0; i < 4; i++) r.part('cord', G.cyl(0.025, 0.025, 0.16, 6), dk, { pos: [Math.sin(i) * 0.04, -i * 0.13, -i * 0.05], rot: [0.3, 0, 0], glow: 0.15 });
  const rig = r.build({ outline: 0.014 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.position.y += Math.sin(c.t * 2.2) * 0.12;
    b.body.rotation.z = Math.sin(c.t * 1.6) * 0.15;
    b.cord.rotation.x = Math.sin(c.t * 3) * 0.35;
    b.head.rotation.x = -c.atk * 0.4;
    b.body.position.z += c.atk * 0.3;
  });
}

/** Colony curse: a floating jellyfish-like spirit drawn to the barriers. */
export function barrierCurse(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.5, 0]);
  const N = 6;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    r.bone('t' + i, 'body', [Math.sin(a) * 0.26, -0.12, Math.cos(a) * 0.26]);
    r.bone('u' + i, 't' + i, [0, -0.3, 0]);
  }
  const bell = 0x6a5aa8, rim = 0xc8a8ff;
  r.part('body', G.hemi(0.42, 14, 6), bell, { topColor: lighten(bell, 1.25), colorFn: (x, _y, z, c) => { if (Math.sin(Math.atan2(x, z) * 8) > 0.8) c.setHex(0x4a3a88); } });
  r.part('body', G.torus(0.4, 0.04, 5, 18), rim, { rot: [Math.PI / 2, 0, 0], glow: 0.6 });
  eyes(r, 'body', [[0, 0.18, 0.34], [-0.17, 0.12, 0.3], [0.17, 0.12, 0.3]], 0.05, 0xfff07a, 1.3);
  for (let i = 0; i < N; i++) {
    r.part('t' + i, G.limb(0.04, 0.03, 0.3), bell);
    r.part('u' + i, G.limb(0.03, 0.012, 0.36), rim, { glow: 0.4 });
  }
  const rig = r.build({ outline: 0.016 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const pulse = Math.sin(c.t * 3);
    b.body.position.y += Math.sin(c.t * 1.5) * 0.15;
    b.body.scale.set(1 + pulse * 0.06, 1 - pulse * 0.06, 1 + pulse * 0.06);
    for (let i = 0; i < N; i++) {
      b['t' + i].rotation.x = Math.sin(c.t * 3 + i) * 0.35;
      b['u' + i].rotation.x = Math.sin(c.t * 3 + i + 0.8) * 0.5;
    }
    b.body.rotation.x = -c.atk * 0.3;
  });
}

/** Kurourushi's swarm: cockroaches the size of dogs. */
export function roach(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 0.28, 0]);
  r.bone('head', 'body', [0, 0.02, 0.36]);
  const legs: string[] = [];
  for (let i = 0; i < 3; i++) for (const sx of [1, -1]) { const n = `leg${i}${sx > 0 ? 'L' : 'R'}`; legs.push(n); r.bone(n, 'body', [sx * 0.2, -0.05, 0.18 - i * 0.18]); }
  const shell = 0x5a2e18, dk = 0x2a1408;
  r.part('body', G.ellipsoid(0.26, 0.12, 0.42, 14, 8), shell, { topColor: 0x8a4a28, colorFn: (x, _y, _z, c) => { if (Math.abs(x) < 0.012) c.setHex(dk); } });
  r.part('head', G.ellipsoid(0.13, 0.08, 0.1), dk);
  eyes(r, 'head', [[0.07, 0.03, 0.07], [-0.07, 0.03, 0.07]], 0.03, 0xffa03a, 1.0);
  for (const sx of [1, -1]) r.part('head', G.cyl(0.006, 0.004, 0.55, 4), dk, { pos: [sx * 0.06, 0.1, 0.3], rot: [1.1, 0, sx * -0.4] });
  for (const n of legs) {
    const sx = n.endsWith('L') ? 1 : -1;
    r.part(n, G.limb(0.02, 0.012, 0.3), dk, { rot: [0, 0, sx * 1.1] });
  }
  const rig = r.build({ outline: 0.012 });
  return new Creature(rig, (c) => {
    const b = c.b;
    legs.forEach((n, i) => { b[n].rotation.x = Math.sin(c.phase * 2 + i * 1.7) * 0.5; });
    b.head.rotation.y = Math.sin(c.t * 6) * 0.15;
    b.body.position.z += c.atk * 0.35;
    b.head.rotation.x = -Math.max(0, c.atk) * 0.4;
  });
}

/** A cursed spirit drawn out of Kenjaku's stock: a long neck, too many eyes, arms that end in hooks. */
export function buildManipCurse(): ModelHandle {
  const r = new RigBuilder();
  const d: Dims = { leg: 0.48, torso: 0.6, arm: 0.42, shoulder: 0.3, spread: 0.14 };
  curseSkeleton(r, d);
  const skin = 0x3a2e4a, dk = 0x1e1628, eye = 0xf4e8a0;
  const eyed = (x: number, y: number, z: number, c: THREE.Color) => { if (Math.sin(x * 23) * Math.sin(y * 19 + z * 7) > 0.88) c.setHex(eye); };
  r.part('spine', G.capsuleUp(0.2, 0.46), skin, { scale: [1, 1, 0.8], colorFn: eyed });
  r.part('chest', G.ellipsoid(0.32, 0.26, 0.24), skin, { pos: [0, 0.14, 0], colorFn: eyed, topColor: lighten(skin, 1.15) });
  r.part('neck', G.cyl(0.07, 0.09, 0.34, 8), skin, { pos: [0, 0.14, 0.06], rot: [0.5, 0, 0] });
  r.part('head', G.ellipsoid(0.16, 0.14, 0.24), skin, { pos: [0, 0.22, 0.2] });
  eyes(r, 'head', [[-0.08, 0.28, 0.38], [0.08, 0.28, 0.38], [0, 0.32, 0.36], [-0.12, 0.2, 0.36], [0.12, 0.2, 0.36], [0, 0.22, 0.42]], 0.032, 0xff5a3a, 1.4);
  r.part('head', G.ellipsoid(0.1, 0.03, 0.06), 0x200810, { pos: [0, 0.12, 0.4] });
  teeth(r, 'head', 0, 0.14, 0.44, 0.16, 6, 0.03, true, 0.03);
  for (let i = 0; i < 5; i++) r.part('chest', G.cone(0.05, 0.3, 5), dk, { pos: [(i - 2) * 0.12, 0.24, -0.24], rot: [-0.9, 0, (i - 2) * 0.2] });
  for (const s of ['L', 'R']) {
    r.part('armUp' + s, G.limb(0.08, 0.07, d.arm), skin);
    r.part('armLow' + s, G.limb(0.07, 0.05, d.arm), dk);
    r.part('hand' + s, G.cone(0.04, 0.3, 5), 0xd8ccb0, { pos: [0, -0.14, 0.04], rot: [Math.PI + 0.3, 0, 0] });
    r.part('legUp' + s, G.limb(0.1, 0.08, d.leg), skin);
    r.part('legLow' + s, G.limb(0.08, 0.06, d.leg), dk);
    r.part('foot' + s, G.ellipsoid(0.08, 0.05, 0.15), dk, { pos: [0, 0, 0.05] });
  }
  return finishHumanoid(r, 0.024);
}

/** Rainbow Dragon: one of the oldest curses Geto ever swallowed. A long flying serpent with shifting scales. */
export function rainbowDragon(): ModelHandle {
  const r = new RigBuilder();
  const N = 10;
  r.bone('body', 'root', [0, 2.4, 0]);
  r.bone('head', 'body', [0, 0.1, 0.7]);
  r.bone('jaw', 'head', [0, -0.12, 0.25]);
  let parent = 'body';
  for (let i = 0; i < N; i++) { r.bone('s' + i, parent, [0, 0, i === 0 ? -0.35 : -0.55]); parent = 's' + i; }
  const col = (i: number) => new THREE.Color().setHSL((i / N) * 0.82, 0.62, 0.55).getHex();
  r.part('body', G.ellipsoid(0.5, 0.45, 0.6, 14, 10), col(0), { topColor: lighten(col(0), 1.2) });
  for (let i = 0; i < N; i++) {
    const rad = 0.46 - i * 0.03;
    r.part('s' + i, G.ellipsoid(rad, rad * 0.9, 0.42, 12, 8), col(i), { topColor: lighten(col(i), 1.25) });
    r.part('s' + i, G.cone(0.07, 0.3, 4), 0xf0e8d8, { pos: [0, rad * 0.9, 0], rot: [-0.5, 0, 0] });
    r.part('s' + i, G.ellipsoid(rad * 0.7, rad * 0.4, 0.36), 0xf0e0c0, { pos: [0, -rad * 0.55, 0] });
  }
  r.part('s' + (N - 1), G.cone(0.2, 0.6, 5), col(N - 1), { pos: [0, 0, -0.45], rot: [-Math.PI / 2, 0, 0] });
  r.part('head', G.ellipsoid(0.42, 0.34, 0.55, 14, 10), col(0), { topColor: lighten(col(0), 1.2) });
  r.part('head', G.ellipsoid(0.3, 0.2, 0.4), lighten(col(0), 1.1), { pos: [0, -0.04, 0.4] });
  for (const sx of [1, -1]) {
    r.part('head', G.cone(0.07, 0.6, 5), 0xf4ecd8, { pos: [sx * 0.22, 0.38, -0.12], rot: [-1.1, 0, -sx * 0.35] });
    r.part('head', G.cyl(0.012, 0.012, 0.7, 4), 0xf4e8a0, { pos: [sx * 0.3, -0.06, 0.62], rot: [Math.PI / 2 - 0.3, 0, sx * 0.8] });
  }
  eyes(r, 'head', [[0.2, 0.12, 0.42], [-0.2, 0.12, 0.42]], 0.07, 0xfff07a, 1.6);
  r.part('jaw', G.ellipsoid(0.28, 0.1, 0.38), 0xe8d8c0, { pos: [0, 0, 0.18] });
  teeth(r, 'jaw', 0, 0.08, 0.42, 0.36, 6, 0.04, false);
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.position.y += Math.sin(c.t * 1.6) * 0.25;
    for (let i = 0; i < N; i++) {
      b['s' + i].rotation.y = Math.sin(c.t * 2.4 - i * 0.6) * 0.22;
      b['s' + i].rotation.x = Math.sin(c.t * 1.8 - i * 0.5) * 0.08;
    }
    const a = Math.max(0, c.atk);
    b.head.rotation.x = -a * 0.4 + Math.sin(c.t * 1.3) * 0.08;
    b.jaw.rotation.x = 0.1 + a * 0.7;
  });
}

/** Smallpox Deity: a disease curse that wears a gravestone for a head and buries what it catches. */
export function smallpox(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.15, 0]);
  r.bone('head', 'body', [0, 0.75, 0.1]);
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('arm' + s, 'body', [sx * 0.58, 0.45, 0.05]);
    r.bone('hand' + s, 'arm' + s, [0, -0.62, 0.1]);
  }
  const skin = 0x8a8a6a, pox = 0xc8a85a, stone = 0x8a8a8e;
  r.part('body', G.ellipsoid(0.62, 0.7, 0.5, 14, 10), skin, { topColor: lighten(skin, 1.15), rot: [0.25, 0, 0] });
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, y = -0.45 + (i % 5) * 0.2;
    r.part('body', G.sphere(0.06 + (i % 3) * 0.02, 6, 5), pox, { pos: [Math.sin(a) * 0.56, y, Math.cos(a) * 0.43], glow: 0.15 });
  }
  r.part('head', G.box(0.58, 0.9, 0.22), stone, { pos: [0, 0.38, 0], topColor: lighten(stone, 1.2) });
  r.part('head', G.box(0.13, 0.62, 0.02), 0x2a2a2e, { pos: [0, 0.36, 0.12] });
  r.part('head', G.ellipsoid(0.3, 0.06, 0.12), stone, { pos: [0, 0.86, 0] });
  eyes(r, 'head', [[0.17, 0.56, 0.13], [-0.17, 0.56, 0.13]], 0.05, 0xd8ff6a, 1.4);
  for (const s of ['L', 'R']) {
    r.part('arm' + s, G.limb(0.12, 0.09, 0.62), skin);
    r.part('hand' + s, G.ellipsoid(0.12, 0.14, 0.1), skin, { pos: [0, -0.08, 0] });
    for (let k = 0; k < 3; k++) r.part('hand' + s, G.cone(0.025, 0.18, 4), 0x2a2a22, { pos: [(k - 1) * 0.06, -0.2, 0.04], rot: [Math.PI, 0, 0] });
  }
  for (const sx of [1, -1]) r.part('body', G.limb(0.16, 0.12, 0.5), skin, { pos: [sx * 0.3, -0.75, 0] });
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    b.body.rotation.z = Math.sin(c.t * 1.4) * 0.06;
    b.head.rotation.z = Math.sin(c.t * 1.1) * 0.08;
    b.body.position.y += Math.abs(Math.sin(c.phase)) * 0.05;
    const a = Math.max(0, c.atk);
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      b['arm' + s].rotation.x = -0.3 - a * 1.6 + Math.sin(c.t * 2 + sx) * 0.1;
      b['arm' + s].rotation.z = sx * 0.25;
    }
  });
}

/** Naoya Zen'in, reborn as a cursed spirit: a swollen, newborn-like body under that same bleached hair. */
export function naoyaCurse(): ModelHandle {
  const r = new RigBuilder();
  r.bone('body', 'root', [0, 1.35, 0]);
  r.bone('head', 'body', [0, 0.72, 0.12]);
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('arm' + s, 'body', [sx * 0.46, 0.42, 0]);
    r.bone('hand' + s, 'arm' + s, [0, -0.72, 0.06]);
    r.bone('leg' + s, 'body', [sx * 0.24, -0.38, 0]);
    r.bone('foot' + s, 'leg' + s, [0, -0.6, 0.04]);
  }
  const skin = 0xe8dcd0, crease = 0xc8b0a8, hair = 0xe8d48a;
  r.part('body', G.ellipsoid(0.46, 0.56, 0.4, 14, 10), skin, { topColor: lighten(skin, 1.08), colorFn: (_x, y, _z, c) => { if (Math.sin(y * 18) > 0.9) c.setHex(crease); } });
  r.part('head', G.ellipsoid(0.52, 0.5, 0.48, 16, 12), skin, { pos: [0, 0.22, 0], topColor: lighten(skin, 1.1) });
  r.part('head', G.ellipsoid(0.3, 0.06, 0.1), 0x3a0a10, { pos: [0, 0.02, 0.44] });
  teeth(r, 'head', 0, 0.05, 0.47, 0.5, 8, 0.03);
  eyes(r, 'head', [[0.18, 0.32, 0.42], [-0.18, 0.32, 0.42], [0.1, 0.46, 0.4], [-0.1, 0.46, 0.4]], 0.045, 0xfff07a, 1.4);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    r.part('head', G.cone(0.07, 0.32, 5), hair, { pos: [Math.sin(a) * 0.32, 0.62, Math.cos(a) * 0.28 - 0.04], rot: [Math.cos(a) * -0.5 - 0.3, 0, Math.sin(a) * 0.5], topColor: lighten(hair, 1.2) });
  }
  for (const s of ['L', 'R']) {
    r.part('arm' + s, G.limb(0.1, 0.07, 0.72), skin);
    r.part('hand' + s, G.ellipsoid(0.1, 0.12, 0.08), skin);
    for (let k = 0; k < 3; k++) r.part('hand' + s, G.cone(0.02, 0.22, 4), 0x2a1a1a, { pos: [(k - 1) * 0.05, -0.16, 0.03], rot: [Math.PI, 0, 0] });
    r.part('leg' + s, G.limb(0.13, 0.09, 0.6), skin);
    r.part('foot' + s, G.ellipsoid(0.1, 0.06, 0.16), skin, { pos: [0, -0.02, 0.05] });
  }
  // a torn membrane behind it, the shape of the kimono it died in
  r.part('body', G.ellipsoid(0.62, 0.7, 0.05, 12, 6), 0x2a2a34, { pos: [0, 0.1, -0.38], rot: [0.15, 0, 0] });
  const rig = r.build({ outline: 0.02 });
  return new Creature(rig, (c) => {
    const b = c.b;
    const w = Math.sin(c.phase);
    b.legL.rotation.x = w * 0.7; b.legR.rotation.x = -w * 0.7;
    b.armL.rotation.x = -w * 0.5 - Math.max(0, c.atk) * 1.4; b.armR.rotation.x = w * 0.5 - Math.max(0, c.atk) * 1.2;
    b.armL.rotation.z = 0.25; b.armR.rotation.z = -0.25;
    // the head twitches a frame at a time, like Projection Sorcery stuck on
    b.head.rotation.y = Math.round(Math.sin(c.t * 3) * 4) / 4 * 0.35;
    b.head.rotation.z = Math.sin(c.t * 1.7) * 0.1;
  });
}
