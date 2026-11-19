// Techniques of the seven sorcerers who joined in 3.0: Satoru Gojo, Maki Zen'in, Aoi Todo, Toge Inumaki,
// Panda, Choso and Kinji Hakari. Each has five techniques that unlock with level, a buff, a reaction, three
// passives and an ultimate, in the same shape as everyone else's (see skills.ts).
import { aim, m, pct, reg } from './skills';
import { Caster, DamageSource, Target, WorldAPI } from '../world/api';

/** A damage source standing somewhere else (a Blue's centre, a swapped position), hitting with the caster's power. */
function at(c: Caster, x: number, z: number): DamageSource {
  return { x, z, level: c.level, team: c.team, atkPower: () => c.atkPower() };
}

function ahead(w: WorldAPI, c: Caster, t: Target | null, ax: number, az: number, r: number) {
  return t && Math.hypot(t.x - c.x, t.z - c.z) < r ? t : w.nearestTarget('enemy', c.x + ax * 2, c.z + az * 2, r);
}

// ===========================================================================
// Satoru Gojo: the Limitless and the Six Eyes
// ===========================================================================

reg({
  id: 'go_blue', cls: 'gojo', name: 'Cursed Technique Lapse: Blue', type: 'active', req: 1, max: 5, color: '#4a8aff',
  desc: lv => `Open a point of attraction ahead: everything within 4 m is dragged into it and crushed for ${pct(m(0.5, lv))} ATK three times.`,
  ce: lv => 12 + lv * 2, cd: () => 4.5, anim: 'pointUp', animDur: 0.4, range: 7,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(6, Math.max(2.5, a.dist));
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.sfx('blue', x, z, 1, 1);
    w.fx.sigil(x, z, 1.4, 0x3a6aff, 0.9);
    for (let i = 0; i < 3; i++) w.schedule(0.15 + i * 0.25, () => {
      w.fx.ring(x, z, 0x4a8aff, 4 - i, 0.25, 0.3);
      w.fx.burst(x, 1, z, 0x6aa8ff, 16, -5, 0.25, 0.4);
      w.damageArea(at(c, x, z), x, z, 4, m(0.5, lv), { kind: 'skill', knock: -2.6, quiet: i > 0, color: '#8ab8ff' });
    });
  },
});

reg({
  id: 'go_red', cls: 'gojo', name: 'Cursed Technique Reversal: Red', type: 'active', req: 3, max: 5, color: '#ff3a4a',
  desc: lv => `Fire a point of repulsion: ${pct(m(2.4, lv))} ATK to everything in a 12 m line, hurling it away.`,
  ce: lv => 16 + lv * 2, cd: () => 6, anim: 'pointUp', animDur: 0.45, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('red', c.x, c.z, 1, 1);
    w.fx.sigil(c.x + a.x, c.z + a.z, 0.9, 0xff2a3a, 0.4);
    w.schedule(0.2, () => {
      w.projectile({ x: c.x + a.x, z: c.z + a.z, dirX: a.x, dirZ: a.z, speed: 26, range: 12, radius: 1.1, mult: m(2.4, lv), pierce: 99, visual: 'red', team: 'player', opts: { kind: 'skill', knock: 5, color: '#ff6a7a' }, fromCaster: c });
      w.fx.shake(0.3);
    });
  },
});

reg({
  id: 'go_blink', cls: 'gojo', name: 'Instant Transmission', type: 'active', req: 6, max: 5, color: '#9ae8ff',
  desc: lv => `Vanish and reappear beside the nearest enemy with a strike for ${pct(m(2.2, lv))} ATK that stuns it for 1s.`,
  ce: lv => 14 + lv * 2, cd: () => 5, anim: 'punch2', animDur: 0.35, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const tg = ahead(w, c, t, a.x, a.z, 10);
    if (!tg) return;
    w.fx.burst(c.x, 1, c.z, 0x9ae8ff, 14, 3, 0.25, 0.3);
    const ang = Math.atan2(tg.x - c.x, tg.z - c.z);
    const bx = tg.x - Math.sin(ang) * 1.2, bz = tg.z - Math.cos(ang) * 1.2;
    if (!w.blocked(bx, bz, 0.4)) c.dash(bx - c.x, bz - c.z, Math.hypot(bx - c.x, bz - c.z), 0.06, true);
    w.schedule(0.1, () => {
      w.sfx('punch', tg.x, tg.z, 1, 0.9);
      w.fx.burst(tg.x, 1, tg.z, 0x9ae8ff, 18, 5, 0.25, 0.4);
      w.damageTarget(c, tg, m(2.2, lv), { kind: 'skill', stun: 1, knock: 2 });
    });
  },
});

reg({
  id: 'go_purple', cls: 'gojo', name: 'Hollow Technique: Purple', type: 'active', req: 15, max: 5, prereq: ['go_red', 2], color: '#a04aff',
  desc: lv => `Collide Blue and Red into imaginary mass: a sphere that erases everything in an 18 m line for ${pct(m(4.2, lv))} ATK, ignoring defense.`,
  ce: lv => 34 + lv * 4, cd: () => 16, anim: 'castUp', animDur: 0.9, range: 18,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.8, 0.8);
    w.fx.sigil(c.x - a.z * 1.2, c.z + a.x * 1.2, 0.7, 0x3a6aff, 0.6);
    w.fx.sigil(c.x + a.z * 1.2, c.z - a.x * 1.2, 0.7, 0xff2a3a, 0.6);
    w.fx.text(c.x, 3, c.z, '虚式「茈」', '#c08aff', 22);
    w.schedule(0.6, () => {
      w.sfx('beam', c.x, c.z, 1, 0.7);
      w.fx.flash('#3a0a5a', 0.4, 0.3);
      w.fx.shake(0.6, 0.5);
      w.projectile({ x: c.x + a.x, z: c.z + a.z, dirX: a.x, dirZ: a.z, speed: 22, range: 18, radius: 1.9, mult: m(4.2, lv), pierce: 99, visual: 'orb', color: 0xa04aff, team: 'player', opts: { kind: 'skill', ignoreDef: true, knock: 3, color: '#d0a0ff' }, fromCaster: c });
    });
  },
});

reg({
  id: 'go_maximum', cls: 'gojo', name: 'Maximum Output: Blue', type: 'active', req: 10, max: 5, prereq: ['go_blue', 2], color: '#2a5aff',
  desc: lv => `A Blue at full output around yourself: drag in everything within 7 m and crush it for ${pct(m(0.7, lv))} ATK five times.`,
  ce: lv => 24 + lv * 3, cd: () => 11, anim: 'castUp', animDur: 0.6,
  cast: (w, c, lv) => {
    w.sfx('blue', c.x, c.z, 1, 0.7);
    w.fx.pillar(c.x, c.z, 1.4, 4, 0x3a6aff, 1.3);
    for (let i = 0; i < 5; i++) w.schedule(0.15 + i * 0.22, () => {
      w.fx.ring(c.x, c.z, 0x4a8aff, 7 - i, 0.25, 0.4);
      w.damageArea(c, c.x, c.z, 7, m(0.7, lv), { kind: 'skill', knock: -3, quiet: i > 0, color: '#8ab8ff' });
    });
  },
});

reg({
  id: 'go_infinity', cls: 'gojo', name: 'Infinity', type: 'buff', req: 5, max: 5, color: '#e8f8ff',
  desc: lv => `Let nothing reach you for ${6 + lv}s: damage taken -${40 + lv * 6}%, move speed +15%.`,
  ce: lv => 20 + lv * 3, cd: () => 26, anim: 'victory', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('barrier', c.x, c.z, 0.8, 1.2);
    w.fx.ring(c.x, c.z, 0xe8f8ff, 2, 0.5, 0.2);
    c.addBuff('go_infinity', 6 + lv, { dmgReduce: 0.4 + lv * 0.06, moveSpd: 0.15 });
  },
});

