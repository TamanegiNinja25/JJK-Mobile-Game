// Reruns: any quest line the player has finished (a chapter of the story, or a side request) can be played
// again, as often as they like. A rerun replays the same quests, so every boss, door, pickup and spawner
// tied to them comes back, but it skips the conversations: each quest starts and reports itself, and
// the curses rise to the player's level. Rewards grow with each run up to the fifth, which masters the
// line and pays a bonus. While a rerun is on, the line's quests are taken out of the "done" pile, and
// they are put back exactly as they were when it finishes or is abandoned.

import { CHAPTERS, QUESTS, QUEST_BY_ID } from '../data/story';
import { expToNext } from './classes';

export interface QuestLine {
  id: string;
  name: string;
  kind: 'story' | 'side';
  chapter: number;
  quests: string[];
}

/** runs that master a line; reruns go on after it at the fifth run's rewards */
export const RERUN_GOAL = 5;

export const LINES: QuestLine[] = (() => {
  const out: QuestLine[] = [];
  const chapters = [...new Set(QUESTS.filter(q => q.type === 'main').map(q => q.chapter))];
  for (const c of chapters) {
    out.push({ id: 'ch' + c, name: `Chapter ${c}: ${CHAPTERS[c]?.name ?? ''}`, kind: 'story', chapter: c, quests: QUESTS.filter(q => q.type === 'main' && q.chapter === c).map(q => q.id) });
  }
  for (const q of QUESTS) if (q.type !== 'main') out.push({ id: 'sq:' + q.id, name: q.name, kind: 'side', chapter: q.chapter, quests: [q.id] });
  return out;
})();

export const LINE_BY_ID: Record<string, QuestLine> = Object.fromEntries(LINES.map(l => [l.id, l]));

/** Reward multiplier for a run (1 is the first rerun). */
export function rerunMult(run: number) { return 1 + 0.15 * Math.min(Math.max(run, 1), RERUN_GOAL); }

/** A rerun quest pays at least this, so an early chapter is still worth replaying at a high level. */
export function rerunFloor(level: number) { return { exp: Math.round(expToNext(level) * 0.08), gold: level * 120 }; }

/** The bonus for mastering a line on its fifth run. */
export function masteryReward(line: QuestLine, level: number) {
  return { exp: Math.round(expToNext(level) * 0.5), seals: line.kind === 'story' ? 6 : 3 };
}

/** What a full run of a line pays at this level, before the mastery bonus (for the menu). */
export function lineReward(line: QuestLine, run: number, level: number) {
  const f = rerunFloor(level), k = rerunMult(run);
  let exp = 0, gold = 0;
  for (const id of line.quests) {
    const r = QUEST_BY_ID[id]?.rewards;
    if (!r) continue;
    exp += Math.round(Math.max(r.exp, f.exp) * k);
    gold += Math.round(Math.max(r.gold, f.gold) * k);
  }
  return { exp, gold };
}
