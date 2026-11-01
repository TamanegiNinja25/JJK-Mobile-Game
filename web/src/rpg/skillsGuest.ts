// Techniques of the two guest sorcerers: Yuta Okkotsu, a special grade who fights with a katana, Rika and
// whatever he has copied; and Toji Fushiguro, who has no cursed energy at all and wins with a body made
// perfect by Heavenly Restriction and a storehouse of cursed tools. Toji's skills cost stamina, which is
// what his "CE" bar holds.
import { aim, m, pct, reg } from './skills';
import { Caster, Target, WorldAPI } from '../world/api';

// ===========================================================================
// Yuta Okkotsu
// ===========================================================================

/** Rika's manifestation: a cloud of white cursed energy, then the Queen of Curses herself. */
function rikaRise(w: WorldAPI, c: Caster, x: number, z: number) {
  w.sfx('summon', x, z, 1, 0.8);
  w.sfx('growl', x, z, 0.8, 0.6);
  w.fx.sigil(x, z, 2.2, 0xffb0e0, 1.1);
  w.fx.smoke(x, z, 0xf0e8f4, 22);
  w.fx.pillar(x, z, 1.1, 3.4, 0xffd0ec, 0.6);
  void c;
}

reg({
  id: 'yu_slash', cls: 'yuta', name: 'Cursed Edge', type: 'active', req: 1, max: 5, color: '#e8ecf4',
  desc: lv => `Step in and cut with a katana flooded with cursed energy: ${pct(m(1.9, lv))} ATK in a wide arc, then the energy bursts for ${pct(m(0.9, lv))}.`,
  ce: lv => 10 + lv * 2, cd: () => 3.2, anim: 'slash2', animDur: 0.42, range: 4.5,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    c.dash(a.x, a.z, Math.min(2.4, Math.max(0.4, a.dist - 1.3)), 0.12);
    w.schedule(0.16, () => {
      w.sfx('slash', c.x, c.z, 1, 0.9);
      w.fx.slash(c.x + a.x, c.z + a.z, dir, 2.2, 0xffffff, 1.6, 0.3, 1);
      w.fx.slash(c.x + a.x, c.z + a.z, dir + 0.4, 1.8, 0xffb0e0, 1.2, -0.3, 1);
      w.damageCone(c, c.x, c.z, dir, 3.2, 2.2, m(1.9, lv), { kind: 'skill', knock: 1 });
    });
    w.schedule(0.34, () => {
      const x = c.x + a.x * 1.8, z = c.z + a.z * 1.8;
      w.fx.shockwave(x, z, 2.2, 0xffd0ec);
      w.damageArea(c, x, z, 2.2, m(0.9, lv), { kind: 'skill', knock: 1.5, quiet: true });
    });
  },
});

reg({
  id: 'yu_rika', cls: 'yuta', name: 'Rika', type: 'active', req: 3, max: 5, color: '#ffb0e0',
  desc: lv => `Call Rika, the Queen of Curses, for ${12 + lv * 3}s. She tears into anything near you, her power growing with your Shikigami Power.`,
  ce: lv => 22 + lv * 3, cd: () => 24, anim: 'summon', animDur: 0.6,
  cast: (w, c, lv) => {
    const x = c.x - Math.sin(c.facing) * 1.6, z = c.z - Math.cos(c.facing) * 1.6;
    rikaRise(w, c, x, z);
    w.schedule(0.3, () => w.summon('rika', x, z, { dur: 12 + lv * 3, power: m(1.15, lv), owner: c }));
  },
});

reg({
  id: 'yu_speech', cls: 'yuta', name: 'Cursed Speech: "Don\'t Move"', type: 'active', req: 6, max: 5, color: '#c8d0ff',
  desc: lv => `Inumaki's technique, copied: every enemy within 7 m is frozen for ${(1.2 + lv * 0.2).toFixed(1)}s and takes ${pct(m(0.8, lv))} ATK.`,
  ce: lv => 18 + lv * 2, cd: () => 11, anim: 'cast', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('roar', c.x, c.z, 0.5, 1.6);
    w.sfx('resonance', c.x, c.z, 0.6, 0.7);
    w.fx.ring(c.x, c.z, 0xc8d0ff, 7, 0.5, 0.4);
    w.fx.shockwave(c.x, c.z, 7, 0xd8dcff);
    w.fx.text(c.x, 2.8, c.z, '動くな', '#e8ecff', 22);
    w.damageArea(c, c.x, c.z, 7, m(0.8, lv), { kind: 'skill', stun: 1.2 + lv * 0.2, knock: 0 });
  },
});

