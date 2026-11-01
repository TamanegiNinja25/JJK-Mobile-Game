// Cutscenes. The director takes the camera and freezes play for short cinematic moments — a domain
// expansion cut-in, a boss rising, a chapter clear, the ending — and gives the big story conversations
// a letterboxed, slowly moving camera with a title card while the visual-novel dialogue plays.
import * as THREE from 'three';
import type { Game } from '../Game';
import type { Actor } from '../entities/Actor';
import { audio } from '../audio/Audio';
import { el, escapeHtml } from '../core/util';
import { CHAPTERS, SceneSpec } from '../data/story';
import { CLASSES } from '../rpg/classes';

/** Domain names as the cut-in shows them: Japanese, English. */
export const DOMAIN_NAMES: Record<string, [string, string]> = {
  shrine: ['伏魔御廚子', 'Malevolent Shrine'], shadow: ['嵌合暗翳庭', 'Chimera Shadow Garden'], nails: ['共鳴り・千本釘', 'Resonance: Thousand Nails'],
  void: ['無量空処', 'Unlimited Void'], coffin: ['蓋棺鉄囲山', 'Coffin of the Iron Mountain'], sea: ['蕩蘊平線', 'Horizon of the Captivating Skandha'],
  hands: ['自閉円頓裹', 'Self-Embodiment of Perfection'], court: ['誅伏賜死', 'Deadly Sentencing'], womb: ['胎蔵遍野', 'Womb Profusion'],
  home: ['帰郷', 'Homecoming'], moon: ['時胞月宮殿', 'Time Cell Moon Palace'], love: ['真贋相愛', 'Authentic Mutual Love'],
};

const KANJI_NUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const ease = (k: number) => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);

interface Run {
  dur: number;
  t: number;
  update: (t: number, dt: number) => void;
  end: () => void;
  /** actors kept animating while play is frozen */
  actors: Actor[];
}

export class Director {
  private root: HTMLDivElement;
  private card: HTMLDivElement;
  private chapterEl: HTMLDivElement;
  private run: Run | null = null;
  private scene: { spec: SceneSpec; t: number; x: number; z: number; a0: number } | null = null;
  /** where the last cut left the camera, so play can ease back from it */
  private cut = { p: new THREE.Vector3(), l: new THREE.Vector3(), blend: 0 };
  private tmpP = new THREE.Vector3();
  private tmpL = new THREE.Vector3();
  /** things waiting for the current cutscene to finish (a conversation, the next quest) */
  private queue: (() => void)[] = [];

  constructor(private game: Game, parent: HTMLElement) {
    this.root = el('div', 'cine hidden');
    this.card = el('div', 'cine-card');
    const skip = el('button', 'cine-skip', 'SKIP ▶▶');
    this.root.append(el('div', 'cine-tint'), el('div', 'cine-lines'), el('div', 'cine-bar top'), el('div', 'cine-bar bot'), this.card, skip);
    this.chapterEl = el('div', 'chapter-card hidden');
    parent.append(this.root, this.chapterEl);
    const doSkip = (e: Event) => { e.preventDefault(); e.stopPropagation(); this.skip(); };
    this.root.addEventListener('click', doSkip);
    this.root.addEventListener('touchstart', doSkip, { passive: false });
    window.addEventListener('keydown', (e) => { if (this.run && !this.game.dialogue.active && (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); e.stopImmediatePropagation(); this.skip(); } }, true);
    this.root.style.setProperty('--lines', `url(${focusLines()})`);
  }

  /** Run `fn` now, or as soon as the cutscene on screen ends. */
  after(fn: () => void) {
    if (this.run) this.queue.push(fn); else fn();
  }

  get busy() { return !!this.run; }
  private get mode() { return this.game.settings.cutscenes; }

  // ------------------------------------------------------------------ running

  private start(cls: string, run: Omit<Run, 't'>) {
    this.run = { ...run, t: 0 };
    this.root.className = 'cine ' + cls;
    document.body.classList.add('cine-on');
    this.game.world.hideGuideArrow();
    this.game.setState('cutscene');
  }

  private stop() {
    const r = this.run;
    if (!r) return;
    this.run = null;
    if (!this.scene) { this.root.className = 'cine hidden'; document.body.classList.remove('cine-on'); }
    this.cut.blend = 0.6;
    this.game.setState('play');
    r.end();
    // whatever was waiting runs next (it may start another cutscene, which keeps the rest waiting)
    while (this.queue.length && !this.run) this.queue.shift()!();
  }

