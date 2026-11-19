export const name = 'smoke';
export const about = 'title, new game, walking, every menu tab, save, back to title and load';

export async function run(t) {
  t.check(await t.eval(() => window.game.state) === 'title', 'did not open on the title screen');
  t.check(await t.newGame('yuji') === 'yuji', 'new game did not start as Yuji');
  t.check(await t.eval(() => window.game.state) === 'play', 'not in play after the opening');
  const p0 = await t.eval(() => [window.game.world.player.x, window.game.world.player.z]);
  await t.page.keyboard.down('KeyW'); await t.wait(900); await t.page.keyboard.up('KeyW');
  const p1 = await t.eval(() => [window.game.world.player.x, window.game.world.player.z]);
  t.check(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.5, 'W did not move the player');
  for (const tab of ['bag', 'skills', 'quests', 'map', 'status', 'system']) {
    await t.eval((tb) => window.game.ui.openMenu(tb), tab);
    await t.wait(300);
    t.check(await t.eval(() => window.game.state) === 'menu', `menu tab ${tab} did not open`);
    await t.eval(() => window.game.ui.menus.close());
    await t.wait(150);
  }
  const lvl = await t.eval(() => { const g = window.game; g.cheat('lvl10'); g.save(true); return g.ps.d.level; });
  await t.eval(() => window.game.toTitle());
  await t.wait(1500);
  t.check(await t.eval(() => window.game.state) === 'title', 'Save & Return to Title did not reach the title');
  await t.eval(() => window.game.loadGame(2));
  await t.wait(2500); await t.skip();
  t.check(await t.eval(() => window.game.ps?.d.level) === lvl, `loaded level ${await t.eval(() => window.game.ps?.d.level)}, saved ${lvl}`);
  t.note(`level ${lvl} saved and loaded`);
}
