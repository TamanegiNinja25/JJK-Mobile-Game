// In-game HUD: vitals, EXP, minimap, quest tracker, boss bar and touch controls.
import type { Game } from '../Game';
import type { Enemy } from '../entities/Enemy';
import { audio } from '../audio/Audio';
import { el, formatNum } from '../core/util';
import { skillIcon, itemIcon } from './Icons';
import { SKILLS } from '../rpg/skills';
import { ITEMS } from '../rpg/items';
import { expToNext, CLASSES, LEVEL_CAP } from '../rpg/classes';
import { GRADE_NAME } from '../rpg/enemies';
import { NPC_SHORT } from '../data/story';
import { Action } from '../core/Input';

/** Status effects bosses put on the player: glyph and tooltip. */
const DEBUFFS: Record<string, [string, string]> = { confiscated: ['没', 'Confiscation: techniques sealed'] };

export class Hud {
  root: HTMLDivElement;
  private hpFill!: HTMLDivElement; private hpText!: HTMLDivElement; private hpLag!: HTMLDivElement;
  private ceFill!: HTMLDivElement; private ceText!: HTMLDivElement;
  private domFill!: HTMLDivElement; private domWrap!: HTMLDivElement;
  private expFill!: HTMLDivElement; private expText!: HTMLDivElement;
  private lvl!: HTMLDivElement; private portrait!: HTMLDivElement; private nameEl!: HTMLDivElement;
  private gold!: HTMLDivElement;
  private tracker!: HTMLDivElement; private trackerName!: HTMLDivElement; private trackerText!: HTMLDivElement;
  private trackerGuide!: HTMLDivElement; private guideArrow!: HTMLSpanElement; private guideText!: HTMLSpanElement; private lastGuide = '';
  private mm!: HTMLCanvasElement; private mmCtx!: CanvasRenderingContext2D;
  private mmBg: HTMLCanvasElement | null = null;
  /** interiors start unexplored; the player's path clears this mask */
  private mmFog: HTMLCanvasElement | null = null;
  private bossWrap!: HTMLDivElement; private bossFill!: HTMLDivElement; private bossLag!: HTMLDivElement; private bossName!: HTMLDivElement;
  private boss: Enemy | null = null;
  private skillBtns: { el: HTMLDivElement; cd: HTMLDivElement; icon: HTMLDivElement; id: string | null; cost: HTMLDivElement }[] = [];
  private potBtns: { el: HTMLDivElement; icon: HTMLDivElement; count: HTMLDivElement; id: string | null }[] = [];
  private attackBtn!: HTMLDivElement; private attackLabel!: HTMLDivElement;
  private ultBtn!: HTMLDivElement;
  private dodgeBtn!: HTMLDivElement; private dodgeCd!: HTMLDivElement;
  private statDot!: HTMLDivElement;
  private buffRow!: HTMLDivElement;
  private buffEls = new Map<string, HTMLDivElement>();
  private hpLagV = 1;
  private bossLagV = 1;
  private lastTrack = '';
  private lastPortrait = '';
  private mmTimer = 0;

  constructor(private game: Game, parent: HTMLElement) {
    this.root = el('div', 'hud');
    parent.appendChild(this.root);
    this.buildVitals();
    this.buildTopRight();
    this.buildBoss();
    this.buildControls();
    const exp = el('div', 'exp-bar');
    this.expFill = el('div', 'exp-fill');
    this.expText = el('div', 'exp-text');
    exp.append(this.expFill, this.expText);
    this.root.appendChild(exp);
  }

  private buildVitals() {
    const v = el('div', 'vitals');
    this.portrait = el('div', 'hud-portrait');
    this.lvl = el('div', 'hud-lvl', '1');
    this.statDot = el('div', 'hud-dot');
    this.portrait.append(this.lvl, this.statDot);
    this.portrait.addEventListener('click', () => this.game.ui.openMenu('status'));
    const bars = el('div', 'bars');
    this.nameEl = el('div', 'hud-name');
    const hp = el('div', 'bar hp');
    this.hpLag = el('div', 'bar-lag');
    this.hpFill = el('div', 'bar-fill');
    this.hpText = el('div', 'bar-text');
    hp.append(this.hpLag, this.hpFill, this.hpText);
    const ce = el('div', 'bar ce');
    this.ceFill = el('div', 'bar-fill');
    this.ceText = el('div', 'bar-text');
    ce.append(this.ceFill, this.ceText);
    this.domWrap = el('div', 'bar dom');
    this.domFill = el('div', 'bar-fill');
    this.domWrap.append(this.domFill, el('div', 'bar-label', 'DOMAIN'));
    this.buffRow = el('div', 'buff-row');
    bars.append(this.nameEl, hp, ce, this.domWrap, this.buffRow);
    v.append(this.portrait, bars);
    this.root.appendChild(v);
  }