reg({
  id: 'yu_blast', cls: 'yuta', name: 'Cursed Speech: "Blast Away"', type: 'active', req: 10, max: 5, prereq: ['yu_speech', 2], color: '#9aa8ff',
  desc: lv => `A spoken command that hurls everything in front of you away: ${pct(m(2.3, lv))} ATK in a cone 8 m long.`,
  ce: lv => 24 + lv * 3, cd: () => 8, anim: 'cast', animDur: 0.5, range: 8,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    w.sfx('shockwave', c.x, c.z, 0.9, 1.2);
    w.fx.text(c.x, 2.8, c.z, 'ぶっとべ', '#c8d0ff', 20);
    for (let i = 1; i <= 4; i++) w.schedule(i * 0.05, () => w.fx.ring(c.x + a.x * i * 1.8, c.z + a.z * i * 1.8, 0x9aa8ff, 1 + i * 0.4, 0.3, 0.3));
    w.schedule(0.12, () => { w.fx.shake(0.35); w.damageCone(c, c.x, c.z, dir, 8, 1.2, m(2.3, lv), { kind: 'skill', knock: 5 }); });
  },
});

reg({
  id: 'yu_rct', cls: 'yuta', name: 'Reverse Cursed Technique', type: 'buff', req: 5, max: 5, color: '#ffe8f4',
  desc: lv => `Turn your cursed energy positive: heal ${16 + lv * 4}% of max HP at once and ${12 + lv * 6} HP a second for 8s.`,
  ce: lv => 20 + lv * 3, cd: () => 20, anim: 'channel', animDur: 0.45,
  cast: (w, c, lv) => {
    w.sfx('heal', c.x, c.z);
    w.sfx('buff', c.x, c.z, 0.5, 0.8);
    w.fx.pillar(c.x, c.z, 1.0, 3, 0xffe8f4, 0.7);
    w.fx.burst(c.x, 1, c.z, 0xffffff, 24, 3, 0.22, 0.8);
    c.heal(c.maxHpValue() * (0.16 + lv * 0.04));
    c.addBuff('yu_rct', 8, { hpRegen: 12 + lv * 6 });
  },
});

reg({
  id: 'yu_beam', cls: 'yuta', name: 'Pure Love', type: 'active', req: 15, max: 5, prereq: ['yu_rika', 2], color: '#ff8ad0',
  desc: lv => `"I love you, Rika." All of her cursed energy in one beam: ${pct(m(4.2, lv))} ATK to everything in a 16 m line, ignoring defense.`,
  ce: lv => 40 + lv * 4, cd: () => 18, anim: 'castUp', animDur: 0.8, range: 16,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('charge', c.x, c.z, 0.9, 0.7);
    w.fx.pillar(c.x, c.z, 1.2, 4, 0xffb0e0, 0.6);
    w.fx.text(c.x, 3, c.z, '純愛', '#ffb0e0', 24);
    w.schedule(0.55, () => {
      const x1 = c.x + a.x * 16, z1 = c.z + a.z * 16;
      w.sfx('beam', c.x, c.z, 1, 0.7);
      w.sfx('explosion', x1, z1, 0.8, 0.6);
      w.fx.lightning(c.x + a.x * 0.6, 1.4, c.z + a.z * 0.6, x1, 1.4, z1, 0xff8ad0, 0.5);
      w.fx.lightning(c.x + a.x * 0.6, 1.4, c.z + a.z * 0.6, x1, 1.4, z1, 0xffffff, 0.2);
      w.fx.light(c.x + a.x * 6, 1.5, c.z + a.z * 6, 0xff9ad8, 30, 0.6, 18);
      w.fx.shake(0.6, 0.5);
      w.damageLine(c, c.x, c.z, x1, z1, 1.8, m(4.2, lv), { kind: 'skill', ignoreDef: true, knock: 3, color: '#ff9ad8' });
    });
  },
});

