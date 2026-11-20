// Records that belong to the device, not one save (like unlocked sorcerers): achievements, the bestiary of
// every curse exorcised, best boss times, lifetime counts, and Boss Rush, a gauntlet of bosses you have
// already beaten, one after another in the Curtain Arena, against the clock.

import type { PlayerState } from './PlayerState';
import { ENEMIES } from './enemies';
import { DAILY_BOSSES } from './Daily';
import { unlockedClasses } from './Unlocks';
import { CLASSES } from './classes';
import { difficultyId } from '../core/Difficulty';

const KEY = 'cursedChronicles.records';

export interface BossBest { secs: number; diff: string; cls: string }
export interface RecordsData {
  /** achievement id -> when it was earned */
  ach: Record<string, number>;
  /** enemy id -> times exorcised */
  beasts: Record<string, number>;
  /** boss id -> fastest kill */
  boss: Record<string, BossBest>;
  rush: { best?: number; bestDiff?: string; clears: number; hardClears: number };
  n: { kills: number; bosses: number; bf: number; domains: number; deaths: number; dailies: number; hardBosses: number; fastBoss: number };
}

function blank(): RecordsData {
  return { ach: {}, beasts: {}, boss: {}, rush: { clears: 0, hardClears: 0 }, n: { kills: 0, bosses: 0, bf: 0, domains: 0, deaths: 0, dailies: 0, hardBosses: 0, fastBoss: 0 } };
}

let data: RecordsData | null = null;
export function records(): RecordsData {
  if (data) return data;
  data = blank();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      Object.assign(data.ach, raw.ach); Object.assign(data.beasts, raw.beasts); Object.assign(data.boss, raw.boss);
      Object.assign(data.rush, raw.rush); Object.assign(data.n, raw.n);
    }
  } catch { /* fresh records */ }
  return data;
}
let dirty = false;
function touch() { dirty = true; }
/** Writes the records if anything changed (called from the autosave and on leaving the page). */
export function saveRecords() {
  if (!dirty || !data) return;
  dirty = false;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full: kept in memory */ }
}

/** Merges records from another device (a save code or backup file): the better of each. */
export function mergeRecords(o: Partial<RecordsData> | null | undefined) {
  if (!o || typeof o !== 'object') return;
  const r = records();
  for (const [k, t] of Object.entries(o.ach ?? {})) if (typeof t === 'number' && (!r.ach[k] || t < r.ach[k])) r.ach[k] = t;
  for (const [k, n] of Object.entries(o.beasts ?? {})) if (typeof n === 'number' && n > (r.beasts[k] ?? 0)) r.beasts[k] = n;
  for (const [k, b] of Object.entries(o.boss ?? {})) if (b && typeof b.secs === 'number' && (!r.boss[k] || b.secs < r.boss[k].secs)) r.boss[k] = b;
  const ru = o.rush;
  if (ru) {
    if (typeof ru.best === 'number' && (r.rush.best === undefined || ru.best < r.rush.best)) { r.rush.best = ru.best; r.rush.bestDiff = ru.bestDiff; }
    r.rush.clears = Math.max(r.rush.clears, ru.clears ?? 0);
    r.rush.hardClears = Math.max(r.rush.hardClears, ru.hardClears ?? 0);
  }
  for (const [k, n] of Object.entries(o.n ?? {})) if (typeof n === 'number' && k in r.n) (r.n as Record<string, number>)[k] = Math.max((r.n as Record<string, number>)[k], n);
  touch();
  saveRecords();
}

// ---------------------------------------------------------------- events

export function noteKill(enemyId: string, isBoss: boolean) {
  const r = records();
  r.beasts[enemyId] = (r.beasts[enemyId] ?? 0) + 1;
  r.n.kills++;
  if (isBoss) { r.n.bosses++; if (difficultyId() === 'hard') r.n.hardBosses++; }
  touch();
}

/** A boss fight won in `secs`; returns true for a new best time. */
export function noteBossTime(bossId: string, secs: number, cls: string) {
  const r = records();
  if (secs < 60) r.n.fastBoss++;
  const old = r.boss[bossId];
  touch();
  if (old && old.secs <= secs) return false;
  r.boss[bossId] = { secs: Math.round(secs * 10) / 10, diff: difficultyId(), cls };
  return true;
}