  /** Active buffs as icons with a draining ring; built-in buffs map to the skill that grants them. */
  private updateBuffs() {
    const ps = this.game.ps!;
    const alias: Record<string, string> = { zone: 'blackflash', sukuna: 'shrine', garden: 'garden', rabbit: 'rabbits' };
    for (const [id, b] of ps.buffs) {
      let e = this.buffEls.get(id);
      if (!e) {
        const icon = SKILLS[alias[id] ?? id] ? skillIcon(alias[id] ?? id, 48) : '';
        const debuff = DEBUFFS[id];
        e = el('div', 'hbuff' + (debuff ? ' debuff' : ''), icon ? `<img src="${icon}">` : `<span>${debuff?.[0] ?? '呪'}</span>`);
        e.title = debuff?.[1] ?? SKILLS[alias[id] ?? id]?.name ?? id;
        this.buffRow.appendChild(e);
        this.buffEls.set(id, e);
      }
      const left = Math.max(0, b.until - ps.time);
      e.style.setProperty('--p', String(Math.min(1, left / Math.max(0.1, b.dur))));
      e.classList.toggle('ending', left < 2);
    }
    for (const [id, e] of this.buffEls) if (!ps.buffs.has(id)) { e.remove(); this.buffEls.delete(id); }
  }

