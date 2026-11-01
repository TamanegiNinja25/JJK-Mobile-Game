// Playable sorcerer definitions: base stats, growth and basic-attack combos.
import { Attr, BaseClassId, ClassId } from './types';

export interface ComboHit {
  anim: string;
  dur: number;
  mult: number;
  range: number;
  arc: number;          // radians of the hit cone
  sfx: string;
  swingSfx?: string;
  projectile?: 'nail';
  knock?: number;
  lunge?: number;
}

export interface ClassDef {
  id: ClassId;
  /**
   * whose lines this sorcerer speaks in the story (the Sukunas and Modulo Yuji borrow a first-year's).
   * Unset for a guest who is someone else in the story: they hear everyone's third-person lines.
   */
  persona?: BaseClassId;
  /** the story NPC this sorcerer is: that NPC steps aside, and their lines and errands become the player's */
  self?: string;
  /** what the CE bar holds: Toji has no cursed energy, so his skills spend stamina */
  resource?: 'stamina';
  /** 'sukuna': borrowed story lines are swapped for his own (data/sukunaVoice.ts); the guests re-voice theirs (data/guestVoice.ts) */
  voice?: 'sukuna' | 'yuta' | 'toji';
  /** a guest with no persona still speaks in conversations: this first-year's player lines, in their own words */
  voiceFrom?: BaseClassId;
  /** unlockable sorcerers: what unlocks them, as shown on the select screen */
  unlock?: string;
  /** colour of the dash trail and aura */
  trail: number;
  name: string;
  /** label where several sorcerers share a name (three of them are Sukuna) */
  short: string;
  title: string;
  model: string;
  stance: 'fist' | 'blade' | 'hammer';
  desc: string;
  base: { hp: number; hpLv: number; ce: number; ceLv: number; atk: number; atkLv: number; def: number; defLv: number };
  attrs: Record<Attr, number>;
  /** how attributes contribute to attack */
  atkScale: Partial<Record<Attr, number>>;
  bfBonus: number;
  combo: ComboHit[];
  startGear: string[];
  color: string;
  weaponModel: 'fist' | 'blade' | 'hammer';
}

