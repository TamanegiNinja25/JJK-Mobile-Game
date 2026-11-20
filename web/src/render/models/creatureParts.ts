// Shared pieces of the creature models: the curse skeleton on the humanoid rig, eyes and teeth, and the
// bespoke Creature rig the non-humanoid curses and shikigami are built on.
import * as THREE from 'three';
import { G, V3 } from '../geo';
import { RigBuilder, RigModel, resetPose } from '../rig';
import { Humanoid, HumanoidAnimator, darken, lighten } from './humanoid';
import { ModelHandle, wrapHumanoid } from './model';
import { SPECS } from './characters';
import { Rng, TAU, clamp } from '../../core/util';

// ---------------------------------------------------------------------------
// Humanoid-skeleton curses
// ---------------------------------------------------------------------------

export interface Dims { leg: number; torso: number; arm: number; shoulder: number; spread: number }

export function curseSkeleton(r: RigBuilder, d: Dims) {
  const hipY = d.leg * 2 + 0.05;
  r.bone('hips', 'root', [0, hipY, 0]);
  r.bone('spine', 'hips', [0, 0.05, 0]);
  r.bone('chest', 'spine', [0, d.torso * 0.5, 0]);
  r.bone('neck', 'chest', [0, d.torso * 0.45, 0]);
  r.bone('head', 'neck', [0, 0.06, 0]);
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('armUp' + s, 'chest', [sx * d.shoulder, d.torso * 0.38, 0]);
    r.bone('armLow' + s, 'armUp' + s, [0, -d.arm, 0]);
    r.bone('hand' + s, 'armLow' + s, [0, -d.arm * 0.92, 0]);
    r.bone('legUp' + s, 'hips', [sx * d.spread, -0.03, 0]);
    r.bone('legLow' + s, 'legUp' + s, [0, -d.leg, 0]);
    r.bone('foot' + s, 'legLow' + s, [0, -d.leg + 0.04, 0]);
  }
}

export function finishHumanoid(r: RigBuilder, outline = 0.022): ModelHandle {
  const m = r.build({ outline }) as Humanoid;
  m.spec = SPECS.civilianA;
  m.hand = m.bones.handR;
  m.handL = m.bones.handL;
  m.anim = new HumanoidAnimator(m);
  return wrapHumanoid(m);
}

export function eyes(r: RigBuilder, bone: string, pts: V3[], size: number, color: number, glow = 1.0) {
  for (const p of pts) {
    r.part(bone, G.sphere(size, 10, 8), 0x0a0a0a, { pos: [p[0], p[1], p[2] - size * 0.2] });
    r.part(bone, G.sphere(size * 0.82, 10, 8), color, { pos: p, glow });
    r.part(bone, G.sphere(size * 0.32, 6, 4), 0x050505, { pos: [p[0], p[1], p[2] + size * 0.62] });
  }
}

export function teeth(r: RigBuilder, bone: string, cx: number, cy: number, cz: number, width: number, n: number, size: number, down = true, curveZ = 0) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = cx + (t - 0.5) * width;
    const z = cz - Math.pow((t - 0.5) * 2, 2) * curveZ;
    r.part(bone, G.cone(size * 0.45, size, 5), 0xf4efe0, { pos: [x, cy, z], rot: [down ? Math.PI : 0, 0, 0] });
  }
}


// ---------------------------------------------------------------------------
// Bespoke creature rigs
// ---------------------------------------------------------------------------

export type AnimFn = (c: Creature, dt: number) => void;

export class Creature implements ModelHandle {
  root: THREE.Group;
  rig: RigModel;
  height: number;
  speed = 0;
  dead = false;
  t = Math.random() * 10;
  phase = 0;
  action: string | null = null;
  actionT = 0;
  actionDur = 0.3;
  hitT = 0;
  deadT = 0;
  hand?: THREE.Object3D;
  head?: THREE.Object3D;
  onStep: (() => void) | null = null;
  /** the `atk` curve pulls back until 0.4 and connects around 0.58 */
  impactFrac = 0.58;
  private anim: AnimFn;

  constructor(rig: RigModel, anim: AnimFn) {
    this.rig = rig;
    this.root = rig.root;
    this.height = rig.height;
    this.anim = anim;
    this.head = rig.bones.head ?? rig.bones.body;
    this.hand = rig.bones.head ?? rig.bones.body;
  }
  get b() { return this.rig.bones; }
  update(dt: number) {
    resetPose(this.rig);
    this.t += dt;
    if (this.speed > 0.2) {
      const before = Math.floor(this.phase / Math.PI);
      this.phase += dt * (5 + this.speed * 1.4);
      if (Math.floor(this.phase / Math.PI) !== before && !this.dead) this.onStep?.();
    }
    if (this.action) {
      this.actionT += dt / this.actionDur;
      if (this.actionT >= 1) { this.action = null; this.actionT = 0; }
    }
    if (this.hitT > 0) this.hitT -= dt;
    if (this.dead) this.deadT = Math.min(1, this.deadT + dt * 2);
    this.anim(this, dt);
    if (this.dead) {
      const body = this.b.body;
      if (body) {
        body.rotation.z += this.deadT * 1.4;
        body.position.y *= 1 - this.deadT * 0.6;
      }
    }
  }
  play(action: string, dur: number) { this.action = action; this.actionT = 0; this.actionDur = Math.max(0.05, dur); }
  hit() { this.hitT = 0.25; }
  die() { this.dead = true; this.deadT = 0; }
  revive() { this.dead = false; this.deadT = 0; }
  /** 0..1 attack curve: wind up then strike. */
  get atk() {
    if (!this.action) return 0;
    const t = this.actionT;
    return t < 0.4 ? -t / 0.4 * 0.5 : Math.sin(((t - 0.4) / 0.6) * Math.PI);
  }
}
