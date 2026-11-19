export const name = 'sound';
export const about = 'recorded clips load after the first tap and play in a fight';

export async function run(t) {
  await t.newGame('yuji', 2);
  await t.page.waitForFunction(() => window.__dbg.samples.loaded + window.__dbg.samples.failed >= window.__dbg.samples.total, null, { timeout: 30000 }).catch(() => {});
  const s = await t.eval(() => ({ loaded: window.__dbg.samples.loaded, failed: window.__dbg.samples.failed, total: window.__dbg.samples.total }));
  t.check(s.failed === 0 && s.loaded === s.total, `clips: ${s.loaded}/${s.total} loaded, ${s.failed} failed`);
  t.note(`${s.loaded} clips`);
}
