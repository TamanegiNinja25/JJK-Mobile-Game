// Common interface every animated model exposes to entities.
import * as THREE from 'three';
import { RigModel } from '../rig';
import { Humanoid, ActionName, ACTION_TIMING } from './humanoid';

export interface ModelHandle {
  root: THREE.Group;
  rig: RigModel;
  height: number;
  /** Planar movement speed, used to drive locomotion cycles. */
  speed: number;
  dead: boolean;
  update(dt: number): void;
  play(action: string, dur: number): void;
  hit(): void;
  die(): void;
  revive(): void;
  /** Bone to which a held weapon or effect can be attached. */
  hand?: THREE.Object3D;
  handL?: THREE.Object3D;
  head?: THREE.Object3D;
  setStance?(s: 'fist' | 'blade' | 'hammer' | 'none'): void;
  /** fired when a foot hits the ground during locomotion */
  onStep?: (() => void) | null;
  /** fraction of an attack animation at which the blow connects */
  impactFrac?: number;
}

export function wrapHumanoid(h: Humanoid): ModelHandle {
  const a = h.anim;
  const handle: ModelHandle = {
    root: h.root,
    rig: h,
    height: h.height,
    get speed() { return a.speed; },
    set speed(v: number) { a.speed = v; },
    get dead() { return a.dead; },
    set dead(v: boolean) { a.dead = v; },
    update: (dt) => a.update(dt),
    play: (action, dur) => a.play(action as ActionName, dur),
    hit: () => { a.hitT = 0.25; },
    die: () => { a.dead = true; a.deadT = 0; },
    revive: () => { a.dead = false; a.deadT = 0; },
    hand: h.hand,
    handL: h.handL,
    head: h.bones.head,
    setStance: (s) => { a.stance = s; },
    impactFrac: ACTION_TIMING.impact,
    get onStep() { return a.onStep; },
    set onStep(f: (() => void) | null) { a.onStep = f; },
  };
  return handle;
}
