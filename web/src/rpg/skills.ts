// Skill trees for the three first-years. Each active skill is a small script
// that talks to the world through WorldAPI.
import { ClassId, StatKey } from './types';
import { Caster, Target, WorldAPI } from '../world/api';

export interface SkillDef {
  id: string;
  cls: ClassId;
  name: string;
  /** active/buff/ultimate are cast from quick slots; passive and reaction work automatically */
  type: 'active' | 'buff' | 'passive' | 'reaction' | 'ultimate';
  req: number;
  max: number;
  prereq?: [string, number];
  /** legacy tree position (unused by the current menu) */
  row?: number;
  col?: number;
  desc: (lv: number) => string;
  ce?: (lv: number) => number;
  cd?: (lv: number) => number;
  anim?: string;
  animDur?: number;
  range?: number;
  passive?: (lv: number) => Partial<Record<StatKey, number>>;
  cast?: (w: WorldAPI, c: Caster, lv: number, t: Target | null, dx: number, dz: number) => void;
  /** reaction trigger: fires automatically when its event happens */
  react?: { on: 'hit' | 'kill' | 'lowHp'; chance: (lv: number) => number; icd: number; run: (w: WorldAPI, c: Caster, lv: number, ctx: ReactCtx) => void };
  color: string;
}

export interface ReactCtx { src?: Target | null; dmg?: number; x?: number; z?: number }

export const SKILL_TYPES: { id: SkillDef['type']; label: string; desc: string }[] = [
  { id: 'active', label: 'Active', desc: 'Techniques you cast from a quick slot.' },
  { id: 'buff', label: 'Buff', desc: 'Timed self-empowerments cast from a quick slot.' },
  { id: 'passive', label: 'Passive', desc: 'Permanent bonuses that are always on.' },
  { id: 'reaction', label: 'Reaction', desc: 'Trigger on their own when something happens in battle.' },
  { id: 'ultimate', label: 'Ultimate', desc: 'Needs a full domain gauge. Lives in quick slot 6.' },
];

const m = (base: number, lv: number) => base * (1 + 0.16 * (lv - 1));
const pct = (v: number) => Math.round(v * 100) + '%';

/** Direction toward a target or the caster's facing. */
function aim(c: Caster, t: Target | null, dx: number, dz: number) {
  if (t) {
    const ax = t.x - c.x, az = t.z - c.z;
    const d = Math.hypot(ax, az) || 1;
    return { x: ax / d, z: az / d, dist: d };
  }
  const d = Math.hypot(dx, dz);
  if (d > 0.1) return { x: dx / d, z: dz / d, dist: 4 };
  return { x: Math.sin(c.facing), z: Math.cos(c.facing), dist: 4 };
}

export const SKILLS: Record<string, SkillDef> = {};
function reg(s: SkillDef) { SKILLS[s.id] = s; }

// ===========================================================================
// Yuji Itadori
// ===========================================================================

reg({
  id: 'divergent', cls: 'yuji', name: 'Divergent Fist', type: 'active', req: 1, max: 5, row: 0, col: 0, color: '#6ab8ff',
  desc: lv => `Dash and strike for ${pct(m(1.5, lv))} ATK; cursed energy lands a beat later for another ${pct(m(1.1, lv))} in an area.`,
  ce: lv => 10 + lv * 2, cd: () => 4, anim: 'punch1', animDur: 0.45, range: 5,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.6, Math.max(0.5, a.dist - 1.2)), 0.14);
    w.schedule(0.06, () => w.sfx('swing', c.x, c.z, 0.6, 1.1));
    w.schedule(0.2, () => {
      w.sfx('divergent', c.x, c.z);
      w.fx.slash(c.x, c.z, Math.atan2(a.x, a.z), 1.6, 0xbfe4ff, 1.4);
      w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.4, 1.7, m(1.5, lv), { kind: 'skill', knock: 0.8 });
    });
    w.schedule(0.38, () => {
      const px = c.x + a.x * 1.4, pz = c.z + a.z * 1.4;
      w.fx.shockwave(px, pz, 2.2, 0x6ab8ff);
      w.fx.burst(px, 1, pz, 0x8ad0ff, 26, 6, 0.35);
      w.fx.light(px, 1, pz, 0x6ab8ff, 14, 0.3);
      w.fx.shake(0.25);
      w.damageArea(c, px, pz, 2.1, m(1.1, lv), { kind: 'skill', knock: 2 });
    });
  },
});

reg({
  id: 'manji', cls: 'yuji', name: 'Manji Kick', type: 'active', req: 3, max: 5, row: 0, col: 1, color: '#ffb05a',
  desc: lv => `Whirling kick hits everything around you for ${pct(m(1.35, lv))} ATK and knocks enemies back.`,
  ce: lv => 12 + lv * 2, cd: () => 6, anim: 'spinKick', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('swingHeavy', c.x, c.z);
    w.schedule(0.25, () => {
      w.fx.ring(c.x, c.z, 0xffd08a, 2.9, 0.35, 0.5);
      w.fx.slash(c.x, c.z, c.facing, 2.4, 0xffe0b0, Math.PI * 2, 0);
      w.sfx('kick', c.x, c.z);
      w.damageArea(c, c.x, c.z, 2.9, m(1.35, lv), { kind: 'skill', knock: 3.5 });
    });
  },
});

reg({
  id: 'rush', cls: 'yuji', name: 'Cursed Rush', type: 'active', req: 6, max: 5, row: 1, col: 0, prereq: ['divergent', 2], color: '#ff6a6a',
  desc: lv => `A six-hit barrage, each blow dealing ${pct(m(0.48, lv))} ATK.`,
  ce: lv => 18 + lv * 2, cd: () => 8, anim: 'channel', animDur: 0.75, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    for (let i = 0; i < 6; i++) {
      w.schedule(i * 0.11, () => {
        c.model?.play(i % 2 ? 'punch2' : 'punch1', 0.12);
        w.fx.slash(c.x + a.x * 0.8, c.z + a.z * 0.8, dir + (Math.random() - 0.5), 1.0, 0xffc0c0, 1.2, Math.random() * 2 - 1);
        w.sfx('punch', c.x, c.z, 0.6, 0.9 + Math.random() * 0.3);
        w.damageCone(c, c.x, c.z, dir, 2.5, 1.5, m(0.48, lv), { kind: 'skill', quiet: i % 2 === 1 });
      });
    }
  },
});

reg({
  id: 'slam', cls: 'yuji', name: 'Meteor Slam', type: 'active', req: 10, max: 5, row: 1, col: 1, prereq: ['manji', 2], color: '#ff9a3a',
  desc: lv => `Leap and smash the ground: ${pct(m(2.2, lv))} ATK in a wide radius and stuns for 1.2s.`,
  ce: lv => 26 + lv * 3, cd: () => 12, anim: 'slam', animDur: 0.62, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(3, Math.max(0, a.dist - 0.5)), 0.32, true);
    w.sfx('swingHeavy', c.x, c.z);
    w.schedule(0.34, () => {
      w.sfx('shockwave', c.x, c.z);
      w.fx.shockwave(c.x, c.z, 4.2, 0xffb070);
      w.fx.spikes(c.x, c.z, 3.5, 0x8a7a6a, 14);
      w.fx.smoke(c.x, c.z, 0xb0a090, 16);
      w.fx.shake(0.55, 0.35);
      w.fx.hitstop(0.06);
      w.damageArea(c, c.x, c.z, 4.2, m(2.2, lv), { kind: 'skill', stun: 1.2, knock: 2 });
    });
  },
});

