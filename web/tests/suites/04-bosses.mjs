export const name = 'bosses';
export const about = 'one-on-one boss fights, three stages, summons, quest completion';

const BOSSES = [
  { map: 'outskirts', q: 's_out3', prog: [0], id: 'smallpox', x: -20, z: 82 },
  { map: 'outskirts', q: 's_out5', prog: [15, 0], id: 'kuchisake', x: 78, z: 44 },
  { map: 'sakurajima', q: 's_saku2', prog: [16, 0], id: 'naoyaCurse', x: 0, z: -58 },
  { map: 'starCorridor', q: 'm28', prog: [12, 0], id: 'toji', x: 0, z: 8 },
];

export async function run(t) {
  await t.newGame('yuji', 2);
  await t.eval(() => { const g = window.game; g.cheatToggle('god'); g.ps.d.level = 95; g.ps.recalc?.(); });
  for (const b of BOSSES) {
    await t.eval(async (b) => { const g = window.game; g.ps.d.quests[b.q] = { state: 'active', progress: b.prog }; await g.travel(b.map); }, b);
    await t.wait(2000); await t.skip();
    await t.eval((b) => window.game.world.player.place(b.x + 9, b.z + 9), b);
    await t.wait(2000);
    await t.eval((b) => window.game.world.player.place(b.x, b.z + 3), b);
    await t.wait(900); await t.skip();
    if (!t.check(await t.eval(() => !!window.game.world.bossActive), `${b.id}: the fight did not start`)) continue;
    const seen = [];
    for (const pct of [0.8, 0.45, 0.15]) {
      await t.eval((pct) => { const e = window.game.world.bossActive?.enemy; if (e) e.hp = Math.max(1, Math.floor(e.maxHp * pct)); }, pct);
      for (let i = 0; i < 8; i++) {
        await t.wait(450);
        await t.eval(() => { const w = window.game.world; const e = w.bossActive?.enemy; if (e && Math.hypot(w.player.x - e.x, w.player.z - e.z) > 6) w.player.place(e.x + 2, e.z + 2); });
        await t.skip();
      }
      const st = await t.eval(() => { const w = window.game.world; const e = w.bossActive?.enemy; const o = w.enemies.filter(x => x.alive && x !== e); return { stage: e?.boss?.stage, mul: e?.stageMul, outsiders: o.filter(x => x.aggro && !x.bossAdd).length }; });
      seen.push(st.stage);
      t.check(st.outsiders === 0, `${b.id}: ${st.outsiders} other curses joined the fight at ${pct}`);
    }
    t.check(seen.join() === '1,2,3', `${b.id}: stages ${seen.join()} instead of 1,2,3`);
    await t.eval(() => { const w = window.game.world; const e = w.bossActive?.enemy; if (e) w.applyDamageRaw(w.player, e, e.hp + 100, { kind: 'skill', ignoreDef: true }); });
    await t.wait(3000); await t.skip();
    const q = await t.eval((b) => window.game.ps.questState(b.q)?.state, b);
    t.check(q === 'ready' || q === 'done', `${b.id}: quest ${b.q} is ${q} after the kill`);
    t.check(!(await t.eval(() => !!window.game.world.bossActive)), `${b.id}: fight still active after the kill`);
  }
}
