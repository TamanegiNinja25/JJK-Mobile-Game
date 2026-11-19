// Bosses from the Death Paintings to the Shinjuku Showdown.
// Boss attack patterns. Each boss is a small move-set with telegraphs, phases
// and, for the special grades, a domain expansion the player can clash with.
import { voice, VOICES } from '../audio/Voice';
import { haptic } from '../core/Haptics';
import * as THREE from 'three';
import type { Enemy } from './Enemy';
import type { Actor } from './Actor';
import { DamageOpts } from '../world/api';
import { rand, pick, TAU } from '../core/util';
import { BossBase, Move } from './bossBase';

// ---------------------------------------------------------------------------
// Death Paintings
// ---------------------------------------------------------------------------

const BLOOD = 0xc8102a;
const DECAY: DamageOpts = { dot: { mult: 0.12, dur: 4 } };

/** Kechizu: corrosive blood spit, puddles of decay and clumsy body slams. */
export class Kechizu extends BossBase {
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'bite', cd: 1.9, dur: 1.0, max: 3, weight: 3, run: () => this.combo(2, 1.1, 0.42, ['punch1', 'punch2'], 'squish', 2.8, 1.8) },
      { id: 'spit', cd: 3.6, dur: 1.0, min: 2.5, max: 13, weight: 2.5, run: () => {
        this.strike('throw', 0.4);
        this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('blood', e.x, e.z, 0.8, 1.2); this.volley(3, 0.5, 'red', 11, 1.05, BLOOD, 0, DECAY); } });
      } },
      { id: 'puddles', cd: 6.5, dur: 1.4, weight: 2, run: () => {
        this.anim('cast', 1.0);
        this.rain(3, 2.6, 1.7, 1.0, 0.85, 0.22, BLOOD, 'blood', (x, z) => { this.w.fx.burst(x, 0.3, z, BLOOD, 18, 3, 0.3, 0.7, false); this.w.fx.shockwave(x, z, 1.7, BLOOD); }, DECAY);
      } },
      { id: 'hop', cd: 7, dur: 1.4, min: 4, weight: 1.5, run: () => {
        const tx = this.t.x, tz = this.t.z;
        this.strike('slam', 0.9);
        this.slam(tx, tz, 2.8, 1.6, 0.9, BLOOD, 'land');
        this.w.schedule(0.7, () => { if (e.alive) e.place(tx, tz); });
      } },
    ];
  }
  phases() {
    return [{ at: 0.5, id: 'brother', run: () => {
      this.e.enrage = 1.2;
      this.w.sfx('screech', this.e.x, this.e.z);
      this.summonAdds('bloodFetus', 3, 3.5, 4);
      this.w.game.toast('"BROTHER! Brother, help me!"', 'boss', 1.8);
    } }];
  }
}

/** Eso: Wing King blood fans from his back and Rot Technique decay on every hit. */
export class Eso extends BossBase {
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'fists', cd: 1.7, dur: 1.1, max: 3, weight: 3, run: () => this.combo(3, 1.0, 0.34, ['punch1', 'punch2', 'kick'], 'punch', 2.6, 1.8) },
      { id: 'wing', cd: 5, dur: 1.3, min: 2.5, weight: 2.5, run: () => {
        this.anim('castUp', 1.0);
        this.w.game.toast('"Wing King!"', 'boss', 1.1);
        this.w.sfx('blood', e.x, e.z, 0.9, 0.8);
        this.w.schedule(0.6, () => { if (e.alive) { this.w.fx.burst(e.x, 1.6, e.z, BLOOD, 24, 5, 0.3, 0.6); this.volley(7, 1.6, 'red', 12, 1.0, BLOOD, 0, DECAY); } });
      } },
      { id: 'rot', cd: 7, dur: 1.5, weight: 2, run: () => {
        this.anim('cast', 1.2);
        this.w.game.toast('Rot Technique: Decay!', 'boss', 1.1);
        this.rain(5, 3.2, 1.6, 1.1, 0.8, 0.16, 0x6a8a3a, 'blood', (x, z) => { this.w.fx.burst(x, 0.4, z, 0x8aaa3a, 16, 3, 0.3, 0.7, false); this.w.fx.burst(x, 0.4, z, BLOOD, 10, 4, 0.25, 0.5); }, { dot: { mult: 0.16, dur: 5 } });
      } },
      { id: 'dash', cd: 5.5, dur: 1.1, min: 5, weight: 1.5, run: () => this.charge(14, 0.45, 1.4, 0.5) },
    ];
  }
  phases() {
    return [
      { at: 0.5, id: 'rage', run: () => { this.e.enrage = 1.3; this.w.fx.ring(this.e.x, this.e.z, BLOOD, 3, 0.6); this.w.game.toast('"You killed Kechizu! You will rot for it!"', 'boss', 1.8); } },
      { at: 0.25, id: 'storm', run: () => {
        this.anim('castUp', 1.0);
        this.w.schedule(0.5, () => { if (this.e.alive) { this.w.sfx('blood', this.e.x, this.e.z, 1, 0.7); this.ringBurst(18, 'red', 9, 0.9, BLOOD); } });
      } },
    ];
  }
}

