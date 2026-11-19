// Quests and dialogue. All lines are original writing for this fan game.
import { BaseClassId, ClassId } from '../rpg/types';
import type { PlayerState } from '../rpg/PlayerState';
import { EARLY_QUESTS } from './questsEarly';
import { LATE_QUESTS } from './questsLate';
import { WORLD_QUESTS } from './questsWorld';

export interface Line {
  who: string;            // npc id, 'player', 'narrator', 'sukuna'
  text: string;
  only?: BaseClassId[];   // shown only for these story voices (see ClassDef.persona)
  not?: BaseClassId[];    // hidden for these story voices
  cls?: string[];         // shown only to these sorcerers (class ids, e.g. a guest who is someone else in the story)
  notCls?: string[];      // hidden from these sorcerers
  ifFlag?: string;        // shown only once this flag is set (e.g. a scene the player has seen)
  unlessFlag?: string;    // shown only while this flag is unset (a fallback for a missed scene)
  emote?: string;         // animation for the speaker
  sfx?: string;
  mood?: 'neutral' | 'happy' | 'angry' | 'surprised' | 'sad';  // expression in the dialogue art (guessed from the text if unset)
}

export interface Choice { text: string; reply: Line[]; flag?: string }

/** How a story conversation is staged as a cutscene (see world/Director). */
export interface SceneSpec {
  /** small line above the title (a date, a place) */
  kicker?: string;
  title?: string;
  jp?: string;
  /** camera: a slow orbit, a low angle looking up, or close on the player */
  cam?: 'orbit' | 'low' | 'close';
  /** colour wash over the scene */
  tint?: 'red' | 'blue' | 'purple' | 'cyan' | 'gold';
  shake?: number;
  /** only for these story voices (a scene about Yuji's body makes no sense for Nobara) */
  only?: BaseClassId[];
}

/** The story's chapters, for title cards and chapter clears. */
export const CHAPTERS: Record<number, { name: string }> = {
  1: { name: 'The Cursed Finger' }, 2: { name: 'Cursed Womb' }, 3: { name: 'Idle Transfiguration' },
  4: { name: 'Kyoto Goodwill Event' }, 5: { name: 'The Shibuya Incident' }, 6: { name: 'Perfect Preparation' },
  7: { name: 'The Culling Game' }, 8: { name: 'The Shinjuku Showdown' }, 9: { name: 'Memories in the Barrier' },
};

export type Objective =
  | { type: 'kill'; target: string[] | 'any'; count: number; map?: string; label: string }
  | { type: 'collect'; item: string; count: number; label: string }
  | { type: 'talk'; npc: string; label: string }
  | { type: 'reach'; map: string; label: string }
  | { type: 'boss'; target: string; label: string }
  | { type: 'enhance'; count: number; label: string }
  | { type: 'pay'; gold: number; label: string };

export interface QuestDef {
  id: string;
  name: string;
  type: 'main' | 'side';
  chapter: number;
  giver: string;
  turnIn?: string;
  level?: number;
  prereq?: string[];
  summary: string;
  objectives: Objective[];
  offer: Line[];
  choices?: Choice[];
  progress?: Line[];
  complete: Line[];
  rewards: { exp: number; gold: number; items?: { id: string; qty?: number; rarity?: 0 | 1 | 2 }[]; classItems?: Partial<Record<ClassId, string>>; fingers?: number };
  unlock?: string[];
  autoAccept?: boolean;
  /** big story moments are staged as cutscenes: the offer, the part of the ending where the boss falls, the report */
  cine?: { offer?: SceneSpec; outro?: SceneSpec; complete?: SceneSpec };
  /** who takes the quest over while its giver or turn-in NPC is away from the story (see NPC_AWAY) */
  stand?: { npc: string; offer: Line[]; progress?: Line[]; complete: Line[] };
}