reg({
  id: 'blackflash', cls: 'yuji', name: 'Black Flash', type: 'active', req: 15, max: 5, row: 2, col: 0, prereq: ['rush', 3], color: '#ff2a3a',
  desc: lv => `Distort space with cursed energy: a guaranteed Black Flash for ${pct(m(1.9, lv))} ATK ×2.5.`,
  ce: lv => 32 + lv * 3, cd: () => 15, anim: 'uppercut', animDur: 0.55, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.2, Math.max(0, a.dist - 1.1)), 0.12);
    w.sfx('charge', c.x, c.z, 0.6);
    w.schedule(0.26, () => {
      w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.6, 1.3, m(1.9, lv), { kind: 'skill', bf: true, knock: 4 });
    });
  },
});

reg({
  id: 'slaughter', cls: 'yuji', name: 'Slaughter Demon', type: 'active', req: 20, max: 5, row: 2, col: 1, prereq: ['slam', 2], color: '#c84aff',
  desc: lv => `Hurl a cursed knife that pierces up to 4 enemies for ${pct(m(1.8, lv))} ATK and makes them bleed.`,
  ce: lv => 16 + lv * 2, cd: () => 7, anim: 'throw', animDur: 0.36, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.schedule(0.17, () => w.sfx('nail', c.x, c.z, 0.8, 0.6));
    w.schedule(0.17, () => w.projectile({ x: c.x, z: c.z, dirX: a.x, dirZ: a.z, speed: 22, range: 14, radius: 0.55, mult: m(1.8, lv), pierce: 4, visual: 'knife', team: 'player', opts: { kind: 'skill', dot: { mult: m(0.25, lv), dur: 4 } }, fromCaster: c }));
  },
});

reg({ id: 'physique', cls: 'yuji', name: 'Superhuman Physique', type: 'passive', req: 2, max: 5, row: 0, col: 2, color: '#ffd06a', desc: lv => `Max HP +${lv * 8}%.`, passive: lv => ({ hpPct: lv * 0.08 }) });
reg({ id: 'martial', cls: 'yuji', name: 'Martial Arts', type: 'passive', req: 8, max: 5, row: 1, col: 2, color: '#ffa06a', desc: lv => `Attack +${lv * 6}%, attack speed +${lv * 2}%.`, passive: lv => ({ atkPct: lv * 0.06, atkSpd: lv * 0.02 }) });
reg({ id: 'bfInstinct', cls: 'yuji', name: 'Black Flash Instinct', type: 'passive', req: 14, max: 5, row: 2, col: 2, prereq: ['martial', 2], color: '#ff3a4a', desc: lv => `Black Flash chance +${(lv * 1.4).toFixed(1)}%. Landing one restores ${lv * 4} CE.`, passive: lv => ({ bfChance: lv * 0.014 }) });
reg({ id: 'unyielding', cls: 'yuji', name: 'Unyielding Will', type: 'passive', req: 22, max: 5, row: 3, col: 0, color: '#9adfff', desc: lv => `Damage taken -${lv * 3}%, HP regen +${lv}/s.`, passive: lv => ({ dmgReduce: lv * 0.03, hpRegen: lv }) });

reg({
  id: 'shrine', cls: 'yuji', name: 'King of Curses: Malevolent Shrine', type: 'ultimate', req: 25, max: 1, row: 3, col: 2, color: '#ff1a2a',
  desc: () => 'Ultimate. Sukuna takes over for 8 seconds: his domain opens and Dismantle and Cleave shred every enemy nearby. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('shrine', c.x, c.z, 13, 8.5);
    c.setInvuln(9);
    c.addBuff('sukuna', 9, { atkPct: 0.3 });
    for (let i = 0; i < 30; i++) {
      w.schedule(1.3 + i * 0.24, () => {
        const ts = w.targetsNear('enemy', c.x, c.z, 13);
        for (const tg of ts.slice(0, 6)) {
          w.fx.slash(tg.x, tg.z, Math.random() * Math.PI * 2, 1.3, 0xffffff, 0.6, Math.random() * 2 - 1, 1);
          w.damageTarget(c, tg, i % 5 === 4 ? 1.4 : 0.55, { kind: 'domain', noBF: true, quiet: true, color: '#ff4a5a' });
        }
        if (ts.length) w.sfx('dismantle', c.x, c.z, 0.7, 0.8 + Math.random() * 0.5);
      });
    }
  },
});

// ===========================================================================
// Megumi Fushiguro
// ===========================================================================

reg({
  id: 'dogs', cls: 'megumi', name: 'Divine Dogs', type: 'active', req: 1, max: 5, row: 0, col: 0, color: '#e8e8f4',
  desc: lv => `Summon the white and black Divine Dogs for ${14 + lv * 2}s. Each bites for ${pct(m(0.55, lv))} ATK.`,
  ce: lv => 18 + lv * 2, cd: () => 16, anim: 'summon', animDur: 0.6,
  cast: (w, c, lv) => {
    w.sfx('summon', c.x, c.z);
    const sx = Math.cos(c.facing), sz = -Math.sin(c.facing);
    for (const [k, s] of [['dogWhite', 1], ['dogBlack', -1]] as const) {
      const x = c.x + sx * s * 1.4, z = c.z + sz * s * 1.4;
      w.fx.sigil(x, z, 1.2, 0x2a2a4a, 0.8);
      w.fx.smoke(x, z, 0x15151f, 14);
      w.summon(k, x, z, { dur: 14 + lv * 2, power: m(0.55, lv), owner: c });
    }
    w.schedule(0.4, () => w.sfx('bark', c.x, c.z));
  },
});

reg({
  id: 'nue', cls: 'megumi', name: 'Nue', type: 'active', req: 3, max: 5, row: 0, col: 1, color: '#8ae0ff',
  desc: lv => `Call the owl shikigami Nue to dive three times, each strike a ${pct(m(1.3, lv))} ATK lightning burst.`,
  ce: lv => 16 + lv * 2, cd: () => 9, anim: 'castUp', animDur: 0.5, range: 12,
  cast: (w, c, lv) => {
    w.sfx('summon', c.x, c.z, 0.7);
    w.schedule(0.3, () => w.sfx('screech', c.x, c.z, 0.6, 1.3));
    w.summon('nue', c.x, c.z - 1, { dur: 4.5, power: m(1.3, lv), owner: c });
  },
});