// ---------------------------------------------------------------------------
// Perfect Preparation
// ---------------------------------------------------------------------------

/** Yuji Itadori, when the player is the executioner Yuta: fists, Divergent Fist and a Black Flash he can't call on cue. */
export class YujiRival extends BossBase {
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'punches', cd: 1.4, dur: 1.1, max: 3, weight: 3, run: () => this.combo(3, 1.0, 0.28, ['punch1', 'punch2', 'kick'], 'punch', 2.6, 1.8) },
      { id: 'divergent', cd: 4.5, dur: 1.1, max: 6, weight: 2.5, run: () => {
        this.strike('punch2', 0.45);
        this.w.game.toast('"Divergent Fist!"', 'boss', 0.9);
        this.slam(e.x + Math.sin(e.facing) * 1.6, e.z + Math.cos(e.facing) * 1.6, 2.4, 1.5, 0.45, 0x6ab8ff, 'divergent', { knock: 2.5 });
      } },
      { id: 'leap', cd: 6, dur: 1.2, min: 4, weight: 1.5, run: () => this.charge(14, 0.5, 1.3, 0.4) },
      { id: 'bf', cd: 10, dur: 1.4, max: 4, phase: 1, weight: 1.5, run: () => {
        this.strike('uppercut', 0.8);
        this.w.sfx('charge', e.x, e.z);
        this.slam(e.x + Math.sin(e.facing) * 1.4, e.z + Math.cos(e.facing) * 1.4, 2.2, 2.6, 0.8, 0xff2a3a, 'blackflash', { knock: 4 });
        this.w.schedule(0.8, () => { if (e.alive) this.w.fx.blackFlash(e.x + Math.sin(e.facing) * 1.4, 1.2, e.z + Math.cos(e.facing) * 1.4); });
      } },
    ];
  }
  phases() { return [{ at: 0.5, id: 'bf', run: () => { this.w.game.toast('"I\'m not done yet!"', 'boss'); this.e.enrage = 1.15; } }]; }
}

/** Yuta Okkotsu: katana, Rika's hands, borrowed Cursed Speech, a copy of your own technique and Pure Love. */
export class Yuta extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const cls = this.w.game.ps?.cls.persona ?? 'yuji';
    return [
      { id: 'katana', cd: 1.6, dur: 1.1, max: 3.4, weight: 3, run: () => this.combo(3, 1.05, 0.33, ['slash1', 'slash2', 'thrust'], 'slash', 3.2, 2.0) },
      { id: 'rika', cd: 5.5, dur: 1.4, weight: 2.5, run: () => {
        this.anim('summon', 1.0);
        this.w.game.toast('"Rika!"', 'boss', 0.9);
        this.rain(3, 2.4, 2.0, 1.5, 1.0, 0.25, 0xffb0d8, 'shockwave', (x, z) => { this.w.fx.shockwave(x, z, 2, 0xffb0d8); this.w.fx.burst(x, 1, z, 0xffffff, 16, 5, 0.3, 0.5); this.w.fx.shake(0.4); });
      } },
      { id: 'speech', cd: 9, dur: 1.2, max: 7, weight: 1.5, run: () => {
        this.anim('cast', 0.9);
        this.w.game.toast('Cursed Speech: "Don\'t move."', 'boss', 1.2);
        this.slam(e.x, e.z, 6, 0.6, 0.75, 0xd8d8ff, 'roar', { stun: 1.0, knock: 0 });
      } },
      { id: 'copy', cd: 8, dur: 1.4, phase: 1, weight: 2, run: () => {
        if (cls === 'megumi') {
          this.anim('summon', 1.0);
          this.w.game.toast('Copy: Ten Shadows — "Divine Dogs."', 'boss', 1.2);
          this.summonAdds('shadowHound', 2, 3, 2);
        } else if (cls === 'nobara') {
          this.strike('throw', 0.45);
          this.w.game.toast('Copy: Straw Doll — Hairpin.', 'boss', 1.2);
          this.w.schedule(0.45, () => { if (e.alive) { this.w.sfx('nail', e.x, e.z); this.volley(6, 1.0, 'nail', 15, 0.9, 0xd8d8e0); } });
        } else {
          const x = e.x + Math.sin(e.facing) * 1.4, z = e.z + Math.cos(e.facing) * 1.4;
          this.strike('uppercut', 0.8);
          this.w.game.toast('Copy: Divergent Fist.', 'boss', 1.2);
          this.slam(x, z, 2.4, 2.4, 0.8, 0xff3a5a, 'blackflash', { knock: 4 });
          this.w.schedule(0.8, () => { if (e.alive) this.w.fx.blackFlash(x, 1.2, z); });
        }
      } },
      { id: 'love', cd: 14, dur: 2.6, phase: 2, min: 3, weight: 3, run: () => {
        this.anim('cast', 2.2);
        this.w.game.toast('"Rika. Lend me everything." — Pure Love!', 'boss', 1.6);
        this.w.sfx('charge', e.x, e.z);
        this.beam(this.aim(), 22, 3.4, 3.4, 1.6, 0xffb0e0, 0xffffff);
      } },
    ];
  }
  phases() {
    return [
      { at: 0.6, id: 'copy', run: () => { this.w.game.toast('Yuta copies techniques he has seen. He has seen yours.', 'boss', 2); } },
      { at: 0.35, id: 'rika', run: () => {
        this.e.enrage = 1.3;
        this.w.sfx('roar', this.e.x, this.e.z, 1, 0.7);
        this.w.fx.ring(this.e.x, this.e.z, 0xffb0e0, 4, 0.8);
        this.w.game.toast('Rika — Full Manifestation!', 'boss', 1.8);
      } },
    ];
  }
}