  private buildTopRight() {
    const tr = el('div', 'top-right');
    const row = el('div', 'menu-row');
    const mk = (label: string, tab: string, title: string) => {
      const b = el('button', 'hud-btn', label);
      b.title = title;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.game.ui.openMenu(tab); });
      return b;
    };
    row.append(mk('☰', 'system', 'Menu'), mk('袋', 'bag', 'Bag'), mk('術', 'skills', 'Skills'), mk('任', 'quests', 'Quests'));
    const mmWrap = el('div', 'minimap');
    this.mm = el('canvas');
    this.mm.width = this.mm.height = 220;
    this.mmCtx = this.mm.getContext('2d')!;
    mmWrap.appendChild(this.mm);
    mmWrap.addEventListener('click', () => this.game.ui.openMenu('map'));
    this.gold = el('div', 'gold', '¥0');
    this.tracker = el('div', 'tracker');
    this.trackerName = el('div', 'tracker-name');
    this.trackerText = el('div', 'tracker-text');
    this.trackerGuide = el('div', 'tracker-guide');
    this.guideArrow = el('span', 'tg-arrow', '➤');
    this.guideText = el('span', 'tg-text');
    this.trackerGuide.append(this.guideArrow, this.guideText);
    const cycle = el('div', 'tracker-cycle', '⇄ tap to switch quest');
    this.tracker.append(this.trackerName, this.trackerText, this.trackerGuide, cycle);
    // tapping the tracker switches which active quest it follows
    this.tracker.addEventListener('click', () => {
      const q = this.game.ps!.cycleTracked();
      if (q) { audio.play('tab'); this.game.world.refreshGuide(); this.game.toast(`Tracking: ${q.name}`, 'quest', 1.4); }
      else this.game.ui.openMenu('quests');
    });
    tr.append(row, mmWrap, this.gold, this.tracker);
    this.root.appendChild(tr);
  }

  private buildBoss() {
    this.bossWrap = el('div', 'boss-bar hidden');
    this.bossName = el('div', 'boss-name');
    const bar = el('div', 'boss-track');
    this.bossLag = el('div', 'boss-lag');
    this.bossFill = el('div', 'boss-fill');
    bar.append(this.bossLag, this.bossFill);
    this.bossWrap.append(this.bossName, bar);
    this.root.appendChild(this.bossWrap);
  }

  private buildControls() {
    const inp = this.game.input;
    const zone = el('div', 'joy-zone');
    const base = el('div', 'joy-base');
    const knob = el('div', 'joy-knob');
    base.appendChild(knob);
    this.root.append(zone, base);
    inp.bindJoystick(zone, base, knob);

    const cluster = el('div', 'actions');
    this.attackBtn = el('div', 'act attack');
    this.attackLabel = el('div', 'act-label', '攻');
    this.attackBtn.appendChild(this.attackLabel);
    inp.bindButton(this.attackBtn, 'attack');
    cluster.appendChild(this.attackBtn);
    const slots: Action[] = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'];
    slots.forEach((a, i) => {
      const b = el('div', `act skill s${i + 1}`);
      const icon = el('div', 'act-icon');
      const cd = el('div', 'act-cd');
      const cost = el('div', 'act-cost');
      b.append(icon, cd, cost);
      inp.bindButton(b, a);
      cluster.appendChild(b);
      this.skillBtns.push({ el: b, cd, icon, id: null, cost });
    });
    this.ultBtn = el('div', 'act ult');
    const ui = el('div', 'act-icon');
    const ucd = el('div', 'act-cd');
    this.ultBtn.append(ui, ucd, el('div', 'act-cost'));
    inp.bindButton(this.ultBtn, 'ultimate');
    cluster.appendChild(this.ultBtn);
    this.skillBtns.push({ el: this.ultBtn, cd: ucd, icon: ui, id: null, cost: this.ultBtn.lastChild as HTMLDivElement });
    this.dodgeBtn = el('div', 'act dodge', '<span>回避</span>');
    this.dodgeCd = el('div', 'act-cd');
    this.dodgeBtn.appendChild(this.dodgeCd);
    inp.bindButton(this.dodgeBtn, 'dash');
    cluster.appendChild(this.dodgeBtn);
    (['potion1', 'potion2'] as Action[]).forEach((a, i) => {
      const b = el('div', `act potion p${i + 1}`);
      const icon = el('div', 'act-icon');
      const count = el('div', 'pot-count');
      b.append(icon, count);
      inp.bindButton(b, a);
      cluster.appendChild(b);
      this.potBtns.push({ el: b, icon, count, id: null });
    });
    this.root.appendChild(cluster);
  }

  setBoss(e: Enemy | null) {
    this.boss = e;
    this.bossWrap.classList.toggle('hidden', !e);
    if (e) {
      this.bossName.innerHTML = `<span class="grade" style="color:${e.gradeColor}">${GRADE_NAME[e.d.grade]}</span> ${e.d.name} <span class="lv">Lv ${e.level}</span>`;
      this.bossLagV = 1;
    }
  }

  flashSkill(id: string) {
    const b = this.skillBtns.find(s => s.id === id);
    if (!b) return;
    b.el.classList.remove('flash');
    void b.el.offsetWidth;
    b.el.classList.add('flash');
  }

  /** Paint the static minimap background once per map. */
  buildMinimap() {
    const w = this.game.world;
    const [W, D] = w.mapDef.size;
    const S = 4; // px per unit
    const c = document.createElement('canvas');
    c.width = W * S; c.height = D * S;
    const x = c.getContext('2d')!;
    const sp = w.map.splat;
    const night = w.mapDef.night;
    const palette = w.mapDef.terrain.minimap ?? [[60, 90, 50], [130, 128, 120], [120, 100, 74], [70, 70, 78]];
    const img = x.createImageData(c.width, c.height);
    for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
      const u = px / c.width, v = py / c.height;
      const tx = Math.floor(u * sp.size * (W / sp.width)), ty = Math.floor(v * sp.size * (D / sp.depth));
      const i = (Math.min(sp.size - 1, ty) * sp.size + Math.min(sp.size - 1, tx)) * 4;
      let r = 0, g = 0, b = 0;
      for (let ch = 0; ch < 4; ch++) { const wgt = sp.data[i + ch]; r += palette[ch][0] * wgt; g += palette[ch][1] * wgt; b += palette[ch][2] * wgt; }
      const k = night ? 0.65 : 1;
      const o = (py * c.width + px) * 4;
      img.data[o] = r * k; img.data[o + 1] = g * k; img.data[o + 2] = b * k; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = 'rgba(20,16,30,0.85)';
    for (const col of w.col.all) {
      if (col.kind === 'box') {
        const bw = (col.x1 - col.x0), bd = (col.z1 - col.z0);
        if (bw * bd < 1.5) continue;
        x.fillRect((col.x0 + W / 2) * S, (col.z0 + D / 2) * S, bw * S, bd * S);
      }
    }
    x.fillStyle = 'rgba(60,140,220,0.9)';
    for (const wt of w.map.water) x.fillRect((wt.x - wt.w / 2 + W / 2) * S, (wt.z - wt.d / 2 + D / 2) * S, wt.w * S, wt.d * S);
    this.mmBg = c;
    this.mmFog = null;
    if (w.mapDef.interior) {
      const f = document.createElement('canvas');
      f.width = c.width; f.height = c.height;
      const fx = f.getContext('2d')!;
      fx.fillStyle = '#0a0812';
      fx.fillRect(0, 0, f.width, f.height);
      this.mmFog = f;
    }
  }

  /** The whole current area for the Map tab: doors, travel gates, NPCs, bosses and the tracked objective. */
  drawAreaMap(c: HTMLCanvasElement) {
    const w = this.game.world;
    if (!this.mmBg || !w.mapDef) return;
    const x = c.getContext('2d')!;
    const [W, D] = w.mapDef.size;
    const k = Math.min((c.width - 20) / W, (c.height - 20) / D);
    const ox = (c.width - W * k) / 2, oy = (c.height - D * k) / 2;
    const toM = (wx: number, wz: number): [number, number] => [ox + (wx + W / 2) * k, oy + (wz + D / 2) * k];
    x.fillStyle = '#0a0812'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(this.mmBg, ox, oy, W * k, D * k);
    if (this.mmFog) x.drawImage(this.mmFog, ox, oy, W * k, D * k);
    x.strokeStyle = 'rgba(200,180,255,0.5)'; x.lineWidth = 2; x.strokeRect(ox, oy, W * k, D * k);
    const label = (t: string, mx: number, my: number, col: string) => {
      x.font = 'bold 12px sans-serif'; x.textAlign = 'center';
      x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.85)'; x.strokeText(t, mx, my); x.fillStyle = col; x.fillText(t, mx, my);
    };
    for (const b of w.map.bosses) { const [mx, my] = toM(b.x, b.z); x.strokeStyle = 'rgba(255,60,80,0.5)'; x.lineWidth = 2; x.beginPath(); x.arc(mx, my, b.r * k, 0, Math.PI * 2); x.stroke(); }
    for (const n of w.npcs) {
      const [mx, my] = toM(n.x, n.z);
      const mk = w.npcMarker(n.id, n.d.shop);
      x.fillStyle = mk === '!' ? '#ffd23a' : mk === '?' ? '#7affb0' : '#e8e8ff';
      x.beginPath(); x.arc(mx, my, 5, 0, Math.PI * 2); x.fill();
      if (mk || n.d.shop) label((NPC_SHORT[n.id] ?? n.name.split(' (')[0]) + (mk ? ' ' + mk : ''), mx, my - 9, x.fillStyle as string);
    }
    for (const po of w.portals) {
      const [mx, my] = toM(po.d.x, po.d.z);
      if (po.d.style === 'door') { x.fillStyle = '#ffd890'; x.fillRect(mx - 6, my - 6, 12, 12); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.strokeRect(mx - 6, my - 6, 12, 12); label('▣ ' + po.d.label, mx, my + 20, '#ffd890'); }
      else if (po.d.style === 'travel') { x.strokeStyle = '#6adfff'; x.lineWidth = 3; x.beginPath(); x.arc(mx, my, 8, 0, Math.PI * 2); x.stroke(); label('⛩ Travel', mx, my + 22, '#6adfff'); }
      else if (po.d.style === 'road') { x.fillStyle = '#ffe08a'; x.beginPath(); x.arc(mx, my, 7, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.stroke(); label('➜ ' + po.d.label, mx, my + 20, '#ffe08a'); }
      else { x.fillStyle = '#b08aff'; x.beginPath(); x.arc(mx, my, 7, 0, Math.PI * 2); x.fill(); label(po.d.label, mx, my + 20, '#c8b0ff'); }
    }
    // landmarks: found ones by name, the rest as question marks to go and look for
    const flags = this.game.ps!.d.flags;
    for (const lm of w.map.landmarks) {
      const [mx, my] = toM(lm.x, lm.z);
      if (flags[lm.flag]) { label('★ ' + lm.name, mx, my + 4, '#ffe08a'); }
      else { label('?', mx, my + 4, 'rgba(255,224,138,0.55)'); }
    }
    if (w.map.caches.length || w.map.landmarks.length) {
      const fc = w.map.caches.filter(c => flags[c.flag]).length, fl = w.map.landmarks.filter(l => flags[l.flag]).length;
      x.font = 'bold 12px sans-serif'; x.textAlign = 'left'; x.fillStyle = '#ffe08a';
      x.fillText(`Landmarks ${fl}/${w.map.landmarks.length}   Sealed caches ${fc}/${w.map.caches.length}`, ox + 6, oy + 16);
    }
    if (w.guide) {
      const [mx, my] = toM(w.guide.x, w.guide.z);
      x.save(); x.translate(mx, my); x.rotate(Math.PI / 4); x.fillStyle = '#ffd23a'; x.strokeStyle = '#000'; x.lineWidth = 2; x.fillRect(-7, -7, 14, 14); x.strokeRect(-7, -7, 14, 14); x.restore();
      label('◆ ' + w.guide.hint, mx, my - 13, '#ffd23a');
    }
    const p = w.player;
    const [px, py] = toM(p.x, p.z);
    x.save(); x.translate(px, py); x.rotate(-p.facing + Math.PI);
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.fill(); x.stroke();
    x.restore();
  }

  private drawMinimap() {
    const w = this.game.world;
    if (!this.mmBg || !w.mapDef) return;
    const x = this.mmCtx;
    const N = this.mm.width;
    const [W, D] = w.mapDef.size;
    const S = 4;
    const view = 26; // world units across
    const scale = N / view;
    const p = w.player;
    x.clearRect(0, 0, N, N);
    x.save();
    x.beginPath(); x.arc(N / 2, N / 2, N / 2 - 2, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#0a0812'; x.fillRect(0, 0, N, N);
    const sx = (p.x + W / 2 - view / 2) * S, sz = (p.z + D / 2 - view / 2) * S;
    x.imageSmoothingEnabled = true;
    x.drawImage(this.mmBg, sx, sz, view * S, view * S, 0, 0, N, N);
    if (this.mmFog) {
      const fx = this.mmFog.getContext('2d')!;
      fx.globalCompositeOperation = 'destination-out';
      const g = fx.createRadialGradient((p.x + W / 2) * S, (p.z + D / 2) * S, 4 * S, (p.x + W / 2) * S, (p.z + D / 2) * S, 7.5 * S);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      fx.fillStyle = g;
      fx.fillRect((p.x + W / 2 - 8) * S, (p.z + D / 2 - 8) * S, 16 * S, 16 * S);
      fx.globalCompositeOperation = 'source-over';
      x.drawImage(this.mmFog, sx, sz, view * S, view * S, 0, 0, N, N);
    }
    const toM = (wx: number, wz: number) => [N / 2 + (wx - p.x) * scale, N / 2 + (wz - p.z) * scale];
    for (const po of w.portals) {
      const [mx, my] = toM(po.d.x, po.d.z);
      if (po.d.style === 'door') { x.fillStyle = '#ffd890'; x.fillRect(mx - 5, my - 5, 10, 10); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.strokeRect(mx - 5, my - 5, 10, 10); }
      else if (po.d.style === 'travel') { x.strokeStyle = '#6adfff'; x.lineWidth = 3; x.beginPath(); x.arc(mx, my, 6, 0, Math.PI * 2); x.stroke(); }
      else if (po.d.style === 'road') { x.fillStyle = '#ffe08a'; x.beginPath(); x.arc(mx, my, 6, 0, Math.PI * 2); x.fill(); }
      else { x.fillStyle = '#b08aff'; x.beginPath(); x.arc(mx, my, 6, 0, Math.PI * 2); x.fill(); }
    }
    if (w.guide) {
      // objective marker, pinned to the rim when it's off the minimap
      let [mx, my] = toM(w.guide.x, w.guide.z);
      const dx = mx - N / 2, dy = my - N / 2, r = Math.hypot(dx, dy), lim = N / 2 - 9;
      if (r > lim) { mx = N / 2 + dx / r * lim; my = N / 2 + dy / r * lim; }
      x.save(); x.translate(mx, my); x.rotate(Math.PI / 4);
      x.fillStyle = '#ffd23a'; x.strokeStyle = '#000'; x.lineWidth = 2;
      x.fillRect(-5, -5, 10, 10); x.strokeRect(-5, -5, 10, 10);
      x.restore();
    }
    for (const n of w.npcs) {
      const [mx, my] = toM(n.x, n.z);
      const mk = w.npcMarker(n.id, n.d.shop);
      x.fillStyle = mk === '!' ? '#ffd23a' : mk === '?' ? '#7affb0' : '#e8e8ff';
      x.beginPath(); x.arc(mx, my, mk === '!' || mk === '?' ? 6 : 4, 0, Math.PI * 2); x.fill();
    }
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (this.mmFog && Math.hypot(e.x - p.x, e.z - p.z) > 9) continue; // no wall-hacks indoors
      const [mx, my] = toM(e.x, e.z);
      if (mx < -10 || my < -10 || mx > N + 10 || my > N + 10) continue;
      x.fillStyle = e.isBoss ? '#ff2a3a' : e.d.grade <= 1 ? '#ff9a3a' : '#ff5a6a';
      x.beginPath(); x.arc(mx, my, e.isBoss ? 8 : 4, 0, Math.PI * 2); x.fill();
    }
    for (const b of w.map.bosses) {
      const [mx, my] = toM(b.x, b.z);
      x.strokeStyle = 'rgba(255,60,80,0.7)'; x.lineWidth = 2;
      x.beginPath(); x.arc(mx, my, b.r * scale, 0, Math.PI * 2); x.stroke();
    }
    // player arrow
    x.translate(N / 2, N / 2);
    x.rotate(-p.facing + Math.PI);
    x.fillStyle = '#ffffff';
    x.strokeStyle = '#000'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 9); x.lineTo(0, 4); x.lineTo(-8, 9); x.closePath(); x.fill(); x.stroke();
    x.restore();
    x.strokeStyle = 'rgba(200,180,255,0.6)'; x.lineWidth = 4;
    x.beginPath(); x.arc(N / 2, N / 2, N / 2 - 3, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.textAlign = 'center';
    x.fillText('N', N / 2, 22);
  }

  update(dt: number) {
    const g = this.game;
    const ps = g.ps;
    const w = g.world;
    if (!ps || !w.player) return;
    const st = ps.stats;
    const d = ps.d;
    this.updateBuffs();
    const hpK = Math.max(0, d.hp / st.maxHp);
    this.hpFill.style.width = (hpK * 100).toFixed(1) + '%';
    this.hpLagV = this.hpLagV > hpK ? Math.max(hpK, this.hpLagV - dt * 0.6) : hpK;
    this.hpLag.style.width = (this.hpLagV * 100).toFixed(1) + '%';
    this.hpText.textContent = `${Math.ceil(d.hp)} / ${st.maxHp}`;
    this.root.classList.toggle('low-hp', hpK < 0.25);
    this.ceFill.style.width = (Math.max(0, d.ce / st.maxCe) * 100).toFixed(1) + '%';
    this.ceText.textContent = `${Math.floor(d.ce)} / ${st.maxCe}`;
    this.domFill.style.width = d.domain.toFixed(1) + '%';
    this.domWrap.classList.toggle('full', d.domain >= 100);
    const need = expToNext(d.level);
    this.expFill.style.width = (d.level >= LEVEL_CAP ? 100 : d.exp / need * 100).toFixed(2) + '%';
    this.expText.textContent = d.level >= LEVEL_CAP ? 'MAX' : `EXP ${(d.exp / need * 100).toFixed(1)}%`;
    this.lvl.textContent = String(d.level);
    this.statDot.style.display = d.statPoints > 0 || d.skillPoints > 0 ? 'block' : 'none';
    const pid = CLASSES[d.cls].model;
    if (this.lastPortrait !== pid) { this.lastPortrait = pid; this.portrait.style.backgroundImage = `url(${g.portraits.get(pid)})`; this.nameEl.textContent = CLASSES[d.cls].name; }
    this.gold.textContent = '¥' + formatNum(d.gold);
    const tr = ps.trackerText();
    const key = tr ? tr.name + tr.text + tr.ready : '';
    if (key !== this.lastTrack) {
      this.lastTrack = key;
      this.tracker.style.display = tr ? '' : 'none';
      if (tr) { this.trackerName.textContent = tr.name; this.trackerText.textContent = tr.text; this.tracker.classList.toggle('ready', tr.ready); }
      this.tracker.classList.toggle('multi', ps.activeQuests().length > 1);
    }
    // direction to the tracked objective; the camera never rotates, so world x/z map straight to screen x/y
    const gd = w.guide;
    const gp = w.player;
    const dist = gd ? Math.hypot(gd.x - gp.x, gd.z - gp.z) : 0;
    const gkey = gd ? gd.hint + Math.round(dist) + Math.round(Math.atan2(gd.z - gp.z, gd.x - gp.x) * 8) : '';
    if (gkey !== this.lastGuide) {
      this.lastGuide = gkey;
      this.trackerGuide.style.display = gd && dist > 2 ? '' : 'none';
      if (gd) {
        this.guideArrow.style.transform = `rotate(${Math.atan2(gd.z - gp.z, gd.x - gp.x)}rad)`;
        this.guideText.textContent = `${gd.hint} · ${Math.round(dist)}m`;
      }
    }
    // skills
    const p = w.player;
    this.skillBtns.forEach((b, i) => {
      const id = d.quick[i];
      if (b.id !== id) {
        b.id = id;
        b.icon.style.backgroundImage = id ? `url(${skillIcon(id)})` : '';
        b.el.classList.toggle('empty', !id);
      }
      if (!id) return;
      const s = SKILLS[id];
      const lv = ps.skillLevel(id);
      const cdMax = (s.cd?.(lv) ?? 1) * (1 - st.cdr);
      const cd = p.skillCd(id);
      b.cd.style.setProperty('--p', cd > 0 ? String(cd / cdMax) : '0');
      b.cd.textContent = cd > 0 ? (cd < 10 ? cd.toFixed(1) : String(Math.ceil(cd))) : '';
      const cost = s.ce?.(lv) ?? 0;
      const ult = s.type === 'ultimate';
      b.el.classList.toggle('nope', ult ? d.domain < 100 : d.ce < cost);
      b.cost.textContent = ult ? (d.domain >= 100 ? 'READY' : Math.floor(d.domain) + '%') : String(cost);
      if (ult) b.el.classList.toggle('ready', d.domain >= 100 && cd <= 0);
    });
    this.dodgeCd.style.setProperty('--p', p.dodgeCd > 0 ? String(p.dodgeCd / 1.1) : '0');
    this.potBtns.forEach((b, i) => {
      const id = d.potions[i];
      if (b.id !== id) { b.id = id; b.icon.style.backgroundImage = id ? `url(${itemIcon(ITEMS[id].icon)})` : ''; }
      const n = id ? ps.countItem(id) : 0;
      b.count.textContent = id ? String(n) : '';
      b.el.classList.toggle('nope', n <= 0);
    });
    // talk prompt
    const npc = w.interactableNear();
    const talk = !!npc && !w.nearestTarget('enemy', p.x, p.z, 5);
    this.attackBtn.classList.toggle('talk', talk);
    this.attackLabel.textContent = talk ? '話' : '攻';
    // boss
    if (this.boss) {
      const k = Math.max(0, this.boss.hp / this.boss.maxHp);
      this.bossFill.style.width = (k * 100).toFixed(2) + '%';
      this.bossLagV = this.bossLagV > k ? Math.max(k, this.bossLagV - dt * 0.3) : k;
      this.bossLag.style.width = (this.bossLagV * 100).toFixed(2) + '%';
      if (!this.boss.alive) this.setBoss(null);
    }
    this.mmTimer -= dt;
    if (this.mmTimer <= 0) { this.mmTimer = 1 / 20; this.drawMinimap(); }
  }
}
