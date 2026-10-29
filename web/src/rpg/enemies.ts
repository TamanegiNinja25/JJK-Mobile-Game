// Cursed spirit roster. Stats scale with level and grade; bosses add patterns
// implemented in entities/Boss.ts.

export type AiKind = 'melee' | 'ranged' | 'flyer' | 'bomber' | 'stationary' | 'charger' | 'boss' | 'dummy';

export interface EnemyAttack {
  kind: 'melee' | 'lunge' | 'projectile' | 'explode' | 'aoe';
  range: number;
  cd: number;
  windup: number;
  mult: number;
  radius?: number;
  proj?: 'spit' | 'thorn' | 'water' | 'orb' | 'seed' | 'fireball' | 'ember';
  projSpeed?: number;
  anim?: string;
  sfx?: string;
  color?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  grade: 4 | 3 | 2 | 1 | 0;
  model: string;      // creature kind or 'char:<id>'
  scale: number;
  level: number;
  hpMul: number;
  atkMul: number;
  defMul: number;
  speed: number;
  radius: number;
  ai: AiKind;
  attack: EnemyAttack;
  aggro: number;
  boss?: string;      // boss script id
  drops?: { item: string; chance: number }[];
  voice?: string;     // sfx on aggro
  deathSfx?: string;
  flying?: boolean;
  noKnock?: boolean;
}

