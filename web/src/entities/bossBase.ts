// The shared machinery of every boss: move picking, telegraphs, the three stages, domains and the
// attack helpers (volleys, rains, slams) the boss scripts are written in.
// Boss attack patterns. Each boss is a small move-set with telegraphs, phases
// and, for the special grades, a domain expansion the player can clash with.
import { voice, VOICES } from '../audio/Voice';
import { haptic } from '../core/Haptics';
import * as THREE from 'three';
import type { Enemy } from './Enemy';
import type { Actor } from './Actor';
import { DamageOpts } from '../world/api';
import { rand, pick, TAU } from '../core/util';
import { STAGES } from './bossStages';


export interface BossScript {
  update(dt: number): boolean;
  onHit?(dmg: number, src: Actor | null): void;
  incomingMult?(opts: DamageOpts, bf?: boolean): number;
  phase: number;
}

export interface Move {
  id: string;
  cd: number;
  dur: number;
  min?: number;      // min distance to target
  max?: number;      // max distance
  phase?: number;    // available from this phase on
  weight?: number;
  run: () => void;
}

export abstract class BossBase implements BossScript {
  e: Enemy;
  busy = 0;
  cds: Record<string, number> = {};
  phase = 0;
  /**
   * The fight's three stages, the same for every boss: 1 above half health, 2 from half health, 3 (the final
   * phase) from a fifth. Each hits harder, attacks more often and moves faster than the last.
   */
  stage = 1;
  /** how much faster moves come round in this stage */
  private rate = 1;
  /** the signature move to open the new stage with, once the roar is over */
  private opener: string | null = null;
  /** moves this boss leans on from its current stage (see STAGES) */
  private favored = new Set<string>();
  private fired = new Set<string>();
  intro = true;

  constructor(e: Enemy) { this.e = e; }
  get w() { return this.e.world; }
  get t() { return this.e.target ?? this.w.player; }
  get hpPct() { return this.e.hp / this.e.maxHp; }

  abstract moves(): Move[];
  /** hp thresholds -> one-shot events */
  phases(): { at: number; id: string; run: () => void }[] { return []; }

  once(id: string, fn: () => void) { if (!this.fired.has(id)) { this.fired.add(id); fn(); } }

  update(dt: number): boolean {
    for (const k in this.cds) this.cds[k] -= dt;
    if (this.busy > 0) { this.busy -= dt; return true; }
    const e = this.e;
    const stage = this.hpPct > 0.5 ? 1 : this.hpPct > 0.2 ? 2 : 3;
    if (stage > this.stage) { this.stage = stage; this.enterStage(stage); return true; }
    // the stage's signature move, straight after the roar
    if (this.opener && this.t.alive) {
      const mv = this.moves().find(m => m.id === this.opener);
      this.opener = null;
      if (mv) { e.faceTowards(this.t.x, this.t.z, 1, 99); mv.run(); this.busy = mv.dur; this.cds[mv.id] = mv.cd / this.rate; return true; }
    }
    for (const p of this.phases()) if (this.hpPct <= p.at) this.once(p.id, () => { this.phase++; p.run(); });
    const t = this.t;
    if (!t.alive) return false;
    const dist = Math.hypot(t.x - e.x, t.z - e.z);
    if (dist > e.d.aggro * 1.6 && !e.aggro) return false;
    e.aggro = true;
    e.target = t;
    const favored = this.favored;
    const avail = this.moves().filter(m => (this.cds[m.id] ?? 0) <= 0 && (m.min === undefined || dist >= m.min) && (m.max === undefined || dist <= m.max) && (m.phase === undefined || this.phase >= m.phase));
    if (avail.length && e.atkCd <= 0) {
      let tot = 0;
      // a stage's favourite moves come up twice as often
      const wt = (m: Move) => (m.weight ?? 1) * (favored.has(m.id) ? 2 : 1);
      for (const m of avail) tot += wt(m);
      let r = Math.random() * tot;
      let mv = avail[0];
      for (const m of avail) { r -= wt(m); if (r <= 0) { mv = m; break; } }
      e.faceTowards(t.x, t.z, 1, 99);
      mv.run();
      // human bosses shout on their bigger moves, in the voice their dialogue uses
      if (mv.cd >= 4 && Math.random() < 0.55) {
        const vk = String(e.d.model ?? '').replace(/^char:/, '');
        if (VOICES[vk]) voice.bark('boss' + e.id, VOICES[vk], 'kiai', 0.9);
      }
      this.busy = mv.dur;
      this.cds[mv.id] = mv.cd / this.rate * (favored.has(mv.id) ? 0.55 : 1);
      e.atkCd = 0.35 / e.enrage / this.rate;
      return true;
    }
    // close distance
    const spd = e.d.speed * (e.slowT > 0 ? e.slowMul : 1) * (e.enrage > 1 ? 1.15 : 1) * (1 + (this.stage - 1) * 0.1);
    if (dist > 2.2) e.moveToward(t.x, t.z, spd, dt);
    else e.faceTowards(t.x, t.z, dt, 6);
    return true;
  }

