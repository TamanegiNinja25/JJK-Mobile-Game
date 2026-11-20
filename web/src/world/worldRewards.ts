// What happens when a curse falls: experience and yen, quest progress, records, drops and caches, the end of a
// boss fight, daily exorcisms and Boss Rush. Split out of World.ts; it works on the world it is given.
import { voice, voiceFor } from '../audio/Voice';
import { fmtTime, noteBossTime, noteCount, noteKill, rushAdvance, rushBoss } from '../rpg/Records';
import { haptic } from '../core/Haptics';
import { difficulty } from '../core/Difficulty';
import * as THREE from 'three';
import type { Game } from '../Game';
import { Renderer } from '../render/Renderer';
import { Effects } from '../render/Effects';
import { Overlay2D } from '../ui/Overlay2D';
import { CollisionWorld } from './Collision';
import { MapBuilder, MapRuntime, MapDef, BossDef, SpawnerDef, buildTerrain } from './MapBuilder';
import type { NpcDef } from '../entities/NPC';
import { MAPS } from './maps';
import { SplatPainter } from '../render/textures';
import { clearWaterMaterials, tickWater } from '../render/models/buildings';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Actor } from '../entities/Actor';
import { Summon } from '../entities/Summon';
import { NPC, pulseQuestRings } from '../entities/NPC';
import { Projectile } from '../entities/Projectile';
import { Loot, Pickup, Portal } from '../entities/Loot';
import { ENEMIES, GRADE_NAME } from '../rpg/enemies';
import { CLASSES, LEVEL_CAP, expToNext } from '../rpg/classes';
import { getAtlas, AtlasEntry } from './atlas';
import { npcName, type PlayerState } from '../rpg/PlayerState';
import { ITEMS, makeItem, randomGear, rollRarity, uniquesForLevel } from '../rpg/items';
import { warmIcons } from '../ui/Icons';
import { QUEST_BY_ID, NPC_JP } from '../data/story';
import { DOMAIN_NAMES } from './Director';
import { DailyBoss, SIG_CHANCE, dailyPick, markDailyCleared } from '../rpg/Daily';
import { triggerReactions } from '../rpg/skills';
import { Caster, DamageOpts, DamageSource, DomainKind, ProjectileSpec, Target, WorldAPI } from './api';
import { audio, Surface } from '../audio/Audio';
import { music } from '../audio/Music';
import { Weather } from '../render/Weather';
import { occlusion } from '../render/toon';
import { angleDiff, chance, clamp, pick, rand, randInt } from '../core/util';
import type { World } from './World';

export function killEnemy(w: World, e: Enemy, killer: Actor | null) {
  if (!e.alive) return;
  e.alive = false;
  e.hp = 0;
  e.state = 'dead';
  e.model?.die();
  e.spawner?.onDeath(e);
  const ps = w.game.ps!;
  const d = e.d;
  w.sfx(d.deathSfx ?? (e.isBoss ? 'bossDie' : 'curseDie'), e.x, e.z, 0.8);
  w.fx.burst(e.x, 1, e.z, 0x9a4aff, e.isBoss ? 80 : 18, e.isBoss ? 9 : 4, 0.3, 0.9);
  // the curse comes apart: a skull of cursed energy, or for a boss a collapse into the void
  if (e.isBoss) w.fx.sheet('voidImplode', e.x, 1.6, e.z, 7, 1);
  else if (d.ai !== 'dummy') w.fx.sheet('curseSkull', e.x, 0.2, e.z, Math.min(4, 2.2 * Math.max(0.8, e.scale)), 1.7);
  w.fx.burst(e.x, 1, e.z, 0x1a0a20, e.isBoss ? 40 : 10, 3, 0.5, 1.0, false);
  void killer;
  if (d.ai !== 'dummy') triggerReactions('kill', w, w.player, ps.d.skills, { x: e.x, z: e.z });
  if (d.id === 'treasure') { dropCache(w, e); return; }
  if (d.ai === 'dummy' && d.id === 'dummy') {
    ps.questProgress('kill', 'dummy', 1, w.mapDef.id);
    ps.gainExp(6);
    return;
  }
  ps.d.kills++;
  const reward = difficulty().reward;
  ps.gainExp(Math.round(e.st.exp * reward));
  w.overlay.add(e.x, 2.6, e.z, `+${Math.round(e.st.exp * reward * (1 + ps.stats.expBonus))} EXP`, '#b0ffb0', 13);
  ps.questProgress('kill', d.id, 1, w.mapDef.id);
  if (d.ai !== 'dummy') noteKill(d.id, e.isBoss);
  if (e.isBoss) {
    const as = w.bossActive?.enemy === e ? w.bossActive.def.as ?? d.id : d.id;
    ps.questProgress('boss', as, 1);
    if (w.bossActive?.enemy === e) {
      const wb = w.bossActive.def.world;
      if (wb) { ps.d.flags['wb_' + d.id] = ps.d.playTime + wb; w.game.toast(`${d.name} will rise again in about ${Math.round(wb / 60)} minutes.`, 'info', 3.5); }
      w.bossActive = null;
      w.bossDom = null;
      w.game.ui.hud?.setBoss(null);
      w.game.ui.banner('EXORCISED', d.name, '#ffd23a');
      const secs = w.time - w.bossStartT;
      if (noteBossTime(d.id, secs, ps.d.cls)) w.game.toast(`New best time against ${d.name}: ${fmtTime(secs)}`, 'good', 3.5);
      if (w.mapDef.id === 'rushArena' && rushBoss() === d.id) rushWin(w, d.name);
      w.game.bossOutro(as);
      if (w.mapDef.id === 'dailyArena' && dailyPick?.id === d.id) dailyWin(w, e, dailyPick);
      w.fx.flash('#ffffff', 0.6, 0.6);
      w.fx.shake(0.8, 0.6);
      w.fx.hitstop(0.25);
    }
  }
  if (!e.noLoot) dropLoot(w, e);
}