export const CLASSES: Record<ClassId, ClassDef> = {
  yuji: {
    id: 'yuji', short: "Yuji", persona: 'yuji', trail: 0x9ad0ff, name: 'Yuji Itadori', title: 'The Vessel', model: 'yuji', stance: 'fist', color: '#ff7a9a',
    desc: 'Close-range brawler with monstrous physical strength. Fast combos, Divergent Fist and the highest Black Flash affinity. Ultimate: Sukuna takes the wheel.',
    base: { hp: 150, hpLv: 24, ce: 60, ceLv: 4, atk: 14, atkLv: 3.3, def: 6, defLv: 1.3 },
    attrs: { str: 9, dex: 6, vit: 8, ce: 3 },
    atkScale: { str: 2.0 },
    bfBonus: 0.03,
    combo: [
      { anim: 'punch1', dur: 0.26, mult: 0.9, range: 1.8, arc: 1.6, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'punch2', dur: 0.26, mult: 0.95, range: 1.8, arc: 1.6, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'kick', dur: 0.42, mult: 1.5, range: 2.2, arc: 2.2, sfx: 'kick', swingSfx: 'swingHeavy', knock: 2.5, lunge: 0.9 },
    ],
    startGear: ['wraps', 'uniform', 'sneakers'],
    weaponModel: 'fist',
  },
  megumi: {
    id: 'megumi', short: "Megumi", persona: 'megumi', trail: 0x2a2a4a, name: 'Megumi Fushiguro', title: 'Ten Shadows', model: 'megumi', stance: 'blade', color: '#7a8aff',
    desc: 'Shikigami summoner and swordsman. Divine Dogs, Nue, Toad and Max Elephant fight beside you. Ultimate: Domain Expansion — Chimera Shadow Garden.',
    base: { hp: 120, hpLv: 19, ce: 95, ceLv: 6.5, atk: 13, atkLv: 3.0, def: 5, defLv: 1.0 },
    attrs: { str: 6, dex: 7, vit: 5, ce: 9 },
    atkScale: { str: 1.3, ce: 0.8 },
    bfBonus: 0,
    combo: [
      { anim: 'slash1', dur: 0.3, mult: 1.0, range: 2.2, arc: 2.0, sfx: 'slash', swingSfx: 'swing', lunge: 0.4 },
      { anim: 'slash2', dur: 0.3, mult: 1.0, range: 2.2, arc: 2.4, sfx: 'slash', swingSfx: 'swing', lunge: 0.4 },
      { anim: 'thrust', dur: 0.4, mult: 1.4, range: 2.8, arc: 0.9, sfx: 'slash', swingSfx: 'swingHeavy', knock: 1.5, lunge: 1.0 },
    ],
    startGear: ['tanto', 'uniform', 'sneakers'],
    weaponModel: 'blade',
  },
  nobara: {
    id: 'nobara', short: "Nobara", persona: 'nobara', trail: 0xffc08a, name: 'Nobara Kugisaki', title: 'Straw Doll', model: 'nobara', stance: 'hammer', color: '#ffa04a',
    desc: 'Mid-range technician. Throws cursed nails, then detonates them with Hairpin and Resonance through her straw doll. Ultimate: Resonance — Thousand Nails.',
    base: { hp: 115, hpLv: 18, ce: 85, ceLv: 5.5, atk: 12, atkLv: 3.1, def: 4, defLv: 0.95 },
    attrs: { str: 6, dex: 9, vit: 5, ce: 6 },
    atkScale: { str: 1.4, dex: 0.7 },
    bfBonus: 0.01,
    combo: [
      { anim: 'throw', dur: 0.3, mult: 0.85, range: 9, arc: 0.6, sfx: 'nail', projectile: 'nail' },
      { anim: 'throw', dur: 0.3, mult: 0.85, range: 9, arc: 0.6, sfx: 'nail', projectile: 'nail' },
      { anim: 'hammer', dur: 0.45, mult: 1.35, range: 2.4, arc: 2.2, sfx: 'hammer', swingSfx: 'swingHeavy', knock: 2.2, lunge: 0.6 },
    ],
    startGear: ['carpHammer', 'uniform', 'sneakers'],
    weaponModel: 'hammer',
  },

  // ---- Unlockable sorcerers: far stronger stats and growth than the first-years ----
  sukunaYuji: {
    id: 'sukunaYuji', short: "Sukuna · Yuji's Body", persona: 'yuji', voice: 'sukuna', trail: 0xff3a4a, name: 'Ryomen Sukuna', title: 'King of Curses (Yuji\'s Body)', model: 'sukunaYuji', stance: 'fist', color: '#ff3a4a',
    unlock: 'Clear the Shibuya Incident (main quest "King of Curses").',
    desc: 'Sukuna wearing Yuji\'s body, as he was in Shibuya. Dismantle and Cleave at close range, Flame Arrow at a distance, and reverse cursed technique to shrug off wounds. Ultimate: Malevolent Shrine, closed with Open: Fuga.',
    base: { hp: 210, hpLv: 33, ce: 140, ceLv: 9, atk: 20, atkLv: 4.6, def: 9, defLv: 1.8 },
    attrs: { str: 12, dex: 9, vit: 10, ce: 12 },
    atkScale: { str: 1.6, ce: 1.0 },
    bfBonus: 0.05,
    combo: [
      { anim: 'punch1', dur: 0.24, mult: 1.0, range: 2.0, arc: 1.7, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'punch2', dur: 0.24, mult: 1.05, range: 2.0, arc: 1.7, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'slash2', dur: 0.4, mult: 1.6, range: 3.4, arc: 2.4, sfx: 'dismantle', swingSfx: 'swingHeavy', knock: 2.4, lunge: 0.7 },
    ],
    startGear: ['vesselWrapsS', 'uniform', 'sneakers'],
    weaponModel: 'fist',
  },
  sukunaMegumi: {
    id: 'sukunaMegumi', short: "Sukuna · Megumi's Body", persona: 'megumi', voice: 'sukuna', trail: 0x6a1a3a, name: 'Ryomen Sukuna', title: 'King of Curses (Megumi\'s Body)', model: 'sukunaMegumi', stance: 'fist', color: '#c83a7a',
    unlock: 'Clear the Shinjuku Showdown (main quest "Shinjuku Showdown").',
    desc: 'Sukuna in Megumi\'s body, as he faced Gojo in Shinjuku. Commands the Ten Shadows, calls down Kamutoke\'s lightning and cuts with Dismantle. Ultimate: Mahoraga adapts, then the World-Cutting Slash.',
    base: { hp: 200, hpLv: 31, ce: 170, ceLv: 11, atk: 20, atkLv: 4.5, def: 8, defLv: 1.7 },
    attrs: { str: 10, dex: 11, vit: 9, ce: 14 },
    atkScale: { str: 1.3, ce: 1.2 },
    bfBonus: 0.04,
    combo: [
      { anim: 'punch1', dur: 0.24, mult: 1.0, range: 2.0, arc: 1.7, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'kick', dur: 0.32, mult: 1.15, range: 2.2, arc: 2.0, sfx: 'kick', swingSfx: 'swing', lunge: 0.7 },
      { anim: 'slash1', dur: 0.4, mult: 1.55, range: 3.4, arc: 2.2, sfx: 'dismantle', swingSfx: 'swingHeavy', knock: 2.2, lunge: 0.6 },
    ],
    startGear: ['shadowWrapsS', 'uniform', 'sneakers'],
    weaponModel: 'fist',
  },
  heianSukuna: {
    id: 'heianSukuna', short: "Heian Sukuna", persona: 'yuji', voice: 'sukuna', trail: 0xff6a2a, name: 'Ryomen Sukuna', title: 'Calamity of the Heian Era', model: 'heianSukuna', stance: 'fist', color: '#ff6a2a',
    unlock: 'Defeat Ryomen Sukuna\'s true form and finish the story (main quest "The King of Curses").',
    desc: 'The King of Curses in his own body: four arms, two faces, a mouth in his belly. The highest stats of anyone. Four-armed combos, Dismantle, Cleave and Divine Flame. Ultimate: the full Malevolent Shrine, ending in a Divine Flame blast.',
    base: { hp: 260, hpLv: 40, ce: 200, ceLv: 12, atk: 24, atkLv: 5.4, def: 11, defLv: 2.2 },
    attrs: { str: 14, dex: 10, vit: 12, ce: 15 },
    atkScale: { str: 1.7, ce: 1.1 },
    bfBonus: 0.06,
    combo: [
      { anim: 'punch1', dur: 0.21, mult: 0.9, range: 2.2, arc: 1.8, sfx: 'punch', swingSfx: 'swing', lunge: 0.5 },
      { anim: 'punch2', dur: 0.21, mult: 0.9, range: 2.2, arc: 1.8, sfx: 'punch', swingSfx: 'swing', lunge: 0.5 },
      { anim: 'punch1', dur: 0.21, mult: 0.95, range: 2.2, arc: 1.8, sfx: 'punch', swingSfx: 'swing', lunge: 0.5 },
      { anim: 'slam', dur: 0.46, mult: 1.9, range: 2.8, arc: 3.2, sfx: 'shockwave', swingSfx: 'swingHeavy', knock: 3, lunge: 0.6 },
    ],
    startGear: ['heianWraps', 'uniform', 'sneakers'],
    weaponModel: 'fist',
  },
  moduloYuji: {
    id: 'moduloYuji', short: "Modulo Yuji", persona: 'yuji', trail: 0xff8aa0, name: 'Yuji Itadori', title: 'Sixty-Eight Years On (Modulo)', model: 'moduloYuji', stance: 'fist', color: '#ff8aa0',
    unlock: 'Finish the story as Yuji Itadori, or clear the Memories chapter with anyone (main quest "The Strongest\'s Last Lesson").',
    desc: 'Yuji, decades after Shinjuku, with everything he learned: Black Flash at will, Choso\'s blood techniques, the Dismantle and Cleave Sukuna left in his soul, and blows that strike the soul itself. Ultimate: his own Domain Expansion.',
    base: { hp: 240, hpLv: 37, ce: 130, ceLv: 8, atk: 22, atkLv: 5.0, def: 10, defLv: 2.0 },
    attrs: { str: 14, dex: 10, vit: 13, ce: 9 },
    atkScale: { str: 2.0, ce: 0.5 },
    bfBonus: 0.08,
    combo: [
      { anim: 'punch1', dur: 0.23, mult: 1.0, range: 2.0, arc: 1.7, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'punch2', dur: 0.23, mult: 1.05, range: 2.0, arc: 1.7, sfx: 'punch', swingSfx: 'swing', lunge: 0.6 },
      { anim: 'kick', dur: 0.4, mult: 1.7, range: 2.4, arc: 2.3, sfx: 'kick', swingSfx: 'swingHeavy', knock: 2.8, lunge: 0.9 },
    ],
    startGear: ['moduloWraps', 'uniform', 'sneakers'],
    weaponModel: 'fist',
  },

  // ---- Guests: special grades who are somebody else in the story ----
  yuta: {
    id: 'yuta', short: 'Yuta', self: 'yuta', voice: 'yuta', voiceFrom: 'megumi', trail: 0xffb0e0, name: 'Yuta Okkotsu', title: 'Special Grade · Queen of Curses', model: 'yuta', stance: 'blade', color: '#ff9ad8',
    unlock: 'Clear "The Executioner" (Chapter 6), where Yuta comes for Yuji.',
    desc: 'A special grade with an endless well of cursed energy. A katana, Rika the Queen of Curses at his side, Inumaki\'s Cursed Speech and whatever else he has copied, and reverse cursed technique to heal. Ultimate: Domain Expansion — Authentic Mutual Love.',
    base: { hp: 215, hpLv: 33, ce: 190, ceLv: 12.5, atk: 20, atkLv: 4.6, def: 9, defLv: 1.8 },
    attrs: { str: 10, dex: 11, vit: 10, ce: 15 },
    atkScale: { str: 1.2, ce: 1.25 },
    bfBonus: 0.03,
    combo: [
      { anim: 'slash1', dur: 0.27, mult: 1.05, range: 2.4, arc: 2.0, sfx: 'slash', swingSfx: 'swing', lunge: 0.5 },
      { anim: 'slash2', dur: 0.27, mult: 1.1, range: 2.4, arc: 2.4, sfx: 'slash', swingSfx: 'swing', lunge: 0.5 },
      { anim: 'thrust', dur: 0.4, mult: 1.6, range: 3.0, arc: 1.0, sfx: 'slash', swingSfx: 'swingHeavy', knock: 2, lunge: 1.0 },
    ],
    startGear: ['yutaKatana', 'uniform', 'sneakers'],
    weaponModel: 'blade',
  },
  toji: {
    id: 'toji', short: 'Toji', self: 'toji', voice: 'toji', voiceFrom: 'megumi', resource: 'stamina', trail: 0x8a6aa0, name: 'Toji Fushiguro', title: 'Sorcerer Killer · Heavenly Restriction', model: 'toji', stance: 'blade', color: '#a88ac8',
    unlock: 'Clear "Hidden Inventory" (Chapter 9, the Memories in the Barrier).',
    desc: 'Born with no cursed energy at all, and a body pushed past human limits in exchange. The fastest and toughest fighter here, with the Inverted Spear of Heaven, Playful Cloud, the Split Soul Katana and an endless chain. His skills spend stamina, not cursed energy. Ultimate: Sorcerer Killer — Unbound.',
    base: { hp: 255, hpLv: 39, ce: 80, ceLv: 3.5, atk: 23, atkLv: 5.2, def: 11, defLv: 2.2 },
    attrs: { str: 15, dex: 14, vit: 12, ce: 1 },
    atkScale: { str: 1.8, dex: 0.8 },
    bfBonus: 0,
    combo: [
      { anim: 'slash1', dur: 0.22, mult: 1.0, range: 2.4, arc: 1.8, sfx: 'slash', swingSfx: 'swing', lunge: 0.7 },
      { anim: 'slash2', dur: 0.22, mult: 1.05, range: 2.4, arc: 2.0, sfx: 'slash', swingSfx: 'swing', lunge: 0.7 },
      { anim: 'kick', dur: 0.32, mult: 1.25, range: 2.4, arc: 2.0, sfx: 'kick', swingSfx: 'swingHeavy', knock: 2.2, lunge: 0.8 },
      { anim: 'thrust', dur: 0.4, mult: 1.7, range: 3.2, arc: 0.9, sfx: 'slash', swingSfx: 'swingHeavy', knock: 2.6, lunge: 1.2 },
    ],
    startGear: ['tojiKnife', 'uniform', 'sneakers'],
    weaponModel: 'blade',
  },
};

/** The first three can be picked from the start; the rest are unlocked by play. */
export const BASE_CLASSES: ClassId[] = ['yuji', 'megumi', 'nobara'];
export const UNLOCKABLE_CLASSES: ClassId[] = ['sukunaYuji', 'sukunaMegumi', 'heianSukuna', 'moduloYuji', 'yuta', 'toji'];

export const LEVEL_CAP = 100;
export function expToNext(level: number) {
  return Math.floor(40 * Math.pow(level, 1.75) + 60 * level);
}
