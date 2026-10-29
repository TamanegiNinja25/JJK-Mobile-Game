// Item database, random affix rolling, rarity, enhancement and naming.
import { Affix, ClassId, ItemInstance, ItemKind, Slot, StatKey, STAT_LABEL, PCT_KEYS } from './types';
import { Rng, pick, rand, randInt } from '../core/util';

export interface IconSpec { shape: string; c1: string; c2?: string; glyph?: string }

export interface ItemBase {
  id: string;
  name: string;
  kind: ItemKind;
  cls?: ClassId;
  req: number;
  stats?: Partial<Record<StatKey, number>>;
  price: number;
  icon: IconSpec;
  desc?: string;
  stack?: number;
  /** consumable effect */
  use?: { hp?: number; ce?: number; hpPct?: number; regen?: number; warp?: string; buff?: string };
  /** uniques: fixed rarity 3 with these affixes */
  unique?: Affix[];
  /** cannot be sold/dropped */
  questItem?: boolean;
}

const W = (id: string, name: string, cls: ClassId, req: number, atk: number, price: number, shape: string, c1: string, c2: string, extra: Partial<ItemBase> = {}): ItemBase =>
  ({ id, name, kind: 'weapon', cls, req, stats: { atk }, price, icon: { shape, c1, c2 }, ...extra });

const A = (id: string, name: string, kind: Slot, req: number, stats: Partial<Record<StatKey, number>>, price: number, shape: string, c1: string, c2: string, extra: Partial<ItemBase> = {}): ItemBase =>
  ({ id, name, kind, req, stats, price, icon: { shape, c1, c2 }, ...extra });

export const ITEMS: Record<string, ItemBase> = {};
function reg(...items: ItemBase[]) { for (const i of items) ITEMS[i.id] = i; }

// ---- Weapons ----
reg(
  W('wraps', 'Training Wraps', 'yuji', 1, 6, 40, 'fist', '#e8dcc0', '#a89a7a'),
  W('ironKnuckle', 'Iron Knuckles', 'yuji', 7, 16, 320, 'fist', '#9aa4ae', '#5a646e'),
  W('cursedKnuckle', 'Cursed Knuckles', 'yuji', 14, 30, 1100, 'fist', '#6a4a9a', '#e05aff'),
  W('grade1Fist', 'Grade 1 Gauntlets', 'yuji', 22, 48, 2800, 'fist', '#3a3a48', '#ff5a4a'),
  W('sgFist', 'Special Grade Gauntlets', 'yuji', 30, 70, 6200, 'fist', '#1a1a22', '#ff2a3a'),
  W('slaughterDemon', 'Slaughter Demon', 'yuji', 18, 44, 5000, 'knife', '#2a2a30', '#ff3a3a', { unique: [{ k: 'crit', v: 0.08 }, { k: 'bfChance', v: 0.03 }, { k: 'str', v: 8 }], desc: 'A cursed knife Gojo handed you. Black Flash comes easier when it is in your hand.' }),
  W('bfWraps', 'Wraps of the Black Flash', 'yuji', 32, 86, 12000, 'fist', '#111111', '#ff2a2a', { unique: [{ k: 'bfChance', v: 0.07 }, { k: 'critDmg', v: 0.4 }, { k: 'str', v: 14 }, { k: 'atkSpd', v: 0.1 }], desc: 'Cursed energy lands 0.000001 seconds after the blow.' }),

  W('tanto', 'Practice Tanto', 'megumi', 1, 6, 40, 'blade', '#c8ccd4', '#5a4a3a'),
  W('wakizashi', 'Steel Wakizashi', 'megumi', 7, 16, 320, 'blade', '#d8dce4', '#2a2a3a'),
  W('shadowBlade', 'Shadow Blade', 'megumi', 14, 30, 1100, 'blade', '#3a3a5a', '#8a7aff'),
  W('cursedKatana', 'Cursed Katana', 'megumi', 22, 48, 2800, 'blade', '#e8e8f0', '#3a2a6a'),
  W('spiritEdge', 'Spirit Edge', 'megumi', 30, 70, 6200, 'blade', '#bfefff', '#1a3a5a'),
  W('invertedSpear', 'Inverted Spear of Heaven', 'megumi', 26, 62, 9000, 'spear', '#d8d8e0', '#9a2a4a', { unique: [{ k: 'crit', v: 0.1 }, { k: 'atkPct', v: 0.12 }, { k: 'ce', v: 8 }], desc: 'A cursed tool that nullifies techniques it touches.' }),
  W('dragonBone', 'Dragon-Bone', 'megumi', 34, 90, 13000, 'blade', '#e8e0c8', '#4a3a2a', { unique: [{ k: 'summonPow', v: 0.25 }, { k: 'atkPct', v: 0.15 }, { k: 'critDmg', v: 0.35 }, { k: 'ce', v: 12 }], desc: 'Stores the force of impact and releases it as a burst.' }),

  W('carpHammer', 'Carpenter Hammer', 'nobara', 1, 6, 40, 'hammer', '#9a7a5a', '#8a8a92'),
  W('ironMallet', 'Iron Mallet', 'nobara', 7, 16, 320, 'hammer', '#7a5a3a', '#aab0b8'),
  W('cursedHammer', 'Cursed Hammer', 'nobara', 14, 30, 1100, 'hammer', '#5a3a2a', '#ff7a3a'),
  W('dollHammer', 'Straw Doll Hammer', 'nobara', 22, 48, 2800, 'hammer', '#c8a85a', '#4a2a1a'),
  W('resMallet', 'Resonance Mallet', 'nobara', 30, 70, 6200, 'hammer', '#2a2a3a', '#ff4a8a'),
  W('heirloom', 'Kugisaki Heirloom Hammer', 'nobara', 18, 44, 5000, 'hammer', '#d8b04a', '#5a2a1a', { unique: [{ k: 'projPow', v: 0.15 }, { k: 'dex', v: 8 }, { k: 'crit', v: 0.05 }], desc: 'Grandma would be proud. Probably.' }),
  W('crownNail', 'Hairpin Crown', 'nobara', 34, 90, 13000, 'hammer', '#ff4a6a', '#f0e0c0', { unique: [{ k: 'projPow', v: 0.3 }, { k: 'skillPow', v: 0.2 }, { k: 'bfChance', v: 0.04 }, { k: 'dex', v: 14 }], desc: 'Every nail sings in resonance.' }),
);