  skip() {
    const r = this.run;
    if (!r || r.t < 0.25) return;
    r.t = r.dur;
  }

  /**
   * End the cutscene on screen right away. A map change mid-cutscene must call this: the scene would
   * otherwise stay "running" while the game plays on, and everything queued behind it (dialogues,
   * boss intros and outros, reports) would wait forever.
   */
  finishNow() {
    const r = this.run;
    if (!r) return;
    r.t = r.dur;
    try { r.update(r.t, 0); } catch { /* a scene that can't draw its last frame still ends */ }
    this.stop();
  }

  /** Called every frame while a cutscene holds the game (state 'cutscene'). */
  update(dt: number) {
    const r = this.run;
    if (!r) { this.game.setState('play'); return; }
    r.t = Math.min(r.dur, r.t + dt);
    r.update(r.t, dt);
    const w = this.game.world;
    for (const a of r.actors) if (a.model) { a.model.root.visible = true; a.model.root.position.set(a.x, a.y, a.z); a.model.root.rotation.y = a.facing; a.model.update(dt); }
    w.fx.update(dt * 0.15);
    w.updateFrustum();
    if (r.t >= r.dur) this.stop();
  }

  private place(px: number, py: number, pz: number, lx: number, ly: number, lz: number) {
    const cam = this.game.r.camera;
    cam.position.set(px, py, pz);
    cam.lookAt(lx, ly, lz);
    this.cut.p.set(px, py, pz);
    this.cut.l.set(lx, ly, lz);
  }

  /** After a cut, ease the gameplay camera back from the cutscene's last framing. */
  blend(dt: number) {
    const c = this.cut;
    if (c.blend <= 0) return;
    c.blend = Math.max(0, c.blend - dt);
    const k = ease(c.blend / 0.6);
    const r = this.game.r, cam = r.camera;
    this.tmpP.copy(cam.position).lerp(c.p, k);
    this.tmpL.set(r.target.x, 0.8, r.target.z).lerp(c.l, k);
    cam.position.copy(this.tmpP);
    cam.lookAt(this.tmpL);
    this.game.world.updateFrustum();
  }

  /** Camera framing a point in front of an actor: `dist` out along its facing, `side` to its left. */
  private front(a: Actor, dist: number, side: number, h: number, lookH: number) {
    const f = a.facing, fx = Math.sin(f), fz = Math.cos(f);
    this.place(a.x + fx * dist + fz * side, a.y + h, a.z + fz * dist - fx * side, a.x, a.y + lookH, a.z);
  }

  private heightOf(a: Actor) { return Math.max(1.2, a.model?.height ?? 1.8); }

  // ------------------------------------------------------------------ cut-ins

  /** Domain Expansion: close on the caster's hand sign, 領域展開, the domain's name, then a flash into it. */
  domainCutIn(caster: Actor, kind: string, enemy: boolean, done: () => void) {
    if (this.mode === 'off' || this.run || this.game.state !== 'play') { done(); return; }
    const short = this.mode === 'short';
    const dur = short ? 1.35 : 2.6;
    const [jp, en] = DOMAIN_NAMES[kind] ?? ['領域展開', 'Domain Expansion'];
    this.card.innerHTML = `<div class="cd-sign"><span>領域展開</span></div><div class="cd-name"><div class="cd-jp">${escapeHtml(jp)}</div><div class="cd-en">DOMAIN EXPANSION · ${escapeHtml(en.toUpperCase())}</div></div>`;
    const h = this.heightOf(caster);
    caster.model?.play('domain', dur);
    let flashed = false, sounded = false;
    this.start(`dom ${enemy ? 'enemy' : 'ally'} k-${kind}`, {
      dur, actors: [caster],
      update: (t) => {
        const k = t / dur;
        if (!sounded && k > 0.08) { sounded = true; audio.play('domain'); }
        this.root.classList.toggle('s1', k > 0.1);
        this.root.classList.toggle('s2', k > (short ? 0.3 : 0.42));
        const e = ease(k);
        // the face sits a little below centre, clear of the 領域展開 band across the top
        this.front(caster, h * (1.75 - e * 0.65), h * (0.45 - e * 0.75), h * (0.74 + e * 0.06), h * 0.92);
        if (!flashed && k > 0.9) { flashed = true; this.game.world.fx.flash(enemy ? '#ff2a3a' : '#ffffff', 0.85, 0.5); }
      },
      end: done,
    });
  }