/** Naoya Zen'in: Projection Sorcery. He plans 24 frames ahead, then moves along them at blinding speed. */
export class Naoya extends BossBase {
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'jabs', cd: 1.3, dur: 1.0, max: 3, weight: 3, run: () => this.combo(4, 0.75, 0.22, ['punch1', 'punch2', 'kick', 'punch1'], 'punch', 2.6, 1.6) },
      { id: 'frames', cd: 4.5, dur: 1.6, min: 2, weight: 3, run: () => this.frames(3) },
      { id: 'blink', cd: 4, dur: 0.8, min: 4, weight: 1.5, run: () => { this.teleportNear(1.8); this.w.schedule(0.15, () => { if (e.alive) this.combo(1, 1.4, 0.3, ['spinKick'], 'kick', 2.8, 2.2); }); } },
      { id: 'boom', cd: 9, dur: 1.4, phase: 1, weight: 2, run: () => {
        this.frames(5);
        this.w.schedule(1.25, () => { if (e.alive) { this.w.fx.shockwave(e.x, e.z, 4, 0xe8f0ff); this.w.sfx('shockwave', e.x, e.z); this.w.damageArea(e, e.x, e.z, 4, 1.4, { kind: 'skill', knock: 4 }); } });
      } },
    ];
  }

  /** Plans a zig-zag path through the target, telegraphs every segment, then runs it. */
  private frames(n: number) {
    const e = this.e;
    const pts: [number, number][] = [[e.x, e.z]];
    let x = e.x, z = e.z;
    for (let i = 0; i < n; i++) {
      const tx = this.t.x + rand(-2.5, 2.5), tz = this.t.z + rand(-2.5, 2.5);
      const a = Math.atan2(tx - x, tz - z) + (i % 2 ? 0.5 : -0.5);
      const d = Math.min(9, Math.hypot(tx - x, tz - z) + 2.5);
      let nx = x + Math.sin(a) * d, nz = z + Math.cos(a) * d;
      if (this.w.col.blocked(nx, nz, e.radius)) { nx = tx; nz = tz; }
      pts.push([nx, nz]);
      x = nx; z = nz;
    }
    this.anim('dash', 0.3);
    this.w.sfx('dash', e.x, e.z, 0.6, 1.4);
    const windup = 0.75 / e.enrage;
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
      const dir = Math.atan2(x1 - x0, z1 - z0), len = Math.hypot(x1 - x0, z1 - z0);
      this.w.telegraph('line', x0, z0, len, windup + i * 0.07, 0xe8f0ff, { dir, width: 1.3 });
      this.w.schedule(windup + i * 0.07, () => {
        if (!e.alive) return;
        e.place(x1, z1);
        e.facing = dir;
        this.w.fx.lightning(x0, 1, z0, x1, 1, z1, 0xe8f0ff, 0.2);
        this.w.sfx('swing', x1, z1, 0.7, 1.5);
        this.w.damageLine(e, x0, z0, x1, z1, 1.3, 1.15, { kind: 'melee', stun: 0.7, hitSfx: 'punch' });
      });
    }
  }

  phases() {
    return [
      { at: 0.5, id: 'fast', run: () => { this.e.enrage = 1.35; this.w.game.toast('"Too slow! You\'re living one frame behind me!"', 'boss', 1.8); } },
      { at: 0.2, id: 'faster', run: () => { this.e.enrage = 1.55; this.w.fx.ring(this.e.x, this.e.z, 0xe8f0ff, 3, 0.5); this.w.game.toast('Naoya pushes Projection Sorcery past its limit!', 'boss', 1.6); } },
    ];
  }
}

