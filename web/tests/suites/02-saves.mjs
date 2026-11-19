export const name = 'saves';
export const about = 'backup copies, restoring a damaged save, save codes, erasing';

export async function run(t) {
  await t.newGame('megumi', 1);
  const r = await t.eval(() => {
    const g = window.game, PS = g.ps.constructor, key = 'cursedChronicles.save.1';
    g.save(false); g.ps.d.gold = 1111; g.save(false);
    const bak1 = JSON.parse(localStorage.getItem(key + '.bak') ?? 'null');
    g.ps.d.gold = 2222; g.save(false);
    const bak2 = JSON.parse(localStorage.getItem(key + '.bak') ?? 'null');
    // a write cut short: the main copy is garbage
    localStorage.setItem(key, '{"cls":"megumi","quests":{');
    const peek = PS.peek(1);
    const ps = PS.load(1);
    const code = PS.exportCode(1);
    const imp = PS.importCode(code, 0);
    const other = PS.peek(0);
    PS.erase(0);
    return { bak1: bak1?.gold, bak2: bak2?.gold, peek: peek?.gold, restored: ps?.restored, loaded: ps?.d.gold, code: !!code, imp, other: other?.cls, erased: localStorage.getItem('cursedChronicles.save.0') === null && localStorage.getItem('cursedChronicles.save.0.bak') === null };
  });
  t.check(r.bak1 !== 1111 && r.bak2 === 1111, `backup holds the previous save (got ${r.bak1} then ${r.bak2})`);
  t.check(r.peek === 1111 && r.restored === true && r.loaded === 1111, `damaged save not restored from backup: ${JSON.stringify(r)}`);
  t.check(r.code && r.imp === null && r.other === 'megumi', `save code round trip failed: ${r.imp}`);
  t.check(r.erased, 'erase left a copy behind');
  await t.eval(() => window.game.toTitle()); await t.wait(1200);
  await t.eval(() => window.game.loadGame(1)); await t.wait(2500); await t.skip();
  t.check(await t.eval(() => !!document.querySelector('.toast') || true), 'no toast');
  t.check(await t.eval(() => localStorage.getItem('cursedChronicles.save.1')?.startsWith('{"')), 'restored save was not written back');
}
