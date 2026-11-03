// Visual-novel dialogue: the two people talking stand in large art (the player on the left, whoever
// they are talking to on the right). The speaker is lit and moves their mouth in time with a voice of
// their own; text types out with natural pauses, and Auto / Skip work like any dating sim.
import { guestLine } from '../data/guestVoice';
import type { Game } from '../Game';
import { Line, Choice, NPC_NAMES, NPC_JP } from '../data/story';
import { audio } from '../audio/Audio';
import { voice, voiceFor } from '../audio/Voice';
import { el, escapeHtml } from '../core/util';
import { CLASSES } from '../rpg/classes';
import { sukunaLine } from '../data/sukunaVoice';
import type { Mood } from './Busts';
import { BG } from './Portraits';

/** A guess at the speaker's expression from what they say. */
function moodOf(l: Line): Mood {
  if (l.mood) return l.mood;
  const t = l.text;
  if (/\?!|!\?|!!/.test(t) || /^(What|Huh|Wait)\b.*[!?]/.test(t)) return 'surprised';
  if (/\b(ha){2,}|\bheh\b|hehe|\bhah\b|\byo!|\bperfect!|\bthank (you|the gods)/i.test(t)) return 'happy';
  if (/!/.test(t) && /\b(never|dare|damn|kill|die|enough|shut up|get out|bastard|stop|unforgivable|take it off|pay for)\b/i.test(t)) return 'angry';
  if (/^\.\.\.|^…|\b(sorry|I can't|don't make it easier|lonely|gone now|cried)\b/i.test(t)) return 'sad';
  return 'neutral';
}

class Stand {
  root: HTMLDivElement;
  private c: [HTMLCanvasElement, HTMLCanvasElement];
  id = '';
  private mood = '';
  constructor(side: 'left' | 'right', parent: HTMLElement) {
    this.root = el('div', `vn-stand ${side} empty`);
    this.c = [el('canvas', 'vn-art shut'), el('canvas', 'vn-art open')];
    for (const c of this.c) { c.width = 384; c.height = 512; this.root.appendChild(c); }
    parent.appendChild(this.root);
  }

  /** Show a character in a mood; returns false when there's nobody to draw. */
  show(game: Game, id: string, mood: Mood): boolean {
    if (id === this.id && mood === this.mood) return true;
    const art = game.busts.get(id, mood);
    if (!art) { this.clear(); return false; }
    const swap = id !== this.id;
    for (let i = 0; i < 2; i++) {
      // the canvas takes the art's own size (the CSS sets how big it shows)
      const c = this.c[i];
      if (c.width !== art[i].width || c.height !== art[i].height) { c.width = art[i].width; c.height = art[i].height; }
      const x = c.getContext('2d')!; x.clearRect(0, 0, c.width, c.height); x.drawImage(art[i], 0, 0);
    }
    this.root.style.setProperty('--glow', BG[id]?.[0] ?? '#9a7aff');
    this.root.classList.toggle('own', game.busts.isOwn(id));
    this.root.classList.remove('empty');
    if (swap) { this.root.classList.remove('enter', 'hop'); void this.root.offsetWidth; this.root.classList.add('enter'); this.entered = true; }
    this.id = id;
    this.mood = mood;
    return true;
  }

  clear() { this.id = ''; this.mood = ''; this.root.classList.add('empty'); }
  set lit(on: boolean) { this.root.classList.toggle('lit', on); }
  set talking(open: boolean) { this.root.classList.toggle('talk', open); }
  /** set when someone new steps in: their slide-in plays instead of the hop */
  private entered = false;
  hop() {
    if (this.entered) { this.entered = false; return; }
    this.root.classList.remove('hop', 'enter'); void this.root.offsetWidth; this.root.classList.add('hop');
  }
}

export class Dialogue {
  root: HTMLDivElement;
  private left: Stand;
  private right: Stand;
  private box: HTMLDivElement;
  private plate: HTMLDivElement;
  private nameEl: HTMLSpanElement;
  private jpEl: HTMLSpanElement;
  private textEl: HTMLDivElement;
  private choicesEl: HTMLDivElement;
  private hint: HTMLDivElement;
  private autoBtn: HTMLButtonElement;
  private skipBtn: HTMLButtonElement;
  private lines: Line[] = [];
  private idx = 0;
  private full = '';
  private shown = 0;
  private typing = false;
  private timer = 0;
  /** extra wait after punctuation while typing */
  private pause = 0;
  private onEnd: (() => void) | null = null;
  private choices: Choice[] | undefined;
  active = false;
  private speaker = '';
  private talker: Stand | null = null;
  private skipping = false;
  private autoT = 0;
  private sylGap = 0;
  private mouthT = 0;
  private flapT = 0;