// ---- Unlockable sorcerers: one line of gauntlets each, a step above the first-years' weapons ----
reg(
  W('vesselWrapsS', 'Vessel\'s Wraps', 'sukunaYuji', 1, 8, 60, 'fist', '#f0e8e0', '#c83a4a'),
  W('kingKnuckleS', 'Cursed King Knuckles', 'sukunaYuji', 15, 36, 1400, 'fist', '#2a1a1e', '#ff3a4a'),
  W('fingerFistS', 'Finger-Bone Gauntlets', 'sukunaYuji', 30, 84, 7400, 'fist', '#e8d8c0', '#8a0d18'),
  W('shrineFistS', 'Shrine Gauntlets', 'sukunaYuji', 55, 148, 24000, 'fist', '#3a0a10', '#ff5a3a'),
  W('kingFistS', 'Gauntlets of the King', 'sukunaYuji', 80, 236, 52000, 'fist', '#111111', '#ff2a3a'),
  W('shibuyaClaws', 'Claws of Shibuya', 'sukunaYuji', 40, 120, 20000, 'fist', '#1a0a0e', '#ff2a3a', { unique: [{ k: 'critDmg', v: 0.35 }, { k: 'skillPow', v: 0.15 }, { k: 'str', v: 14 }, { k: 'ce', v: 10 }], desc: 'October 31st. Twenty fingers\' worth of malice, and a city that never got its name back.' }),

  W('shadowWrapsS', 'Shadow-Bound Wraps', 'sukunaMegumi', 1, 8, 60, 'fist', '#2a2a3a', '#c83a7a'),
  W('tenShadowKnuckle', 'Ten Shadows Knuckles', 'sukunaMegumi', 15, 36, 1400, 'fist', '#1a1a2a', '#8a7aff'),
  W('chimeraFist', 'Chimera Gauntlets', 'sukunaMegumi', 30, 84, 7400, 'fist', '#2a2236', '#c83a7a'),
  W('agitoFist', 'Agito Claws', 'sukunaMegumi', 55, 148, 24000, 'fist', '#1a1a22', '#e8e8f0'),
  W('mahoragaFist', 'Gauntlets of the Divine General', 'sukunaMegumi', 80, 236, 52000, 'fist', '#e8e0d0', '#ffd04a'),
  W('kamutoke', 'Kamutoke', 'sukunaMegumi', 45, 126, 22000, 'fist', '#3a3a5a', '#9ae6ff', { unique: [{ k: 'summonPow', v: 0.3 }, { k: 'skillPow', v: 0.15 }, { k: 'crit', v: 0.06 }, { k: 'ce', v: 14 }], desc: 'A cursed tool that calls down lightning. Sukuna aimed it at the strongest, and the sky answered.' }),

  W('heianWraps', 'Heian Silk Wraps', 'heianSukuna', 1, 9, 70, 'fist', '#f2eee4', '#ff6a2a'),
  W('fourArmBands', 'Four-Armed Bracers', 'heianSukuna', 15, 38, 1500, 'fist', '#2a1a14', '#ff8a3a'),
  W('calamityFist', 'Calamity Gauntlets', 'heianSukuna', 30, 88, 7800, 'fist', '#1a1010', '#ff5a2a'),
  W('flameFist', 'Divine Flame Gauntlets', 'heianSukuna', 55, 156, 25000, 'fist', '#2a0a06', '#ffb03a'),
  W('heianKingFist', 'Gauntlets of the Heian King', 'heianSukuna', 80, 248, 56000, 'fist', '#0a0a0a', '#ff6a2a'),
  W('burningWraps', 'Ryomen\'s Burning Wraps', 'heianSukuna', 50, 140, 26000, 'fist', '#3a0a06', '#ffd04a', { unique: [{ k: 'atkPct', v: 0.15 }, { k: 'bfChance', v: 0.04 }, { k: 'str', v: 16 }, { k: 'ce', v: 12 }], desc: 'Cloth from a shrine that burned a thousand years ago. It has not stopped smouldering.' }),

  W('moduloWraps', 'Worn Wraps', 'moduloYuji', 1, 8, 60, 'fist', '#d8d0c0', '#ff8aa0'),
  W('oldKnuckle', 'Veteran Knuckles', 'moduloYuji', 15, 36, 1400, 'fist', '#3a3a44', '#ff8aa0'),
  W('bloodFist', 'Blood-Forged Gauntlets', 'moduloYuji', 30, 84, 7400, 'fist', '#2a0a10', '#ff2a4a'),
  W('soulFist', 'Soul-Strike Gauntlets', 'moduloYuji', 55, 148, 24000, 'fist', '#1a1a2a', '#9ad0ff'),
  W('moduloFist', 'Gauntlets of Sixty-Eight Winters', 'moduloYuji', 80, 236, 52000, 'fist', '#141418', '#ff8aa0'),
  W('promiseWraps', 'Promise Wraps', 'moduloYuji', 40, 120, 20000, 'fist', '#f0e8d8', '#ff4a6a', { unique: [{ k: 'bfChance', v: 0.06 }, { k: 'lifesteal', v: 0.03 }, { k: 'str', v: 14 }, { k: 'vit', v: 12 }], desc: '"Help people. Not just some of them — as many as you can reach." He still does.' }),
);

/** The class's own weapon for a quest reward meant for another sorcerer: the best of its line at that level. */
export function classRewardItem(map: Partial<Record<ClassId, string>> | undefined, cls: ClassId): string | null {
  if (!map) return null;
  if (map[cls]) return map[cls]!;
  const ref = Object.values(map)[0];
  if (!ref) return null;
  const req = ITEMS[ref].req;
  const line = Object.values(ITEMS).filter(b => b.kind === 'weapon' && b.cls === cls && !b.unique && b.req <= req).sort((a, b) => b.req - a.req);
  return line[0]?.id ?? null;
}