// ---------------------------------------------------------------------------
// The Culling Game
// ---------------------------------------------------------------------------

/** Hiromi Higuruma: Deadly Sentencing. Lose the trial and your technique is confiscated. */
export class Higuruma extends BossBase {
  sword = 0;
  moves(): Move[] {
    const e = this.e;
    const armed = () => this.w.time < this.sword;
    return [
      { id: 'gavel', cd: 1.8, dur: 1.2, max: 3.4, weight: 3, run: () => {
        if (armed()) { this.combo(2, 1.5, 0.45, ['slash1', 'slash2'], 'slash', 3.4, 2.0); return; }
        this.combo(2, 1.15, 0.45, ['hammer', 'slam'], 'hammer', 3.0, 1.8);
      } },
      { id: 'enlarge', cd: 5, dur: 1.3, min: 2, max: 12, weight: 2.5, run: () => {
        this.strike('hammer', 0.85);
        this.w.game.toast('Higuruma enlarges his gavel!', 'boss', 1);
        this.slam(this.t.x, this.t.z, 2.6, 1.7, 0.85, 0xd8b04a, 'gavel', { knock: 3 });
      } },
      { id: 'throw', cd: 6, dur: 1.0, min: 4, weight: 1.5, run: () => {
        this.strike('throw', 0.4);
        this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('swingHeavy', e.x, e.z); this.volley(1, 0, 'orb', 15, 1.6, 0xd8b04a, 1.5); } });
      } },
      { id: 'execute', cd: 3.2, dur: 1.4, max: 8, weight: 4, run: () => {
        if (!armed()) { this.combo(1, 1.2, 0.4, ['hammer'], 'hammer', 3, 1.8); return; }
        this.strike('slash2', 0.9);
        this.w.game.toast('Executioner\'s Sword!', 'boss', 1);
        this.line(this.aim(), 7, 1.8, 3.4, 0.9, 0xffffff, 'dismantle', (x0, z0, x1, z1) => {
          for (let i = 1; i <= 4; i++) { const k = i / 4; this.w.fx.slash(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, e.facing + Math.PI / 2, 1.4, 0xffffff, 0.9, 0.4); }
          this.w.fx.shake(0.6);
        }, { kind: 'melee' });
      } },
    ];
  }

  /** Expands Deadly Sentencing, then hands down the verdict if the domain is still standing. */
  private trial() {
    const e = this.e;
    this.e.enrage = 1.2;
    this.domain('court', 12, 7, 0.02, 'Domain Expansion: Deadly Sentencing');
    if (this.w.bossDom?.enemy !== e) return;
    this.w.game.toast('Judgeman reads the charges… Clash with your Ultimate before the verdict!', 'boss', 2.6);
    this.w.schedule(2.8, () => {
      if (!e.alive || this.w.bossDom?.enemy !== e) return;
      const p = this.w.player;
      this.w.sfx('gavel', e.x, e.z);
      if (Math.hypot(p.x - e.x, p.z - e.z) > 12) { this.w.game.toast('Verdict: the defendant fled the court.', 'boss', 1.6); return; }
      this.w.game.ui.banner('GUILTY', 'Penalty: Confiscation — your techniques are sealed', '#d8b04a');
      this.w.game.ps!.addBuff('confiscated', 12, {});
      this.w.fx.flash('#d8b04a', 0.35, 0.4);
      this.sword = this.w.time + 16;
      this.w.schedule(0.6, () => { if (e.alive) this.w.game.toast('Higuruma\'s gavel becomes the Executioner\'s Sword!', 'boss', 1.8); });
    });
  }

  phases() {
    return [
      { at: 0.6, id: 'trial1', run: () => this.trial() },
      { at: 0.25, id: 'trial2', run: () => { this.e.enrage = 1.3; this.trial(); } },
    ];
  }
}