reg({
  id: 'yu_mimic', cls: 'yuta', name: 'Mimicry', type: 'active', req: 20, max: 5, prereq: ['yu_blast', 2], color: '#d8c8ff',
  desc: lv => `Use a technique Rika has copied, chosen at random: a Granite Blast beam, a storm of Dismantle cuts or a falling thunderbolt. Each deals about ${pct(m(3.4, lv))} ATK.`,
  ce: lv => 34 + lv * 3, cd: () => 12, anim: 'castUp', animDur: 0.6, range: 12,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    const pickN = Math.floor(Math.random() * 3);
    if (pickN === 0) {
      // Granite Blast: a blast of cursed energy straight ahead
      w.sfx('charge', c.x, c.z, 0.6, 1.1);
      w.schedule(0.3, () => {
        const x1 = c.x + a.x * 12, z1 = c.z + a.z * 12;
        w.sfx('beam', c.x, c.z, 1, 0.9);
        w.fx.lightning(c.x, 1.3, c.z, x1, 1.3, z1, 0xffd06a, 0.4);
        w.fx.shake(0.4);
        w.damageLine(c, c.x, c.z, x1, z1, 2.2, m(3.4, lv), { kind: 'skill', knock: 3 });
      });
    } else if (pickN === 1) {
      // Dismantle: cuts through everything in front
      for (let i = 0; i < 5; i++) w.schedule(0.15 + i * 0.07, () => {
        w.sfx('dismantle', c.x, c.z, 0.7, 0.9 + i * 0.05);
        for (let k = 0; k < 2; k++) w.fx.slash(c.x + a.x * (2 + k * 2.5), c.z + a.z * (2 + k * 2.5), dir + (Math.random() - 0.5) * 1.2, 1.4, 0xffffff, 0.7, Math.random() * 2 - 1, 1);
        w.damageCone(c, c.x, c.z, dir, 7, 1.3, m(3.4, lv) / 5, { kind: 'skill', ignoreDef: true, noBF: true, quiet: i < 4 });
      });
    } else {
      // a thunderbolt where the target stands
      const tg = t ?? w.nearestTarget('enemy', c.x + a.x * 4, c.z + a.z * 4, 8);
      const x = tg ? tg.x : c.x + a.x * 4, z = tg ? tg.z : c.z + a.z * 4;
      w.sfx('lightning', x, z, 1, 0.9);
      w.schedule(0.25, () => {
        w.sfx('thunder', x, z, 0.8);
        w.fx.lightning(x, 12, z, x, 0, z, 0xbfe8ff, 0.35);
        w.fx.shockwave(x, z, 3.2, 0x9ad8ff);
        w.fx.shake(0.45);
        w.damageArea(c, x, z, 3.2, m(3.4, lv), { kind: 'skill', stun: 0.6, knock: 1 });
      });
    }
  },
});

reg({
  id: 'yu_full', cls: 'yuta', name: 'Full Manifestation', type: 'buff', req: 18, max: 5, color: '#ff6ac0',
  desc: lv => `Rika manifests completely for 10s: attack +${20 + lv * 4}%, skill power +${15 + lv * 5}%, CE regen +${8 + lv * 2}/s. Calls Rika if she isn't out.`,
  ce: lv => 30 + lv * 3, cd: () => 36, anim: 'summon', animDur: 0.7,
  cast: (w, c, lv) => {
    const x = c.x - Math.sin(c.facing) * 1.6, z = c.z - Math.cos(c.facing) * 1.6;
    rikaRise(w, c, x, z);
    w.fx.text(c.x, 3, c.z, '完全顕現', '#ff8ad0', 22);
    w.fx.shake(0.4);
    c.addBuff('yu_full', 10, { atkPct: 0.2 + lv * 0.04, skillPow: 0.15 + lv * 0.05, ceRegen: 8 + lv * 2 });
    w.schedule(0.3, () => w.summon('rika', x, z, { dur: 10, power: m(1.3, lv), owner: c }));
  },
});

reg({
  id: 'yu_guard', cls: 'yuta', name: 'Rika\'s Guard', type: 'reaction', req: 9, max: 5, color: '#ffc0e4',
  desc: lv => `When struck, ${12 + lv * 4}% chance that Rika's hand catches the blow: half the damage back as ${pct(m(1.4, lv))} ATK around you (every 3s at most).`,
  react: { on: 'hit', chance: lv => 0.12 + lv * 0.04, icd: 3, run: (w, c, lv) => {
    w.sfx('growl', c.x, c.z, 0.7, 0.7);
    w.sfx('block', c.x, c.z, 0.8);
    w.fx.ring(c.x, c.z, 0xffb0e0, 2.4, 0.3, 0.35);
    w.fx.burst(c.x, 1.2, c.z, 0xffd0ec, 16, 5, 0.25, 0.5);
    c.heal(c.maxHpValue() * 0.03);
    w.damageArea(c, c.x, c.z, 2.6, m(1.4, lv), { kind: 'skill', knock: 2.5 });
  } },
});

