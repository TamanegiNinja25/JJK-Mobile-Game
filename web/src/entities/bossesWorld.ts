// Open-world bosses in the Tokyo Outskirts and the memories in Tengen's barrier.
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
// Tokyo Outskirts: curses loose in the hills (open-world bosses)
// ---------------------------------------------------------------------------

/** Smallpox Deity: seals its prey in a coffin, buries it under a gravestone, and counts to three. */
export class Smallpox extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const POX = 0xd8ff6a;
    return [
      { id: 'claw', cd: 1.7, dur: 1.2, max: 3.2, weight: 3, run: () => this.combo(2, 1.1, 0.42, ['slash1', 'slam'], 'punch', 3.0, 1.9) },
      { id: 'coffin', cd: 7, dur: 1.8, weight: 3, run: () => {
        this.anim('castUp', 1.2);
        this.w.game.toast('"Grave." A coffin closes around you!', 'boss', 1.4);
        const x = this.t.x, z = this.t.z;
        this.w.telegraph('circle', x, z, 1.8, 1.0, 0x8a8a8e);
        this.w.schedule(1.0, () => {
          if (!e.alive) return;
          this.w.fx.pillar(x, z, 1.2, 2.6, 0x5a5a4a, 0.8);
          this.w.sfx('stomp', x, z, 1, 0.6);
          this.w.damageArea(e, x, z, 1.8, 0.9, { kind: 'skill', stun: 1.2, dot: { mult: 0.12, dur: 5 } });
          // the gravestone comes down on whatever is still inside
          this.w.telegraph('circle', x, z, 2.4, 0.9, POX);
          this.w.schedule(0.9, () => { if (e.alive) { this.w.fx.shockwave(x, z, 2.4, 0x8a8a8e); this.w.fx.spikes(x, z, 2, 0x6a6a6e, 8); this.w.sfx('shockwave', x, z); this.w.damageArea(e, x, z, 2.4, 1.8, { kind: 'skill', knock: 2 }); } });
        });
      } },
      { id: 'pox', cd: 5, dur: 1.4, weight: 2.5, run: () => {
        this.anim('cast', 1.0);
        this.rain(5, 3.4, 1.7, 1.0, 0.9, 0.2, POX, 'squish', (x, z) => { this.w.fx.burst(x, 0.4, z, POX, 18, 3, 0.3, 0.8); this.w.fx.smoke(x, z, 0x6a7a3a, 8); }, { slow: { mult: 0.6, dur: 2 }, dot: { mult: 0.08, dur: 4 } });
      } },
      { id: 'wisps', cd: 11, dur: 1.0, weight: 1.5, run: () => { this.anim('summon', 0.9); this.summonAdds('graveWisp', 3, 3.5, 4); } },
    ];
  }
  /** Stone Hall: three counts. Anyone still close when it reaches three is buried. */
  private count() {
    const e = this.e;
    this.w.game.ui.banner('GRAVE · COFFIN · STONE HALL', 'Get away before it counts to three!', '#d8ff6a');
    for (let i = 1; i <= 3; i++) this.w.schedule(i * 0.9, () => { if (e.alive) { this.w.sfx('bell', e.x, e.z, 0.9, 0.7 + i * 0.1); this.w.fx.text(e.x, 3.4, e.z, String(i), '#d8ff6a', 30); } });
    this.slam(e.x, e.z, 7.5, 3.2, 2.9, 0xd8ff6a, 'shockwave', { knock: 4, dot: { mult: 0.15, dur: 5 } });
  }
  phases() {
    return [
      { at: 0.6, id: 'c1', run: () => this.count() },
      { at: 0.25, id: 'c2', run: () => { this.e.enrage = 1.3; this.count(); } },
    ];
  }
}

