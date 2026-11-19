// What every suite gets: checks that collect failures, and shortcuts for driving the game.

export function helpers(page, url, ctx) {
  const t = {
    page, url, ctx,
    failures: [],
    notes: [],
    /** records a failure unless `ok` */
    check(ok, msg) { if (!ok) t.failures.push(msg); return !!ok; },
    fail(msg) { t.failures.push(msg); },
    /** a short line shown next to a passing suite */
    note(msg) { t.notes.push(msg); },
    eval: (fn, arg) => page.evaluate(fn, arg),
    wait: (ms) => page.waitForTimeout(ms),

    /** Taps through dialogue and cutscenes until the game has stayed in play for a moment. */
    async skip(maxMs = 120000) {
      const end = Date.now() + maxMs;
      let calm = 0;
      while (calm < 10 && Date.now() < end) {
        const st = await page.evaluate(() => window.game.state);
        if (st === 'play' || st === 'title' || st === 'menu') { calm++; await page.waitForTimeout(250); continue; }
        calm = 0;
        await page.keyboard.press('Space');
        await page.waitForTimeout(90);
      }
    },

    /** Unlocks every sorcerer (as finishing the story would). */
    async unlockAll() {
      await page.evaluate(() => localStorage.setItem('cursedChronicles.unlocks', JSON.stringify(Object.keys(window.__dbg.CLASSES))));
    },

    /** From the title screen: a new game in `slot` with sorcerer `cls`, played until the opening is over. */
    async newGame(cls = 'yuji', slot = 2) {
      // an empty slot, so no overwrite prompt
      await page.evaluate((k) => { localStorage.removeItem(k); localStorage.removeItem(k + '.bak'); }, 'cursedChronicles.save.' + slot);
      await page.mouse.click(640, 360);
      await page.waitForSelector('[data-a="new"]');
      await page.click('[data-a="new"]');
      await page.click(`[data-s="${slot}"]`);
      await page.waitForSelector(`[data-c="${cls}"]`);
      await page.click(`[data-c="${cls}"]`);
      await page.click('[data-go="1"]');
      await page.waitForFunction(() => window.game.state !== 'title', null, { timeout: 30000 });
      await page.waitForTimeout(3000);
      await t.skip();
      return page.evaluate(() => window.game.ps.d.cls);
    },

    /** Max level, every technique, best gear, and no damage or cooldowns. */
    async godMode() {
      await page.evaluate(() => { const g = window.game; g.cheat('lvlMax'); g.cheat('maxSkills'); g.cheat('gear'); g.cheatToggle('god'); g.cheatToggle('infCe'); g.cheatToggle('noCd'); });
    },

    /** Reloads the game (back to a fresh title screen). */
    async reload() {
      await page.reload();
      await page.waitForFunction(() => window.game && document.getElementById('boot') === null, null, { timeout: 60000 });
    },

    async travel(map) {
      await page.evaluate(async (m) => { await window.game.travel(m); }, map);
      await page.waitForTimeout(1800);
      await t.skip();
    },
  };
  return t;
}