reg({
  id: 'toad', cls: 'megumi', name: 'Toad', type: 'active', req: 6, max: 5, row: 1, col: 0, prereq: ['dogs', 2], color: '#7ac06a',
  desc: lv => `Toad's tongue lashes up to 4 enemies for ${pct(m(1.0, lv))} ATK and binds them for ${(1.5 + lv * 0.2).toFixed(1)}s.`,
  ce: lv => 14 + lv * 2, cd: () => 8, anim: 'summon', animDur: 0.5, range: 9,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x = c.x + a.x * 1.6, z = c.z + a.z * 1.6;
    w.sfx('croak', x, z);
    w.fx.smoke(x, z, 0x15151f, 12);
    w.summon('toad', x, z, { dur: 1.6, power: m(1.0, lv), owner: c });
    w.schedule(0.35, () => {
      const ts = w.targetsNear('enemy', x, z, 9).slice(0, 4);
      w.sfx('tongue', x, z);
      for (const tg of ts) {
        w.fx.lightning(x, 0.6, z, tg.x, 0.8, tg.z, 0xd84a6a, 0.12);
        w.damageTarget(c, tg, m(1.0, lv), { kind: 'skill', stun: 1.5 + lv * 0.2 });
      }
    });
  },
});

reg({
  id: 'shadowStep', cls: 'megumi', name: 'Shadow Step', type: 'active', req: 10, max: 5, row: 1, col: 1, prereq: ['nue', 2], color: '#5a5aaa',
  desc: lv => `Sink into your shadow and resurface 6m ahead, cutting everything on the path for ${pct(m(1.3, lv))} ATK.`,
  ce: lv => 10 + lv * 2, cd: () => 6, anim: 'dash', animDur: 0.3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    w.sfx('shadow', c.x, c.z);
    w.fx.smoke(x0, z0, 0x101018, 18);
    w.fx.sigil(x0, z0, 1.1, 0x15151f, 0.6);
    c.dash(a.x, a.z, 6, 0.2, true);
    w.schedule(0.2, () => {
      w.fx.smoke(c.x, c.z, 0x101018, 18);
      w.fx.slash(c.x, c.z, Math.atan2(a.x, a.z), 2, 0x9a9aff, 1.5);
      w.damageLine(c, x0, z0, c.x, c.z, 1.6, m(1.3, lv), { kind: 'skill' });
    });
  },
});

reg({
  id: 'elephant', cls: 'megumi', name: 'Max Elephant', type: 'active', req: 15, max: 5, row: 2, col: 0, prereq: ['toad', 3], color: '#7ab0ff',
  desc: lv => `Drop Max Elephant on the enemy: ${pct(m(2.6, lv))} ATK in a huge area, then a torrent of water slows survivors.`,
  ce: lv => 38 + lv * 3, cd: () => 18, anim: 'summon', animDur: 0.7, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(a.dist, 7);
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.sfx('summon', x, z);
    w.fx.sigil(x, z, 3, 0x1a1a2a, 1.4);
    w.summon('elephant', x, z, { dur: 2.2, power: m(2.6, lv), owner: c });
    w.schedule(0.2, () => w.sfx('elephant', x, z));
    w.schedule(0.65, () => {
      w.sfx('water', x, z);
      w.sfx('land', x, z);
      w.fx.shockwave(x, z, 4.8, 0x8ac8ff);
      w.fx.burst(x, 0.5, z, 0x6ab0ff, 50, 8, 0.4, 1.0, false);
      w.fx.shake(0.6, 0.4);
      w.damageArea(c, x, z, 4.8, m(2.6, lv), { kind: 'skill', slow: { mult: 0.5, dur: 3 }, knock: 2 });
    });
  },
});

reg({
  id: 'rabbits', cls: 'megumi', name: 'Rabbit Escape', type: 'active', req: 20, max: 5, row: 2, col: 1, prereq: ['shadowStep', 2], color: '#ffffff',
  desc: lv => `A flood of rabbits: +50% evasion for 5s while enemies around you are slowed and nibbled for ${pct(m(0.3, lv))} ATK per tick.`,
  ce: lv => 20 + lv * 2, cd: () => 20, anim: 'summon', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('rabbits', c.x, c.z);
    c.addBuff('rabbit', 5, { evasion: 0.5 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      w.summon('rabbit', c.x + Math.sin(a) * 1.5, c.z + Math.cos(a) * 1.5, { dur: 5, power: m(0.15, lv), owner: c });
    }
    for (let i = 0; i < 10; i++) w.schedule(0.5 * i, () => {
      w.damageArea(c, c.x, c.z, 3.5, m(0.3, lv), { kind: 'skill', slow: { mult: 0.6, dur: 0.6 }, quiet: true });
    });
  },
});

reg({ id: 'reserves', cls: 'megumi', name: 'Shadow Reserves', type: 'passive', req: 2, max: 5, row: 0, col: 2, color: '#6a6aff', desc: lv => `Max CE +${lv * 8}%, CE regen +${(lv * 0.4).toFixed(1)}/s.`, passive: lv => ({ cePct: lv * 0.08, ceRegen: lv * 0.4 }) });
reg({ id: 'bond', cls: 'megumi', name: 'Shikigami Bond', type: 'passive', req: 8, max: 5, row: 1, col: 2, color: '#c0c0ff', desc: lv => `Shikigami damage +${lv * 10}%.`, passive: lv => ({ summonPow: lv * 0.1 }) });
reg({ id: 'swordsman', cls: 'megumi', name: 'Swordsmanship', type: 'passive', req: 14, max: 5, row: 2, col: 2, prereq: ['bond', 2], color: '#d0d8e8', desc: lv => `Attack +${lv * 5}%, crit rate +${lv}%.`, passive: lv => ({ atkPct: lv * 0.05, crit: lv * 0.01 }) });
reg({ id: 'insight', cls: 'megumi', name: 'Ten Shadows Insight', type: 'passive', req: 22, max: 5, row: 3, col: 0, color: '#8a8aff', desc: lv => `Cooldowns -${lv * 4}%, skill power +${lv * 4}%.`, passive: lv => ({ cdr: lv * 0.04, skillPow: lv * 0.04 }) });

reg({
  id: 'garden', cls: 'megumi', name: 'Domain Expansion: Chimera Shadow Garden', type: 'ultimate', req: 25, max: 1, row: 3, col: 2, color: '#3a3aaa',
  desc: () => 'Ultimate. Flood the area with shadow for 10s: enemies are slowed and impaled by shadow spikes, two more Divine Dogs join you and your attack rises 30%. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('shadow', c.x, c.z, 12, 10.5);
    c.addBuff('garden', 11, { atkPct: 0.3, evasion: 0.2 });
    w.schedule(1.3, () => {
      for (const [k, s] of [['dogWhite', 1], ['dogBlack', -1]] as const) w.summon(k, c.x + s * 2, c.z + 1, { dur: 10, power: 0.9, owner: c });
      w.sfx('bark', c.x, c.z);
    });
    for (let i = 0; i < 19; i++) w.schedule(1.4 + i * 0.5, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 12);
      for (const tg of ts.slice(0, 8)) {
        w.fx.spikes(tg.x, tg.z, 0.8, 0x101018, 4);
        w.damageTarget(c, tg, 0.5, { kind: 'domain', noBF: true, slow: { mult: 0.5, dur: 0.6 }, quiet: true, color: '#9a9aff' });
      }
    });
  },
});

// ===========================================================================
// Nobara Kugisaki
// ===========================================================================