/** Rainbow Dragon: dives along the ground, breathes a prism beam and sheds razor scales. */
export class RainbowDragon extends BossBase {
  hue = 0;
  moves(): Move[] {
    const e = this.e;
    const col = () => { this.hue = (this.hue + 0.17) % 1; return new THREE.Color().setHSL(this.hue, 0.8, 0.6).getHex(); };
    return [
      { id: 'bite', cd: 1.6, dur: 1.0, max: 3.6, weight: 3, run: () => this.combo(2, 1.2, 0.4, ['bite', 'bite'], 'growl', 3.6, 1.8) },
      { id: 'dive', cd: 4, dur: 1.4, min: 3, weight: 3, run: () => { this.w.sfx('roar', e.x, e.z, 0.8, 1.2); this.charge(20, 0.6, 1.8, 0.65); } },
      { id: 'breath', cd: 6, dur: 1.6, min: 2, weight: 2.5, run: () => {
        this.anim('bite', 1.4);
        this.w.game.toast('The Rainbow Dragon draws breath!', 'boss', 1);
        this.beam(this.aim(), 18, 2.2, 2.2, 1.0, col(), 0xffffff, {}, 'beam');
      } },
      { id: 'scales', cd: 5, dur: 1.0, weight: 2, run: () => { this.w.sfx('slash', e.x, e.z, 0.8, 1.4); this.ringBurst(14, 'thorn', 11, 0.9, col()); } },
      { id: 'coil', cd: 7, dur: 1.2, max: 6, weight: 1.5, run: () => this.slam(e.x, e.z, 5, 1.6, 0.8, col(), 'shockwave', { knock: 4 }) },
    ];
  }
  phases() {
    return [
      { at: 0.5, id: 'p2', run: () => { this.e.enrage = 1.25; this.w.game.toast('Its scales flare every colour at once!', 'boss', 1.6); this.ringBurst(20, 'thorn', 10, 1.0, 0xff8aff); } },
      { at: 0.2, id: 'p3', run: () => { this.e.enrage = 1.45; } },
    ];
  }
}

/** Kuchisake-onna: "Am I pretty?" Whatever you answer, the scissors come next. */
export class Kuchisake extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const BLEED: DamageOpts = { dot: { mult: 0.1, dur: 4 } };
    return [
      { id: 'snip', cd: 1.4, dur: 1.0, max: 3.2, weight: 3, run: () => this.combo(3, 0.95, 0.28, ['slash1', 'slash2', 'thrust'], 'slash', 3.0, 1.6) },
      { id: 'question', cd: 6, dur: 1.8, weight: 3, run: () => {
        this.anim('cast', 1.0);
        this.w.game.toast('"...Am I pretty?"', 'boss', 1.2);
        this.w.schedule(0.9, () => { if (e.alive) { this.teleportNear(1.6); this.line(this.aim(), 6, 1.6, 2.2, 0.35, 0xff3a4a, 'slash', (x0, z0, x1, z1) => { for (let i = 1; i <= 3; i++) { const k = i / 3; this.w.fx.slash(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, e.facing + Math.PI / 2, 1.3, 0xff6a6a, 0.9, 0.4); } }, { ...BLEED, kind: 'melee' }); } });
      } },
      { id: 'lunge', cd: 4, dur: 1.0, min: 4, weight: 2, run: () => this.charge(22, 0.4, 1.6, 0.45) },
      { id: 'scream', cd: 9, dur: 1.2, max: 7, weight: 1.5, run: () => { this.w.game.toast('She screams!', 'boss', 0.8); this.slam(e.x, e.z, 5.5, 1.0, 0.7, 0xff3a4a, 'screech', { stun: 0.9, knock: 2 }); } },
      { id: 'patients', cd: 12, dur: 1.0, weight: 1.2, run: () => { this.anim('summon', 0.9); this.summonAdds('wardWraith', 2, 3, 3); } },
    ];
  }
  phases() {
    return [
      { at: 0.5, id: 'p2', run: () => { this.e.enrage = 1.3; this.w.game.toast('She tears the mask away.', 'boss', 1.6); } },
      { at: 0.2, id: 'p3', run: () => { this.e.enrage = 1.5; } },
    ];
  }
}

// ---------------------------------------------------------------------------
// Culling Game: Sakurajima
// ---------------------------------------------------------------------------