export function noteCount(k: 'bf' | 'domains' | 'deaths' | 'dailies') { records().n[k]++; touch(); }

// ---------------------------------------------------------------- achievements

export interface Achievement { id: string; name: string; jp: string; desc: string; test: (r: RecordsData, ps: PlayerState | null) => boolean }

const done = (ps: PlayerState | null, q: string) => ps?.questState(q)?.state === 'done';
const bossIds = () => Object.values(ENEMIES).filter(e => e.ai === 'boss').map(e => e.id);
const curseIds = () => Object.values(ENEMIES).filter(e => e.ai !== 'dummy').map(e => e.id);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstBlood', name: 'First Exorcism', jp: '初祓', desc: 'Exorcise your first curse.', test: r => r.n.kills >= 1 },
  { id: 'kills100', name: 'Grade 3 Sorcerer', jp: '三級', desc: 'Exorcise 100 curses.', test: r => r.n.kills >= 100 },
  { id: 'kills1000', name: 'Grade 1 Sorcerer', jp: '一級', desc: 'Exorcise 1,000 curses.', test: r => r.n.kills >= 1000 },
  { id: 'kills5000', name: 'Special Grade', jp: '特級', desc: 'Exorcise 5,000 curses.', test: r => r.n.kills >= 5000 },
  { id: 'beasts25', name: 'Field Notes', jp: '記録', desc: 'Record 25 different curses in the bestiary.', test: r => Object.keys(r.beasts).length >= 25 },
  { id: 'beastsAll', name: 'The Complete Bestiary', jp: '図鑑完成', desc: 'Record every curse and boss in the bestiary.', test: r => curseIds().every(id => r.beasts[id]) },
  { id: 'boss1', name: 'Giant Killer', jp: '大物', desc: 'Defeat your first boss.', test: r => r.n.bosses >= 1 },
  { id: 'boss50', name: 'Veteran', jp: '歴戦', desc: 'Win 50 boss fights.', test: r => r.n.bosses >= 50 },
  { id: 'bossAll', name: 'Nothing Left Standing', jp: '全討伐', desc: 'Defeat every boss at least once.', test: r => bossIds().every(id => r.beasts[id]) },
  { id: 'fast', name: 'Over in a Minute', jp: '瞬殺', desc: 'Win a boss fight in under 60 seconds.', test: r => r.n.fastBoss >= 1 },
  { id: 'hardBoss', name: 'No Mercy', jp: '容赦無し', desc: 'Defeat a boss on Hard.', test: r => r.n.hardBosses >= 1 },
  { id: 'hardBoss25', name: 'Hardened', jp: '鉄心', desc: 'Defeat 25 bosses on Hard.', test: r => r.n.hardBosses >= 25 },
  { id: 'bf1', name: 'Black Flash', jp: '黒閃', desc: 'Land a Black Flash.', test: r => r.n.bf >= 1 },
  { id: 'bf100', name: 'In the Zone', jp: '黒閃経験者', desc: 'Land 100 Black Flashes.', test: r => r.n.bf >= 100 },
  { id: 'domain1', name: 'Domain Expansion', jp: '領域展開', desc: 'Expand your domain (or use your ultimate).', test: r => r.n.domains >= 1 },
  { id: 'domain25', name: 'Domain Master', jp: '領域使い', desc: 'Expand your domain 25 times.', test: r => r.n.domains >= 25 },
  { id: 'lvl25', name: 'Promising', jp: '有望', desc: 'Reach level 25.', test: (_r, ps) => (ps?.d.level ?? 0) >= 25 },
  { id: 'lvl50', name: 'Seasoned', jp: '熟練', desc: 'Reach level 50.', test: (_r, ps) => (ps?.d.level ?? 0) >= 50 },
  { id: 'lvl100', name: 'The Pinnacle', jp: '頂点', desc: 'Reach level 100.', test: (_r, ps) => (ps?.d.level ?? 0) >= 100 },
  { id: 'eishu', name: 'Rescue at Eishu', jp: '英集', desc: 'Clear Chapter 2.', test: (_r, ps) => done(ps, 'm5') },
  { id: 'shibuya', name: 'Survivor of Shibuya', jp: '渋谷', desc: 'Clear the Shibuya Incident (Chapter 5).', test: (_r, ps) => done(ps, 'm14') },
  { id: 'culling', name: 'Player of the Culling Game', jp: '死滅回游', desc: 'Clear Chapter 7.', test: (_r, ps) => done(ps, 'm21') },
  { id: 'shinjuku', name: 'Shinjuku Showdown', jp: '新宿', desc: 'Defeat the King of Curses (Chapter 8).', test: (_r, ps) => done(ps, 'm26') },
  { id: 'story', name: 'The End of the Night Parade', jp: '完結', desc: 'Finish the story (Chapter 9).', test: (_r, ps) => done(ps, 'm29') },
  { id: 'roster5', name: 'Gathering Allies', jp: '仲間', desc: 'Unlock 5 extra sorcerers.', test: () => unlockedClasses().size >= 8 },
  { id: 'rosterAll', name: 'Every Sorcerer', jp: '総員', desc: 'Unlock every sorcerer.', test: () => unlockedClasses().size >= Object.keys(CLASSES).length },
  { id: 'daily10', name: 'Regular at the Arena', jp: '常連', desc: 'Clear 10 daily exorcisms.', test: r => r.n.dailies >= 10 },
  { id: 'rush', name: 'Gauntlet', jp: '連戦', desc: 'Clear Boss Rush.', test: r => r.rush.clears >= 1 },
  { id: 'rushHard', name: 'Gauntlet of Hell', jp: '地獄の連戦', desc: 'Clear Boss Rush on Hard.', test: r => r.rush.hardClears >= 1 },
  { id: 'rich', name: 'Old Money', jp: '富豪', desc: 'Hold 1,000,000 yen at once.', test: (_r, ps) => (ps?.d.gold ?? 0) >= 1_000_000 },
  { id: 'deaths10', name: 'Stubborn', jp: '不屈', desc: 'Get back up after falling 10 times.', test: r => r.n.deaths >= 10 },
];