reg({
  id: 'yu_promise', cls: 'yuta', name: 'The Promise', type: 'reaction', req: 24, max: 5, color: '#e8ecf4',
  desc: lv => `When HP falls below 30%, the ring answers: recover ${22 + lv * 4}% of max HP and take no damage for 1.5s (once every 55s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 55, run: (w, c, lv) => {
    w.sfx('heal', c.x, c.z, 0.8, 0.9);
    w.fx.pillar(c.x, c.z, 1.1, 3, 0xffe8f4, 0.7);
    w.fx.text(c.x, 2.6, c.z, '約束', '#ffd0ec', 20);
    c.heal(c.maxHpValue() * (0.22 + lv * 0.04));
    c.setInvuln(1.5);
  } },
});

reg({ id: 'yu_reserves', cls: 'yuta', name: 'Bottomless Cursed Energy', type: 'passive', req: 2, max: 5, color: '#ffb0e0', desc: lv => `Max CE +${lv * 8}%, CE regen +${lv * 1.5}/s.`, passive: lv => ({ cePct: lv * 0.08, ceRegen: lv * 1.5 }) });
reg({ id: 'yu_sword', cls: 'yuta', name: 'Swordsmanship', type: 'passive', req: 8, max: 5, color: '#e8ecf4', desc: lv => `Crit rate +${lv * 2}%, crit damage +${lv * 8}%.`, passive: lv => ({ crit: lv * 0.02, critDmg: lv * 0.08 }) });
reg({ id: 'yu_love', cls: 'yuta', name: 'Pure Love', type: 'passive', req: 14, max: 5, color: '#ff8ad0', desc: lv => `Skill power +${lv * 5}%, Rika's power +${lv * 8}%.`, passive: lv => ({ skillPow: lv * 0.05, summonPow: lv * 0.08 }) });
reg({ id: 'yu_special', cls: 'yuta', name: 'Special Grade', type: 'passive', req: 22, max: 5, color: '#d8c8ff', desc: lv => `Max HP +${lv * 6}%, defense +${lv * 5}%, cooldowns -${lv * 2}%.`, passive: lv => ({ hpPct: lv * 0.06, defPct: lv * 0.05, cdr: lv * 0.02 }) });

reg({
  id: 'yu_domain', cls: 'yuta', name: 'Domain Expansion', type: 'ultimate', req: 25, max: 1, color: '#ff9ad8',
  desc: () => 'Ultimate. Authentic Mutual Love: a field of katanas, each holding a technique Yuta has copied. For 9s every enemy within 14 metres is struck by them again and again (frozen by Cursed Speech, cut, blasted), and Rika fights at your side. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'domain', animDur: 1.2,
  cast: (w, c) => {
    w.sfx('domain', c.x, c.z);
    w.domain('love', c.x, c.z, 14, 9.5);
    c.setInvuln(9.5);
    c.addBuff('yu_domain', 10, { atkPct: 0.35, skillPow: 0.3, hpRegen: 30 });
    w.schedule(1.2, () => w.summon('rika', c.x - Math.sin(c.facing) * 1.6, c.z - Math.cos(c.facing) * 1.6, { dur: 9, power: 1.6, owner: c }));
    for (let i = 0; i < 24; i++) {
      w.schedule(1.3 + i * 0.32, () => {
        const ts = w.targetsNear('enemy', c.x, c.z, 14);
        for (const tg of ts.slice(0, 6)) {
          const kind = (i + tg.x | 0) % 3;
          w.fx.pillar(tg.x, tg.z, 0.25, 2.4, kind === 0 ? 0xc8d0ff : kind === 1 ? 0xffffff : 0xff9ad8, 0.3);
          if (kind === 1) w.fx.slash(tg.x, tg.z, Math.random() * Math.PI * 2, 1.2, 0xffffff, 0.6, Math.random() * 2 - 1, 1);
          w.damageTarget(c, tg, i % 4 === 3 ? 1.9 : 0.8, { kind: 'domain', noBF: true, quiet: true, stun: kind === 0 ? 0.4 : 0, color: '#ffb0e0' });
        }
        if (ts.length) w.sfx(i % 3 === 0 ? 'resonance' : 'slash', c.x, c.z, 0.5, 0.8 + Math.random() * 0.4);
      });
    }
  },
});

// ===========================================================================
// Toji Fushiguro
// ===========================================================================

/** a blur of motion: Toji is simply faster than the eye */
function blur(w: WorldAPI, x: number, z: number) {
  w.fx.burst(x, 1, z, 0xb8b0c8, 10, 5, 0.18, 0.35);
  w.fx.ring(x, z, 0x8a6aa0, 1.2, 0.18, 0.25);
}

function nearestAhead(w: WorldAPI, c: Caster, t: Target | null, ax: number, az: number, r: number) {
  return t && Math.hypot(t.x - c.x, t.z - c.z) < r ? t : w.nearestTarget('enemy', c.x + ax * 2, c.z + az * 2, r);
}

reg({
  id: 'tj_spear', cls: 'toji', name: 'Inverted Spear of Heaven', type: 'active', req: 1, max: 5, color: '#d8d8e0',
  desc: lv => `Lunge with the cursed tool that cancels techniques: ${pct(m(2.2, lv))} ATK to the first enemy in reach, ignoring defense and straight through barriers like Infinity (+30% against bosses).`,
  ce: lv => 8 + lv, cd: () => 3, anim: 'thrust', animDur: 0.4, range: 5,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    c.dash(a.x, a.z, Math.min(3.2, Math.max(0.6, a.dist - 1)), 0.1);
    w.schedule(0.14, () => {
      const tg = nearestAhead(w, c, t, a.x, a.z, 3);
      w.sfx('slash', c.x, c.z, 1, 1.2);
      w.fx.slash(c.x + a.x * 1.2, c.z + a.z * 1.2, Math.atan2(a.x, a.z), 1.4, 0xe8e8f0, 1.0, 0, 1);
      if (tg) {
        w.fx.burst(tg.x, 1, tg.z, 0x9a2a4a, 14, 5, 0.25, 0.5);
        w.damageTarget(c, tg, m(2.2, lv) * (tg.isBoss ? 1.3 : 1), { kind: 'skill', ignoreDef: true, nullify: true, color: '#e8e8f0' });
      }
    });
  },
});

reg({
  id: 'tj_cloud', cls: 'toji', name: 'Playful Cloud', type: 'active', req: 3, max: 5, color: '#c8a050',
  desc: lv => `A three-section staff that hits by raw strength alone: five swings around you for ${pct(m(0.75, lv))} ATK each, the last one knocking everything away.`,
  ce: lv => 12 + lv * 2, cd: () => 6, anim: 'slash1', animDur: 0.7,
  cast: (w, c, lv) => {
    for (let i = 0; i < 5; i++) w.schedule(0.06 + i * 0.11, () => {
      const dir = c.facing + (i % 2 ? 1 : -1) * 0.9 + i * 1.3;
      w.sfx(i === 4 ? 'hammer' : 'swingHeavy', c.x, c.z, 0.8, 0.9 + i * 0.05);
      w.fx.slash(c.x, c.z, dir, 2.6, 0xd8b04a, 1.2, i % 2 ? 0.5 : -0.5, 1);
      if (i === 4) { w.fx.shockwave(c.x, c.z, 3.2, 0xd8b04a); w.fx.shake(0.35); }
      w.damageArea(c, c.x, c.z, 3, m(0.75, lv), { kind: 'skill', knock: i === 4 ? 4 : 0.6, quiet: i < 4 });
    });
  },
});

reg({
  id: 'tj_chain', cls: 'toji', name: 'Chain of a Thousand Miles', type: 'active', req: 6, max: 5, color: '#8a8a94',
  desc: lv => `Swing the endless chain the length of the field: ${pct(m(1.8, lv))} ATK to everything in a 15 m line, slowing it by 40% for 3s.`,
  ce: lv => 14 + lv * 2, cd: () => 7, anim: 'throw', animDur: 0.4, range: 15,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    w.sfx('swingHeavy', c.x, c.z, 1, 0.7);
    w.schedule(0.18, () => {
      const x1 = c.x + a.x * 15, z1 = c.z + a.z * 15;
      w.sfx('tink', c.x, c.z, 0.8, 0.7);
      w.fx.lightning(c.x, 1.1, c.z, x1, 1.1, z1, 0x9a9aa4, 0.12);
      w.damageLine(c, c.x, c.z, x1, z1, 1.2, m(1.8, lv), { kind: 'skill', slow: { mult: 0.6, dur: 3 }, knock: 0.5 });
    });
  },
});