reg({
  id: 'hairpin', cls: 'nobara', name: 'Hairpin', type: 'active', req: 1, max: 5, row: 0, col: 0, color: '#ff7a4a',
  desc: lv => `Throw four nails that hit for ${pct(m(0.7, lv))} ATK each, then detonate for ${pct(m(0.65, lv))} ATK in a small area.`,
  ce: lv => 12 + lv * 2, cd: () => 5, anim: 'throw', animDur: 0.4, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const base = Math.atan2(a.x, a.z);
    w.schedule(0.17, () => w.sfx('nail', c.x, c.z));
    for (let i = 0; i < 4; i++) {
      const ang = base + (i - 1.5) * 0.16;
      w.schedule(0.17 + i * 0.03, () => w.projectile({
        x: c.x, z: c.z, dirX: Math.sin(ang), dirZ: Math.cos(ang), speed: 24, range: 10, radius: 0.45, mult: m(0.7, lv), visual: 'nail', team: 'player', opts: { kind: 'skill', mark: true }, fromCaster: c,
        onEnd: (x, z) => w.schedule(0.3, () => {
          w.fx.burst(x, 0.8, z, 0xff6a3a, 16, 5, 0.3);
          w.fx.ring(x, z, 0xff8a4a, 1.4, 0.25, 0.3);
          w.fx.light(x, 1, z, 0xff6a3a, 8, 0.2);
          w.sfx('explosion', x, z, 0.5, 1.4);
          w.damageArea(c, x, z, 1.5, m(0.65, lv), { kind: 'skill', quiet: true });
        }),
      }));
    }
  },
});

reg({
  id: 'volley', cls: 'nobara', name: 'Nail Volley', type: 'active', req: 3, max: 5, row: 0, col: 1, color: '#d8d8e0',
  desc: lv => `Fire eight nails at nearby enemies for ${pct(m(0.5, lv))} ATK each, marking them for Resonance.`,
  ce: lv => 14 + lv * 2, cd: () => 6, anim: 'throw', animDur: 0.6, range: 11,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    for (let i = 0; i < 8; i++) w.schedule(0.18 + i * 0.06, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 11);
      const tg = ts.length ? ts[i % Math.min(4, ts.length)] : null;
      let ax = a.x, az = a.z;
      if (tg) { const d = Math.hypot(tg.x - c.x, tg.z - c.z) || 1; ax = (tg.x - c.x) / d; az = (tg.z - c.z) / d; }
      const j = (Math.random() - 0.5) * 0.1;
      w.sfx('nail', c.x, c.z, 0.5, 1 + Math.random() * 0.3);
      w.projectile({ x: c.x, z: c.z, dirX: Math.sin(Math.atan2(ax, az) + j), dirZ: Math.cos(Math.atan2(ax, az) + j), speed: 26, range: 12, radius: 0.4, mult: m(0.5, lv), visual: 'nail', team: 'player', opts: { kind: 'skill', mark: true }, fromCaster: c, homing: 4 });
    });
  },
});

reg({
  id: 'resonance', cls: 'nobara', name: 'Resonance', type: 'active', req: 6, max: 5, row: 1, col: 0, prereq: ['hairpin', 2], color: '#ff2a5a',
  desc: lv => `Drive a nail into the straw doll: every nail-marked enemy takes ${pct(m(2.4, lv))} ATK, ignoring defense. With no marks, hits the nearest foe for ${pct(m(1.4, lv))}.`,
  ce: lv => 22 + lv * 3, cd: () => 10, anim: 'hammer', animDur: 0.5, range: 16,
  cast: (w, c, lv) => {
    w.fx.sigil(c.x, c.z, 1.3, 0xff2a5a, 0.7);
    w.schedule(0.24, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 16);
      const marked = ts.filter(tg => tg.marked > 0);
      w.sfx('hammer', c.x, c.z);
      w.sfx('resonance', c.x, c.z);
      if (marked.length) {
        for (const tg of marked) {
          w.fx.spikes(tg.x, tg.z, 0.6, 0x111111, 5);
          w.fx.burst(tg.x, 1, tg.z, 0xff2a5a, 18, 5, 0.3);
          w.damageTarget(c, tg, m(2.4, lv), { kind: 'skill', ignoreDef: true, consumeMark: true });
        }
      } else if (ts.length) {
        w.fx.spikes(ts[0].x, ts[0].z, 0.6, 0x111111, 5);
        w.damageTarget(c, ts[0], m(1.4, lv), { kind: 'skill', ignoreDef: true });
      }
    });
  },
});

reg({
  id: 'smash', cls: 'nobara', name: 'Hammer Smash', type: 'active', req: 10, max: 5, row: 1, col: 1, prereq: ['volley', 2], color: '#c8a05a',
  desc: lv => `Bring the hammer down in front of you for ${pct(m(2.0, lv))} ATK, stunning for 0.9s. Marked enemies take 50% more.`,
  ce: lv => 16 + lv * 2, cd: () => 7, anim: 'hammer', animDur: 0.5, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.schedule(0.15, () => w.sfx('swingHeavy', c.x, c.z));
    w.schedule(0.24, () => {
      const px = c.x + a.x * 1.4, pz = c.z + a.z * 1.4;
      w.sfx('hammer', px, pz, 1, 0.7);
      w.sfx('shockwave', px, pz, 0.6);
      w.fx.shockwave(px, pz, 2.6, 0xffc070);
      w.fx.spikes(px, pz, 1.8, 0x7a6a5a, 8);
      w.fx.shake(0.4);
      w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 3.2, 1.9, m(2.0, lv), { kind: 'skill', stun: 0.9, knock: 3, vsMarked: 1.5 });
    });
  },
});

reg({
  id: 'dollField', cls: 'nobara', name: 'Straw Doll Curse', type: 'active', req: 15, max: 5, row: 2, col: 0, prereq: ['resonance', 3], color: '#d8b05a',
  desc: lv => `Plant a cursed straw doll: for 5s enemies inside take ${pct(m(0.45, lv))} ATK every half second, are slowed and marked.`,
  ce: lv => 28 + lv * 3, cd: () => 14, anim: 'hammer', animDur: 0.45, range: 9,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(a.dist, 6);
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.schedule(0.21, () => { w.sfx('doll', x, z); w.sfx('hammer', c.x, c.z, 0.5, 1.2); });
    w.fx.sigil(x, z, 3.2, 0xd84a3a, 5.2);
    w.summon('doll', x, z, { dur: 5, power: 0, owner: c });
    for (let i = 0; i < 10; i++) w.schedule(0.3 + i * 0.5, () => {
      w.fx.embers(x, z, 3, 0xff4a3a, 6);
      w.damageArea(c, x, z, 3.2, m(0.45, lv), { kind: 'skill', mark: true, slow: { mult: 0.55, dur: 0.6 }, quiet: true });
    });
  },
});

