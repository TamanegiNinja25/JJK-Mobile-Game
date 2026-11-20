export const name = 'devices';
export const about = 'real phone and tablet screens with touch: HUD layout, joystick, buttons, Back, vibration, portrait, a slowed CPU';

import { devices } from 'playwright';

// screen sizes, pixel ratios, user agents and touch of real devices (the iPhone and iPad ones run Chromium with
// Safari's size and agent: the layout and touch handling are what is checked, not WebKit itself)
const DEVICES = (process.env.DEVICES ?? 'iPhone SE landscape,iPhone 15 Pro Max landscape,iPad Mini landscape,iPad Pro 11 landscape,Pixel 7 landscape,Galaxy S9+ landscape,Galaxy Tab S4 landscape').split(',');
// the low-end case: a phone CPU about four times slower than this machine's
const SLOW = new Set(['Galaxy S9+ landscape', 'iPhone SE landscape']);

export async function run(t) {
  const browser = t.ctx.browser();
  const results = [];
  for (const dev of DEVICES) {
    const spec = devices[dev];
    if (!spec) { t.fail(`unknown device ${dev}`); continue; }
    const ctx = await browser.newContext({ ...spec });
    // record vibration requests (a desktop browser has no vibrator)
    await ctx.addInitScript(() => { window.__buzz = []; navigator.vibrate = (p) => { window.__buzz.push(p); return true; }; });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const tag = dev.replace(' landscape', '');
    try {
      await page.goto(t.url);
      await page.waitForFunction(() => window.game && document.getElementById('boot') === null, null, { timeout: 90000 });
      const { width: W, height: H } = spec.viewport;
      // the title screen opens with a tap, and a new game starts with taps
      await page.evaluate(() => { for (const k of ['cursedChronicles.save.2', 'cursedChronicles.save.2.bak']) localStorage.removeItem(k); });
      // taps go straight to Chrome's touch input: Playwright's own tap waits for an acknowledgement that a
      // software-rendered page at a few frames a second can take longer to give than the test allows
      const cdp = await ctx.newCDPSession(page);
      const tapAt = async (x, y) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 9 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      const tap = async (sel) => {
        const loc = page.locator(sel).first();
        await loc.waitFor({ state: 'visible', timeout: 30000 });
        await loc.scrollIntoViewIfNeeded();
        const b = await loc.boundingBox();
        t.check(b && b.y >= 0 && b.y + b.height <= H + 1 && b.x >= 0 && b.x + b.width <= W + 1, `${tag}: ${sel} is outside the screen`);
        await tapAt(b.x + b.width / 2, b.y + b.height / 2);
        await page.waitForTimeout(400);
      };
      await tapAt(W / 2, H / 2);
      await tap('[data-a="new"]'); await tap('[data-s="2"]');
      await tap('[data-c="yuji"]'); await tap('[data-go="1"]');
      await page.waitForFunction(() => window.game.state !== 'title', null, { timeout: 30000 });
      await page.waitForTimeout(2500);
      // taps through dialogue and cutscenes until the game has stayed in play for a moment (an intro can start
      // a little after the opening, so this runs again before each check)
      const settle = async () => {
        for (let calm = 0, i = 0; calm < 8 && i < 600; i++) {
          const st = await page.evaluate(() => window.game.state);
          if (st === 'play') { calm++; await page.waitForTimeout(250); continue; }
          calm = 0; await tapAt(W / 2, H * 0.4); await page.waitForTimeout(120);
        }
      };
      await settle();
      t.check(await page.evaluate(() => window.game.state) === 'play', `${tag}: taps did not get through the opening`);
      await page.evaluate(() => window.game.cheatToggle('god'));

      // the HUD fits the screen and no two buttons overlap
      const lay = await page.evaluate(([W, H]) => {
        const rect = (e) => e.getBoundingClientRect();
        const btns = [...document.querySelectorAll('.act, .hud-portrait')].filter(e => e.offsetParent !== null).map(e => ({ c: e.className, r: rect(e) }));
        const off = btns.filter(b => b.r.left < -1 || b.r.top < -1 || b.r.right > W + 1 || b.r.bottom > H + 1).map(b => b.c);
        const over = [];
        const acts = btns.filter(b => b.c.startsWith('act'));
        for (let i = 0; i < acts.length; i++) for (let j = i + 1; j < acts.length; j++) {
          const a = acts[i].r, b = acts[j].r;
          const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ix > 6 && iy > 6) over.push(`${acts[i].c} / ${acts[j].c}`);
        }
        const small = acts.filter(b => Math.min(b.r.width, b.r.height) < 36).map(b => b.c);
        return { n: acts.length, off, over, small, zoom: getComputedStyle(document.documentElement).getPropertyValue('--hud-zoom').trim() };
      }, [W, H]);
      t.check(lay.n >= 8, `${tag}: only ${lay.n} action buttons visible`);
      t.check(!lay.off.length, `${tag}: off screen: ${lay.off.join(', ')}`);
      t.check(!lay.over.length, `${tag}: buttons overlap: ${lay.over.join('; ')}`);
      t.check(!lay.small.length, `${tag}: buttons under 36 px: ${lay.small.join(', ')}`);

      // the touch joystick walks the player (a finger dragged on the left half)
      await settle();
      const p0 = await page.evaluate(() => [window.game.world.player.x, window.game.world.player.z]);
      const fx = W * 0.22, fy = H * 0.65;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fx, y: fy, id: 1 }] });
      for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fx + i * 12, y: fy, id: 1 }] }); await page.waitForTimeout(40); }
      await page.waitForFunction((p0) => Math.hypot(window.game.world.player.x - p0[0], window.game.world.player.z - p0[1]) > 0.6, p0, { timeout: 6000 }).catch(() => {});
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const p1 = await page.evaluate(() => [window.game.world.player.x, window.game.world.player.z]);
      const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      t.check(moved > 0.6 && p1[0] > p0[0], `${tag}: joystick moved the player ${moved.toFixed(2)} m`);

      // tapping the attack button swings
      await settle();
      const box = await page.locator('.act.attack').boundingBox();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }] });
      await page.waitForFunction(() => window.game.world.player.attackT > 0, null, { timeout: 4000 }).catch(() => {});
      const swung = await page.evaluate(() => window.game.world.player.attackT > 0 || window.game.world.player.comboIdx > 0);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      t.check(swung, `${tag}: tapping 攻 did not attack`);

      // getting hit asks the phone to vibrate
      await settle();
      // (god mode is off for the hit: it cancels damage before the phone is asked to buzz)
      await page.evaluate(() => { const g = window.game, w = g.world; g.cheatToggle('god'); w.player.invulnT = 0; const e = w.spawnEnemy('crawler', w.player.x + 3, w.player.z, 5, true); w.applyDamageRaw(e, w.player, 5, { kind: 'melee' }); g.cheatToggle('god'); });
      await page.waitForTimeout(300);
      t.check(await page.evaluate(() => window.__buzz.length > 0), `${tag}: no vibration when hit`);

      // Android's Back (the app sends Escape): opens the System menu, and again closes it
      await settle();
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      const opened = await page.evaluate(() => window.game.state);
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      const closed = await page.evaluate(() => window.game.state);
      t.check(opened === 'menu' && closed === 'play', `${tag}: Back went ${opened} then ${closed}`);

      // frame cost: the game's own update time per frame, on a slowed CPU for the low-end phones
      await settle();
      if (SLOW.has(dev)) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.evaluate(() => { window.__perf = []; });
      await page.waitForTimeout(4000);
      const perf = await page.evaluate(() => { const p = window.__perf; window.__perf = undefined; return p; });
      if (SLOW.has(dev)) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      // the median frame: one hitch (a model built, a texture uploaded) doesn't speak for the game's pace
      const sorted = perf.map(f => f[0]).sort((a, b) => a - b);
      const upd = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      // only the game's logic is judged: drawing here is done by a software GPU, far slower than any phone's
      t.check(perf.length > 0 && upd < 40, `${tag}: game update ${upd.toFixed(1)} ms per frame`);
      results.push(`${tag} ${W}x${H}${SLOW.has(dev) ? ' (CPU ÷4)' : ''}: zoom ${lay.zoom || 1}, update ${upd.toFixed(1)} ms`);
    } catch (e) {
      t.fail(`${tag}: ${(e?.message ?? e).split('\n').slice(0, 3).join(' / ')}`);
      await page.screenshot({ path: new URL(`../fail-dev-${tag.replace(/\W+/g, '_')}.png`, import.meta.url).pathname }).catch(() => {});
    }
    for (const e of errs) t.fail(`${tag}: page error: ${e.split('\n')[0]}`);
    await ctx.close();
  }

  // held upright, a phone asks to be turned sideways
  const ctx = await browser.newContext({ ...devices['iPhone 15'] });
  const page = await ctx.newPage();
  await page.goto(t.url);
  await page.waitForFunction(() => window.game && document.getElementById('boot') === null, null, { timeout: 90000 });
  const rot = await page.evaluate(() => { const r = document.getElementById('rotate'); return !!r && getComputedStyle(r).display !== 'none'; });
  t.check(rot, 'iPhone 15 upright: no "turn your phone" screen');
  await ctx.close();
  for (const r of results) console.log('    ' + r);
  t.note(`${results.length} devices`);
}