  /** A boss rises: the camera finds it from a low angle and its name is written across the screen. */
  bossCutIn(boss: Actor, grade: string, name: string, jp: string, done: () => void) {
    if (this.mode === 'off' || this.run) { done(); return; }
    const short = this.mode === 'short';
    const dur = short ? 1.1 : 2.0;
    this.card.innerHTML = `<div class="cb-grade">${escapeHtml(grade)}</div><div class="cb-name">${escapeHtml(name)}</div>${jp ? `<div class="cb-jp">${escapeHtml(jp)}</div>` : ''}`;
    const h = this.heightOf(boss);
    boss.model?.play('castUp', dur);
    // face the player as it rises
    const p = this.game.world.player;
    boss.facing = Math.atan2(p.x - boss.x, p.z - boss.z);
    this.start('boss', {
      dur, actors: [boss],
      update: (t) => {
        const e = ease(t / dur);
        this.root.classList.toggle('s1', t > dur * 0.12);
        this.front(boss, h * (3.1 - e * 0.8), h * (-0.6 + e * 1.0), h * (0.42 + e * 0.12), h * 0.72);
      },
      end: done,
    });
  }

  /** The last quest of a chapter is done: a slow turn around the player, and the chapter's name. */
  chapterClear(ch: number, done: () => void) {
    const c = CHAPTERS[ch];
    if (this.run) { this.queue.push(() => this.chapterClear(ch, done)); return; }
    if (!c || this.mode === 'off') { if (c) this.game.toast(`Chapter ${ch} clear — ${c.name}`, 'quest', 3); done(); return; }
    const short = this.mode === 'short';
    const dur = short ? 2.8 : 5.2;
    this.card.innerHTML = `<div class="cc-kicker">CHAPTER ${ch}</div><div class="cc-jp">第${KANJI_NUM[ch] ?? ch}章 完</div><div class="cc-title">${escapeHtml(c.name)}</div><div class="cc-sub">CLEAR</div>`;
    const p = this.game.world.player;
    p.model?.play('victory', Math.min(dur, 2.4));
    audio.play('questDone');
    const h = this.heightOf(p), a0 = p.facing + 0.9;
    this.start('chapter', {
      dur, actors: [p],
      update: (t) => {
        const e = ease(t / dur);
        this.root.classList.toggle('s1', t > 0.35);
        this.root.classList.toggle('s2', t > (short ? 0.9 : 1.6));
        const a = a0 - e * 1.6, rad = h * (2.4 - e * 0.5);
        this.place(p.x + Math.sin(a) * rad, p.y + h * (0.6 + e * 0.25), p.z + Math.cos(a) * rad, p.x, p.y + h * 0.62, p.z);
      },
      end: done,
    });
  }

  /** The end of the main story: credits over a long, slow turn around the player. */
  ending(lines: string[], done: () => void) {
    if (this.run) { this.queue.push(() => this.ending(lines, done)); return; }
    if (this.mode === 'off') { done(); return; }
    const dur = this.mode === 'short' ? 6 : 13;
    this.card.innerHTML = `<div class="ce-roll">${lines.map(l => l ? `<div>${escapeHtml(l)}</div>` : '<br>').join('')}</div>`;
    const p = this.game.world.player;
    p.model?.play('victory', 2.4);
    const h = this.heightOf(p), a0 = p.facing;
    this.start('ending', {
      dur, actors: [p],
      update: (t) => {
        const e = t / dur;
        (this.card.firstElementChild as HTMLElement).style.transform = `translateY(${(1 - e) * 60 - e * 110}vh)`;
        const a = a0 + e * Math.PI * 1.2, rad = h * (3.2 + e * 1.4);
        this.place(p.x + Math.sin(a) * rad, p.y + h * (1 + e * 0.8), p.z + Math.cos(a) * rad, p.x, p.y + h * 0.6, p.z);
      },
      end: done,
    });
  }

  /** A new chapter begins: its name across the top of the screen while play goes on. */
  chapterTitle(ch: number) {
    const c = CHAPTERS[ch];
    if (!c || this.mode === 'off') return;
    const e = this.chapterEl;
    e.innerHTML = `<div class="ct-jp">第${KANJI_NUM[ch] ?? ch}章</div><div class="ct-kicker">CHAPTER ${ch}</div><div class="ct-title">${escapeHtml(c.name)}</div>`;
    e.classList.remove('hidden', 'show');
    void e.offsetWidth;
    e.classList.add('show');
    clearTimeout((e as any)._t);
    (e as any)._t = setTimeout(() => e.classList.add('hidden'), 4200);
  }