reg({
  id: 'nailRain', cls: 'nobara', name: 'Cursed Nail Rain', type: 'active', req: 20, max: 5, row: 2, col: 1, prereq: ['smash', 2], color: '#9a9aaa',
  desc: lv => `Twelve cursed nails rain down around the target, each exploding for ${pct(m(0.8, lv))} ATK.`,
  ce: lv => 36 + lv * 3, cd: () => 16, anim: 'castUp', animDur: 0.5, range: 11,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(a.dist, 8);
    const cx = c.x + a.x * d, cz = c.z + a.z * d;
    w.fx.sigil(cx, cz, 4.5, 0xff4a6a, 2);
    for (let i = 0; i < 12; i++) w.schedule(0.3 + i * 0.12, () => {
      const r = Math.random() * 4, an = Math.random() * Math.PI * 2;
      const x = cx + Math.sin(an) * r, z = cz + Math.cos(an) * r;
      w.fx.lightning(x, 9, z, x, 0, z, 0xffd0d0, 0.06);
      w.fx.burst(x, 0.4, z, 0xff6a4a, 12, 5, 0.25);
      w.sfx('hammer', x, z, 0.4, 1.4);
      w.damageArea(c, x, z, 1.4, m(0.8, lv), { kind: 'skill', mark: true, quiet: true });
    });
  },
});

reg({ id: 'nerves', cls: 'nobara', name: 'Steel Nerves', type: 'passive', req: 2, max: 5, row: 0, col: 2, color: '#ffd04a', desc: lv => `Crit rate +${lv * 3}%, crit damage +${lv * 6}%.`, passive: lv => ({ crit: lv * 0.03, critDmg: lv * 0.06 }) });
reg({ id: 'nailcraft', cls: 'nobara', name: 'Nail Craft', type: 'passive', req: 8, max: 5, row: 1, col: 2, color: '#d0d0d8', desc: lv => `Projectile damage +${lv * 8}%.`, passive: lv => ({ projPow: lv * 0.08 }) });
reg({ id: 'grit', cls: 'nobara', name: 'Country Grit', type: 'passive', req: 14, max: 5, row: 2, col: 2, prereq: ['nailcraft', 2], color: '#8ad06a', desc: lv => `Max HP +${lv * 7}%, defense +${lv * 5}%.`, passive: lv => ({ hpPct: lv * 0.07, defPct: lv * 0.05 }) });
reg({ id: 'feedback', cls: 'nobara', name: 'Cursed Feedback', type: 'passive', req: 22, max: 5, row: 3, col: 0, color: '#ff4a8a', desc: lv => `Lifesteal +${lv * 2}%, skill power +${lv * 4}%.`, passive: lv => ({ lifesteal: lv * 0.02, skillPow: lv * 0.04 }) });

reg({
  id: 'thousand', cls: 'nobara', name: 'Resonance: Thousand Nails', type: 'ultimate', req: 25, max: 1, row: 3, col: 2, color: '#ff0a4a',
  desc: () => 'Ultimate. Mark every enemy in sight and drive five waves of Resonance through them, ignoring defense. The final wave is a guaranteed Black Flash. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('nails', c.x, c.z, 14, 5);
    c.setInvuln(5);
    for (let i = 0; i < 5; i++) w.schedule(1.3 + i * 0.6, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 14);
      w.sfx(i === 4 ? 'blackflash' : 'resonance', c.x, c.z, i === 4 ? 1 : 0.7);
      for (const tg of ts) {
        w.fx.spikes(tg.x, tg.z, 0.7, 0x111111, 4);
        w.damageTarget(c, tg, 1.6, { kind: 'domain', ignoreDef: true, bf: i === 4, noBF: i !== 4, quiet: i !== 4 });
      }
    });
  },
});

// ===========================================================================
// Expanded techniques: more actives, buffs, passives and reactions
// ===========================================================================

// ---- Yuji ----------------------------------------------------------------
reg({
  id: 'cursedSurge', cls: 'yuji', name: 'Cursed Energy Surge', type: 'buff', req: 5, max: 5, color: '#5ac8ff',
  desc: lv => `Flood your body with cursed energy for 8s: attack +${10 + lv * 4}%, attack speed +${8 + lv * 2}%.`,
  ce: lv => 14 + lv * 2, cd: () => 22, anim: 'channel', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z);
    w.fx.ring(c.x, c.z, 0x5ac8ff, 1.8, 0.45, 0.4);
    w.fx.pillar(c.x, c.z, 0.9, 2.6, 0x5ac8ff, 0.5);
    w.fx.burst(c.x, 1, c.z, 0x8ad8ff, 22, 4, 0.25, 0.6);
    c.addBuff('cursedSurge', 8, { atkPct: 0.1 + lv * 0.04, atkSpd: 0.08 + lv * 0.02 });
  },
});

reg({
  id: 'counterStrike', cls: 'yuji', name: 'Counter Stance', type: 'reaction', req: 9, max: 5, color: '#ffc04a',
  desc: lv => `When struck, ${8 + lv * 4}% chance to answer instantly with a ${pct(m(1.2, lv))} ATK blow around you (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.08 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    c.model?.play('punch3', 0.3);
    w.sfx('kick', c.x, c.z, 0.9, 1.2);
    w.fx.ring(c.x, c.z, 0xffd06a, 2.2, 0.25, 0.35);
    w.fx.slash(c.x, c.z, c.facing, 2.0, 0xfff0c0, Math.PI * 2, 0);
    w.damageArea(c, c.x, c.z, 2.2, m(1.2, lv), { kind: 'skill', knock: 2.5 });
  } },
});

reg({
  id: 'vesselBody', cls: 'yuji', name: "Vessel's Resilience", type: 'passive', req: 12, max: 5, color: '#ff8a9a',
  desc: lv => `Hosting Sukuna hardened you: max CE +${lv * 5}%, CE regen +${(lv * 0.5).toFixed(1)}/s, defense +${lv * 4}%.`,
  passive: lv => ({ cePct: lv * 0.05, ceRegen: lv * 0.5, defPct: lv * 0.04 }),
});

reg({
  id: 'ironWill', cls: 'yuji', name: 'Indomitable Spirit', type: 'buff', req: 18, max: 5, color: '#ffe08a',
  desc: lv => `Grit your teeth for 6s: damage taken -${20 + lv * 4}%, heal ${6 + lv * 2}% of max HP at once.`,
  ce: lv => 20 + lv * 2, cd: () => 30, anim: 'victory', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('heal', c.x, c.z);
    w.sfx('buff', c.x, c.z, 0.6, 0.8);
    w.fx.shockwave(c.x, c.z, 2.4, 0xffe08a);
    w.fx.burst(c.x, 1, c.z, 0xfff0b0, 20, 3, 0.25, 0.7);
    c.heal(c.maxHpValue() * (0.06 + lv * 0.02));
    c.addBuff('ironWill', 6, { dmgReduce: 0.2 + lv * 0.04 });
  },
});

reg({
  id: 'secondWind', cls: 'yuji', name: 'Second Wind', type: 'reaction', req: 24, max: 5, color: '#7aff9a',
  desc: lv => `When HP falls below 30%, recover ${18 + lv * 4}% of max HP (once every 60s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 60, run: (w, c, lv) => {
    w.sfx('heal', c.x, c.z, 0.8, 0.8);
    w.fx.pillar(c.x, c.z, 1.1, 3, 0x7aff9a, 0.7);
    w.fx.text(c.x, 2.6, c.z, 'SECOND WIND', '#7aff9a', 18);
    c.heal(c.maxHpValue() * (0.18 + lv * 0.04));
  } },
});