reg({
  id: 'go_sixeyes', cls: 'gojo', name: 'Six Eyes', type: 'reaction', req: 9, max: 5, color: '#7fdcff',
  desc: lv => `When struck, ${12 + lv * 4}% chance to see it coming: the next second of blows can't land and you recover ${10 + lv * 2} CE (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.12 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.fx.ring(c.x, c.z, 0x7fdcff, 1.6, 0.3, 0.2);
    c.setInvuln(1);
    c.addBuff('go_sixeyes', 1, { ceRegen: 10 + lv * 2 });
  } },
});

reg({ id: 'go_limitless', cls: 'gojo', name: 'The Limitless', type: 'passive', req: 2, max: 5, color: '#4a8aff', desc: lv => `Attack +${lv * 5}%, CE regen +${lv * 1.5}/s.`, passive: lv => ({ atkPct: lv * 0.05, ceRegen: lv * 1.5 }) });
reg({ id: 'go_rct', cls: 'gojo', name: 'Reverse Cursed Technique', type: 'passive', req: 8, max: 5, color: '#e8f8ff', desc: lv => `HP regen +${lv * 3}/s, max HP +${lv * 5}%.`, passive: lv => ({ hpRegen: lv * 3, hpPct: lv * 0.05 }) });
reg({ id: 'go_strongest', cls: 'gojo', name: 'The Strongest', type: 'passive', req: 14, max: 5, color: '#a04aff', desc: lv => `Crit rate +${lv * 2}%, crit damage +${lv * 10}%, damage taken -${lv * 2}%.`, passive: lv => ({ crit: lv * 0.02, critDmg: lv * 0.1, dmgReduce: lv * 0.02 }) });

reg({
  id: 'go_void', cls: 'gojo', name: 'Domain Expansion: Unlimited Void', type: 'ultimate', req: 25, max: 1, color: '#7fdcff',
  desc: () => 'Ultimate. Infinite information floods everyone inside: every enemy within 14 m is stunned for the whole 8 seconds while Gojo strikes freely, and takes heavy damage when the domain closes. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('void', c.x, c.z, 14, 8.5);
    c.setInvuln(9);
    c.addBuff('go_void', 9, { atkPct: 0.35, crit: 0.2 });
    for (let i = 0; i < 16; i++) {
      w.schedule(1.2 + i * 0.45, () => {
        for (const tg of w.targetsNear('enemy', c.x, c.z, 14)) {
          w.damageTarget(c, tg, 0.3, { kind: 'domain', stun: 0.7, noBF: true, quiet: true, color: '#9ae8ff' });
        }
      });
    }
    w.schedule(8.3, () => {
      w.fx.flash('#bfefff', 0.5, 0.4);
      for (const tg of w.targetsNear('enemy', c.x, c.z, 14)) w.damageTarget(c, tg, 5, { kind: 'domain', noBF: true, ignoreDef: true, knock: 3, color: '#ffffff' });
    });
  },
});

// ===========================================================================
// Maki Zen'in: cursed tools and Heavenly Restriction (stamina)
// ===========================================================================

reg({
  id: 'mk_sweep', cls: 'maki', name: 'Polearm Sweep', type: 'active', req: 1, max: 5, color: '#7ad87a',
  desc: lv => `A full turn with the polearm: ${pct(m(1.6, lv))} ATK to everything within 3.6 m, knocking it back.`,
  ce: lv => 8 + lv, cd: () => 3.5, anim: 'slash1', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('swingHeavy', c.x, c.z, 1, 0.9);
    w.fx.slash(c.x, c.z, c.facing, 3.6, 0x9ae89a, 6.2, 0, 1);
    w.damageArea(c, c.x, c.z, 3.6, m(1.6, lv), { kind: 'skill', knock: 2.5 });
  },
});

reg({
  id: 'mk_thrust', cls: 'maki', name: 'Piercing Thrust', type: 'active', req: 3, max: 5, color: '#c8e8c8',
  desc: lv => `Lunge 5 m and run through everything in the way: ${pct(m(2.2, lv))} ATK, ignoring defense.`,
  ce: lv => 10 + lv * 2, cd: () => 5, anim: 'thrust', animDur: 0.4, range: 6,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    c.dash(a.x, a.z, 5, 0.16, true);
    w.schedule(0.16, () => {
      w.sfx('slash', c.x, c.z, 1, 1.1);
      w.fx.slash((x0 + c.x) / 2, (z0 + c.z) / 2, Math.atan2(a.x, a.z), 3, 0xe8f8e8, 0.6, 0, 1);
      w.damageLine(c, x0, z0, c.x + a.x * 1.5, c.z + a.z * 1.5, 1.3, m(2.2, lv), { kind: 'skill', ignoreDef: true, knock: 1.5 });
    });
  },
});

reg({
  id: 'mk_dragon', cls: 'maki', name: 'Dragon-Bone', type: 'active', req: 6, max: 5, color: '#e8e0c8',
  desc: lv => `A blade that stores the force of every blow it takes: an overhead strike for ${pct(m(3.0, lv))} ATK in front, releasing a shockwave for ${pct(m(1.0, lv))} more.`,
  ce: lv => 14 + lv * 2, cd: () => 7, anim: 'slam', animDur: 0.5, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.schedule(0.25, () => {
      const x = c.x + a.x * 2, z = c.z + a.z * 2;
      w.sfx('hammer', x, z, 1, 0.8);
      w.fx.shockwave(x, z, 3, 0xe8e0c8);
      w.fx.shake(0.35);
      w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 3.5, 1.4, m(3.0, lv), { kind: 'skill', knock: 2 });
      w.damageArea(c, x, z, 3, m(1.0, lv), { kind: 'skill', quiet: true, knock: 3 });
    });
  },
});

reg({
  id: 'mk_cloud', cls: 'maki', name: 'Playful Cloud', type: 'active', req: 10, max: 5, color: '#c8a050',
  desc: lv => `Six swings of the three-section staff, faster each time: ${pct(m(0.7, lv))} ATK around you per swing.`,
  ce: lv => 16 + lv * 2, cd: () => 8, anim: 'slash2', animDur: 0.8,
  cast: (w, c, lv) => {
    for (let i = 0; i < 6; i++) w.schedule(0.05 + i * (0.13 - i * 0.01), () => {
      w.sfx(i === 5 ? 'hammer' : 'swingHeavy', c.x, c.z, 0.8, 0.9 + i * 0.06);
      w.fx.slash(c.x, c.z, c.facing + i * 1.1, 2.8, 0xd8b04a, 1.3, i % 2 ? 0.5 : -0.5, 1);
      w.damageArea(c, c.x, c.z, 3, m(0.7, lv), { kind: 'skill', knock: i === 5 ? 3.5 : 0.5, quiet: i < 5 });
    });
  },
});

reg({
  id: 'mk_split', cls: 'maki', name: 'Split Soul Katana', type: 'active', req: 15, max: 5, prereq: ['mk_dragon', 2], color: '#b8a8d8',
  desc: lv => `Cut the soul itself: ${pct(m(3.4, lv))} ATK in a cone, ignoring defense, +40% against bosses.`,
  ce: lv => 20 + lv * 2, cd: () => 10, anim: 'slash2', animDur: 0.45, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2, Math.max(0, a.dist - 1.2)), 0.1);
    w.schedule(0.18, () => {
      w.sfx('slash', c.x, c.z, 1, 0.7);
      w.fx.slash(c.x + a.x, c.z + a.z, Math.atan2(a.x, a.z), 2.6, 0xb8a8d8, 1.9, 0.2, 1);
      for (const tg of w.targetsNear('enemy', c.x + a.x * 1.6, c.z + a.z * 1.6, 2.6).slice(0, 6)) {
        w.damageTarget(c, tg, m(3.4, lv) * (tg.isBoss ? 1.4 : 1), { kind: 'skill', ignoreDef: true, color: '#c8b8e8' });
      }
    });
  },
});

reg({
  id: 'mk_awaken', cls: 'maki', name: 'Heavenly Restriction', type: 'buff', req: 5, max: 5, color: '#5aa85a',
  desc: lv => `Push the body past every limit for 10s: attack +${15 + lv * 3}%, attack speed +${15 + lv * 3}%, move speed +${10 + lv * 2}%.`,
  ce: lv => 14 + lv * 2, cd: () => 22, anim: 'victory', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.7, 0.8);
    w.fx.pillar(c.x, c.z, 0.8, 2.4, 0x5aa85a, 0.5);
    c.addBuff('mk_awaken', 10, { atkPct: 0.15 + lv * 0.03, atkSpd: 0.15 + lv * 0.03, moveSpd: 0.1 + lv * 0.02 });
  },
});

reg({
  id: 'mk_parry', cls: 'maki', name: 'Battle Sense', type: 'reaction', req: 9, max: 5, color: '#9ae89a',
  desc: lv => `When struck, ${15 + lv * 4}% chance to parry and riposte for ${pct(m(1.8, lv))} ATK in front (every 2s at most).`,
  react: { on: 'hit', chance: lv => 0.15 + lv * 0.04, icd: 2, run: (w, c, lv) => {
    c.model?.play('thrust', 0.3);
    w.sfx('block', c.x, c.z, 0.9, 1.1);
    c.setInvuln(0.6);
    w.damageCone(c, c.x, c.z, c.facing, 3, 1.6, m(1.8, lv), { kind: 'skill', knock: 2 });
  } },
});

reg({ id: 'mk_body', cls: 'maki', name: 'Forged Body', type: 'passive', req: 2, max: 5, color: '#5aa85a', desc: lv => `Max HP +${lv * 7}%, defense +${lv * 5}%.`, passive: lv => ({ hpPct: lv * 0.07, defPct: lv * 0.05 }) });
reg({ id: 'mk_tools', cls: 'maki', name: 'Cursed Tool Expert', type: 'passive', req: 8, max: 5, color: '#c8a050', desc: lv => `Attack +${lv * 5}%, crit damage +${lv * 8}%.`, passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.08 }) });
reg({ id: 'mk_glasses', cls: 'maki', name: 'Without the Glasses', type: 'passive', req: 14, max: 5, color: '#9ae89a', desc: lv => `Crit rate +${lv * 2}%, evasion +${lv * 2}%, stamina regen +${lv}/s.`, passive: lv => ({ crit: lv * 0.02, evasion: lv * 0.02, ceRegen: lv }) });

reg({
  id: 'mk_ult', cls: 'maki', name: 'Zen\'in Massacre', type: 'ultimate', req: 25, max: 1, color: '#2a8a3a',
  desc: () => 'Ultimate. Maki wipes out the clan that cast her aside: for 6 seconds she cannot be touched and cuts through up to 10 enemies with every tool in the storehouse, ending with a Split Soul strike on the strongest. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'dash', animDur: 0.4,
  cast: (w, c) => {
    c.setInvuln(6.5);
    c.addBuff('mk_ult', 6.5, { moveSpd: 0.35, atkPct: 0.35 });
    w.sfx('charge', c.x, c.z, 0.7, 1.2);
    w.fx.text(c.x, 3, c.z, '禪院家 鏖殺', '#7ad87a', 24);
    for (let i = 0; i < 10; i++) w.schedule(0.35 + i * 0.5, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 15);
      const tg = ts[i % Math.max(1, ts.length)];
      if (!tg) return;
      const ang = Math.random() * Math.PI * 2;
      const bx = tg.x + Math.sin(ang) * 1.3, bz = tg.z + Math.cos(ang) * 1.3;
      if (!w.blocked(bx, bz, 0.4)) c.dash(bx - c.x, bz - c.z, Math.hypot(bx - c.x, bz - c.z), 0.08, true);
      w.schedule(0.1, () => {
        w.sfx(i % 2 ? 'slash' : 'hammer', tg.x, tg.z, 0.8, 0.9 + Math.random() * 0.3);
        w.fx.slash(tg.x, tg.z, ang, 1.8, i % 2 ? 0xe8f8e8 : 0xc8a050, 1.4, Math.random() * 2 - 1, 1);
        w.damageTarget(c, tg, 1.8, { kind: 'domain', ignoreDef: true, noBF: true, quiet: true, color: '#c8f0c8' });
      });
    });
    w.schedule(5.6, () => {
      const tg = w.targetsNear('enemy', c.x, c.z, 15).sort((p, q) => (q.isBoss ? 1 : 0) - (p.isBoss ? 1 : 0) || q.hp - p.hp)[0];
      if (!tg) return;
      w.sfx('slash', tg.x, tg.z, 1, 0.6);
      w.fx.slash(tg.x, tg.z, 0, 2.8, 0xb8a8d8, 2, 0, 1);
      w.fx.shake(0.6, 0.4);
      w.damageTarget(c, tg, 6, { kind: 'domain', ignoreDef: true, noBF: true, knock: 4, color: '#d0c0f0' });
    });
  },
});

// ===========================================================================
// Aoi Todo: Boogie Woogie and Black Flash
// ===========================================================================

reg({
  id: 'td_clap', cls: 'todo', name: 'Boogie Woogie', type: 'active', req: 1, max: 5, color: '#e8b05a',
  desc: lv => `Clap: swap places with the nearest enemy within 12 m, stunning it for 1.5s and everything near it for ${pct(m(1.2, lv))} ATK.`,
  ce: lv => 10 + lv * 2, cd: () => 4, anim: 'clap', animDur: 0.35, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const tg = ahead(w, c, t, a.x, a.z, 12);
    w.sfx('clap', c.x, c.z, 1, 1);
    if (!tg) return;
    const ox = c.x, oz = c.z;
    w.fx.burst(c.x, 1.2, c.z, 0xe8b05a, 12, 3, 0.25, 0.3);
    if (!w.blocked(tg.x, tg.z, 0.4)) c.dash(tg.x - c.x, tg.z - c.z, Math.hypot(tg.x - c.x, tg.z - c.z), 0.04, true);
    w.schedule(0.06, () => {
      w.fx.burst(ox, 1.2, oz, 0xe8b05a, 12, 3, 0.25, 0.3);
      w.damageTarget(c, tg, m(1.2, lv), { kind: 'skill', stun: 1.5 });
      w.damageArea(c, c.x, c.z, 2.5, m(0.6, lv), { kind: 'skill', stun: 1, quiet: true });
    });
  },
});

reg({
  id: 'td_haymaker', cls: 'todo', name: 'Brotherly Haymaker', type: 'active', req: 3, max: 5, color: '#ff8a4a',
  desc: lv => `A punch with his whole body behind it: ${pct(m(2.8, lv))} ATK to one enemy, with double the usual Black Flash chance.`,
  ce: lv => 12 + lv * 2, cd: () => 5, anim: 'uppercut', animDur: 0.45, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.5, Math.max(0.3, a.dist - 1)), 0.1);
    w.schedule(0.2, () => {
      const tg = ahead(w, c, t, a.x, a.z, 2.6);
      w.sfx('punch', c.x, c.z, 1, 0.75);
      if (!tg) return;
      const bf = Math.random() < 0.18;
      w.damageTarget(c, tg, m(2.8, lv) * (bf ? 2.5 : 1), { kind: 'skill', bf, knock: 3 });
    });
  },
});

reg({
  id: 'td_rock', cls: 'todo', name: 'Boulder Toss', type: 'active', req: 6, max: 5, color: '#a88a6a',
  desc: lv => `Hurl a boulder: ${pct(m(2.4, lv))} ATK where it lands and ${pct(m(1.0, lv))} to everything around, and you may clap to swap with it.`,
  ce: lv => 14 + lv * 2, cd: () => 7, anim: 'throw', animDur: 0.45, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('swingHeavy', c.x, c.z, 1, 0.6);
    w.projectile({ x: c.x + a.x, z: c.z + a.z, dirX: a.x, dirZ: a.z, speed: 16, range: Math.min(12, Math.max(4, a.dist)), radius: 0.9, mult: m(2.4, lv), visual: 'orb', color: 0x8a7a6a, team: 'player', gravity: true, opts: { kind: 'skill', knock: 2 }, fromCaster: c,
      onEnd: (x, z) => { w.sfx('stomp', x, z, 1, 0.8); w.fx.shockwave(x, z, 2.6, 0xa88a6a); w.damageArea(c, x, z, 2.6, m(1.0, lv), { kind: 'skill', knock: 2, quiet: true }); } });
  },
});

reg({
  id: 'td_flurry', cls: 'todo', name: 'Takada-chan Rush', type: 'active', req: 10, max: 5, color: '#ffb06a',
  desc: lv => `Eight punches inspired by his idol: ${pct(m(0.55, lv))} ATK each in front, the last sending everything flying.`,
  ce: lv => 16 + lv * 2, cd: () => 8, anim: 'punch1', animDur: 0.9,
  cast: (w, c, lv) => {
    for (let i = 0; i < 8; i++) w.schedule(0.05 + i * 0.1, () => {
      c.model?.play(i % 2 ? 'punch2' : 'punch1', 0.12);
      w.sfx('punch', c.x, c.z, 0.6, 0.9 + i * 0.05);
      w.damageCone(c, c.x, c.z, c.facing, 2.6, 1.4, m(0.55, lv), { kind: 'skill', knock: i === 7 ? 4 : 0.2, quiet: i % 2 === 1 });
    });
  },
});

reg({
  id: 'td_bf', cls: 'todo', name: 'Black Flash', type: 'active', req: 15, max: 5, prereq: ['td_haymaker', 2], color: '#ff1a2a',
  desc: lv => `Within 0.000001 seconds of the blow: a guaranteed Black Flash for ${pct(m(3.4, lv))} ATK (×2.5).`,
  ce: lv => 26 + lv * 3, cd: () => 14, anim: 'punch2', animDur: 0.45, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.5, Math.max(0.3, a.dist - 1)), 0.1);
    w.schedule(0.2, () => {
      const tg = ahead(w, c, t, a.x, a.z, 2.8);
      if (tg) w.damageTarget(c, tg, m(3.4, lv) * 2.5, { kind: 'skill', bf: true, knock: 4 });
    });
  },
});

reg({
  id: 'td_bestfriend', cls: 'todo', name: 'My Best Friend', type: 'buff', req: 5, max: 5, color: '#ff8a9a',
  desc: lv => `Fight like your brother is watching, for 10s: attack +${15 + lv * 4}%, Black Flash chance +${2 + lv}%, damage taken -10%.`,
  ce: lv => 16 + lv * 2, cd: () => 25, anim: 'victory', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.7, 0.8);
    w.fx.text(c.x, 3, c.z, '親友!!', '#ff8a9a', 22);
    c.addBuff('td_bestfriend', 10, { atkPct: 0.15 + lv * 0.04, bfChance: 0.02 + lv * 0.01, dmgReduce: 0.1 });
  },
});

reg({
  id: 'td_counter', cls: 'todo', name: 'Clap Counter', type: 'reaction', req: 9, max: 5, color: '#e8b05a',
  desc: lv => `When struck, ${14 + lv * 4}% chance to clap away: swap behind the attacker area and hit everything near for ${pct(m(1.6, lv))} ATK (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.14 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.sfx('clap', c.x, c.z, 1, 1.1);
    c.setInvuln(0.6);
    w.fx.burst(c.x, 1.2, c.z, 0xe8b05a, 12, 3, 0.25, 0.3);
    w.damageArea(c, c.x, c.z, 2.6, m(1.6, lv), { kind: 'skill', stun: 0.8, knock: 2 });
  } },
});