reg({
  id: 'tj_katana', cls: 'toji', name: 'Split Soul Katana', type: 'active', req: 10, max: 5, prereq: ['tj_spear', 2], color: '#b8a8d8',
  desc: lv => `A blade that cuts the soul, not the body: ${pct(m(3.0, lv))} ATK in a cone, ignoring defense, +50% against bosses.`,
  ce: lv => 18 + lv * 2, cd: () => 8, anim: 'slash2', animDur: 0.45, range: 4,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const dir = Math.atan2(a.x, a.z);
    c.dash(a.x, a.z, Math.min(2, Math.max(0, a.dist - 1.2)), 0.1);
    w.schedule(0.18, () => {
      w.sfx('slash', c.x, c.z, 1, 0.7);
      w.sfx('shatter', c.x, c.z, 0.5, 1.4);
      w.fx.slash(c.x + a.x, c.z + a.z, dir, 2.4, 0xb8a8d8, 1.8, 0.2, 1);
      for (const tg of w.targetsNear('enemy', c.x + a.x * 1.6, c.z + a.z * 1.6, 2.4).slice(0, 6)) {
        w.fx.ring(tg.x, tg.z, 0xb8a8d8, 1.2, 0.25, 0.25);
        w.damageTarget(c, tg, m(3.0, lv) * (tg.isBoss ? 1.5 : 1), { kind: 'skill', ignoreDef: true, color: '#c8b8e8' });
      }
    });
  },
});