reg({
  id: 'piercingBlood', cls: 'yuji', name: 'Piercing Blood', type: 'active', req: 26, max: 5, prereq: ['blackflash', 2], color: '#ff2a4a',
  desc: lv => `Compress your blood and fire it as a beam that pierces everything in a line for ${pct(m(2.4, lv))} ATK.`,
  ce: lv => 30 + lv * 3, cd: () => 11, anim: 'clap', animDur: 0.55, range: 14,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.5, 1.5);
    w.schedule(0.28, () => {
      const x1 = c.x + a.x * 13, z1 = c.z + a.z * 13;
      w.sfx('blood', c.x, c.z);
      w.sfx('beam', c.x, c.z, 0.7, 1.4);
      w.fx.lightning(c.x + a.x * 0.6, 1.2, c.z + a.z * 0.6, x1, 1.2, z1, 0xff1a3a, 0.22);
      w.fx.lightning(c.x + a.x * 0.6, 1.2, c.z + a.z * 0.6, x1, 1.2, z1, 0xffc0c8, 0.07);
      w.fx.burst(x1, 1.2, z1, 0xff2a4a, 18, 5, 0.25);
      w.fx.shake(0.3);
      w.damageLine(c, c.x, c.z, x1, z1, 1.1, m(2.4, lv), { kind: 'skill', knock: 1.5 });
    });
  },
});

reg({
  id: 'fightingSpirit', cls: 'yuji', name: 'Fighting Spirit', type: 'passive', req: 30, max: 5, prereq: ['martial', 3], color: '#ff6a3a',
  desc: lv => `Crit damage +${lv * 10}%, lifesteal +${lv}%.`,
  passive: lv => ({ critDmg: lv * 0.1, lifesteal: lv * 0.01 }),
});

reg({
  id: 'supernova', cls: 'yuji', name: 'Supernova', type: 'active', req: 32, max: 5, prereq: ['piercingBlood', 2], color: '#ff4a6a',
  desc: lv => `Six blood orbs orbit you, then burst outward one by one, each exploding for ${pct(m(1.0, lv))} ATK.`,
  ce: lv => 36 + lv * 3, cd: () => 16, anim: 'castUp', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('blood', c.x, c.z, 0.7, 0.8);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      w.schedule(0.15 + i * 0.12, () => {
        const ox = c.x + Math.sin(ang) * 1.3, oz = c.z + Math.cos(ang) * 1.3;
        w.fx.burst(ox, 1.3, oz, 0xff2a4a, 6, 1, 0.3, 0.3);
        w.projectile({ x: ox, z: oz, dirX: Math.sin(ang), dirZ: Math.cos(ang), speed: 14, range: 6, radius: 0.6, mult: m(0.5, lv), visual: 'red', color: 0xff2a4a, team: 'player', opts: { kind: 'skill', quiet: true }, fromCaster: c,
          onEnd: (x, z) => {
            w.sfx('explosion', x, z, 0.5, 1.3);
            w.fx.burst(x, 0.8, z, 0xff2a4a, 20, 5, 0.3);
            w.fx.ring(x, z, 0xff4a6a, 1.8, 0.3, 0.4);
            w.damageArea(c, x, z, 1.9, m(1.0, lv), { kind: 'skill', knock: 1.5 });
          } });
      });
    }
  },
});

reg({
  id: 'dismantleY', cls: 'yuji', name: 'Dismantle', type: 'active', req: 38, max: 5, prereq: ['supernova', 1], color: '#e8e8f0',
  desc: lv => `Borrow the King's technique: a fan of invisible cuts slices everything ahead ${pct(m(0.7, lv))} ATK ×5, ignoring defense.`,
  ce: lv => 44 + lv * 3, cd: () => 18, anim: 'slash2', animDur: 0.45, range: 7,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    for (let i = 0; i < 5; i++) w.schedule(0.2 + i * 0.09, () => {
      w.sfx('dismantle', c.x, c.z, 0.8, 0.9 + i * 0.08);
      for (let k = 0; k < 3; k++) w.fx.slash(c.x + a.x * (1.5 + k * 1.6), c.z + a.z * (1.5 + k * 1.6), dir + (Math.random() - 0.5) * 1.2, 1.4, 0xffffff, 0.7, Math.random() * 2 - 1, 1);
      w.damageCone(c, c.x, c.z, dir, 7, 1.3, m(0.7, lv), { kind: 'skill', ignoreDef: true, noBF: true, quiet: i < 4, color: '#ffffff' });
    });
  },
});

// ---- Megumi ---------------------------------------------------------------
reg({
  id: 'shadowCloak', cls: 'megumi', name: 'Shadow Veil', type: 'buff', req: 5, max: 5, color: '#4a4a8a',
  desc: lv => `Wrap yourself in shadow for 8s: evasion +${12 + lv * 3}%, move speed +${8 + lv * 2}%.`,
  ce: lv => 14 + lv * 2, cd: () => 22, anim: 'cast', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('shadow', c.x, c.z);
    w.sfx('buff', c.x, c.z, 0.5, 0.7);
    w.fx.smoke(c.x, c.z, 0x101018, 22);
    w.fx.sigil(c.x, c.z, 1.4, 0x1a1a2a, 0.8);
    c.addBuff('shadowCloak', 8, { evasion: 0.12 + lv * 0.03, moveSpd: 0.08 + lv * 0.02 });
  },
});

reg({
  id: 'shadowGuard', cls: 'megumi', name: 'Shadow Sink', type: 'reaction', req: 9, max: 5, color: '#6a6acc',
  desc: lv => `When struck, ${8 + lv * 4}% chance to sink into your shadow: 1s of invulnerability and a ${pct(m(1.0, lv))} ATK counter-slash (every 4s at most).`,
  react: { on: 'hit', chance: lv => 0.08 + lv * 0.04, icd: 4, run: (w, c, lv) => {
    c.setInvuln(1);
    w.sfx('shadow', c.x, c.z, 0.8, 1.2);
    w.fx.smoke(c.x, c.z, 0x101018, 16);
    w.schedule(0.25, () => {
      c.model?.play('slash3', 0.3);
      w.fx.slash(c.x, c.z, c.facing, 2.2, 0x9a9aff, Math.PI * 2, 0);
      w.damageArea(c, c.x, c.z, 2.3, m(1.0, lv), { kind: 'skill', knock: 1.5 });
    });
  } },
});

reg({
  id: 'tenShadows', cls: 'megumi', name: 'Ten Shadows Mastery', type: 'passive', req: 12, max: 5, color: '#9a9aff',
  desc: lv => `Shikigami damage +${lv * 6}%, skill power +${lv * 3}%, max CE +${lv * 4}%.`,
  passive: lv => ({ summonPow: lv * 0.06, skillPow: lv * 0.03, cePct: lv * 0.04 }),
});