// ---- Armour / accessories ----
reg(
  A('uniform', 'Student Uniform', 'outfit', 1, { def: 4, maxHp: 20 }, 50, 'uniform', '#1d2236', '#e0b84e'),
  A('reinUniform', 'Reinforced Uniform', 'outfit', 7, { def: 10, maxHp: 60 }, 360, 'uniform', '#20283e', '#e0b84e'),
  A('g2Uniform', 'Grade 2 Field Uniform', 'outfit', 14, { def: 18, maxHp: 130 }, 1200, 'uniform', '#242a44', '#6ac0ff'),
  A('g1Uniform', 'Grade 1 Field Uniform', 'outfit', 22, { def: 28, maxHp: 240 }, 3000, 'uniform', '#1a1a2a', '#c07aff'),
  A('sgCoat', 'Special Grade Coat', 'outfit', 30, { def: 42, maxHp: 400 }, 6500, 'uniform', '#0e0e16', '#ff5a7a'),
  A('gojoJacket', "Gojo's Spare Jacket", 'outfit', 28, { def: 40, maxHp: 350 }, 11000, 'uniform', '#12141f', '#7fdcff', { unique: [{ k: 'cePct', v: 0.25 }, { k: 'ceRegen', v: 2 }, { k: 'dmgReduce', v: 0.08 }], desc: "It's way too long in the sleeves. Smells faintly of sweets." }),

  A('talisman', 'Paper Talisman', 'charm', 1, { maxCe: 15 }, 60, 'charm', '#f0e6c8', '#c83a3a'),
  A('wardCharm', 'Ward Charm', 'charm', 8, { maxCe: 35, ceRegen: 0.5 }, 420, 'charm', '#e8dcb8', '#3a6ac8'),
  A('cursedBead', 'Cursed Bead', 'charm', 15, { maxCe: 60, crit: 0.03 }, 1300, 'bead', '#6a3a9a', '#ff9aff'),
  A('vowCharm', 'Binding Vow Charm', 'charm', 23, { maxCe: 90, skillPow: 0.08 }, 3200, 'charm', '#2a2a3a', '#ffd04a'),
  A('sixEyes', 'Six Eyes Shard', 'charm', 32, { maxCe: 150, ceRegen: 2 }, 14000, 'eye', '#7fdcff', '#ffffff', { unique: [{ k: 'cdr', v: 0.15 }, { k: 'crit', v: 0.08 }, { k: 'ce', v: 14 }], desc: 'A sliver of perception beyond limits.' }),

  A('hachimaki', 'Training Headband', 'head', 1, { def: 2, maxHp: 10 }, 45, 'headband', '#f4f0e6', '#c83a3a'),
  A('tintedGlasses', 'Tinted Glasses', 'head', 8, { def: 3, crit: 0.02 }, 400, 'glasses', '#2a2a32', '#8ad0ff'),
  A('wardMask', 'Curse-Ward Mask', 'head', 15, { def: 8, maxHp: 60, evasion: 0.02 }, 1250, 'mask', '#e8e4dc', '#9a2a3a'),
  A('veilHood', 'Veil Hood', 'head', 23, { def: 13, maxHp: 120, ceRegen: 0.6 }, 3150, 'hood', '#1a1a2a', '#8a6aff'),
  A('sgCirclet', 'Special Grade Circlet', 'head', 31, { def: 20, maxHp: 200, crit: 0.03 }, 6400, 'circlet', '#d8b04a', '#ff3a5a'),
  A('makiGlasses', "Maki's Spare Glasses", 'head', 20, { def: 10, crit: 0.03 }, 8000, 'glasses', '#3a3a2a', '#c8ff9a', { unique: [{ k: 'crit', v: 0.05 }, { k: 'critDmg', v: 0.2 }, { k: 'str', v: 8 }], desc: 'Cursed-tool lenses that let anyone see curses. Maki wants them back.' }),
  A('blindfold', "Gojo's Blindfold", 'head', 28, { def: 16, maxHp: 150 }, 12500, 'blindfold', '#14141c', '#7fdcff', { unique: [{ k: 'cdr', v: 0.1 }, { k: 'crit', v: 0.06 }, { k: 'evasion', v: 0.06 }], desc: 'It dampens the Six Eyes. On you, it mostly dampens seeing.' }),

  A('beadBracelet', 'Prayer Bead Bracelet', 'ring', 1, { atk: 3, maxCe: 5 }, 45, 'bracelet', '#6a3a2a', '#e0b84e'),
  A('ironRing', 'Iron Ring', 'ring', 8, { atk: 7, crit: 0.01 }, 390, 'ring', '#9aa4ae', '#d8dce4'),
  A('vowRing', 'Binding Vow Ring', 'ring', 15, { atk: 12, critDmg: 0.08 }, 1280, 'ring', '#2a2a3a', '#ffd04a'),
  A('cursedBracer', 'Cursed Bracer', 'ring', 23, { atk: 18, lifesteal: 0.02 }, 3150, 'bracelet', '#3a1a2a', '#ff4a7a'),
  A('sgRing', 'Special Grade Ring', 'ring', 31, { atk: 26, crit: 0.03, critDmg: 0.1 }, 6400, 'ring', '#1a1a22', '#ff2a3a'),
  A('boogieBand', 'Boogie Woogie Band', 'ring', 24, { atk: 16 }, 9500, 'bracelet', '#f0e0c0', '#3a8aff', { unique: [{ k: 'atkSpd', v: 0.08 }, { k: 'evasion', v: 0.05 }, { k: 'dex', v: 10 }], desc: 'Todo insisted you take it. Clap, and you are somewhere else.' }),

  A('sneakers', 'Sneakers', 'shoes', 1, { moveSpd: 0.02, def: 1 }, 40, 'shoes', '#e8e8e8', '#d83a3a'),
  A('runShoes', 'Running Shoes', 'shoes', 8, { moveSpd: 0.04, def: 3 }, 380, 'shoes', '#3a6ad8', '#ffffff'),
  A('cursedTreads', 'Cursed Treads', 'shoes', 15, { moveSpd: 0.06, def: 6, evasion: 0.02 }, 1250, 'shoes', '#3a2a4a', '#9a6aff'),
  A('shadowSteps', 'Shadow Steps', 'shoes', 23, { moveSpd: 0.08, def: 10, evasion: 0.03 }, 3100, 'shoes', '#111118', '#6a6aff'),
  A('flashBoots', 'Flash Boots', 'shoes', 31, { moveSpd: 0.11, def: 15, evasion: 0.05 }, 6300, 'shoes', '#1a1a1a', '#ffd04a'),
);