export const GRADE_NAME = ['Special Grade', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
export const GRADE_COLOR = ['#ff3a4a', '#ff9a3a', '#c07aff', '#5ab4ff', '#d8d8d8'];

const E: Record<string, EnemyDef> = {};
function reg(d: EnemyDef) { E[d.id] = d; }

const melee = (range: number, cd: number, mult = 1, anim = 'punch1', sfx = 'hit'): EnemyAttack => ({ kind: 'melee', range, cd, windup: 0.42, mult, anim, sfx });

// ---- Sugisawa (Lv 1-6) ----
reg({ id: 'flyhead', name: 'Fly Head', grade: 4, model: 'flyhead', scale: 1, level: 1, hpMul: 0.7, atkMul: 0.9, defMul: 0.5, speed: 3.6, radius: 0.45, ai: 'flyer', attack: { ...melee(1.3, 1.4, 1, 'bite', 'screech'), kind: 'lunge' }, aggro: 9, voice: 'screech', flying: true, drops: [{ item: 'cotton', chance: 0.3 }] });
reg({ id: 'crawler', name: 'Crawling Curse', grade: 4, model: 'crawler', scale: 1, level: 2, hpMul: 0.8, atkMul: 1, defMul: 0.8, speed: 2.6, radius: 0.55, ai: 'melee', attack: melee(1.4, 1.6, 1.1, 'bite', 'hit'), aggro: 8, voice: 'growl', drops: [{ item: 'cotton', chance: 0.3 }] });
reg({ id: 'lanky', name: 'Lanky Curse', grade: 3, model: 'lanky', scale: 1.1, level: 4, hpMul: 1.1, atkMul: 1.2, defMul: 1, speed: 2.4, radius: 0.5, ai: 'melee', attack: melee(2.2, 1.8, 1.25, 'slash1', 'slash'), aggro: 9, voice: 'growl', drops: [{ item: 'cotton', chance: 0.35 }] });
reg({ id: 'glutton', name: 'Gluttonous Curse', grade: 2, model: 'glutton', scale: 1.9, level: 6, hpMul: 16, atkMul: 1.4, defMul: 1.3, speed: 2.2, radius: 1.4, ai: 'boss', boss: 'glutton', attack: melee(3.2, 1.8, 1.4, 'slam', 'punch'), aggro: 16, voice: 'roar', noKnock: true });

// ---- Eishu Detention (Lv 7-12) ----
reg({ id: 'womb', name: 'Womb Spawn', grade: 3, model: 'womb', scale: 1, level: 7, hpMul: 0.7, atkMul: 2.4, defMul: 0.6, speed: 3.0, radius: 0.5, ai: 'bomber', attack: { kind: 'explode', range: 1.4, cd: 1, windup: 0.8, mult: 2.4, radius: 2.4, sfx: 'explosion' }, aggro: 9, voice: 'squish' });
reg({ id: 'hound', name: 'Cursed Hound', grade: 3, model: 'hound', scale: 1.1, level: 8, hpMul: 0.9, atkMul: 1.1, defMul: 0.9, speed: 5.0, radius: 0.55, ai: 'charger', attack: { ...melee(1.6, 1.3, 1.1, 'bite', 'growl'), kind: 'lunge' }, aggro: 11, voice: 'growl', drops: [{ item: 'residue', chance: 0.25 }] });
reg({ id: 'wretch', name: 'Hollow Wretch', grade: 2, model: 'wretch', scale: 1.15, level: 10, hpMul: 1.6, atkMul: 1.25, defMul: 1.4, speed: 2.5, radius: 0.6, ai: 'melee', attack: melee(2.0, 1.7, 1.3, 'slash2', 'slash'), aggro: 9, voice: 'growl', drops: [{ item: 'residue', chance: 0.35 }] });
reg({ id: 'fingerBearer', name: 'Finger Bearer', grade: 0, model: 'fingerBearer', scale: 1.7, level: 13, hpMul: 18, atkMul: 1.5, defMul: 1.5, speed: 3.0, radius: 1.1, ai: 'boss', boss: 'fingerBearer', attack: melee(3.0, 1.5, 1.4, 'slash1', 'slash'), aggro: 18, voice: 'roar', noKnock: true });

// ---- Kawasaki (Lv 13-19) ----
reg({ id: 'transfigured', name: 'Transfigured Human', grade: 3, model: 'transfigured', scale: 1, level: 13, hpMul: 1.0, atkMul: 1.1, defMul: 1, speed: 2.9, radius: 0.5, ai: 'ranged', attack: { kind: 'projectile', range: 8, cd: 2.2, windup: 0.5, mult: 1, proj: 'spit', projSpeed: 9, anim: 'throw', sfx: 'squish', color: 0xa0d04a }, aggro: 10, voice: 'growl', drops: [{ item: 'filmTicket', chance: 0.3 }] });
reg({ id: 'bloated', name: 'Bloated Transfigured', grade: 2, model: 'bloated', scale: 1.15, level: 15, hpMul: 2.0, atkMul: 1.4, defMul: 1.2, speed: 2.0, radius: 0.75, ai: 'melee', attack: { kind: 'aoe', range: 2.2, cd: 2.4, windup: 0.7, mult: 1.5, radius: 2.6, anim: 'slam', sfx: 'shockwave' }, aggro: 9, voice: 'growl', drops: [{ item: 'filmTicket', chance: 0.3 }] });
reg({ id: 'leech', name: 'Sewer Leech', grade: 3, model: 'leech', scale: 1.1, level: 14, hpMul: 1.1, atkMul: 1.15, defMul: 1, speed: 3.4, radius: 0.55, ai: 'charger', attack: { ...melee(1.6, 1.5, 1.15, 'bite', 'squish'), kind: 'lunge' }, aggro: 9, voice: 'squish' });
reg({ id: 'mahito', name: 'Mahito', grade: 0, model: 'char:mahito', scale: 1.15, level: 19, hpMul: 22, atkMul: 1.55, defMul: 1.5, speed: 4.6, radius: 0.7, ai: 'boss', boss: 'mahito', attack: melee(2.4, 1.2, 1.4, 'slash1', 'slash'), aggro: 18, voice: 'roar', noKnock: true });

// ---- Kyoto (Lv 19-26) ----
reg({ id: 'rootCurse', name: 'Root Curse', grade: 2, model: 'rootCurse', scale: 1.1, level: 19, hpMul: 1.8, atkMul: 1.2, defMul: 1.5, speed: 0, radius: 0.7, ai: 'stationary', attack: { kind: 'projectile', range: 9, cd: 1.9, windup: 0.45, mult: 1.1, proj: 'thorn', projSpeed: 12, sfx: 'roots', color: 0x9aff6a }, aggro: 10, voice: 'roots', drops: [{ item: 'kelp', chance: 0.4 }] });
reg({ id: 'bud', name: 'Cursed Bud', grade: 3, model: 'bud', scale: 1.1, level: 20, hpMul: 0.9, atkMul: 1.1, defMul: 0.9, speed: 3.6, radius: 0.45, ai: 'melee', attack: { ...melee(1.3, 1.3, 1.1, 'bite', 'flower'), kind: 'lunge' }, aggro: 9, voice: 'flower', drops: [{ item: 'kelp', chance: 0.3 }] });
reg({ id: 'forestHound', name: 'Grade 1 Hound', grade: 1, model: 'hound', scale: 1.35, level: 22, hpMul: 1.8, atkMul: 1.35, defMul: 1.3, speed: 5.4, radius: 0.65, ai: 'charger', attack: { ...melee(1.8, 1.4, 1.3, 'bite', 'growl'), kind: 'lunge' }, aggro: 12, voice: 'growl' });
reg({ id: 'todo', name: 'Aoi Todo', grade: 1, model: 'char:todo', scale: 1.1, level: 22, hpMul: 12, atkMul: 1.4, defMul: 1.4, speed: 4.4, radius: 0.7, ai: 'boss', boss: 'todo', attack: melee(2.2, 1.0, 1.3, 'punch1', 'punch'), aggro: 18, voice: 'clap', noKnock: true });
reg({ id: 'hanami', name: 'Hanami', grade: 0, model: 'hanami', scale: 1.5, level: 26, hpMul: 24, atkMul: 1.6, defMul: 1.6, speed: 3.2, radius: 1.0, ai: 'boss', boss: 'hanami', attack: melee(2.8, 1.4, 1.4, 'slash2', 'roots'), aggro: 18, voice: 'roar', noKnock: true });

// ---- Shibuya (Lv 26-36) ----
reg({ id: 'hand', name: 'Grasping Curse', grade: 2, model: 'hand', scale: 1.2, level: 26, hpMul: 1.6, atkMul: 1.25, defMul: 1.3, speed: 3.2, radius: 0.7, ai: 'melee', attack: melee(2.0, 1.6, 1.35, 'grab', 'punch'), aggro: 10, voice: 'growl', drops: [{ item: 'veilTag', chance: 0.25 }] });
reg({ id: 'pumpkin', name: 'Jack-o\'-Curse', grade: 2, model: 'pumpkin', scale: 1.1, level: 27, hpMul: 1.4, atkMul: 1.2, defMul: 1.1, speed: 2.8, radius: 0.55, ai: 'ranged', attack: { kind: 'projectile', range: 9, cd: 2, windup: 0.5, mult: 1.2, proj: 'ember', projSpeed: 10, sfx: 'fireball', color: 0xff8a2a }, aggro: 10, voice: 'fire', flying: true, drops: [{ item: 'veilTag', chance: 0.25 }] });
reg({ id: 'fish', name: 'Shikigami Fish', grade: 3, model: 'fish', scale: 1.2, level: 28, hpMul: 0.9, atkMul: 0.95, defMul: 1, speed: 5.5, radius: 0.45, ai: 'flyer', attack: { ...melee(1.4, 1.2, 1.1, 'bite', 'water'), kind: 'lunge' }, aggro: 12, voice: 'squish', flying: true });
reg({ id: 'shibuyaTransfig', name: 'Transfigured Horde', grade: 2, model: 'transfigured', scale: 1.15, level: 29, hpMul: 1.5, atkMul: 1.3, defMul: 1.2, speed: 3.3, radius: 0.55, ai: 'melee', attack: melee(1.8, 1.4, 1.3, 'slash1', 'hit'), aggro: 10, voice: 'growl' });
reg({ id: 'dagon', name: 'Dagon', grade: 0, model: 'dagon', scale: 1.5, level: 30, hpMul: 26, atkMul: 1.65, defMul: 1.7, speed: 2.4, radius: 1.5, ai: 'boss', boss: 'dagon', attack: melee(3.2, 1.6, 1.4, 'slam', 'water'), aggro: 20, voice: 'roar', noKnock: true });
reg({ id: 'jogo', name: 'Jogo', grade: 0, model: 'jogo', scale: 1.3, level: 33, hpMul: 28, atkMul: 1.7, defMul: 1.7, speed: 3.4, radius: 0.8, ai: 'boss', boss: 'jogo', attack: melee(2.4, 1.4, 1.4, 'punch1', 'fire'), aggro: 20, voice: 'fire', noKnock: true });
reg({ id: 'sukuna', name: 'Ryomen Sukuna', grade: 0, model: 'char:sukuna', scale: 1.15, level: 36, hpMul: 38, atkMul: 1.8, defMul: 1.8, speed: 5.0, radius: 0.8, ai: 'boss', boss: 'sukuna', attack: melee(2.6, 1.0, 1.5, 'slash1', 'dismantle'), aggro: 22, voice: 'roar', noKnock: true });
reg({ id: 'mahoraga', name: 'Divine General Mahoraga', grade: 0, model: 'mahoraga', scale: 2.0, level: 45, hpMul: 50, atkMul: 2.0, defMul: 2.0, speed: 4.2, radius: 1.2, ai: 'boss', boss: 'mahoraga', attack: melee(3.4, 1.3, 1.6, 'slash1', 'slash'), aggro: 22, voice: 'roar', noKnock: true });

// ---- Yasohachi Bridge (Lv 21-27) ----
reg({ id: 'riverCurse', name: 'Drowned Curse', grade: 2, model: 'riverCurse', scale: 1.1, level: 21, hpMul: 1.6, atkMul: 1.25, defMul: 1.2, speed: 2.8, radius: 0.55, ai: 'melee', attack: melee(2.4, 1.6, 1.3, 'slash1', 'water'), aggro: 10, voice: 'growl', drops: [{ item: 'cursedMark', chance: 0.3 }] });
reg({ id: 'bloodFetus', name: 'Cursed Womb Spawn', grade: 3, model: 'bloodFetus', scale: 1, level: 22, hpMul: 0.9, atkMul: 1.15, defMul: 0.9, speed: 3.2, radius: 0.45, ai: 'ranged', attack: { kind: 'projectile', range: 9, cd: 2.1, windup: 0.5, mult: 1.15, proj: 'spit', projSpeed: 10, sfx: 'blood', color: 0xc8102a }, aggro: 10, voice: 'squish', flying: true, drops: [{ item: 'cursedMark', chance: 0.25 }] });
reg({ id: 'riverLeech', name: 'River Leech', grade: 2, model: 'leech', scale: 1.3, level: 23, hpMul: 1.4, atkMul: 1.25, defMul: 1.2, speed: 3.8, radius: 0.6, ai: 'charger', attack: { ...melee(1.8, 1.5, 1.25, 'bite', 'squish'), kind: 'lunge' }, aggro: 10, voice: 'squish' });
reg({ id: 'kechizu', name: 'Kechizu', grade: 1, model: 'kechizu', scale: 1.3, level: 24, hpMul: 18, atkMul: 1.5, defMul: 1.45, speed: 3.0, radius: 0.85, ai: 'boss', boss: 'kechizu', attack: melee(2.2, 1.4, 1.3, 'punch1', 'squish'), aggro: 18, voice: 'squish', noKnock: true });
reg({ id: 'eso', name: 'Eso', grade: 0, model: 'eso', scale: 1.1, level: 26, hpMul: 22, atkMul: 1.6, defMul: 1.55, speed: 4.2, radius: 0.7, ai: 'boss', boss: 'eso', attack: melee(2.3, 1.2, 1.35, 'punch1', 'blood'), aggro: 18, voice: 'blood', noKnock: true });

// ---- Post-Shibuya: Yuta Okkotsu (Lv 40) ----
reg({ id: 'yuta', name: 'Yuta Okkotsu', grade: 0, model: 'char:yuta', scale: 1.05, level: 40, hpMul: 30, atkMul: 1.7, defMul: 1.6, speed: 5.0, radius: 0.7, ai: 'boss', boss: 'yuta', attack: melee(2.6, 1.0, 1.45, 'slash1', 'slash'), aggro: 20, voice: 'slash', noKnock: true });

// ---- Zen'in Estate (Lv 38-46) ----
reg({ id: 'heiGuard', name: 'Hei Swordsman', grade: 2, model: 'char:hei', scale: 1, level: 38, hpMul: 1.6, atkMul: 1.3, defMul: 1.3, speed: 3.6, radius: 0.5, ai: 'melee', attack: melee(2.2, 1.4, 1.35, 'slash1', 'slash'), aggro: 11, voice: 'growl', drops: [{ item: 'heiCrest', chance: 0.3 }] });
reg({ id: 'heiCaster', name: 'Hei Technique User', grade: 2, model: 'char:heiB', scale: 1, level: 40, hpMul: 1.3, atkMul: 1.3, defMul: 1.1, speed: 3.0, radius: 0.5, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 2.0, windup: 0.5, mult: 1.25, proj: 'orb', projSpeed: 12, anim: 'throw', sfx: 'curse', color: 0x9a6aff }, aggro: 11, voice: 'growl', drops: [{ item: 'heiCrest', chance: 0.3 }] });
reg({ id: 'heiCaptain', name: 'Hei Captain', grade: 1, model: 'char:hei', scale: 1.15, level: 43, hpMul: 2.6, atkMul: 1.45, defMul: 1.5, speed: 4.0, radius: 0.6, ai: 'charger', attack: { ...melee(2.4, 1.5, 1.5, 'thrust', 'slash'), kind: 'lunge' }, aggro: 12, voice: 'growl', drops: [{ item: 'heiCrest', chance: 0.5 }] });
reg({ id: 'cagedCurse', name: 'Starving Captive Curse', grade: 1, model: 'wretch', scale: 1.25, level: 39, hpMul: 2.2, atkMul: 1.35, defMul: 1.5, speed: 2.8, radius: 0.65, ai: 'melee', attack: melee(2.2, 1.6, 1.4, 'slash2', 'slash'), aggro: 10, voice: 'growl' });
reg({ id: 'starvedHound', name: 'Storehouse Hound', grade: 2, model: 'hound', scale: 1.2, level: 39, hpMul: 1.4, atkMul: 1.25, defMul: 1.1, speed: 5.4, radius: 0.6, ai: 'charger', attack: { ...melee(1.8, 1.3, 1.25, 'bite', 'growl'), kind: 'lunge' }, aggro: 12, voice: 'growl' });
reg({ id: 'naoya', name: 'Naoya Zen\'in', grade: 0, model: 'char:naoya', scale: 1.05, level: 46, hpMul: 30, atkMul: 1.75, defMul: 1.6, speed: 5.6, radius: 0.65, ai: 'boss', boss: 'naoya', attack: melee(2.2, 0.9, 1.4, 'punch1', 'punch'), aggro: 20, voice: 'punch', noKnock: true });