/** Naoya as a cursed spirit: Projection Sorcery at the speed of sound, and Time Cell Moon Palace. */
export class NaoyaCurse extends BossBase {
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'claws', cd: 1.2, dur: 0.9, max: 3, weight: 3, run: () => this.combo(4, 0.85, 0.2, ['punch1', 'punch2', 'punch1', 'slam'], 'punch', 2.8, 1.8) },
      { id: 'mach', cd: 4.5, dur: 1.3, min: 3, weight: 3, run: () => {
        this.w.game.toast('Sonic boom!', 'boss', 0.8);
        this.charge(26, 0.45, 1.7, 0.55);
        this.w.schedule(1.0, () => { if (e.alive) { this.w.fx.shockwave(e.x, e.z, 3.6, 0xe8f0ff); this.w.sfx('shockwave', e.x, e.z); this.w.damageArea(e, e.x, e.z, 3.6, 1.2, { kind: 'skill', knock: 4 }); } });
      } },
      { id: 'frames', cd: 5, dur: 1.8, min: 2, weight: 2.5, run: () => this.frames(4) },
      { id: 'blink', cd: 4, dur: 0.7, min: 5, weight: 1.5, run: () => { this.teleportNear(1.8); this.w.schedule(0.15, () => { if (e.alive) this.combo(1, 1.5, 0.3, ['slam'], 'punch', 3, 2.2); }); } },
    ];
  }
  private frames(n: number) {
    const e = this.e;
    let x = e.x, z = e.z;
    const windup = 0.7 / e.enrage;
    for (let i = 1; i <= n; i++) {
      const tx = this.t.x + rand(-2.5, 2.5), tz = this.t.z + rand(-2.5, 2.5);
      const a = Math.atan2(tx - x, tz - z) + (i % 2 ? 0.5 : -0.5);
      const d = Math.min(10, Math.hypot(tx - x, tz - z) + 3);
      let nx = x + Math.sin(a) * d, nz = z + Math.cos(a) * d;
      if (this.w.col.blocked(nx, nz, e.radius)) { nx = tx; nz = tz; }
      const x0 = x, z0 = z, dir = Math.atan2(nx - x0, nz - z0), len = Math.hypot(nx - x0, nz - z0);
      this.w.telegraph('line', x0, z0, len, windup + i * 0.06, 0xe8f0ff, { dir, width: 1.5 });
      this.w.schedule(windup + i * 0.06, () => {
        if (!e.alive) return;
        e.place(nx, nz);
        e.facing = dir;
        this.w.fx.lightning(x0, 1, z0, nx, 1, nz, 0xe8f0ff, 0.25);
        this.w.sfx('swing', nx, nz, 0.7, 1.5);
        this.w.damageLine(e, x0, z0, nx, nz, 1.5, 1.2, { kind: 'melee', stun: 0.6, hitSfx: 'punch' });
      });
      x = nx; z = nz;
    }
  }
  phases() {
    return [
      { at: 0.65, id: 'fast', run: () => { this.e.enrage = 1.25; this.w.game.toast('"Women belong three steps behind. You\'re not even that close."', 'boss', 2); } },
      { at: 0.4, id: 'domain', run: () => {
        this.e.enrage = 1.4;
        this.domain('moon', 13, 9, 0.06, 'Domain Expansion: Time Cell Moon Palace');
        // inside the palace every cell must move at 24 frames a second: stand still too long and you lock up
        for (let i = 0; i < 6; i++) this.w.schedule(1.6 + i * 1.3, () => {
          if (!this.e.alive || this.w.bossDom?.enemy !== this.e) return;
          const p = this.w.player;
          this.w.telegraph('circle', p.x, p.z, 1.6, 0.6, 0xe8f0ff);
          const x = p.x, z = p.z;
          this.w.schedule(0.6, () => { if (this.e.alive) { this.w.fx.ring(x, z, 0xe8f0ff, 1.6, 0.3); this.w.damageArea(this.e, x, z, 1.6, 0.9, { kind: 'skill', stun: 0.8 }); } });
        });
      } },
      { at: 0.15, id: 'last', run: () => { this.e.enrage = 1.6; } },
    ];
  }
}

