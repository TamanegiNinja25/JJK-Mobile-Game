// Techniques of the unlockable sorcerers: Sukuna in Yuji's body, Sukuna in Megumi's body,
// Sukuna in his Heian-era form, and Yuji decades after Shinjuku. They are stronger than the
// first-years' kits on purpose: they are rewards for finishing the story.
import { aim, m, pct, reg } from './skills';
import { Caster, Target, WorldAPI } from '../world/api';

/** A fan of invisible cuts: Sukuna's Dismantle. */
function dismantleFan(w: WorldAPI, c: Caster, t: Target | null, dx: number, dz: number, mult: number, waves: number, range: number, delay = 0.18) {
  const a = aim(c, t, dx, dz);
  const dir = Math.atan2(a.x, a.z);
  for (let i = 0; i < waves; i++) w.schedule(delay + i * 0.08, () => {
    w.sfx('dismantle', c.x, c.z, 0.8, 0.9 + i * 0.06);
    for (let k = 0; k < 3; k++) w.fx.slash(c.x + a.x * (1.4 + k * range / 4.5), c.z + a.z * (1.4 + k * range / 4.5), dir + (Math.random() - 0.5) * 1.2, 1.4, 0xffffff, 0.7, Math.random() * 2 - 1, 1);
    w.damageCone(c, c.x, c.z, dir, range, 1.3, mult, { kind: 'skill', ignoreDef: true, noBF: true, quiet: i < waves - 1, color: '#ffffff' });
  });
}

/** Cleave: one heavy cut that scales to the target, hitting harder the bigger it is. */
function cleave(w: WorldAPI, c: Caster, t: Target | null, dx: number, dz: number, mult: number) {
  const a = aim(c, t, dx, dz);
  const tg = t && Math.hypot(t.x - c.x, t.z - c.z) < 6 ? t : w.nearestTarget('enemy', c.x + a.x * 2, c.z + a.z * 2, 4);
  w.schedule(0.2, () => {
    const x = tg ? tg.x : c.x + a.x * 2.5, z = tg ? tg.z : c.z + a.z * 2.5;
    w.sfx('dismantle', x, z, 1, 0.6);
    w.sfx('slash', x, z, 0.8, 0.7);
    for (let k = 0; k < 4; k++) w.fx.slash(x, z, Math.random() * Math.PI * 2, 1.6, k % 2 ? 0xff3a4a : 0xffffff, 1.6, Math.random() * 2 - 1, 1);
    w.fx.burst(x, 1, z, 0xff2a3a, 22, 6, 0.3);
    w.fx.shake(0.3);
    if (tg) w.damageTarget(c, tg, mult * (tg.isBoss ? 1.35 : 1), { kind: 'skill', ignoreDef: true, color: '#ff4a5a' });
    else w.damageArea(c, x, z, 1.6, mult, { kind: 'skill', ignoreDef: true });
  });
}

/** Open: a fire arrow drawn from cursed energy that bursts where it lands. */
function fuga(w: WorldAPI, c: Caster, t: Target | null, dx: number, dz: number, mult: number, radius: number, burn: number) {
  const a = aim(c, t, dx, dz);
  w.sfx('charge', c.x, c.z, 0.7, 0.8);
  w.fx.pillar(c.x, c.z, 0.7, 2.2, 0xff8a2a, 0.5);
  w.schedule(0.35, () => {
    w.sfx('fireball', c.x, c.z, 1, 0.8);
    w.projectile({
      x: c.x, z: c.z, dirX: a.x, dirZ: a.z, speed: 20, range: 14, radius: 0.7, mult: mult * 0.3, visual: 'fireball', color: 0xff7a1a, team: 'player', opts: { kind: 'skill', quiet: true }, fromCaster: c,
      onEnd: (x, z) => {
        w.sfx('explosion', x, z, 1, 0.7);
        w.sfx('fire', x, z, 0.8);
        w.fx.shockwave(x, z, radius, 0xff8a2a);
        w.fx.burst(x, 1, z, 0xffb03a, 40, 9, 0.35, 0.8);
        w.fx.embers(x, z, radius, 0xff6a1a, 18);
        w.fx.light(x, 1.5, z, 0xff7a2a, 22, 0.5, radius * 2.5);
        w.fx.shake(0.5, 0.35);
        w.damageArea(c, x, z, radius, mult, { kind: 'skill', knock: 2.5, dot: { mult: burn, dur: 4 } });
      },
    });
  });
}

function rctHeal(w: WorldAPI, c: Caster, frac: number, buffId: string, regen: number, dur: number) {
  w.sfx('heal', c.x, c.z);
  w.sfx('buff', c.x, c.z, 0.5, 0.7);
  w.fx.pillar(c.x, c.z, 1.0, 3, 0xffe8f0, 0.7);
  w.fx.burst(c.x, 1, c.z, 0xffffff, 24, 3, 0.22, 0.8);
  c.heal(c.maxHpValue() * frac);
  c.addBuff(buffId, dur, { hpRegen: regen });
}

/** The full Malevolent Shrine: everything in reach is cut over and over. */
function shrine(w: WorldAPI, c: Caster, r: number, dur: number, ticks: number, perHit: number) {
  w.sfx('domain', c.x, c.z);
  w.domain('shrine', c.x, c.z, r, dur + 0.5);
  c.setInvuln(dur + 1);
  for (let i = 0; i < ticks; i++) {
    w.schedule(1.3 + i * (dur - 1.4) / ticks, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, r);
      for (const tg of ts.slice(0, 8)) {
        w.fx.slash(tg.x, tg.z, Math.random() * Math.PI * 2, 1.3, 0xffffff, 0.6, Math.random() * 2 - 1, 1);
        w.damageTarget(c, tg, i % 5 === 4 ? perHit * 2.4 : perHit, { kind: 'domain', noBF: true, quiet: true, color: '#ff4a5a' });
      }
      if (ts.length) w.sfx('dismantle', c.x, c.z, 0.7, 0.8 + Math.random() * 0.5);
    });
  }
}

// ===========================================================================
// Ryomen Sukuna — Yuji's body (Shibuya)
// ===========================================================================

reg({
  id: 'sy_dismantle', cls: 'sukunaYuji', name: 'Dismantle', type: 'active', req: 1, max: 5, color: '#e8e8f0',
  desc: lv => `Three invisible cuts slice everything ahead for ${pct(m(0.8, lv))} ATK each, ignoring defense.`,
  ce: lv => 10 + lv * 2, cd: () => 3.5, anim: 'slash2', animDur: 0.4, range: 6,
  cast: (w, c, lv, t, dx, dz) => dismantleFan(w, c, t, dx, dz, m(0.8, lv), 3, 6),
});

