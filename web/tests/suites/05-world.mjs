export const name = 'world';
export const about = 'every map loads; street-prop kit and sprite effects are read';

export async function run(t) {
  await t.newGame('nobara', 2);
  await t.eval(() => window.game.cheatToggle('god'));
  t.check(await t.eval(() => window.game.world.fx.sheets?.size) >= 8, 'sprite-sheet effects did not load');
  const maps = await t.eval(() => Object.keys(window.__dbg.MAPS));
  let ok = 0;
  for (const m of maps) {
    try {
      await t.travel(m);
      const cur = await t.eval(() => window.game.world.mapDef?.id);
      if (t.check(cur === m, `travel to ${m} ended in ${cur}`)) ok++;
    } catch (e) { t.fail(`${m}: ${e.message.split('\n')[0]}`); }
  }
  t.note(`${ok}/${maps.length} maps`);
  await t.travel('kawasaki');
  const kit2 = await t.eval(() => { let n = 0; window.game.r.scene.traverse(o => { if (o.isInstancedMesh && o.material?.map) n++; }); return n; });
  t.check(kit2 > 0, 'no street-kit props in Kawasaki (kit not loaded?)');
}