reg({ id: 'td_body', cls: 'todo', name: 'Monster Physique', type: 'passive', req: 2, max: 5, color: '#e8b05a', desc: lv => `Max HP +${lv * 8}%, defense +${lv * 4}%.`, passive: lv => ({ hpPct: lv * 0.08, defPct: lv * 0.04 }) });
reg({ id: 'td_ideal', cls: 'todo', name: 'Tall Butt', type: 'passive', req: 8, max: 5, color: '#ff8a9a', desc: lv => `Attack +${lv * 6}%, attack speed +${lv * 2}%.`, passive: lv => ({ atkPct: lv * 0.06, atkSpd: lv * 0.02 }) });
reg({ id: 'td_flash', cls: 'todo', name: 'Sparks of Black', type: 'passive', req: 14, max: 5, color: '#ff1a2a', desc: lv => `Black Flash chance +${(lv * 1.2).toFixed(1)}%, crit damage +${lv * 8}%.`, passive: lv => ({ bfChance: lv * 0.012, critDmg: lv * 0.08 }) });

reg({
  id: 'td_ult', cls: 'todo', name: 'Brothers\' Black Flash', type: 'ultimate', req: 25, max: 1, color: '#ff1a2a',
  desc: () => 'Ultimate. Clap after clap, Todo swaps between the strongest enemies nearby and lands five guaranteed Black Flashes, the last one on the strongest. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'clap', animDur: 0.4,
  cast: (w, c) => {
    c.setInvuln(4.5);
    w.fx.text(c.x, 3, c.z, '不義遊戯', '#e8b05a', 24);
    for (let i = 0; i < 5; i++) w.schedule(0.4 + i * 0.75, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 15).sort((p, q) => q.hp - p.hp);
      const tg = i === 4 ? ts[0] : ts[i % Math.max(1, ts.length)];
      if (!tg) return;
      w.sfx('clap', c.x, c.z, 1, 1);
      const ang = Math.atan2(tg.x - c.x, tg.z - c.z);
      const bx = tg.x - Math.sin(ang) * 1.1, bz = tg.z - Math.cos(ang) * 1.1;
      if (!w.blocked(bx, bz, 0.4)) c.dash(bx - c.x, bz - c.z, Math.hypot(bx - c.x, bz - c.z), 0.05, true);
      w.schedule(0.12, () => w.damageTarget(c, tg, i === 4 ? 9 : 4.5, { kind: 'skill', bf: true, knock: 3 }));
    });
  },
});

