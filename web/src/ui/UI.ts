// UI orchestration: HUD, menus, toasts, banners, title / class select, death screen.
import type { Game } from '../Game';
import { Hud } from './Hud';
import { Menus } from './Menus';
import { copyText, el, escapeHtml, formatNum } from '../core/util';
import { itemIconIfReady } from './Icons';
import { IconSpec } from '../rpg/items';
import { CLASSES, ClassDef } from '../rpg/classes';
import { unlockedClasses } from '../rpg/Unlocks';
import { ClassId } from '../rpg/types';
import { PlayerState, STAT_POINTS_PER_LEVEL } from '../rpg/PlayerState';
import { MAPS } from '../world/maps';
import { audio } from '../audio/Audio';
import { confirmDialog, slotCard } from './Confirm';
import { APP_VERSION, UpdateInfo, openReleasePage, updates, updateStatus } from '../core/Updates';
import { checkWebUpdate, isAndroidApp, isIOS, isStandalone, onWebUpdate, webUpdateReady } from '../core/Platform';
import { MediaPanel } from './MediaPanel';

export class UI {
  root: HTMLElement;
  hud: Hud | null = null;
  menus: Menus;
  private toasts: HTMLDivElement;
  private bannerEl: HTMLDivElement;
  private mapBannerEl: HTMLDivElement;
  private fade: HTMLDivElement;
  private titleEl: HTMLDivElement | null = null;
  private deathEl: HTMLDivElement | null = null;

  constructor(private game: Game) {
    this.root = document.getElementById('ui')!;
    this.toasts = el('div', 'toasts');
    this.bannerEl = el('div', 'banner hidden');
    this.mapBannerEl = el('div', 'map-banner hidden');
    this.fade = el('div', 'fade');
    this.menus = new Menus(game, this.root);
    this.root.append(this.toasts, this.bannerEl, this.mapBannerEl, this.fade);
  }

  createHud() {
    if (!this.hud) this.hud = new Hud(this.game, this.root);
    this.hud.root.classList.remove('hidden');
    this.root.insertBefore(this.hud.root, this.root.firstChild);
  }
  hideHud() { this.hud?.root.classList.add('hidden'); }

  openMenu(tab: string) {
    if (this.game.state !== 'play') return;
    audio.play('open');
    this.menus.show(tab);
  }

  toast(msg: string, kind: 'info' | 'warn' | 'good' | 'item' | 'boss' | 'quest' = 'info', dur = 2, color?: string, icon?: IconSpec) {
    const t = el('div', `toast ${kind}`);
    // toasts never paint an icon on the spot (that can stall a fight); unpainted ones are queued
    const iconUrl = icon ? itemIconIfReady(icon) : null;
    t.innerHTML = `${iconUrl ? `<img src="${iconUrl}">` : ''}<span ${color ? `style="color:${color}"` : ''}>${escapeHtml(msg)}</span>`;
    this.toasts.appendChild(t);
    while (this.toasts.childElementCount > 5) this.toasts.firstChild!.remove();
    setTimeout(() => t.classList.add('out'), dur * 1000);
    setTimeout(() => t.remove(), dur * 1000 + 500);
  }

  banner(top: string, main: string, color = '#ff3a4a', dur = 2.6) {
    const b = this.bannerEl;
    b.innerHTML = `<div class="b-top" style="color:${color}">${escapeHtml(top)}</div><div class="b-main">${escapeHtml(main)}</div><div class="b-line" style="background:${color}"></div>`;
    b.classList.remove('hidden', 'show');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout((b as any)._t);
    (b as any)._t = setTimeout(() => b.classList.add('hidden'), dur * 1000);
  }

  mapBanner(name: string, jp: string) {
    if (this.game.state === 'title') return;
    const b = this.mapBannerEl;
    b.innerHTML = `<div class="mb-jp">${escapeHtml(jp)}</div><div class="mb-name">${escapeHtml(name)}</div>`;
    b.classList.remove('hidden', 'show');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout((b as any)._t);
    (b as any)._t = setTimeout(() => b.classList.add('hidden'), 3200);
    this.hud?.buildMinimap();
  }

