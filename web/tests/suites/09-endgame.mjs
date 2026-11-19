export const name = 'endgame';
export const about = 'achievements, bestiary, boss times and a Boss Rush clear';

export async function run(t) {
  await t.newGame('yuji', 2);
  await t.eval(() => { const g = window.game; g.cheatToggle('god'); g.cheat('lvlMax'); g.cheat('maxSkills'); });
  // pretend the story is far enough along for three daily bosses
  await t.eval(() => { const ps = window.game.ps; for (const q of ['m1', 'm1c', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10']) ps.d.quests[q] = { state: 'done', progress: [] }; });
  await t.eval(() => window.game.ui.openMenu('records'));
  await t.wait(400);
  t.check(await t.eval(() => !!document.querySelector('.records [data-act="rush"]:not([disabled])')), 'Boss Rush button missing or disabled');
  await t.eval(() => document.querySelector('.records [data-act="rush"]').click());
  await t.wait(2500); await t.skip();
  t.check(await t.eval(() => window.game.world.mapDef.id) === 'rushArena', 'did not reach the Boss Rush arena');
  const total = await t.eval(() => window.__dbg.rush?.list.length ?? 0);
  let beaten = 0;
  for (let i = 0; i < 8; i++) {
    for (let k = 0; k < 20 && !(await t.eval(() => !!window.game.world.bossActive)); k++) { await t.wait(400); await t.skip(); }
    if (!(await t.eval(() => !!window.game.world.bossActive))) break;
    await t.eval(() => { const w = window.game.world; const e = w.bossActive.enemy; w.applyDamageRaw(w.player, e, e.hp + 100, { kind: 'skill', ignoreDef: true }); });
    beaten++;
    await t.wait(4500); await t.skip();
    if (await t.eval(() => window.game.world.mapDef.id) !== 'rushArena') break;
  }
  const r = await t.eval(() => window.__dbg.records());
  t.check(beaten >= 3 && beaten === total, `beat ${beaten} of ${total} rush bosses`);
  t.check(r.rush.clears === 1 && r.rush.best > 0, `rush not recorded: ${JSON.stringify(r.rush)}`);
  t.check(Object.keys(r.boss).length >= 3, `boss times not recorded (${Object.keys(r.boss).length})`);
  t.check(r.n.bosses >= 3 && Object.keys(r.beasts).length >= 3, 'bestiary / boss count not recorded');
  await t.wait(3500);
  const ach = await t.eval(() => Object.keys(window.__dbg.records().ach));
  t.check(ach.includes('rush') && ach.includes('boss1') && ach.includes('lvl100'), `achievements earned: ${ach.join(',')}`);
  t.note(`rush ${beaten} bosses, ${ach.length} achievements`);
}
