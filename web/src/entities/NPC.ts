// Friendly characters: quest givers, shopkeepers, classmates and civilians.
import type { World } from '../world/World';
import { buildCharacter } from '../render/models/characters';
import { wrapHumanoid, ModelHandle } from '../render/models/model';
import { withCustomModel } from '../render/models/imported';
import { approachAngle, rand } from '../core/util';
import { NPC_NAMES } from '../data/story';
import { PlayerState } from '../rpg/PlayerState';

export interface NpcDef {
  id: string;
  model?: string;
  x: number;
  z: number;
  facing?: number;
  shop?: 'potions' | 'armory' | 'workshop' | 'exchange' | 'travel' | 'reforge' | 'daily';
  cond?: (ps: PlayerState) => boolean;
  name?: string;
  pose?: string;
}

export class NPC {
  model: ModelHandle;
  x: number;
  z: number;
  facing: number;
  t = rand(0, 5);
  emoteT = rand(4, 9);
  radius = 0.5;
  constructor(public world: World, public d: NpcDef) {
    this.x = d.x; this.z = d.z;
    this.facing = d.facing ?? 0;
    this.model = this.makeModel();
  }

  /** The character's model (the player's own 3D model for them, if they picked one), placed in the world. */
  private makeModel() {
    const d = this.d;
    const m = withCustomModel(d.model ?? d.id, wrapHumanoid(buildCharacter(d.model ?? d.id)));
    m.root.position.set(this.x, 0, this.z);
    m.root.rotation.y = this.facing;
    this.world.root.add(m.root);
    if (d.id === 'gojo') m.setStance?.('none');
    return m;
  }

  /** Swaps in a fresh model (after the player adds or removes a 3D model for this character). */
  rebuildModel() {
    this.world.root.remove(this.model.root);
    this.model = this.makeModel();
  }
  get id() { return this.d.id; }
  get name() { return this.d.name ?? NPC_NAMES[this.d.id] ?? this.d.id; }

  update(dt: number) {
    this.t += dt;
    const p = this.world.player;
    const dist = Math.hypot(p.x - this.x, p.z - this.z);
    if (dist < 5) this.facing = approachAngle(this.facing, Math.atan2(p.x - this.x, p.z - this.z), dt * 4);
    else this.facing = approachAngle(this.facing, this.d.facing ?? 0, dt * 2);
    this.emoteT -= dt;
    if (this.emoteT <= 0) {
      this.emoteT = rand(6, 12);
      if (dist < 6 && Math.random() < 0.5) this.model.play('wave', 1.0);
    }
    if (this.d.pose === 'sit') this.model.play('sit', 0.5);
    this.model.speed = 0;
    this.model.root.rotation.y = this.facing;
    if (dist < 40) this.model.update(dt);
  }

  dispose() { this.world.root.remove(this.model.root); }
}