  /**
   * A new stage: the boss roars, the screen names what it is about to do, and from now on it hits harder and
   * faster. Each boss then opens with its own signature move, leans on its favourite ones, and some take on a
   * bigger, more monstrous form (see STAGES).
   */
  protected enterStage(stage: number) {
    const e = this.e;
    const sig = STAGES[e.d.boss ?? '']?.[stage === 2 ? 0 : 1];
    e.stageMul = stage === 2 ? 1.25 : 1.5;
    this.rate = stage === 2 ? 1.18 : 1.4;
    this.busy = 0.9;
    this.opener = sig?.open ?? null;
    for (const id of sig?.favor ?? []) this.favored.add(id);
    this.anim('castUp', 0.9);
    this.w.sfx('roar', e.x, e.z, 1, stage === 3 ? 0.8 : 0.95);
    const col = sig?.aura ?? (stage === 3 ? 0xff1a2a : 0xff7a2a);
    this.w.fx.ring(e.x, e.z, col, 5, 0.7);
    this.w.fx.sheet('cursedBloom', e.x, 1.2, e.z, 6, 0.9, stage === 3 ? 0xff6a7a : 0xffffff);
    this.w.fx.pillar(e.x, e.z, 1.6 * e.scale, 6, col, 0.8);
    if (sig?.grow && e.model) {
      // a truer, bigger form: the model and its reach grow
      e.model.root.scale.multiplyScalar(sig.grow);
      e.radius *= sig.grow;
    }
    this.w.fx.shake(0.45, 0.5);
    haptic('phase');
    const vk = String(e.d.model ?? '').replace(/^char:/, '');
    if (VOICES[vk]) voice.bark('boss' + e.id, VOICES[vk], 'kiai', 1);
    this.w.game.ui.banner(stage === 3 ? 'FINAL PHASE' : 'PHASE 2', sig?.line ?? e.d.name, stage === 3 ? '#ff1a2a' : '#ff8a3a', 2);
  }

  // ---------------- helpers ----------------
  anim(a: string, d: number) { this.e.model?.play(a, d); }
  /** plays an attack animation stretched so its contact frame lands `at` seconds from now */
  strike(a: string, at: number) { this.e.model?.play(a, at / (this.e.model?.impactFrac ?? 0.5)); }

  slam(x: number, z: number, r: number, mult: number, windup: number, color = 0xff3a3a, sfx = 'shockwave', opts: DamageOpts = {}) {
    this.w.telegraph('circle', x, z, r, windup, color);
    this.w.schedule(windup, () => {
      if (!this.e.alive) return;
      this.w.sfx(sfx, x, z);
      this.w.fx.shockwave(x, z, r, color);
      this.w.fx.shake(0.35);
      this.w.damageArea(this.e, x, z, r, mult, { kind: 'melee', knock: 2, ...opts });
    });
  }