reg({
  id: 'sy_cleave', cls: 'sukunaYuji', name: 'Cleave', type: 'active', req: 3, max: 5, color: '#ff3a4a',
  desc: lv => `One cut tuned to the target's toughness: ${pct(m(2.6, lv))} ATK, ignoring defense, +35% against bosses.`,
  ce: lv => 14 + lv * 2, cd: () => 6, anim: 'slash1', animDur: 0.42, range: 5,
  cast: (w, c, lv, t, dx, dz) => cleave(w, c, t, dx, dz, m(2.6, lv)),
});

reg({
  id: 'sy_flame', cls: 'sukunaYuji', name: 'Open: Flame Arrow', type: 'active', req: 6, max: 5, prereq: ['sy_dismantle', 2], color: '#ff8a2a',
  desc: lv => `Draw a bow of fire and loose an arrow that bursts for ${pct(m(2.2, lv))} ATK in a wide area and burns.`,
  ce: lv => 22 + lv * 3, cd: () => 9, anim: 'castUp', animDur: 0.6, range: 14,
  cast: (w, c, lv, t, dx, dz) => fuga(w, c, t, dx, dz, m(2.2, lv), 3.6, m(0.3, lv)),
});

reg({
  id: 'sy_web', cls: 'sukunaYuji', name: 'Dismantle: Spiderweb', type: 'active', req: 10, max: 5, prereq: ['sy_cleave', 2], color: '#d8d8e8',
  desc: lv => `Lay a hand on the ground: cuts spread through it like a web, hitting everything around you for ${pct(m(2.0, lv))} ATK and stunning for 1.2s.`,
  ce: lv => 26 + lv * 3, cd: () => 11, anim: 'slam', animDur: 0.6,
  cast: (w, c, lv) => {
    w.sfx('swingHeavy', c.x, c.z);
    w.schedule(0.32, () => {
      w.sfx('dismantle', c.x, c.z, 1, 0.7);
      w.sfx('shockwave', c.x, c.z, 0.8);
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        w.fx.slash(c.x + Math.sin(ang) * 2.4, c.z + Math.cos(ang) * 2.4, ang, 2.2, 0xffffff, 0.5, 0, 0.15);
      }
      w.fx.spikes(c.x, c.z, 4.2, 0x6a5a5a, 14);
      w.fx.shake(0.5, 0.3);
      w.damageArea(c, c.x, c.z, 4.6, m(2.0, lv), { kind: 'skill', ignoreDef: true, stun: 1.2 });
    });
  },
});

reg({
  id: 'sy_blackflash', cls: 'sukunaYuji', name: 'Black Flash', type: 'active', req: 15, max: 5, prereq: ['sy_web', 2], color: '#ff2a3a',
  desc: lv => `A guaranteed Black Flash for ${pct(m(2.2, lv))} ATK ×2.5. Sukuna lands them as easily as breathing.`,
  ce: lv => 30 + lv * 3, cd: () => 12, anim: 'uppercut', animDur: 0.55, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0, a.dist - 1.1)), 0.12);
    w.sfx('charge', c.x, c.z, 0.6);
    w.schedule(0.26, () => w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.8, 1.4, m(2.2, lv), { kind: 'skill', bf: true, knock: 4 }));
  },
});

reg({
  id: 'sy_blast', cls: 'sukunaYuji', name: 'Cursed Energy Wave', type: 'active', req: 20, max: 5, prereq: ['sy_flame', 2], color: '#ff5a6a',
  desc: lv => `A raw wave of the King's cursed energy rolls forward 13 metres, hitting everything for ${pct(m(2.8, lv))} ATK and throwing it back.`,
  ce: lv => 34 + lv * 3, cd: () => 13, anim: 'clap', animDur: 0.55, range: 13,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.5, 0.7);
    w.schedule(0.3, () => {
      const x1 = c.x + a.x * 13, z1 = c.z + a.z * 13;
      w.sfx('beam', c.x, c.z, 0.9, 0.7);
      w.sfx('roar', c.x, c.z, 0.5, 1.2);
      for (let i = 1; i <= 6; i++) w.schedule(i * 0.035, () => { const k = i / 6; w.fx.shockwave(c.x + a.x * 13 * k, c.z + a.z * 13 * k, 1.6, 0xff3a4a); });
      w.fx.lightning(c.x, 1.1, c.z, x1, 1.1, z1, 0xff2a3a, 0.35);
      w.fx.shake(0.45);
      w.damageLine(c, c.x, c.z, x1, z1, 1.8, m(2.8, lv), { kind: 'skill', knock: 4 });
    });
  },
});

reg({
  id: 'sy_rct', cls: 'sukunaYuji', name: 'Reverse Cursed Technique', type: 'buff', req: 5, max: 5, color: '#ffe8f0',
  desc: lv => `Turn cursed energy positive: heal ${14 + lv * 4}% of max HP at once, then +${lv * 5} HP/s for 6s.`,
  ce: lv => 20 + lv * 2, cd: () => 24, anim: 'victory', animDur: 0.45,
  cast: (w, c, lv) => rctHeal(w, c, 0.14 + lv * 0.04, 'sy_rct', lv * 5, 6),
});

reg({
  id: 'sy_amplify', cls: 'sukunaYuji', name: 'Domain Amplification', type: 'buff', req: 18, max: 5, color: '#ff4a5a',
  desc: lv => `Wrap yourself in your domain for 8s: attack +${18 + lv * 4}%, skill power +${10 + lv * 4}%, damage taken -${10 + lv * 2}%.`,
  ce: lv => 26 + lv * 3, cd: () => 30, anim: 'channel', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.8, 0.7);
    w.fx.ring(c.x, c.z, 0xff2a3a, 2.2, 0.5, 0.4);
    w.fx.pillar(c.x, c.z, 1.0, 3, 0xff2a3a, 0.6);
    c.addBuff('sy_amplify', 8, { atkPct: 0.18 + lv * 0.04, skillPow: 0.1 + lv * 0.04, dmgReduce: 0.1 + lv * 0.02 });
  },
});

reg({
  id: 'sy_swat', cls: 'sukunaYuji', name: 'Know Your Place', type: 'reaction', req: 9, max: 5, color: '#ffb0b8',
  desc: lv => `When struck, ${10 + lv * 4}% chance to answer with a Dismantle around you for ${pct(m(1.4, lv))} ATK (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.1 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.sfx('dismantle', c.x, c.z, 0.9, 1.1);
    for (let i = 0; i < 4; i++) w.fx.slash(c.x, c.z, Math.random() * Math.PI * 2, 2.2, 0xffffff, 1.2, Math.random() * 2 - 1);
    w.damageArea(c, c.x, c.z, 2.6, m(1.4, lv), { kind: 'skill', ignoreDef: true, knock: 2 });
  } },
});

reg({
  id: 'sy_regrow', cls: 'sukunaYuji', name: 'Regrowth', type: 'reaction', req: 24, max: 5, color: '#7aff9a',
  desc: lv => `When HP falls below 30%, regrow what was lost: recover ${24 + lv * 4}% of max HP (once every 50s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 50, run: (w, c, lv) => {
    w.fx.text(c.x, 2.6, c.z, 'REGROWTH', '#ffe8f0', 18);
    rctHeal(w, c, 0.24 + lv * 0.04, 'sy_regrow', 0, 0.1);
  } },
});