// ---- Rewards from the Death Painting arc to the Shinjuku Showdown ----
reg(
  A('yutaRing', "Okkotsu's Promise Ring", 'ring', 36, { atk: 34, maxCe: 40 }, 16000, 'ring', '#e8ecf4', '#ffb0e0', { unique: [{ k: 'cePct', v: 0.15 }, { k: 'skillPow', v: 0.12 }, { k: 'ce', v: 12 }], desc: 'A plain silver ring. A promise made as a child, and the strongest curse in the world.' }),
  A('frameSandals', 'Frame-Step Sandals', 'shoes', 44, { moveSpd: 0.12, def: 20, evasion: 0.05 }, 19000, 'shoes', '#2a2a34', '#e8d48a', { unique: [{ k: 'atkSpd', v: 0.08 }, { k: 'evasion', v: 0.04 }, { k: 'dex', v: 14 }], desc: 'Naoya swore by them. Twenty-four steps a second, and every one of them planned.' }),
  A('lawyerBadge', "Higuruma's Lawyer Badge", 'charm', 50, { maxCe: 200, skillPow: 0.1 }, 24000, 'charm', '#d8b04a', '#1a1a22', { unique: [{ k: 'cdr', v: 0.12 }, { k: 'ce', v: 16 }, { k: 'dmgReduce', v: 0.05 }], desc: 'Sunflowers and a balance. He stopped wearing it the day he stopped believing in it.' }),
  A('pointCharm', 'Kogane\'s Point Tally', 'charm', 52, { maxCe: 170, ceRegen: 2.2 }, 18000, 'charm', '#ffd04a', '#2a2a3a', { unique: [{ k: 'crit', v: 0.05 }, { k: 'bfChance', v: 0.02 }], desc: 'Every point a life. Higuruma wants them spent on rules that save players, not kill them.' }),
  A('lightningRod', 'Amber Lightning Rod', 'ring', 56, { atk: 52, crit: 0.04 }, 26000, 'ring', '#6adfff', '#ffffff', { unique: [{ k: 'critDmg', v: 0.3 }, { k: 'atkSpd', v: 0.08 }, { k: 'str', v: 16 }], desc: 'Hakari won it from Kashimo. Or Kashimo threw it at him. The story changes.' }),
  A('graniteBand', "Ishigori's Headband", 'head', 60, { def: 34, maxHp: 420, skillPow: 0.1 }, 28000, 'headband', '#2a2e38', '#9adfff', { unique: [{ k: 'skillPow', v: 0.12 }, { k: 'maxHp', v: 300 }, { k: 'str', v: 12 }], desc: 'Smells faintly of rice. He says the greatest output starts with a full stomach.' }),
  A('skyVeil', 'Moonlit Wings Mantle', 'outfit', 62, { def: 88, maxHp: 900, evasion: 0.04 }, 32000, 'uniform', '#2a2236', '#9ad0ff', { unique: [{ k: 'evasion', v: 0.06 }, { k: 'moveSpd', v: 0.05 }, { k: 'dex', v: 14 }], desc: 'Takako Uro\'s mantle from the Heian era. The sky folds a little around whoever wears it.' }),
  A('frostPin', "Uraume's Ice Hairpin", 'head', 72, { def: 44, maxHp: 560, crit: 0.04 }, 36000, 'circlet', '#e8f4ff', '#c83a4a', { unique: [{ k: 'cdr', v: 0.1 }, { k: 'ceRegen', v: 3 }, { k: 'ce', v: 18 }], desc: 'Cold to the touch, forever. A thousand years of loyalty, frozen.' }),
  A('prisonShard', 'Prison Realm Shard', 'charm', 76, { maxCe: 320, skillPow: 0.14 }, 42000, 'eye', '#2a2a32', '#b07aff', { unique: [{ k: 'cdr', v: 0.15 }, { k: 'cePct', v: 0.2 }, { k: 'ce', v: 20 }], desc: 'A sliver of the cube that once held the strongest sorcerer. It still looks at you.' }),
  A('bloodRing', "Choso's Blood Ring", 'ring', 74, { atk: 74, lifesteal: 0.03 }, 38000, 'bracelet', '#5a0e16', '#ff3a4a', { unique: [{ k: 'lifesteal', v: 0.03 }, { k: 'critDmg', v: 0.3 }, { k: 'str', v: 18 }], desc: 'An older brother\'s promise: as long as he has blood, you will not fight alone.' }),
  A('kingRing', 'Ring of the King of Curses', 'ring', 82, { atk: 110, crit: 0.06, critDmg: 0.2 }, 90000, 'ring', '#111111', '#ff2a3a', { unique: [{ k: 'bfChance', v: 0.06 }, { k: 'critDmg', v: 0.45 }, { k: 'atkPct', v: 0.15 }, { k: 'str', v: 24 }], desc: 'Taken from the ashes in Shinjuku. It is very quiet now.' }),
);