/** Hajime Kashimo: lightning that strikes wherever it is aimed, then Mythical Beast Amber. */
export class Kashimo extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const BOLT = 0x7ae0ff;
    return [
      { id: 'staff', cd: 1.5, dur: 1.1, max: 3.6, weight: 3, run: () => this.combo(3, 1.05, 0.32, ['thrust', 'slash2', 'thrust'], 'lightning', 3.4, 1.6) },
      { id: 'bolts', cd: 4, dur: 1.2, min: 2, weight: 2.5, run: () => {
        this.anim('cast', 0.9);
        for (const off of [-0.35, 0, 0.35]) this.line(this.aim() + off, 16, 1.0, 1.25, 0.6, BOLT, 'thunder', (x0, z0, x1, z1) => {
          this.w.fx.lightning(x0, 1.2, z0, x1, 1, z1, BOLT, 0.3);
          this.w.fx.lightning(x0, 1.2, z0, x1, 1, z1, 0xffffff, 0.08);
        }, { stun: 0.25 });
      } },
      { id: 'discharge', cd: 6, dur: 1.1, max: 6, weight: 2, run: () => {
        this.anim('castUp', 0.8);
        this.slam(e.x, e.z, 4.2, 1.5, 0.7, BOLT, 'thunder', { stun: 0.5, knock: 3 });
        this.w.schedule(0.7, () => { if (e.alive) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; this.w.fx.lightning(e.x, 1.2, e.z, e.x + Math.sin(a) * 4, 0.2, e.z + Math.cos(a) * 4, BOLT, 0.2); } });
      } },
      { id: 'dash', cd: 4.5, dur: 1.0, min: 5, weight: 1.5, run: () => this.charge(17, 0.4, 1.5, 0.45) },
      { id: 'amber', cd: 7, dur: 1.8, phase: 1, weight: 3, run: () => {
        this.anim('castUp', 1.4);
        this.w.game.toast('Lightning falls from a clear sky!', 'boss', 1.1);
        this.rain(6, 3, 1.6, 1.4, 0.7, 0.18, BOLT, 'thunder', (x, z) => {
          this.w.fx.lightning(x, 14, z, x, 0, z, BOLT, 0.45);
          this.w.fx.lightning(x, 14, z, x, 0, z, 0xffffff, 0.12);
          this.w.fx.shockwave(x, z, 1.6, BOLT);
        }, { stun: 0.3 });
      } },
    ];
  }
  phases() {
    return [{ at: 0.4, id: 'amber', run: () => {
      this.e.enrage = 1.45;
      this.w.sfx('thunder', this.e.x, this.e.z);
      this.w.fx.flash('#bfefff', 0.4, 0.4);
      this.w.game.ui.banner('MYTHICAL BEAST AMBER', 'Kashimo\'s body turns to lightning', '#7ae0ff');
    } }];
  }
}

/** Ryu Ishigori: the highest cursed energy output of any sorcerer. Granite Blast. */
export class Ishigori extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const CE = 0x9adfff;
    return [
      { id: 'fists', cd: 1.9, dur: 1.2, max: 3.2, weight: 3, run: () => this.combo(2, 1.4, 0.48, ['punch1', 'uppercut'], 'punch', 3.0, 1.8) },
      { id: 'granite', cd: 6, dur: 2.0, min: 3, weight: 3, run: () => {
        this.anim('cast', 1.8);
        this.w.game.toast('Granite Blast!', 'boss', 1.1);
        this.w.sfx('charge', e.x, e.z, 1, 0.7);
        const dir = this.aim();
        const dirs = this.phase >= 1 ? [dir - 0.55, dir, dir + 0.55] : [dir];
        for (const d of dirs) this.beam(d, 24, 3.0, 2.8, 1.3, CE, 0xffffff, { knock: 5 });
      } },
      { id: 'barrage', cd: 4.5, dur: 1.0, min: 2, weight: 2, run: () => {
        this.strike('throw', 0.4);
        this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('blue', e.x, e.z, 0.7); this.volley(9, 1.8, 'blue', 12, 1.0, CE); } });
      } },
      { id: 'stomp', cd: 7, dur: 1.3, max: 6, weight: 1.5, run: () => { this.strike('slam', 0.9); this.slam(e.x, e.z, 4.8, 1.8, 0.9, CE, 'shockwave', { knock: 5 }); } },
    ];
  }
  phases() {
    return [
      { at: 0.5, id: 'max', run: () => { this.e.enrage = 1.3; this.w.fx.ring(this.e.x, this.e.z, 0x9adfff, 4, 0.8); this.w.game.toast('"MAXIMUM OUTPUT! Ahahaha, I\'m finally getting hungry!"', 'boss', 2); } },
      { at: 0.2, id: 'feast', run: () => { this.e.enrage = 1.45; this.w.game.toast('Ishigori is having the time of his life.', 'boss', 1.6); } },
    ];
  }
}