  line(dir: number, len: number, width: number, mult: number, windup: number, color: number, sfx: string, visual?: (x0: number, z0: number, x1: number, z1: number) => void, opts: DamageOpts = {}) {
    const e = this.e;
    const x0 = e.x, z0 = e.z;
    const x1 = x0 + Math.sin(dir) * len, z1 = z0 + Math.cos(dir) * len;
    this.w.telegraph('line', x0, z0, len, windup, color, { dir, width });
    this.w.schedule(windup, () => {
      if (!e.alive) return;
      this.w.sfx(sfx, x0, z0);
      visual?.(x0, z0, x1, z1);
      this.w.damageLine(e, x0, z0, x1, z1, width, mult, { kind: 'skill', ...opts });
    });
  }

  volley(n: number, spread: number, visual: any, speed: number, mult: number, color?: number, homing = 0, opts: DamageOpts = {}) {
    const e = this.e, t = this.t;
    const base = Math.atan2(t.x - e.x, t.z - e.z);
    for (let i = 0; i < n; i++) {
      const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      this.w.projectile({ x: e.x + Math.sin(a), z: e.z + Math.cos(a), dirX: Math.sin(a), dirZ: Math.cos(a), speed, range: 16, radius: 0.5, mult, visual, color, team: 'enemy', fromCaster: e as any, homing, opts: { kind: 'proj', ...opts } });
    }
  }

  /** Telegraphed circles dropped around the target, one after another. */
  rain(n: number, spread: number, r: number, mult: number, windup: number, gap: number, color: number, sfx: string, visual: (x: number, z: number) => void, opts: DamageOpts = {}) {
    const e = this.e;
    for (let i = 0; i < n; i++) this.w.schedule(i * gap, () => {
      if (!e.alive) return;
      const a = rand(0, TAU), d = i === 0 ? 0 : rand(0.5, spread);
      const x = this.t.x + Math.sin(a) * d, z = this.t.z + Math.cos(a) * d;
      this.w.telegraph('circle', x, z, r, windup, color);
      this.w.schedule(windup, () => {
        if (!e.alive) return;
        visual(x, z);
        this.w.sfx(sfx, x, z, 0.6);
        this.w.damageArea(e, x, z, r, mult, { kind: 'skill', ...opts });
      });
    });
  }

  /** A straight beam aimed at the target, with the standard lightning visual. */
  beam(dir: number, len: number, width: number, mult: number, windup: number, color: number, core = 0xffffff, opts: DamageOpts = {}, sfx = 'beam') {
    this.line(dir, len, width, mult, windup, color, sfx, (x0, z0, x1, z1) => {
      this.w.fx.lightning(x0, 1.4, z0, x1, 1.1, z1, color, Math.max(0.3, width * 0.3));
      this.w.fx.lightning(x0, 1.4, z0, x1, 1.1, z1, core, Math.max(0.1, width * 0.1));
      this.w.fx.shake(0.5, 0.4);
    }, opts);
  }

  aim() { return Math.atan2(this.t.x - this.e.x, this.t.z - this.e.z); }

