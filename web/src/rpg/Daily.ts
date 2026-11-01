// Daily exorcisms: Akari Nitta posts three bosses a day, each with drops of its own, and the list
// refreshes at local midnight. Each can be beaten once a day per save. Every win also pays Special
// Grade Seals, which buy any of the daily bosses' signature pieces outright, so farming always adds up.
import type { PlayerState } from './PlayerState';
import { ENEMIES } from './enemies';
import { LEVEL_CAP } from './classes';

export interface DailyDrop { id: string; qty: [number, number]; chance: number }

export interface DailyBoss {
  /** enemy id (its boss AI comes along) */
  id: string;
  jp: string;
  /** story quest that must be done before it appears on the board */
  after: string;
  /** its signature piece: dropped sometimes, or bought with seals */
  sig: string;
  seals: [number, number];
  drops: DailyDrop[];
  blurb: string;
}

export const DAILY_BOSSES: DailyBoss[] = [
  { id: 'fingerBearer', jp: '指持ち', after: 'm5', sig: 'wombCharm', seals: [1, 1], blurb: 'A womb at the detention centre ripened again overnight.',
    drops: [{ id: 'core', qty: [2, 3], chance: 1 }, { id: 'fragment', qty: [10, 16], chance: 1 }, { id: 'hpM', qty: [2, 4], chance: 0.8 }] },
  { id: 'mahito', jp: '真人', after: 'm8', sig: 'stitchRing', seals: [1, 2], blurb: 'Transfigured bodies keep turning up in the Kawasaki drains.',
    drops: [{ id: 'core', qty: [2, 4], chance: 1 }, { id: 'fragment', qty: [12, 20], chance: 1 }, { id: 'ceM', qty: [2, 4], chance: 0.8 }] },
  { id: 'hanami', jp: '花御', after: 'm10', sig: 'flowerBand', seals: [1, 2], blurb: 'A forest grew through a parking lot in a single night.',
    drops: [{ id: 'core', qty: [3, 4], chance: 1 }, { id: 'fragment', qty: [14, 22], chance: 1 }, { id: 'hpL', qty: [1, 3], chance: 0.7 }] },
  { id: 'choso', jp: '脹相', after: 'm11p', sig: 'bloodVial', seals: [2, 2], blurb: 'Blood on the Fukutoshin Line platform, and no body to go with it.',
    drops: [{ id: 'core', qty: [3, 5], chance: 1 }, { id: 'fragment', qty: [16, 24], chance: 1 }] },
  { id: 'dagon', jp: '陀艮', after: 'm12', sig: 'skandhaPearl', seals: [2, 2], blurb: 'Seawater keeps flooding Shibuya Station at the same minute every night.',
    drops: [{ id: 'core', qty: [3, 5], chance: 1 }, { id: 'fragment', qty: [16, 24], chance: 1 }, { id: 'ceL', qty: [1, 3], chance: 0.7 }] },
  { id: 'jogo', jp: '漏瑚', after: 'm13', sig: 'volcanoEmber', seals: [2, 3], blurb: 'The scramble crossing caught fire again. Nobody lit it.',
    drops: [{ id: 'core', qty: [3, 5], chance: 1 }, { id: 'fragment', qty: [18, 26], chance: 1 }, { id: 'hpL', qty: [2, 3], chance: 0.7 }] },
  { id: 'naoya', jp: '禪院直哉', after: 'm17', sig: 'frameSandals', seals: [2, 3], blurb: 'Someone is running the Zen\'in corridors at the speed of sound.',
    drops: [{ id: 'core', qty: [4, 6], chance: 1 }, { id: 'heiCrest', qty: [3, 6], chance: 1 }, { id: 'fragment', qty: [18, 28], chance: 1 }] },
  { id: 'higuruma', jp: '日車寛見', after: 'm19', sig: 'gavelCharm', seals: [3, 3], blurb: 'A courtroom keeps appearing inside the colony barrier. The verdict is always death.',
    drops: [{ id: 'core', qty: [4, 6], chance: 1 }, { id: 'fragment', qty: [20, 30], chance: 1 }] },
  { id: 'ishigori', jp: '石流龍', after: 'm21', sig: 'graniteBand', seals: [3, 3], blurb: 'Craters in Sendai, and laughter from the bottom of every one.',
    drops: [{ id: 'core', qty: [5, 7], chance: 1 }, { id: 'fragment', qty: [22, 32], chance: 1 }, { id: 'ceL', qty: [2, 4], chance: 0.7 }] },
  { id: 'uraume', jp: '裏梅', after: 'm24', sig: 'frostCharm', seals: [3, 4], blurb: 'Frost on the Shinjuku ruins in the middle of the day.',
    drops: [{ id: 'core', qty: [5, 8], chance: 1 }, { id: 'shinjukuAsh', qty: [2, 4], chance: 1 }, { id: 'fragment', qty: [24, 34], chance: 1 }] },
];

/** Chance that a daily boss drops its signature piece. */
export const SIG_CHANCE = 0.3;
/** Seals for a guaranteed signature piece at the board. */
export const SIG_SEALS = 12;

const pad = (n: number) => String(n).padStart(2, '0');
/** Today's date on this phone (the board refreshes at local midnight). */
export function today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** Milliseconds until the board refreshes. */
export function msToReset() {
  const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  return m.getTime() - n.getTime();
}

/** Bosses this save has met in the story, so the board never spoils what's ahead. */
export function dailyPool(ps: PlayerState) {
  return DAILY_BOSSES.filter(b => ps.questState(b.after)?.state === 'done');
}

/** Today's three (fewer early in the story). The same for everyone on the same day. */
export function dailyRoster(ps: PlayerState): DailyBoss[] {
  const pool = dailyPool(ps);
  const d = new Date();
  let seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const list = [...pool];
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, 3);
}

function state(ps: PlayerState) {
  const t = today();
  if (!ps.d.daily || ps.d.daily.date !== t) ps.d.daily = { date: t, cleared: [] };
  return ps.d.daily;
}

export function dailyCleared(ps: PlayerState, id: string) { return state(ps).cleared.includes(id); }
export function markDailyCleared(ps: PlayerState, id: string) { const s = state(ps); if (!s.cleared.includes(id)) s.cleared.push(id); }

/** Level a daily boss fights at: its story level, or the player's if that is higher. */
export function dailyLevel(ps: PlayerState, b: DailyBoss) {
  return Math.min(LEVEL_CAP, Math.max(ENEMIES[b.id]?.level ?? 1, ps.d.level));
}

/** The boss picked at the board, waiting for the player in the arena, and the level it fights at. */
export let dailyPick: DailyBoss | null = null;
export let dailyPickLevel = 1;
export function setDailyPick(b: DailyBoss | null, level = 1) { dailyPick = b; dailyPickLevel = level; }
