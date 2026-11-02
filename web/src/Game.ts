// Top-level controller: main loop, state machine, saving, travel, dialogue/quest flow.
import { LINE_BY_ID, QuestLine } from './rpg/Reruns';
import { QuestHints } from './rpg/Hints';
import { Renderer, Quality } from './render/Renderer';
import { Overlay2D } from './ui/Overlay2D';
import { World } from './world/World';
import { Input } from './core/Input';
import { UI } from './ui/UI';
import { Dialogue } from './ui/Dialogue';
import { Portraits } from './ui/Portraits';
import { Busts } from './ui/Busts';
import { voice, VoiceMode } from './audio/Voice';
import { PlayerState } from './rpg/PlayerState';
import { runCheat, toggleCheat } from './rpg/Cheats';
import { ClassId, ItemInstance } from './rpg/types';
import { CLASSES } from './rpg/classes';
import { QUEST_BY_ID, QUESTS, IDLE, Line, NPC_NAMES, SceneSpec, Choice, QuestDef } from './data/story';
import { Director } from './world/Director';
import { media } from './core/CustomMedia';
import { NPC } from './entities/NPC';
import { MAPS } from './world/maps';
import { audio } from './audio/Audio';
import { music } from './audio/Music';
import { IconSpec, ITEMS } from './rpg/items';
import { setIconWarmGate, warmIcons } from './ui/Icons';
import { classSkills } from './rpg/skills';
import './rpg/skillsUnlock';
import './rpg/skillsGuest';
import { formatNum, pick, rand } from './core/util';
import { Loot } from './entities/Loot';
import { checkUnlocks, isUnlocked } from './rpg/Unlocks';
import { occlusion } from './render/toon';

export type GameState = 'boot' | 'title' | 'play' | 'dialogue' | 'menu' | 'dead' | 'loading' | 'cutscene';

/** The last main quest of each chapter (its report ends the chapter), and the first (its offer starts one). */
const CHAPTER_END = new Map<number, string>();
const CHAPTER_START = new Map<number, string>();
for (const q of QUESTS) if (q.type === 'main') { CHAPTER_END.set(q.chapter, q.id); if (!CHAPTER_START.has(q.chapter)) CHAPTER_START.set(q.chapter, q.id); }

const CREDITS = [
  'CURSED CHRONICLES', '— THE END —', '',
  'An unofficial fan game inspired by', 'Jujutsu Kaisen and Zenonia', '',
  'Jujutsu Kaisen © Gege Akutami / Shueisha', '',
  'Every model, sound, song and voice', 'is generated in code', '',
  'Thank you for playing.', '',
  'The story goes on:', 'Tengen has asked for you,', 'the hills past the east gate are full of curses,', 'and the King of Curses can now fight at your side.',
];

const SETTINGS_KEY = 'cursedChronicles.settings';

export class Game {
  r: Renderer;
  overlay: Overlay2D;
  world: World;
  input = new Input();
  ui: UI;
  dialogue: Dialogue;
  portraits: Portraits;
  busts: Busts;
  director: Director;
  ps: PlayerState | null = null;
  state: GameState = 'boot';
  private dtS = 1 / 60;
  settings = {
    music: 0.55, sfx: 0.85, amb: 0.6, quality: 'high' as Quality, zoom: 1, autoQ: true, shake: 1,
    /** dialogue voices: generated per character, spoken by the phone's text-to-speech, or simple blips */
    voice: 'gen' as VoiceMode, voiceVol: 0.9, textSpeed: 1, vnAuto: false,
    /** story cutscenes and domain cut-ins */
    cutscenes: 'full' as 'full' | 'short' | 'off',
    /** hints when a quest step has stalled for a few minutes */
    hints: 'on' as 'on' | 'off',
    /** shouts, grunts and cries in combat, in each character's voice */
    barks: 'on' as 'on' | 'off',
    /** sound effects: recorded takes (Kenney's CC0 packs) over the synth, or synthesised only */
    sfxStyle: 'recorded' as 'recorded' | 'synth',
  };
  hints = new QuestHints(this);
  private last = performance.now();
  private autosaveT = 0;
  private titleT = 0;
  private fpsAcc = 0;
  private fpsN = 0;
  private slowSecs = 0;
  fps = 60;