/** Checks every achievement; returns the ones just earned. */
export function checkAchievements(ps: PlayerState | null): Achievement[] {
  const r = records();
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (r.ach[a.id]) continue;
    try { if (a.test(r, ps)) { r.ach[a.id] = Date.now(); fresh.push(a); } } catch { /* a test that can't run yet */ }
  }
  if (fresh.length) touch();
  return fresh;
}

// ---------------------------------------------------------------- Boss Rush

export interface RushState { list: string[]; i: number; start: number; level: number; diff: string }
export let rush: RushState | null = null;
/** a clock that keeps running across map loads (the world's resets with every area) */
const clock = () => performance.now() / 1000;

/** The bosses Boss Rush can use: every daily boss whose story chapter this save has cleared. */
export function rushPool(ps: PlayerState) {
  return DAILY_BOSSES.filter(b => ps.questState(b.after)?.state === 'done').map(b => b.id);
}

/** Starts a gauntlet of up to six bosses, weakest first, at the player's level. */
export function startRush(ps: PlayerState, _now?: number): RushState | null {
  const now = clock();
  const pool = rushPool(ps);
  if (pool.length < 3) return null;
  const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, 6).sort((a, b) => (ENEMIES[a]?.level ?? 0) - (ENEMIES[b]?.level ?? 0));
  rush = { list: pick, i: 0, start: now, level: ps.d.level, diff: difficultyId() };
  return rush;
}
export function rushBoss() { return rush ? rush.list[rush.i] ?? null : null; }
export function endRush() { rush = null; }

/** The current rush boss has fallen: true when that was the last one (the time is recorded). */
export function rushAdvance(_now?: number): { done: boolean; secs: number; best: boolean } {
  const now = clock();
  if (!rush) return { done: false, secs: 0, best: false };
  rush.i++;
  const secs = now - rush.start;
  if (rush.i < rush.list.length) return { done: false, secs, best: false };
  const r = records();
  r.rush.clears++;
  if (rush.diff === 'hard') r.rush.hardClears++;
  const best = r.rush.best === undefined || secs < r.rush.best;
  if (best) { r.rush.best = Math.round(secs * 10) / 10; r.rush.bestDiff = rush.diff; }
  touch();
  rush = null;
  return { done: true, secs, best };
}

export function fmtTime(secs: number) {
  const m = Math.floor(secs / 60), s = secs - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