// ---------------------------------------------------------------------------
// Memories in Tengen's barrier
// ---------------------------------------------------------------------------

/** Toji Fushiguro: no cursed energy, a body past human limits, and the Inverted Spear of Heaven. */
export class Toji extends BossBase {
  warned = false;
  moves(): Move[] {
    const e = this.e;
    return [
      { id: 'cloud', cd: 1.3, dur: 1.1, max: 3.4, weight: 3, run: () => this.combo(4, 1.0, 0.24, ['slash1', 'slash2', 'thrust', 'slash3'], 'punch', 3.2, 2.0) },
      { id: 'spear', cd: 6, dur: 1.2, max: 9, weight: 3, run: () => {
        this.strike('thrust', 0.7);
        this.w.game.toast('Inverted Spear of Heaven!', 'boss', 1);
        const dir = this.aim();
        this.line(dir, 8, 1.4, 2.2, 0.7, 0xb07aff, 'slash', (x0, z0, x1, z1) => {
          this.w.fx.lightning(x0, 1.1, z0, x1, 1.1, z1, 0xd8d8e0, 0.15);
          // anything that touches the spear loses its techniques' effects
          const p = this.w.player;
          const t = Math.max(0, Math.min(1, ((p.x - x0) * (x1 - x0) + (p.z - z0) * (z1 - z0)) / ((x1 - x0) ** 2 + (z1 - z0) ** 2)));
          if (Math.hypot(p.x - (x0 + (x1 - x0) * t), p.z - (z0 + (z1 - z0) * t)) < 1.6) {
            const ps = this.w.game.ps!;
            let n = 0;
            for (const k of [...ps.buffs.keys()]) if (k !== 'confiscated') { ps.buffs.delete(k); n++; }
            if (n) { ps.recalc(); this.w.game.toast('The spear nullified your buffs!', 'boss', 1.6); }
          }
        }, { kind: 'melee' });
      } },
      { id: 'vanish', cd: 5, dur: 1.2, weight: 2.5, run: () => {
        // invisible to cursed energy: he is simply behind you
        this.w.fx.smoke(e.x, e.z, 0x111111, 8);
        e.cloakT = 0.5;
        this.w.schedule(0.5, () => {
          if (!e.alive) return;
          const p = this.w.player;
          const bx = p.x - Math.sin(p.facing) * 1.6, bz = p.z - Math.cos(p.facing) * 1.6;
          if (!this.w.col.blocked(bx, bz, e.radius)) e.place(bx, bz);
          e.cloakT = 0;
          e.faceTowards(p.x, p.z, 1, 99);
          this.slam(p.x, p.z, 1.9, 1.9, 0.35, 0xb07aff, 'punch', { knock: 3 });
        });
      } },
      { id: 'chain', cd: 7, dur: 1.2, min: 4, weight: 2, run: () => {
        this.strike('throw', 0.6);
        this.w.game.toast('Chain of a Thousand Miles!', 'boss', 1);
        this.line(this.aim(), 16, 1.0, 1.4, 0.6, 0xc8c8d8, 'nail', (x0, z0, x1, z1) => this.w.fx.lightning(x0, 1.1, z0, x1, 1.1, z1, 0xc8c8d8, 0.08), { stun: 0.8 });
      } },
      { id: 'dash', cd: 3.5, dur: 1.0, min: 5, weight: 2, run: () => this.charge(24, 0.4, 1.6, 0.4) },
    ];
  }
  /** Domains find their target by its cursed energy. Toji has none, so sure-hits barely land. */
  incomingMult(opts: DamageOpts) {
    if (opts.kind !== 'domain') return 1;
    if (!this.warned) { this.warned = true; this.w.game.toast('Toji has no cursed energy — your domain\'s sure-hit can barely find him!', 'boss', 2.5); }
    return 0.35;
  }
  phases() {
    return [
      { at: 0.6, id: 'p2', run: () => { this.e.enrage = 1.25; this.w.game.toast('"Don\'t take it personally. It\'s just a job."', 'boss', 1.8); } },
      { at: 0.25, id: 'p3', run: () => { this.e.enrage = 1.5; this.w.game.toast('Toji stops holding back.', 'boss', 1.4); } },
    ];
  }
}

