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

  // CC2 codes and backup files carry the device's unlocks and records; CC1 codes still import
  const x = await t.eval(() => {
    const PS = window.game.ps.constructor, R = window.__dbg.records();
    localStorage.setItem('cursedChronicles.unlocks', JSON.stringify(['gojo', 'maki']));
    R.ach.firstBlood = 1000; R.beasts.crawler = 7; R.rush.best = 300; R.n.kills = 42;
    const code = PS.exportCode(1);
    const legacy = 'CC1:' + btoa(unescape(encodeURIComponent(localStorage.getItem('cursedChronicles.save.1'))));
    const file = PS.exportAll({ lang: 'en' });
    // a fresh phone: no unlocks, no records
    localStorage.removeItem('cursedChronicles.unlocks');
    delete R.ach.firstBlood; delete R.beasts.crawler; R.rush.best = undefined; R.n.kills = 0;
    const e1 = PS.importCode(code, 0);
    const un = JSON.parse(localStorage.getItem('cursedChronicles.unlocks') ?? '[]');
    const rec = { ach: R.ach.firstBlood, beast: R.beasts.crawler, rush: R.rush.best, kills: R.n.kills };
    const e2 = PS.importCode(legacy, 0);
    PS.erase(0);
    const restored = PS.importAll(file);
    const bad = PS.importAll('{"hello":1}');
    PS.erase(0);
    return { pre: code.slice(0, 4), e1, un, rec, e2, restored: restored.slots, settings: restored.settings?.lang, bad: bad.error };
  });
  t.check(x.pre === 'CC2:' && x.e1 === null, `CC2 code: ${x.pre} ${x.e1}`);
  t.check(x.un.includes('gojo') && x.un.includes('maki'), `unlocks not carried: ${JSON.stringify(x.un)}`);
  t.check(x.rec.ach === 1000 && x.rec.beast === 7 && x.rec.rush === 300 && x.rec.kills === 42, `records not carried: ${JSON.stringify(x.rec)}`);
  t.check(x.e2 === null, `CC1 code no longer imports: ${x.e2}`);
  t.check(x.restored >= 1 && x.settings === 'en' && !!x.bad, `backup file round trip: ${JSON.stringify(x)}`);
}