const isDone = (ps: PlayerState, id: string) => ps.questState(id)?.state === 'done';
/** Gojo is sealed from the night Shibuya begins until the Prison Realm is opened, and gone after Shinjuku. */
export const gojoAround = (ps: PlayerState) => !ps.questState('m11') || (!!ps.questState('m22') && !isDone(ps, 'm23'));
/** People who leave the story for a while. Their quests pass to the quest's `stand` NPC meanwhile. */
export const NPC_AWAY: Record<string, (ps: PlayerState) => boolean> = { gojo: ps => !gojoAround(ps) };

export const NPC_NAMES: Record<string, string> = {
  gojo: 'Satoru Gojo', yaga: 'Masamichi Yaga', shoko: 'Shoko Ieiri', maki: 'Maki Zen\'in', panda: 'Panda', inumaki: 'Toge Inumaki',
  ijichi: 'Kiyotaka Ijichi', nanami: 'Kento Nanami', junpei: 'Junpei Yoshino', todo: 'Aoi Todo', miwa: 'Kasumi Miwa', meimei: 'Mei Mei',
  yuji: 'Yuji Itadori', megumi: 'Megumi Fushiguro', nobara: 'Nobara Kugisaki', narrator: '', sukuna: 'Ryomen Sukuna', mahito: 'Mahito',
  hanami: 'Hanami', jogo: 'Jogo', dagon: 'Dagon', civilian: 'Civilian', student: 'Student', board: 'Notice Board',
  mechamaru: 'Mechamaru', sasaki: 'Sasaki (Occult Club)', iguchi: 'Iguchi (Occult Club)', choso: 'Choso', kenjaku: 'Kenjaku', grandpa: 'Wasuke Itadori',
  kechizu: 'Kechizu', eso: 'Eso', yuta: 'Yuta Okkotsu', mai: 'Mai Zen\'in', naoya: 'Naoya Zen\'in', hakari: 'Kinji Hakari', higuruma: 'Hiromi Higuruma',
  kashimo: 'Hajime Kashimo', ishigori: 'Ryu Ishigori', uro: 'Takako Uro', uraume: 'Uraume',
  tengen: 'Tengen', kamo: 'Noritoshi Kamo', monk: 'Village Monk', farmer: 'Farmer', toji: 'Toji Fushiguro', geto: 'Suguru Geto',
  kuchisake: 'Kuchisake-onna', smallpox: 'Smallpox Deity', rainbowDragon: 'Rainbow Dragon', naoyaCurse: 'Naoya (Cursed Spirit)', gojoMemory: 'Satoru Gojo',
  nitta: 'Akari Nitta', fingerBearer: 'Finger Bearer',
};

/** Names in Japanese for the dialogue name plates. */
export const NPC_JP: Record<string, string> = {
  gojo: '五条悟', gojoMemory: '五条悟', yaga: '夜蛾正道', shoko: '家入硝子', maki: '禪院真希', panda: 'パンダ', inumaki: '狗巻棘',
  ijichi: '伊地知潔高', nanami: '七海建人', junpei: '吉野順平', todo: '東堂葵', miwa: '三輪霞', meimei: '冥冥',
  yuji: '虎杖悠仁', moduloYuji: '虎杖悠仁', megumi: '伏黒恵', nobara: '釘崎野薔薇', sukuna: '両面宿儺', sukunaYuji: '両面宿儺',
  sukunaMegumi: '両面宿儺', heianSukuna: '両面宿儺', mahito: '真人', hanami: '花御', jogo: '漏瑚', dagon: '陀艮',
  mechamaru: '究極メカ丸', choso: '脹相', kenjaku: '羂索', grandpa: '虎杖倭助', kechizu: '血塗', eso: '壊相', yuta: '乙骨憂太',
  mai: '禪院真依', naoya: '禪院直哉', naoyaCurse: '禪院直哉', hakari: '秤金次', higuruma: '日車寛見', kashimo: '鹿紫雲一',
  ishigori: '石流龍', uro: '烏鷺亨子', uraume: '裏梅', tengen: '天元', kamo: '加茂憲紀', toji: '伏黒甚爾', geto: '夏油傑',
  kuchisake: '口裂け女', smallpox: '疱瘡神', rainbowDragon: '虹龍', mahoraga: '魔虚羅', monk: '僧侶', farmer: '農家',
  sasaki: '佐々木', iguchi: '井口', nitta: '新田明', fingerBearer: '指持ち',
};