reg({
  id: 'tj_flash', cls: 'toji', name: 'Heavenly Speed', type: 'active', req: 15, max: 5, color: '#a89ac8',
  desc: lv => `Cross the field faster than sight: dash 9 m through everything in your way, cutting each for ${pct(m(2.4, lv))} ATK. You can't be hit while moving.`,
  ce: lv => 16 + lv * 2, cd: () => 7, anim: 'dash', animDur: 0.35, range: 9,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const x0 = c.x, z0 = c.z;
    blur(w, x0, z0);
    c.dash(a.x, a.z, 9, 0.18, true);
    w.sfx('dash', x0, z0, 1, 1.3);
    w.schedule(0.2, () => {
      blur(w, c.x, c.z);
      w.sfx('slash', c.x, c.z, 0.9, 1.1);
      w.fx.slash((x0 + c.x) / 2, (z0 + c.z) / 2, Math.atan2(a.x, a.z), 4.5, 0xd8d0e8, 1.2, 0, 1);
      w.damageLine(c, x0, z0, c.x, c.z, 1.6, m(2.4, lv), { kind: 'skill', knock: 1 });
    });
  },
});

reg({
  id: 'tj_hunt', cls: 'toji', name: 'Sorcerer Killer', type: 'active', req: 20, max: 5, prereq: ['tj_katana', 2], color: '#7a2a3a',
  desc: lv => `Appear behind the nearest enemy and finish it: ${pct(m(3.6, lv))} ATK, ignoring defense, doubled against anything below 35% HP.`,
  ce: lv => 26 + lv * 3, cd: () => 12, anim: 'thrust', animDur: 0.45, range: 10,
  cast: (w, c, lv, t, dx, dz) => {
    const a = aim(c, t, dx, dz);
    const tg = nearestAhead(w, c, t, a.x, a.z, 10);
    if (!tg) return;
    blur(w, c.x, c.z);
    const bx = tg.x + Math.sin(Math.atan2(tg.x - c.x, tg.z - c.z)) * 1.1, bz = tg.z + Math.cos(Math.atan2(tg.x - c.x, tg.z - c.z)) * 1.1;
    if (!w.blocked(bx, bz, 0.4)) c.dash(bx - c.x, bz - c.z, Math.hypot(bx - c.x, bz - c.z), 0.08, true);
    w.schedule(0.16, () => {
      blur(w, c.x, c.z);
      w.sfx('slash', tg.x, tg.z, 1, 0.6);
      w.sfx('punch', tg.x, tg.z, 0.8, 0.7);
      w.fx.slash(tg.x, tg.z, Math.random() * Math.PI, 1.8, 0x9a2a4a, 1.6, 0, 1);
      w.fx.shake(0.4);
      const low = tg.hp / Math.max(1, tg.maxHp) < 0.35;
      w.damageTarget(c, tg, m(3.6, lv) * (low ? 2 : 1), { kind: 'skill', ignoreDef: true, color: '#ff5a6a' });
    });
  },
});