// ---- Rewards from the open world, Sakurajima and the memories in Tengen's barrier ----
reg(
  A('graveBell', 'Grave Bell Bracelet', 'ring', 26, { atk: 22, lifesteal: 0.02 }, 9000, 'bracelet', '#6a6a5a', '#d8ff6a', { unique: [{ k: 'lifesteal', v: 0.02 }, { k: 'vit', v: 10 }, { k: 'hpRegen', v: 2 }], desc: 'The Smallpox Deity rang it before every burial. Now it rings for you.' }),
  A('dragonPearl', 'Rainbow Dragon Pearl', 'charm', 42, { maxCe: 130, skillPow: 0.08 }, 16000, 'bead', '#ff8aff', '#6adfff', { unique: [{ k: 'skillPow', v: 0.12 }, { k: 'cePct', v: 0.12 }, { k: 'ce', v: 12 }], desc: 'Geto kept this curse for years. It hid its heart in a pearl, and the pearl outlived them both.' }),
  A('redScissors', 'Red Scissors Charm', 'ring', 60, { atk: 60, crit: 0.04 }, 26000, 'ring', '#c83a3a', '#e8e8f0', { unique: [{ k: 'critDmg', v: 0.35 }, { k: 'crit', v: 0.05 }, { k: 'dex', v: 14 }], desc: '"Am I pretty?" There is no right answer. Answer with this.' }),
  A('heirEarrings', 'Zen\'in Heir\'s Earrings', 'head', 70, { def: 42, maxHp: 520, evasion: 0.03 }, 34000, 'circlet', '#e8d48a', '#2a2a34', { unique: [{ k: 'atkSpd', v: 0.1 }, { k: 'moveSpd', v: 0.06 }, { k: 'dex', v: 16 }], desc: 'Naoya would not take them off, even after he stopped being human. Maki took them off for him.' }),
  A('starTalisman', 'Star Corridor Talisman', 'charm', 82, { maxCe: 300, ceRegen: 3 }, 40000, 'charm', '#e8e0c8', '#b07aff', { unique: [{ k: 'cdr', v: 0.12 }, { k: 'skillPow', v: 0.12 }, { k: 'ce', v: 18 }], desc: 'Tengen folded a corner of the barrier into paper. It is heavier than it looks.' }),
  A('heavenBand', 'Heavenly Restriction Band', 'ring', 86, { atk: 130, crit: 0.05 }, 60000, 'bracelet', '#1a1a1e', '#8a6aa0', { unique: [{ k: 'atkPct', v: 0.18 }, { k: 'critDmg', v: 0.4 }, { k: 'moveSpd', v: 0.06 }, { k: 'str', v: 24 }], desc: 'No cursed energy at all, and every drop of it paid back in body. Toji never needed a technique.' }),
  A('getoKesa', 'Geto\'s Kesa', 'outfit', 92, { def: 140, maxHp: 1600, evasion: 0.03 }, 70000, 'uniform', '#1a1a1e', '#9a7a3a', { unique: [{ k: 'summonPow', v: 0.3 }, { k: 'skillPow', v: 0.15 }, { k: 'cePct', v: 0.2 }, { k: 'ce', v: 20 }], desc: 'He wore it to the end of the Night Parade. His best friend was the last one to see it.' }),
  A('infinityEcho', 'Echo of Infinity', 'charm', 98, { maxCe: 420, skillPow: 0.16 }, 99000, 'eye', '#7fdcff', '#ffffff', { unique: [{ k: 'cdr', v: 0.18 }, { k: 'dmgReduce', v: 0.08 }, { k: 'evasion', v: 0.06 }, { k: 'ce', v: 24 }], desc: '"Throughout heaven and earth..." It is quiet now, but it still keeps a little distance between you and everything else.' }),
);

// ---- Post-story tiers (Lv 55 and Lv 80) ----
// Built from the best regular item in each slot so levels 51-100 keep dropping upgrades.
// Flat stats scale fully; percentage stats grow more gently so speed and crit stay sane.
const TIERS = [
  { key: 'aw', prefix: 'Awakened', req: 55, mult: 1.75, price: 3.5, c1: '#2a2438', c2: '#ffd04a' },
  { key: 'sv', prefix: 'Sovereign', req: 80, mult: 2.6, price: 7, c1: '#0a0a10', c2: '#ff2a5a' },
] as const;
for (const baseId of ['sgFist', 'spiritEdge', 'resMallet', 'sgCoat', 'vowCharm', 'sgCirclet', 'sgRing', 'flashBoots']) {
  const b = ITEMS[baseId];
  for (const t of TIERS) {
    const stats: Partial<Record<StatKey, number>> = {};
    for (const [k, v] of Object.entries(b.stats ?? {}) as [StatKey, number][]) {
      stats[k] = PCT_KEYS.has(k) ? Math.round(v * (1 + (t.mult - 1) * 0.35) * 1000) / 1000 : Math.round(v * t.mult * 10) / 10;
    }
    reg({ ...b, id: t.key + baseId[0].toUpperCase() + baseId.slice(1), name: `${t.prefix} ${b.name.replace('Special Grade ', '')}`, req: t.req, stats, price: Math.round(b.price * t.price), icon: { ...b.icon, c1: t.c1, c2: t.c2 } });
  }
}