  // ------------------------------------------------------------------ story scenes

  /**
   * Stage a story conversation: a short title shot, then `play` runs the dialogue under a letterboxed
   * camera that keeps moving until `endScene`. Skipped straight to `play` when cutscenes are off.
   */
  beginScene(spec: SceneSpec, play: () => void) {
    if (this.run) { this.queue.push(() => this.beginScene(spec, play)); return; }
    const cls = this.game.ps ? CLASSES[this.game.ps.d.cls].persona : undefined;
    if (this.mode === 'off' || (spec.only && (!cls || !spec.only.includes(cls)))) { play(); return; }
    const p = this.game.world.player;
    this.scene = { spec, t: 0, x: p.x, z: p.z, a0: p.facing + 0.7 };
    const tint = spec.tint ? ` tint-${spec.tint}` : '';
    if (spec.shake) this.game.world.fx.shake(spec.shake, 0.8);
    if (!spec.title || this.mode === 'short') {
      this.root.className = 'cine scene' + tint;
      document.body.classList.add('cine-on');
      play();
      return;
    }
    this.card.innerHTML = `${spec.kicker ? `<div class="cs-kicker">${escapeHtml(spec.kicker)}</div>` : ''}${spec.jp ? `<div class="cs-jp">${escapeHtml(spec.jp)}</div>` : ''}<div class="cs-title">${escapeHtml(spec.title)}</div>`;
    this.start('scene intro' + tint, {
      dur: 2.6, actors: [p],
      update: (t, dt) => { this.root.classList.toggle('s1', t > 0.3); this.sceneCamera(dt); },
      end: () => { this.root.className = 'cine scene' + tint; play(); },
    });
  }

  endScene() {
    if (!this.scene) return;
    this.scene = null;
    if (!this.run) { this.root.className = 'cine hidden'; document.body.classList.remove('cine-on'); this.cut.blend = 0.6; }
  }

  get inScene() { return !!this.scene; }

  /** Drives the camera during a staged conversation; false when no scene is on. */
  sceneCamera(dt: number): boolean {
    const s = this.scene;
    if (!s) return false;
    s.t += dt;
    const p = this.game.world.player;
    const h = this.heightOf(p);
    const cam = s.spec.cam ?? 'orbit';
    const k = Math.min(1, s.t / 30);
    if (cam === 'low') {
      const a = s.a0 - 0.4 + k * 0.5, rad = h * 2.6;
      this.place(s.x + Math.sin(a) * rad, h * 0.35, s.z + Math.cos(a) * rad, s.x, h * 1.15, s.z);
    } else if (cam === 'close') {
      const a = p.facing + 0.5 - k * 0.3, rad = h * (1.7 - k * 0.2);
      this.place(p.x + Math.sin(a) * rad, p.y + h * 0.8, p.z + Math.cos(a) * rad, p.x, p.y + h * 0.75, p.z);
    } else {
      const a = s.a0 + s.t * 0.06, rad = h * 4.2;
      this.place(s.x + Math.sin(a) * rad, h * 2.2, s.z + Math.cos(a) * rad, s.x, h * 0.75, s.z);
    }
    this.game.world.updateFrustum();
    return true;
  }
}

let linesUrl = '';
/** Anime focus lines (集中線): thin wedges from the edge toward the middle, drawn once. */
function focusLines(): string {
  if (linesUrl) return linesUrl;
  const N = 512, c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d')!;
  x.translate(N / 2, N / 2);
  for (let i = 0; i < 140; i++) {
    const a = (i / 140) * Math.PI * 2 + Math.random() * 0.03;
    const inner = N * (0.2 + Math.random() * 0.16), w = 0.004 + Math.random() * 0.012;
    x.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.5})`;
    x.beginPath();
    x.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    x.lineTo(Math.cos(a - w) * N * 0.75, Math.sin(a - w) * N * 0.75);
    x.lineTo(Math.cos(a + w) * N * 0.75, Math.sin(a + w) * N * 0.75);
    x.closePath();
    x.fill();
  }
  linesUrl = c.toDataURL();
  return linesUrl;
}