// ===========================================================================
// Toge Inumaki: Cursed Speech (big words strain the throat: they cost a little HP)
// ===========================================================================

reg({
  id: 'in_stop', cls: 'inumaki', name: '"Don\'t Move."', type: 'active', req: 1, max: 5, color: '#c8d8f8',
  desc: lv => `Everything within 8 m freezes for ${(1.6 + lv * 0.2).toFixed(1)}s and takes ${pct(m(0.6, lv))} ATK.`,
  ce: lv => 12 + lv * 2, cd: () => 6, anim: 'cast', animDur: 0.35,
  cast: (w, c, lv) => {
    w.sfx('curse', c.x, c.z, 0.9, 1.3);
    w.fx.text(c.x, 2.8, c.z, '「動くな」', '#c8d8f8', 20);
    w.fx.ring(c.x, c.z, 0xc8d8f8, 8, 0.45, 0.3);
    w.damageArea(c, c.x, c.z, 8, m(0.6, lv), { kind: 'skill', stun: 1.6 + lv * 0.2, color: '#d8e8ff' });
  },
});

reg({
  id: 'in_crush', cls: 'inumaki', name: '"Crush."', type: 'active', req: 3, max: 5, color: '#8aa8d8',
  desc: lv => `The word lands like a weight: ${pct(m(2.4, lv))} ATK to everything in a 4 m circle ahead, ignoring defense.`,
  ce: lv => 14 + lv * 2, cd: () => 5, anim: 'cast', animDur: 0.35, range: 8,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(7, Math.max(2, a.dist));
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.fx.text(c.x, 2.8, c.z, '「潰れろ」', '#8aa8d8', 20);
    w.schedule(0.15, () => {
      w.sfx('stomp', x, z, 1, 0.7);
      w.fx.shockwave(x, z, 4, 0x8aa8d8);
      w.damageArea(c, x, z, 4, m(2.4, lv), { kind: 'skill', ignoreDef: true });
    });
  },
});

reg({
  id: 'in_blast', cls: 'inumaki', name: '"Blast Away."', type: 'active', req: 6, max: 5, color: '#e8f0ff',
  desc: lv => `A cone of force 9 m long: ${pct(m(2.0, lv))} ATK, hurling everything far away.`,
  ce: lv => 16 + lv * 2, cd: () => 6, anim: 'cast', animDur: 0.4, range: 9,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    w.fx.text(c.x, 2.8, c.z, '「吹っ飛べ」', '#e8f0ff', 20);
    w.sfx('wind', c.x, c.z, 1, 1);
    w.fx.slash(c.x + a.x * 2, c.z + a.z * 2, dir, 5, 0xe8f0ff, 1.2, 0, 1);
    w.damageCone(c, c.x, c.z, dir, 9, 1.0, m(2.0, lv), { kind: 'skill', knock: 7 });
  },
});