/** Suguru Geto: Cursed Spirit Manipulation, the Rainbow Dragon, and Maximum: Uzumaki. */
export class Geto extends BossBase {
  moves(): Move[] {
    const e = this.e;
    const P = 0x9a7aff;
    return [
      { id: 'strike', cd: 1.5, dur: 1.0, max: 3, weight: 3, run: () => this.combo(3, 1.05, 0.3, ['punch1', 'kick', 'punch2'], 'punch', 2.8, 1.8) },
      { id: 'spirits', cd: 8, dur: 1.2, weight: 2, run: () => { this.anim('summon', 1.0); this.w.sfx('curse', e.x, e.z); this.w.game.toast('Cursed Spirit Manipulation.', 'boss', 1); this.summonAdds('paradeCurse', 2, 3.5, 4); } },
      { id: 'dragon', cd: 6, dur: 1.6, min: 3, weight: 2.5, run: () => {
        this.anim('castUp', 1.2);
        this.w.game.toast('"Rainbow Dragon."', 'boss', 1);
        const dir = this.aim();
        this.line(dir, 20, 2.4, 2.0, 0.9, 0xff8aff, 'roar', (x0, z0, x1, z1) => {
          for (let i = 0; i < 6; i++) this.w.fx.lightning(x0, 1.2 + i * 0.1, z0, x1, 1.2, z1, new THREE.Color().setHSL(i / 6, 0.8, 0.6).getHex(), 0.25);
          this.w.fx.shake(0.5);
        }, { knock: 3 });
      } },
      { id: 'orbs', cd: 4, dur: 1.0, min: 2, weight: 2, run: () => { this.strike('throw', 0.4); this.w.schedule(0.4, () => { if (e.alive) { this.w.sfx('curse', e.x, e.z); this.volley(5, 1.1, 'orb', 12, 1.1, P, 1.2); } }); } },
      { id: 'uzumaki', cd: 13, dur: 2.4, phase: 1, min: 3, weight: 3, run: () => {
        this.anim('castUp', 2.0);
        this.w.game.toast('Maximum: Uzumaki!', 'boss', 1.4);
        this.w.sfx('charge', e.x, e.z, 1, 0.6);
        this.beam(this.aim(), 26, 3.4, 3.4, 1.5, P, 0xffffff);
        this.w.schedule(1.5, () => { if (e.alive) this.ringBurst(18, 'orb', 9, 1.0, P); });
      } },
    ];
  }
  phases() {
    return [
      { at: 0.6, id: 'parade', run: () => {
        this.w.game.ui.banner('NIGHT PARADE OF A HUNDRED DEMONS', 'Geto releases his curses', '#9a7aff');
        this.summonAdds('paradeCurse', 3, 4.5, 5);
        this.summonAdds('paradeFlyer', 2, 4.5, 3);
      } },
      { at: 0.3, id: 'final', run: () => {
        this.e.enrage = 1.35;
        this.w.game.toast('"I\'ll make a world of sorcerers. Even if I have to do it alone."', 'boss', 2);
        this.slam(this.e.x, this.e.z, 10, 3.0, 2.2, 0x9a7aff, 'explosion', { knock: 5 });
      } },
    ];
  }
}

