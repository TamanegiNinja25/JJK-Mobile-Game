// Friendly characters: quest givers, shopkeepers, classmates and civilians. Someone with a quest for you
// stands in a glowing ring: gold when they have a new one (!), green when you have something to report (?).
import * as THREE from 'three';
import type { World } from '../world/World';
import { fxMaterial } from '../render/toon';
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

// the ring of light on the ground, shared by every quest character: one texture, one material per colour
let ringGeo: THREE.PlaneGeometry | null = null;
let ringTex: THREE.CanvasTexture | null = null;
const ringMats = new Map<'!' | '?', THREE.MeshBasicMaterial>();
function questRing(kind: '!' | '?') {
  if (!ringGeo || !ringTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.16)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    ringTex = new THREE.CanvasTexture(c);
    ringTex.colorSpace = THREE.SRGBColorSpace;
    ringGeo = new THREE.PlaneGeometry(2.2, 2.2);
    ringGeo.rotateX(-Math.PI / 2);
  }
  let m = ringMats.get(kind);
  if (!m) { m = fxMaterial(kind === '!' ? 0xffc83a : 0x5affa0, 0.85, true, ringTex); ringMats.set(kind, m); }
  const mesh = new THREE.Mesh(ringGeo, m);
  mesh.renderOrder = 1;
  mesh.userData.shared = true;
  return mesh;
}

/** All quest rings breathe together. */
export function pulseQuestRings(t: number) {
  const a = 0.62 + Math.sin(t * 3) * 0.22;
  for (const m of ringMats.values()) m.opacity = a;
}

export class NPC {
  model: ModelHandle;
  /** the glowing ring under them while they have a quest for you */
  private ring: THREE.Mesh | null = null;
  private ringKind: '' | '!' | '?' = '';
  private ringT = 0;
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
    // the quest ring: checked a few times a second, not every frame
    this.ringT -= dt;
    if (this.ringT <= 0) {
      this.ringT = 0.3;
      const k = this.world.npcMarker(this.id, this.d.shop);
      const want = k === '!' || k === '?' ? k : '';
      if (want !== this.ringKind) {
        if (this.ring) { this.world.root.remove(this.ring); this.ring = null; }
        if (want) { this.ring = questRing(want); this.ring.position.set(this.x, 0.04, this.z); this.world.root.add(this.ring); }
        this.ringKind = want;
      }
    }
    if (this.ring) { const sc = 1 + Math.sin(this.t * 3 + this.x) * 0.06; this.ring.scale.set(sc, 1, sc); }
  }

  dispose() {
    this.world.root.remove(this.model.root);
    if (this.ring) { this.world.root.remove(this.ring); this.ring = null; }
  }
}
