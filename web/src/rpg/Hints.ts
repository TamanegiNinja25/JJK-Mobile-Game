// Hints for a player who has been stuck on the same step of a quest for a while. The clock only runs
// while you are actually playing (not in menus, conversations, cutscenes or a boss fight) and resets
// whenever the tracked quest moves on. After two minutes the person who gave the quest says what is
// needed and where; after four they offer to open the map; after seven they offer to take you there.
// The quest log's Hint button shows the full hint at any time.

import type { Game } from '../Game';
import { QUESTS, QuestDef, Line } from '../data/story';
import { ENEMIES } from './enemies';
import { ITEMS } from './items';
import { CLASSES } from './classes';
import { npcName, objCount } from './PlayerState';
import { MAPS, travelUnlocked } from '../world/maps';
import { getAtlas } from '../world/atlas';

/** seconds without progress before each level of hint */
export const HINT_AFTER = [120, 240, 420];

export interface Hint {
  /** who gives it: an NPC id, whose portrait is shown */
  who: string;
  title: string;
  lines: string[];
  /** 1: what and where; 2: also offers the map; 3: also offers to take you there */
  level: number;
  /** a map to travel to, if the goal is somewhere else */
  travel?: string;
  /** the spot in this area to be taken to */
  spot?: { x: number; z: number };
}

const mapName = (id: string) => MAPS[id]?.name ?? id;

function list(names: string[]) {
  const u = [...new Set(names)];
  if (u.length <= 1) return u[0] ?? '';
  return u.slice(0, -1).join(', ') + ' or ' + u[u.length - 1];
}

export class QuestHints {
  private key = '';
  /** seconds of play without progress on the current step */
  idle = 0;
  private shown = 0;

  constructor(private game: Game) {}

  /** What identifies "the current step": the tracked quest and its progress (or the next story quest). */
  private stepKey() {
    const ps = this.game.ps;
    if (!ps) return '';
    const q = ps.trackedQuest();
    if (!q) { const tr = ps.trackerText(); return tr ? 'next:' + tr.name + ':' + tr.text : ''; }
    const st = ps.d.quests[q.id];
    return st ? `${q.id}:${st.state}:${st.progress.join(',')}` : '';
  }

  update(dt: number) {
    const g = this.game;
    if (!g.ps || g.state !== 'play') return;
    const k = this.stepKey();
    if (k !== this.key) { this.key = k; this.idle = 0; this.shown = 0; g.ui.hud?.hideHint(true); return; }
    // nothing to hint, hints off, or busy with a boss (that is progress of its own)
    if (!k || g.settings.hints === 'off' || g.world.bossActive) return;
    this.idle += dt;
    const lv = HINT_AFTER.filter(t => this.idle >= t).length;
    if (lv > this.shown) {
      this.shown = lv;
      const h = this.build(lv);
      if (h) g.ui.hud?.showHint(h);
    }
  }

  /** The full hint right now (the quest log's Hint button). */
  now(qid?: string) {
    const ps = this.game.ps;
    if (!ps) return null;
    if (qid && ps.d.quests[qid] && ps.d.quests[qid].state !== 'done' && ps.trackedQuest()?.id !== qid) { ps.track(qid); this.game.world.refreshGuide(); }
    return this.build(3);
  }

  build(level: number): Hint | null {
    const g = this.game, ps = g.ps!, w = g.world;
    w.ensureGuide();
    const q = ps.trackedQuest();
    const lines: string[] = [];
    let who = 'gojo', travel: string | undefined;
    if (!q) {
      // no quest taken: the next story quest, or the level it waits for
      const next = QUESTS.find(x => x.type === 'main' && !ps.d.quests[x.id]);
      if (!next) return null;
      who = ps.giverOf(next);
      if (who === CLASSES[ps.d.cls]?.self) who = 'ijichi';
      if (next.level && ps.d.level < next.level) {
        lines.push(`"${next.name}" opens at Lv ${next.level}. You're Lv ${ps.d.level}.`);
        // Nitta's board only exists from the end of Chapter 3
        lines.push(ps.questState('m5')?.state === 'done'
          ? 'Side requests, Nitta\'s daily exorcisms and the curses in the open areas are the quickest EXP.'
          : 'Side requests and the curses out in the open areas are the quickest EXP.');
        return { who, title: 'Next chapter', lines, level: Math.min(level, 1) };
      }
      lines.push(`${npcName(who)} has the next story quest, "${next.name}".`);
      const where = this.whereNpc(who);
      if (where) lines.push(where);
      ({ travel } = this.route(level, lines));
      return this.finish({ who, title: next.name, lines, level, travel });
    }
    const st = ps.d.quests[q.id];
    who = st.state === 'ready' ? ps.turnInOf(q) : ps.giverOf(q);
    // a guest's own errands get their advice from Ijichi instead of from themselves
    if (who === CLASSES[ps.d.cls]?.self) who = 'ijichi';
    if (level === 1) {
      // their own words first, when the quest has them
      const say = this.progressLine(q);
      if (say) lines.push(say);
    }
    const goal = ps.trackGoal();
    if (st.state === 'ready' || !goal) {
      const to = ps.turnInOf(q);
      lines.push(`Everything is done. Report to ${npcName(to)}.`);
      const where = this.whereNpc(to);
      if (where) lines.push(where);
    } else {
      const i = q.objectives.findIndex((_, j) => !ps.objectiveDone(q, j));
      const o = q.objectives[i];
      const left = o ? objCount(o) - (st.progress[i] ?? 0) : 0;
      switch (goal.kind) {
        case 'talk': {
          lines.push(`Talk to ${npcName(goal.npc)}.`);
          const where = this.whereNpc(goal.npc);
          if (where) lines.push(where);
          break;
        }
        case 'reach': lines.push(`Go to ${mapName(goal.map)}.`); break;
        case 'kill': {
          const names = goal.targets === 'any' ? ['curses'] : goal.targets.map(id => ENEMIES[id]?.name ?? id);
          lines.push(`${left > 1 ? `${left} more` : 'One more'}: ${list(names)}${goal.map ? ` in ${mapName(goal.map)}` : ''}.`);
          if (goal.map && goal.map === ps.d.map) lines.push('An area you\'ve cleared fills up again after a little while. Keep moving through the rooms.');
          else if (!goal.map && w.guideMaps.length) lines.push(w.guideMaps.includes(ps.d.map) ? `There are some right here in ${mapName(ps.d.map)}.` : `They show up in ${list(w.guideMaps.map(mapName).slice(0, 3))}.`);
          break;
        }
        case 'boss': {
          // name whoever actually stands there: a stand-in when the player is the usual boss (Yuta, Toji)
          const bid = this.bossHere(goal.boss, goal.quest);
          const b = ENEMIES[bid];
          const where = w.guideMaps[0];
          lines.push(`${b?.name ?? goal.boss} is waiting${where ? ` in ${mapName(where)}` : ''}.`);
          const lv = this.bossLevel(bid, goal.quest);
          if (lv && ps.d.level < lv - 2) lines.push(`It's around Lv ${lv} and you're Lv ${ps.d.level}. Train a little or improve your gear first.`);
          break;
        }
        case 'collect': {
          const name = ITEMS[goal.item]?.name ?? goal.item;
          const droppers = Object.values(ENEMIES).filter(d => d.drops?.some(x => x.item === goal.item)).map(d => d.name);
          if (droppers.length) lines.push(`${name}: ${list(droppers.slice(0, 3))} drop it${w.guideMaps.length ? ` in ${list(w.guideMaps.map(mapName).slice(0, 2))}` : ''}.`);
          else lines.push(`Find ${name}${w.guideMaps.length ? ` in ${mapName(w.guideMaps[0])}` : ''}. It glows on the ground.`);
          break;
        }
      }
    }
    ({ travel } = this.route(level, lines));
    return this.finish({ who, title: q.name, lines, level, travel });
  }

