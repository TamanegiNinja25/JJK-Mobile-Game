export const name = 'controls';
export const about = 'difficulty scaling, a game controller, tablet-sized controls';
export const context = { viewport: { width: 1366, height: 1024 } };

export async function run(t) {
  // a fake controller the game polls like a real one
  await t.eval(() => {
    window.__pad = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    navigator.getGamepads = () => [window.__pad];
  });
  await t.newGame('yuji', 2);
  await t.eval(() => window.game.cheatToggle('god'));

  // tablet: the HUD grows with the screen
  const zoom = await t.eval(() => +getComputedStyle(document.documentElement).getPropertyValue('--hud-zoom'));
  t.check(zoom > 1.2, `auto control size on a 1366x1024 tablet is ${zoom}`);
  const big = await t.eval(() => document.querySelector('.act')?.getBoundingClientRect().width ?? 0);
  await t.eval(() => { window.game.settings.uiScale = 1; window.game.applySettings(); });
  const normal = await t.eval(() => document.querySelector('.act')?.getBoundingClientRect().width ?? 0);
  t.check(big > normal * 1.15, `buttons not larger with auto size (${big} vs ${normal})`);
  await t.eval(() => { window.game.settings.uiScale = 'auto'; window.game.applySettings(); });

  // controller: the stick walks, A attacks, Start opens the menu
  const p0 = await t.eval(() => [window.game.world.player.x, window.game.world.player.z]);
  // software rendering can run at a few frames a second (each frame's step is capped), so hold the stick until
  // the player has covered some ground rather than for a fixed time
  await t.eval(() => { window.__pad.axes[0] = 1; });
  await t.page.waitForFunction((x0) => window.game.world.player.x - x0 > 0.8, p0[0], { timeout: 5000 }).catch(() => {});
  await t.eval(() => { window.__pad.axes[0] = 0; });
  const p1 = await t.eval(() => [window.game.world.player.x, window.game.world.player.z]);
  t.check(p1[0] - p0[0] > 0.8, `left stick did not move the player (${(p1[0] - p0[0]).toFixed(2)})`);
  const atk0 = await t.eval(() => window.game.world.player.attackT);
  await t.eval(() => { window.__pad.buttons[0] = { pressed: true, value: 1 }; });
  await t.wait(120);
  await t.eval(() => { window.__pad.buttons[0] = { pressed: false, value: 0 }; });
  await t.wait(120);
  const atk1 = await t.eval(() => window.game.world.player.attackT);
  t.check(atk1 > 0 && atk1 !== atk0, `A did not attack (${atk0} -> ${atk1})`);
  await t.eval(() => { window.__pad.buttons[9] = { pressed: true, value: 1 }; });
  await t.wait(200);
  await t.eval(() => { window.__pad.buttons[9] = { pressed: false, value: 0 }; });
  await t.wait(300);
  t.check(await t.eval(() => window.game.state) === 'menu', 'Start did not open the menu');
  await t.eval(() => { window.__pad.buttons[1] = { pressed: true, value: 1 }; });
  await t.wait(200);
  await t.eval(() => { window.__pad.buttons[1] = { pressed: false, value: 0 }; });
  await t.wait(400);
  t.check(await t.eval(() => window.game.state) === 'play', `B did not close the menu (${await t.eval(() => window.game.state)})`);

  // difficulty: the same curse has more health and hits harder on Hard
  const r = await t.eval(() => {
    const g = window.game, w = g.world, out = {};
    for (const d of ['easy', 'normal', 'hard']) {
      g.settings.difficulty = d; g.applySettings();
      const e = w.spawnEnemy('crawler', w.player.x + 30, w.player.z + 30, 10, true);
      out[d] = { hp: e.maxHp, atk: Math.round(e.atk * 100) / 100 };
      e.dispose?.();
    }
    g.settings.difficulty = 'normal'; g.applySettings();
    return out;
  });
  t.check(r.easy.hp < r.normal.hp && r.normal.hp < r.hard.hp, `health by difficulty ${JSON.stringify(r)}`);
  t.check(r.easy.atk < r.normal.atk && r.normal.atk < r.hard.atk, `damage by difficulty ${JSON.stringify(r)}`);
  // accessibility: reduce flashing softens screen flashes; text size enlarges text
  const a11y = await t.eval(() => {
    const g = window.game, fx = g.world.fx;
    g.settings.calm = 'on'; g.applySettings();
    // a stand-in element records the opacities the flash is given
    const seen = [], real = fx.flashEl;
    fx.flashEl = { offsetWidth: 0, style: new Proxy({}, { set(o, k, v) { if (k === 'opacity') seen.push(+v); o[k] = v; return true; } }) };
    fx.flash('#ffffff', 0.85, 0.5);
    fx.flashEl = real;
    const calmOp = Math.max(...seen);
    const calmed = fx.calm;
    g.settings.calm = 'off'; g.settings.textSize = 1.3; g.applySettings();
    const big = document.documentElement.classList.contains('ts') && getComputedStyle(document.documentElement).getPropertyValue('--ts').trim();
    g.settings.textSize = 1; g.applySettings();
    return { calmed, calmOp, big, after: document.documentElement.classList.contains('ts') };
  });
  t.check(a11y.calmed && a11y.calmOp <= 0.2, `reduce flashing: ${JSON.stringify(a11y)}`);
  t.check(a11y.big === '1.3' && !a11y.after, `text size: ${JSON.stringify(a11y)}`);
  t.note(`zoom ${zoom}, hp ${r.easy.hp}/${r.normal.hp}/${r.hard.hp}`);
}