  ringBurst(n: number, visual: any, speed: number, mult: number, color?: number, offset = 0) {
    const e = this.e;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + offset;
      this.w.projectile({ x: e.x + Math.sin(a) * 0.8, z: e.z + Math.cos(a) * 0.8, dirX: Math.sin(a), dirZ: Math.cos(a), speed, range: 14, radius: 0.5, mult, visual, color, team: 'enemy', fromCaster: e as any, opts: { kind: 'proj' } });
    }
  }

  charge(speed: number, dur: number, mult: number, windup = 0.5) {
    const e = this.e, t = this.t;
    const dir = Math.atan2(t.x - e.x, t.z - e.z);
    this.w.telegraph('line', e.x, e.z, speed * dur, windup, 0xff4a3a, { dir, width: e.radius * 2 + 0.6 });
    this.w.schedule(windup, () => {
      if (!e.alive) return;
      e.facing = dir;
      e.lungeV = { x: Math.sin(dir) * speed, z: Math.cos(dir) * speed, t: dur };
      e.hitPlayerThisLunge = false;
      this.anim('dash', dur);
      this.w.sfx('dash', e.x, e.z, 1, 0.6);
      const steps = Math.ceil(dur / 0.08);
      for (let i = 1; i <= steps; i++) this.w.schedule(i * 0.08, () => {
        if (!e.alive || e.hitPlayerThisLunge) return;
        const p = this.w.player;
        if (Math.hypot(p.x - e.x, p.z - e.z) < e.radius + p.radius + 0.6) {
          e.hitPlayerThisLunge = true;
          this.w.damageTargetActor(e, p, mult, { kind: 'melee', knock: 3, hitSfx: 'punch' });
        }
      });
    });
  }

  combo(n: number, mult: number, gap: number, anims: string[], sfx = 'slash', range = 3, arc = 1.8) {
    const e = this.e;
    for (let i = 0; i < n; i++) this.w.schedule(i * gap, () => {
      if (!e.alive) return;
      const t = this.t;
      e.faceTowards(t.x, t.z, 1, 99);
      const d = Math.hypot(t.x - e.x, t.z - e.z);
      if (d > range * 0.8) e.lungeV = { x: Math.sin(e.facing) * 8, z: Math.cos(e.facing) * 8, t: 0.12 };
      this.strike(anims[i % anims.length], gap * 0.45);
      this.w.schedule(gap * 0.3, () => { if (e.alive) this.w.sfx('swing', e.x, e.z, 0.7); });
      this.w.schedule(gap * 0.45, () => {
        if (!e.alive) return;
        this.w.fx.slash(e.x, e.z, e.facing, range * 0.8, 0xffd0d0, arc, i % 2 ? 0.8 : -0.8);
        this.w.damageCone(e, e.x, e.z, e.facing, range, arc, mult, { kind: 'melee', hitSfx: sfx, knock: 0.8 });
      });
    });
  }

  /** Summons up to `n` adds, never letting more than `cap` of that kind be alive at once. */
  summonAdds(id: string, n: number, r = 4, cap = 5) {
    const e = this.e;
    const alive = this.w.enemies.filter(o => o.alive && o.noLoot && o.d.id === id).length;
    n = Math.min(n, cap - alive);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(0, 1);
      const x = e.x + Math.sin(a) * r, z = e.z + Math.cos(a) * r;
      if (this.w.col.blocked(x, z, 0.6)) continue;
      this.w.fx.sigil(x, z, 1.2, 0x8a2a4a, 0.8);
      this.w.fx.smoke(x, z, 0x2a1a2a, 10);
      // a boss's own summons are the only other curses allowed in the fight
      this.w.schedule(0.5, () => { if (e.alive) this.w.spawnEnemy(id, x, z, e.level - 3, true).bossAdd = true; });
    }
  }

  domain(kind: string, r: number, dur: number, dpsPct: number, banner: string) {
    this.anim('domain', 1.4);
    this.w.bossDomain(this.e, kind, r, dur, dpsPct, banner);
  }

  teleportNear(dist = 3) {
    const e = this.e, t = this.t;
    for (let k = 0; k < 8; k++) {
      const a = rand(0, TAU);
      const x = t.x + Math.sin(a) * dist, z = t.z + Math.cos(a) * dist;
      if (!this.w.col.blocked(x, z, e.radius)) {
        this.w.fx.smoke(e.x, e.z, 0x111111, 12);
        e.place(x, z);
        this.w.fx.smoke(x, z, 0x111111, 12);
        this.w.sfx('teleport', x, z);
        e.faceTowards(t.x, t.z, 1, 99);
        return;
      }
    }
  }
}