/** Takako Uro: Sky Manipulation. She folds the sky like cloth; projectiles slide off it. */
export class Uro extends BossBase {
  shield = 0;
  moves(): Move[] {
    const e = this.e;
    const SKY = 0x9ad0ff;
    return [
      { id: 'kicks', cd: 1.5, dur: 1.0, max: 3, weight: 3, run: () => this.combo(3, 1.0, 0.3, ['kick', 'spinKick', 'kick'], 'kick', 2.8, 2.0) },
      { id: 'breaker', cd: 5, dur: 1.4, min: 2, weight: 3, run: () => {
        this.anim('slam', 1.1);
        this.w.game.toast('Thin Ice Breaker!', 'boss', 1);
        this.line(this.aim(), 16, 4.0, 1.9, 0.9, SKY, 'wind', (x0, z0, x1, z1) => {
          for (let i = 1; i <= 6; i++) { const k = i / 6; this.w.fx.slash(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, e.facing + Math.PI / 2, 2.0, SKY, 1.2, 0.2); }
          this.w.fx.shake(0.5);
        }, { knock: 6 });
      } },
      { id: 'fold', cd: 7, dur: 1.2, weight: 2, run: () => {
        this.anim('castUp', 0.9);
        this.w.sfx('wind', e.x, e.z);
        this.shield = this.w.time + 5;
        this.w.fx.ring(e.x, e.z, SKY, 2.5, 0.6);
        this.w.game.toast('Uro folds the sky around herself — projectiles slide off!', 'boss', 1.6);
        this.w.schedule(0.5, () => { if (e.alive) this.ringBurst(12, 'blue', 8, 1.0, SKY, rand(0, 1)); });
      } },
      { id: 'dash', cd: 4.5, dur: 1.0, min: 5, weight: 1.5, run: () => this.charge(16, 0.4, 1.4, 0.45) },
    ];
  }
  incomingMult(opts: DamageOpts) { return this.w.time < this.shield && opts.kind === 'proj' ? 0.3 : 1; }
  phases() { return [{ at: 0.45, id: 'p2', run: () => { this.e.enrage = 1.25; this.w.game.toast('"I captained the Moonlit Wings a thousand years ago. Don\'t bore me."', 'boss', 2); } }]; }
}

// ---------------------------------------------------------------------------
// Shinjuku Showdown
// ---------------------------------------------------------------------------

/** Uraume: Ice Formation. Frost Calm slows everything it touches; Icefall drops from above. */
export class Uraume extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const ICE = 0xbfe4ff;
    return [
      { id: 'slash', cd: 1.6, dur: 1.0, max: 3.2, weight: 3, run: () => this.combo(3, 1.0, 0.32, ['slash1', 'slash2', 'thrust'], 'ice', 3.0, 1.8) },
      { id: 'calm', cd: 6, dur: 1.2, max: 8, weight: 2.5, run: () => {
        this.anim('cast', 1.0);
        this.w.game.toast('Frost Calm!', 'boss', 1);
        this.slam(e.x, e.z, 6.2, 1.1, 0.8, ICE, 'ice', { slow: { mult: 0.45, dur: 3.5 }, knock: 0 });
        this.w.schedule(0.8, () => { if (e.alive) this.w.fx.spikes(e.x, e.z, 5.5, ICE, 18); });
      } },
      { id: 'icefall', cd: 5, dur: 1.6, weight: 2.5, run: () => {
        this.anim('castUp', 1.2);
        this.w.game.toast('Icefall!', 'boss', 1);
        this.rain(4, 2.8, 1.9, 1.6, 0.95, 0.2, ICE, 'ice', (x, z) => { this.w.fx.spikes(x, z, 1.7, ICE, 9); this.w.fx.pillar(x, z, 1.2, 6, 0xe8f4ff, 0.5); }, { slow: { mult: 0.6, dur: 2 } });
      } },
      { id: 'shards', cd: 4, dur: 1.0, min: 2.5, weight: 2, run: () => {
        this.strike('throw', 0.4);
        this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('ice', e.x, e.z); this.volley(7, 1.2, 'thorn', 13, 1.0, ICE, 0, { slow: { mult: 0.7, dur: 1.5 } }); } });
      } },
    ];
  }
  phases() {
    return [
      { at: 0.5, id: 'p2', run: () => { this.e.enrage = 1.2; this.w.game.toast('"You will not lay a finger on Lord Sukuna."', 'boss', 1.8); } },
      { at: 0.25, id: 'freeze', run: () => {
        this.e.enrage = 1.35;
        this.w.game.ui.banner('ICE FORMATION', 'The battlefield freezes over', '#bfe4ff');
        this.slam(this.e.x, this.e.z, 9, 1.4, 1.4, 0xbfe4ff, 'ice', { slow: { mult: 0.4, dur: 4 }, knock: 0 });
      } },
    ];
  }
}