// ---- Culling Game: Tokyo Colony No. 1 (Lv 46-60) ----
reg({ id: 'cgBrawler', name: 'Culling Game Player', grade: 2, model: 'char:cgBrawler', scale: 1, level: 46, hpMul: 1.7, atkMul: 1.35, defMul: 1.3, speed: 3.8, radius: 0.5, ai: 'melee', attack: melee(2.0, 1.3, 1.35, 'punch1', 'punch'), aggro: 12, voice: 'growl', drops: [{ item: 'pointToken', chance: 0.35 }] });
reg({ id: 'cgCaster', name: 'Culling Game Sorcerer', grade: 2, model: 'char:cgCaster', scale: 1, level: 48, hpMul: 1.4, atkMul: 1.35, defMul: 1.1, speed: 3.2, radius: 0.5, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 1.9, windup: 0.45, mult: 1.3, proj: 'orb', projSpeed: 13, anim: 'throw', sfx: 'curse', color: 0x6ad0ff }, aggro: 12, voice: 'growl', drops: [{ item: 'pointToken', chance: 0.35 }] });
reg({ id: 'barrierCurse', name: 'Barrier Jellyfish', grade: 1, model: 'barrierCurse', scale: 1.1, level: 49, hpMul: 1.9, atkMul: 1.3, defMul: 1.3, speed: 2.4, radius: 0.6, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 2.2, windup: 0.6, mult: 1.35, proj: 'orb', projSpeed: 10, sfx: 'curse', color: 0xc8a8ff }, aggro: 11, voice: 'squish', flying: true });
reg({ id: 'higuruma', name: 'Hiromi Higuruma', grade: 0, model: 'char:higuruma', scale: 1.05, level: 54, hpMul: 32, atkMul: 1.8, defMul: 1.7, speed: 4.4, radius: 0.65, ai: 'boss', boss: 'higuruma', attack: melee(2.4, 1.1, 1.45, 'hammer', 'swingHeavy'), aggro: 20, voice: 'bell', noKnock: true });
reg({ id: 'kashimo', name: 'Hajime Kashimo', grade: 0, model: 'char:kashimo', scale: 1.05, level: 60, hpMul: 34, atkMul: 1.9, defMul: 1.7, speed: 5.6, radius: 0.65, ai: 'boss', boss: 'kashimo', attack: melee(2.8, 1.0, 1.45, 'thrust', 'thunder'), aggro: 22, voice: 'thunder', noKnock: true });