reg({ id: 'sy_king', cls: 'sukunaYuji', name: 'King of Curses', type: 'passive', req: 2, max: 5, color: '#ff3a4a', desc: lv => `Attack +${lv * 6}%, max HP +${lv * 6}%.`, passive: lv => ({ atkPct: lv * 0.06, hpPct: lv * 0.06 }) });
reg({ id: 'sy_fingers', cls: 'sukunaYuji', name: 'Twenty Fingers', type: 'passive', req: 8, max: 5, color: '#c8a888', desc: lv => `Skill power +${lv * 6}%, max CE +${lv * 6}%.`, passive: lv => ({ skillPow: lv * 0.06, cePct: lv * 0.06 }) });
reg({ id: 'sy_vessel', cls: 'sukunaYuji', name: 'A Borrowed Vessel', type: 'passive', req: 14, max: 5, color: '#ff8aa0', desc: lv => `Crit rate +${lv * 1.5}%, crit damage +${lv * 10}%.`, passive: lv => ({ crit: lv * 0.015, critDmg: lv * 0.1 }) });
reg({ id: 'sy_cruelty', cls: 'sukunaYuji', name: 'Cruelty', type: 'passive', req: 22, max: 5, color: '#8a0d18', desc: lv => `Lifesteal +${lv}%, Black Flash chance +${lv}%, cooldowns -${lv * 3}%.`, passive: lv => ({ lifesteal: lv * 0.01, bfChance: lv * 0.01, cdr: lv * 0.03 }) });

reg({
  id: 'sy_shrine', cls: 'sukunaYuji', name: 'Domain Expansion: Malevolent Shrine', type: 'ultimate', req: 25, max: 1, color: '#ff1a2a',
  desc: () => 'Ultimate. The shrine opens and every enemy within 16 metres is cut again and again for 9s. It closes with Open: Fuga, a fire arrow that burns the whole area. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    shrine(w, c, 16, 9, 34, 0.7);
    c.addBuff('sy_shrine', 10, { atkPct: 0.3 });
    w.schedule(9.2, () => {
      w.sfx('fireball', c.x, c.z, 1, 0.6);
      w.fx.pillar(c.x, c.z, 1.4, 5, 0xff8a2a, 0.7);
      w.schedule(0.4, () => {
        w.sfx('explosion', c.x, c.z, 1, 0.5);
        w.fx.shockwave(c.x, c.z, 14, 0xff7a1a);
        w.fx.burst(c.x, 1.5, c.z, 0xffb03a, 80, 14, 0.4, 1.0);
        w.fx.embers(c.x, c.z, 12, 0xff6a1a, 40);
        w.fx.flash('#ff8a2a', 0.5, 0.4);
        w.fx.shake(0.8, 0.6);
        w.damageArea(c, c.x, c.z, 14, 4.5, { kind: 'domain', noBF: true, knock: 4, dot: { mult: 0.4, dur: 5 } });
      });
    });
  },
});

// ===========================================================================
// Ryomen Sukuna — Megumi's body (Shinjuku)
// ===========================================================================

reg({
  id: 'sm_dismantle', cls: 'sukunaMegumi', name: 'Dismantle', type: 'active', req: 1, max: 5, color: '#e8e8f0',
  desc: lv => `Send a flying cut forward that passes through up to 5 enemies for ${pct(m(1.6, lv))} ATK, ignoring defense.`,
  ce: lv => 10 + lv * 2, cd: () => 3.5, anim: 'slash1', animDur: 0.4, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.schedule(0.16, () => {
      w.sfx('dismantle', c.x, c.z, 0.9, 1.1);
      w.projectile({ x: c.x, z: c.z, dirX: a.x, dirZ: a.z, speed: 26, range: 13, radius: 0.9, mult: m(1.6, lv), pierce: 5, visual: 'slash', color: 0xffffff, team: 'player', opts: { kind: 'skill', ignoreDef: true, noBF: true }, fromCaster: c });
    });
  },
});

reg({
  id: 'sm_totality', cls: 'sukunaMegumi', name: 'Divine Dog: Totality', type: 'active', req: 3, max: 5, color: '#e0e0f0',
  desc: lv => `Call Totality out of Megumi's shadow to hunt for 10s. Its maul hits an area for ${pct(m(1.3, lv))} ATK.`,
  ce: lv => 24 + lv * 3, cd: () => 18, anim: 'summon', animDur: 0.6,
  cast: (w, c, lv) => {
    const x = c.x + Math.sin(c.facing) * 2, z = c.z + Math.cos(c.facing) * 2;
    w.fx.sigil(x, z, 2.4, 0x1a1a2a, 1.2);
    w.fx.smoke(x, z, 0x101018, 22);
    w.sfx('summon', x, z);
    w.schedule(0.3, () => { w.sfx('howl', x, z); w.summon('totality', x, z, { dur: 10, power: m(1.3, lv), owner: c }); });
  },
});

reg({
  id: 'sm_nue', cls: 'sukunaMegumi', name: 'Nue', type: 'active', req: 6, max: 5, prereq: ['sm_dismantle', 2], color: '#8ae0ff',
  desc: lv => `Nue dives three times, each strike a ${pct(m(1.6, lv))} ATK lightning burst.`,
  ce: lv => 18 + lv * 2, cd: () => 8, anim: 'castUp', animDur: 0.5, range: 12,
  cast: (w, c, lv) => {
    w.sfx('summon', c.x, c.z, 0.7);
    w.schedule(0.3, () => w.sfx('screech', c.x, c.z, 0.6, 1.3));
    w.summon('nue', c.x, c.z - 1, { dur: 4.5, power: m(1.6, lv), owner: c });
  },
});

reg({
  id: 'sm_kamutoke', cls: 'sukunaMegumi', name: 'Kamutoke', type: 'active', req: 10, max: 5, prereq: ['sm_totality', 2], color: '#9ae6ff',
  desc: lv => `Raise Kamutoke and call down lightning on up to 6 enemies near the target for ${pct(m(2.0, lv))} ATK each, stunning for 0.8s.`,
  ce: lv => 28 + lv * 3, cd: () => 11, anim: 'pointUp', animDur: 0.55, range: 13,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const cx = t ? t.x : c.x + a.x * 6, cz = t ? t.z : c.z + a.z * 6;
    w.sfx('charge', c.x, c.z, 0.6, 1.3);
    w.fx.lightning(c.x, 1.8, c.z, c.x, 9, c.z, 0x9ae6ff, 0.12);
    w.schedule(0.35, () => {
      const ts = w.targetsNear('enemy', cx, cz, 7).slice(0, 6);
      if (!ts.length) { w.fx.lightning(cx, 12, cz, cx, 0, cz, 0x9ae6ff, 0.3); w.damageArea(c, cx, cz, 2, m(2.0, lv), { kind: 'skill', stun: 0.8 }); }
      ts.forEach((tg, i) => w.schedule(i * 0.06, () => {
        w.fx.lightning(tg.x + 1, 12, tg.z - 1, tg.x, 0, tg.z, 0x9ae6ff, 0.3);
        w.fx.lightning(tg.x, 12, tg.z, tg.x, 0, tg.z, 0xffffff, 0.1);
        w.fx.ring(tg.x, tg.z, 0x9ae6ff, 1.8, 0.3);
        w.sfx('thunder', tg.x, tg.z, 0.7, 1 + i * 0.05);
        w.damageTarget(c, tg, m(2.0, lv), { kind: 'skill', stun: 0.8, color: '#9ae6ff' });
      }));
      w.fx.flash('#cfefff', 0.25, 0.15);
      w.fx.shake(0.4);
    });
  },
});