reg({
  id: 'tj_restrict', cls: 'toji', name: 'Heavenly Restriction', type: 'buff', req: 5, max: 5, color: '#8a6aa0',
  desc: lv => `Let the body go all out for 10s: move speed +${15 + lv * 3}%, attack speed +${15 + lv * 3}%, evasion +${8 + lv * 2}%.`,
  ce: lv => 14 + lv * 2, cd: () => 22, anim: 'victory', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('buff', c.x, c.z, 0.6, 0.7);
    w.fx.ring(c.x, c.z, 0x8a6aa0, 2.4, 0.4, 0.3);
    blur(w, c.x, c.z);
    c.addBuff('tj_restrict', 10, { moveSpd: 0.15 + lv * 0.03, atkSpd: 0.15 + lv * 0.03, evasion: 0.08 + lv * 0.02 });
  },
});

reg({
  id: 'tj_focus', cls: 'toji', name: 'Professional', type: 'buff', req: 18, max: 5, color: '#c8a050',
  desc: lv => `Nothing personal; it's the job. For 9s: crit rate +${15 + lv * 3}%, crit damage +${30 + lv * 10}%, attack +${10 + lv * 3}%.`,
  ce: lv => 18 + lv * 2, cd: () => 30, anim: 'channel', animDur: 0.4,
  cast: (w, c, lv) => {
    w.sfx('equip', c.x, c.z, 0.8, 0.8);
    w.fx.pillar(c.x, c.z, 0.7, 2.2, 0xc8a050, 0.5);
    c.addBuff('tj_focus', 9, { crit: 0.15 + lv * 0.03, critDmg: 0.3 + lv * 0.1, atkPct: 0.1 + lv * 0.03 });
  },
});

reg({
  id: 'tj_sense', cls: 'toji', name: 'Sixth Sense', type: 'reaction', req: 9, max: 5, color: '#a89ac8',
  desc: lv => `When struck, ${14 + lv * 4}% chance to slip the next blows for 1s and answer with ${pct(m(1.6, lv))} ATK around you (every 2.5s at most).`,
  react: { on: 'hit', chance: lv => 0.14 + lv * 0.04, icd: 2.5, run: (w, c, lv) => {
    c.model?.play('kick', 0.3);
    blur(w, c.x, c.z);
    w.sfx('kick', c.x, c.z, 0.9, 1.1);
    c.setInvuln(1);
    w.damageArea(c, c.x, c.z, 2.4, m(1.6, lv), { kind: 'skill', knock: 2.5 });
  } },
});

reg({
  id: 'tj_instinct', cls: 'toji', name: 'Monster\'s Instinct', type: 'reaction', req: 24, max: 5, color: '#7aff9a',
  desc: lv => `When HP falls below 30%, the body refuses to stop: recover ${20 + lv * 4}% of max HP and gain +30% move speed for 5s (once every 50s).`,
  react: { on: 'lowHp', chance: () => 1, icd: 50, run: (w, c, lv) => {
    w.sfx('growl', c.x, c.z, 0.6, 0.9);
    w.fx.pillar(c.x, c.z, 1.0, 2.6, 0x8a6aa0, 0.6);
    c.heal(c.maxHpValue() * (0.2 + lv * 0.04));
    c.addBuff('tj_instinct', 5, { moveSpd: 0.3 });
  } },
});