  constructor() {
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    this.r = new Renderer(canvas);
    this.loadSettings();
    this.r.setQuality(this.settings.quality);
    this.overlay = new Overlay2D(document.getElementById('overlay') as HTMLCanvasElement, this.r);
    this.world = new World(this, this.r, this.overlay);
    this.portraits = new Portraits(this.r);
    this.busts = new Busts(this.r);
    this.ui = new UI(this);
    this.dialogue = new Dialogue(this, this.ui.root);
    this.director = new Director(this, this.ui.root);
    media.onChange = () => { this.ui.hud?.refreshPortrait(); music.refresh(); };
    window.addEventListener('resize', () => { this.r.resize(); this.overlay.resize(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.save(false); audio.ctx?.suspend(); } else if (this.state !== 'boot') audio.ctx?.resume();
    });
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'play') return;
      const tabs: Record<string, string> = { KeyI: 'bag', KeyK: 'skills', KeyL: 'quests', KeyM: 'map', Escape: 'system', KeyC: 'status' };
      if (tabs[e.code]) { e.preventDefault(); this.ui.openMenu(tabs[e.code]); }
    });
  }

  /** The player's stored 3D models have been read (at start-up): characters already on screen put theirs on. */
  onCustomModels() {
    if (this.ps && this.world.player) this.world.refreshModels();
    this.ui.hud?.refreshPortrait();
  }

  start() {
    // A lightweight title backdrop: Jujutsu High with the camera drifting.
    this.ps = PlayerState.fresh('yuji', -1);
    this.world.loadMap('hub');
    this.world.player.model!.root.visible = false;
    this.state = 'title';
    document.getElementById('boot')?.remove();
    this.ui.showTapToStart(() => {
      audio.unlock();
      this.applySettings();
      music.play('title');
      music.resume();
      this.ui.showTitle();
    });
    requestAnimationFrame(this.frame);
  }

  private frame = (t: number) => {
    requestAnimationFrame(this.frame);
    let dt = (t - this.last) / 1000;
    this.last = t;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) return;
    // Phones hand out slightly uneven frame times (16, 18, 15 ms...), which shows up as stutter in
    // anything moving. Smooth small wobbles; a real hitch is taken as-is so the game doesn't lag behind.
    this.dtS += (dt - this.dtS) * (Math.abs(dt - this.dtS) > 0.04 ? 1 : 0.2);
    dt = this.dtS;
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 1) { this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0; this.autoQuality(); }
    this.input.update();
    const t0 = performance.now();
    try {
      this.update(dt);
    } catch (err) {
      console.error(err);
    }
    const t1 = performance.now();
    this.r.render();
    const t2 = performance.now();
    this.overlay.draw(dt);
    // frame profiler for automated tests: window.__perf = [] turns it on
    const perf = (window as any).__perf as number[][] | undefined;
    if (perf) perf.push([t1 - t0, t2 - t1, performance.now() - t2]);
  };

  private update(dt: number) {
    switch (this.state) {
      case 'title': {
        this.titleT += dt;
        occlusion.uOccOn.value = 0;
        const a = this.titleT * 0.05;
        const w = this.world;
        w.fx.update(dt);
        w.weather.update(dt, 0, 0);
        for (const n of w.npcs) n.update(dt);
        this.r.camera.position.set(Math.sin(a) * 26, 14, Math.cos(a) * 26 + 2);
        this.r.camera.lookAt(0, 2, -6);
        w.updateFrustum();
        this.r.target.set(0, 0, 0);
        this.r.sun.target.position.set(0, 0, 0);
        this.r.sun.position.set(-20, 30, 20);
        return;
      }
      case 'play':
        occlusion.uOccOn.value = 1;
        this.world.update(dt);
        this.ui.hud?.update(dt);
        this.hints.update(dt);
        if (this.ps) { this.selfErrands(dt); this.rerunWatch(dt); }
        this.director.blend(dt);
        if (this.outroQ && (this.outroQ.t -= dt) <= 0 && this.state === 'play') { const o = this.outroQ; this.outroQ = null; this.say(o.lines, o.spec); }
        if (this.rerunReport && (this.rerunReport.t -= dt) <= 0) {
          const id = this.rerunReport.id;
          this.rerunReport = null;
          if (this.ps?.questState(id)?.state === 'ready' && this.ps.inRerunLine(id)) { this.ps.complete(id); this.world.refreshNpcs(); this.world.refreshGuide(); this.save(false); }
        }
        this.autosaveT += dt;
        if (this.autosaveT > 60) { this.autosaveT = 0; this.save(false); }
        break;
      case 'dialogue':
        this.dialogue.update(dt);
        this.world.fx.update(dt);
        if (this.director.sceneCamera(dt)) occlusion.uOccOn.value = 0; else this.world.followCamera(dt);
        for (const n of this.world.npcs) n.update(dt);
        this.world.player.syncModel(dt);
        break;
      case 'cutscene':
        // the wall fade follows the play camera; a cutscene camera elsewhere would dither the wrong things
        occlusion.uOccOn.value = 0;
        this.director.update(dt);
        break;
      case 'menu':
      case 'dead':
        this.world.fx.update(dt);
        this.world.followCamera(dt);
        if (this.state === 'dead') this.world.player.syncModel(dt);
        break;
      default:
        break;
    }
  }

  setState(s: GameState) {
    if (this.state === 'title' && s === 'play') return;
    this.state = s;
    this.input.enabled = s === 'play';
    if (s !== 'play') this.input.releaseAll();
  }

  // ------------------------------------------------------------------
  // Settings
  // ------------------------------------------------------------------
  private loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) Object.assign(this.settings, JSON.parse(raw));
      else {
        // pick a sensible default for phones
        const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (mobile) this.settings.quality = 'medium';
      }
    } catch { /* storage unavailable */ }
  }

  /** Steps graphics down a tier when play stays below ~24 fps, unless the player picked a quality. */
  private autoQuality() {
    const s = this.settings;
    if (!s.autoQ || this.state !== 'play' || s.quality === 'low') { this.slowSecs = 0; return; }
    this.slowSecs = this.fps < 24 ? this.slowSecs + 1 : 0;
    if (this.slowSecs < 6) return;
    this.slowSecs = 0;
    s.quality = s.quality === 'high' ? 'medium' : 'low';
    this.applySettings();
    this.toast(`Graphics set to ${s.quality === 'low' ? 'Low' : 'Medium'} to keep the game smooth`, 'info', 3);
  }

  applySettings() {
    const s = this.settings;
    audio.volumes.music = s.music;
    audio.volumes.sfx = s.sfx;
    audio.volumes.amb = s.amb;
    audio.recorded = s.sfxStyle !== 'synth';
    audio.applyVolumes();
    if (this.r.quality !== s.quality) {
      this.r.setQuality(s.quality);
      this.world.fx.quality = s.quality === 'low' ? 0.5 : s.quality === 'medium' ? 0.75 : 1;
    }
    this.r.zoom = s.zoom;
    this.r.shakeScale = s.shake;
    voice.mode = s.voice;
    voice.volume = s.voiceVol;
    voice.barks = s.barks !== 'off';
    this.saveSettings();
  }

  saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
  }

  // ------------------------------------------------------------------
  // Game lifecycle
  // ------------------------------------------------------------------
  private bindPlayerEvents(ps: PlayerState) {
    ps.on((ev, data) => {
      // new loot gets its icon painted in the background before the bag is next opened
      if (ev === 'inventory') warmIcons([], ps.d.inventory.map(it => ITEMS[it.base].icon), true);
      if (ev === 'levelup') {
        audio.play('levelup');
        this.ui.levelUp(data);
        const p = this.world.player;
        if (p) { this.world.fx.pillar(p.x, p.z, 1.2, 5, 0xffd23a, 1.2); this.world.fx.burst(p.x, 1, p.z, 0xffe08a, 40, 6, 0.25, 1); }
      }
      if (ev === 'questAccept') {
        audio.play('questAccept');
        const rr = ps.inRerunLine(data.id) ? ps.d.reruns?.active : null;
        this.toast(rr ? `Rerun ${rr.run}: ${data.name}` : `Quest accepted: ${data.name}`, 'quest', 2.5);
        if (data.type === 'main' && CHAPTER_START.get(data.chapter) === data.id) this.director.chapterTitle(data.chapter);
      }
      if (ev === 'questReady') {
        audio.play('questDone');
        // a rerun reports itself a moment later; the story's quests go back to whoever gave them
        if (ps.inRerunLine(data.id)) this.rerunReport = { id: data.id, t: 1.2 };
        else this.toast(`Objective complete — report to ${NPC_NAMES[ps.turnInOf(data)] ?? ''}`, 'quest', 3);
      }
      if (ev === 'rerunStart') { this.world.refreshNpcs(); this.world.refreshGuide(); this.save(false); }
      if (ev === 'rerunQuest') this.toast(`${data.q.name} cleared · +${formatNum(data.exp)} EXP · ¥${formatNum(data.gold)}`, 'good', 3);
      if (ev === 'rerunEnd') {
        const { line, finished, run, mastery } = data as { line: QuestLine; finished: boolean; run?: number; mastery?: { exp: number; seals: number } | null };
        if (finished) {
          audio.play(mastery ? 'rare' : 'questDone');
          this.toast(mastery ? `${line.name} mastered! Run ${run} · +${mastery.seals} Special Grade Seals` : `Rerun ${run} complete: ${line.name}`, 'quest', 4.5);
        } else this.toast(`Rerun abandoned: ${line?.name ?? ''}. The line is back as it was.`, 'info', 3);
        this.rerunReport = null;
        this.world.refreshNpcs();
        this.world.refreshGuide();
        this.save(false);
      }
      if (ev === 'rewardSpill') {
        // a full bag never eats a reward: it lands at the player's feet until there is room
        const p = this.world.player;
        for (const it of data as ItemInstance[]) this.world.loot.push(new Loot(this.world, p.x + rand(-0.8, 0.8), p.z + rand(-0.8, 0.8), 0, it));
        this.toast('Bag full — rewards dropped at your feet', 'warn', 3);
      }
      if (ev === 'questDone') {
        this.toast(`Quest complete: ${data.name}`, 'quest', 3);
        this.announceUnlocks(checkUnlocks(ps.d));
      }
      if (ev === 'invFull') this.toast('Inventory full!', 'warn');
      if (ev === 'inventory' || ev === 'stats' || ev === 'skills' || ev === 'gold') this.ui.menus.refresh();
    });
  }

  private async enterWorld(ps: PlayerState, map: string, x?: number, z?: number) {
    await this.ui.fadeOut(300);
    this.ui.hideTitle();
    this.ps = ps;
    this.bindPlayerEvents(ps);
    // the title backdrop used a throwaway player; rebuild for the real save
    if (this.world.player) { this.world.player.dispose(); (this.world as any).player = undefined; }
    this.world.loadMap(map, x, z);
    this.world.player.model!.root.visible = true;
    this.ui.createHud();
    this.ui.hud!.buildMinimap();
    // the player's dialogue art, drawn behind the loading fade (this also readies its shaders)
    this.busts.get(CLASSES[ps.d.cls].model);
    // paint this class's skill icons and the player's gear icons in the background
    warmIcons(classSkills(ps.d.cls).map(s => s.id), [...ps.d.inventory, ...Object.values(ps.d.equip)].filter(Boolean).map(it => ITEMS[it!.base].icon), true);
    // shop stock is painted while in town (see World.loadMap); combat pauses all of this
    setIconWarmGate(() => this.state === 'play' && this.world.inCombat());
    this.state = 'play';
    this.input.enabled = true;
    this.applySettings();
    this.ui.mapBanner(MAPS[map].name, MAPS[map].jp);
    await this.ui.fadeIn(500);
  }

  async newGame(cls: ClassId, slot: number) {
    const ps = PlayerState.fresh(cls, slot);
    await this.enterWorld(ps, 'sugisawa');
    ps.save();
    // the opening scene
    const q = QUEST_BY_ID.m1;
    this.world.schedule(0.6, () => {
      this.say(q.offer, q.cine?.offer, () => ps.accept('m1'));
    });
  }

  async loadGame(slot: number) {
    const ps = PlayerState.load(slot);
    if (!ps) { this.toast('Save data could not be read', 'warn'); return; }
    await this.enterWorld(ps, MAPS[ps.d.map] ? ps.d.map : 'hub', ps.d.x, ps.d.z);
    this.toast(`Welcome back, ${CLASSES[ps.d.cls].name.split(' ')[0]}.`, 'info', 2.5);
    this.announceUnlocks(checkUnlocks(ps.d));
  }

  /** Banner for sorcerers that were just unlocked (several at once when an old save is loaded). */
  private announceUnlocks(ids: ClassId[]) {
    ids.forEach((id, i) => setTimeout(() => {
      const c = CLASSES[id];
      audio.play('rare');
      this.ui.banner('NEW SORCERER UNLOCKED', `${c.name} — ${c.title}`, c.color, 3.2);
      this.toast(`${c.name} (${c.title}) can now join any save: Status → Sorcerers, in Jujutsu High. Or start a new game with them.`, 'good', 5);
    }, 1200 + i * 3600));
  }

  /** Swap the active sorcerer inside this save (only in town, out of combat). */
  async switchSorcerer(cls: ClassId) {
    const ps = this.ps;
    if (!ps || this.state !== 'play' || cls === ps.d.cls) return;
    const c = CLASSES[cls];
    if (!isUnlocked(cls)) { audio.play('error'); this.toast(`Locked. ${c.unlock ?? ''}`, 'warn', 3.5); return; }
    if (!this.world.mapDef.town) { audio.play('error'); this.toast('Change sorcerer in Jujutsu High.', 'warn', 2.5); return; }
    if (this.world.inCombat()) { audio.play('error'); this.toast('Not in the middle of a fight!', 'warn'); return; }
    this.state = 'loading';
    this.input.enabled = false;
    this.input.releaseAll();
    await this.ui.fadeOut(300);
    let res: ReturnType<PlayerState['switchClass']> = null;
    try {
      res = ps.switchClass(cls);
      const w = this.world, p = w.player;
      const x = p.x, z = p.z, f = p.facing;
      p.dispose();
      (w as any).player = undefined;
      w.loadMap(ps.d.map, x, z, f);
      this.ui.hud?.buildMinimap();
      warmIcons(classSkills(cls).map(s => s.id), [...ps.d.inventory, ...Object.values(ps.d.equip)].filter(Boolean).map(it => ITEMS[it!.base].icon), true);
      ps.save();
    } catch (err) {
      console.error(err);
    } finally {
      // whatever happens, never leave the game stuck behind the fade
      this.state = 'play';
      this.input.enabled = true;
    }
    await this.ui.fadeIn(400);
    audio.play('levelup');
    this.ui.banner(c.title.toUpperCase(), c.name, c.color, 2.4);
    if (res === 'joined') this.toast(`${c.name} joins at Lv ${ps.d.level}. Their points were spent for you; new ones arrive as you level.`, 'good', 4.5);
  }

  save(manual: boolean) {
    if (!this.ps || this.ps.d.slot < 0 || this.state === 'title') return;
    const ok = this.ps.save();
    if (manual) { audio.play(ok ? 'save' : 'error'); this.toast(ok ? 'Game saved' : 'Could not save!', ok ? 'good' : 'warn'); }
  }

  async toTitle() {
    await this.ui.fadeOut(300);
    this.ui.hideHud();
    this.world.player?.dispose();
    (this.world as any).player = undefined;
    this.ps = PlayerState.fresh('yuji', -1);
    this.world.loadMap('hub');
    this.world.player.model!.root.visible = false;
    this.state = 'title';
    this.input.enabled = false;
    music.play('title');
    this.ui.showTitle();
    await this.ui.fadeIn(400);
  }

  async travel(map: string, x?: number, z?: number, facing?: number) {
    if (this.state === 'loading') return;
    // never leave a cutscene stranded behind a map change (see Director.finishNow)
    if (this.director.busy) this.director.finishNow();
    const prev = this.state;
    this.state = 'loading';
    this.input.enabled = false;
    this.input.releaseAll();
    await this.ui.fadeOut(350);
    this.world.loadMap(map, x, z, facing);
    this.ui.hud?.buildMinimap();
    this.state = prev === 'dialogue' ? 'dialogue' : 'play';
    this.input.enabled = this.state === 'play';
    this.save(false);
    await this.ui.fadeIn(450);
  }

  onPlayerDeath() {
    this.state = 'dead';
    this.input.enabled = false;
    this.input.releaseAll();
    music.push('title');
    setTimeout(() => this.ui.showDeath(this.ps!.questState('m2')?.state === 'done'), 1400);
  }

  async revive(toHub: boolean) {
    const ps = this.ps!;
    ps.addGold(-Math.floor(ps.d.gold * 0.1));
    ps.d.hp = ps.stats.maxHp;
    ps.d.ce = ps.stats.maxCe;
    music.pop();
    const p = this.world.player;
    p.alive = true;
    p.model?.revive();
    p.invulnT = 2;
    await this.travel(toHub ? 'hub' : ps.d.map);
    this.state = 'play';
    this.input.enabled = true;
  }

  // ------------------------------------------------------------------
  // NPC conversations + quests
  // ------------------------------------------------------------------
  talkTo(n: NPC) {
    if (this.state !== 'play') return;
    const ps = this.ps!;
    const id = n.id;
    ps.questCheckCollect();
    ps.questProgress('talk', id, 1);
    n.model.play('wave', 0.8);
    // 1. completing a quest
    const ready = ps.turnInsFor(id).find(q => ps.questState(q.id)?.state === 'ready');
    if (ready) { this.reportQuest(ready, id); return; }
    // 2. offering a new quest
    const offer = ps.offersFor(id)[0];
    if (offer) { this.offerQuest(offer.id); return; }
    // 3. progress hints for active quests involving this NPC
    const activeQ = ps.turnInsFor(id).find(q => ps.questState(q.id)?.state === 'active');
    const gated = QUESTS.find(q => ps.giverOf(q) === id && !ps.questState(q.id) && (q.prereq ?? []).every(p => ps.questState(p)?.state === 'done') && q.level && ps.d.level < q.level);
    if (n.d.shop) {
      // A shop always opens, even mid-quest: Yaga's infusion request is finished inside his
      // workshop, and Ijichi still has to drive you places while his errands are open.
      if (activeQ) {
        const i = activeQ.objectives.findIndex((_, k) => !ps.objectiveDone(activeQ, k));
        if (i >= 0) this.toast(`${activeQ.name}: ${activeQ.objectives[i].label}`, 'quest', 2.5);
      } else if (gated) this.toast(`${n.name} will have a request for you at Lv ${gated.level}.`, 'info', 2.5);
      this.ui.menus.openShop(n.d.shop === 'workshop' ? 'workshop' : n.d.shop, n.d.model ?? id);
      return;
    }
    const hint = activeQ && ps.progressLines(activeQ);
    if (hint) { this.say(hint); return; }
    const lines: Line[] = [...pick(IDLE[id] ?? IDLE.civilian ?? [[{ who: id, text: '…' }]])];
    if (gated) lines.push({ who: id, text: `Get a little stronger first. Come back at level ${gated.level}.` });
    this.dialogue.play(lines.map(l => ({ ...l, who: l.who === 'civilian' || l.who === 'student' ? id : l.who })));
  }

  /** Hands a finished quest in to `id` (an NPC, or the player when they are that NPC), with its ending. */
  private reportQuest(ready: QuestDef, id: string) {
    const ps = this.ps!;
    // the part of a boss quest's ending that happened where the boss fell has already played
    const end = ps.endingSplit(ready);
    const split = !!ps.d.flags['outro_' + ready.id];
    const lines = split ? end.report : ps.completeLines(ready);
    this.say(lines.length ? lines : [{ who: id, text: 'It\'s done. Good work.' }], ready.cine?.complete ?? (split ? undefined : ready.cine?.outro), () => {
      ps.complete(ready.id);
      this.save(false);
      this.world.refreshNpcs();
      // chain straight into an auto-accepted follow-up from the same NPC, after any chapter clear
      const next = ps.offersFor(id).find(q => q.autoAccept);
      const cont = () => { if (next) this.offerQuest(next.id); };
      if (ready.type === 'main' && CHAPTER_END.get(ready.chapter) === ready.id) {
        this.director.chapterClear(ready.chapter, ready.id === 'm26' ? () => this.director.ending(CREDITS, cont) : cont);
      } else cont();
    });
  }

  private rerunT = 0;
  /**
   * Keeps a rerun moving even across a reload: a finished quest whose report was pending when the game
   * was saved is reported, and if the next quest of the line somehow wasn't started, it is.
   */
  private rerunWatch(dt: number) {
    const ps = this.ps!;
    const a = ps.d.reruns?.active;
    if (!a || (this.rerunT -= dt) > 0) return;
    this.rerunT = 1;
    if (this.rerunReport || this.state !== 'play') return;
    const line = LINE_BY_ID[a.line];
    if (!line) return;
    const ready = line.quests.find(id => ps.questState(id)?.state === 'ready');
    if (ready) { this.rerunReport = { id: ready, t: 0.3 }; return; }
    if (!line.quests.some(id => ps.questState(id)?.state === 'active')) {
      const next = line.quests.find(id => !ps.questState(id));
      if (next) { ps.accept(next); ps.track(next); this.world.refreshGuide(); }
      // every quest done but the run never closed: close it rather than leave the line locked
      else delete ps.d.reruns!.active;
    }
  }

  private selfT = 0;
  /**
   * A guest sorcerer who is someone in the story (Yuta, Toji) runs that someone's errands: their quests start
   * and finish on their own, a moment after they become possible, with the lines now the player's.
   */
  private selfErrands(dt: number) {
    const ps = this.ps!;
    const self = CLASSES[ps.d.cls]?.self;
    if (!self || (this.selfT -= dt) > 0) return;
    this.selfT = 0.75;
    if (this.state !== 'play' || this.dialogue.active || this.world.bossActive || this.outroQ) return;
    const ready = ps.turnInsFor(self).find(q => ps.questState(q.id)?.state === 'ready');
    if (ready) { this.reportQuest(ready, self); return; }
    const offer = ps.offersFor(self)[0];
    if (offer) this.offerQuest(offer.id);
  }

  /** The lines of a boss quest's ending that happen where the boss fell, waiting for the dust to settle. */
  private outroQ: { lines: Line[]; t: number; spec?: SceneSpec } | null = null;
  /** a rerun quest whose objectives are done, reported automatically after a beat */
  private rerunReport: { id: string; t: number } | null = null;

  /** Called when a boss falls: queue the on-the-spot part of the ending of the quest it finished. */
  bossOutro(bossId: string) {
    const ps = this.ps!;
    for (const q of QUESTS) {
      const last = q.objectives[q.objectives.length - 1];
      if (ps.questState(q.id)?.state !== 'ready' || last.type !== 'boss' || last.target !== bossId || ps.d.flags['outro_' + q.id] || ps.inRerunLine(q.id)) continue;
      const { outro } = ps.endingSplit(q);
      if (!outro.length) continue;
      ps.d.flags['outro_' + q.id] = true;
      this.outroQ = { lines: outro, t: 1.8, spec: q.cine?.outro };
      return;
    }
  }

  offerQuest(qid: string) {
    const q = QUEST_BY_ID[qid];
    const ps = this.ps!;
    this.say(ps.offerLines(q), ps.giverOf(q) === q.giver ? q.cine?.offer : undefined, () => { ps.accept(qid); this.save(false); this.world.refreshNpcs(); });
  }

  /** Play lines, staged as a cutscene when the story calls for it. */
  say(lines: Line[], spec?: SceneSpec, onEnd?: () => void, choices?: Choice[]) {
    const run = () => this.dialogue.play(lines, { choices, onEnd: () => { this.director.endScene(); onEnd?.(); } });
    // never over a cutscene: a conversation waits for it to finish
    if (spec) this.director.beginScene(spec, run); else this.director.after(run);
  }

  npcEmote(who: string, emote: string) {
    const n = this.world.npcs.find(x => x.id === who);
    n?.model.play(emote, 0.9);
    if (who === 'player') this.world.player.model?.play(emote, 0.9);
  }

  /** Cheat hooks (also handy for automated playtests). */
  cheat(id: string) { return runCheat(this, id); }
  cheatToggle(id: string) { return toggleCheat(this, id as any); }

  toast(msg: string, kind: 'info' | 'warn' | 'good' | 'item' | 'boss' | 'quest' = 'info', dur = 2, color?: string, icon?: IconSpec) {
    this.ui.toast(msg, kind, dur, color, icon);
  }
}