  /** How to get there from here: the arrow, a door, or the map. */
  private route(level: number, lines: string[]) {
    const g = this.game, ps = g.ps!, w = g.world;
    const maps = w.guideMaps;
    let travel: string | undefined;
    if (w.guide) {
      const d = Math.round(Math.hypot(w.guide.x - w.player.x, w.guide.z - w.player.z));
      if (!maps.length || maps.includes(ps.d.map)) lines.push(`It's ${d} m from here: follow the gold arrow under the quest tracker.`);
      else lines.push(`Your way there is "${w.guide.hint}", ${d} m from here. The gold arrow points to it.`);
    }
    if (maps.length && !maps.includes(ps.d.map)) {
      const A = getAtlas();
      // an interior is entered from the area that has its door
      const area = maps.map(m => MAPS[m]?.interior ? Object.keys(A).find(a => A[a].portals.some(p => p.to === m && p.style === 'door')) ?? m : m)
        .find(m => travelUnlocked(ps, m));
      if (area && area !== ps.d.map) {
        travel = area;
        if (level >= 2) lines.push(`${mapName(area)} is on the Map (地): you can travel there directly.`);
      }
    }
    return { travel };
  }

  private finish(h: Omit<Hint, 'spot'>): Hint {
    const w = this.game.world;
    const spot = w.guide && (!w.guideMaps.length || w.guideMaps.includes(this.game.ps!.d.map) || !h.travel) ? { x: w.guide.x, z: w.guide.z } : undefined;
    return { ...h, lines: h.lines.slice(0, 4), spot };
  }

  private progressLine(q: QuestDef) {
    const ps = this.game.ps!;
    const persona = CLASSES[ps.d.cls]?.persona;
    const self = CLASSES[ps.d.cls]?.self;
    const pick = (ls: Line[] | undefined) => ls?.find(l => l.who !== 'player' && l.who !== 'narrator' && l.who !== self
      && (!l.only || (persona && l.only.includes(persona))) && (!l.not || !persona || !l.not.includes(persona))
      && (!l.cls || l.cls.includes(ps.d.cls)) && (!l.notCls || !l.notCls.includes(ps.d.cls)));
    const l = pick(ps.progressLines(q));
    return l ? `"${l.text}"` : '';
  }

  private whereNpc(id: string) {
    const ps = this.game.ps!, A = getAtlas();
    if (this.game.world.npcs.some(n => n.id === id)) return '';
    const at = Object.keys(A).filter(m => A[m].npcs.some(n => n.id === id && (!n.cond || n.cond(ps))));
    return at.length ? `${npcName(id)} is in ${list(at.map(mapName).slice(0, 2))}.` : '';
  }

  /** The boss that fights for this quest objective right now (BossDef.as stand-ins included). */
  private bossHere(target: string, quest?: string) {
    const ps = this.game.ps!, A = getAtlas();
    for (const m of Object.keys(A)) {
      const b = A[m].bosses.find(b => (b.as ?? b.id) === target && (!b.quest || b.quest === quest) && (!b.cond || b.cond(ps)));
      if (b) return b.id;
    }
    return target;
  }

  private bossLevel(id: string, quest?: string) {
    const A = getAtlas();
    for (const m of Object.keys(A)) {
      const b = A[m].bosses.find(b => b.id === id && (!b.quest || b.quest === quest));
      if (b) return b.level ?? ENEMIES[id]?.level ?? 0;
    }
    return ENEMIES[id]?.level ?? 0;
  }
}