/** Satoru Gojo, as Tengen's barrier remembers him: Infinity, Blue, Red, Hollow Purple and Unlimited Void. */
export class GojoMemory extends BossBase {
  infinity = 0;
  moves(): Move[] {
    const e = this.e;
    const BLUE = 0x4a8aff, RED = 0xff2a3a, PURPLE = 0xb04aff;
    return [
      { id: 'strike', cd: 1.3, dur: 1.0, max: 3, weight: 3, run: () => this.combo(4, 0.95, 0.22, ['punch1', 'punch2', 'kick', 'punch1'], 'punch', 2.8, 1.8) },
      { id: 'blue', cd: 5, dur: 1.3, weight: 3, run: () => {
        this.anim('cast', 1.0);
        this.w.game.toast('"Cursed Technique Lapse: Blue."', 'boss', 1);
        const x = this.t.x, z = this.t.z;
        this.w.fx.burst(x, 1.2, z, BLUE, 30, -3, 0.3, 0.9);
        this.slam(x, z, 3.4, 1.7, 1.0, BLUE, 'blue', { knock: 0, stun: 0.5 });
      } },
      { id: 'red', cd: 6, dur: 1.2, min: 2, weight: 2.5, run: () => {
        this.strike('throw', 0.6);
        this.w.game.toast('"Cursed Technique Reversal: Red."', 'boss', 1);
        this.w.schedule(0.6, () => { if (e.alive) { this.w.sfx('red', e.x, e.z); this.volley(1, 0, 'red', 18, 2.4, RED, 0, { knock: 7 }); } });
      } },
      { id: 'blink', cd: 3.5, dur: 0.8, min: 4, weight: 2, run: () => { this.teleportNear(2); this.w.schedule(0.2, () => { if (e.alive) this.combo(2, 1.1, 0.25, ['kick', 'punch2'], 'punch', 2.8, 1.8); }); } },
      { id: 'infinity', cd: 12, dur: 0.8, weight: 2, run: () => {
        this.infinity = this.w.time + 5;
        this.w.sfx('barrier', e.x, e.z);
        this.w.fx.ring(e.x, e.z, 0x9ae6ff, 2.4, 0.6, 0.3);
        this.w.game.toast('Infinity! Only Black Flash or a domain gets through.', 'boss', 2);
      } },
      { id: 'purple', cd: 14, dur: 2.6, phase: 1, min: 3, weight: 3, run: () => {
        this.anim('castUp', 2.2);
        this.w.game.ui.banner('HOLLOW PURPLE', 'Get off the line!', '#b04aff');
        this.w.sfx('charge', e.x, e.z, 1, 0.5);
        this.w.fx.burst(e.x - 1, 1.6, e.z, BLUE, 20, 2, 0.3, 1.5);
        this.w.fx.burst(e.x + 1, 1.6, e.z, RED, 20, 2, 0.3, 1.5);
        this.line(this.aim(), 30, 3.6, 5.2, 1.7, PURPLE, 'purple', (x0, z0, x1, z1) => {
          this.w.fx.lightning(x0, 1.4, z0, x1, 1.2, z1, PURPLE, 1.2);
          this.w.fx.lightning(x0, 1.4, z0, x1, 1.2, z1, 0xffffff, 0.3);
          this.w.fx.flash('#c08aff', 0.4, 0.3);
          this.w.fx.shake(1.0, 0.6);
        }, { ignoreDef: true });
      } },
    ];
  }
  incomingMult(opts: DamageOpts, bf?: boolean) {
    if (this.w.time > this.infinity) return 1;
    if (opts.kind === 'domain' || bf || opts.nullify) return 1;
    return 0.12;
  }
  phases() {
    return [
      { at: 0.7, id: 'p1', run: () => { this.e.enrage = 1.15; this.w.game.toast('"Not bad! Okay, now I\'ll try a little."', 'boss', 1.8); } },
      { at: 0.4, id: 'void', run: () => {
        this.e.enrage = 1.3;
        this.domain('void', 14, 9, 0.07, 'Domain Expansion: Unlimited Void');
        // infinite information: every few seconds your thoughts freeze
        for (let i = 0; i < 4; i++) this.w.schedule(2 + i * 2, () => {
          if (!this.e.alive || this.w.bossDom?.enemy !== this.e) return;
          const p = this.w.player;
          if (Math.hypot(p.x - this.e.x, p.z - this.e.z) > 14) return;
          this.w.fx.flash('#bfefff', 0.3, 0.3);
          this.w.damageTargetActor(this.e, p, 0.4, { kind: 'skill', stun: 0.7 });
        });
      } },
      { at: 0.15, id: 'last', run: () => { this.e.enrage = 1.5; this.w.game.toast('"Throughout heaven and earth, I alone am the honoured one."', 'boss', 2.2); } },
    ];
  }
}
