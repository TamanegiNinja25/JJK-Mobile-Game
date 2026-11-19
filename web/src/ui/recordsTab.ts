// The Records tab: Boss Rush, totals, achievements, best boss times and the bestiary.
import type { PlayerState } from '../rpg/PlayerState';
import { records, rushPool, ACHIEVEMENTS, fmtTime } from '../rpg/Records';
import { ENEMIES, GRADE_NAME } from '../rpg/enemies';
import { CLASSES } from '../rpg/classes';
import { DIFFICULTY } from '../core/Difficulty';
import { escapeHtml } from '../core/util';

export type RecView = 'ach' | 'boss' | 'beasts';

export function renderRecords(ps: PlayerState, view: RecView) {
  const r = records();
  const pool = rushPool(ps);
  const got = ACHIEVEMENTS.filter(a => r.ach[a.id]).length;
  const curses = Object.values(ENEMIES).filter(e => e.ai !== 'dummy');
  const seen = curses.filter(e => r.beasts[e.id]).length;
  const tab = (v: string, l: string) => `<button class="chip ${view === v ? 'on' : ''}" data-act="recview" data-v="${v}">${l}</button>`;
  let list = '';
  if (view === 'ach') {
    list = `<div class="rec-grid">${ACHIEVEMENTS.map(a => `<div class="rec-ach ${r.ach[a.id] ? 'got' : ''}"><div class="rec-seal">${escapeHtml(a.jp)}</div><div><b>${escapeHtml(a.name)}</b><div class="help">${escapeHtml(a.desc)}</div></div></div>`).join('')}</div>`;
  } else if (view === 'boss') {
    const bosses = curses.filter(e => e.ai === 'boss').sort((a, b) => a.level - b.level);
    list = `<div class="rec-list">${bosses.map(e => { const b = r.boss[e.id]; return `<div class="rec-row ${b ? '' : 'dim'}"><span>${r.beasts[e.id] ? escapeHtml(e.name) : '???'}</span><span>${b ? `${fmtTime(b.secs)} <small>${escapeHtml(DIFFICULTY[b.diff as keyof typeof DIFFICULTY]?.label ?? '')} · ${escapeHtml(CLASSES[b.cls as keyof typeof CLASSES]?.short ?? '')}</small>` : '—'}</span></div>`; }).join('')}</div>`;
  } else {
    list = `<div class="rec-list">${curses.sort((a, b) => a.level - b.level).map(e => { const n = r.beasts[e.id] ?? 0; return `<div class="rec-row ${n ? '' : 'dim'}"><span>${n ? escapeHtml(e.name) : '???'}</span><span>${n ? `${GRADE_NAME[e.grade]} · ×${n}` : ''}</span></div>`; }).join('')}</div>`;
  }
  return `<div class="records">
    <div class="rec-top">
      <div class="rec-card"><div class="panel-title">Boss Rush</div>
        <div class="help">Up to six bosses you have already beaten, back to back at your level, against the clock. You keep 40% of your HP between fights; falling ends the run. Best: <b>${r.rush.best !== undefined ? fmtTime(r.rush.best) : '—'}</b>${r.rush.bestDiff ? ` (${escapeHtml(DIFFICULTY[r.rush.bestDiff as keyof typeof DIFFICULTY]?.label ?? '')})` : ''} · cleared ${r.rush.clears}×</div>
        <button class="btn primary wide" data-act="rush" ${pool.length < 3 || ps.d.level < 20 ? 'disabled' : ''}>${pool.length < 3 || ps.d.level < 20 ? 'Needs level 20 and three bosses beaten in the story' : `Start Boss Rush (${Math.min(6, pool.length)} bosses)`}</button></div>
      <div class="rec-card"><div class="panel-title">Totals</div>
        <div class="help">Achievements <b>${got}/${ACHIEVEMENTS.length}</b> · Bestiary <b>${seen}/${curses.length}</b><br>Curses exorcised ${r.n.kills.toLocaleString()} · Boss fights won ${r.n.bosses} · Black Flashes ${r.n.bf} · Domains and ultimates ${r.n.domains}</div></div>
    </div>
    <div class="chips">${tab('ach', 'Achievements')}${tab('boss', 'Boss Times')}${tab('beasts', 'Bestiary')}</div>
    ${list}
  </div>`;
}