// ---- Culling Game: Sendai Colony (Lv 56-68) ----
reg({ id: 'roach', name: 'Kurourushi Swarmling', grade: 3, model: 'roach', scale: 1.1, level: 56, hpMul: 0.8, atkMul: 1.1, defMul: 0.9, speed: 5.8, radius: 0.5, ai: 'charger', attack: { ...melee(1.5, 1.1, 1.1, 'bite', 'squish'), kind: 'lunge' }, aggro: 12, voice: 'squish' });
reg({ id: 'roachQueen', name: 'Kurourushi', grade: 1, model: 'roach', scale: 2.2, level: 60, hpMul: 4, atkMul: 1.5, defMul: 1.5, speed: 3.8, radius: 1.0, ai: 'charger', attack: { ...melee(2.4, 1.6, 1.5, 'bite', 'squish'), kind: 'lunge' }, aggro: 12, voice: 'roar' });
reg({ id: 'ishigori', name: 'Ryu Ishigori', grade: 0, model: 'char:ishigori', scale: 1.1, level: 66, hpMul: 38, atkMul: 2.0, defMul: 1.85, speed: 4.0, radius: 0.85, ai: 'boss', boss: 'ishigori', attack: melee(2.6, 1.3, 1.5, 'punch1', 'punch'), aggro: 22, voice: 'roar', noKnock: true });
reg({ id: 'uro', name: 'Takako Uro', grade: 0, model: 'char:uro', scale: 1.05, level: 64, hpMul: 34, atkMul: 1.9, defMul: 1.75, speed: 5.0, radius: 0.65, ai: 'boss', boss: 'uro', attack: melee(2.4, 1.0, 1.4, 'kick', 'wind'), aggro: 22, voice: 'wind', noKnock: true });

