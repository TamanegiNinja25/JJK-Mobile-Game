// Shared RPG types.

/** The three first-years, whose eyes the story is told through. */
export type BaseClassId = 'yuji' | 'megumi' | 'nobara';
/** Every playable sorcerer, including the ones unlocked by finishing a character or a quest line. */
export type ClassId = BaseClassId | 'sukunaYuji' | 'sukunaMegumi' | 'heianSukuna' | 'moduloYuji';
export type Attr = 'str' | 'dex' | 'vit' | 'ce';
export type Slot = 'weapon' | 'head' | 'outfit' | 'charm' | 'ring' | 'shoes';
export type ItemKind = Slot | 'consumable' | 'material' | 'quest';

export interface Stats {
  maxHp: number;
  maxCe: number;
  atk: number;
  def: number;
  crit: number;
  critDmg: number;
  atkSpd: number;
  moveSpd: number;
  ceRegen: number;
  hpRegen: number;
  evasion: number;
  skillPow: number;
  bfChance: number;
  dmgReduce: number;
  lifesteal: number;
  cdr: number;
  expBonus: number;
  goldBonus: number;
  summonPow: number;
  projPow: number;
  /** extra damage vs nail-marked enemies */
  markDmg: number;
}

export type StatKey = keyof Stats | Attr | 'hpPct' | 'atkPct' | 'cePct' | 'defPct';

export const STAT_LABEL: Record<string, string> = {
  maxHp: 'Max HP', maxCe: 'Max CE', atk: 'Attack', def: 'Defense', crit: 'Crit Rate', critDmg: 'Crit Damage',
  atkSpd: 'Attack Speed', moveSpd: 'Move Speed', ceRegen: 'CE Regen', hpRegen: 'HP Regen', evasion: 'Evasion',
  skillPow: 'Skill Power', bfChance: 'Black Flash', dmgReduce: 'Damage Reduction', lifesteal: 'Lifesteal', cdr: 'Cooldown Reduction',
  expBonus: 'EXP Bonus', goldBonus: 'Yen Bonus', summonPow: 'Shikigami Power', projPow: 'Projectile Power', markDmg: 'Damage vs Marked',
  str: 'STR', dex: 'DEX', vit: 'VIT', ce: 'CE', hpPct: 'Max HP', atkPct: 'Attack', cePct: 'Max CE', defPct: 'Defense',
};

/** Keys displayed as percentages. */
export const PCT_KEYS = new Set(['crit', 'critDmg', 'atkSpd', 'moveSpd', 'evasion', 'skillPow', 'bfChance', 'dmgReduce', 'lifesteal', 'cdr', 'expBonus', 'goldBonus', 'summonPow', 'projPow', 'markDmg', 'hpPct', 'atkPct', 'cePct', 'defPct']);

export interface Affix { k: StatKey; v: number }

export interface ItemInstance {
  uid: number;
  base: string;
  rarity: 0 | 1 | 2 | 3;
  plus: number;
  affixes: Affix[];
  qty: number;
}

export interface QuestState {
  state: 'active' | 'ready' | 'done';
  progress: number[];
}

export interface CheatFlags { god?: boolean; infCe?: boolean; oneHit?: boolean; noCd?: boolean; speed?: boolean; dblExp?: boolean; travel?: boolean }

export interface SaveData {
  version: number;
  slot: number;
  cls: ClassId;
  level: number;
  exp: number;
  statPoints: number;
  skillPoints: number;
  attrs: Record<Attr, number>;
  skills: Record<string, number>;
  quick: (string | null)[];
  potions: (string | null)[];
  inventory: ItemInstance[];
  equip: Partial<Record<Slot, ItemInstance>>;
  gold: number;
  hp: number;
  ce: number;
  domain: number;
  map: string;
  x: number;
  z: number;
  quests: Record<string, QuestState>;
  flags: Record<string, number | string | boolean>;
  /** quest the HUD tracker follows (falls back to the main quest) */
  tracked?: string | null;
  fingers: number;
  playTime: number;
  kills: number;
  uidCounter: number;
  savedAt: number;
  cheats?: CheatFlags;
  /** progress of the other sorcerers played in this save (the active one lives in the fields above) */
  roster?: Partial<Record<ClassId, RosterEntry>>;
}

/** One sorcerer's own progress inside a save. Armour, items, yen and quests are shared; weapons are not. */
export interface RosterEntry {
  level: number;
  exp: number;
  statPoints: number;
  skillPoints: number;
  attrs: Record<Attr, number>;
  skills: Record<string, number>;
  quick: (string | null)[];
  weapon: ItemInstance | null;
}
