// Cheat toggles (saved per slot) and one-shot cheat actions for the Cheats menu tab.
import type { Game } from '../Game';
import { CheatFlags, Slot } from './types';
import { ITEMS, makeItem, isGear, SLOT_ORDER } from './items';
import { SKILLS, classSkills } from './skills';
import { LEVEL_CAP, expToNext } from './classes';
import { QUEST_BY_ID } from '../data/story';
import { objCount } from './PlayerState';

export const CHEAT_TOGGLES: { id: keyof CheatFlags; label: string; desc: string }[] = [
  { id: 'god', label: 'God Mode', desc: 'Take no damage from anything.' },
  { id: 'infCe', label: 'Infinite Cursed Energy', desc: 'Cursed energy never runs out.' },
  { id: 'oneHit', label: 'One-Hit Exorcism', desc: 'Every hit you or your shikigami land is lethal.' },
  { id: 'noCd', label: 'No Cooldowns', desc: 'Techniques are ready again immediately.' },
  { id: 'speed', label: 'Godspeed', desc: 'Move 50% faster.' },
  { id: 'dblExp', label: 'Double EXP', desc: 'Earn twice the experience.' },
  { id: 'travel', label: 'Unlock All Areas', desc: "Ijichi will drive you anywhere, story or not." },
];

export interface CheatAction { id: string; label: string; group: string; run: (g: Game) => string }

/** Best non-unique base item for a slot that the class can use at this level. */
function bestBase(slot: Slot, cls: string, level: number) {
  return Object.values(ITEMS)
    .filter(b => b.kind === slot && !b.unique && (!b.cls || b.cls === cls) && b.req <= level)
    .sort((a, b) => b.req - a.req)[0];
}

function give(g: Game, id: string, qty = 1, rarity: 0 | 1 | 2 | 3 = 0) {
  return g.ps!.addItem(makeItem(id, rarity, qty));
}