/** Kenjaku: a thousand years of collected curses, Maximum: Uzumaki, anti-gravity and Womb Profusion. */
export class Kenjaku extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const PURPLE = 0xb07aff;
    return [
      { id: 'strike', cd: 1.7, dur: 1.1, max: 3, weight: 3, run: () => this.combo(3, 1.05, 0.34, ['punch1', 'kick', 'punch2'], 'punch', 2.8, 1.8) },
      { id: 'spirits', cd: 9, dur: 1.2, weight: 2, run: () => { this.anim('summon', 1.0); this.w.sfx('curse', e.x, e.z); this.w.game.toast('Cursed Spirit Manipulation.', 'boss', 1); this.summonAdds('manipCurse', 2, 3.5, 3); } },
      { id: 'gravity', cd: 6, dur: 1.4, weight: 2.5, run: () => {
        this.anim('cast', 1.1);
        this.w.game.toast('Anti-Gravity System!', 'boss', 1);
        this.slam(this.t.x, this.t.z, 3.4, 1.6, 1.0, PURPLE, 'rumble', { knock: 7 });
        this.w.schedule(1.0, () => { if (e.alive) this.w.fx.pillar(this.t.x, this.t.z, 3, 8, PURPLE, 0.6); });
      } },
      { id: 'orbs', cd: 4, dur: 1.0, min: 2, weight: 2, run: () => {
        this.strike('throw', 0.4);
        this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('curse', e.x, e.z); this.volley(5, 1.0, 'orb', 12, 1.1, PURPLE, 1.2); } });
      } },
      { id: 'uzumaki', cd: 13, dur: 2.4, phase: 1, min: 3, weight: 3, run: () => {
        this.anim('castUp', 2.0);
        this.w.game.toast('Maximum: Uzumaki!', 'boss', 1.4);
        this.w.sfx('charge', e.x, e.z, 1, 0.6);
        this.w.fx.burst(e.x, 1.5, e.z, PURPLE, 30, 3, 0.4, 1.2);
        this.beam(this.aim(), 24, 3.0, 3.2, 1.5, PURPLE, 0xffffff);
        this.w.schedule(1.5, () => { if (e.alive) this.ringBurst(16, 'orb', 9, 0.9, PURPLE); });
      } },
    ];
  }
  phases() {
    return [
      { at: 0.65, id: 'stock', run: () => { this.summonAdds('manipCurse', 3, 4, 4); this.w.game.toast('"I have a thousand years of curses on hand. Pick one."', 'boss', 1.8); } },
      { at: 0.4, id: 'domain', run: () => { this.e.enrage = 1.25; this.domain('womb', 13, 9, 0.075, 'Domain Expansion: Womb Profusion'); } },
      { at: 0.15, id: 'last', run: () => { this.e.enrage = 1.4; this.w.game.toast('"Fascinating. Even now, humanity surprises me."', 'boss', 1.8); } },
    ];
  }
}