reg({
  id: 'in_sleep', cls: 'inumaki', name: '"Sleep."', type: 'active', req: 10, max: 5, color: '#a8b8e8',
  desc: lv => `Enemies within 6 m fall asleep for ${4 + lv * 0.5}s (bosses: a third of that). Costs 3% of your HP.`,
  ce: lv => 18 + lv * 2, cd: () => 14, anim: 'cast', animDur: 0.4,
  cast: (w, c, lv) => {
    c.payHp(0.03);
    w.fx.text(c.x, 2.8, c.z, '「眠れ」', '#a8b8e8', 20);
    w.fx.ring(c.x, c.z, 0xa8b8e8, 6, 0.6, 0.4);
    for (const tg of w.targetsNear('enemy', c.x, c.z, 6)) w.damageTarget(c, tg, 0.1, { kind: 'skill', stun: (4 + lv * 0.5) * (tg.isBoss ? 0.34 : 1), quiet: true });
  },
});

reg({
  id: 'in_twist', cls: 'inumaki', name: '"Twist."', type: 'active', req: 15, max: 5, prereq: ['in_crush', 2], color: '#5a7ad8',
  desc: lv => `The strongest enemy within 10 m is wrung like a rag: ${pct(m(4.5, lv))} ATK, ignoring defense. Costs 5% of your HP.`,
  ce: lv => 26 + lv * 3, cd: () => 12, anim: 'cast', animDur: 0.45, range: 10,
  cast: (w, c, lv) => {
    const tg = w.targetsNear('enemy', c.x, c.z, 10).sort((p, q) => q.hp - p.hp)[0];
    if (!tg) return;
    c.payHp(0.05);
    w.fx.text(c.x, 2.8, c.z, '「捻れろ」', '#5a7ad8', 22);
    w.schedule(0.2, () => {
      w.sfx('shatter', tg.x, tg.z, 0.8, 0.7);
      w.fx.spikes(tg.x, tg.z, 1.2, 0x5a7ad8, 6);
      w.damageTarget(c, tg, m(4.5, lv), { kind: 'skill', ignoreDef: true, color: '#9ab0ff' });
    });
  },
});

reg({
  id: 'in_medicine', cls: 'inumaki', name: 'Throat Medicine', type: 'buff', req: 5, max: 5, color: '#e8f0ff',
  desc: lv => `Soothe the strain: restore ${10 + lv * 3}% HP, and for 12s CE regen +${3 + lv}/s and skills cost less.`,
  ce: () => 0, cd: () => 28, anim: 'victory', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('potion', c.x, c.z, 0.8, 1);
    c.heal(c.maxHpValue() * (0.1 + lv * 0.03));
    c.addBuff('in_medicine', 12, { ceRegen: 3 + lv, skillPow: 0.1 });
  },
});

reg({
  id: 'in_getdown', cls: 'inumaki', name: '"Get Down."', type: 'reaction', req: 9, max: 5, color: '#c8d8f8',
  desc: lv => `When struck, ${16 + lv * 4}% chance to shout everything near you to the ground: ${pct(m(1.2, lv))} ATK and a 1s stun within 4 m (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.16 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.fx.text(c.x, 2.8, c.z, '「伏せろ」', '#c8d8f8', 18);
    w.fx.ring(c.x, c.z, 0xc8d8f8, 4, 0.3, 0.3);
    w.damageArea(c, c.x, c.z, 4, m(1.2, lv), { kind: 'skill', stun: 1, knock: 1 });
  } },
});

reg({ id: 'in_clan', cls: 'inumaki', name: 'Inumaki Clan Seal', type: 'passive', req: 2, max: 5, color: '#c8d8f8', desc: lv => `Skill damage +${lv * 6}%, CE regen +${lv}/s.`, passive: lv => ({ skillPow: lv * 0.06, ceRegen: lv }) });
reg({ id: 'in_onigiri', cls: 'inumaki', name: 'Onigiri Vocabulary', type: 'passive', req: 8, max: 5, color: '#e8f0ff', desc: lv => `Max HP +${lv * 6}%, evasion +${lv * 2}%.`, passive: lv => ({ hpPct: lv * 0.06, evasion: lv * 0.02 }) });
reg({ id: 'in_voice', cls: 'inumaki', name: 'Voice That Binds', type: 'passive', req: 14, max: 5, color: '#5a7ad8', desc: lv => `Attack +${lv * 4}%, crit rate +${lv * 2}%.`, passive: lv => ({ atkPct: lv * 0.04, crit: lv * 0.02 }) });

reg({
  id: 'in_die', cls: 'inumaki', name: '"Die."', type: 'ultimate', req: 25, max: 1, color: '#1a2a6a',
  desc: () => 'Ultimate. The one word he swore never to use: every enemy within 16 m takes enormous damage that ignores defense (bosses resist half). His throat pays for it: 15% of his HP. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'castUp', animDur: 0.9,
  cast: (w, c) => {
    c.payHp(0.15);
    w.fx.flash('#000010', 0.6, 0.5);
    w.fx.text(c.x, 3, c.z, '「死ね」', '#c8d8f8', 30);
    w.sfx('domain', c.x, c.z, 0.8, 1.4);
    w.schedule(0.6, () => {
      w.fx.ring(c.x, c.z, 0x1a2a6a, 16, 0.6, 0.6);
      w.fx.shake(0.8, 0.6);
      for (const tg of w.targetsNear('enemy', c.x, c.z, 16)) w.damageTarget(c, tg, tg.isBoss ? 7 : 14, { kind: 'domain', ignoreDef: true, noBF: true, color: '#9ab0ff' });
    });
  },
});

// ===========================================================================
// Panda: three cores
// ===========================================================================

reg({
  id: 'pa_punch', cls: 'panda', name: 'Panda Punch', type: 'active', req: 1, max: 5, color: '#e8e8e8',
  desc: lv => `A heavy two-paw strike: ${pct(m(2.0, lv))} ATK in front, stunning for 0.8s.`,
  ce: lv => 8 + lv, cd: () => 3.5, anim: 'punch2', animDur: 0.4, range: 3,
  cast: (w, c, lv) => {
    w.schedule(0.18, () => {
      w.sfx('punch', c.x, c.z, 1, 0.7);
      w.damageCone(c, c.x, c.z, c.facing, 2.6, 1.3, m(2.0, lv), { kind: 'skill', stun: 0.8, knock: 2 });
    });
  },
});

reg({
  id: 'pa_drum', cls: 'panda', name: 'Drumming Beat', type: 'active', req: 3, max: 5, color: '#d84a4a',
  desc: lv => `Gorilla core: a punch whose shockwave passes through to the inside: ${pct(m(2.6, lv))} ATK ignoring defense, then ${pct(m(1.0, lv))} in a ring.`,
  ce: lv => 12 + lv * 2, cd: () => 6, anim: 'slam', animDur: 0.45, range: 3,
  cast: (w, c, lv) => {
    w.schedule(0.22, () => {
      const x = c.x + Math.sin(c.facing) * 1.6, z = c.z + Math.cos(c.facing) * 1.6;
      w.sfx('hammer', x, z, 1, 0.6);
      w.fx.shockwave(x, z, 2.6, 0xd84a4a);
      w.damageCone(c, c.x, c.z, c.facing, 2.8, 1.2, m(2.6, lv), { kind: 'skill', ignoreDef: true, knock: 2 });
      w.damageArea(c, x, z, 2.6, m(1.0, lv), { kind: 'skill', quiet: true });
    });
  },
});

reg({
  id: 'pa_roll', cls: 'panda', name: 'Panda Roll', type: 'active', req: 6, max: 5, color: '#c8c8c8',
  desc: lv => `Tuck and roll 7 m through everything in the way: ${pct(m(1.8, lv))} ATK each and knocked aside. You can't be hit while rolling.`,
  ce: lv => 12 + lv * 2, cd: () => 6, anim: 'dash', animDur: 0.4, range: 7,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    c.dash(a.x, a.z, 7, 0.3, true);
    w.sfx('dash', c.x, c.z, 1, 0.7);
    w.schedule(0.3, () => w.damageLine(c, x0, z0, c.x, c.z, 1.6, m(1.8, lv), { kind: 'skill', knock: 3 }));
  },
});