  async fadeOut(ms = 350) { this.fade.style.transition = `opacity ${ms}ms`; this.fade.style.opacity = '1'; await wait(ms); }
  async fadeIn(ms = 450) { this.fade.style.transition = `opacity ${ms}ms`; this.fade.style.opacity = '0'; await wait(ms); }

  levelUp(lv: number) {
    this.banner('LEVEL UP', `Level ${lv}`, '#ffd23a', 2.2);
    this.toast(`+${STAT_POINTS_PER_LEVEL} stat points, +1 skill point`, 'good', 2.5);
  }

  // ------------------------------------------------------------------
  // Death
  // ------------------------------------------------------------------
  showDeath(canHub: boolean) {
    this.deathEl?.remove();
    const d = el('div', 'death');
    d.innerHTML = `<div class="death-k">敗</div><div class="death-t">YOU HAVE FALLEN</div><div class="death-s">Your cursed energy flickers out… for now.</div>
      <div class="death-btns"><button class="btn primary" data-r="here">Revive at area entrance</button>${canHub ? '<button class="btn" data-r="hub">Return to Jujutsu High</button>' : ''}</div>
      <div class="death-p">Reviving costs 10% of your yen.</div>`;
    d.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-r]') as HTMLElement | null;
      if (!b) return;
      d.remove();
      this.deathEl = null;
      this.game.revive(b.dataset.r === 'hub');
    });
    this.root.appendChild(d);
    this.deathEl = d;
  }

  // ------------------------------------------------------------------
  // Title flow
  // ------------------------------------------------------------------
  showTitle() {
    this.hideHud();
    this.titleEl?.remove();
    const t = el('div', 'title');
    this.titleEl = t;
    this.root.appendChild(t);
    this.titleMain();
    // ask GitHub whether a newer version is out (at most every few hours; silent when offline)
    void updates.check().then(() => this.titleUpdate());
  }

  private updateHooked = false;
  /** The title's update banner, and the full notice the first time a version is found. */
  private titleUpdate() {
    if (!this.updateHooked) {
      this.updateHooked = true;
      // the web app fetches its new files as soon as a release is known, and says so once they are in
      onWebUpdate(() => this.game.toast('A new version is ready. Restart the app to play it.', 'info', 6));
      updates.onChange((u) => {
        if (u && !isAndroidApp) checkWebUpdate();
        this.titleUpdate();
        // found while playing: one quiet line, the notice waits for the title screen
        if (u && !this.titleEl && this.game.state === 'play') this.game.toast(`Update ${u.version} is out. Get it from Settings on the title screen.`, 'info', 5);
      });
    }
    const slot = this.titleEl?.querySelector('.title-update') as HTMLElement | null;
    if (!slot) return;
    const u = updates.latest;
    slot.innerHTML = u ? `<button class="upd-pill" data-a="update"><span class="upd-k">新着</span>Update ${escapeHtml(u.version)} is out <b>Get it ›</b></button>` : '';
    if (u && updates.unseen && !document.querySelector('.ccf')) void this.updateNotice(u);
  }

  async updateNotice(u: UpdateInfo) {
    updates.markSeen();
    const news = u.news.length ? `<div class="upd-news-h">What's new</div><ul class="upd-news">${u.news.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : '';
    // a release titled just "v1.7.0" says nothing the version line doesn't
    const named = !!u.name && u.name.replace(/^v/i, '') !== u.version;
    const ok = await confirmDialog({
      seal: '新着', title: `Update ${u.version} is out`,
      card: `<div class="upd-card"><div class="upd-ver"><span>v${escapeHtml(APP_VERSION)}</span><i>→</i><b>v${escapeHtml(u.version)}</b></div>${named ? `<div class="upd-name">${escapeHtml(u.name)}</div>` : ''}${news}</div>`,
      text: isAndroidApp ? 'Download the APK from the release page. It installs over this version and keeps your saves.'
        : webUpdateReady ? 'The new version is downloaded. Restart to play it; your saves stay.'
        : 'The web app downloads the new version by itself while you play. Close and reopen it (or tap Restart) to switch; your saves stay.',
      yes: isAndroidApp ? 'Get the update' : 'Restart', no: 'Later',
    });
    if (!isAndroidApp) { if (ok) { this.game.save(false); location.reload(); } return; }
    if (ok && !openReleasePage()) this.game.toast('Open github.com/TamanegiNinja25/JJK-Mobile-Game/releases in your browser.', 'warn', 6);
  }

  hideTitle() { this.titleEl?.remove(); this.titleEl = null; }

  private logo() {
    return `<div class="logo"><div class="logo-jp">呪術年代記</div><div class="logo-en">CURSED <span>CHRONICLES</span></div><div class="logo-sub">A Jujutsu Kaisen fan RPG</div></div>`;
  }

  private titleMain() {
    const t = this.titleEl!;
    const slots = [0, 1, 2].map(i => PlayerState.peek(i));
    const latest = slots.map((s, i) => ({ s, i })).filter(x => x.s).sort((a, b) => (b.s!.savedAt ?? 0) - (a.s!.savedAt ?? 0))[0];
    t.innerHTML = `${this.logo()}
      <div class="title-menu">
        ${latest ? `<button class="tbtn primary" data-a="continue">Continue <small>${CLASSES[latest.s!.cls]?.short ?? ''} · Lv ${latest.s!.level}</small></button>` : ''}
        <button class="tbtn ${latest ? '' : 'primary'}" data-a="new">New Game</button>
        ${latest ? '<button class="tbtn" data-a="load">Load Game</button>' : ''}
        <button class="tbtn" data-a="transfer">Transfer Save</button>
        <button class="tbtn" data-a="settings">Settings</button>
      </div>
      <div class="title-update"></div>
      <div class="title-foot">v${escapeHtml(APP_VERSION)} · Unofficial fan game · Not affiliated with Gege Akutami, Shueisha or MAPPA</div>`;
    this.titleUpdate();
    t.onclick = (e) => {
      const b = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!b) return;
      audio.play('click');
      const a = b.dataset.a;
      if (a === 'continue' && latest) this.game.loadGame(latest.i);
      if (a === 'new') this.slotSelect('new');
      if (a === 'load') this.slotSelect('load');
      if (a === 'settings') this.titleSettings();
      if (a === 'update' && updates.latest) void this.updateNotice(updates.latest);
      if (a === 'transfer') this.saveTransfer();
    };
  }

  /** Copy a slot out as a text code, or paste a code into a slot (survives reinstalling the app). */
  private saveTransfer(msg = '') {
    const t = this.titleEl!;
    const rows = [0, 1, 2].map(i => {
      const s = PlayerState.peek(i);
      return `<div class="slot xfer"><div class="slot-info"><div class="slot-n">Slot ${i + 1}${s ? ' · ' + (CLASSES[s.cls]?.short ?? '') : ''}</div><small>${s ? `Lv ${s.level} · ${MAPS[s.map]?.name ?? s.map}` : '— Empty —'}</small></div>
        ${s ? `<button class="btn small" data-copy="${i}">Copy code</button>` : ''}<button class="btn small primary" data-imp="${i}">Paste here</button></div>`;
    }).join('');
    t.innerHTML = `${this.logo()}<div class="slots-panel"><div class="panel-title">Transfer save</div>
      <div class="help">Copy a slot's save code and keep it somewhere safe (a note or a message to yourself). After reinstalling, or on another phone, paste it below and choose a slot.</div>
      ${rows}
      <textarea class="save-code" placeholder="Paste a save code here (starts with CC1:)" spellcheck="false"></textarea>
      ${msg ? `<div class="xfer-msg">${escapeHtml(msg)}</div>` : ''}
      <button class="tbtn back" data-back="1">Back</button></div>`;
    const area = t.querySelector('.save-code') as HTMLTextAreaElement;
    t.onclick = async (e) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[data-back]')) { audio.play('click'); this.titleMain(); return; }
      const cp = tgt.closest('[data-copy]') as HTMLElement | null;
      if (cp) {
        const code = PlayerState.exportCode(+cp.dataset.copy!);
        if (!code) return;
        area.value = code;
        const ok = await copyText(code);
        audio.play(ok ? 'save' : 'click');
        this.saveTransferMsg(t, ok ? `Slot ${+cp.dataset.copy! + 1} copied to the clipboard.` : 'Select the code in the box and copy it.');
        return;
      }
      const imp = tgt.closest('[data-imp]') as HTMLElement | null;
      if (imp) {
        const i = +imp.dataset.imp!;
        if (!area.value.trim()) { audio.play('error'); this.saveTransferMsg(t, 'Paste a save code into the box first.'); return; }
        const prev = PlayerState.peek(i);
        if (prev && !await confirmDialog({
          seal: '上書', title: `Replace slot ${i + 1} with this code?`, card: slotCard(i, prev, this.slotPortrait(prev)),
          text: 'The pasted save takes this slot\'s place, and the sorcerer above is gone for good.',
          yes: 'Hold to replace', no: 'Keep', danger: true, hold: 1100,
        })) return;
        const err = PlayerState.importCode(area.value, i);
        audio.play(err ? 'error' : 'questDone');
        this.saveTransfer(err ?? `Save imported into slot ${i + 1}.`);
      }
    };
  }

  private saveTransferMsg(t: HTMLElement, msg: string) {
    let m = t.querySelector('.xfer-msg') as HTMLElement | null;
    if (!m) { m = el('div', 'xfer-msg'); t.querySelector('.save-code')!.after(m); }
    m.textContent = msg;
  }

  private slotPortrait(s: { cls: string }) { return this.game.portraits.get(CLASSES[s.cls as ClassId]?.model ?? 'yuji'); }

  private slotSelect(mode: 'new' | 'load') {
    const t = this.titleEl!;
    const rows = [0, 1, 2].map(i => {
      const s = PlayerState.peek(i);
      if (!s) return `<div class="slot ${mode === 'load' ? 'disabled' : ''}" data-s="${i}"><div class="slot-n">Slot ${i + 1}</div><div class="slot-empty">— Empty —</div></div>`;
      const mins = Math.floor((s.playTime ?? 0) / 60);
      return `<div class="slot" data-s="${i}"><div class="slot-portrait" style="background-image:url(${this.game.portraits.get(CLASSES[s.cls]?.model ?? 'yuji')})"></div>
        <div class="slot-info"><div class="slot-n">Slot ${i + 1} · ${CLASSES[s.cls]?.short ?? ''}</div><div>Lv ${s.level} · ${MAPS[s.map]?.name ?? s.map}</div><small>¥${formatNum(s.gold)} · ${Math.floor(mins / 60)}h ${mins % 60}m · Fingers ${s.fingers}/20</small></div>
        <button class="btn small danger" data-del="${i}">Delete</button></div>`;
    }).join('');
    t.innerHTML = `${this.logo()}<div class="slots-panel"><div class="panel-title">${mode === 'new' ? 'Choose a save slot' : 'Load game'}</div>${rows}<button class="tbtn back" data-back="1">Back</button></div>`;
    t.onclick = (e) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[data-back]')) { audio.play('click'); this.titleMain(); return; }
      const del = tgt.closest('[data-del]') as HTMLElement | null;
      if (del) {
        e.stopPropagation();
        const i = +del.dataset.del!, s = PlayerState.peek(i);
        if (!s) { this.slotSelect(mode); return; }
        audio.play('click');
        void confirmDialog({
          seal: '抹消', title: 'Erase this record?', card: slotCard(i, s, this.slotPortrait(s)),
          text: `Every quest, item and level of this ${CLASSES[s.cls]?.short ?? 'sorcerer'} will be exorcised for good. Sorcerers you have unlocked stay unlocked.`,
          yes: 'Hold to erase', no: 'Keep', danger: true, hold: 1100,
        }).then(ok => {
          if (!ok) return;
          PlayerState.erase(i);
          // the title may have moved on while the seal burned; only redraw the list that was open
          if (this.titleEl?.isConnected && this.titleEl.querySelector('.slots-panel')) this.slotSelect(mode);
        });
        return;
      }
      const s = tgt.closest('[data-s]') as HTMLElement | null;
      if (!s || s.classList.contains('disabled')) return;
      audio.play('click');
      const i = +s.dataset.s!;
      if (mode === 'load') { if (PlayerState.peek(i)) this.game.loadGame(i); return; }
      const prev = PlayerState.peek(i);
      if (!prev) { this.classSelect(i); return; }
      void confirmDialog({
        seal: '上書', title: `Start over in slot ${i + 1}?`, card: slotCard(i, prev, this.slotPortrait(prev)),
        text: 'A new game here replaces this sorcerer for good once you begin. Choose an empty slot to keep both.',
        yes: 'Hold to start over', no: 'Keep', danger: true, hold: 1100,
      }).then(ok => { if (ok && this.titleEl?.isConnected) this.classSelect(i); });
    };
  }

  private classSelect(slot: number) {
    const t = this.titleEl!;
    const open = unlockedClasses();
    const ids = Object.keys(CLASSES) as ClassId[];
    let pick: ClassId = 'yuji';
    // bars compare everyone at level 50, so the unlockable sorcerers' extra growth shows
    const at50 = (c: ClassDef) => ({ hp: c.base.hp + c.base.hpLv * 49, ce: c.base.ce + c.base.ceLv * 49, atk: c.base.atk + c.base.atkLv * 49, def: c.base.def + c.base.defLv * 49 });
    const top = { hp: 0, ce: 0, atk: 0, def: 0 };
    for (const id of ids) { const v = at50(CLASSES[id]); for (const k of Object.keys(top) as (keyof typeof top)[]) top[k] = Math.max(top[k], v[k]); }
    const render = () => {
      const chips = ids.map(id => {
        const c = CLASSES[id], locked = !open.has(id);
        return `<div class="cschip ${pick === id ? 'sel' : ''} ${locked ? 'locked' : ''}" data-c="${id}" style="--c:${c.color}">
          <div class="cp" style="background-image:url(${this.game.portraits.get(c.model)})"></div><div class="cn">${escapeHtml(c.short)}</div></div>`;
      }).join('');
      const c = CLASSES[pick], locked = !open.has(pick), v = at50(c);
      const bars = (['hp', 'ce', 'atk', 'def'] as const).map(k => `<div class="cbar"><span>${k.toUpperCase()}</span><div><i style="width:${Math.round(v[k] / top[k] * 100)}%;background:${c.color}"></i></div></div>`).join('');
      t.innerHTML = `<div class="class-select"><div class="panel-title big">Choose your sorcerer</div><div class="cs-row">${chips}</div>
        <div class="cs-detail ${locked ? 'locked' : ''}" style="--c:${c.color}">
          <div class="cportrait art" style="background-image:url(${this.game.busts.url(c.model)}), radial-gradient(circle at 50% 45%, ${c.color}aa, #0c0a14 75%)"></div>
          <div class="cs-info"><div class="cname">${escapeHtml(c.name)}</div><div class="ctitle">${escapeHtml(c.title)}</div>
            ${locked ? `<div class="cs-lock">🔒 ${escapeHtml(c.unlock ?? '')}</div>` : c.unlock ? '<div class="cs-lock open">Unlocked</div>' : ''}
            <div class="cdesc">${escapeHtml(c.desc)}</div>${bars}</div>
        </div>
        <div class="cs-btns"><button class="tbtn back" data-back="1">Back</button><button class="tbtn primary" data-go="1" ${locked ? 'disabled' : ''}>${locked ? 'Locked' : `Begin — ${escapeHtml(c.short)}`}</button></div></div>`;
    };
    render();
    t.onclick = (e) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[data-back]')) { audio.play('click'); this.slotSelect('new'); return; }
      if (tgt.closest('[data-go]')) { if (!open.has(pick)) { audio.play('error'); return; } audio.play('questAccept'); this.game.newGame(pick, slot); return; }
      const c = tgt.closest('[data-c]') as HTMLElement | null;
      if (c) { pick = c.dataset.c as ClassId; audio.play('tab'); render(); }
    };
  }

  /**
   * The main menu's Settings: sound and graphics, and (since 1.7.9) the player's own pictures, sounds and
   * 3D models and the update check, which used to sit in the in-game System tab.
   */
  private titleSettings() {
    const t = this.titleEl!;
    const s = this.game.settings;
    const q = (v: string, l: string) => `<button class="chip ${s.quality === v ? 'on' : ''}" data-q="${v}">${l}</button>`;
    const sx = (v: 'recorded' | 'synth', l: string) => `<button class="chip ${(s.sfxStyle ?? 'recorded') === v ? 'on' : ''}" data-sx="${v}">${l}</button>`;
    const u = updates.latest;
    const status = escapeHtml(updateStatus());
    const keep = (t.querySelector('.slots-panel.settings') as HTMLElement | null)?.scrollTop ?? 0;
    t.innerHTML = `<div class="slots-panel settings"><div class="panel-title">Settings</div>
      <label class="set"><span>Music</span><input type="range" min="0" max="100" value="${Math.round(s.music * 100)}" data-set="music"></label>
      <label class="set"><span>Effects</span><input type="range" min="0" max="100" value="${Math.round(s.sfx * 100)}" data-set="sfx"></label>
      <label class="set"><span>Ambience</span><input type="range" min="0" max="100" value="${Math.round(s.amb * 100)}" data-set="amb"></label>
      <div class="set-label">Sound effects</div><div class="chips">${sx('recorded', 'Recorded')}${sx('synth', 'Synthesised')}</div>
      <div class="panel-title">Graphics</div><div class="chips">${q('low', 'Low')}${q('medium', 'Medium')}${q('high', 'High')}</div>
      <div class="panel-title">Your own files</div>
      <button class="btn wide" data-a="media">Your Pictures, Sounds &amp; Models</button>
      <div class="help">Your own character pictures, 3D models, sound effects and music, picked from this phone. They stay on it.</div>
      <div class="panel-title">Updates</div>
      <div class="help">This is version <b>${escapeHtml(APP_VERSION)}</b>. ${u ? `<b class="upd-new">${status}</b>` : status}</div>
      <div class="set-btns">${u ? '<button class="btn primary" data-a="getupdate">Get the update</button>' : ''}<button class="btn" data-a="checkupdate" ${updates.status === 'checking' ? 'disabled' : ''}>Check for updates</button></div>
      <button class="tbtn back" data-back="1">Back</button></div>`;
    (t.querySelector('.slots-panel.settings') as HTMLElement).scrollTop = keep;
    for (const inp of Array.from(t.querySelectorAll('input[data-set]')) as HTMLInputElement[]) {
      inp.addEventListener('input', () => { (s as any)[inp.dataset.set!] = +inp.value / 100; this.game.applySettings(); });
    }
    t.onclick = (e) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[data-back]')) { audio.play('click'); this.titleMain(); return; }
      const qb = tgt.closest('[data-q]') as HTMLElement | null;
      if (qb) { s.quality = qb.dataset.q as any; s.autoQ = false; this.game.applySettings(); this.titleSettings(); return; }
      const sb = tgt.closest('[data-sx]') as HTMLElement | null;
      if (sb) { s.sfxStyle = sb.dataset.sx as 'recorded' | 'synth'; this.game.applySettings(); audio.play('punch'); audio.play('click', { delay: 0.25 }); this.titleSettings(); return; }
      const a = (tgt.closest('[data-a]') as HTMLElement | null)?.dataset.a;
      if (a === 'media') { audio.play('click'); this.titleMedia(); }
      if (a === 'checkupdate') {
        audio.play('click');
        void updates.check(true).then((nu) => { audio.play(nu ? 'questAccept' : 'tab'); if (this.titleEl?.querySelector('.slots-panel.settings')) this.titleSettings(); });
        this.titleSettings();
      }
      if (a === 'getupdate' && updates.latest) { audio.play('click'); void this.updateNotice(updates.latest); }
    };
  }

  /** Your Pictures, Sounds & Models, on the title screen; Back returns to Settings. */
  private titleMedia() {
    const t = this.titleEl!;
    t.onclick = null;
    t.innerHTML = '<div class="title-media"></div>';
    new MediaPanel(this.game, t.querySelector('.title-media') as HTMLElement, () => this.titleSettings()).render();
  }

  /** First screen: needed so the audio context unlocks on a user gesture. */
  showTapToStart(onGo: () => void) {
    const t = el('div', 'title tap');
    t.innerHTML = `${this.logo()}<div class="tap-hint">TAP TO START</div><div class="title-foot">Best played in landscape · Headphones recommended</div>${isIOS && !isStandalone() ? `<div class="ios-install">To install: tap <b>Share</b> <span class="ios-share"></span> then <b>Add to Home Screen</b>. It then runs full screen and offline.</div>` : ''}`;
    this.root.appendChild(t);
    const go = () => { t.remove(); onGo(); };
    t.addEventListener('click', go, { once: true });
    t.addEventListener('touchend', (e) => { e.preventDefault(); go(); }, { once: true });
  }
}

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }
