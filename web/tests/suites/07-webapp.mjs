export const name = 'webapp';
export const about = 'the iPhone/iPad web app: offline copy, offline restart, rotate screen, install hint';
export const dir = 'dist';
export const query = '?sw=1';
export const context = { viewport: { width: 844, height: 390 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

export async function run(t) {
  const st = await t.eval(async () => {
    const r = await Promise.race([navigator.serviceWorker.ready, new Promise(res => setTimeout(() => res(null), 15000))]);
    await new Promise(res => setTimeout(res, 6000));
    let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length;
    return { sw: !!r?.active, cached: n, files: (await (await fetch('sw.js')).text()).match(/FILES = (\[.*\]);/)?.[1].split(',').length };
  });
  t.check(st.sw, 'service worker did not activate');
  t.check(st.cached >= st.files, `offline copy has ${st.cached} of ${st.files} files`);
  t.check(await t.eval(() => !!document.querySelector('.ios-install')), 'no install hint on the iPhone title screen');
  await t.ctx.setOffline(true);
  await t.page.reload();
  await t.page.waitForFunction(() => window.game?.state === 'title', null, { timeout: 30000 }).catch(() => {});
  t.check(await t.eval(() => window.game?.state) === 'title', 'did not restart offline');
  await t.ctx.setOffline(false);
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(500);
  t.check(await t.eval(() => getComputedStyle(document.getElementById('rotate')).display) === 'flex', 'no rotate screen in portrait');
  t.note(`${st.cached} files cached`);
}
