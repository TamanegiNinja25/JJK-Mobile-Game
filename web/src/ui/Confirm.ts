// A themed yes/no dialog in place of the browser's confirm(), which on Android shows a bare system box
// headed by the app's web address. It looks like a sealed talisman: a red hanko stamps down when it
// opens, and for anything that destroys progress (erasing or overwriting a save) the confirm button
// has to be held while the seal burns, so a stray tap can't wipe a run. The paper burns away when
// the hold completes.

import { audio } from '../audio/Audio';
import { el, escapeHtml, formatNum } from '../core/util';
import { CLASSES } from '../rpg/classes';
import { CHAPTERS, QUESTS } from '../data/story';
import { MAPS } from '../world/maps';
import type { SaveData } from '../rpg/types';

export interface ConfirmOpts {
  /** the stamp, e.g. 抹消 (erase) */
  seal: string;
  title: string;
  /** trusted HTML shown between the title and the text (built here, never from player input) */
  card?: string;
  text?: string;
  yes: string;
  no?: string;
  /** red styling, for actions that lose something */
  danger?: boolean;
  /** milliseconds the confirm button must be held (0: a tap is enough) */
  hold?: number;
}

let current: { close: (v: boolean) => void } | null = null;

export function confirmDialog(o: ConfirmOpts): Promise<boolean> {
  current?.close(false);
  return new Promise((resolve) => {
    const hold = o.hold ?? 0;
    const root = el('div', `ccf${o.danger ? ' danger' : ''}`);
    root.setAttribute('role', 'alertdialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `<div class="ccf-card">
        <div class="ccf-seal" aria-hidden="true">${[...o.seal].map(ch => `<span>${escapeHtml(ch)}</span>`).join('')}</div>
        <div class="ccf-title">${escapeHtml(o.title)}</div>
        ${o.card ?? ''}
        ${o.text ? `<div class="ccf-text">${escapeHtml(o.text)}</div>` : ''}
        <div class="ccf-btns">
          <button class="ccf-no" data-no="1">${escapeHtml(o.no ?? 'Cancel')}</button>
          <button class="ccf-yes${hold ? ' hold' : ''}" data-yes="1" style="--hold:${hold}ms"><i class="ccf-fill"></i><span>${escapeHtml(o.yes)}</span></button>
        </div>
        <div class="ccf-hint">${hold ? 'Keep holding until the seal burns.' : ''}</div>
        <i class="ccf-ember"></i>
      </div>`;
    document.body.appendChild(root);
    audio.play('seal');
    const card = root.querySelector('.ccf-card') as HTMLElement;
    const yes = root.querySelector('.ccf-yes') as HTMLButtonElement;
    const no = root.querySelector('.ccf-no') as HTMLButtonElement;
    let done = false, timer = 0;

    const close = (v: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      // while it fades or burns it is only a picture: a new dialog or tap goes past it
      root.dataset.closing = '1';
      root.style.pointerEvents = 'none';
      window.removeEventListener('keydown', onKey, true);
      if (current?.close === close) current = null;
      const finish = () => { root.remove(); resolve(v); };
      if (v && o.danger) {
        // the talisman burns away from the bottom up
        audio.play('erase');
        card.classList.add('burn');
        setTimeout(finish, 650);
      } else {
        if (!v) audio.play('close');
        root.classList.add('out');
        setTimeout(finish, 140);
      }
    };
    current = { close };

    const onKey = (e: KeyboardEvent) => {
      // the Android back button arrives as Escape: it cancels the dialog and nothing underneath
      if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(false); }
      else if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !hold) { e.preventDefault(); e.stopImmediatePropagation(); close(true); }
    };
    window.addEventListener('keydown', onKey, true);

    no.onclick = (e) => { e.stopPropagation(); close(false); };
    root.addEventListener('pointerdown', (e) => { if (e.target === root) close(false); });
    if (!hold) yes.onclick = (e) => { e.stopPropagation(); audio.play('click'); close(true); };
    else {
      const release = () => {
        if (done || !yes.classList.contains('holding')) return;
        yes.classList.remove('holding');
        clearTimeout(timer);
        // letting go early explains itself instead of doing nothing; the hint stays up until the next press
        root.classList.add('nudge');
      };
      yes.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (done) return;
        try { yes.setPointerCapture(e.pointerId); } catch { /* an old WebView without pointer capture */ }
        root.classList.remove('nudge');
        yes.classList.add('holding');
        audio.play('charge', { vol: 0.5 });
        clearTimeout(timer);
        timer = window.setTimeout(() => close(true), hold);
      });
      yes.addEventListener('pointerup', release);
      yes.addEventListener('pointercancel', release);
      yes.addEventListener('lostpointercapture', release);
      yes.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    no.focus({ preventScroll: true });
  });
}

/** A save slot's summary for the dialogs that would erase or replace it. */
export function slotCard(slot: number, s: SaveData, portrait: string) {
  const c = CLASSES[s.cls];
  const mins = Math.floor((s.playTime ?? 0) / 60);
  const done = Object.entries(s.quests ?? {}).filter(([, q]) => q?.state === 'done').map(([id]) => id);
  const mains = QUESTS.filter(q => q.type === 'main');
  const doneMain = mains.filter(q => done.includes(q.id));
  const at = mains.find(q => !done.includes(q.id));
  const chapter = at?.chapter ?? mains[mains.length - 1]?.chapter ?? 1;
  const story = at ? `Chapter ${chapter} · ${CHAPTERS[chapter]?.name ?? ''}` : 'Story complete';
  const when = s.savedAt ? lastPlayed(s.savedAt) : '';
  return `<div class="ccf-slot">
      <div class="ccf-port" style="background-image:url(${portrait});--c:${c?.color ?? '#8a6aff'}"></div>
      <div class="ccf-info">
        <div class="ccf-who">Slot ${slot + 1} · ${escapeHtml(c?.name ?? s.cls)}</div>
        <div>Lv ${s.level} · ${escapeHtml(MAPS[s.map]?.name ?? s.map)}</div>
        <div class="ccf-story">${escapeHtml(story)} · ${doneMain.length}/${mains.length} story quests · ${done.length} quests in all</div>
        <small>¥${formatNum(s.gold)} · ${Math.floor(mins / 60)}h ${mins % 60}m · Fingers ${s.fingers}/20${when ? ' · ' + when : ''}</small>
      </div>
    </div>`;
}

function lastPlayed(t: number) {
  const d = Date.now() - t;
  if (d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), days = Math.floor(h / 24);
  if (m < 2) return 'played just now';
  if (h < 1) return `played ${m} min ago`;
  if (days < 1) return `played ${h} h ago`;
  if (days < 30) return `played ${days} day${days > 1 ? 's' : ''} ago`;
  return 'played ' + new Date(t).toLocaleDateString();
}