reg({
  id: 'sm_cleave', cls: 'sukunaMegumi', name: 'Cleave', type: 'active', req: 15, max: 5, prereq: ['sm_nue', 2], color: '#ff3a4a',
  desc: lv => `One cut tuned to the target's toughness: ${pct(m(3.0, lv))} ATK, ignoring defense, +35% against bosses.`,
  ce: lv => 24 + lv * 3, cd: () => 8, anim: 'slash2', animDur: 0.42, range: 5,
  cast: (w, c, lv, t, dx, dz) => cleave(w, c, t, dx, dz, m(3.0, lv)),
});

reg({
  id: 'sm_agito', cls: 'sukunaMegumi', name: 'Agito', type: 'active', req: 20, max: 5, prereq: ['sm_kamutoke', 2], color: '#b0ffd0',
  desc: lv => `Fuse shikigami into Agito: a beast that fights for 12s while Round Deer's power heals you ${lv * 5} HP/s.`,
  ce: lv => 40 + lv * 3, cd: () => 28, anim: 'summon', animDur: 0.7,
  cast: (w, c, lv) => {
    const x = c.x + Math.sin(c.facing) * 2.2, z = c.z + Math.cos(c.facing) * 2.2;
    w.fx.sigil(x, z, 2.6, 0x1a2a22, 1.4);
    w.fx.smoke(x, z, 0x101018, 28);
    w.sfx('summon', x, z, 1, 0.8);
    w.schedule(0.35, () => { w.sfx('roar', x, z, 0.8, 0.9); w.summon('totality', x, z, { dur: 12, power: m(1.8, lv), owner: c }); });
    w.fx.ring(c.x, c.z, 0xb0ffd0, 1.6, 0.6, 0.3);
    c.addBuff('sm_agito', 12, { hpRegen: lv * 5 });
  },
});

reg({
  id: 'sm_fuga', cls: 'sukunaMegumi', name: 'Open: Fuga', type: 'active', req: 32, max: 5, prereq: ['sm_cleave', 2], color: '#ff8a2a',
  desc: lv => `The fire arrow that ended the duel in Shinjuku: bursts for ${pct(m(3.4, lv))} ATK in a wide area and burns.`,
  ce: lv => 44 + lv * 3, cd: () => 16, anim: 'castUp', animDur: 0.6, range: 14,
  cast: (w, c, lv, t, dx, dz) => fuga(w, c, t, dx, dz, m(3.4, lv), 4.4, m(0.4, lv)),
});

reg({
  id: 'sm_shroud', cls: 'sukunaMegumi', name: 'Ten Shadows Shroud', type: 'buff', req: 5, max: 5, color: '#4a4a8a',
  desc: lv => `Wrap yourself in shadow for 8s: evasion +${8 + lv * 3}%, move speed +${10 + lv * 2}%, attack +${8 + lv * 3}%.`,
  ce: lv => 16 + lv * 2, cd: () => 22, anim: 'channel', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('shadow', c.x, c.z);
    w.fx.smoke(c.x, c.z, 0x15151f, 20);
    w.fx.ring(c.x, c.z, 0x4a4a8a, 1.8, 0.5, 0.35);
    c.addBuff('sm_shroud', 8, { evasion: 0.08 + lv * 0.03, moveSpd: 0.1 + lv * 0.02, atkPct: 0.08 + lv * 0.03 });
  },
});

reg({
  id: 'sm_rct', cls: 'sukunaMegumi', name: 'Reverse Cursed Technique', type: 'buff', req: 18, max: 5, color: '#ffe8f0',
  desc: lv => `Heal ${16 + lv * 4}% of max HP at once, then +${lv * 6} HP/s for 6s.`,
  ce: lv => 24 + lv * 2, cd: () => 26, anim: 'victory', animDur: 0.45,
  cast: (w, c, lv) => rctHeal(w, c, 0.16 + lv * 0.04, 'sm_rct', lv * 6, 6),
});

reg({
  id: 'sm_swap', cls: 'sukunaMegumi', name: 'Shadow Swap', type: 'reaction', req: 9, max: 5, color: '#6a6acc',
  desc: lv => `When struck, ${10 + lv * 4}% chance to sink into the shadows (0.8s untouchable) and cut back for ${pct(m(1.3, lv))} ATK (every 4s at most).`,
  react: { on: 'hit', chance: lv => 0.1 + lv * 0.04, icd: 4, run: (w, c, lv) => {
    c.setInvuln(0.8);
    w.sfx('shadow', c.x, c.z);
    w.fx.smoke(c.x, c.z, 0x15151f, 14);
    w.schedule(0.25, () => {
      w.sfx('dismantle', c.x, c.z, 0.8, 1.2);
      w.fx.slash(c.x, c.z, c.facing, 2.4, 0xc8c8ff, Math.PI * 2, 0);
      w.damageArea(c, c.x, c.z, 2.6, m(1.3, lv), { kind: 'skill', ignoreDef: true });
    });
  } },
});

reg({ id: 'sm_vessel', cls: 'sukunaMegumi', name: 'Ten Shadows Vessel', type: 'passive', req: 2, max: 5, color: '#8a8aff', desc: lv => `Shikigami damage +${lv * 10}%, max CE +${lv * 6}%.`, passive: lv => ({ summonPow: lv * 0.1, cePct: lv * 0.06 }) });
reg({ id: 'sm_king', cls: 'sukunaMegumi', name: 'King of Curses', type: 'passive', req: 8, max: 5, color: '#ff3a4a', desc: lv => `Attack +${lv * 5}%, skill power +${lv * 5}%.`, passive: lv => ({ atkPct: lv * 0.05, skillPow: lv * 0.05 }) });
reg({ id: 'sm_adapt', cls: 'sukunaMegumi', name: 'Adaptation', type: 'passive', req: 14, max: 5, color: '#ffd04a', desc: lv => `The wheel turns: damage taken -${lv * 3}%, HP regen +${lv * 2}/s.`, passive: lv => ({ dmgReduce: lv * 0.03, hpRegen: lv * 2 }) });
reg({ id: 'sm_talent', cls: 'sukunaMegumi', name: 'Stolen Talent', type: 'passive', req: 22, max: 5, color: '#c83a7a', desc: lv => `Cooldowns -${lv * 3}%, crit rate +${lv * 1.5}%, max HP +${lv * 5}%.`, passive: lv => ({ cdr: lv * 0.03, crit: lv * 0.015, hpPct: lv * 0.05 }) });