reg({
  id: 'pa_tricera', cls: 'panda', name: 'Triceratops Charge', type: 'active', req: 10, max: 5, color: '#e8c86a',
  desc: lv => `Swap to the triceratops core and charge 10 m: ${pct(m(2.8, lv))} ATK to everything you hit, flinging it far.`,
  ce: lv => 18 + lv * 2, cd: () => 9, anim: 'dash', animDur: 0.5, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    w.fx.text(c.x, 2.8, c.z, 'トリケラ!', '#e8c86a', 18);
    c.dash(a.x, a.z, 10, 0.35, true);
    w.sfx('stomp', c.x, c.z, 1, 0.8);
    w.schedule(0.35, () => { w.fx.shockwave(c.x, c.z, 2.4, 0xe8c86a); w.damageLine(c, x0, z0, c.x, c.z, 1.8, m(2.8, lv), { kind: 'skill', knock: 6 }); });
  },
});

reg({
  id: 'pa_slam', cls: 'panda', name: 'Gorilla Mode: Earthshaker', type: 'active', req: 15, max: 5, prereq: ['pa_drum', 2], color: '#a83a3a',
  desc: lv => `Pound the ground three times: ${pct(m(1.4, lv))} ATK to everything within 5 m each time, the last stunning for 1.5s.`,
  ce: lv => 24 + lv * 3, cd: () => 12, anim: 'slam', animDur: 0.9,
  cast: (w, c, lv) => {
    for (let i = 0; i < 3; i++) w.schedule(0.2 + i * 0.3, () => {
      c.model?.play('slam', 0.25);
      w.sfx('stomp', c.x, c.z, 1, 0.7 + i * 0.05);
      w.fx.shockwave(c.x, c.z, 5, 0xa83a3a);
      w.fx.shake(0.3);
      w.damageArea(c, c.x, c.z, 5, m(1.4, lv), { kind: 'skill', stun: i === 2 ? 1.5 : 0, knock: 1, quiet: i < 2 });
    });
  },
});

reg({
  id: 'pa_core', cls: 'panda', name: 'Gorilla Core', type: 'buff', req: 5, max: 5, color: '#d84a4a',
  desc: lv => `Switch cores for 12s: attack +${15 + lv * 3}%, defense +${15 + lv * 4}%, knockback immunity.`,
  ce: lv => 16 + lv * 2, cd: () => 24, anim: 'victory', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('growl', c.x, c.z, 0.8, 0.8);
    w.fx.pillar(c.x, c.z, 1, 2.6, 0xd84a4a, 0.5);
    c.addBuff('pa_core', 12, { atkPct: 0.15 + lv * 0.03, defPct: 0.15 + lv * 0.04 });
  },
});

reg({
  id: 'pa_shell', cls: 'panda', name: 'Thick Fur', type: 'reaction', req: 9, max: 5, color: '#e8e8e8',
  desc: lv => `When struck, ${18 + lv * 4}% chance to shrug it off: heal ${3 + lv}% of max HP and gain 30% damage reduction for 3s (every 4s at most).`,
  react: { on: 'hit', chance: lv => 0.18 + lv * 0.04, icd: 4, run: (w, c, lv) => {
    w.fx.ring(c.x, c.z, 0xe8e8e8, 1.4, 0.3, 0.2);
    c.heal(c.maxHpValue() * (0.03 + lv * 0.01));
    c.addBuff('pa_shell', 3, { dmgReduce: 0.3 });
  } },
});

reg({ id: 'pa_body', cls: 'panda', name: 'Cursed Corpse Body', type: 'passive', req: 2, max: 5, color: '#e8e8e8', desc: lv => `Max HP +${lv * 9}%, defense +${lv * 6}%.`, passive: lv => ({ hpPct: lv * 0.09, defPct: lv * 0.06 }) });
reg({ id: 'pa_cores', cls: 'panda', name: 'Three Cores', type: 'passive', req: 8, max: 5, color: '#e8c86a', desc: lv => `HP regen +${lv * 3}/s, damage taken -${lv * 2}%.`, passive: lv => ({ hpRegen: lv * 3, dmgReduce: lv * 0.02 }) });
reg({ id: 'pa_strength', cls: 'panda', name: 'Panda Strength', type: 'passive', req: 14, max: 5, color: '#d84a4a', desc: lv => `Attack +${lv * 5}%, crit damage +${lv * 6}%.`, passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.06 }) });

reg({
  id: 'pa_ult', cls: 'panda', name: 'Triceratops Core: Stampede', type: 'ultimate', req: 25, max: 1, color: '#e8c86a',
  desc: () => 'Ultimate. All three cores at once: Panda charges back and forth across the field six times, untouchable, trampling everything for heavy damage and ending with a ground-splitting slam. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'dash', animDur: 0.4,
  cast: (w, c) => {
    c.setInvuln(5);
    w.fx.text(c.x, 3, c.z, '三つの核', '#e8c86a', 24);
    for (let i = 0; i < 6; i++) w.schedule(0.3 + i * 0.6, () => {
      const tg = w.targetsNear('enemy', c.x, c.z, 16)[i % 3];
      const dx = tg ? tg.x - c.x : Math.sin(c.facing + i * 2), dz = tg ? tg.z - c.z : Math.cos(c.facing + i * 2);
      const len = Math.hypot(dx, dz) || 1;
      const x0 = c.x, z0 = c.z;
      c.dash(dx / len, dz / len, 9, 0.3, true);
      w.sfx('stomp', c.x, c.z, 1, 0.8);
      w.schedule(0.3, () => w.damageLine(c, x0, z0, c.x, c.z, 2, 2.2, { kind: 'domain', knock: 4, noBF: true, quiet: true }));
    });
    w.schedule(4.2, () => {
      w.sfx('explosion', c.x, c.z, 1, 0.8);
      w.fx.shockwave(c.x, c.z, 7, 0xe8c86a);
      w.fx.shake(0.8, 0.5);
      w.damageArea(c, c.x, c.z, 7, 5, { kind: 'domain', knock: 5, noBF: true, stun: 1.5 });
    });
  },
});

// ===========================================================================
// Choso: Blood Manipulation
// ===========================================================================

reg({
  id: 'ch_pierce', cls: 'choso', name: 'Piercing Blood', type: 'active', req: 1, max: 5, color: '#ff2a3a',
  desc: lv => `Compress blood and fire it at supersonic speed: ${pct(m(2.0, lv))} ATK to everything in a 14 m line.`,
  ce: lv => 12 + lv * 2, cd: () => 4, anim: 'cast', animDur: 0.45, range: 14,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('blood', c.x, c.z, 1, 1.2);
    w.schedule(0.2, () => {
      const x1 = c.x + a.x * 14, z1 = c.z + a.z * 14;
      w.fx.lightning(c.x, 1.3, c.z, x1, 1.3, z1, 0xff1a2a, 0.14);
      w.damageLine(c, c.x, c.z, x1, z1, 0.9, m(2.0, lv), { kind: 'skill', knock: 1, color: '#ff6a7a' });
    });
  },
});

reg({
  id: 'ch_slice', cls: 'choso', name: 'Slicing Exorcism', type: 'active', req: 3, max: 5, color: '#c81a2a',
  desc: lv => `Two spinning blood discs fly out and back: ${pct(m(1.1, lv))} ATK to everything they cut, both ways.`,
  ce: lv => 12 + lv * 2, cd: () => 5, anim: 'throw', animDur: 0.4, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('blood', c.x, c.z, 0.8, 1.4);
    for (const s of [-0.25, 0.25]) {
      const dx2 = a.x * Math.cos(s) - a.z * Math.sin(s), dz2 = a.x * Math.sin(s) + a.z * Math.cos(s);
      w.projectile({ x: c.x, z: c.z, dirX: dx2, dirZ: dz2, speed: 18, range: 10, radius: 0.8, mult: m(1.1, lv), pierce: 99, visual: 'slash', color: 0xc81a2a, team: 'player', opts: { kind: 'skill', color: '#ff6a7a' }, fromCaster: c,
        onEnd: (x, z) => w.projectile({ x, z, dirX: c.x - x, dirZ: c.z - z, speed: 20, range: Math.hypot(c.x - x, c.z - z), radius: 0.8, mult: m(1.1, lv), pierce: 99, visual: 'slash', color: 0xc81a2a, team: 'player', opts: { kind: 'skill', quiet: true }, fromCaster: c }) });
    }
  },
});