// ---- Shinjuku Showdown (Lv 68-82) ----
reg({ id: 'manipCurse', name: 'Kenjaku\'s Cursed Spirit', grade: 1, model: 'manipCurse', scale: 1.2, level: 68, hpMul: 2.4, atkMul: 1.45, defMul: 1.5, speed: 3.2, radius: 0.7, ai: 'melee', attack: melee(2.6, 1.6, 1.5, 'slash1', 'slash'), aggro: 12, voice: 'roar', drops: [{ item: 'shinjukuAsh', chance: 0.3 }] });
reg({ id: 'shadowHound', name: 'Ten Shadows: Divine Dog', grade: 1, model: 'dogBlack', scale: 1.2, level: 70, hpMul: 1.6, atkMul: 1.4, defMul: 1.3, speed: 6.0, radius: 0.6, ai: 'charger', attack: { ...melee(2.0, 1.3, 1.35, 'bite', 'growl'), kind: 'lunge' }, aggro: 13, voice: 'growl', drops: [{ item: 'shinjukuAsh', chance: 0.25 }] });
reg({ id: 'shinJelly', name: 'Overflowing Curse', grade: 1, model: 'barrierCurse', scale: 1.3, level: 70, hpMul: 2.0, atkMul: 1.4, defMul: 1.4, speed: 2.6, radius: 0.7, ai: 'ranged', attack: { kind: 'projectile', range: 11, cd: 2.0, windup: 0.55, mult: 1.4, proj: 'orb', projSpeed: 11, sfx: 'curse', color: 0xff6a9a }, aggro: 12, voice: 'squish', flying: true, drops: [{ item: 'shinjukuAsh', chance: 0.25 }] });
reg({ id: 'uraume', name: 'Uraume', grade: 0, model: 'char:uraume', scale: 1.05, level: 74, hpMul: 38, atkMul: 2.0, defMul: 1.85, speed: 4.6, radius: 0.65, ai: 'boss', boss: 'uraume', attack: melee(2.4, 1.1, 1.45, 'slash2', 'ice'), aggro: 22, voice: 'ice', noKnock: true });
reg({ id: 'kenjaku', name: 'Kenjaku', grade: 0, model: 'char:kenjaku', scale: 1.08, level: 78, hpMul: 44, atkMul: 2.1, defMul: 1.95, speed: 4.4, radius: 0.7, ai: 'boss', boss: 'kenjaku', attack: melee(2.4, 1.1, 1.5, 'punch1', 'curse'), aggro: 24, voice: 'roar', noKnock: true });
reg({ id: 'sukunaTrue', name: 'Ryomen Sukuna (True Form)', grade: 0, model: 'char:sukunaHeian', scale: 1.1, level: 82, hpMul: 60, atkMul: 2.25, defMul: 2.1, speed: 5.2, radius: 0.95, ai: 'boss', boss: 'sukunaTrue', attack: melee(3.0, 0.9, 1.6, 'slash1', 'dismantle'), aggro: 26, voice: 'roar', noKnock: true });