/** Sukuna in his Heian form: four arms, Mahoraga's adaptation, World-Cutting Slash and the Shrine. */
export class SukunaTrue extends BossBase {
  hits: Record<string, number> = {};
  adapted = new Set<string>();
  adapting = false;
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'cleave', cd: 1.5, dur: 1.2, max: 3.4, weight: 3, run: () => this.combo(4, 1.0, 0.27, ['slash1', 'slash2', 'slash3', 'uppercut'], 'dismantle', 3.2, 2.2) },
      { id: 'dismantle', cd: 3.6, dur: 1.2, min: 2, weight: 3, run: () => {
        this.strike('slash2', 0.6);
        const base = this.aim();
        for (const off of [-0.6, -0.36, -0.12, 0.12, 0.36, 0.6]) this.line(base + off, 15, 0.8, 1.2, 0.6, 0xffffff, 'dismantle', (x0, z0, x1, z1) => {
          for (let i = 1; i <= 5; i++) { const k = i / 5; this.w.fx.slash(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, base + off + Math.PI / 2, 1.2, 0xffffff, 0.8, 0.5); }
        });
      } },
      { id: 'blink', cd: 4, dur: 0.7, min: 5, weight: 1.5, run: () => { this.teleportNear(2); this.w.schedule(0.2, () => { if (e.alive) this.combo(1, 1.4, 0.4, ['uppercut'], 'punch', 2.8, 1.8); }); } },
      { id: 'fuga', cd: 12, dur: 2.6, phase: 1, min: 3, weight: 2.5, run: () => {
        this.anim('throw', 2.2);
        this.w.game.toast('"Open." — Fuga!', 'boss', 1.4);
        this.w.sfx('fire', e.x, e.z);
        this.line(this.aim(), 22, 2.8, 3.4, 1.5, 0xff5a10, 'explosion', (x0, z0, x1, z1) => {
          this.w.fx.lightning(x0, 1.4, z0, x1, 1, z1, 0xff6a1a, 0.9);
          for (let i = 1; i <= 8; i++) { const k = i / 8; this.w.fx.pillar(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, 1.4, 5, 0xff5a10, 0.8); }
          this.w.fx.shake(0.9, 0.5);
        }, { dot: { mult: 0.25, dur: 4 } });
      } },
      { id: 'dogs', cd: 14, dur: 1.0, phase: 1, weight: 1.5, run: () => { this.anim('summon', 0.9); this.w.game.toast('Ten Shadows: "Divine Dogs."', 'boss', 1); this.summonAdds('shadowHound', 2, 3, 3); } },
      { id: 'world', cd: 16, dur: 2.6, phase: 2, min: 2, weight: 4, run: () => {
        // World-Cutting Slash: a cut through space itself, telegraphed long and dodged sideways
        this.anim('slash3', 2.2);
        this.w.game.ui.banner('WORLD-CUTTING SLASH', 'Get off the line!', '#ffffff');
        this.w.sfx('charge', e.x, e.z, 1, 0.5);
        const dir = this.aim();
        const bx = e.x - Math.sin(dir) * 6, bz = e.z - Math.cos(dir) * 6;
        this.w.telegraph('line', bx, bz, 34, 1.8, 0xffffff, { dir, width: 1.8 });
        this.w.schedule(1.8, () => {
          if (!e.alive) return;
          const x1 = bx + Math.sin(dir) * 34, z1 = bz + Math.cos(dir) * 34;
          this.w.sfx('dismantle', e.x, e.z, 1, 0.6);
          this.w.fx.flash('#ffffff', 0.5, 0.3);
          this.w.fx.lightning(bx, 1.2, bz, x1, 1.2, z1, 0xffffff, 0.5);
          this.w.fx.lightning(bx, 1.2, bz, x1, 1.2, z1, 0x111111, 0.12);
          this.w.fx.shake(1.0, 0.6);
          this.w.damageLine(e, bx, bz, x1, z1, 1.8, 5.0, { kind: 'skill', ignoreDef: true });
        });
      } },
    ];
  }
  incomingMult(opts: DamageOpts) {
    if (!this.adapting) return 1;
    const k = opts.kind === 'dot' || opts.kind === 'domain' ? 'skill' : opts.kind ?? 'melee';
    this.hits[k] = (this.hits[k] ?? 0) + 1;
    if (!this.adapted.has(k) && this.adapted.size < 2 && this.hits[k] >= 18) {
      this.adapted.add(k);
      this.w.sfx('bell', this.e.x, this.e.z);
      this.w.fx.ring(this.e.x, this.e.z, 0xd8b04a, 3, 0.6);
      this.w.game.toast(`The wheel turns… Sukuna has adapted to ${k === 'melee' ? 'your strikes' : k === 'proj' ? 'projectiles' : k === 'summon' ? 'shikigami' : 'your techniques'}! Switch it up!`, 'boss', 2);
    }
    return this.adapted.has(k) ? 0.5 : 1;
  }
  phases() {
    return [
      { at: 0.7, id: 'p1', run: () => { this.e.enrage = 1.15; this.w.game.toast('"Stand proud. You are strong."', 'boss', 1.6); } },
      { at: 0.5, id: 'wheel', run: () => { this.adapting = true; this.w.game.ui.banner('ADAPTATION', 'Sukuna turns Mahoraga\'s wheel', '#d8b04a'); } },
      { at: 0.35, id: 'domain', run: () => { this.e.enrage = 1.3; this.domain('shrine', 13, 10, 0.075, 'Domain Expansion: Malevolent Shrine'); } },
    ];
  }
}
