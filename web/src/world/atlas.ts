// Where things live: each map's build script is replayed once against a recording stand-in
// for MapBuilder, so quest tracking can tell which area holds an NPC, boss, pickup or curse
// without loading that area.
import type { MapDef, BossDef, SpawnerDef } from './MapBuilder';
import type { NpcDef } from '../entities/NPC';
import type { PortalDef } from '../entities/Loot';
import { MAPS } from './maps';

export interface AtlasEntry {
  npcs: NpcDef[];
  bosses: BossDef[];
  pickups: { item: string; quest: string }[];
  portals: PortalDef[];
  enemies: Set<string>;
}

let atlas: Record<string, AtlasEntry> | null = null;

function record(def: MapDef): AtlasEntry {
  const e: AtlasEntry = { npcs: [], bosses: [], pickups: [], portals: [], enemies: new Set() };
  const calls: Record<string, (...a: any[]) => void> = {
    npc: (d: NpcDef) => e.npcs.push(d),
    boss: (d: BossDef) => e.bosses.push(d),
    pickup: (item: string, _x: number, _z: number, quest: string) => e.pickups.push({ item, quest }),
    portal: (p: PortalDef) => e.portals.push(p),
    spawner: (s: SpawnerDef) => { for (const x of s.enemies) e.enemies.add(x.id); },
  };
  // every other builder call is accepted and ignored; assignments (b.rng = ...) are swallowed
  const stub: any = new Proxy({}, {
    get: (_t, k: string) => {
      if (k === 'def') return def;
      if (k === 'night') return def.night;
      const f = calls[k];
      return (...a: any[]) => { f?.(...a); return stub; };
    },
    set: () => true,
  });
  try { def.build(stub); } catch { /* a map that can't be replayed just has fewer hints */ }
  return e;
}

export function getAtlas(): Record<string, AtlasEntry> {
  if (!atlas) {
    atlas = {};
    for (const [id, def] of Object.entries(MAPS)) atlas[id] = record(def);
  }
  return atlas;
}
