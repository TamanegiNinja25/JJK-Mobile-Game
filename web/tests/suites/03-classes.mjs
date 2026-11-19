export const name = 'classes';
export const about = 'every sorcerer masters and casts every technique among curses';

export async function run(t) {
  await t.unlockAll();
  const all = await t.eval(() => Object.keys(window.__dbg.CLASSES));
  const pick = process.env.CLASSES ? process.env.CLASSES.split(',') : all;
  let first = true;
  for (const cls of pick) {
    if (!first) await t.reload();
    first = false;
    if (await t.newGame(cls, 2) !== cls) { t.fail(`${cls}: could not start a game`); continue; }
    await t.godMode();
    await t.travel('shinjuku');
    const ids = await t.eval(() => { const g = window.game; return Object.values(window.__dbg.SKILLS).filter(s => s.cls === g.ps.d.cls && s.cast && g.ps.skillLevel(s.id) > 0).map(s => s.id); });
    t.check(ids.length >= 5, `${cls}: only ${ids.length} castable techniques`);
    let cast = 0;
    for (const id of ids) {
      await t.eval(() => { const w = window.game.world; const e = w.enemies.find(e => e.alive && e.d.ai !== 'dummy'); if (e) w.player.place(e.x + 2, e.z + 2); window.game.ps.d.domain = 100; });
      const ok = await t.eval((id) => { const p = window.game.world.player; p.castT = 0; return !!p.useSkill(id); }, id);
      if (ok) cast++; else t.fail(`${cls}: ${id} could not be cast`);
      await t.page.waitForFunction(() => !window.game.world.player.dashS, null, { timeout: 8000 }).catch(() => {});
      await t.wait(250); await t.skip();
    }
    t.note(`${cls} ${cast}/${ids.length}`);
  }
}