reg({
  id: 'ch_scale', cls: 'choso', name: 'Flowing Red Scale', type: 'buff', req: 5, max: 5, color: '#ff4a5a',
  desc: lv => `Speed the blood through your veins for 12s: attack +${15 + lv * 3}%, move speed +${10 + lv * 2}%, attack speed +${10 + lv * 2}%.`,
  ce: lv => 16 + lv * 2, cd: () => 24, anim: 'channel', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('blood', c.x, c.z, 0.8, 0.8);
    w.fx.pillar(c.x, c.z, 0.8, 2.4, 0xff2a3a, 0.5);
    c.addBuff('ch_scale', 12, { atkPct: 0.15 + lv * 0.03, moveSpd: 0.1 + lv * 0.02, atkSpd: 0.1 + lv * 0.02 });
  },
});

reg({
  id: 'ch_conv', cls: 'choso', name: 'Convergence', type: 'active', req: 6, max: 5, color: '#ff1a2a',
  desc: lv => `Gather the blood into one hardened fist: ${pct(m(3.0, lv))} ATK to one enemy, then the blood bursts for ${pct(m(0.8, lv))} around it.`,
  ce: lv => 16 + lv * 2, cd: () => 7, anim: 'punch2', animDur: 0.45, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0.3, a.dist - 1)), 0.1);
    w.schedule(0.2, () => {
      const tg = ahead(w, c, t, a.x, a.z, 2.8);
      w.sfx('punch', c.x, c.z, 1, 0.7);
      if (!tg) return;
      w.damageTarget(c, tg, m(3.0, lv), { kind: 'skill', knock: 2.5 });
      w.fx.burst(tg.x, 1, tg.z, 0xff1a2a, 20, 5, 0.3, 0.5);
      w.damageArea(c, tg.x, tg.z, 2.4, m(0.8, lv), { kind: 'skill', quiet: true });
    });
  },
});

reg({
  id: 'ch_wing', cls: 'choso', name: 'Wing King', type: 'active', req: 10, max: 5, color: '#9a1a2a',
  desc: lv => `Blood wings sweep the ground around you twice: ${pct(m(1.4, lv))} ATK each within 4.5 m, the second slowing everything by 40% for 3s.`,
  ce: lv => 18 + lv * 2, cd: () => 9, anim: 'spinKick', animDur: 0.6,
  cast: (w, c, lv) => {
    for (let i = 0; i < 2; i++) w.schedule(0.1 + i * 0.3, () => {
      w.sfx('slash', c.x, c.z, 0.9, 0.8);
      w.fx.slash(c.x, c.z, c.facing + i * Math.PI, 4.5, 0x9a1a2a, 6, 0, 0.6);
      w.damageArea(c, c.x, c.z, 4.5, m(1.4, lv), { kind: 'skill', slow: i ? { mult: 0.6, dur: 3 } : undefined, quiet: i === 1 });
    });
  },
});

reg({
  id: 'ch_nova', cls: 'choso', name: 'Supernova', type: 'active', req: 15, max: 5, prereq: ['ch_conv', 2], color: '#ff3a4a',
  desc: lv => `Five orbs of compressed blood around a target burst at once: ${pct(m(0.9, lv))} ATK each in a 3 m radius.`,
  ce: lv => 26 + lv * 3, cd: () => 13, anim: 'castUp', animDur: 0.6, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(8, Math.max(2, a.dist));
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.sfx('blood', x, z, 1, 0.9);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const ox = x + Math.sin(ang) * 1.6, oz = z + Math.cos(ang) * 1.6;
      w.fx.sigil(ox, oz, 0.5, 0xff1a2a, 0.5);
      w.schedule(0.45 + i * 0.05, () => {
        w.fx.burst(ox, 1, oz, 0xff2a3a, 16, 5, 0.3, 0.4);
        w.damageArea(c, ox, oz, 3, m(0.9, lv), { kind: 'skill', knock: 1.5, quiet: i > 0 });
      });
    }
    w.schedule(0.5, () => { w.sfx('explosion', x, z, 0.8, 1.2); w.fx.shake(0.35); });
  },
});