/** A daily exorcism falls: its own drops, seals, sometimes its signature piece; done for today. */
/** A Boss Rush boss falls: on to the next one after a breather, or the gauntlet is cleared. */
function rushWin(w: World, name: string) {
  const r = rushAdvance(w.time);
  const p = w.player;
  if (!r.done) {
    const next = ENEMIES[rushBoss() ?? '']?.name ?? '';
    w.game.toast(`${name} down. Next: ${next}`, 'boss', 3);
    w.schedule(3.2, () => { p.heal(p.maxHpValue() * 0.4); void w.game.travel('rushArena'); });
    return;
  }
  const ps = w.game.ps!;
  const pay = 2000 + ps.d.level * 400;
  ps.d.gold += pay;
  ps.gainExp(Math.round(expToNext(ps.d.level) * 0.5));
  w.game.ui.banner('BOSS RUSH CLEARED', `${fmtTime(r.secs)}${r.best ? ' · new best' : ''}`, '#ffd23a', 3.5);
  w.game.toast(`Boss Rush cleared in ${fmtTime(r.secs)}. +¥${pay.toLocaleString()} and EXP.`, 'good', 5);
  w.schedule(5, () => void w.game.travel('hub'));
}

function dailyWin(w: World, e: Enemy, b: DailyBoss) {
  const ps = w.game.ps!;
  markDailyCleared(ps, b.id);
  noteCount('dailies');
  const drop = (id: string, qty: number, rarity: 0 | 1 | 2 | 3 = 0) => w.loot.push(new Loot(w, e.x + rand(-1.2, 1.2), e.z + rand(-1.2, 1.2), 0, makeItem(id, rarity, qty)));
  for (const dr of b.drops) if (chance(dr.chance)) drop(dr.id, randInt(dr.qty[0], dr.qty[1]));
  drop('seal', randInt(b.seals[0], b.seals[1]));
  const sig = chance(SIG_CHANCE);
  if (sig) { drop(b.sig, 1, 3); w.fx.pillar(e.x, e.z, 1, 6, 0xff9a3a, 1.4); }
  w.game.toast(sig ? `Signature drop: ${ITEMS[b.sig].name}!` : 'Daily exorcism cleared. Nitta will have a new list tomorrow.', sig ? 'good' : 'quest', 3.5);
  w.game.save(false);
}