reg({
  id: 'sm_worldCut', cls: 'sukunaMegumi', name: 'World-Cutting Slash', type: 'ultimate', req: 25, max: 1, color: '#ffffff',
  desc: () => 'Ultimate. Summon Mahoraga to fight beside you. As its wheel turns, you learn to cut space itself: after 3 seconds, a slash splits the whole line in front of you, hitting everything for massive damage that ignores defense. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'summon', animDur: 1.0,
  cast: (w, c) => {
    const x = c.x - Math.sin(c.facing) * 2.4, z = c.z - Math.cos(c.facing) * 2.4;
    w.fx.sigil(x, z, 3, 0x1a1a1a, 1.6);
    w.fx.smoke(x, z, 0x101018, 30);
    w.sfx('summon', x, z, 1, 0.6);
    w.schedule(0.4, () => { w.sfx('roar', x, z, 1, 0.7); w.summon('mahoraga', x, z, { dur: 14, power: 2.4, owner: c }); });
    c.setInvuln(4);
    for (let i = 1; i <= 3; i++) w.schedule(i * 0.9, () => { w.sfx('bell', c.x, c.z, 0.8, 0.8 + i * 0.1); w.fx.text(c.x, 3, c.z, 'The wheel turns', '#ffd04a', 16); w.fx.ring(c.x, c.z, 0xffd04a, 2 + i, 0.4, 0.3); });
    w.schedule(3.2, () => {
      const t = w.nearestTarget('enemy', c.x, c.z, 18);
      const dir = t ? Math.atan2(t.x - c.x, t.z - c.z) : c.facing;
      const ax = Math.sin(dir), az = Math.cos(dir);
      const x0 = c.x - ax * 4, z0 = c.z - az * 4, x1 = c.x + ax * 28, z1 = c.z + az * 28;
      w.sfx('dismantle', c.x, c.z, 1, 0.4);
      w.sfx('shatter', c.x, c.z, 1, 0.6);
      w.fx.flash('#ffffff', 0.7, 0.35);
      w.fx.lightning(x0, 1.2, z0, x1, 1.2, z1, 0xffffff, 0.5);
      w.fx.lightning(x0, 1.2, z0, x1, 1.2, z1, 0x101010, 0.12);
      for (let i = 0; i < 10; i++) w.fx.slash(c.x + ax * (i * 2.8), c.z + az * (i * 2.8), dir, 2, 0xffffff, 0.5, 0, 1);
      w.fx.hitstop(0.12);
      w.fx.shake(1, 0.6);
      w.damageLine(c, x0, z0, x1, z1, 2.6, 9, { kind: 'domain', ignoreDef: true, noBF: true, color: '#ffffff' });
    });
  },
});

// ===========================================================================
// Ryomen Sukuna — Heian-era true form
// ===========================================================================

reg({
  id: 'hs_barrage', cls: 'heianSukuna', name: 'Four-Armed Barrage', type: 'active', req: 1, max: 5, color: '#ff8a5a',
  desc: lv => `All four arms at once: eight blows in front of you for ${pct(m(0.5, lv))} ATK each.`,
  ce: lv => 12 + lv * 2, cd: () => 4, anim: 'channel', animDur: 0.7, range: 3,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    for (let i = 0; i < 8; i++) w.schedule(i * 0.075, () => {
      c.model?.play(i % 2 ? 'punch2' : 'punch1', 0.1);
      w.fx.slash(c.x + a.x * 0.9, c.z + a.z * 0.9, dir + (Math.random() - 0.5), 1.0, 0xffc0a0, 1.2, Math.random() * 2 - 1);
      w.sfx('punch', c.x, c.z, 0.55, 0.9 + Math.random() * 0.3);
      w.damageCone(c, c.x, c.z, dir, 2.6, 1.6, m(0.5, lv), { kind: 'skill', quiet: i % 2 === 1 });
    });
  },
});

reg({
  id: 'hs_dismantle', cls: 'heianSukuna', name: 'Dismantle', type: 'active', req: 3, max: 5, color: '#e8e8f0',
  desc: lv => `Five invisible cuts slice everything up to 8 metres ahead for ${pct(m(0.75, lv))} ATK each, ignoring defense.`,
  ce: lv => 14 + lv * 2, cd: () => 5, anim: 'slash2', animDur: 0.45, range: 8,
  cast: (w, c, lv, t, dx, dz) => dismantleFan(w, c, t, dx, dz, m(0.75, lv), 5, 8),
});

reg({
  id: 'hs_cleave', cls: 'heianSukuna', name: 'Cleave', type: 'active', req: 6, max: 5, prereq: ['hs_barrage', 2], color: '#ff3a4a',
  desc: lv => `One cut tuned to the target's toughness: ${pct(m(3.2, lv))} ATK, ignoring defense, +35% against bosses.`,
  ce: lv => 20 + lv * 3, cd: () => 7, anim: 'slash1', animDur: 0.42, range: 5,
  cast: (w, c, lv, t, dx, dz) => cleave(w, c, t, dx, dz, m(3.2, lv)),
});

reg({
  id: 'hs_fuga', cls: 'heianSukuna', name: 'Divine Flame: Open', type: 'active', req: 10, max: 5, prereq: ['hs_dismantle', 2], color: '#ff8a2a',
  desc: lv => `Draw the Divine Flame into an arrow: it bursts for ${pct(m(3.0, lv))} ATK across a wide area and leaves everything burning.`,
  ce: lv => 30 + lv * 3, cd: () => 10, anim: 'castUp', animDur: 0.6, range: 14,
  cast: (w, c, lv, t, dx, dz) => fuga(w, c, t, dx, dz, m(3.0, lv), 4.6, m(0.45, lv)),
});

reg({
  id: 'hs_stomp', cls: 'heianSukuna', name: 'Calamity Stomp', type: 'active', req: 15, max: 5, prereq: ['hs_cleave', 2], color: '#ffb05a',
  desc: lv => `Leap and land with the weight of a calamity: ${pct(m(2.8, lv))} ATK in a huge radius and a 1.5s stun.`,
  ce: lv => 30 + lv * 3, cd: () => 12, anim: 'slam', animDur: 0.62, range: 5,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(4, Math.max(0, a.dist - 0.5)), 0.32, true);
    w.sfx('swingHeavy', c.x, c.z);
    w.schedule(0.34, () => {
      w.sfx('shockwave', c.x, c.z);
      w.sfx('meteor', c.x, c.z, 0.7);
      w.fx.shockwave(c.x, c.z, 5.6, 0xff9a4a);
      w.fx.spikes(c.x, c.z, 4.5, 0x6a4a3a, 18);
      w.fx.smoke(c.x, c.z, 0x9a8070, 20);
      w.fx.shake(0.7, 0.4);
      w.fx.hitstop(0.08);
      w.damageArea(c, c.x, c.z, 5.6, m(2.8, lv), { kind: 'skill', stun: 1.5, knock: 3 });
    });
  },
});