  constructor(private game: Game, parent: HTMLElement) {
    this.root = el('div', 'vn hidden');
    const stage = el('div', 'vn-stage');
    this.left = new Stand('left', stage);
    this.right = new Stand('right', stage);
    this.box = el('div', 'vn-box');
    this.plate = el('div', 'vn-plate');
    this.nameEl = el('span', 'vn-name');
    this.jpEl = el('span', 'vn-jp');
    this.plate.append(this.nameEl, this.jpEl);
    this.textEl = el('div', 'vn-text');
    this.hint = el('div', 'vn-hint', '▼');
    const ctrl = el('div', 'vn-ctrl');
    this.autoBtn = el('button', 'vn-btn', 'AUTO');
    this.skipBtn = el('button', 'vn-btn', 'SKIP ▶▶');
    ctrl.append(this.autoBtn, this.skipBtn);
    this.box.append(this.plate, this.textEl, this.hint, ctrl);
    this.choicesEl = el('div', 'vn-choices');
    this.root.append(stage, this.box, this.choicesEl);
    parent.appendChild(this.root);
    const tap = (e: Event, f: () => void) => { e.preventDefault(); e.stopPropagation(); f(); };
    this.autoBtn.addEventListener('click', (e) => tap(e, () => this.toggleAuto()));
    this.autoBtn.addEventListener('touchstart', (e) => tap(e, () => this.toggleAuto()), { passive: false });
    this.skipBtn.addEventListener('click', (e) => tap(e, () => this.toggleSkip()));
    this.skipBtn.addEventListener('touchstart', (e) => tap(e, () => this.toggleSkip()), { passive: false });
    const adv = (e: Event) => { if ((e.target as HTMLElement).closest('.vn-choice, .vn-btn')) return; e.preventDefault(); e.stopPropagation(); this.skipping = false; this.syncCtrl(); this.advance(); };
    this.root.addEventListener('click', adv);
    this.root.addEventListener('touchstart', adv, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      const n = /^Digit([1-9])$/.exec(e.code);
      if (n) { (this.choicesEl.children[+n[1] - 1] as HTMLElement | undefined)?.click(); return; }
      if (e.code === 'KeyA') { this.toggleAuto(); return; }
      if (e.code === 'Escape') { this.toggleSkip(); return; }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyJ' || e.code === 'KeyF') { e.preventDefault(); this.advance(); }
    });
    this.syncCtrl();
  }

  private get auto() { return !!this.game.settings.vnAuto; }

  private toggleAuto() {
    this.game.settings.vnAuto = !this.auto;
    this.game.saveSettings();
    audio.play('tab');
    this.syncCtrl();
  }

  private toggleSkip() {
    this.skipping = !this.skipping;
    audio.play('tab');
    this.syncCtrl();
  }

  private syncCtrl() {
    this.autoBtn.classList.toggle('on', this.auto);
    this.skipBtn.classList.toggle('on', this.skipping);
  }

  play(lines: Line[], opts: { choices?: Choice[]; onEnd?: () => void } = {}) {
    // the unlockable sorcerers speak a first-year's lines; the King of Curses gets his own
    const def = this.game.ps ? CLASSES[this.game.ps.d.cls] : undefined;
    const cls = def?.persona;
    const flags = this.game.ps?.d.flags ?? {};
    const id = this.game.ps?.d.cls ?? '';
    // a guest's own words come from a first-year's player lines (see ClassDef.voiceFrom)
    const pv = def?.voiceFrom ?? cls;
    const fits = (l: Line) => {
      const v = l.who === 'player' && !l.cls ? pv : cls;
      return (!l.only || (!!v && l.only.includes(v))) && (!l.not || !v || !l.not.includes(v));
    };
    const voice = def?.voice;
    this.lines = lines.filter(l => fits(l)
        && (!l.cls || l.cls.includes(id)) && (!l.notCls || !l.notCls.includes(id))
        && (!l.ifFlag || !!flags[l.ifFlag]) && (!l.unlessFlag || !flags[l.unlessFlag]))
      .map(l => {
        // a guest who is someone in the story (Yuta, Toji) speaks that someone's lines as they are
        if (def?.self && l.who === def.self) return { ...l, who: 'player' };
        if (l.who !== 'player' || l.cls) return l;
        if (voice === 'sukuna') return { ...l, text: sukunaLine(l.text) };
        // a guest re-voices only the first-year's own lines; lines written for anyone stay as they are
        if (voice === 'yuta' || voice === 'toji') return l.only ? { ...l, text: guestLine(voice, l.text) } : l;
        return l;
      })
      .filter(l => l.text !== '');
    this.idx = 0;
    this.onEnd = opts.onEnd ?? null;
    this.choices = opts.choices;
    const wasActive = this.active;
    this.active = true;
    this.root.classList.remove('hidden');
    document.body.classList.add('vn-on');
    this.choicesEl.innerHTML = '';
    this.game.setState('dialogue');
    if (!this.lines.length) { this.finish(); return; }
    // the player stands on the left from the start, the first person they talk to on the right
    if (!wasActive) { this.left.clear(); this.right.clear(); }
    this.left.show(this.game, this.playerModel(), 'neutral');
    const other = this.lines.find(l => l.who !== 'player' && l.who !== 'narrator');
    if (other && this.right.id !== this.artId(other.who)) this.right.show(this.game, this.artId(other.who), moodOf(other));
    this.show();
  }

  private playerModel() { return this.game.ps ? CLASSES[this.game.ps.d.cls].model : 'yuji'; }
  /** whose art a speaker uses: civilians and students share stock figures */
  private artId(who: string) { return who === 'player' ? this.playerModel() : who; }

  private show() {
    const l = this.lines[this.idx];
    const ps = this.game.ps;
    const who = this.artId(l.who);
    this.speaker = who;
    const narr = l.who === 'narrator';
    const name = l.who === 'player' ? (ps ? CLASSES[ps.d.cls].name : '') : NPC_NAMES[l.who] ?? l.who;
    this.nameEl.textContent = name;
    this.jpEl.textContent = narr ? '' : NPC_JP[who] ?? '';
    this.plate.style.display = narr ? 'none' : '';
    this.root.classList.toggle('narration', narr);
    this.root.classList.toggle('sukuna', l.who === 'sukuna');
    // who stands where: the player on the left, anyone else takes the right
    this.talker = null;
    if (!narr) {
      const mood = moodOf(l);
      let st: Stand;
      if (l.who === 'player') st = this.left;
      else st = this.right;
      if (st.show(this.game, who, mood)) { this.talker = st; st.hop(); }
    }
    this.left.lit = this.talker === this.left;
    this.right.lit = this.talker === this.right;
    this.root.classList.toggle('speaker-right', this.talker === this.right);
    this.box.style.setProperty('--plate', BG[who]?.[0] ?? '#8a6aff');
    const first = ps ? CLASSES[ps.d.cls].name.split(' ')[0] : '';
    this.full = l.text.replace(/\{name\}/g, first);
    this.shown = 0;
    this.pause = 0;
    this.timer = 0;
    this.autoT = 0;
    this.sylGap = 0;
    this.typing = true;
    this.textEl.innerHTML = '';
    this.hint.style.visibility = 'hidden';
    voice.stop();
    if (!narr && !this.skipping) voice.speak(this.full, voiceFor(who));
    if (l.sfx) audio.play(l.sfx);
    if (l.emote) this.game.npcEmote(l.who, l.emote);
  }

  update(dt: number) {
    if (!this.active) return;
    // mouth: shut unless a syllable or the speech engine says otherwise
    this.mouthT -= dt;
    if (voice.speaking && this.talker) { this.flapT -= dt; if (this.flapT <= 0) { this.flapT = 0.11 + Math.random() * 0.05; this.mouthT = this.flapT * 0.6; } }
    if (this.talker) this.talker.talking = this.mouthT > 0;
    this.setModelTalking(this.typing || voice.speaking);
    if (this.skipping) {
      this.autoT += dt;
      if (this.autoT > 0.07) { this.autoT = 0; if (this.typing) this.complete(); else if (!this.choicesEl.childElementCount) this.next(); }
      return;
    }
    if (this.typing) {
      if (this.pause > 0) { this.pause -= dt; return; }
      this.timer += dt;
      const cps = 52 * (this.game.settings.textSpeed ?? 1);
      const target = Math.min(this.full.length, Math.floor(this.timer * cps));
      const prof = voiceFor(this.speaker);
      this.sylGap -= dt;
      while (this.shown < target) {
        const ch = this.full[this.shown++];
        const nx = this.full[this.shown] ?? ' ';
        // a syllable on each new vowel group, no faster than the character talks
        if (/[aeiouyAEIOUY]/.test(ch) && !/[aeiouyAEIOUY]/.test(this.full[this.shown - 2] ?? ' ') && this.sylGap <= 0 && this.speaker !== 'narrator') {
          const dur = 0.7 / prof.rate;
          // spoken lines carry their own sound; generated voices fill in if the phone can't speak
          if (voice.mode === 'gen' || voice.mode === 'tts' && !voice.speaking) voice.syllable(prof, dur, nx === '!' ? 2 : 0);
          else if (voice.mode === 'off') audio.play('dialog', { pitch: prof.f0 / 140, vol: 0.5 });
          this.sylGap = 1 / prof.rate;
          this.mouthT = dur * 0.8;
        }
        if (/[,;:]/.test(ch) && nx === ' ') { this.pause = 0.09; this.timer = this.shown / cps; break; }
        if (/[.!?…—]/.test(ch) && (nx === ' ' || nx === '"')) { this.pause = 0.2; this.timer = this.shown / cps; break; }
      }
      this.textEl.innerHTML = escapeHtml(this.full.slice(0, this.shown));
      if (this.shown >= this.full.length) this.doneTyping();
      return;
    }
    if (this.auto && !this.choicesEl.childElementCount && !voice.speaking) {
      this.autoT += dt;
      if (this.autoT > 0.9 + this.full.length * 0.025) this.next();
    }
  }

  private talkingModel: { talking?: boolean } | null = null;
  /** The speaker's figure in the world moves its mouth while the line is being said. */
  private setModelTalking(on: boolean) {
    const w = this.game.world;
    const l = this.lines[this.idx];
    const m = !on || !l ? null : l.who === 'player' ? w.player?.model : w.npcs.find(n => n.id === l.who)?.model;
    if (this.talkingModel && this.talkingModel !== m) this.talkingModel.talking = false;
    if (m) m.talking = true;
    this.talkingModel = m ?? null;
  }

  private doneTyping() {
    this.typing = false;
    this.timer = 0;
    this.autoT = 0;
    this.hint.style.visibility = 'visible';
  }

  private complete() {
    this.shown = this.full.length;
    this.textEl.innerHTML = escapeHtml(this.full);
    this.doneTyping();
  }

  advance() {
    if (!this.active) return;
    if (this.typing) { this.complete(); return; }
    if (this.choicesEl.childElementCount) return;
    this.next();
  }

  private next() {
    this.idx++;
    this.timer = 0;
    if (this.idx < this.lines.length) { audio.play('click', { vol: 0.4 }); this.show(); return; }
    if (this.choices?.length) { this.skipping = false; this.syncCtrl(); this.showChoices(); return; }
    this.finish();
  }

  private showChoices() {
    const cs = this.choices!;
    this.choices = undefined;
    this.choicesEl.innerHTML = '';
    voice.stop();
    for (const c of cs) {
      const b = el('button', 'vn-choice', escapeHtml(c.text));
      const pick = (e: Event) => {
        e.preventDefault(); e.stopPropagation();
        audio.play('click');
        if (c.flag && this.game.ps) this.game.ps.d.flags[c.flag] = true;
        this.choicesEl.innerHTML = '';
        const end = this.onEnd;
        this.play(c.reply, { onEnd: end ?? undefined });
      };
      b.addEventListener('click', pick);
      b.addEventListener('touchstart', pick, { passive: false });
      this.choicesEl.appendChild(b);
    }
  }

  private finish() {
    this.active = false;
    this.skipping = false;
    this.syncCtrl();
    voice.stop();
    this.root.classList.add('hidden');
    document.body.classList.remove('vn-on');
    this.left.talking = false;
    this.right.talking = false;
    this.setModelTalking(false);
    this.game.setState('play');
    const cb = this.onEnd;
    this.onEnd = null;
    cb?.();
  }
}
