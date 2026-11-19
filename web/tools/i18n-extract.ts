// Dev tool (not part of the game): dumps every name and description the game data holds, keyed the way i18n.tr() looks them up.
import { QUESTS, NPC_NAMES, CHAPTERS } from '../src/data/story';
import { ITEMS } from '../src/rpg/items';
import { SKILLS } from '../src/rpg/skills';
import '../src/rpg/skillsGuest';
import '../src/rpg/skillsUnlock';
import '../src/rpg/skillsRoster';
import { ENEMIES, GRADE_NAME } from '../src/rpg/enemies';
import { CLASSES } from '../src/rpg/classes';
import { ACHIEVEMENTS } from '../src/rpg/Records';
import { DAILY_BOSSES } from '../src/rpg/Daily';
import { MAPS } from '../src/world/maps';
import { DIFFICULTY } from '../src/core/Difficulty';
import { writeFileSync } from 'node:fs';

const NUM = /[+\-−]?\d[\d,]*(?:\.\d+)?/g;
const out: Record<string, string[]> = { names: [], quests: [], items: [], skills: [], classes: [], misc: [] };
const add = (k: string, s: unknown) => { if (typeof s === 'string' && /[A-Za-z]/.test(s)) out[k].push(s.trim().replace(NUM, (m) => (/\d/.test(m) ? '{n}' : m))); };
const addExact = (k: string, s: unknown) => { if (typeof s === 'string' && /[A-Za-z]/.test(s)) out[k].push(s.trim()); };
for (const n of Object.values(NPC_NAMES)) addExact('names', n);
for (const c of Object.values(CHAPTERS)) addExact('quests', c.name);
for (const q of Object.values(QUESTS) as any[]) {
  addExact('quests', q.name);
  for (const o of q.objectives ?? []) add('quests', o.label);
  addExact('quests', q.summary); addExact('quests', q.desc);
}
for (const i of Object.values(ITEMS) as any[]) { addExact('items', i.name); add('items', i.desc); }
for (const s of Object.values(SKILLS) as any[]) { addExact('skills', s.name); try { add('skills', s.desc(1)); add('skills', s.desc(3)); } catch { /* */ } }
for (const e of Object.values(ENEMIES) as any[]) addExact('names', e.name);
for (const g of Object.values(GRADE_NAME)) addExact('names', g);
for (const c of Object.values(CLASSES) as any[]) { addExact('classes', c.name); addExact('classes', c.short); addExact('classes', c.title); addExact('classes', c.desc); addExact('classes', c.unlock); }
for (const a of ACHIEVEMENTS) { addExact('misc', a.name); addExact('misc', a.desc); }
for (const d of DAILY_BOSSES as any[]) addExact('misc', d.blurb);
for (const m of Object.values(MAPS) as any[]) addExact('names', m.name);
for (const d of Object.values(DIFFICULTY)) { addExact('misc', d.label); add('misc', d.about); }
for (const k in out) out[k] = [...new Set(out[k])].filter(Boolean);
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(Object.entries(out).map(([k, v]) => `${k} ${v.length}`).join(', '));