// ---- Tokyo Outskirts (open world, Lv 6-90 by zone) ----
reg({ id: 'forestCurse', name: 'Forest Curse', grade: 3, model: 'lanky', scale: 1.05, level: 7, hpMul: 1.0, atkMul: 1.1, defMul: 1, speed: 2.6, radius: 0.5, ai: 'melee', attack: melee(2.1, 1.7, 1.2, 'slash1', 'slash'), aggro: 9, voice: 'growl', drops: [{ item: 'shrineCharm', chance: 0.3 }] });
reg({ id: 'paddyCurse', name: 'Paddy Curse', grade: 3, model: 'rootCurse', scale: 1.0, level: 15, hpMul: 1.4, atkMul: 1.1, defMul: 1.2, speed: 0, radius: 0.6, ai: 'stationary', attack: { kind: 'projectile', range: 9, cd: 2.0, windup: 0.45, mult: 1.05, proj: 'seed', projSpeed: 11, sfx: 'roots', color: 0xc8e06a }, aggro: 10, voice: 'roots', drops: [{ item: 'shrineCharm', chance: 0.3 }] });
reg({ id: 'villageGhoul', name: 'Hungry Ghoul', grade: 3, model: 'transfigured', scale: 1.05, level: 17, hpMul: 1.2, atkMul: 1.15, defMul: 1, speed: 3.2, radius: 0.5, ai: 'melee', attack: melee(1.8, 1.5, 1.2, 'slash2', 'hit'), aggro: 10, voice: 'growl' });
reg({ id: 'graveWisp', name: 'Grave Wisp', grade: 3, model: 'flyhead', scale: 1.25, level: 22, hpMul: 0.9, atkMul: 1.15, defMul: 0.8, speed: 4.2, radius: 0.5, ai: 'flyer', attack: { ...melee(1.4, 1.3, 1.15, 'bite', 'screech'), kind: 'lunge' }, aggro: 11, voice: 'screech', flying: true });
reg({ id: 'mountainHound', name: 'Mountain Hound', grade: 2, model: 'hound', scale: 1.3, level: 32, hpMul: 1.5, atkMul: 1.3, defMul: 1.2, speed: 5.6, radius: 0.6, ai: 'charger', attack: { ...melee(1.9, 1.4, 1.3, 'bite', 'growl'), kind: 'lunge' }, aggro: 12, voice: 'growl', drops: [{ item: 'dragonScale', chance: 0.25 }] });
reg({ id: 'tenguCurse', name: 'Tengu Curse', grade: 2, model: 'nue', scale: 1.1, level: 36, hpMul: 1.3, atkMul: 1.3, defMul: 1.1, speed: 3.8, radius: 0.6, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 2.0, windup: 0.5, mult: 1.25, proj: 'orb', projSpeed: 12, sfx: 'wind', color: 0x9ae6ff }, aggro: 12, voice: 'screech', flying: true, drops: [{ item: 'dragonScale', chance: 0.25 }] });
reg({ id: 'lakeCurse', name: 'Lake Curse', grade: 2, model: 'riverCurse', scale: 1.25, level: 42, hpMul: 1.8, atkMul: 1.35, defMul: 1.3, speed: 2.8, radius: 0.65, ai: 'melee', attack: melee(2.4, 1.6, 1.35, 'slash1', 'water'), aggro: 11, voice: 'growl', drops: [{ item: 'dragonScale', chance: 0.3 }] });
reg({ id: 'wardWraith', name: 'Ward Wraith', grade: 2, model: 'wretch', scale: 1.2, level: 54, hpMul: 1.9, atkMul: 1.4, defMul: 1.4, speed: 3.0, radius: 0.6, ai: 'melee', attack: melee(2.2, 1.5, 1.4, 'slash2', 'slash'), aggro: 11, voice: 'growl', drops: [{ item: 'patientTag', chance: 0.3 }] });
reg({ id: 'hospitalHand', name: 'Grasping Patient', grade: 2, model: 'hand', scale: 1.3, level: 57, hpMul: 1.8, atkMul: 1.4, defMul: 1.4, speed: 3.2, radius: 0.7, ai: 'melee', attack: melee(2.1, 1.6, 1.45, 'grab', 'punch'), aggro: 11, voice: 'growl', drops: [{ item: 'patientTag', chance: 0.3 }] });
reg({ id: 'nestSpawn', name: 'Womb Tree Spawn', grade: 1, model: 'bloodFetus', scale: 1.3, level: 72, hpMul: 1.8, atkMul: 1.45, defMul: 1.3, speed: 3.4, radius: 0.55, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 1.9, windup: 0.5, mult: 1.35, proj: 'spit', projSpeed: 11, sfx: 'blood', color: 0xc8102a }, aggro: 12, voice: 'squish', flying: true });
reg({ id: 'releasedCurse', name: 'Released Special Grade', grade: 1, model: 'manipCurse', scale: 1.35, level: 80, hpMul: 3.0, atkMul: 1.55, defMul: 1.6, speed: 3.4, radius: 0.8, ai: 'melee', attack: melee(2.8, 1.6, 1.6, 'slash1', 'slash'), aggro: 13, voice: 'roar' });
reg({ id: 'smallpox', name: 'Smallpox Deity', grade: 0, model: 'smallpox', scale: 1.4, level: 24, hpMul: 26, atkMul: 1.6, defMul: 1.6, speed: 2.6, radius: 1.0, ai: 'boss', boss: 'smallpox', attack: melee(2.6, 1.5, 1.4, 'slam', 'punch'), aggro: 18, voice: 'roar', noKnock: true });
reg({ id: 'rainbowDragon', name: 'Rainbow Dragon', grade: 0, model: 'rainbowDragon', scale: 1.3, level: 40, hpMul: 34, atkMul: 1.75, defMul: 1.8, speed: 4.2, radius: 1.2, ai: 'boss', boss: 'rainbowDragon', attack: melee(3.2, 1.4, 1.5, 'bite', 'roar'), aggro: 20, voice: 'roar', flying: true, noKnock: true });
reg({ id: 'kuchisake', name: 'Kuchisake-onna', grade: 0, model: 'char:kuchisake', scale: 1.05, level: 58, hpMul: 34, atkMul: 1.85, defMul: 1.7, speed: 5.4, radius: 0.65, ai: 'boss', boss: 'kuchisake', attack: melee(2.4, 1.0, 1.45, 'slash1', 'slash'), aggro: 20, voice: 'screech', noKnock: true });