reg({
  id: 'hs_worldCut', cls: 'heianSukuna', name: 'World-Cutting Slash', type: 'active', req: 20, max: 5, prereq: ['hs_fuga', 2], color: '#ffffff',
  desc: lv => `Cut space itself along a 22-metre line: ${pct(m(4.5, lv))} ATK to everything on it, ignoring defense.`,
  ce: lv => 50 + lv * 4, cd: () => 20, anim: 'slash2', animDur: 0.6, range: 22,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.6, 0.6);
    w.schedule(0.4, () => {
      const x1 = c.x + a.x * 22, z1 = c.z + a.z * 22;
      w.sfx('dismantle', c.x, c.z, 1, 0.45);
      w.sfx('shatter', c.x, c.z, 0.8, 0.7);
      w.fx.lightning(c.x, 1.2, c.z, x1, 1.2, z1, 0xffffff, 0.4);
      w.fx.lightning(c.x, 1.2, c.z, x1, 1.2, z1, 0x111111, 0.1);
      w.fx.flash('#ffffff', 0.4, 0.2);
      w.fx.shake(0.6);
      w.damageLine(c, c.x, c.z, x1, z1, 1.8, m(4.5, lv), { kind: 'skill', ignoreDef: true, noBF: true, color: '#ffffff' });
    });
  },
});

reg({
  id: 'hs_blackflash', cls: 'heianSukuna', name: 'Black Flash', type: 'active', req: 26, max: 5, prereq: ['hs_stomp', 2], color: '#ff2a3a',
  desc: lv => `Two guaranteed Black Flashes from two fists at once, ${pct(m(1.8, lv))} ATK ×2.5 each.`,
  ce: lv => 40 + lv * 3, cd: () => 14, anim: 'uppercut', animDur: 0.6, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0, a.dist - 1.1)), 0.12);
    w.sfx('charge', c.x, c.z, 0.6);
    for (const d of [0.24, 0.4]) w.schedule(d, () => w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.8, 1.5, m(1.8, lv), { kind: 'skill', bf: true, knock: 3 }));
  },
});

reg({
  id: 'hs_incant', cls: 'heianSukuna', name: 'Belly-Mouth Incantation', type: 'buff', req: 5, max: 5, color: '#c84a3a',
  desc: lv => `The mouth on your belly chants while you fight. For 8s: skill power +${20 + lv * 5}%, cooldowns -${8 + lv * 2}%.`,
  ce: lv => 18 + lv * 2, cd: () => 24, anim: 'channel', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('curse', c.x, c.z, 0.8, 0.6);
    w.fx.sigil(c.x, c.z, 1.6, 0xc84a3a, 0.8);
    w.fx.ring(c.x, c.z, 0xff6a3a, 2, 0.5, 0.3);
    c.addBuff('hs_incant', 8, { skillPow: 0.2 + lv * 0.05, cdr: 0.08 + lv * 0.02 });
  },
});

reg({
  id: 'hs_rct', cls: 'heianSukuna', name: 'Reverse Cursed Technique', type: 'buff', req: 18, max: 5, color: '#ffe8f0',
  desc: lv => `Heal ${20 + lv * 4}% of max HP at once, then +${lv * 8} HP/s for 6s.`,
  ce: lv => 26 + lv * 2, cd: () => 26, anim: 'victory', animDur: 0.45,
  cast: (w, c, lv) => rctHeal(w, c, 0.2 + lv * 0.04, 'hs_rct', lv * 8, 6),
});

reg({
  id: 'hs_simple', cls: 'heianSukuna', name: 'Hollow Wicker Basket', type: 'reaction', req: 9, max: 5, color: '#d8c8a0',
  desc: lv => `When struck, ${10 + lv * 4}% chance to weave a barrier: 1s untouchable and a ring of cuts for ${pct(m(1.5, lv))} ATK (every 4s at most).`,
  react: { on: 'hit', chance: lv => 0.1 + lv * 0.04, icd: 4, run: (w, c, lv) => {
    c.setInvuln(1);
    w.sfx('barrier', c.x, c.z, 0.8);
    w.fx.ring(c.x, c.z, 0xd8c8a0, 2.4, 0.5, 0.3);
    w.fx.slash(c.x, c.z, c.facing, 2.6, 0xffffff, Math.PI * 2, 0);
    w.damageArea(c, c.x, c.z, 2.8, m(1.5, lv), { kind: 'skill', ignoreDef: true, knock: 2 });
  } },
});

reg({ id: 'hs_calamity', cls: 'heianSukuna', name: 'Calamity of the Heian Era', type: 'passive', req: 2, max: 5, color: '#ff6a2a', desc: lv => `Max HP +${lv * 7}%, attack +${lv * 6}%.`, passive: lv => ({ hpPct: lv * 0.07, atkPct: lv * 0.06 }) });
reg({ id: 'hs_arms', cls: 'heianSukuna', name: 'Four Arms', type: 'passive', req: 8, max: 5, color: '#ffb08a', desc: lv => `Attack speed +${lv * 3}%, crit rate +${lv * 1.5}%.`, passive: lv => ({ atkSpd: lv * 0.03, crit: lv * 0.015 }) });
reg({ id: 'hs_faces', cls: 'heianSukuna', name: 'Two Faces', type: 'passive', req: 14, max: 5, color: '#ff8a8a', desc: lv => `Two pairs of eyes miss nothing: evasion +${lv * 2}%, cooldowns -${lv * 3}%.`, passive: lv => ({ evasion: lv * 0.02, cdr: lv * 0.03 }) });
reg({ id: 'hs_millennium', cls: 'heianSukuna', name: 'A Thousand Years', type: 'passive', req: 22, max: 5, color: '#8a0d18', desc: lv => `Crit damage +${lv * 12}%, lifesteal +${lv}%, damage taken -${lv * 3}%.`, passive: lv => ({ critDmg: lv * 0.12, lifesteal: lv * 0.01, dmgReduce: lv * 0.03 }) });