/** How the UI refers to people in tight spaces (map labels, quest log). */
export const NPC_SHORT: Record<string, string> = {
  gojo: 'Gojo', yaga: 'Yaga', shoko: 'Shoko', maki: 'Maki', panda: 'Panda', inumaki: 'Inumaki', ijichi: 'Ijichi', nanami: 'Nanami',
  junpei: 'Junpei', todo: 'Todo', miwa: 'Miwa', meimei: 'Mei Mei', sasaki: 'Sasaki', iguchi: 'Iguchi', yuji: 'Yuji', megumi: 'Megumi', nobara: 'Nobara',
  mechamaru: 'Mechamaru', yuta: 'Yuta', hakari: 'Hakari', higuruma: 'Higuruma', ishigori: 'Ishigori', choso: 'Choso',
  tengen: 'Tengen', kamo: 'Kamo', monk: 'Monk', farmer: 'Farmer',
  nitta: 'Nitta',
};

export const QUESTS: QuestDef[] = [...EARLY_QUESTS, ...LATE_QUESTS, ...WORLD_QUESTS];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map(q => [q.id, q]));

/** Idle chatter when an NPC has nothing quest-related to say. */
export const IDLE: Record<string, Line[][]> = {
  gojo: [
    [{ who: 'gojo', text: 'Throughout heaven and earth, I alone am the honoured one. Also I bought too many mochi. Want some?' }],
    [{ who: 'gojo', text: 'Don\'t worry. I\'m the strongest. That\'s kind of my whole thing.' }],
    [{ who: 'gojo', text: 'Tip: Black Flash happens when cursed energy hits within a millionth of a second of your blow. Or, you know, by luck. Mostly luck.' }],
  ],
  yaga: [[{ who: 'yaga', text: 'A sorcerer\'s strength is measured by what they protect, not what they destroy.' }], [{ who: 'yaga', text: 'My workshop is open. Bring fragments and I will infuse your gear.' }]],
  shoko: [[{ who: 'shoko', text: 'Need healing? I\'m on shift. Try not to make it a habit.' }], [{ who: 'shoko', text: 'I\'d offer you a cigarette but you\'re a minor and I quit. Officially.' }]],
  maki: [[{ who: 'maki', text: 'If you\'re here to buy, buy. If you\'re here to chat, go bother Panda.' }], [{ who: 'maki', text: 'A cursed tool is only as good as the hands holding it.' }]],
  panda: [[{ who: 'panda', text: 'I\'m a mutated cursed corpse with three cores. So yeah, I contain multitudes.' }], [{ who: 'panda', text: 'Toge says "salmon." That means hi. Probably.' }]],
  inumaki: [[{ who: 'inumaki', text: 'Salmon.' }], [{ who: 'inumaki', text: 'Mustard leaf.' }], [{ who: 'inumaki', text: 'Bonito flakes!' }]],
  ijichi: [[{ who: 'ijichi', text: 'W-where would you like to go? I can drive you anywhere the higher-ups have cleared.' }]],
  nitta: [[{ who: 'nitta', text: 'Akari Nitta, auxiliary manager! The windows report new curses every morning. Here is today\'s list.' }]],
  nanami: [[{ who: 'nanami', text: 'Labor is crap.' }], [{ who: 'nanami', text: 'My technique creates a weak point at a 7:3 ratio. Yours seems to be "hit it until it stops."' }]],
  junpei: [[{ who: 'junpei', text: 'Do you think... people can change? Like, actually change?' }]],
  mechamaru: [[{ who: 'mechamaru', text: 'Kokichi Muta, operating remotely. Bring me gear infused to +10 and I will tune it further. Up to +30.' }], [{ who: 'mechamaru', text: 'Each reforge calibrates one property. Past +20 the margins are thin. Do not complain when it overloads.' }]],
  sasaki: [[{ who: 'sasaki', text: 'We\'re never touching anything cursed again. Probably. Maybe.' }]],
  iguchi: [[{ who: 'iguchi', text: 'My arm\'s fine. Mostly. Is there a mouth on your— never mind.' }]],
  todo: [[{ who: 'todo', text: 'BROTHER! Our souls resonate even now!' }]],
  miwa: [[{ who: 'miwa', text: 'S-sorry! I\'m just practising my Simple Domain! Don\'t mind me!' }]],
  meimei: [[{ who: 'meimei', text: 'Money is the only thing that never betrays you. Well, money and crows.' }]],
  yuji: [[{ who: 'yuji', text: 'Hey! Wanna grab food after this? I know a place with huge portions.' }], [{ who: 'yuji', text: 'Gojo-sensei made me watch movies while holding a cursed doll. For training. I think.' }]],
  megumi: [[{ who: 'megumi', text: '...Don\'t do anything reckless.' }], [{ who: 'megumi', text: 'My shikigami are tired. So am I.' }]],
  nobara: [[{ who: 'nobara', text: 'When this is over we are going SHOPPING in Harajuku. I don\'t care how many curses there are.' }], [{ who: 'nobara', text: 'Do I look like I\'m from the countryside? Don\'t answer that.' }]],
  civilian: [[{ who: 'civilian', text: 'The sky... there\'s a black dome over everything! What\'s happening?!' }], [{ who: 'civilian', text: 'I can\'t get out! The station exits are all blocked!' }], [{ who: 'civilian', text: 'Th-thank you! I thought those things were going to eat me!' }]],
  student: [[{ who: 'student', text: 'Did you hear that noise from the field? I\'m staying right here.' }]],
  yuta: [[{ who: 'yuta', text: 'Rika says hi. ...Okay, she didn\'t. But she was thinking it.' }], [{ who: 'yuta', text: 'Gojo-sensei taught me that the strongest thing you can be is someone people can rely on.' }]],
  hakari: [[{ who: 'hakari', text: 'Life\'s a gamble! The trick is to love the odds.' }], [{ who: 'hakari', text: 'Feel that? That\'s the fever. Something good\'s about to happen.' }]],
  higuruma: [[{ who: 'higuruma', text: 'The law exists to protect the weak. I\'d forgotten that, for a while.' }]],
  ishigori: [[{ who: 'ishigori', text: 'Got any rice? I\'m always hungry after a good fight. Which is every fight.' }]],
  choso: [[{ who: 'choso', text: 'I am the eldest. Whatever comes, I go first.' }]],
  tengen: [[{ who: 'tengen', text: 'Every barrier in Japan passes through me. Most days, it is very quiet.' }], [{ who: 'tengen', text: 'Satoru visited me once and ate all of my offerings. I have not forgotten.' }]],
  kamo: [[{ who: 'kamo', text: 'Blood Manipulation is a technique of discipline. ...I am told I am "a lot". I do not see it.' }]],
  monk: [[{ who: 'monk', text: 'The hills are wide. Walk them. There are old caches in places nobody goes anymore.' }], [{ who: 'monk', text: 'A curse is only a feeling that grew too big to stay inside a person. Even so, they do bite.' }]],
  farmer: [[{ who: 'farmer', text: 'Thank you for clearing the paddies. My back thanks you too.' }], [{ who: 'farmer', text: 'Up at the lake? No, no. Nobody fishes there anymore. Not since the scales started washing up.' }]],
};

export const SHOP_LINES: Record<string, string> = {
  shoko: 'Infirmary — potions and remedies',
  maki: 'Armory — weapons and gear',
  yaga: 'Workshop — cursed energy infusion',
  meimei: 'Mei Mei\'s Exchange — rare goods, rare prices',
  ijichi: 'Travel — where to?',
  nitta: 'Today\'s exorcisms',
  mechamaru: "Mechamaru's Reforge — +11 to +30",
};