reg({
  id: 'roundDeer', cls: 'megumi', name: 'Round Deer', type: 'buff', req: 18, max: 5, color: '#b0ffd0',
  desc: lv => `Summon Round Deer's reverse cursed energy: heal ${15 + lv * 4}% of max HP over 5s and HP regen +${lv * 4}/s while it lasts.`,
  ce: lv => 24 + lv * 2, cd: () => 32, anim: 'summon', animDur: 0.55,
  cast: (w, c, lv) => {
    w.sfx('summon', c.x, c.z, 0.6, 1.2);
    w.schedule(0.2, () => w.sfx('heal', c.x, c.z));
    w.fx.sigil(c.x, c.z, 1.8, 0x2a4a3a, 1.2);
    w.fx.ring(c.x, c.z, 0xb0ffd0, 1.6, 0.6, 0.3);
    w.fx.burst(c.x, 0.6, c.z, 0xd8ffe8, 26, 2.5, 0.22, 1.0);
    const total = c.maxHpValue() * (0.15 + lv * 0.04);
    for (let i = 0; i < 5; i++) w.schedule(0.5 + i, () => { c.heal(total / 5); w.fx.burst(c.x, 1.2, c.z, 0xb0ffd0, 8, 2, 0.2, 0.6); });
    c.addBuff('roundDeer', 5.5, { hpRegen: lv * 4 });
  },
});

reg({
  id: 'loyalHounds', cls: 'megumi', name: 'Loyal Hounds', type: 'reaction', req: 24, max: 5, color: '#f0f0f8',
  desc: lv => `When an enemy falls, ${6 + lv * 3}% chance a Divine Dog leaps from the shadows to fight for 7s.`,
  react: { on: 'kill', chance: lv => 0.06 + lv * 0.03, icd: 5, run: (w, c, lv, ctx) => {
    const x = ctx.x ?? c.x, z = ctx.z ?? c.z;
    w.fx.smoke(x, z, 0x15151f, 12);
    w.sfx('bark', x, z, 0.6);
    w.summon(Math.random() < 0.5 ? 'dogWhite' : 'dogBlack', x, z, { dur: 7, power: m(0.5, lv), owner: c });
  } },
});

reg({
  id: 'orochi', cls: 'megumi', name: 'Great Serpent', type: 'active', req: 26, max: 5, prereq: ['toad', 2], color: '#8a7aff',
  desc: lv => `The Great Serpent erupts beneath the enemy, crushing for ${pct(m(2.6, lv))} ATK and binding it for 2s.`,
  ce: lv => 32 + lv * 3, cd: () => 13, anim: 'summon', animDur: 0.55, range: 11,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x = t ? t.x : c.x + a.x * 4, z = t ? t.z : c.z + a.z * 4;
    w.fx.sigil(x, z, 1.8, 0x1a1a2a, 1.2);
    w.sfx('rumble', x, z);
    w.schedule(0.3, () => {
      w.summon('serpent', x, z, { dur: 1.8, power: m(2.6, lv), owner: c });
      w.sfx('hiss', x, z);
      w.fx.spikes(x, z, 1.4, 0x2a2a3a, 8);
      w.fx.shake(0.35);
      w.damageArea(c, x, z, 1.9, m(2.6, lv), { kind: 'skill', stun: 2, knock: 0.5 });
    });
  },
});

reg({
  id: 'shadowArsenal', cls: 'megumi', name: 'Shadow Arsenal', type: 'passive', req: 30, max: 5, prereq: ['swordsman', 3], color: '#c8d0e8',
  desc: lv => `Tools pulled from your shadow: attack +${lv * 5}%, crit damage +${lv * 8}%.`,
  passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.08 }),
});

reg({
  id: 'piercingOx', cls: 'megumi', name: 'Piercing Ox', type: 'active', req: 30, max: 5, prereq: ['shadowStep', 2], color: '#d8a86a',
  desc: lv => `Piercing Ox charges in a straight line, goring everything in its path for ${pct(m(2.2, lv))} ATK. The longer the run, the harder it hits.`,
  ce: lv => 30 + lv * 3, cd: () => 12, anim: 'summon', animDur: 0.45, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x - a.x * 2, z0 = c.z - a.z * 2;
    w.fx.smoke(x0, z0, 0x15151f, 14);
    w.sfx('summon', x0, z0, 0.6, 0.8);
    w.summon('ox', x0, z0, { dur: 1.2, power: m(2.2, lv), owner: c });
  },
});

reg({
  id: 'totality', cls: 'megumi', name: 'Divine Dog: Totality', type: 'active', req: 36, max: 5, prereq: ['orochi', 1], color: '#e0e0f0',
  desc: lv => `Fuse the Divine Dogs into Totality, a giant wolf that hunts for 9s. Its maul hits an area for ${pct(m(1.4, lv))} ATK.`,
  ce: lv => 44 + lv * 3, cd: () => 26, anim: 'summon', animDur: 0.7,
  cast: (w, c, lv) => {
    const x = c.x + Math.sin(c.facing) * 2, z = c.z + Math.cos(c.facing) * 2;
    w.fx.sigil(x, z, 2.4, 0x1a1a2a, 1.4);
    w.fx.smoke(x, z, 0x101018, 26);
    w.sfx('summon', x, z);
    w.schedule(0.3, () => { w.sfx('howl', x, z); w.summon('totality', x, z, { dur: 9, power: m(1.4, lv), owner: c }); });
  },
});

// ---- Nobara ---------------------------------------------------------------
reg({
  id: 'steadyAim', cls: 'nobara', name: 'Steady Aim', type: 'buff', req: 5, max: 5, color: '#ffb05a',
  desc: lv => `Breathe and focus for 8s: projectile damage +${15 + lv * 5}%, crit rate +${4 + lv * 2}%.`,
  ce: lv => 14 + lv * 2, cd: () => 22, anim: 'pointUp', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.6, 1.2);
    w.fx.ring(c.x, c.z, 0xffb05a, 1.6, 0.4, 0.4);
    w.fx.burst(c.x, 1.4, c.z, 0xffd08a, 16, 2, 0.2, 0.6);
    c.addBuff('steadyAim', 8, { projPow: 0.15 + lv * 0.05, crit: 0.04 + lv * 0.02 });
  },
});

reg({
  id: 'thornDoll', cls: 'nobara', name: 'Straw Doll Retort', type: 'reaction', req: 9, max: 5, color: '#e0a04a',
  desc: lv => `When struck, ${10 + lv * 5}% chance the doll strikes back: the attacker takes ${pct(m(1.4, lv))} ATK, ignoring defense (every 2s at most).`,
  react: { on: 'hit', chance: lv => 0.1 + lv * 0.05, icd: 2, run: (w, c, lv, ctx) => {
    const tg = ctx.src;
    if (!tg || !tg.alive || tg.team !== 'enemy') return;
    w.sfx('resonance', tg.x, tg.z, 0.6, 1.3);
    w.fx.spikes(tg.x, tg.z, 0.5, 0x111111, 4);
    w.fx.burst(tg.x, 1, tg.z, 0xff2a5a, 12, 4, 0.25);
    w.damageTarget(c, tg, m(1.4, lv), { kind: 'skill', ignoreDef: true, mark: true });
  } },
});

reg({
  id: 'dollCraft', cls: 'nobara', name: 'Doll Craft', type: 'passive', req: 12, max: 5, color: '#d8b05a',
  desc: lv => `Nail-marked enemies take ${lv * 6}% more damage from everything you do. Skill power +${lv * 3}%.`,
  passive: lv => ({ markDmg: lv * 0.06, skillPow: lv * 0.03 }),
});