reg({
  id: 'hs_shrine', cls: 'heianSukuna', name: 'Malevolent Shrine: True Form', type: 'ultimate', req: 25, max: 1, color: '#ff1a2a',
  desc: () => 'Ultimate. The shrine at its full size: 18 metres of endless cuts for 10s, ending in a Divine Flame blast over the whole domain. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    shrine(w, c, 18, 10, 42, 0.8);
    c.addBuff('hs_shrine', 11, { atkPct: 0.35, critDmg: 0.3 });
    w.schedule(10.1, () => {
      w.sfx('fireball', c.x, c.z, 1, 0.5);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        w.schedule(0.1 + i * 0.06, () => {
          const x = c.x + Math.sin(ang) * 7, z = c.z + Math.cos(ang) * 7;
          w.fx.shockwave(x, z, 5, 0xff7a1a);
          w.fx.burst(x, 1.2, z, 0xffb03a, 30, 8, 0.35, 0.7);
          w.sfx('explosion', x, z, 0.7, 0.6);
        });
      }
      w.schedule(0.5, () => {
        w.fx.flash('#ff8a2a', 0.55, 0.4);
        w.fx.embers(c.x, c.z, 14, 0xff6a1a, 50);
        w.fx.shake(0.9, 0.7);
        w.damageArea(c, c.x, c.z, 16, 5.5, { kind: 'domain', noBF: true, knock: 4, dot: { mult: 0.5, dur: 5 } });
      });
    });
  },
});

// ===========================================================================
// Yuji Itadori — decades later (Modulo)
// ===========================================================================

reg({
  id: 'my_divergent', cls: 'moduloYuji', name: 'Divergent Fist', type: 'active', req: 1, max: 5, color: '#6ab8ff',
  desc: lv => `Dash and strike for ${pct(m(1.8, lv))} ATK; the cursed energy lands a beat later for ${pct(m(1.4, lv))} in an area.`,
  ce: lv => 10 + lv * 2, cd: () => 3.5, anim: 'punch1', animDur: 0.45, range: 5,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.8, Math.max(0.5, a.dist - 1.2)), 0.14);
    w.schedule(0.2, () => {
      w.sfx('divergent', c.x, c.z);
      w.fx.slash(c.x, c.z, Math.atan2(a.x, a.z), 1.6, 0xbfe4ff, 1.4);
      w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.5, 1.7, m(1.8, lv), { kind: 'skill', knock: 0.8 });
    });
    w.schedule(0.38, () => {
      const px = c.x + a.x * 1.4, pz = c.z + a.z * 1.4;
      w.fx.shockwave(px, pz, 2.4, 0x6ab8ff);
      w.fx.burst(px, 1, pz, 0x8ad0ff, 26, 6, 0.35);
      w.fx.shake(0.25);
      w.damageArea(c, px, pz, 2.3, m(1.4, lv), { kind: 'skill', knock: 2 });
    });
  },
});

reg({
  id: 'my_piercing', cls: 'moduloYuji', name: 'Piercing Blood', type: 'active', req: 3, max: 5, color: '#ff2a4a',
  desc: lv => `Choso's technique: a compressed blood beam that pierces everything in a line for ${pct(m(2.4, lv))} ATK.`,
  ce: lv => 16 + lv * 2, cd: () => 6, anim: 'clap', animDur: 0.55, range: 14,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.5, 1.5);
    w.schedule(0.28, () => {
      const x1 = c.x + a.x * 14, z1 = c.z + a.z * 14;
      w.sfx('blood', c.x, c.z);
      w.sfx('beam', c.x, c.z, 0.7, 1.4);
      w.fx.lightning(c.x + a.x * 0.6, 1.2, c.z + a.z * 0.6, x1, 1.2, z1, 0xff1a3a, 0.22);
      w.fx.lightning(c.x + a.x * 0.6, 1.2, c.z + a.z * 0.6, x1, 1.2, z1, 0xffc0c8, 0.07);
      w.fx.shake(0.3);
      w.damageLine(c, c.x, c.z, x1, z1, 1.1, m(2.4, lv), { kind: 'skill', knock: 1.5 });
    });
  },
});

reg({
  id: 'my_supernova', cls: 'moduloYuji', name: 'Supernova', type: 'active', req: 6, max: 5, prereq: ['my_piercing', 2], color: '#ff4a6a',
  desc: lv => `Eight blood orbs orbit you and burst outward, each exploding for ${pct(m(1.1, lv))} ATK.`,
  ce: lv => 24 + lv * 3, cd: () => 10, anim: 'castUp', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('blood', c.x, c.z, 0.7, 0.8);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      w.schedule(0.12 + i * 0.09, () => {
        const ox = c.x + Math.sin(ang) * 1.3, oz = c.z + Math.cos(ang) * 1.3;
        w.projectile({ x: ox, z: oz, dirX: Math.sin(ang), dirZ: Math.cos(ang), speed: 14, range: 6, radius: 0.6, mult: m(0.5, lv), visual: 'red', color: 0xff2a4a, team: 'player', opts: { kind: 'skill', quiet: true }, fromCaster: c,
          onEnd: (x, z) => {
            w.sfx('explosion', x, z, 0.45, 1.3);
            w.fx.burst(x, 0.8, z, 0xff2a4a, 18, 5, 0.3);
            w.damageArea(c, x, z, 1.9, m(1.1, lv), { kind: 'skill', knock: 1.5 });
          } });
      });
    }
  },
});

reg({
  id: 'my_dismantle', cls: 'moduloYuji', name: 'Dismantle', type: 'active', req: 10, max: 5, prereq: ['my_divergent', 2], color: '#e8e8f0',
  desc: lv => `The technique Sukuna left in your soul: four cuts ahead for ${pct(m(0.9, lv))} ATK each, ignoring defense.`,
  ce: lv => 22 + lv * 3, cd: () => 7, anim: 'slash2', animDur: 0.45, range: 7,
  cast: (w, c, lv, t, dx, dz) => dismantleFan(w, c, t, dx, dz, m(0.9, lv), 4, 7),
});

reg({
  id: 'my_soul', cls: 'moduloYuji', name: 'Soul Strike', type: 'active', req: 15, max: 5, prereq: ['my_supernova', 2], color: '#9ad0ff',
  desc: lv => `A blow aimed at the soul, not the body: ${pct(m(3.2, lv))} ATK ignoring defense, +50% against bosses.`,
  ce: lv => 28 + lv * 3, cd: () => 9, anim: 'punch2', animDur: 0.45, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.2, Math.max(0, a.dist - 1.1)), 0.12);
    w.schedule(0.24, () => {
      const tg = w.nearestTarget('enemy', c.x + a.x * 1.4, c.z + a.z * 1.4, 2.6);
      w.sfx('punch', c.x, c.z, 1, 0.7);
      w.sfx('shatter', c.x, c.z, 0.6, 1.3);
      const x = tg ? tg.x : c.x + a.x * 1.6, z = tg ? tg.z : c.z + a.z * 1.6;
      w.fx.ring(x, z, 0x9ad0ff, 2, 0.35, 0.3);
      w.fx.burst(x, 1.2, z, 0xcfe8ff, 26, 6, 0.3, 0.6);
      w.fx.shake(0.35);
      if (tg) w.damageTarget(c, tg, m(3.2, lv) * (tg.isBoss ? 1.5 : 1), { kind: 'skill', ignoreDef: true, color: '#9ad0ff' });
    });
  },
});