// ---- Consumables / materials / quest ----
reg(
  { id: 'hpS', name: "Shoko's Salve", kind: 'consumable', req: 1, price: 30, icon: { shape: 'potion', c1: '#ff4a5a', c2: '#ffd0d4' }, use: { hp: 150 }, stack: 99, desc: 'Restores 150 HP.' },
  { id: 'hpM', name: 'Reverse Cursed Tonic', kind: 'consumable', req: 10, price: 120, icon: { shape: 'potion', c1: '#ff2a6a', c2: '#ffffff' }, use: { hp: 500 }, stack: 99, desc: 'Restores 500 HP.' },
  { id: 'hpL', name: 'Ieiri Special', kind: 'consumable', req: 22, price: 380, icon: { shape: 'potion', c1: '#ff0a4a', c2: '#ffe08a' }, use: { hp: 1400 }, stack: 99, desc: 'Restores 1400 HP.' },
  { id: 'ceS', name: 'CE Candy', kind: 'consumable', req: 1, price: 35, icon: { shape: 'potionCe', c1: '#4a8aff', c2: '#d0e4ff' }, use: { ce: 60 }, stack: 99, desc: 'Restores 60 cursed energy.' },
  { id: 'ceM', name: 'CE Ampoule', kind: 'consumable', req: 10, price: 140, icon: { shape: 'potionCe', c1: '#2a6aff', c2: '#ffffff' }, use: { ce: 180 }, stack: 99, desc: 'Restores 180 cursed energy.' },
  { id: 'ceL', name: 'CE Elixir', kind: 'consumable', req: 22, price: 420, icon: { shape: 'potionCe', c1: '#6a2aff', c2: '#ffe08a' }, use: { ce: 450 }, stack: 99, desc: 'Restores 450 cursed energy.' },
  { id: 'onigiri', name: 'Tuna Mayo Onigiri', kind: 'consumable', req: 1, price: 60, icon: { shape: 'onigiri', c1: '#f4f4f0', c2: '#1a2a1a' }, use: { hpPct: 0.35, regen: 1 }, stack: 99, desc: 'Restores 35% HP. Inumaki approves.' },
  { id: 'warp', name: 'Return Talisman', kind: 'consumable', req: 1, price: 80, icon: { shape: 'charm', c1: '#f0e6c8', c2: '#3a8aff' }, use: { warp: 'hub' }, stack: 20, desc: 'Teleports you back to Tokyo Jujutsu High.' },
  { id: 'fragment', name: 'Cursed Fragment', kind: 'material', req: 1, price: 25, icon: { shape: 'crystal', c1: '#9a4aff', c2: '#ffb0ff' }, stack: 999, desc: 'Residue of an exorcised curse. Used to infuse equipment.' },
  { id: 'core', name: 'Grade 1 Core', kind: 'material', req: 1, price: 400, icon: { shape: 'crystal', c1: '#ff3a5a', c2: '#ffd0a0' }, stack: 999, desc: 'A dense knot of cursed energy. Needed for +6 and above.' },
  { id: 'finger', name: "Sukuna's Finger", kind: 'quest', req: 1, price: 0, icon: { shape: 'finger', c1: '#6a2a2a', c2: '#ff3a3a' }, questItem: true, stack: 20, desc: 'A Special Grade cursed object. Twenty exist.' },
  { id: 'cotton', name: 'Cursed Cotton', kind: 'quest', req: 1, price: 0, icon: { shape: 'cotton', c1: '#f0f0f0', c2: '#9a6aff' }, questItem: true, stack: 99, desc: 'Panda wants this for... reasons.' },
  { id: 'residue', name: 'Curse Residue', kind: 'quest', req: 1, price: 0, icon: { shape: 'crystal', c1: '#3a8a5a', c2: '#a0ffc0' }, questItem: true, stack: 99, desc: 'A sample for Shoko\'s research.' },
  { id: 'kelp', name: 'Kelp Leaf', kind: 'quest', req: 1, price: 0, icon: { shape: 'leaf', c1: '#2a5a2a', c2: '#6aa04a' }, questItem: true, stack: 99, desc: 'Konbu!' },
  { id: 'miwaSword', name: "Miwa's Katana", kind: 'quest', req: 1, price: 0, icon: { shape: 'blade', c1: '#c8ccd4', c2: '#3a5a9a' }, questItem: true, stack: 1, desc: 'Kasumi Miwa lost it somewhere in the forest.' },
  { id: 'veilTag', name: 'Veil Talisman', kind: 'quest', req: 1, price: 0, icon: { shape: 'charm', c1: '#2a2a3a', c2: '#9a4aff' }, questItem: true, stack: 99, desc: 'Torn from a barrier anchor.' },
  { id: 'nameTag', name: 'Inmate Name Tag', kind: 'quest', req: 1, price: 0, icon: { shape: 'nametag', c1: '#e8e4d8', c2: '#3a4a6a' }, questItem: true, stack: 1, desc: 'A laminated tag from Eishu. OKAZAKI TADASHI.' },
  { id: 'filmTicket', name: 'Cinema Ticket Stub', kind: 'quest', req: 1, price: 0, icon: { shape: 'ticket', c1: '#ffd04a', c2: '#8a2a2a' }, questItem: true, stack: 99, desc: 'Found near the scene of the incident.' },
  { id: 'cursedMark', name: 'Cursed Mark Residue', kind: 'quest', req: 1, price: 0, icon: { shape: 'crystal', c1: '#2a1a2a', c2: '#ff3a6a' }, questItem: true, stack: 99, desc: 'The mark the Yasohachi curse left on its victims, scraped from one of its spawn.' },
  { id: 'pointToken', name: 'Culling Point Tag', kind: 'quest', req: 1, price: 0, icon: { shape: 'nametag', c1: '#ffd04a', c2: '#2a2a3a' }, questItem: true, stack: 99, desc: 'Kogane tallies a point every time a player falls. This tag is one of them.' },
  { id: 'shrineCharm', name: 'Weathered Shrine Charm', kind: 'quest', req: 1, price: 0, icon: { shape: 'charm', c1: '#e8dcb8', c2: '#c83a3a' }, questItem: true, stack: 99, desc: 'A paper charm from the roadside shrines in the hills. Curses chew on them.' },
  { id: 'dragonScale', name: 'Rainbow Scale', kind: 'quest', req: 1, price: 0, icon: { shape: 'crystal', c1: '#6adfff', c2: '#ff8aff' }, questItem: true, stack: 99, desc: 'It changes colour as you turn it. The curses on the mountain carry them like trophies.' },
  { id: 'patientTag', name: 'Patient Wristband', kind: 'quest', req: 1, price: 0, icon: { shape: 'nametag', c1: '#f0f0f0', c2: '#3a8ad8' }, questItem: true, stack: 99, desc: 'From the old Tamagawa Hospital. The names have faded; the curses that wear them have not.' },
  { id: 'volcanicGlass', name: 'Volcanic Glass', kind: 'quest', req: 1, price: 0, icon: { shape: 'crystal', c1: '#1a1a22', c2: '#ff6a2a' }, questItem: true, stack: 99, desc: 'Black glass from Sakurajima\'s slopes, still warm. Cursed energy pools in the cracks.' },
  { id: 'memoryShard', name: 'Barrier Memory Shard', kind: 'quest', req: 1, price: 0, icon: { shape: 'crystal', c1: '#e8e0c8', c2: '#b07aff' }, questItem: true, stack: 99, desc: 'A sliver of Tengen\'s barrier. Hold it up to the light and you can see someone else\'s past.' },
  { id: 'heiCrest', name: 'Hei Corps Crest', kind: 'material', req: 1, price: 220, icon: { shape: 'charm', c1: '#1e1e26', c2: '#8a2a2a' }, stack: 999, desc: 'Worn by the Zen\'in clan\'s Hei. Sells well to collectors who never met one.' },
  { id: 'shinjukuAsh', name: 'Cursed Ash', kind: 'material', req: 1, price: 520, icon: { shape: 'crystal', c1: '#3a2a4a', c2: '#ff8aa8' }, stack: 999, desc: 'What is left of Kenjaku\'s curses. Mei Mei pays well for it. Do not ask why.' },
);

export const RARITY_NAME = ['Common', 'Graded', 'Special Grade', 'Cursed Tool'];
export const RARITY_COLOR = ['#e8e8e8', '#5ab4ff', '#c07aff', '#ff9a3a'];