export const CHEAT_ACTIONS: CheatAction[] = [
  { id: 'money', label: '+¥100,000', group: 'Resources', run: g => { g.ps!.addGold(100000); return 'Received ¥100,000.'; } },
  { id: 'potions', label: 'Stock potions', group: 'Resources', run: g => {
    for (const id of ['hpS', 'hpM', 'hpL', 'ceS', 'ceM', 'ceL', 'onigiri']) give(g, id, 99);
    give(g, 'warp', 20);
    return 'Potions stocked.';
  } },
  { id: 'materials', label: 'Infusion materials', group: 'Resources', run: g => { give(g, 'fragment', 300); give(g, 'core', 60); return 'Received 300 fragments and 60 cores.'; } },
  { id: 'finger', label: "+1 Sukuna's Finger", group: 'Resources', run: g => {
    const ps = g.ps!;
    if (ps.d.fingers >= 20) return 'You already hold all twenty fingers.';
    ps.d.fingers++; ps.recalc();
    return `Fingers: ${ps.d.fingers}/20.`;
  } },

  { id: 'lvl1', label: '+1 Level', group: 'Progression', run: g => levelUp(g, 1) },
  { id: 'lvl10', label: '+10 Levels', group: 'Progression', run: g => levelUp(g, 10) },
  { id: 'lvlMax', label: `Max Level (${LEVEL_CAP})`, group: 'Progression', run: g => levelUp(g, LEVEL_CAP) },
  { id: 'statPts', label: '+50 Stat Points', group: 'Progression', run: g => { g.ps!.d.statPoints += 50; g.ps!.emit('stats'); return '+50 stat points.'; } },
  { id: 'skillPts', label: '+10 Skill Points', group: 'Progression', run: g => { g.ps!.d.skillPoints += 10; g.ps!.emit('skills'); return '+10 skill points.'; } },
  { id: 'maxSkills', label: 'Master All Techniques', group: 'Progression', run: g => {
    const ps = g.ps!;
    for (const s of classSkills(ps.d.cls)) ps.d.skills[s.id] = s.max;
    ps.autoFillQuickSlots();
    ps.recalc(); ps.emit('skills');
    return 'Every technique is at its maximum level.';
  } },

  { id: 'gear', label: 'Special Grade Gear Set', group: 'Equipment', run: g => {
    const ps = g.ps!;
    let n = 0;
    for (const slot of SLOT_ORDER) {
      const b = bestBase(slot, ps.d.cls, Math.max(ps.d.level, 1));
      if (b && give(g, b.id, 1, 2)) n++;
    }
    return n ? `Added ${n} Special Grade items to your bag.` : 'Your bag is full.';
  } },
  { id: 'uniques', label: 'All Cursed Tools', group: 'Equipment', run: g => {
    const ps = g.ps!;
    let n = 0;
    for (const b of Object.values(ITEMS)) if (b.unique && isGear(b) && (!b.cls || b.cls === ps.d.cls) && give(g, b.id)) n++;
    return n ? `Added ${n} Cursed Tools to your bag.` : 'Your bag is full.';
  } },

  { id: 'heal', label: 'Full Restore', group: 'World', run: g => {
    const ps = g.ps!;
    ps.d.hp = ps.stats.maxHp; ps.d.ce = ps.stats.maxCe; ps.d.domain = 100;
    return 'HP, CE and domain gauge restored.';
  } },
  { id: 'quests', label: 'Complete Quest Objectives', group: 'World', run: g => {
    const ps = g.ps!;
    let n = 0;
    for (const [id, st] of Object.entries(ps.d.quests)) {
      const q = QUEST_BY_ID[id];
      if (!q || st.state !== 'active') continue;
      q.objectives.forEach((o, i) => {
        if (o.type === 'collect') { const miss = o.count - ps.countItem(o.item); if (miss > 0) give(g, o.item, miss); }
        if (o.type === 'pay' && ps.d.gold < o.gold) ps.addGold(o.gold - ps.d.gold);
        st.progress[i] = objCount(o);
      });
      ps.questCheckCollect();
      ps.questProgress('reach', '', 0);
      ps.forceQuestRefresh(id);
      n++;
    }
    g.world.refreshNpcs();
    return n ? `${n} quest${n > 1 ? 's' : ''} ready to turn in.` : 'No active quests.';
  } },
  { id: 'kill', label: 'Exorcise Nearby Curses', group: 'World', run: g => {
    const n = g.world.killNearby(30);
    return n ? `Exorcised ${n} curse${n > 1 ? 's' : ''}.` : 'No curses nearby.';
  } },
];

function levelUp(g: Game, n: number) {
  const ps = g.ps!;
  if (ps.d.level >= LEVEL_CAP) return 'Already at the maximum level.';
  const target = Math.min(LEVEL_CAP, ps.d.level + n);
  let need = -ps.d.exp;
  for (let l = ps.d.level; l < target; l++) need += expToNext(l);
  const dbl = ps.d.cheats?.dblExp;
  if (ps.d.cheats) ps.d.cheats.dblExp = false;
  ps.gainExp(Math.ceil(need / (1 + ps.stats.expBonus)) + 1);
  if (ps.d.cheats) ps.d.cheats.dblExp = dbl;
  return `Reached level ${ps.d.level}.`;
}

export function cheatOn(g: Game, id: keyof CheatFlags) { return !!g.ps?.d.cheats?.[id]; }

export function toggleCheat(g: Game, id: keyof CheatFlags) {
  const ps = g.ps!;
  ps.d.cheats = ps.d.cheats ?? {};
  ps.d.cheats[id] = !ps.d.cheats[id];
  if (id === 'speed') ps.recalc();
  if (id === 'infCe' && ps.d.cheats[id]) ps.d.ce = ps.stats.maxCe;
  return ps.d.cheats[id]!;
}

export function runCheat(g: Game, id: string) {
  const a = CHEAT_ACTIONS.find(x => x.id === id);
  return a ? a.run(g) : '';
}

void SKILLS;