reg({
  id: 'my_zone', cls: 'moduloYuji', name: 'Black Flash: The Zone', type: 'active', req: 20, max: 5, prereq: ['my_soul', 2], color: '#ff2a3a',
  desc: lv => `A guaranteed Black Flash for ${pct(m(2.6, lv))} ATK ×2.5, then 8s in the zone: Black Flash chance +${8 + lv * 2}%.`,
  ce: lv => 34 + lv * 3, cd: () => 14, anim: 'uppercut', animDur: 0.55, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0, a.dist - 1.1)), 0.12);
    w.sfx('charge', c.x, c.z, 0.6);
    w.schedule(0.26, () => w.damageCone(c, c.x, c.z, Math.atan2(a.x, a.z), 2.8, 1.4, m(2.6, lv), { kind: 'skill', bf: true, knock: 4 }));
    c.addBuff('my_zone', 8.3, { bfChance: 0.08 + lv * 0.02 });
  },
});

reg({
  id: 'my_redScale', cls: 'moduloYuji', name: 'Flowing Red Scale', type: 'buff', req: 5, max: 5, color: '#ff4a5a',
  desc: lv => `Push your blood faster for 9s: attack +${14 + lv * 4}%, attack speed +${10 + lv * 2}%, move speed +${6 + lv * 2}%.`,
  ce: lv => 16 + lv * 2, cd: () => 22, anim: 'channel', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('blood', c.x, c.z, 0.7, 1.2);
    w.sfx('buff', c.x, c.z, 0.6);
    w.fx.pillar(c.x, c.z, 0.9, 2.6, 0xff2a4a, 0.5);
    w.fx.burst(c.x, 1, c.z, 0xff6a7a, 20, 4, 0.25, 0.6);
    c.addBuff('my_redScale', 9, { atkPct: 0.14 + lv * 0.04, atkSpd: 0.1 + lv * 0.02, moveSpd: 0.06 + lv * 0.02 });
  },
});

reg({
  id: 'my_winters', cls: 'moduloYuji', name: 'Sixty-Eight Winters', type: 'buff', req: 18, max: 5, color: '#ffe08a',
  desc: lv => `Everything you have survived, at once. For 7s: damage taken -${24 + lv * 4}%, and heal ${10 + lv * 3}% of max HP.`,
  ce: lv => 22 + lv * 2, cd: () => 30, anim: 'victory', animDur: 0.5,
  cast: (w, c, lv) => {
    w.sfx('heal', c.x, c.z);
    w.fx.shockwave(c.x, c.z, 2.6, 0xffe08a);
    w.fx.burst(c.x, 1, c.z, 0xfff0b0, 22, 3, 0.25, 0.7);
    c.heal(c.maxHpValue() * (0.1 + lv * 0.03));
    c.addBuff('my_winters', 7, { dmgReduce: 0.24 + lv * 0.04 });
  },
});

reg({
  id: 'my_counter', cls: 'moduloYuji', name: 'Veteran\'s Counter', type: 'reaction', req: 9, max: 5, color: '#ffc04a',
  desc: lv => `When struck, ${12 + lv * 4}% chance to answer instantly with a ${pct(m(1.6, lv))} ATK blow around you (every 2.5s at most).`,
  react: { on: 'hit', chance: lv => 0.12 + lv * 0.04, icd: 2.5, run: (w, c, lv) => {
    c.model?.play('punch3', 0.3);
    w.sfx('kick', c.x, c.z, 0.9, 1.2);
    w.fx.ring(c.x, c.z, 0xffd06a, 2.4, 0.25, 0.35);
    w.damageArea(c, c.x, c.z, 2.4, m(1.6, lv), { kind: 'skill', knock: 2.5 });
  } },
});

reg({
  id: 'my_secondWind', cls: 'moduloYuji', name: 'Still Standing', type: 'reaction', req: 24, max: 5, color: '#7aff9a',
  desc: lv => `When HP falls below 30%, recover ${24 + lv * 4}% of max HP (once every 50s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 50, run: (w, c, lv) => {
    w.sfx('heal', c.x, c.z, 0.8, 0.8);
    w.fx.pillar(c.x, c.z, 1.1, 3, 0x7aff9a, 0.7);
    w.fx.text(c.x, 2.6, c.z, 'STILL STANDING', '#7aff9a', 18);
    c.heal(c.maxHpValue() * (0.24 + lv * 0.04));
  } },
});

reg({ id: 'my_body', cls: 'moduloYuji', name: 'Vessel\'s Body', type: 'passive', req: 2, max: 5, color: '#ffd06a', desc: lv => `Max HP +${lv * 8}%, defense +${lv * 5}%.`, passive: lv => ({ hpPct: lv * 0.08, defPct: lv * 0.05 }) });
reg({ id: 'my_mastery', cls: 'moduloYuji', name: 'Black Flash Mastery', type: 'passive', req: 8, max: 5, color: '#ff3a4a', desc: lv => `Black Flash chance +${(lv * 1.6).toFixed(1)}%, crit damage +${lv * 10}%.`, passive: lv => ({ bfChance: lv * 0.016, critDmg: lv * 0.1 }) });
reg({ id: 'my_blood', cls: 'moduloYuji', name: 'Blood Manipulation', type: 'passive', req: 14, max: 5, color: '#c8102a', desc: lv => `Lifesteal +${lv}%, skill power +${lv * 5}%.`, passive: lv => ({ lifesteal: lv * 0.01, skillPow: lv * 0.05 }) });
reg({ id: 'my_unbreakable', cls: 'moduloYuji', name: 'Unbreakable', type: 'passive', req: 22, max: 5, color: '#9adfff', desc: lv => `Damage taken -${lv * 3}%, HP regen +${lv * 2}/s, attack +${lv * 4}%.`, passive: lv => ({ dmgReduce: lv * 0.03, hpRegen: lv * 2, atkPct: lv * 0.04 }) });

reg({
  id: 'my_domain', cls: 'moduloYuji', name: 'Domain Expansion', type: 'ultimate', req: 25, max: 1, color: '#ffa06a',
  desc: () => 'Ultimate. Yuji\'s own domain: the quiet streets of home at dusk. For 9s every enemy within 14 metres is struck at the soul again and again, ignoring defense, while you heal and hit 40% harder. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('home', c.x, c.z, 14, 9.5);
    c.setInvuln(9.5);
    c.addBuff('my_domain', 10, { atkPct: 0.4, hpRegen: 40, bfChance: 0.1 });
    for (let i = 0; i < 26; i++) {
      w.schedule(1.3 + i * 0.3, () => {
        const ts = w.targetsNear('enemy', c.x, c.z, 14);
        for (const tg of ts.slice(0, 6)) {
          w.fx.ring(tg.x, tg.z, 0xffc08a, 1.2, 0.25, 0.2);
          w.damageTarget(c, tg, i % 4 === 3 ? 1.8 : 0.75, { kind: 'domain', ignoreDef: true, noBF: true, quiet: true, color: '#ffc08a' });
        }
        if (ts.length) w.sfx('punch', c.x, c.z, 0.6, 0.8 + Math.random() * 0.4);
      });
    }
  },
});