const AFFIX_POOL: { k: StatKey; lo: number; hi: number; perLv: number }[] = [
  { k: 'str', lo: 1, hi: 3, perLv: 0.18 },
  { k: 'dex', lo: 1, hi: 3, perLv: 0.18 },
  { k: 'vit', lo: 1, hi: 3, perLv: 0.18 },
  { k: 'ce', lo: 1, hi: 3, perLv: 0.18 },
  { k: 'maxHp', lo: 10, hi: 25, perLv: 6 },
  { k: 'maxCe', lo: 5, hi: 15, perLv: 2.5 },
  { k: 'atkPct', lo: 0.02, hi: 0.05, perLv: 0.002 },
  { k: 'def', lo: 1, hi: 4, perLv: 0.6 },
  { k: 'crit', lo: 0.01, hi: 0.025, perLv: 0.0008 },
  { k: 'critDmg', lo: 0.05, hi: 0.12, perLv: 0.004 },
  { k: 'atkSpd', lo: 0.02, hi: 0.05, perLv: 0.0012 },
  { k: 'moveSpd', lo: 0.02, hi: 0.04, perLv: 0.0006 },
  { k: 'ceRegen', lo: 0.2, hi: 0.5, perLv: 0.04 },
  { k: 'bfChance', lo: 0.005, hi: 0.012, perLv: 0.0003 },
  { k: 'lifesteal', lo: 0.01, hi: 0.02, perLv: 0.0005 },
  { k: 'skillPow', lo: 0.03, hi: 0.06, perLv: 0.002 },
  { k: 'goldBonus', lo: 0.05, hi: 0.12, perLv: 0.003 },
  { k: 'expBonus', lo: 0.03, hi: 0.08, perLv: 0.002 },
];

let uidCounter = 1;
export function setUidCounter(n: number) { uidCounter = Math.max(uidCounter, n); }
export function getUidCounter() { return uidCounter; }

export function makeItem(baseId: string, rarity: 0 | 1 | 2 | 3 = 0, qty = 1, rng?: Rng): ItemInstance {
  const base = ITEMS[baseId];
  if (!base) throw new Error('Unknown item ' + baseId);
  const inst: ItemInstance = { uid: uidCounter++, base: baseId, rarity: base.unique ? 3 : rarity, plus: 0, affixes: [], qty };
  if (base.unique) inst.affixes = base.unique.map(a => ({ ...a }));
  else if (isGear(base) && rarity > 0) {
    const n = rarity === 1 ? randInt(1, 2) : randInt(2, 3);
    const pool = [...AFFIX_POOL];
    for (let i = 0; i < n && pool.length; i++) {
      const idx = rng ? Math.floor(rng.next() * pool.length) : randInt(0, pool.length - 1);
      const a = pool.splice(idx, 1)[0];
      const raw = (rng ? rng.range(a.lo, a.hi) : rand(a.lo, a.hi)) + a.perLv * base.req;
      const v = a.lo >= 1 ? Math.round(raw * (rarity === 2 ? 1.3 : 1)) : Math.round(raw * (rarity === 2 ? 1.3 : 1) * 1000) / 1000;
      inst.affixes.push({ k: a.k, v });
    }
  }
  return inst;
}

export function isGear(b: ItemBase) { return (SLOT_ORDER as string[]).includes(b.kind); }

/** Equipment slots in display order. */
export const SLOT_ORDER: Slot[] = ['weapon', 'head', 'outfit', 'charm', 'ring', 'shoes'];
export const SLOT_NAMES: Record<Slot, string> = { weapon: 'Weapon', head: 'Headgear', outfit: 'Uniform', charm: 'Charm', ring: 'Accessory', shoes: 'Shoes' };
export const KIND_NAME: Record<ItemKind, string> = { ...SLOT_NAMES, consumable: 'Consumable', material: 'Material', quest: 'Key Item' };

/** Inventory categories, one per equipment slot plus the non-gear kinds. */
export const CATEGORIES: { id: ItemKind; label: string }[] = [
  { id: 'weapon', label: 'Weapons' }, { id: 'head', label: 'Headgear' }, { id: 'outfit', label: 'Uniforms' },
  { id: 'charm', label: 'Charms' }, { id: 'ring', label: 'Accessories' }, { id: 'shoes', label: 'Shoes' },
  { id: 'consumable', label: 'Consumables' }, { id: 'material', label: 'Materials' }, { id: 'quest', label: 'Key Items' },
];
const CAT_INDEX = new Map(CATEGORIES.map((c, i) => [c.id, i]));

/** Sorts by category, then best first (rarity, enhancement, level), then name. */
export function sortItems(list: ItemInstance[]) {
  return [...list].sort((a, b) => {
    const A = ITEMS[a.base], B = ITEMS[b.base];
    return (CAT_INDEX.get(A.kind)! - CAT_INDEX.get(B.kind)!) || (b.rarity - a.rarity) || (b.plus - a.plus) || (B.req - A.req) || A.name.localeCompare(B.name);
  });
}