reg({
  id: 'ironGirl', cls: 'nobara', name: 'Kugisaki Pride', type: 'buff', req: 18, max: 5, color: '#ff8a6a',
  desc: lv => `"I'm Nobara Kugisaki!" For 8s defense +${20 + lv * 6}% and HP regen +${lv * 5}/s.`,
  ce: lv => 20 + lv * 2, cd: () => 30, anim: 'victory', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z);
    w.sfx('hammer', c.x, c.z, 0.5, 1.3);
    w.fx.shockwave(c.x, c.z, 2.2, 0xff8a6a);
    w.fx.text(c.x, 2.6, c.z, 'PRIDE', '#ff8a6a', 18);
    c.addBuff('ironGirl', 8, { defPct: 0.2 + lv * 0.06, hpRegen: lv * 5 });
  },
});

reg({
  id: 'finalNail', cls: 'nobara', name: 'Final Nail', type: 'reaction', req: 24, max: 5, color: '#c8c8d0',
  desc: lv => `When an enemy falls, ${15 + lv * 5}% chance three nails fly from its body into nearby foes for ${pct(m(0.8, lv))} ATK each.`,
  react: { on: 'kill', chance: lv => 0.15 + lv * 0.05, icd: 1.5, run: (w, c, lv, ctx) => {
    const x = ctx.x ?? c.x, z = ctx.z ?? c.z;
    const ts = w.targetsNear('enemy', x, z, 9).slice(0, 3);
    if (!ts.length) return;
    w.sfx('nail', x, z, 0.6, 1.2);
    ts.forEach((tg, i) => {
      const d = Math.hypot(tg.x - x, tg.z - z) || 1;
      w.schedule(i * 0.05, () => w.projectile({ x, z, dirX: (tg.x - x) / d, dirZ: (tg.z - z) / d, speed: 24, range: 10, radius: 0.4, mult: m(0.8, lv), visual: 'nail', team: 'player', opts: { kind: 'skill', mark: true }, fromCaster: c, homing: 5 }));
    });
  } },
});

reg({
  id: 'nailLance', cls: 'nobara', name: 'Nail Lance', type: 'active', req: 26, max: 5, prereq: ['volley', 3], color: '#e8e8f0',
  desc: lv => `Hammer one giant cursed nail forward: it pierces every enemy in a line for ${pct(m(2.4, lv))} ATK and marks them.`,
  ce: lv => 28 + lv * 3, cd: () => 10, anim: 'hammer', animDur: 0.5, range: 14,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.schedule(0.15, () => w.sfx('swingHeavy', c.x, c.z));
    w.schedule(0.24, () => {
      w.sfx('hammer', c.x, c.z, 1, 0.8);
      w.sfx('nail', c.x, c.z, 1, 0.6);
      w.fx.shake(0.25);
      w.projectile({ x: c.x + a.x * 0.6, z: c.z + a.z * 0.6, dirX: a.x, dirZ: a.z, speed: 30, range: 14, radius: 0.9, mult: m(2.4, lv), pierce: 99, visual: 'knife', color: 0xd8d8e0, team: 'player', opts: { kind: 'skill', mark: true, knock: 2 }, fromCaster: c });
    });
  },
});

reg({
  id: 'heavyHitter', cls: 'nobara', name: 'Heavy Hitter', type: 'passive', req: 30, max: 5, prereq: ['grit', 2], color: '#ff9a5a',
  desc: lv => `Attack +${lv * 5}%, crit damage +${lv * 8}%.`,
  passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.08 }),
});

reg({
  id: 'chainResonance', cls: 'nobara', name: 'Chain Resonance', type: 'active', req: 32, max: 5, prereq: ['resonance', 3], color: '#ff4a7a',
  desc: lv => `Resonance leaps between up to 8 enemies, starting with the marked ones, each jump dealing ${pct(m(1.5, lv))} ATK and spreading marks.`,
  ce: lv => 34 + lv * 3, cd: () => 14, anim: 'hammer', animDur: 0.5, range: 14,
  cast: (w, c, lv) => {
    w.schedule(0.2, () => w.sfx('hammer', c.x, c.z));
    w.fx.sigil(c.x, c.z, 1.3, 0xff2a5a, 0.7);
    const ts = w.targetsNear('enemy', c.x, c.z, 14).sort((p, q) => q.marked - p.marked).slice(0, 8);
    let px = c.x, pz = c.z;
    ts.forEach((tg, i) => w.schedule(0.2 + i * 0.1, () => {
      if (!tg.alive) return;
      w.fx.lightning(px, 1, pz, tg.x, 1, tg.z, 0xff2a5a, 0.1);
      w.fx.spikes(tg.x, tg.z, 0.5, 0x111111, 4);
      w.sfx('resonance', tg.x, tg.z, 0.5, 1 + i * 0.06);
      w.damageTarget(c, tg, m(1.5, lv), { kind: 'skill', mark: true, vsMarked: 1.3, quiet: true });
      px = tg.x; pz = tg.z;
    }));
  },
});

reg({
  id: 'bloodResonance', cls: 'nobara', name: 'Blood Resonance', type: 'active', req: 38, max: 5, prereq: ['chainResonance', 1], color: '#c80a3a',
  desc: lv => `Spend 12% of your HP to drive a nail through the doll with your own blood: every marked enemy takes ${pct(m(3.2, lv))} ATK, ignoring defense, and you gain 15% lifesteal for 6s.`,
  ce: lv => 40 + lv * 3, cd: () => 20, anim: 'hammer', animDur: 0.6, range: 16,
  cast: (w, c, lv) => {
    c.payHp(0.12);
    w.sfx('blood', c.x, c.z);
    w.fx.sigil(c.x, c.z, 2.2, 0xc80a3a, 1);
    w.fx.flash('#c80a3a', 0.25, 0.3);
    c.addBuff('bloodResonance', 6, { lifesteal: 0.15 });
    w.schedule(0.3, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 16);
      const marked = ts.filter(tg => tg.marked > 0);
      w.sfx('resonance', c.x, c.z, 1, 0.7);
      w.fx.shake(0.4);
      for (const tg of (marked.length ? marked : ts.slice(0, 1))) {
        w.fx.spikes(tg.x, tg.z, 0.8, 0x2a0008, 6);
        w.fx.burst(tg.x, 1, tg.z, 0xc80a3a, 22, 5, 0.3);
        w.damageTarget(c, tg, m(marked.length ? 3.2 : 2.0, lv), { kind: 'skill', ignoreDef: true, consumeMark: true });
      }
    });
  },
});

/** Fires every learned reaction listening for this event (respecting chance and internal cooldown). */
const reactReady: Record<string, number> = {};
export function triggerReactions(on: 'hit' | 'kill' | 'lowHp', w: WorldAPI, c: Caster, learned: Record<string, number>, ctx: ReactCtx = {}) {
  for (const [id, lv] of Object.entries(learned)) {
    const s = SKILLS[id];
    if (!s?.react || s.react.on !== on || lv <= 0) continue;
    const ready = reactReady[id] ?? 0;
    if (ready > w.time && ready - w.time <= s.react.icd) continue;
    if (Math.random() >= s.react.chance(lv)) continue;
    reactReady[id] = w.time + s.react.icd;
    s.react.run(w, c, lv, ctx);
  }
}

export function classSkills(cls: ClassId) {
  return Object.values(SKILLS).filter(s => s.cls === cls);
}