reg({ id: 'tj_body', cls: 'toji', name: 'Body of Heaven', type: 'passive', req: 2, max: 5, color: '#8a6aa0', desc: lv => `Max HP +${lv * 8}%, defense +${lv * 6}%, HP regen +${lv * 2}/s.`, passive: lv => ({ hpPct: lv * 0.08, defPct: lv * 0.06, hpRegen: lv * 2 }) });
reg({ id: 'tj_senses', cls: 'toji', name: 'Enhanced Senses', type: 'passive', req: 8, max: 5, color: '#a89ac8', desc: lv => `Crit rate +${lv * 2}%, evasion +${lv * 2}%, move speed +${lv * 2}%.`, passive: lv => ({ crit: lv * 0.02, evasion: lv * 0.02, moveSpd: lv * 0.02 }) });
reg({ id: 'tj_tools', cls: 'toji', name: 'Cursed Tool Mastery', type: 'passive', req: 14, max: 5, color: '#c8a050', desc: lv => `Attack +${lv * 5}%, crit damage +${lv * 10}%.`, passive: lv => ({ atkPct: lv * 0.05, critDmg: lv * 0.1 }) });
reg({ id: 'tj_zero', cls: 'toji', name: 'Zero Cursed Energy', type: 'passive', req: 22, max: 5, color: '#5a5a66', desc: lv => `Nothing to sense, nothing to sure-hit (enemy domains always deal Toji 70% less): damage taken -${lv * 3}%, stamina regen +${lv * 1.5}/s, lifesteal +${lv}%.`, passive: lv => ({ dmgReduce: lv * 0.03, ceRegen: lv * 1.5, lifesteal: lv * 0.01 }) });

reg({
  id: 'tj_ult', cls: 'toji', name: 'Sorcerer Killer: Unbound', type: 'ultimate', req: 25, max: 1, color: '#9a2a4a',
  desc: () => 'Ultimate. Toji has no domain; he has speed. For 6s he cannot be touched and cuts down up to 12 enemies one after another with every tool he carries, each blow ignoring defense, ending on an Inverted Spear strike to the strongest. Needs a full Domain gauge.',
  ce: () => 0, cd: () => 60, anim: 'dash', animDur: 0.4,
  cast: (w, c) => {
    c.setInvuln(6.5);
    c.addBuff('tj_ult', 6.5, { moveSpd: 0.4, atkPct: 0.3 });
    w.sfx('charge', c.x, c.z, 0.7, 1.4);
    w.fx.text(c.x, 3, c.z, '天与呪縛', '#c8a8e8', 24);
    w.fx.flash('#000000', 0.35, 0.4);
    for (let i = 0; i < 12; i++) {
      w.schedule(0.35 + i * 0.42, () => {
        const ts = w.targetsNear('enemy', c.x, c.z, 16);
        const tg = ts[i % Math.max(1, ts.length)];
        if (!tg) return;
        const ang = Math.random() * Math.PI * 2;
        const bx = tg.x + Math.sin(ang) * 1.2, bz = tg.z + Math.cos(ang) * 1.2;
        blur(w, c.x, c.z);
        if (!w.blocked(bx, bz, 0.4)) c.dash(bx - c.x, bz - c.z, Math.hypot(bx - c.x, bz - c.z), 0.08, true);
        w.schedule(0.1, () => {
          blur(w, c.x, c.z);
          w.sfx(i % 3 === 0 ? 'hammer' : 'slash', tg.x, tg.z, 0.8, 0.8 + Math.random() * 0.4);
          w.fx.slash(tg.x, tg.z, Math.random() * Math.PI * 2, 1.6, i % 3 === 0 ? 0xd8b04a : 0xe8e8f0, 1.2, Math.random() * 2 - 1, 1);
          w.damageTarget(c, tg, 1.6, { kind: 'domain', ignoreDef: true, noBF: true, quiet: true, color: '#e8e8f0' });
        });
      });
    }
    w.schedule(5.6, () => {
      const ts = w.targetsNear('enemy', c.x, c.z, 16);
      const tg = ts.sort((p, q) => (q.isBoss ? 1 : 0) - (p.isBoss ? 1 : 0) || q.hp - p.hp)[0];
      if (!tg) return;
      w.sfx('shatter', tg.x, tg.z, 0.9, 0.8);
      w.sfx('slash', tg.x, tg.z, 1, 0.6);
      w.fx.slash(tg.x, tg.z, 0, 2.6, 0x9a2a4a, 2, 0, 1);
      w.fx.shake(0.7, 0.5);
      w.damageTarget(c, tg, 6, { kind: 'domain', ignoreDef: true, noBF: true, nullify: true, knock: 4, color: '#ff5a6a' });
    });
  },
});