/** Base stats including rarity scaling and enhancement. */
export function itemStats(it: ItemInstance): Partial<Record<StatKey, number>> {
  const b = ITEMS[it.base];
  const out: Partial<Record<StatKey, number>> = {};
  const rMul = [1, 1.1, 1.25, 1.35][it.rarity];
  const inf = Math.min(it.plus, 10); // Yaga's infusion; reforging past +10 grows base stats more gently
  const eMul = 1 + inf * 0.09 + (inf >= 7 ? (inf - 6) * 0.05 : 0) + Math.max(0, it.plus - 10) * 0.06;
  for (const [k, v] of Object.entries(b.stats ?? {})) {
    const key = k as StatKey;
    const scaled = PCT_KEYS.has(key) || key === 'ceRegen' ? v * (1 + (rMul - 1) * 0.5) : v * rMul * eMul;
    out[key] = (out[key] ?? 0) + (PCT_KEYS.has(key) ? scaled : Math.round(scaled));
  }
  for (const a of it.affixes) out[a.k] = (out[a.k] ?? 0) + a.v;
  for (const [k, v] of Object.entries(reforgeBonus(it)) as [StatKey, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}

// ---------------------------------------------------------------------------
// Reforging (+11 to +30): every step adds one fixed bonus from the item type's track
// ---------------------------------------------------------------------------

export const REFORGE_MAX = 30;

type Step = [StatKey, number];
/** Per equipment type: the repeating cycle of step bonuses, plus the +20 and +30 milestones. */
const REFORGE_TRACK: Record<Slot, { cycle: Step[]; m20: Step[]; m30: Step[] }> = {
  weapon: { cycle: [['atkPct', 0.015], ['crit', 0.005], ['critDmg', 0.02], ['skillPow', 0.015], ['bfChance', 0.0025]], m20: [['atkPct', 0.08]], m30: [['bfChance', 0.02], ['critDmg', 0.15]] },
  outfit: { cycle: [['defPct', 0.015], ['hpPct', 0.015], ['dmgReduce', 0.004], ['hpRegen', 0.4]], m20: [['hpPct', 0.08]], m30: [['dmgReduce', 0.04], ['defPct', 0.1]] },
  head: { cycle: [['crit', 0.004], ['evasion', 0.003], ['cdr', 0.004], ['hpPct', 0.01]], m20: [['cdr', 0.03]], m30: [['crit', 0.04], ['evasion', 0.03]] },
  charm: { cycle: [['cePct', 0.015], ['ceRegen', 0.3], ['skillPow', 0.012], ['cdr', 0.003]], m20: [['skillPow', 0.06]], m30: [['cePct', 0.1], ['cdr', 0.04]] },
  ring: { cycle: [['atkPct', 0.01], ['critDmg', 0.02], ['lifesteal', 0.002], ['atkSpd', 0.004]], m20: [['critDmg', 0.1]], m30: [['lifesteal', 0.02], ['atkPct', 0.06]] },
  shoes: { cycle: [['moveSpd', 0.003], ['evasion', 0.003], ['defPct', 0.01], ['atkSpd', 0.003]], m20: [['evasion', 0.03]], m30: [['moveSpd', 0.03], ['atkSpd', 0.04]] },
};

/** The bonus a single reforge step (1..20, i.e. +11..+30) grants. */
export function reforgeStep(kind: ItemKind, step: number): Step[] {
  const t = REFORGE_TRACK[kind as Slot];
  if (!t) return [];
  const out: Step[] = [t.cycle[(step - 1) % t.cycle.length]];
  if (step === 10) out.push(...t.m20);
  if (step === 20) out.push(...t.m30);
  return out;
}

/** Everything reforging has added to an item so far. */
export function reforgeBonus(it: ItemInstance): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  const b = ITEMS[it.base];
  for (let step = 1; step <= it.plus - 10; step++) for (const [k, v] of reforgeStep(b.kind, step)) out[k] = (out[k] ?? 0) + v;
  return out;
}

export function reforgeCost(it: ItemInstance) {
  const b = ITEMS[it.base];
  const step = it.plus - 9; // the step this attempt would reach
  return {
    gold: Math.floor((300 + b.req * 40) * step * (1 + it.rarity * 0.35)),
    fragments: 6 + step * 2,
    cores: 1 + Math.floor(step / 2),
    rate: Math.max(0.3, 0.88 - (step - 1) * 0.03),
    /** failures past +20 may knock a level off, but never below +20 */
    risky: it.plus >= 21,
  };
}

/** What each stat does, for the reforge and item screens. */
export const STAT_DESC: Partial<Record<StatKey, string>> = {
  atk: 'base damage of every hit and technique', atkPct: 'multiplies your total Attack',
  def: 'reduces damage from every hit', defPct: 'multiplies your total Defense',
  maxHp: 'how much damage you can take', hpPct: 'multiplies your Max HP',
  maxCe: 'cursed energy for techniques', cePct: 'multiplies your Max CE',
  crit: 'chance for a hit to be critical', critDmg: 'extra damage a critical hit deals',
  bfChance: 'chance a hit becomes a Black Flash (x2.5)', skillPow: 'damage and healing of techniques',
  atkSpd: 'how fast you swing and recover', moveSpd: 'how fast you run',
  evasion: 'chance to slip past a hit entirely', dmgReduce: 'cuts all damage taken',
  lifesteal: 'heals you for part of the damage you deal', cdr: 'shortens technique cooldowns',
  ceRegen: 'cursed energy recovered each second', hpRegen: 'HP recovered each second',
  summonPow: 'strength of your shikigami', projPow: 'damage of nails and thrown attacks',
};

export function itemName(it: ItemInstance) {
  const b = ITEMS[it.base];
  return (it.plus > 0 ? `+${it.plus} ` : '') + b.name;
}

export function formatStat(k: StatKey, v: number) {
  const label = STAT_LABEL[k] ?? k;
  if (PCT_KEYS.has(k)) return `${label} +${(v * 100).toFixed(v * 100 < 10 && v * 100 % 1 ? 1 : 0)}%`;
  if (k === 'ceRegen' || k === 'hpRegen') return `${label} +${v.toFixed(1)}/s`;
  return `${label} +${Math.round(v)}`;
}

export function sellPrice(it: ItemInstance) {
  const b = ITEMS[it.base];
  if (b.questItem) return 0;
  return Math.max(1, Math.floor(b.price * 0.3 * (1 + it.rarity * 0.6) * (1 + it.plus * 0.25)));
}

export const ENHANCE_RATE = [1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42, 0.35, 0.28];
export function enhanceCost(it: ItemInstance) {
  const b = ITEMS[it.base];
  return {
    gold: Math.floor((60 + b.req * 25) * (it.plus + 1) * (1 + it.rarity * 0.3)),
    fragments: 1 + Math.floor(it.plus * 1.5),
    cores: it.plus >= 5 ? it.plus - 4 : 0,
    rate: ENHANCE_RATE[it.plus] ?? 0,
  };
}

/** Pick a random gear base appropriate for a level (and optionally class). */
export function randomGear(level: number, cls?: ClassId) {
  const fits = Object.values(ITEMS).filter(b => isGear(b) && !b.unique && b.req <= level + 2 && (!b.cls || !cls || b.cls === cls || Math.random() < 0.25));
  // drops come from the top 12 levels of what exists, so gaps between tiers still drop gear
  const top = fits.reduce((m, b) => Math.max(m, b.req), 0);
  const pool = fits.filter(b => b.req >= Math.min(level, top) - 12);
  if (!pool.length) return null;
  return pick(pool).id;
}

export function rollRarity(bonus = 0): 0 | 1 | 2 {
  const r = Math.random();
  if (r < 0.035 + bonus * 0.5) return 2;
  if (r < 0.22 + bonus) return 1;
  return 0;
}

export function uniquesForLevel(level: number) {
  return Object.values(ITEMS).filter(b => b.unique && b.req <= level + 3);
}