// ---- Culling Game: Sakurajima Colony (Lv 60-72, open world) ----
reg({ id: 'ashCurse', name: 'Ash Curse', grade: 2, model: 'barrierCurse', scale: 1.2, level: 61, hpMul: 1.9, atkMul: 1.4, defMul: 1.3, speed: 2.6, radius: 0.65, ai: 'ranged', attack: { kind: 'projectile', range: 10, cd: 2.0, windup: 0.55, mult: 1.4, proj: 'ember', projSpeed: 11, sfx: 'fireball', color: 0xff8a3a }, aggro: 12, voice: 'fire', flying: true, drops: [{ item: 'volcanicGlass', chance: 0.3 }] });
reg({ id: 'magmaHound', name: 'Magma Hound', grade: 2, model: 'hound', scale: 1.35, level: 62, hpMul: 1.7, atkMul: 1.4, defMul: 1.3, speed: 5.8, radius: 0.65, ai: 'charger', attack: { ...melee(2.0, 1.3, 1.4, 'bite', 'fire'), kind: 'lunge' }, aggro: 12, voice: 'growl', drops: [{ item: 'volcanicGlass', chance: 0.3 }] });
reg({ id: 'cgVeteran', name: 'Culling Game Veteran', grade: 1, model: 'char:cgBrawler', scale: 1.1, level: 64, hpMul: 2.4, atkMul: 1.5, defMul: 1.5, speed: 4.0, radius: 0.55, ai: 'melee', attack: melee(2.2, 1.2, 1.45, 'punch1', 'punch'), aggro: 13, voice: 'growl', drops: [{ item: 'pointToken', chance: 0.4 }] });
reg({ id: 'heiRemnant', name: 'Hei Remnant', grade: 1, model: 'char:hei', scale: 1.1, level: 65, hpMul: 2.2, atkMul: 1.5, defMul: 1.5, speed: 4.2, radius: 0.55, ai: 'charger', attack: { ...melee(2.4, 1.4, 1.5, 'thrust', 'slash'), kind: 'lunge' }, aggro: 13, voice: 'growl' });
reg({ id: 'naoyaCurse', name: 'Naoya Zen\'in (Cursed Spirit)', grade: 0, model: 'naoyaCurse', scale: 1.25, level: 70, hpMul: 44, atkMul: 2.05, defMul: 1.9, speed: 6.2, radius: 0.85, ai: 'boss', boss: 'naoyaCurse', attack: melee(2.6, 0.9, 1.5, 'punch1', 'punch'), aggro: 24, voice: 'roar', noKnock: true });

