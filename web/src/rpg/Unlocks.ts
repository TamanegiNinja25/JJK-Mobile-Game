// Sorcerers unlocked by play. Unlocks belong to the device, not to one save: finish the story
// in one slot and the new sorcerers can start a fresh game in another, or join any save.
import { ClassId, SaveData } from './types';
import { BASE_CLASSES, UNLOCKABLE_CLASSES } from './classes';

const KEY = 'cursedChronicles.unlocks';
const SAVE_KEY = 'cursedChronicles.save.';

const done = (d: SaveData, id: string) => d.quests?.[id]?.state === 'done';

/** What each unlockable sorcerer asks for. */
const RULES: Partial<Record<ClassId, (d: SaveData) => boolean>> = {
  sukunaYuji: d => done(d, 'm14'),
  sukunaMegumi: d => done(d, 'm23'),
  heianSukuna: d => done(d, 'm26'),
  moduloYuji: d => done(d, 'm30') || !!d.flags?.finished_yuji || (done(d, 'm26') && d.cls === 'yuji'),
};

function stored(): Set<ClassId> {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) as ClassId[] : [];
    return new Set(Array.isArray(list) ? list.filter(id => UNLOCKABLE_CLASSES.includes(id)) : []);
  } catch { return new Set(); }
}

function store(s: Set<ClassId>) {
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* storage unavailable */ }
}

/** Every sorcerer that can be played on this device. Also picks up saves made before unlocks existed. */
export function unlockedClasses(): Set<ClassId> {
  const s = stored();
  const before = s.size;
  for (let i = 0; i < 3; i++) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + i);
      if (!raw) continue;
      const d = JSON.parse(raw) as SaveData;
      for (const id of UNLOCKABLE_CLASSES) if (!s.has(id) && RULES[id]?.(d)) s.add(id);
    } catch { /* a damaged slot unlocks nothing */ }
  }
  if (s.size !== before) store(s);
  for (const id of BASE_CLASSES) s.add(id);
  return s;
}

export function isUnlocked(id: ClassId) { return unlockedClasses().has(id); }

/** Checks a save against the rules and records anything new. Returns the sorcerers it just unlocked. */
export function checkUnlocks(d: SaveData): ClassId[] {
  const s = stored();
  const fresh: ClassId[] = [];
  for (const id of UNLOCKABLE_CLASSES) if (!s.has(id) && RULES[id]?.(d)) { s.add(id); fresh.push(id); }
  if (fresh.length) store(s);
  return fresh;
}