/** Sealed caches in interiors: always yen and a consumable, usually a piece of gear. */
function dropCache(w: World, e: Enemy) {
  const ps = w.game.ps!, L = e.level;
  if (e.cacheFlag) {
    // hand-placed caches in the open areas are worth the walk: better gear, materials, and they stay opened
    ps.d.flags[e.cacheFlag] = true;
    const total = w.map.caches.length, found = w.map.caches.filter(c => ps.d.flags[c.flag]).length;
    w.game.toast(`Sealed cache opened — ${found}/${total} in ${w.mapDef.name}`, 'good', 3);
    const gid = randomGear(L, ps.d.cls);
    if (gid) w.loot.push(new Loot(w, e.x + rand(-0.6, 0.6), e.z + rand(-0.6, 0.6), 0, makeItem(gid, chance(0.4) ? 2 : 1, 1)));
    w.loot.push(new Loot(w, e.x + rand(-0.6, 0.6), e.z + rand(-0.6, 0.6), 0, makeItem('fragment', 0, randInt(2, 5))));
    if (chance(0.45)) w.loot.push(new Loot(w, e.x + rand(-0.6, 0.6), e.z + rand(-0.6, 0.6), 0, makeItem('core', 0, 1)));
  }
  w.fx.burst(e.x, 0.8, e.z, 0xffd84a, 24, 4, 0.3, 0.8);
  w.loot.push(new Loot(w, e.x, e.z, Math.round((40 + L * 22) * rand(0.8, 1.3)), null));
  const drops: [string, number, 0 | 1 | 2 | 3][] = [[L >= 22 ? pick(['hpL', 'ceL']) : L >= 10 ? pick(['hpM', 'ceM']) : pick(['hpS', 'ceS']), randInt(1, 2), 0]];
  if (chance(0.75)) { const id = randomGear(L, ps.d.cls); if (id) drops.push([id, 1, rollRarity(0.15)]); }
  if (chance(0.5)) drops.push(['fragment', randInt(1, 3), 0]);
  for (const [id, qty, r] of drops) w.loot.push(new Loot(w, e.x + rand(-0.6, 0.6), e.z + rand(-0.6, 0.6), 0, makeItem(id, r, qty)));
}

function dropLoot(w: World, e: Enemy) {
  const ps = w.game.ps!;
  const L = e.level;
  const boss = e.isBoss;
  const n = boss ? 6 : 1;
  for (let i = 0; i < n; i++) if (boss || chance(0.7)) w.loot.push(new Loot(w, e.x, e.z, Math.round(e.st.gold * difficulty().reward / n * rand(0.6, 1.4)), null));
  const drops: { id: string; qty: number; rarity: 0 | 1 | 2 | 3 }[] = [];
  if (chance(boss ? 1 : 0.17)) drops.push({ id: 'fragment', qty: boss ? randInt(4, 8) : randInt(1, 2), rarity: 0 });
  if (chance(boss ? 0.8 : e.d.grade <= 1 ? 0.06 : 0.012)) drops.push({ id: 'core', qty: 1, rarity: 0 });
  if (chance(boss ? 1 : 0.08)) {
    const pots = L >= 22 ? ['hpL', 'ceL', 'hpM'] : L >= 10 ? ['hpM', 'ceM', 'hpS'] : ['hpS', 'ceS'];
    drops.push({ id: pick(pots), qty: boss ? 3 : 1, rarity: 0 });
  }
  const gearChance = boss ? 1 : 0.06 + (4 - e.d.grade) * 0.01;
  const gearRolls = boss ? 2 : 1;
  for (let g = 0; g < gearRolls; g++) if (chance(gearChance)) {
    const id = randomGear(L, ps.d.cls);
    if (id) drops.push({ id, qty: 1, rarity: boss ? (chance(0.5) ? 2 : 1) : rollRarity(e.d.grade <= 2 ? 0.05 : 0) });
  }
  if (boss && chance(0.35)) {
    const u = uniquesForLevel(L).filter(b => !b.cls || b.cls === ps.d.cls);
    if (u.length) drops.push({ id: pick(u).id, qty: 1, rarity: 3 });
  }
  // quest drops only while needed
  for (const qd of e.d.drops ?? []) {
    const need = Object.entries(ps.d.quests).some(([qid, st]) => st.state !== 'done' && QUEST_BY_ID[qid]?.objectives.some(o => o.type === 'collect' && o.item === qd.item && ps.countItem(qd.item) < o.count));
    if (need && chance(qd.chance)) drops.push({ id: qd.item, qty: 1, rarity: 0 });
  }
  for (const dr of drops) w.loot.push(new Loot(w, e.x + rand(-0.5, 0.5), e.z + rand(-0.5, 0.5), 0, makeItem(dr.id, dr.rarity as 0 | 1 | 2 | 3, dr.qty)));
  void ITEMS;
}