// ---- Memories in Tengen's barrier (Lv 84-100) ----
reg({ id: 'memoryCurse', name: 'Memory Curse', grade: 1, model: 'manipCurse', scale: 1.25, level: 84, hpMul: 2.6, atkMul: 1.55, defMul: 1.6, speed: 3.4, radius: 0.75, ai: 'melee', attack: melee(2.6, 1.5, 1.55, 'slash1', 'slash'), aggro: 13, voice: 'roar', drops: [{ item: 'memoryShard', chance: 0.3 }] });
reg({ id: 'templeAssassin', name: 'Time Vessel Assassin', grade: 1, model: 'char:cgCaster', scale: 1.05, level: 84, hpMul: 2.0, atkMul: 1.55, defMul: 1.4, speed: 4.0, radius: 0.5, ai: 'ranged', attack: { kind: 'projectile', range: 11, cd: 1.7, windup: 0.4, mult: 1.45, proj: 'orb', projSpeed: 14, anim: 'throw', sfx: 'curse', color: 0xd8c8a0 }, aggro: 13, voice: 'growl', drops: [{ item: 'memoryShard', chance: 0.3 }] });
reg({ id: 'paradeCurse', name: 'Night Parade Curse', grade: 1, model: 'manipCurse', scale: 1.3, level: 89, hpMul: 2.6, atkMul: 1.6, defMul: 1.6, speed: 3.6, radius: 0.75, ai: 'melee', attack: melee(2.6, 1.4, 1.6, 'slash2', 'slash'), aggro: 14, voice: 'roar', drops: [{ item: 'memoryShard', chance: 0.3 }] });
reg({ id: 'paradeFlyer', name: 'Night Parade Flyer', grade: 1, model: 'pumpkin', scale: 1.3, level: 89, hpMul: 1.9, atkMul: 1.55, defMul: 1.4, speed: 3.4, radius: 0.6, ai: 'ranged', attack: { kind: 'projectile', range: 11, cd: 1.8, windup: 0.45, mult: 1.45, proj: 'ember', projSpeed: 12, sfx: 'fireball', color: 0xb07aff }, aggro: 14, voice: 'fire', flying: true, drops: [{ item: 'memoryShard', chance: 0.3 }] });
reg({ id: 'toji', name: 'Toji Fushiguro', grade: 0, model: 'char:toji', scale: 1.1, level: 86, hpMul: 48, atkMul: 2.2, defMul: 2.0, speed: 6.4, radius: 0.7, ai: 'boss', boss: 'toji', attack: melee(2.8, 0.9, 1.6, 'slash1', 'slash'), aggro: 26, voice: 'slash', noKnock: true });
reg({ id: 'geto', name: 'Suguru Geto', grade: 0, model: 'char:geto', scale: 1.1, level: 92, hpMul: 54, atkMul: 2.3, defMul: 2.1, speed: 5.0, radius: 0.7, ai: 'boss', boss: 'geto', attack: melee(2.6, 1.0, 1.6, 'punch1', 'punch'), aggro: 26, voice: 'curse', noKnock: true });
reg({ id: 'gojoMemory', name: 'Satoru Gojo (Memory)', grade: 0, model: 'char:gojo', scale: 1.08, level: 98, hpMul: 64, atkMul: 2.45, defMul: 2.25, speed: 5.6, radius: 0.7, ai: 'boss', boss: 'gojoMemory', attack: melee(2.6, 0.9, 1.65, 'punch1', 'punch'), aggro: 28, voice: 'blue', noKnock: true });

// ---- Objects ----
reg({ id: 'veilAnchor', name: 'Veil Anchor', grade: 2, model: 'static:veilAnchor', scale: 1, level: 26, hpMul: 3, atkMul: 0, defMul: 1, speed: 0, radius: 0.5, ai: 'dummy', attack: melee(0, 99, 0), aggro: 0, noKnock: true, drops: [{ item: 'veilTag', chance: 1 }] });

// ---- Training ----
reg({ id: 'tsukamoto', name: 'Cursed Doll', grade: 4, model: 'char:tsukamoto', scale: 0.9, level: 8, hpMul: 1.2, atkMul: 0.7, defMul: 0.8, speed: 3.4, radius: 0.4, ai: 'melee', attack: melee(1.3, 1.4, 0.8, 'punch1', 'punch'), aggro: 7, voice: 'pad' });
reg({ id: 'choso', name: 'Choso', grade: 0, model: 'char:choso', scale: 1.05, level: 30, hpMul: 24, atkMul: 1.55, defMul: 1.45, speed: 4.6, radius: 0.7, ai: 'boss', boss: 'choso', attack: melee(2.2, 1.1, 1.3, 'punch1', 'punch'), aggro: 18, voice: 'blood', noKnock: true });
reg({ id: 'treasure', name: 'Sealed Cache', grade: 4, model: 'static:treasureChest', scale: 1, level: 1, hpMul: 1.4, atkMul: 0, defMul: 0.5, speed: 0, radius: 0.5, ai: 'dummy', attack: melee(0, 99, 0), aggro: 0, noKnock: true, deathSfx: 'rare' });
reg({ id: 'dummy', name: 'Cursed Corpse (Training)', grade: 4, model: 'dummy', scale: 1.0, level: 1, hpMul: 6, atkMul: 0, defMul: 0, speed: 0, radius: 0.5, ai: 'dummy', attack: melee(0, 99, 0), aggro: 0 });

export const ENEMIES = E;

export function enemyStats(d: EnemyDef, levelOverride?: number) {
  const L = levelOverride ?? d.level;
  const gradeHp = [1.0, 1.6, 1.25, 1.0, 0.75][d.grade];
  return {
    level: L,
    hp: Math.round((34 + 20 * Math.pow(L, 1.32)) * d.hpMul * gradeHp),
    atk: Math.round((7 + 3.3 * L) * d.atkMul),
    def: Math.round((2 + 1.6 * L) * d.defMul),
    exp: Math.round((8 + 5 * Math.pow(L, 1.25)) * (d.ai === 'boss' ? 14 : 1) * [2, 1.8, 1.4, 1.1, 1][d.grade] * (d.hpMul > 2 ? 1 : d.hpMul)),
    gold: Math.round((4 + 2.5 * L) * (d.ai === 'boss' ? 12 : 1)),
  };
}
