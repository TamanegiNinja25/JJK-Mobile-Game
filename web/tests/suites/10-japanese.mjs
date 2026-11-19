export const name = 'japanese';
export const about = 'the Japanese option: title, menus, HUD and dialogue are translated, with nothing breaking';

export async function run(t) {
  // pick Japanese the way the settings would, then start fresh
  await t.eval(() => {
    const k = 'cursedChronicles.settings';
    const s = JSON.parse(localStorage.getItem(k) ?? '{}');
    s.lang = 'ja';
    localStorage.setItem(k, JSON.stringify(s));
  });
  await t.reload();
  await t.eval(() => window.__dbg.i18n.setCollecting(true));
  await t.wait(1500);
  const lang = await t.eval(() => window.__dbg.i18n.currentLang());
  t.check(lang === 'ja', `language is ${lang}`);
  const dictSize = await t.eval(async () => Object.keys(await (await fetch('lang/ja.json')).json()).length);
  t.check(dictSize > 2000, `dictionary has only ${dictSize} strings`);

  // the title menu and its settings
  await t.page.mouse.click(640, 360);
  await t.page.waitForSelector('[data-a="new"]');
  await t.page.click('[data-a="settings"]');
  await t.wait(600);
  await t.page.keyboard.press('Escape');
  await t.reload();
  await t.eval(() => window.__dbg.i18n.setCollecting(true));
  await t.unlockAll();
  await t.page.mouse.click(640, 360);
  await t.page.waitForSelector('[data-a="new"]');
  const newLabel = await t.eval(() => document.querySelector('[data-a="new"]').textContent);
  t.check(/[぀-ヿ一-龯]/.test(newLabel), `New Game button not translated: "${newLabel}"`);

  // a game: dialogue gets typed out in Japanese
  await t.eval(() => { localStorage.removeItem('cursedChronicles.save.2'); localStorage.removeItem('cursedChronicles.save.2.bak'); });
  await t.page.click('[data-a="new"]');
  await t.page.click('[data-s="2"]');
  await t.page.waitForSelector('[data-c="yuji"]');
  await t.page.click('[data-c="yuji"]');
  await t.page.click('[data-go="1"]');
  await t.page.waitForFunction(() => window.game.state !== 'title', null, { timeout: 30000 });
  let sawJaLine = false;
  for (let i = 0; i < 60 && !sawJaLine; i++) {
    const txt = await t.eval(() => document.querySelector('.vn-text')?.textContent ?? '');
    if (/[぀-ヿ一-龯]{4,}/.test(txt)) sawJaLine = true;
    await t.wait(250);
  }
  t.check(sawJaLine, 'no Japanese dialogue appeared');
  await t.skip();
  t.check(await t.eval(() => window.game.state) === 'play', 'not in play after the opening');

  // every menu tab, opened once, then measure how much of the page is still English
  for (const tab of ['status', 'bag', 'skills', 'quests', 'map', 'cheats', 'system', 'records']) {
    await t.eval((tb) => { window.game.ui.menus.show(tb); }, tab);
    await t.wait(400);
  }
  for (const v of ['boss', 'beasts']) {
    await t.eval((vv) => document.querySelector(`[data-act="recview"][data-v="${vv}"]`)?.click(), v);
    await t.wait(300);
  }
  await t.eval(() => document.querySelector('[data-act="qview"][data-v="reruns"]')?.click());
  await t.page.keyboard.press('Escape');
  await t.wait(300);
  const left = await t.eval(() => [...window.__dbg.i18n.missing]);
  t.note(`${dictSize} strings, ${left.length} seen untranslated`);
  if (left.length) console.log('    untranslated:', left.join(' | '));

  // back to English for the other suites
  await t.eval(() => {
    const k = 'cursedChronicles.settings';
    const s = JSON.parse(localStorage.getItem(k) ?? '{}');
    s.lang = 'en';
    localStorage.setItem(k, JSON.stringify(s));
  });
}