reg({
  id: 'ch_brother', cls: 'choso', name: 'Big Brother', type: 'reaction', req: 9, max: 5, color: '#ff6a7a',
  desc: lv => `When your HP falls below 30%, an older brother doesn't stop: recover ${20 + lv * 4}% HP and gain 25% damage reduction for 6s (once every 50s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 50, run: (w, c, lv) => {
    w.sfx('blood', c.x, c.z, 0.8, 0.7);
    w.fx.pillar(c.x, c.z, 1, 2.6, 0xff2a3a, 0.6);
    c.heal(c.maxHpValue() * (0.2 + lv * 0.04));
    c.addBuff('ch_brother', 6, { dmgReduce: 0.25 });
  } },
});

reg({ id: 'ch_womb', cls: 'choso', name: 'Cursed Womb Body', type: 'passive', req: 2, max: 5, color: '#c81a2a', desc: lv => `Max HP +${lv * 6}%, HP regen +${lv * 2}/s.`, passive: lv => ({ hpPct: lv * 0.06, hpRegen: lv * 2 }) });
reg({ id: 'ch_blood', cls: 'choso', name: 'Blood Mastery', type: 'passive', req: 8, max: 5, color: '#ff2a3a', desc: lv => `Skill damage +${lv * 6}%, CE regen +${lv}/s.`, passive: lv => ({ skillPow: lv * 0.06, ceRegen: lv }) });
reg({ id: 'ch_eldest', cls: 'choso', name: 'Eldest of Nine', type: 'passive', req: 14, max: 5, color: '#9a1a2a', desc: lv => `Attack +${lv * 5}%, lifesteal +${lv}%.`, passive: lv => ({ atkPct: lv * 0.05, lifesteal: lv * 0.01 }) });

reg({
  id: 'ch_ult', cls: 'choso', name: 'Flowing Red Scale: Stack', type: 'ultimate', req: 25, max: 1, color: '#ff1a2a',
  desc: () => 'Ultimate. Choso pushes Flowing Red Scale past its limit for 8 seconds: he cannot fall, and fires Piercing Blood at every enemy in range over and over, ending with a Supernova around the strongest. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'castUp', animDur: 0.8,
  cast: (w, c) => {
    c.setInvuln(8.5);
    c.addBuff('ch_ult', 8.5, { atkPct: 0.35, atkSpd: 0.3 });
    w.fx.text(c.x, 3, c.z, '赤鱗躍動・載', '#ff4a5a', 22);
    for (let i = 0; i < 12; i++) w.schedule(0.6 + i * 0.55, () => {
      for (const tg of w.targetsNear('enemy', c.x, c.z, 14).slice(0, 4)) {
        w.fx.lightning(c.x, 1.3, c.z, tg.x, 1.1, tg.z, 0xff1a2a, 0.1);
        w.damageTarget(c, tg, 0.8, { kind: 'domain', noBF: true, quiet: true, color: '#ff6a7a' });
      }
      w.sfx('blood', c.x, c.z, 0.5, 1.3);
    });
    w.schedule(7.6, () => {
      const tg = w.targetsNear('enemy', c.x, c.z, 14).sort((p, q) => q.hp - p.hp)[0];
      if (!tg) return;
      w.sfx('explosion', tg.x, tg.z, 1, 1);
      w.fx.shockwave(tg.x, tg.z, 4, 0xff1a2a);
      w.damageArea(c, tg.x, tg.z, 4, 5, { kind: 'domain', noBF: true, knock: 4 });
    });
  },
});

// ===========================================================================
// Kinji Hakari: rough energy and Idle Death Gamble
// ===========================================================================

reg({
  id: 'hk_rush', cls: 'hakari', name: 'Rough Energy Rush', type: 'active', req: 1, max: 5, color: '#7aff9a',
  desc: lv => `Dash 5 m wrapped in rough cursed energy that stings everything you pass: ${pct(m(1.8, lv))} ATK.`,
  ce: lv => 10 + lv * 2, cd: () => 4, anim: 'dash', animDur: 0.35, range: 6,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    c.dash(a.x, a.z, 5, 0.2, true);
    w.sfx('dash', c.x, c.z, 1, 1.1);
    w.schedule(0.2, () => { w.fx.burst(c.x, 1, c.z, 0x7aff9a, 14, 4, 0.25, 0.3); w.damageLine(c, x0, z0, c.x, c.z, 1.5, m(1.8, lv), { kind: 'skill', knock: 1.5, color: '#9affb0' }); });
  },
});

reg({
  id: 'hk_doors', cls: 'hakari', name: 'Pachinko Doors', type: 'active', req: 3, max: 5, color: '#4ac86a',
  desc: lv => `Shutter doors slam shut on both sides of the target: ${pct(m(2.2, lv))} ATK to everything in a 2.5 m circle, stunning for 1.2s.`,
  ce: lv => 14 + lv * 2, cd: () => 6, anim: 'clap', animDur: 0.4, range: 9,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const d = Math.min(8, Math.max(2, a.dist));
    const x = c.x + a.x * d, z = c.z + a.z * d;
    w.schedule(0.2, () => {
      w.sfx('gavel', x, z, 1, 1.3);
      w.fx.pillar(x - a.z * 1.4, z + a.x * 1.4, 0.4, 2.2, 0x4ac86a, 0.3);
      w.fx.pillar(x + a.z * 1.4, z - a.x * 1.4, 0.4, 2.2, 0x4ac86a, 0.3);
      w.damageArea(c, x, z, 2.5, m(2.2, lv), { kind: 'skill', stun: 1.2 });
    });
  },
});

reg({
  id: 'hk_ball', cls: 'hakari', name: 'Rough Energy Ball', type: 'active', req: 6, max: 5, color: '#a8ffb8',
  desc: lv => `Throw a ball of rough energy that bounces off the first enemy and bursts: ${pct(m(2.0, lv))} ATK, then ${pct(m(1.2, lv))} around it.`,
  ce: lv => 14 + lv * 2, cd: () => 6, anim: 'throw', animDur: 0.4, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('swing', c.x, c.z, 1, 1.2);
    w.projectile({ x: c.x + a.x, z: c.z + a.z, dirX: a.x, dirZ: a.z, speed: 20, range: 12, radius: 0.7, mult: m(2.0, lv), visual: 'orb', color: 0x7aff9a, team: 'player', opts: { kind: 'skill', color: '#9affb0' }, fromCaster: c,
      onHit: (x, z) => { w.sfx('explosion', x, z, 0.7, 1.4); w.fx.burst(x, 1, z, 0x7aff9a, 22, 6, 0.3, 0.4); w.damageArea(c, x, z, 2.6, m(1.2, lv), { kind: 'skill', quiet: true, knock: 2 }); } });
  },
});

reg({
  id: 'hk_combo', cls: 'hakari', name: 'Fever Combo', type: 'active', req: 10, max: 5, color: '#6aff8a',
  desc: lv => `Six blows with no rhythm at all: ${pct(m(0.6, lv))} ATK each in front, each with a 25% chance to crit for double.`,
  ce: lv => 16 + lv * 2, cd: () => 8, anim: 'punch1', animDur: 0.8,
  cast: (w, c, lv) => {
    for (let i = 0; i < 6; i++) w.schedule(0.05 + i * 0.12, () => {
      c.model?.play(i % 2 ? 'punch2' : 'kick', 0.14);
      const lucky = Math.random() < 0.25;
      w.sfx(lucky ? 'crit' : 'punch', c.x, c.z, 0.7, 0.9 + Math.random() * 0.3);
      w.damageCone(c, c.x, c.z, c.facing, 2.6, 1.4, m(0.6, lv) * (lucky ? 2 : 1), { kind: 'skill', crit: lucky, knock: i === 5 ? 3 : 0.2, quiet: !lucky && i < 5 });
    });
  },
});

reg({
  id: 'hk_jackpot', cls: 'hakari', name: 'Jackpot Strike', type: 'active', req: 15, max: 5, prereq: ['hk_combo', 2], color: '#ffd84a',
  desc: lv => `Spin the reels: one strike for ${pct(m(2.4, lv))} ATK, with a 1-in-4 chance of a jackpot that deals ×3 and refunds the CE.`,
  ce: lv => 20 + lv * 2, cd: () => 9, anim: 'uppercut', animDur: 0.45, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0.3, a.dist - 1)), 0.1);
    const win = Math.random() < 0.25;
    w.fx.text(c.x, 3, c.z, win ? '大当たり!!' : 'ハズレ', win ? '#ffd84a' : '#9a9aa4', win ? 24 : 16);
    w.schedule(0.2, () => {
      const tg = ahead(w, c, t, a.x, a.z, 2.8);
      w.sfx(win ? 'crit' : 'punch', c.x, c.z, 1, win ? 0.7 : 1);
      if (tg) w.damageTarget(c, tg, m(2.4, lv) * (win ? 3 : 1), { kind: 'skill', crit: win, knock: win ? 5 : 2, color: win ? '#ffd84a' : undefined });
      if (win) c.addBuff('hk_refund', 1, { ceRegen: 40 });
    });
  },
});

reg({
  id: 'hk_fever', cls: 'hakari', name: 'Fever Mode', type: 'buff', req: 5, max: 5, color: '#6aff8a',
  desc: lv => `Ride the fever for 10s: crit rate +${15 + lv * 3}%, crit damage +${20 + lv * 6}%, move speed +10%.`,
  ce: lv => 16 + lv * 2, cd: () => 24, anim: 'victory', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.7, 1.2);
    w.fx.ring(c.x, c.z, 0x6aff8a, 2.4, 0.4, 0.3);
    c.addBuff('hk_fever', 10, { crit: 0.15 + lv * 0.03, critDmg: 0.2 + lv * 0.06, moveSpd: 0.1 });
  },
});

reg({
  id: 'hk_luck', cls: 'hakari', name: 'Lucky Dodge', type: 'reaction', req: 9, max: 5, color: '#ffd84a',
  desc: lv => `When struck, ${15 + lv * 4}% chance it didn't really land: heal the blow back in full and slip away for 1s (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.15 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.fx.text(c.x, 2.8, c.z, 'ラッキー', '#ffd84a', 16);
    c.setInvuln(1);
    c.heal(c.maxHpValue() * (0.04 + lv * 0.01));
  } },
});

reg({ id: 'hk_gambler', cls: 'hakari', name: 'Born Gambler', type: 'passive', req: 2, max: 5, color: '#ffd84a', desc: lv => `Crit rate +${lv * 3}%.`, passive: lv => ({ crit: lv * 0.03 }) });
reg({ id: 'hk_rough', cls: 'hakari', name: 'Rough Cursed Energy', type: 'passive', req: 8, max: 5, color: '#7aff9a', desc: lv => `Attack +${lv * 5}%, crit damage +${lv * 8}%.`, passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.08 }) });
reg({ id: 'hk_thrill', cls: 'hakari', name: 'Love of the Thrill', type: 'passive', req: 14, max: 5, color: '#6aff8a', desc: lv => `Max HP +${lv * 6}%, HP regen +${lv * 2}/s.`, passive: lv => ({ hpPct: lv * 0.06, hpRegen: lv * 2 }) });

reg({
  id: 'hk_gamble', cls: 'hakari', name: 'Domain Expansion: Idle Death Gamble', type: 'ultimate', req: 25, max: 1, color: '#6aff8a',
  desc: () => 'Ultimate. A pachinko machine of a domain: the reels spin and every enemy inside is battered by rough energy. Hit the jackpot (1 in 3) and for the next 25 seconds Hakari is all but immortal: he heals every wound at once and hits much harder. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('gamble', c.x, c.z, 13, 8);
    c.setInvuln(8.5);
    for (let i = 0; i < 14; i++) w.schedule(1.2 + i * 0.45, () => {
      for (const tg of w.targetsNear('enemy', c.x, c.z, 13).slice(0, 6)) w.damageTarget(c, tg, 0.6, { kind: 'domain', noBF: true, quiet: true, color: '#9affb0' });
    });
    const jackpot = Math.random() < 1 / 3;
    w.schedule(4, () => {
      w.fx.text(c.x, 3.2, c.z, jackpot ? '大当たり!! JACKPOT' : 'リーチ…', jackpot ? '#ffd84a' : '#9affb0', jackpot ? 28 : 20);
      if (jackpot) {
        w.sfx('rare', c.x, c.z, 1, 1);
        w.fx.flash('#fff2a0', 0.5, 0.4);
        c.heal(c.maxHpValue());
        c.addBuff('hk_jackpot', 25, { hpRegen: 120, atkPct: 0.5, dmgReduce: 0.5 });
      } else {
        c.addBuff('hk_reach', 10, { atkPct: 0.25, crit: 0.2 });
      }
    });
  },
});
