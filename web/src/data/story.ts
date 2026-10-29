// Quests and dialogue. All lines are original writing for this fan game.
import { BaseClassId, ClassId } from '../rpg/types';

export interface Line {
  who: string;            // npc id, 'player', 'narrator', 'sukuna'
  text: string;
  only?: BaseClassId[];   // shown only for these story voices (see ClassDef.persona)
  not?: BaseClassId[];    // hidden for these story voices
  emote?: string;         // animation for the speaker
  sfx?: string;
}

export interface Choice { text: string; reply: Line[]; flag?: string }

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
}

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
};

/** How the UI refers to people in tight spaces (map labels, quest log). */
export const NPC_SHORT: Record<string, string> = {
  gojo: 'Gojo', yaga: 'Yaga', shoko: 'Shoko', maki: 'Maki', panda: 'Panda', inumaki: 'Inumaki', ijichi: 'Ijichi', nanami: 'Nanami',
  junpei: 'Junpei', todo: 'Todo', miwa: 'Miwa', meimei: 'Mei Mei', sasaki: 'Sasaki', iguchi: 'Iguchi', yuji: 'Yuji', megumi: 'Megumi', nobara: 'Nobara',
  mechamaru: 'Mechamaru', yuta: 'Yuta', hakari: 'Hakari', higuruma: 'Higuruma', ishigori: 'Ishigori', choso: 'Choso',
  tengen: 'Tengen', kamo: 'Kamo', monk: 'Monk', farmer: 'Farmer',
};

export const QUESTS: QuestDef[] = [
  // ===================== Chapter 1: The Cursed Finger =====================
  {
    id: 'm1', name: 'Midnight at Sugisawa', type: 'main', chapter: 1, giver: 'gojo', autoAccept: true,
    summary: 'Exorcise the curses swarming the courtyard of Sugisawa Third High.',
    objectives: [{ type: 'kill', target: 'any', count: 8, map: 'sugisawa', label: 'Exorcise curses' }],
    offer: [
      { who: 'narrator', text: 'Earlier tonight. Sendai, a hospital room that smells of disinfectant.', only: ['yuji'] },
      { who: 'grandpa', text: 'Yuji... you\'re strong, so help people. Not just some of them — as many as you can reach.', only: ['yuji'] },
      { who: 'grandpa', text: 'And when you go, go surrounded by people. Don\'t end up alone like me...', only: ['yuji'] },
      { who: 'narrator', text: 'Your grandfather never finished the sentence. An hour later, you remembered the Occult Club seniors were opening a "real" cursed talisman at school. At midnight.', only: ['yuji'] },
      { who: 'narrator', text: 'Your assignment: recover a Special Grade cursed object that went missing in Sendai. The trail ends at a high school\'s Occult Research Club.', only: ['megumi'] },
      { who: 'narrator', text: 'Your first real mission, three days after arriving in Tokyo from the countryside. Nobody told you it would be in Sendai.', only: ['nobara'] },
      { who: 'narrator', text: 'Sugisawa Third High, Sendai. 11:58 PM. The air tastes like rust and something rotten.' },
      { who: 'gojo', text: 'Okay, first-years! Pop quiz. A Special Grade cursed object is sitting somewhere in that school. What does that do to the neighbourhood?', emote: 'wave' },
      { who: 'player', text: 'It acts like a beacon. Every curse for miles gets drawn in.', only: ['megumi'] },
      { who: 'player', text: 'Uh... makes it really, really haunted?', only: ['yuji'] },
      { who: 'player', text: 'Makes it a buffet. And we\'re the cleaning crew. Got it.', only: ['nobara'] },
      { who: 'gojo', text: 'Close enough! The object\'s seal is breaking, so they\'re already swarming. Clear the courtyard. I\'ll be right here... supervising.' },
      { who: 'gojo', text: 'Move with the stick on the left, hit with the big button on the right. Skills sit around it. You know, the usual.' },
    ],
    progress: [{ who: 'gojo', text: 'Still curses out there. I can feel them sulking. Keep going!' }],
    complete: [
      { who: 'gojo', text: 'Nice! Not bad for a Tuesday night. But the big one is still inside.' },
      { who: 'gojo', text: 'Your cursed energy is getting louder. Keep your Domain gauge in mind — it fills when you fight hard. You\'ll want it later.' },
    ],
    rewards: { exp: 120, gold: 150, items: [{ id: 'hpS', qty: 5 }, { id: 'ceS', qty: 3 }] },
  },
  {
    id: 'm1c', name: 'The Occult Research Club', type: 'main', chapter: 1, giver: 'gojo', turnIn: 'sasaki', prereq: ['m1'], autoAccept: true,
    summary: 'Two students broke the seal on the finger inside the school. Find them before the curses do.',
    objectives: [
      { type: 'reach', map: 'sugisawaIn', label: 'Enter the school building' },
      { type: 'kill', target: 'any', count: 6, map: 'sugisawaIn', label: 'Clear the corridors' },
    ],
    offer: [
      { who: 'gojo', text: 'Bad news! The seal on that object was peeled off from the inside. Two kids from the Occult Research Club snuck in tonight to "test" it.' },
      { who: 'player', text: 'Sasaki-senpai and Iguchi-senpai! I told them this afternoon that talisman was fake!', only: ['yuji'] },
      { who: 'player', text: 'Civilians inside. That\'s why every curse in the prefecture is converging on this building.', only: ['megumi'] },
      { who: 'player', text: 'Of course somebody opened the cursed box. There\'s always somebody.', only: ['nobara'] },
      { who: 'gojo', text: 'The doors are right behind me. Find them and keep them breathing. Fair warning — a barrier this thick warps the hallways. Don\'t trust your sense of direction.' },
    ],
    progress: [{ who: 'sasaki', text: 'There are still things crawling in the hallway... We can\'t carry Iguchi past them!' }],
    complete: [
      { who: 'sasaki', text: 'You came... I\'m so sorry. We only wanted to see if it was real. The paper just peeled off, and then everything went cold.' },
      { who: 'iguchi', text: 'Something huge reached through the window and grabbed the box. Ow— it took it toward the sports field.' },
      { who: 'sasaki', text: 'I heard it chewing. Box and all.' },
      { who: 'player', text: 'Stay here and keep the door shut. I\'ll get it back.', only: ['yuji'] },
      { who: 'player', text: 'Stay put. Someone will escort you out. The object is my job.', only: ['megumi'] },
      { who: 'player', text: 'Sit tight, senpai. I\'ll go punch it in the stomach until it gives it back.', only: ['nobara'] },
    ],
    rewards: { exp: 220, gold: 200, items: [{ id: 'hpS', qty: 3 }, { id: 'ceS', qty: 2 }] },
  },
  {
    id: 'm2', name: 'The Rooftop Hunger', type: 'main', chapter: 1, giver: 'sasaki', turnIn: 'gojo', prereq: ['m1c'], autoAccept: true,
    summary: 'Defeat the Grade 2 curse devouring the sports field and recover the cursed finger.',
    objectives: [{ type: 'boss', target: 'glutton', label: 'Defeat the Gluttonous Curse' }],
    offer: [
      { who: 'iguchi', text: 'The field is past the gym. Just... follow the noise.' },
      { who: 'sasaki', text: 'Please be careful. It was too big for the window. It went through the wall.' },
      { who: 'narrator', text: 'Your phone buzzes. Gojo: "Grade 2. If it gets ugly, back off and drink something. Shoko\'s salves taste awful but they work."' },
    ],
    progress: [{ who: 'gojo', text: 'The field is past the gym. Follow the screaming.' }],
    complete: [
      { who: 'narrator', text: 'A shrivelled, blackened finger lies in the dirt. Even sealed, it hums with a malice that makes your teeth ache.' },
      { who: 'narrator', text: 'In the trees, more curses are already twitching toward it. There is no time to seal it properly.', only: ['yuji'] },
      { who: 'player', text: 'If it\'s the cursed energy they want... then nobody gets it.', only: ['yuji'] },
      { who: 'narrator', text: 'You swallow the finger whole.', only: ['yuji'] },
      { who: 'sukuna', text: 'Hah... HAHAHA! Flesh at last! Now, where to begin— ...What? Why won\'t this body move?', only: ['yuji'] },
      { who: 'player', text: 'Huh. Tasted like nothing. Also there\'s a mouth on my cheek now. Is that normal?', only: ['yuji'] },
      { who: 'gojo', text: 'You ATE it? ...And you\'re still you. Wow. Okay. The higher-ups are going to want you executed, so let\'s go make that complicated for them.', only: ['yuji'] },
      { who: 'gojo', text: 'One of Sukuna\'s twenty fingers. Seal it, keep it close, don\'t lick it. Long story.', not: ['yuji'] },
      { who: 'gojo', text: 'Okay! Field trip\'s over. Ijichi\'s car is at the gate. Let\'s go to school — the real one.' },
    ],
    rewards: { exp: 380, gold: 400, fingers: 1, items: [{ id: 'fragment', qty: 4 }], classItems: { yuji: 'ironKnuckle', megumi: 'wakizashi', nobara: 'ironMallet' } },
    unlock: ['hub'],
  },
  {
    id: 'm3', name: 'Welcome to Jujutsu High', type: 'main', chapter: 1, giver: 'gojo', turnIn: 'yaga', prereq: ['m2'], autoAccept: true,
    summary: 'Travel to Tokyo Jujutsu High and report to Principal Yaga.',
    objectives: [{ type: 'talk', npc: 'yaga', label: 'Report to Principal Yaga' }],
    offer: [{ who: 'gojo', text: 'Hop in Ijichi\'s car by the gate. The principal wants to meet you. Try not to make his dolls cry.' }],
    progress: [{ who: 'ijichi', text: 'P-Principal Yaga is waiting in front of the main hall.' }],
    complete: [
      { who: 'yaga', text: 'So you are the one Satoru keeps talking about. Answer me plainly. Why do you want to be a jujutsu sorcerer?', emote: 'bow' },
      { who: 'player', text: 'My grandpa told me to help people. I want to die surrounded by people — not alone, not regretting.', only: ['yuji'] },
      { who: 'player', text: 'I don\'t save everyone. I save the people I choose to. That\'s enough reason for me.', only: ['megumi'] },
      { who: 'player', text: 'Because I\'m me, and I refuse to rot in some backwater pretending I\'m someone else.', only: ['nobara'] },
      { who: 'yaga', text: '...Hm. An honest answer. Very well. Welcome to Tokyo Jujutsu High.' },
      { who: 'yaga', text: 'Each time you grow stronger you gain stat points and skill points. Spend them in your menu. Shoko\'s infirmary, Maki\'s armory and my workshop are open to you.' },
    ],
    rewards: { exp: 200, gold: 300, items: [{ id: 'warp', qty: 3 }] },
  },
  {
    id: 's_training', name: 'Training Day', type: 'side', chapter: 1, giver: 'gojo', prereq: ['m3'], level: 2,
    summary: 'Destroy three of Principal Yaga\'s cursed training corpses on the training ground.',
    objectives: [{ type: 'kill', target: ['dummy'], count: 3, label: 'Break training corpses' }],
    offer: [
      { who: 'gojo', text: 'The principal made new training dolls. He\'s really proud of them. Go break them!' },
      { who: 'gojo', text: 'They\'re on the sand training ground. Use your skills — I want to see some style.' },
    ],
    progress: [{ who: 'gojo', text: 'They\'re squishy. You can do it.' }],
    complete: [{ who: 'gojo', text: 'Perfect! I\'ll tell him they "fought bravely."' }],
    rewards: { exp: 150, gold: 200, items: [{ id: 'hpS', qty: 5 }, { id: 'fragment', qty: 3 }] },
  },
  {
    id: 's_panda', name: 'Panda-monium', type: 'side', chapter: 1, giver: 'panda', prereq: ['m3'], level: 2,
    summary: 'Collect 5 Cursed Cotton from curses at Sugisawa High.',
    objectives: [{ type: 'collect', item: 'cotton', count: 5, label: 'Cursed Cotton' }],
    offer: [
      { who: 'panda', text: 'Yo! New kid! I\'m Panda. Yes, really. No, I won\'t explain.' },
      { who: 'panda', text: 'The curses at Sugisawa shed this cursed cotton stuff. I need five tufts. For... personal reasons. Plush maintenance. Don\'t ask.' },
    ],
    progress: [{ who: 'panda', text: 'Five tufts! My stuffing depends on you.' }],
    complete: [{ who: 'panda', text: 'Ooh, fluffy. You\'re officially Panda-approved. Take this, it\'s a good jacket.' }],
    rewards: { exp: 260, gold: 250, items: [{ id: 'reinUniform', rarity: 1 }] },
  },
  {
    id: 's_yaga', name: 'Cursed Corpse Calibration', type: 'side', chapter: 1, giver: 'yaga', prereq: ['m3'], level: 3,
    summary: 'Infuse any piece of equipment with cursed energy at Yaga\'s workshop.',
    objectives: [{ type: 'enhance', count: 1, label: 'Infuse equipment once' }],
    offer: [
      { who: 'yaga', text: 'Cursed fragments left behind by exorcised curses can be woven into your gear. I will show you.' },
      { who: 'yaga', text: 'Bring fragments and yen to my workshop and infuse an item. Higher infusions may fail — such is the nature of cursed energy.' },
    ],
    complete: [{ who: 'yaga', text: 'Good. Your tools are an extension of you. Keep them sharp.' }],
    rewards: { exp: 180, gold: 300, items: [{ id: 'fragment', qty: 6 }] },
  },

  // ===================== Chapter 2: Womb of Despair =====================
  {
    id: 'm4', name: 'Rescue at Eishu', type: 'main', chapter: 2, giver: 'ijichi', prereq: ['m3'], level: 5,
    summary: 'A cursed womb has hatched inside Eishu Juvenile Detention Center. Clear the yard.',
    objectives: [{ type: 'kill', target: 'any', count: 12, map: 'eishu', label: 'Clear the detention yard' }],
    offer: [
      { who: 'ijichi', text: 'E-emergency mission! A cursed womb has formed inside Eishu Juvenile Detention Center. Five inmates are still inside.' },
      { who: 'ijichi', text: 'The womb has likely hatched into a Special Grade. M-Mr. Gojo is overseas, so... it\'s you three. I\'m so sorry.' },
      { who: 'player', text: 'Stop apologising and start the car.', only: ['nobara'] },
      { who: 'player', text: 'Let\'s go. People are still in there.', only: ['yuji', 'megumi'] },
    ],
    progress: [{ who: 'ijichi', text: 'Please be careful. The veil is up — nobody will see you from outside.' }],
    complete: [
      { who: 'ijichi', text: 'The yard is clear... but the pressure from the inner block is getting worse.' },
    ],
    rewards: { exp: 900, gold: 700, items: [{ id: 'hpM', qty: 3 }, { id: 'fragment', qty: 5 }] },
    unlock: ['eishu'],
  },
  {
    id: 'm5', name: 'Finger Bearer', type: 'main', chapter: 2, giver: 'ijichi', prereq: ['m4'], autoAccept: true,
    summary: 'Defeat the Special Grade curse born from the womb inside the inner block.',
    objectives: [{ type: 'boss', target: 'fingerBearer', label: 'Defeat the Finger Bearer' }],
    offer: [{ who: 'ijichi', text: 'Inside that block is a Special Grade. If you can\'t win, run. Please. Running is allowed.' }],
    progress: [{ who: 'ijichi', text: 'The inner block is through the gate past the guard tower.' }],
    complete: [
      { who: 'narrator', text: 'The curse collapses into ash. A second finger rolls from its chest, still twitching.' },
      { who: 'sukuna', text: 'You survived that? You\'re less boring than you look, brat. Now — lend me that body.', only: ['yuji'] },
      { who: 'narrator', text: 'The world tilts. Sukuna steps forward in your skin, and to make sure you can never take it back, he crushes your heart.', only: ['yuji'] },
      { who: 'narrator', text: 'Darkness. A shrine built from bones. The King of Curses lounges on a mountain of skulls and offers a binding vow: your life, in exchange for one minute of his choosing — and you forgetting the deal.', only: ['yuji'] },
      { who: 'narrator', text: 'You wake up on a cold table in the school basement. Shoko drops her scalpel. Gojo starts laughing.', only: ['yuji'] },
      { who: 'narrator', text: '"Welcome back," Gojo says. "Officially, you\'re dead. Let\'s keep it that way until the Goodwill Event."', only: ['yuji'] },
      { who: 'ijichi', text: 'Y-you actually won... I need to sit down. Mr. Gojo will be back at the school by now.' },
    ],
    rewards: { exp: 1800, gold: 1500, fingers: 1, items: [{ id: 'core', qty: 1 }, { id: 'fragment', qty: 8 }], classItems: { yuji: 'cursedKnuckle', megumi: 'shadowBlade', nobara: 'cursedHammer' } },
  },
  {
    id: 's_shoko', name: 'Research Samples', type: 'side', chapter: 2, giver: 'shoko', prereq: ['m3'], level: 6,
    summary: 'Collect 6 Curse Residue from curses at Eishu Detention Center.',
    objectives: [{ type: 'collect', item: 'residue', count: 6, label: 'Curse Residue' }],
    offer: [
      { who: 'shoko', text: 'You\'re the new one. I\'m Shoko. I fix people. Mostly.' },
      { who: 'shoko', text: 'The curses at Eishu leave residue when they die. Bring me six samples and I\'ll make it worth your while.' },
    ],
    progress: [{ who: 'shoko', text: 'Six samples. Try not to bleed on them.' }],
    complete: [{ who: 'shoko', text: 'Perfect. Here — my good tonics. Don\'t tell the principal I gave you the strong stuff.' }],
    rewards: { exp: 700, gold: 500, items: [{ id: 'hpM', qty: 5 }, { id: 'ceM', qty: 3 }] },
  },
  {
    id: 's_maki', name: 'Field Test', type: 'side', chapter: 2, giver: 'maki', prereq: ['m4'], level: 8,
    summary: 'Exorcise 15 curses at Eishu Detention Center.',
    objectives: [{ type: 'kill', target: 'any', count: 15, map: 'eishu', label: 'Exorcise curses at Eishu' }],
    offer: [
      { who: 'maki', text: 'You lean on cursed energy too much. Real sorcerers can fight with anything.' },
      { who: 'maki', text: 'Go take out fifteen curses at Eishu. Come back alive and I\'ll give you something from my personal stock.' },
    ],
    progress: [{ who: 'maki', text: 'Fifteen. Not fourteen.' }],
    complete: [{ who: 'maki', text: 'Not bad. Here. Treat it better than Panda treats his stuff.' }],
    rewards: { exp: 900, gold: 600, classItems: { yuji: 'cursedKnuckle', megumi: 'shadowBlade', nobara: 'cursedHammer' }, items: [{ id: 'fragment', qty: 4 }] },
  },

  {
    id: 's_okazaki', name: 'A Name Tag for His Mother', type: 'side', chapter: 2, giver: 'ijichi', prereq: ['m4'], level: 7,
    summary: 'Search the Eishu admin block for any trace of the inmate Tadashi Okazaki.',
    objectives: [{ type: 'collect', item: 'nameTag', count: 1, label: 'Find Okazaki\'s name tag in the admin block' }],
    offer: [
      { who: 'ijichi', text: 'There\'s a woman at the outer gate. Her son, Tadashi Okazaki, was one of the five inmates. She keeps asking whether he\'s all right.' },
      { who: 'ijichi', text: 'The admin block door is on the west side of the yard. If you find anything of his... anything at all...' },
      { who: 'player', text: 'Got it. I\'ll bring something back. I promise.', only: ['yuji'] },
      { who: 'player', text: 'Understood.', only: ['megumi'] },
      { who: 'player', text: 'Yeah. Leave it to me.', only: ['nobara'] },
    ],
    progress: [{ who: 'ijichi', text: 'The admin block is to the west. The womb\'s energy keeps rearranging the corridors — please don\'t get lost.' }],
    complete: [
      { who: 'ijichi', text: 'This is his... Thank you. I will give it to his mother personally.' },
      { who: 'player', text: 'He didn\'t do anything to deserve that.', only: ['yuji'] },
      { who: 'player', text: 'We can\'t save everyone. I know that. It doesn\'t make it easier.', only: ['megumi'] },
      { who: 'player', text: 'Tell her he wasn\'t alone at the end. Even if you have to lie.', only: ['nobara'] },
      { who: 'ijichi', text: 'Sorcerers carry this kind of weight every day. Please... don\'t carry it alone.' },
    ],
    rewards: { exp: 800, gold: 600, items: [{ id: 'wardCharm', rarity: 1 }, { id: 'hpM', qty: 2 }] },
  },

  // ===================== Chapter 3: Idle Transfiguration =====================
  {
    id: 'm6', name: 'Overtime in Kawasaki', type: 'main', chapter: 3, giver: 'gojo', prereq: ['m5'], level: 11,
    summary: 'Meet Kento Nanami in Kawasaki and gather evidence from the transfigured victims.',
    objectives: [
      { type: 'talk', npc: 'nanami', label: 'Meet Nanami in Kawasaki' },
      { type: 'reach', map: 'theaterIn', label: 'Investigate the cinema' },
      { type: 'collect', item: 'filmTicket', count: 5, label: 'Cinema Ticket Stubs' },
    ],
    offer: [
      { who: 'gojo', text: 'You came back from Eishu in one piece? See, I told everyone you\'d be fine. I told them... eventually.' },
      { who: 'gojo', text: 'Next lesson: the grown-up world of jujutsu. I\'m lending you to Nanami. He\'s in Kawasaki investigating a weird string of deaths at a cinema.' },
      { who: 'gojo', text: 'Since you\'re officially dead, nobody will come looking for you. Perfect field trip!', only: ['yuji'] },
      { who: 'gojo', text: 'He\'s a total bore, but he\'s a Grade 1 and he\'ll keep you alive. Ijichi can drive you.' },
    ],
    progress: [{ who: 'nanami', text: 'The cinema is right behind me. Start with Screen 3. Then gather what the victims dropped — ticket stubs, specifically.' }],
    complete: [
      { who: 'nanami', text: 'Every stub is from the same screening. Whoever did this was in that theater — and they\'re not human.' },
      { who: 'nanami', text: 'Also. Someone was there who survived. A boy. Junpei Yoshino. He\'s by the river. Talk to him — gently.' },
    ],
    rewards: { exp: 2400, gold: 1600, items: [{ id: 'hpM', qty: 4 }, { id: 'fragment', qty: 6 }] },
    unlock: ['kawasaki'],
  },
  {
    id: 'm7', name: 'The Boy by the River', type: 'main', chapter: 3, giver: 'nanami', turnIn: 'junpei', prereq: ['m6'], autoAccept: true,
    summary: 'Find Junpei Yoshino by the river in Kawasaki.',
    objectives: [{ type: 'talk', npc: 'junpei', label: 'Talk to Junpei' }],
    offer: [{ who: 'nanami', text: 'He\'s near the canal. Go. I have reports to file. It is 5:58 PM, and I intend to leave at 6.' }],
    complete: [
      { who: 'junpei', text: '...You\'re one of them, aren\'t you. The people who see the monsters.' },
      { who: 'player', text: 'Yeah. You see them too, huh? That\'s rough. Wanna watch a movie sometime? I like the bad ones.', only: ['yuji'] },
      { who: 'player', text: 'I\'m not here to arrest you. I\'m here because something is using you.', only: ['megumi'] },
      { who: 'player', text: 'You look like you haven\'t slept in a week. Talk. I\'m a good listener when I want to be.', only: ['nobara'] },
      { who: 'junpei', text: 'There\'s someone... a "friend". He has stitches all over his face. He said people\'s souls are just clay.' },
      { who: 'junpei', text: 'He lives down in the sewers under the city. He said he wanted to meet a sorcerer like you.' },
    ],
    rewards: { exp: 1200, gold: 800 },
  },
  {
    id: 'm8', name: 'Idle Transfiguration', type: 'main', chapter: 3, giver: 'junpei', turnIn: 'nanami', prereq: ['m7'], autoAccept: true,
    summary: 'Descend into the Kawasaki sewers and defeat the curse Mahito.',
    objectives: [{ type: 'boss', target: 'mahito', label: 'Defeat Mahito' }],
    offer: [{ who: 'junpei', text: 'The sewer entrance is at the south end of the canal. Please... be careful. He\'s smiling all the time.' }],
    progress: [{ who: 'nanami', text: 'The sewers. Don\'t let him touch you with his bare hands. That is not a suggestion.' }],
    complete: [
      { who: 'narrator', text: 'Mahito\'s body dissolves into the dark water, laughing all the way down. Something is left floating behind: a finger.' },
      { who: 'nanami', text: 'He fled. Curses like that don\'t die easily. Still — you did well. That counts as overtime. I hate overtime.' },
      { who: 'nanami', text: 'Go home. Rest. And then report to Gojo. Kyoto is coming.' },
    ],
    rewards: { exp: 4200, gold: 3000, fingers: 1, items: [{ id: 'core', qty: 2 }, { id: 'fragment', qty: 10 }], classItems: { yuji: 'grade1Fist', megumi: 'cursedKatana', nobara: 'dollHammer' } },
    unlock: ['sewer'],
  },
  {
    id: 's_nanami', name: 'Overtime Is Not Allowed', type: 'side', chapter: 3, giver: 'nanami', prereq: ['m6'], level: 13,
    summary: 'Exorcise 20 curses in Kawasaki before Nanami\'s shift ends.',
    objectives: [{ type: 'kill', target: ['transfigured', 'bloated', 'leech'], count: 20, label: 'Exorcise Kawasaki curses' }],
    offer: [{ who: 'nanami', text: 'There are too many of these things. Thin their numbers. Twenty should do. Efficiently, please.' }],
    progress: [{ who: 'nanami', text: 'The ratio of work to pay here is disgraceful. Continue.' }],
    complete: [{ who: 'nanami', text: 'Efficient. I respect that. Take this — consider it hazard pay.' }],
    rewards: { exp: 2600, gold: 2500, items: [{ id: 'wardCharm', rarity: 2 }] },
  },
  {
    id: 's_meimei', name: 'Pay to Play', type: 'side', chapter: 3, giver: 'meimei', prereq: ['m6'], level: 14,
    summary: 'Pay Mei Mei 3,000 yen for "valuable information".',
    objectives: [{ type: 'pay', gold: 3000, label: 'Pay 3,000 yen' }],
    offer: [
      { who: 'meimei', text: 'Oh? A first-year with yen in their pocket. How lovely. Everything has a price, you know.' },
      { who: 'meimei', text: 'Three thousand yen and I\'ll give you something that will save your life. Probably. Talk to me again when you\'re ready to pay.' },
    ],
    complete: [{ who: 'meimei', text: 'Pleasure doing business. My crows found this in a Grade 1 nest. Try not to die before you\'re a repeat customer.' }],
    rewards: { exp: 1200, gold: 0, items: [{ id: 'core', qty: 3 }, { id: 'cursedBead', rarity: 2 }] },
  },

  {
    id: 's_movies', name: 'Movie Night', type: 'side', chapter: 3, giver: 'gojo', prereq: ['m5'], level: 9,
    summary: 'Principal Yaga\'s cursed dolls are waiting in the first-year dorm. Keep your cursed energy steady and break three of them.',
    objectives: [
      { type: 'reach', map: 'dormIn', label: 'Go to the first-year dorm' },
      { type: 'kill', target: ['tsukamoto'], count: 3, map: 'dormIn', label: 'Break the cursed dolls' },
    ],
    offer: [
      { who: 'gojo', text: 'So! You\'re dead. Officially. Which means secret training! Movies, snacks, and one of the principal\'s cursed dolls in your lap.', only: ['yuji'] },
      { who: 'gojo', text: 'Keep your cursed energy flowing steadily the whole time. If it flickers, the doll punches you. Very educational.', only: ['yuji'] },
      { who: 'gojo', text: 'Yuji trained like this while everyone thought he was dead: bad movies, and a cursed doll that punches you whenever your energy flickers. Your turn!', not: ['yuji'] },
      { who: 'gojo', text: 'The dorm is the wooden building on the west side. The principal left a few dolls in a room in there. Break them — gently. He\'s sensitive.' },
    ],
    progress: [{ who: 'gojo', text: 'Steady energy! Like a calm river. A calm river that punches dolls.' }],
    complete: [{ who: 'gojo', text: 'Look at that, barely any bruises! The principal will be thrilled. Or devastated. It\'s hard to tell with those sunglasses.' }],
    rewards: { exp: 900, gold: 500, items: [{ id: 'ceM', qty: 4 }, { id: 'fragment', qty: 4 }] },
  },

  // ===================== Chapter 4: Goodwill =====================
  {
    id: 'm9', name: 'My Best Friend', type: 'main', chapter: 4, giver: 'gojo', turnIn: 'todo', prereq: ['m8'], level: 18,
    summary: 'The Kyoto Goodwill Event begins. Aoi Todo is waiting for you in the forest.',
    objectives: [
      { type: 'reach', map: 'kyoto', label: 'Enter the Kyoto forest' },
      { type: 'boss', target: 'todo', label: 'Defeat Aoi Todo' },
    ],
    offer: [
      { who: 'gojo', text: 'Goodwill Event time! Tokyo versus Kyoto. A friendly competition where everyone tries very hard to break each other\'s bones.' },
      { who: 'gojo', text: 'Watch out for a huge guy named Todo. He\'ll ask you a question. There is no right answer. Well. There is, but you won\'t like it.' },
    ],
    choices: [
      { text: '"Someone tall, with a big... personality."', flag: 'todo_happy', reply: [{ who: 'todo', text: 'TALL. With HIPS! I knew it the moment I saw you! We are BEST FRIENDS! Now — let us fight as brothers!', emote: 'clap' }] },
      { text: '"I don\'t really have a type."', reply: [{ who: 'todo', text: 'Boring. A boring answer from a boring sorcerer. I\'ll beat some passion into you!', emote: 'punch1' }] },
    ],
    progress: [{ who: 'todo', text: 'Show me your soul, brother!' }],
    complete: [
      { who: 'todo', text: 'Ha... ha! Magnificent! Your fists speak louder than your words!' },
      { who: 'todo', text: 'My Boogie Woogie is yours to remember, brother. But something is wrong — those flowers... that curse is not one of Gojo\'s.' },
    ],
    rewards: { exp: 5500, gold: 3500, items: [{ id: 'core', qty: 2 }, { id: 'hpL', qty: 2 }] },
    unlock: ['kyoto'],
  },
  {
    id: 'm10', name: 'Uninvited Bloom', type: 'main', chapter: 4, giver: 'todo', prereq: ['m9'], autoAccept: true,
    summary: 'A Special Grade curse has slipped into the event. Thin out its spawn, then defeat Hanami.',
    objectives: [
      { type: 'kill', target: ['rootCurse', 'bud', 'forestHound'], count: 10, map: 'kyoto', label: 'Destroy cursed plants' },
      { type: 'boss', target: 'hanami', label: 'Defeat Hanami' },
    ],
    offer: [{ who: 'todo', text: 'The veil has turned dark. The intruder hides in the deep grove. Burn through its spawn and the grove will open.' }],
    progress: [{ who: 'todo', text: 'Deeper, brother! The deepest clearing!' }],
    complete: [
      { who: 'narrator', text: 'Hanami sinks into the earth, wood splitting, blossoms falling like ash. A finger is left wrapped in its roots.' },
      { who: 'todo', text: 'It escaped into the ground... but we live. Return to Tokyo. I sense dark clouds gathering — darker than any I have known.' },
    ],
    rewards: { exp: 9000, gold: 6000, fingers: 1, items: [{ id: 'core', qty: 3 }, { id: 'fragment', qty: 14 }], classItems: { yuji: 'sgFist', megumi: 'spiritEdge', nobara: 'resMallet' } },
  },
  {
    id: 's_inumaki', name: 'Salmon!', type: 'side', chapter: 4, giver: 'inumaki', prereq: ['m8'], level: 18,
    summary: 'Gather 6 Kelp Leaves from cursed plants in the Kyoto forest for Inumaki.',
    objectives: [{ type: 'collect', item: 'kelp', count: 6, label: 'Kelp Leaves' }],
    offer: [
      { who: 'inumaki', text: 'Shake. Shake.' },
      { who: 'panda', text: 'Translation: he wants kelp from the Kyoto forest plants. Six leaves. He\'s making onigiri for everyone.' },
      { who: 'inumaki', text: 'Konbu!' },
    ],
    progress: [{ who: 'inumaki', text: 'Konbu?' }],
    complete: [{ who: 'inumaki', text: 'Tuna mayo! Tuna mayo!', emote: 'wave' }, { who: 'panda', text: 'He says thank you. Also these are delicious.' }],
    rewards: { exp: 4000, gold: 2000, items: [{ id: 'onigiri', qty: 8 }, { id: 'shadowSteps', rarity: 1 }] },
  },
  {
    id: 's_miwa', name: 'The Lost Katana', type: 'side', chapter: 4, giver: 'miwa', prereq: ['m9'], level: 20,
    summary: 'Find Kasumi Miwa\'s katana somewhere in the Kyoto forest.',
    objectives: [{ type: 'collect', item: 'miwaSword', count: 1, label: 'Miwa\'s Katana' }],
    offer: [
      { who: 'miwa', text: 'Ah! Um! I\'m Kasumi Miwa! I-I\'m not your enemy right now! I just... lost my sword. Again.' },
      { who: 'miwa', text: 'I think it fell near the old shrine to the east. If you find it, I\'ll... I\'ll owe you! I\'m broke, but I\'ll owe you!' },
    ],
    progress: [{ who: 'miwa', text: 'East, near the old shrine. I think.' }],
    complete: [{ who: 'miwa', text: 'My sword! Thank you thank you! Please take this, I found it in the forest. Don\'t tell Mechamaru.' }],
    rewards: { exp: 4500, gold: 1500, items: [{ id: 'g1Uniform', rarity: 1 }] },
  },

  // ===================== Chapter 4.5: Death Painting =====================
  {
    id: 'm10y', name: 'Yasohachi Bridge', type: 'main', chapter: 4, giver: 'gojo', turnIn: 'ijichi', prereq: ['m10'], level: 21,
    summary: 'Students in Saitama are dying after crossing a bridge at night. Cross Yasohachi Bridge and clear the curses on its banks.',
    objectives: [
      { type: 'reach', map: 'yasohachi', label: 'Go to Yasohachi Bridge' },
      { type: 'kill', target: ['riverCurse', 'bloodFetus', 'riverLeech'], count: 10, map: 'yasohachi', label: 'Clear the riverbanks' },
    ],
    offer: [
      { who: 'gojo', text: 'Field trip! Saitama this time. Three middle schoolers died after walking home across the same bridge at night. Yasohachi Bridge.' },
      { who: 'gojo', text: 'Each of them had a cursed mark on their skin before they died. The curse only goes after people who have crossed it. So... you\'re going to cross it!' },
      { who: 'player', text: 'A curse that kills kids for walking home. Okay. Let\'s go.', only: ['yuji'] },
      { who: 'player', text: 'A bridge in the middle of nowhere. Very glamorous. Fine.', only: ['nobara'] },
      { who: 'player', text: 'If it marks everyone who crosses, the residents are next. We should move tonight.', only: ['megumi'] },
      { who: 'gojo', text: 'Ijichi\'s driving. Clear the banks, then check in with him. And don\'t look at the water too long.' },
    ],
    progress: [{ who: 'ijichi', text: 'The curses gather on both banks after dark. P-please don\'t fall in the river.' }],
    complete: [
      { who: 'ijichi', text: 'The banks are quiet... but this residue doesn\'t belong to the bridge curse. Something else came here tonight. Something made of blood.' },
      { who: 'narrator', text: 'Down by the river, two figures are digging through the reeds. One is small and crouched, its face crowded with eyes. The other is tall, with a split, two-toned face.' },
      { who: 'ijichi', text: 'Those aren\'t curses. They\'re cursed wombs that took on flesh. Death Paintings. They must be here for something.' },
    ],
    rewards: { exp: 9000, gold: 5000, items: [{ id: 'hpL', qty: 3 }, { id: 'fragment', qty: 8 }] },
    unlock: ['yasohachi'],
  },
  {
    id: 'm10k', name: 'Kechizu', type: 'main', chapter: 4, giver: 'ijichi', prereq: ['m10y'], autoAccept: true,
    summary: 'The smaller Death Painting is on the west bank. Defeat Kechizu without letting his blood touch you.',
    objectives: [{ type: 'boss', target: 'kechizu', label: 'Defeat Kechizu' }],
    offer: [{ who: 'ijichi', text: 'The small one is on the south-west bank. Its blood is corrosive. If it gets on you, it will keep burning. Please be careful!' }],
    progress: [{ who: 'ijichi', text: 'The west bank, by the reeds. Don\'t let it spit on you.' }],
    complete: [
      { who: 'narrator', text: 'Kechizu collapses into the reeds, screaming for his brother until he can\'t.' },
      { who: 'narrator', text: 'Across the river, someone screams back. It is not a scream of fear.' },
      { who: 'ijichi', text: 'The other one... it\'s waiting for you on the north bank. By the graves.' },
    ],
    rewards: { exp: 8000, gold: 4500, items: [{ id: 'core', qty: 2 }] },
  },
  {
    id: 'm10e', name: 'Death Painting', type: 'main', chapter: 4, giver: 'ijichi', prereq: ['m10k'], autoAccept: true,
    summary: 'Eso, the elder of the two Death Paintings, wants revenge for his brother. Defeat him among the graves on the north bank.',
    objectives: [{ type: 'boss', target: 'eso', label: 'Defeat Eso' }],
    offer: [{ who: 'ijichi', text: 'Eso. The elder brother. He\'s not hiding. He wants you to come to him.' }],
    progress: [{ who: 'ijichi', text: 'The graveyard, across the bridge on the north bank.' }],
    complete: [
      { who: 'narrator', text: 'Eso falls to his knees. With the last of his strength, he looks back across the river toward his brother.' },
      { who: 'eso', text: 'Kechizu... I\'m sorry. Our big brother... Choso... will...' },
      { who: 'narrator', text: 'The Death Paintings dissolve into the black water. Among the reeds lies what they came for: a finger.' },
      { who: 'player', text: 'They cried for each other. They were curses... and they still cried.', only: ['yuji'] },
      { who: 'player', text: 'Nine Death Paintings were stolen from the school years ago. Two are gone now. And there\'s an older brother.', only: ['megumi'] },
      { who: 'player', text: 'I\'m not feeling sorry for them. ...Okay, a little. Don\'t tell anyone.', only: ['nobara'] },
      { who: 'ijichi', text: 'A finger... and a name. Principal Yaga needs to hear about this. Whoever Choso is, he will come looking for whoever did this.' },
    ],
    rewards: { exp: 12000, gold: 7000, fingers: 1, items: [{ id: 'core', qty: 3 }, { id: 'fragment', qty: 12 }] },
  },
  {
    id: 's_marks', name: 'The Cursed Marks', type: 'side', chapter: 4, giver: 'ijichi', prereq: ['m10y'], level: 21,
    summary: 'Collect 6 Cursed Mark Residue from the curses at Yasohachi Bridge so Shoko can lift the marks from the survivors.',
    objectives: [{ type: 'collect', item: 'cursedMark', count: 6, label: 'Cursed Mark Residue' }],
    offer: [
      { who: 'ijichi', text: 'Two more students in the town crossed the bridge last week. They have the mark. Ieiri-san thinks she can lift it — if she can study the curse.' },
      { who: 'ijichi', text: 'The curses on the banks carry the same residue. Six samples would be enough.' },
    ],
    progress: [{ who: 'ijichi', text: 'Six samples. The river curses and the womb spawn both carry it.' }],
    complete: [{ who: 'ijichi', text: 'This should be enough. I\'ll take them to Ieiri-san tonight. Those two kids are going to be okay. Thank you.' }],
    rewards: { exp: 6000, gold: 4000, items: [{ id: 'vowCharm', rarity: 1 }, { id: 'hpL', qty: 2 }] },
  },

  // ===================== Chapter 5: Shibuya Incident =====================
  {
    id: 'm11', name: 'October 31st', type: 'main', chapter: 5, giver: 'yaga', prereq: ['m10e'], level: 25,
    summary: 'A veil has fallen over Shibuya. Break its anchors and fight through the curses.',
    objectives: [
      { type: 'reach', map: 'shibuya', label: 'Enter Shibuya' },
      { type: 'kill', target: ['veilAnchor'], count: 3, label: 'Destroy veil anchors' },
      { type: 'kill', target: 'any', count: 20, map: 'shibuya', label: 'Exorcise curses' },
    ],
    offer: [
      { who: 'yaga', text: 'Listen carefully. At 8:14 tonight, a veil fell over Shibuya Station. Civilians are trapped inside.' },
      { who: 'yaga', text: '...And Satoru has been sealed. The curses planned this.' },
      { who: 'player', text: 'Gojo-sensei? Sealed? That\'s... that\'s not possible.', only: ['yuji'] },
      { who: 'player', text: 'Then we get him back. Where do we start?', only: ['megumi'] },
      { who: 'player', text: 'Then what are we standing around for?!', only: ['nobara'] },
      { who: 'yaga', text: 'Ijichi will take you to the edge of the veil. Destroy the anchors and clear the streets. Every sorcerer in Tokyo is moving.' },
    ],
    progress: [{ who: 'ijichi', text: 'The anchors are marked with purple talismans. Please, please hurry.' }],
    complete: [
      { who: 'ijichi', text: 'The outer veil is breaking! But the station... something is flooding the platforms with water. And fish?' },
    ],
    rewards: { exp: 12000, gold: 8000, items: [{ id: 'hpL', qty: 4 }, { id: 'ceL', qty: 3 }] },
    unlock: ['shibuya'],
  },
  {
    id: 'm11p', name: 'Prison Realm', type: 'main', chapter: 5, giver: 'ijichi', prereq: ['m11'], autoAccept: true,
    summary: 'Gojo was sealed five floors beneath Shibuya Station. Fight down to B5F and break through whoever guards the platform.',
    objectives: [
      { type: 'reach', map: 'stationIn', label: 'Descend to B5F' },
      { type: 'boss', target: 'choso', label: 'Defeat Choso' },
    ],
    offer: [
      { who: 'ijichi', text: 'Mei Mei\'s crows confirmed it. Mr. Gojo was sealed on the Fukutoshin Line platform — B5F.' },
      { who: 'ijichi', text: 'Something called the Prison Realm. A cursed object that can hold anyone... even him.' },
      { who: 'player', text: 'Then we go down there and get him out.', only: ['yuji'] },
      { who: 'player', text: 'They\'ll have someone guarding it. Let\'s move.', only: ['megumi'] },
      { who: 'player', text: 'Five floors of curses. Wonderful. My favourite.', only: ['nobara'] },
      { who: 'ijichi', text: 'The entrance is at the north end of the plaza. The barrier keeps reshaping the concourse — please don\'t trust any signs.' },
    ],
    progress: [{ who: 'ijichi', text: 'B5F. Please hurry.' }],
    complete: [
      { who: 'ijichi', text: 'A man with Suguru Geto\'s face...? That\'s impossible. Mr. Gojo killed Geto himself, last December.' },
      { who: 'ijichi', text: 'Whoever he is, he has the Prison Realm. And the station plaza — the water is rising. Something is flooding it with fish.' },
    ],
    rewards: { exp: 14000, gold: 8000, items: [{ id: 'core', qty: 3 }, { id: 'hpL', qty: 3 }] },
  },
  {
    id: 'm12', name: 'The Drowning Platform', type: 'main', chapter: 5, giver: 'ijichi', prereq: ['m11p'], autoAccept: true,
    summary: 'Defeat Dagon at the station plaza.',
    objectives: [{ type: 'boss', target: 'dagon', label: 'Defeat Dagon' }],
    offer: [{ who: 'ijichi', text: 'The station plaza to the north. A curse that commands the sea. Don\'t let the fish surround you!' }],
    complete: [
      { who: 'narrator', text: 'Dagon\'s body unravels into seawater that drains away into the streets. Another finger sinks to the tiles.' },
      { who: 'ijichi', text: 'The heat... there\'s fire spreading near the scramble crossing. That one is a volcano. A walking volcano.' },
    ],
    rewards: { exp: 15000, gold: 9000, fingers: 1, items: [{ id: 'core', qty: 3 }] },
  },
  {
    id: 'm13', name: 'Disaster Flames', type: 'main', chapter: 5, giver: 'ijichi', prereq: ['m12'], autoAccept: true,
    summary: 'Defeat Jogo at the scramble crossing.',
    objectives: [{ type: 'boss', target: 'jogo', label: 'Defeat Jogo' }],
    offer: [{ who: 'ijichi', text: 'The crossing. Stay out of the craters — the ground there is molten.' }],
    complete: [
      { who: 'jogo', text: 'Impossible... We were supposed to be the real humans... the ones who...' },
      { who: 'narrator', text: 'Jogo crumbles to cinders. In the ash, a finger glows red — and then, every finger you carry begins to pulse at once.' },
      { who: 'sukuna', text: 'Enough fingers in one place, and I don\'t need a vessel\'s permission. Come to the hill, sorcerer.' },
    ],
    rewards: { exp: 18000, gold: 10000, fingers: 1, items: [{ id: 'core', qty: 4 }, { id: 'sixEyes' }] },
  },
  {
    id: 'm14', name: 'King of Curses', type: 'main', chapter: 5, giver: 'ijichi', prereq: ['m13'], autoAccept: true,
    summary: 'Ryomen Sukuna has manifested at Dogenzaka. Stop him.',
    objectives: [{ type: 'boss', target: 'sukuna', label: 'Defeat Ryomen Sukuna' }],
    offer: [
      { who: 'ijichi', text: 'The fingers... they\'re pulling him into the world. He\'s standing at the top of Dogenzaka hill.' },
      { who: 'ijichi', text: 'I\'m not qualified to say this, but... I believe in you. All of you.' },
    ],
    complete: [
      { who: 'sukuna', text: 'Hah... Hahaha! So this is the strength of this era. You\'ve earned a moment of my attention. Only a moment.' },
      { who: 'narrator', text: 'The manifestation scatters into black smoke, and the fingers fall silent. Above Shibuya, the veil cracks open to the night sky.' },
      { who: 'yaga', text: 'You did what grown sorcerers could not. Rest now. Satoru\'s seal will take time to break — but we have time, thanks to you.' },
      { who: 'narrator', text: 'The Shibuya Incident is over. But the higher-ups are already deciding who to blame, and somewhere a man with Geto\'s face is smiling.' },
      { who: 'narrator', text: 'From now on, the curses of Japan grow stronger as you do. Principal Yaga will send for you soon.' },
    ],
    rewards: { exp: 30000, gold: 20000, fingers: 1, items: [{ id: 'core', qty: 6 }, { id: 'gojoJacket' }] },
  },
  {
    id: 's_ijichi', name: 'Veil Talismans', type: 'side', chapter: 5, giver: 'ijichi', prereq: ['m11'], level: 26,
    summary: 'Recover 6 Veil Talismans from curses in Shibuya.',
    objectives: [{ type: 'collect', item: 'veilTag', count: 6, label: 'Veil Talismans' }],
    offer: [{ who: 'ijichi', text: 'The curses are carrying fragments of the barrier talismans. If we study them, we can stop this from happening again. Six would be enough.' }],
    complete: [{ who: 'ijichi', text: 'Thank you. I\'ll send these to the higher-ups. Please, take these. You need them more than I do.' }],
    rewards: { exp: 14000, gold: 6000, items: [{ id: 'hpL', qty: 5 }, { id: 'ceL', qty: 5 }] },
  },
  {
    id: 's_mahoraga', name: 'The Strongest Shikigami', type: 'side', chapter: 6, giver: 'yuta', prereq: ['m14'], level: 40,
    summary: 'A Divine General stalks the ruins of Shibuya. Defeat Mahoraga.',
    objectives: [{ type: 'boss', target: 'mahoraga', label: 'Defeat Mahoraga' }],
    offer: [
      { who: 'yuta', text: 'During the incident, someone summoned a shikigami nobody could control. Mahoraga, the strongest of the Ten Shadows. It\'s still loose in the ruins.' },
      { who: 'yuta', text: 'Eight-handled wheel. Every time you hit it, the wheel turns and it learns. Mix up your attacks, and beat it before it adapts to you.' },
    ],
    complete: [{ who: 'yuta', text: 'You actually beat it. Gojo-sensei would be proud. He\'d also tell everyone he taught you that.' }],
    rewards: { exp: 60000, gold: 40000, items: [{ id: 'core', qty: 10 }], classItems: { yuji: 'bfWraps', megumi: 'dragonBone', nobara: 'crownNail' } },
  },
  {
    id: 's_soul', name: 'Soul Resonance', type: 'side', chapter: 6, giver: 'todo', prereq: ['m14'], level: 38,
    summary: 'Mahito has resurfaced at the Shibuya station plaza, stronger than ever. End it, with Aoi Todo at your side.',
    objectives: [{ type: 'boss', target: 'mahito', label: 'Defeat Mahito at the station plaza' }],
    offer: [
      { who: 'todo', text: 'BROTHER! I came the moment I sensed you. That patchwork curse — Mahito — is still in Shibuya.' },
      { who: 'todo', text: 'He has learned to reshape his own soul. But a soul can be struck, if your blow lands within a millionth of a second of your cursed energy.' },
      { who: 'player', text: 'Black Flash. ...Todo, I need your help.', only: ['yuji'] },
      { who: 'player', text: 'If he touches you, it\'s over. Keep your distance and hit him with everything.', only: ['megumi'] },
      { who: 'player', text: 'Resonance hits souls. I\'ve been dying to nail that smile.', only: ['nobara'] },
      { who: 'todo', text: 'I clap, you strike. He waits at the station plaza. Let us go, brother!', emote: 'clap' },
    ],
    progress: [{ who: 'todo', text: 'The station plaza, brother! Our souls are already in sync!' }],
    complete: [
      { who: 'todo', text: 'Hah... MAGNIFICENT! That last blow — I saw the black sparks!' },
      { who: 'narrator', text: 'Mahito drags himself away across the plaza, smaller with every step, begging for one more chance.' },
      { who: 'narrator', text: 'A man in monk\'s robes steps out of the smoke. Long black hair, a calm smile, and a line of stitches across his forehead.' },
      { who: 'kenjaku', text: 'Thank you, Mahito. You\'ve ripened beautifully.' },
      { who: 'narrator', text: 'Cursed Spirit Manipulation. He swallows the curse whole — and is gone before anyone can move.' },
      { who: 'todo', text: 'That was Suguru Geto\'s face... but not his soul. Brother, the real enemy has only just shown himself.' },
    ],
    rewards: { exp: 50000, gold: 30000, items: [{ id: 'core', qty: 8 }, { id: 'hpL', qty: 5 }] },
  },

  // ===================== Chapter 6: Perfect Preparation =====================
  {
    id: 'm15', name: 'The Executioner', type: 'main', chapter: 6, giver: 'yaga', turnIn: 'yuta', prereq: ['m14'], level: 36,
    summary: 'The higher-ups have ordered an execution, and sent a special grade sorcerer to carry it out. Yuta Okkotsu waits in the ruins of Shibuya.',
    objectives: [{ type: 'boss', target: 'yuta', label: 'Face Yuta Okkotsu in Shibuya' }],
    offer: [
      { who: 'yaga', text: 'The higher-ups have made their decision. They are blaming Shibuya on Sukuna\'s vessel, and on everyone who stood beside him.' },
      { who: 'yaga', text: 'Your suspended execution has been revoked, Yuji. A special grade sorcerer has been ordered to carry it out.', only: ['yuji'] },
      { who: 'yaga', text: 'Yuji\'s execution has been ordered, and anyone who protects him is to be treated the same. A special grade sorcerer has been sent.', not: ['yuji'] },
      { who: 'yaga', text: 'Yuta Okkotsu. He returned from abroad this morning. He is waiting for you in the ruins of Shibuya.' },
      { who: 'player', text: 'If that\'s what they decided... then I\'ll face him. I\'m done running.', only: ['yuji'] },
      { who: 'player', text: 'Okkotsu-senpai wouldn\'t take an order like that without a reason. I\'m going.', only: ['megumi'] },
      { who: 'player', text: 'Execute Yuji? Over my dead body. Which is probably what they\'re hoping for.', only: ['nobara'] },
    ],
    progress: [{ who: 'yaga', text: 'He waits at the centre of Shibuya. Be careful. He is the strongest of your generation.' }],
    complete: [
      { who: 'yuta', text: '...You can stop now. I was never going to kill you.' },
      { who: 'yuta', text: 'I made a binding vow with the higher-ups so they would give the job to me. That way, nobody else could take it.' },
      { who: 'yuta', text: 'Ieiri-san will sign the report. As far as the higher-ups know, it\'s done.' },
      { who: 'yuta', text: 'Before Shibuya, Gojo-sensei asked me to look after you if anything happened to him. I think he knew.' },
      { who: 'yuta', text: 'Something bigger is coming. The man with Geto-san\'s face — his name is Kenjaku — has started a game. All of Japan is the board.' },
    ],
    rewards: { exp: 50000, gold: 28000, items: [{ id: 'yutaRing', rarity: 2 }, { id: 'core', qty: 6 }] },
  },
  {
    id: 'm16', name: 'The Cursed Spirit Storehouse', type: 'main', chapter: 6, giver: 'maki', prereq: ['m15'], level: 38,
    summary: 'Maki is going home to the Zen\'in estate to take the clan\'s cursed tools. Go with her, and fight through the cursed spirit storehouse.',
    objectives: [
      { type: 'reach', map: 'zenin', label: 'Go to the Zen\'in estate' },
      { type: 'reach', map: 'zeninIn', label: 'Enter the cursed spirit storehouse' },
      { type: 'kill', target: ['cagedCurse', 'starvedHound'], count: 10, map: 'zeninIn', label: 'Destroy the storehouse curses' },
    ],
    offer: [
      { who: 'maki', text: 'I\'m going back to the Zen\'in estate. The old head left a will naming Megumi his heir, so naturally the clan voted to have him killed.' },
      { who: 'maki', text: 'The clan keeps a storehouse full of cursed tools. I\'m taking all of them. Mai says she\'s coming too. She says she has something to give me.' },
      { who: 'maki', text: 'Want to help? Fine. Don\'t get in my way, and don\'t feel sorry for anyone in there.' },
    ],
    progress: [{ who: 'maki', text: 'The storehouse is the old building by the east wall.' }],
    complete: [
      { who: 'maki', text: '...She made me this with the last of her cursed energy. A sword. And she took the rest of hers with her.' },
      { who: 'maki', text: 'There\'s nothing left in me now for the clan to call "cursed energy". I\'m finally whole.' },
      { who: 'maki', text: 'The Hei are gathering in the courtyard. Naoya\'s with them. Let\'s finish this.' },
    ],
    rewards: { exp: 45000, gold: 24000, items: [{ id: 'core', qty: 5 }, { id: 'hpL', qty: 4 }] },
    unlock: ['zenin'],
  },
  {
    id: 'm17', name: 'Projection Sorcery', type: 'main', chapter: 6, giver: 'maki', prereq: ['m16'], autoAccept: true,
    summary: 'Break through the Hei corps, then defeat Naoya Zen\'in in the inner courtyard.',
    objectives: [
      { type: 'kill', target: ['heiGuard', 'heiCaster', 'heiCaptain'], count: 12, map: 'zenin', label: 'Defeat the Hei corps' },
      { type: 'boss', target: 'naoya', label: 'Defeat Naoya Zen\'in' },
    ],
    offer: [
      { who: 'maki', text: 'The Hei first. Then Naoya. His technique splits a second into twenty-four frames, and he has to stick to the motion he plans.' },
      { who: 'maki', text: 'Watch where his path is drawn, step off it, and hit him when he lands. He hates that.' },
    ],
    progress: [{ who: 'maki', text: 'Courtyard. Hei first, then Naoya.' }],
    complete: [
      { who: 'narrator', text: 'Naoya drags himself across the raked gravel, swearing at the sky. His rhythm is broken at last.' },
      { who: 'maki', text: 'The Zen\'in clan is finished. Megumi can do whatever he wants with the name.' },
      { who: 'maki', text: '...Thanks. Don\'t make it weird.' },
      { who: 'narrator', text: 'Across the country, every screen flickers. A man with Geto\'s face announces the rules of a game. The Culling Game has begun.' },
    ],
    rewards: { exp: 60000, gold: 32000, items: [{ id: 'frameSandals', rarity: 2 }, { id: 'core', qty: 6 }] },
  },

  // ===================== Chapter 7: The Culling Game =====================
  {
    id: 'm18', name: 'The Culling Game', type: 'main', chapter: 7, giver: 'yuta', turnIn: 'hakari', prereq: ['m17'], level: 46,
    summary: 'Enter Tokyo Colony No. 1, survive as a player, and meet Kinji Hakari inside the barrier.',
    objectives: [
      { type: 'reach', map: 'colony1', label: 'Enter Tokyo Colony No. 1' },
      { type: 'kill', target: ['cgBrawler', 'cgCaster', 'barrierCurse'], count: 15, map: 'colony1', label: 'Survive as a player' },
    ],
    offer: [
      { who: 'yuta', text: 'Kenjaku\'s game has ten colonies, each sealed by a barrier. Anyone inside with a technique is a player. Players score points by killing other players.' },
      { who: 'yuta', text: 'There is a player in Tokyo Colony No. 1 whose technique cancels other techniques. With her help, the Prison Realm can be opened.' },
      { who: 'yuta', text: 'Gojo-sensei comes back. But we need points to find her, and to change the rules. Lots of points.' },
      { who: 'yuta', text: 'Kinji Hakari is already inside Colony No. 1. Meet him at the barrier. I\'m heading to Sendai.' },
    ],
    progress: [{ who: 'hakari', text: 'The fun\'s inside! Score some points, then come find me.' }],
    complete: [
      { who: 'hakari', text: 'Not bad! You fight like someone who actually enjoys it. That\'s rare in this business.' },
      { who: 'hakari', text: 'There\'s a guy here racking up points like crazy. Hiromi Higuruma. Ex-lawyer. Over a hundred points in a week.' },
      { who: 'hakari', text: 'Word is he\'s a decent man who snapped. Either way, he\'s sitting on exactly what we need.' },
    ],
    rewards: { exp: 70000, gold: 36000, items: [{ id: 'core', qty: 6 }, { id: 'ceL', qty: 4 }] },
    unlock: ['colony1'],
  },
  {
    id: 'm19', name: 'Deadly Sentencing', type: 'main', chapter: 7, giver: 'hakari', prereq: ['m18'], autoAccept: true,
    summary: 'Hiromi Higuruma holds court in the colony plaza. Defeat him — and survive his trial.',
    objectives: [{ type: 'boss', target: 'higuruma', label: 'Defeat Hiromi Higuruma' }],
    offer: [
      { who: 'hakari', text: 'He\'s in the plaza to the north. Watch his domain. It doesn\'t hurt you — it puts you on trial.' },
      { who: 'hakari', text: 'Lose the trial and he confiscates your technique. If he starts reading charges, clash with your own domain, fast.' },
    ],
    progress: [{ who: 'hakari', text: 'The plaza. Don\'t lose the trial!' }],
    complete: [
      { who: 'hakari', text: 'A hundred points! JACKPOT! We can add a rule now — one that lets players hand points to each other.' },
      { who: 'hakari', text: 'Okkotsu\'s in the Sendai colony, and it\'s a four-way bloodbath up there. He could use you.' },
    ],
    rewards: { exp: 90000, gold: 45000, items: [{ id: 'lawyerBadge', rarity: 2 }, { id: 'core', qty: 8 }] },
  },
  {
    id: 's_kashimo', name: 'The Thunder God', type: 'side', chapter: 7, giver: 'hakari', prereq: ['m19'], level: 56,
    summary: 'Hajime Kashimo, a sorcerer reincarnated from four hundred years ago, wants a fight. Give him one in the scorched east block.',
    objectives: [{ type: 'boss', target: 'kashimo', label: 'Defeat Hajime Kashimo' }],
    offer: [
      { who: 'hakari', text: 'Hajime Kashimo. Four hundred years dead, brought back by Kenjaku. He only wants one thing: a fight with Sukuna.' },
      { who: 'hakari', text: 'He\'s been throwing lightning at me for an hour. Mind tagging in? He\'s in the burnt-out block to the east.' },
    ],
    progress: [{ who: 'hakari', text: 'East block. Follow the thunder.' }],
    complete: [{ who: 'hakari', text: 'You beat the thunder god! Here — I won this off him. Or he threw it at me. Either way, it\'s yours.' }],
    rewards: { exp: 80000, gold: 40000, items: [{ id: 'lightningRod', rarity: 2 }, { id: 'core', qty: 6 }] },
  },
  {
    id: 's_points', name: 'Points for the Defence', type: 'side', chapter: 7, giver: 'higuruma', prereq: ['m19'], level: 50,
    summary: 'Collect 8 Culling Point Tags from the players in Tokyo Colony No. 1 so Higuruma can add rules that protect the players who never wanted to fight.',
    objectives: [{ type: 'collect', item: 'pointToken', count: 8, label: 'Culling Point Tags' }],
    offer: [
      { who: 'higuruma', text: 'Most of the people in this colony never asked to be players. They were sorcerers by accident.' },
      { who: 'higuruma', text: 'The ones still hunting carry point tags. Bring me eight. I would like, for once, to use the rules to protect someone.' },
    ],
    progress: [{ who: 'higuruma', text: 'Eight tags. Take them from the ones still hunting.' }],
    complete: [{ who: 'higuruma', text: 'Thank you. It\'s been a long time since I had a client worth defending.' }],
    rewards: { exp: 40000, gold: 30000, items: [{ id: 'pointCharm', rarity: 2 }, { id: 'hpL', qty: 4 }] },
  },
  {
    id: 'm20', name: 'The Sendai Colony', type: 'main', chapter: 7, giver: 'hakari', turnIn: 'yuta', prereq: ['m19'], autoAccept: true, level: 54,
    summary: 'Four players are fighting for control of the Sendai colony. Get inside and find Yuta.',
    objectives: [
      { type: 'reach', map: 'sendai', label: 'Enter the Sendai colony' },
      { type: 'kill', target: ['roach', 'roachQueen', 'cgBrawler', 'cgCaster', 'barrierCurse'], count: 16, map: 'sendai', label: 'Fight through the colony' },
    ],
    offer: [{ who: 'hakari', text: 'Ijichi can drop you at the Sendai barrier. Okkotsu\'s waiting inside. Don\'t keep a special grade waiting!' }],
    progress: [{ who: 'yuta', text: 'Kurourushi\'s swarm is everywhere. Thin it out before we move.' }],
    complete: [
      { who: 'yuta', text: 'Thanks. It\'s been... a lot. Four players were fighting over this colony when I arrived.' },
      { who: 'yuta', text: 'Kurourushi\'s swarm is mostly scattered. Dhruv is gone. That leaves Takako Uro, and Ryu Ishigori.' },
      { who: 'yuta', text: 'Ishigori has the highest output I have ever seen. He fires cursed energy like a cannon. He\'s in the big crater, waiting for someone worth fighting.' },
    ],
    rewards: { exp: 70000, gold: 38000, items: [{ id: 'core', qty: 6 }, { id: 'ceL', qty: 4 }] },
    unlock: ['sendai'],
  },
  {
    id: 'm21', name: 'Granite Blast', type: 'main', chapter: 7, giver: 'yuta', prereq: ['m20'], autoAccept: true,
    summary: 'Ryu Ishigori waits in the crater at the centre of the Sendai colony. Survive his Granite Blast and defeat him.',
    objectives: [{ type: 'boss', target: 'ishigori', label: 'Defeat Ryu Ishigori' }],
    offer: [
      { who: 'yuta', text: 'His beams are wide but slow to charge. When he plants his feet, move sideways. Don\'t try to outrun them.' },
    ],
    progress: [{ who: 'yuta', text: 'The crater, north of here. When he plants his feet, move.' }],
    complete: [
      { who: 'narrator', text: 'Ishigori lies flat on his back in the crater he made, laughing at the sky.' },
      { who: 'ishigori', text: 'Hahaha! I\'m STUFFED! Best meal I\'ve had in four hundred years!' },
      { who: 'yuta', text: '...The Sendai colony is quiet. And there\'s news from Tokyo. Hana Kurusu agreed to help. With her technique, the Prison Realm can be opened.' },
      { who: 'yuta', text: 'Gojo-sensei is coming back. Go home. Principal Yaga will want to see you first.' },
    ],
    rewards: { exp: 130000, gold: 60000, items: [{ id: 'graniteBand', rarity: 2 }, { id: 'core', qty: 10 }] },
  },
  {
    id: 's_uro', name: 'Sky Manipulation', type: 'side', chapter: 7, giver: 'yuta', prereq: ['m21'], level: 62,
    summary: 'Takako Uro, captain of a Heian-era assassin corps, still holds the west side of the Sendai colony. Defeat her.',
    objectives: [{ type: 'boss', target: 'uro', label: 'Defeat Takako Uro' }],
    offer: [
      { who: 'yuta', text: 'Takako Uro is still in the west of the colony. She can grab the sky like a sheet of cloth and fold it.' },
      { who: 'yuta', text: 'When she folds it around herself, projectiles slide right off. Get close when you see it.' },
    ],
    progress: [{ who: 'yuta', text: 'West side. When the sky bends, get close.' }],
    complete: [{ who: 'yuta', text: 'That was incredible. She dropped this. I think it\'s a thousand years old.' }],
    rewards: { exp: 90000, gold: 45000, items: [{ id: 'skyVeil', rarity: 2 }, { id: 'core', qty: 6 }] },
  },
  {
    id: 's_roach', name: 'Pest Control', type: 'side', chapter: 7, giver: 'ishigori', prereq: ['m21'], level: 60,
    summary: 'Exterminate 25 of Kurourushi\'s cockroaches in the Sendai colony. Ishigori says they ruin his appetite.',
    objectives: [{ type: 'kill', target: ['roach', 'roachQueen'], count: 25, map: 'sendai', label: 'Exterminate the swarm' }],
    offer: [
      { who: 'ishigori', text: 'Those bugs! Every time I sit down to eat, there they are! Clear them out and I\'ll give you something good!' },
    ],
    progress: [{ who: 'ishigori', text: 'More bugs! I can hear them crawling!' }],
    complete: [{ who: 'ishigori', text: 'Peace and quiet! Take this. And here — have a rice ball. No? More for me!' }],
    rewards: { exp: 60000, gold: 36000, items: [{ id: 'onigiri', qty: 10 }, { id: 'awSgRing', rarity: 1 }] },
  },

  // ===================== Chapter 8: Shinjuku Showdown =====================
  {
    id: 'm22', name: 'The Strongest Returns', type: 'main', chapter: 8, giver: 'yaga', turnIn: 'gojo', prereq: ['m21'], level: 66,
    summary: 'The Prison Realm has been opened. Gojo is free. Go and see him.',
    objectives: [{ type: 'talk', npc: 'gojo', label: 'Talk to Gojo at Jujutsu High' }],
    offer: [
      { who: 'yaga', text: 'Hana Kurusu opened the Prison Realm. Satoru is free.' },
      { who: 'yaga', text: 'He wants to see you. He is in the plaza... eating something, I expect.' },
    ],
    progress: [{ who: 'yaga', text: 'The plaza. Go.' }],
    complete: [
      { who: 'gojo', text: 'Yo! Miss me? Don\'t answer that. I know you did.' },
      { who: 'gojo', text: 'I heard everything. Shibuya, the execution order, the Culling Game. You all did the hard part while I was stuck in a box. Sorry I was late.' },
      { who: 'gojo', text: 'Sukuna has a new body, and it\'s Megumi\'s. If we beat him, we can pull Megumi back out.', not: ['megumi'] },
      { who: 'gojo', text: 'Sukuna wanted your body, Megumi. You kept him out, so he rebuilt the one he had a thousand years ago instead.', only: ['megumi'] },
      { who: 'gojo', text: 'He\'s waiting in Shinjuku, and so is Kenjaku. December 24th. That\'s when this ends.' },
    ],
    rewards: { exp: 60000, gold: 40000, items: [{ id: 'core', qty: 8 }, { id: 'hpL', qty: 6 }, { id: 'ceL', qty: 6 }] },
  },
  {
    id: 'm23', name: 'Shinjuku Showdown', type: 'main', chapter: 8, giver: 'gojo', turnIn: 'yuta', prereq: ['m22'], autoAccept: true,
    summary: 'Gojo faces Sukuna one on one. Keep Kenjaku\'s curses off the streets of Shinjuku and report to Yuta.',
    objectives: [
      { type: 'reach', map: 'shinjuku', label: 'Go to Shinjuku' },
      { type: 'kill', target: ['manipCurse', 'shadowHound', 'shinJelly'], count: 20, map: 'shinjuku', label: 'Hold back Kenjaku\'s curses' },
    ],
    offer: [
      { who: 'gojo', text: 'Here\'s the plan. I fight Sukuna, one on one. You keep Kenjaku\'s curses off the streets. Yuta\'s leading the second wave.' },
      { who: 'player', text: 'Sensei... are you going to win?', only: ['yuji'] },
      { who: 'player', text: '...Will you win?', only: ['megumi', 'nobara'] },
      { who: 'gojo', text: 'Against him? Ha. Of course I\'ll win. I\'m the strongest, remember?', emote: 'wave' },
    ],
    progress: [{ who: 'yuta', text: 'Kenjaku\'s curses are pouring out of every street. Keep them away from the fight.' }],
    complete: [
      { who: 'narrator', text: 'The sky over Shinjuku splits along a single straight line. For a moment, everything is silent.' },
      { who: 'yuta', text: '...Gojo-sensei is gone. Sukuna cut through the world itself. Space, and everything in it.' },
      { who: 'player', text: 'No. No, no, no... he said he\'d win. He SAID—', only: ['yuji'] },
      { who: 'player', text: '...He knew. He went anyway, so that we\'d have a chance.', only: ['megumi'] },
      { who: 'player', text: 'Don\'t. Don\'t tell me that. Not him too.', only: ['nobara'] },
      { who: 'yuta', text: 'We don\'t get to stop. Sukuna is hurt. Kenjaku is exposed. This is the chance he bought us.' },
      { who: 'yuta', text: 'Uraume is guarding the approach to Sukuna. We go through them first.' },
    ],
    rewards: { exp: 150000, gold: 70000, items: [{ id: 'core', qty: 10 }, { id: 'blindfold', rarity: 2 }] },
    unlock: ['shinjuku'],
  },
  {
    id: 'm24', name: 'Frost Calm', type: 'main', chapter: 8, giver: 'yuta', prereq: ['m23'], autoAccept: true, level: 70,
    summary: 'Uraume, Sukuna\'s servant for a thousand years, guards the west side of the battlefield. Break through.',
    objectives: [{ type: 'boss', target: 'uraume', label: 'Defeat Uraume' }],
    offer: [{ who: 'yuta', text: 'Uraume\'s ice slows everything it touches. Keep moving, and don\'t stand in the frost.' }],
    progress: [{ who: 'yuta', text: 'West side, where the ice is. Keep moving.' }],
    complete: [
      { who: 'narrator', text: 'Uraume\'s ice shatters. They kneel on the frozen ground, still facing the direction of their master.' },
      { who: 'yuta', text: 'Kenjaku is on the east side, watching all of this like an experiment. He\'s next.' },
    ],
    rewards: { exp: 160000, gold: 75000, items: [{ id: 'frostPin', rarity: 2 }, { id: 'core', qty: 10 }] },
  },
  {
    id: 'm25', name: 'A Thousand Years of Schemes', type: 'main', chapter: 8, giver: 'yuta', prereq: ['m24'], autoAccept: true, level: 74,
    summary: 'Kenjaku, the architect of Shibuya and the Culling Game, waits on the east side of Shinjuku. End him.',
    objectives: [{ type: 'boss', target: 'kenjaku', label: 'Defeat Kenjaku' }],
    offer: [{ who: 'yuta', text: 'He has every curse Geto-san ever absorbed. And his domain is a womb. Don\'t let it close around you.' }],
    progress: [{ who: 'yuta', text: 'The east side. End it.' }],
    complete: [
      { who: 'narrator', text: 'Kenjaku falls. The stitches across his forehead come apart, and the thing that wore Geto\'s face goes still at last.' },
      { who: 'yuta', text: '...It\'s over for him. A thousand years of schemes, and it ends in a car park in Shinjuku.' },
      { who: 'yuta', text: 'Only Sukuna is left. Everyone who can still stand is coming.' },
    ],
    rewards: { exp: 220000, gold: 90000, items: [{ id: 'prisonShard', rarity: 2 }, { id: 'core', qty: 12 }] },
  },
  {
    id: 'm26', name: 'The King of Curses', type: 'main', chapter: 8, giver: 'yuta', prereq: ['m25'], autoAccept: true, level: 78,
    summary: 'Ryomen Sukuna waits in the crater at the heart of Shinjuku, in his true Heian form. This is the last fight.',
    objectives: [{ type: 'boss', target: 'sukunaTrue', label: 'Defeat Ryomen Sukuna' }],
    offer: [
      { who: 'yuta', text: 'Higuruma, Hakari, Choso, all of us — we go in together. But he\'s waiting for you.' },
      { who: 'yuta', text: 'He took Mahoraga\'s wheel. Once it starts turning, he adapts to whatever you use most. Change it up. And when he says "World-Cutting", get off the line.' },
    ],
    progress: [{ who: 'yuta', text: 'The crater. Change your attacks, and watch for the long white line.' }],
    complete: [
      { who: 'narrator', text: 'The King of Curses begins to come apart, curse by curse, finger by finger.' },
      { who: 'player', text: 'I\'ll ask you once, Sukuna. Do you want to try again? Living alongside someone, instead of eating them?', only: ['yuji'] },
      { who: 'sukuna', text: 'Don\'t be absurd, brat. I am what I am. ...But you were not boring. I\'ll give you that.' },
      { who: 'narrator', text: 'From the ruin of the King\'s body, Megumi stumbles free, blinking at the winter sky.', not: ['megumi'] },
      { who: 'megumi', text: '...You came all this way for me. Idiots.', not: ['megumi'] },
      { who: 'narrator', text: 'December 24th. The Shinjuku Showdown is over.' },
      { who: 'yuta', text: 'Gojo-sensei would say something annoying right now. Something like, "See? I told you you\'d be fine."' },
      { who: 'narrator', text: 'THE END. Thank you for playing Cursed Chronicles. The curses of Japan still rise to meet you, and the road to level 100 stays open.' },
      { who: 'narrator', text: 'Post-game: Yaga has word from Tengen, the hills past the east gate are full of curses, and the King of Curses himself can now join you as a playable sorcerer.' },
    ],
    rewards: { exp: 400000, gold: 200000, fingers: 1, items: [{ id: 'kingRing', rarity: 2 }, { id: 'core', qty: 20 }], classItems: { yuji: 'svSgFist', megumi: 'svSpiritEdge', nobara: 'svResMallet' } },
  },
  {
    id: 's_choso', name: 'An Older Brother\'s Job', type: 'side', chapter: 8, giver: 'choso', prereq: ['m23'], level: 70,
    summary: 'Destroy 25 of Kenjaku\'s curses in Shinjuku with Choso.',
    objectives: [{ type: 'kill', target: ['manipCurse', 'shadowHound', 'shinJelly'], count: 25, map: 'shinjuku', label: 'Destroy Kenjaku\'s curses' }],
    offer: [
      { who: 'choso', text: 'Kenjaku made me. Made all nine of us, and threw my brothers away like failed drafts.' },
      { who: 'choso', text: 'Every curse he lets loose here is another one of his experiments. Help me break them. All of them.' },
      { who: 'choso', text: 'An older brother protects his siblings. Whether or not they remember him.', only: ['yuji'] },
    ],
    progress: [{ who: 'choso', text: 'More. He has more.' }],
    complete: [{ who: 'choso', text: 'That\'s enough. Take this. As long as I have blood left, you won\'t fight alone.' }],
    rewards: { exp: 80000, gold: 50000, items: [{ id: 'bloodRing', rarity: 2 }, { id: 'hpL', qty: 6 }] },
  },

  // ===================== The open world: Tokyo Outskirts =====================
  {
    id: 's_out1', name: 'Beyond the East Gate', type: 'side', chapter: 1, giver: 'panda', turnIn: 'monk', prereq: ['m3'], level: 5,
    summary: 'Follow the old road out of the east gate of Jujutsu High into the Tokyo Outskirts, clear the cedar forest and find the monk in Sakaki Village.',
    objectives: [
      { type: 'reach', map: 'outskirts', label: 'Take the east gate to the Tokyo Outskirts' },
      { type: 'kill', target: ['forestCurse', 'crawler', 'flyhead', 'lanky'], count: 10, map: 'outskirts', label: 'Clear the forest road' },
      { type: 'talk', npc: 'monk', label: 'Find the monk in Sakaki Village' },
    ],
    offer: [
      { who: 'panda', text: 'Psst. You know the old road past the east gate? Goes out into the hills, all the way to a village and a lake.' },
      { who: 'panda', text: 'The monk out there used to send us rice crackers. He stopped. Now there are curses on the road. I\'m worried. Also hungry.' },
      { who: 'panda', text: 'It\'s a big place out there. Look around. People say there are old caches sealed in the woods.' },
    ],
    progress: [{ who: 'panda', text: 'East gate. Follow the road. Bring crackers back if you can.' }],
    complete: [
      { who: 'monk', text: 'A sorcerer from the school! Thank the gods. The curses have been creeping down from the hills since summer.' },
      { who: 'monk', text: 'The further you go from the village, the worse they are. The lake, the old hospital, and that tree... stay away from the tree for now.' },
    ],
    rewards: { exp: 400, gold: 500, items: [{ id: 'hpS', qty: 5 }, { id: 'fragment', qty: 3 }] },
  },
  {
    id: 's_out2', name: 'Charms for the Roadside Gods', type: 'side', chapter: 1, giver: 'monk', prereq: ['s_out1'], level: 9,
    summary: 'The curses have been tearing the paper charms off the roadside shrines. Win back six of them.',
    objectives: [{ type: 'collect', item: 'shrineCharm', count: 6, label: 'Recover Weathered Shrine Charms' }],
    offer: [
      { who: 'monk', text: 'Every shrine along the road had a charm. The curses chew them off. I think they like the taste of a prayer.' },
      { who: 'monk', text: 'Bring six back and I\'ll bless them again. The forest curses and the ones in the paddies carry them.' },
    ],
    progress: [{ who: 'monk', text: 'The forest curses, and the ones in the rice paddies. They\'re never far from the road.' }],
    complete: [{ who: 'monk', text: 'Six. Good. Take this ward; it was blessed at the mountain shrine before I was born.' }],
    rewards: { exp: 900, gold: 800, items: [{ id: 'wardCharm', rarity: 1 }, { id: 'hpM', qty: 3 }] },
  },
  {
    id: 's_out3', name: 'The Graveyard Deity', type: 'side', chapter: 2, giver: 'monk', prereq: ['s_out2'], level: 20,
    summary: 'A disease curse wearing a gravestone has taken the old graveyard south of the village. Put it down.',
    objectives: [{ type: 'boss', target: 'smallpox', label: 'Defeat the Smallpox Deity in the Old Graveyard' }],
    offer: [
      { who: 'monk', text: 'There is a curse in the graveyard that buries people alive. It wears a gravestone like a head and it counts to three.' },
      { who: 'monk', text: 'If it starts counting, run. Get far away before it reaches three.' },
    ],
    progress: [{ who: 'monk', text: 'South of the paddies, past the last house. Don\'t let it count to three with you beside it.' }],
    complete: [{ who: 'monk', text: 'The graveyard is quiet. It will come back, they always do, but it will be weaker for a while. Take this. It rang for the dead; now it rings for you.' }],
    rewards: { exp: 7000, gold: 5000, items: [{ id: 'graveBell', rarity: 2 }, { id: 'core', qty: 2 }] },
  },
  {
    id: 's_out4', name: 'A Rainbow Over the Lake', type: 'side', chapter: 4, giver: 'monk', prereq: ['s_out3'], level: 36,
    summary: 'Something with scales of every colour lives in Kamisato Lake. Collect its shed scales, then face it.',
    objectives: [
      { type: 'collect', item: 'dragonScale', count: 5, label: 'Collect Rainbow Scales from the mountain curses' },
      { type: 'boss', target: 'rainbowDragon', label: 'Defeat the Rainbow Dragon at the lake' },
    ],
    offer: [
      { who: 'monk', text: 'Before you were born, a young sorcerer in a monk\'s robe came through here. He swallowed a curse at the lake. A dragon.' },
      { who: 'monk', text: 'When he died, the curses he had taken were set loose. I think the dragon came home.' },
      { who: 'monk', text: 'The curses on the mountain carry its shed scales. Bring me five, and I\'ll know it is really back.' },
    ],
    progress: [{ who: 'monk', text: 'The mountain curses carry the scales. Then the east shore of the lake.' }],
    complete: [{ who: 'monk', text: 'A dragon, gone again. That young man in the robe... I hope wherever he is, he found some peace.' }],
    rewards: { exp: 30000, gold: 18000, items: [{ id: 'dragonPearl', rarity: 2 }, { id: 'core', qty: 4 }] },
  },
  {
    id: 's_out5', name: 'Tamagawa Hospital', type: 'side', chapter: 6, giver: 'monk', prereq: ['s_out4'], level: 52,
    summary: 'The lights in the closed hospital still come on at night. Clear the wards, then deal with the woman in the courtyard.',
    objectives: [
      { type: 'kill', target: ['wardWraith', 'hospitalHand'], count: 15, map: 'outskirts', label: 'Clear the hospital wards' },
      { type: 'boss', target: 'kuchisake', label: 'Defeat Kuchisake-onna in the courtyard' },
    ],
    offer: [
      { who: 'monk', text: 'Children dare each other to go to the old hospital. Two of them came back saying a tall woman asked if she was pretty.' },
      { who: 'monk', text: 'The rumour made a curse. They always do. Please, before the next dare.' },
    ],
    progress: [{ who: 'monk', text: 'East, past the river. If she asks you the question, don\'t stand still to answer it.' }],
    complete: [{ who: 'monk', text: 'No more dares, then. I will tell the children a less interesting story.' }],
    rewards: { exp: 60000, gold: 30000, items: [{ id: 'redScissors', rarity: 2 }, { id: 'core', qty: 6 }] },
  },
  {
    id: 's_out6', name: 'The Womb Tree', type: 'side', chapter: 8, giver: 'monk', prereq: ['s_out5'], level: 70,
    summary: 'The tree in the middle of the hills has been spawning curses since the Culling Game began. Cut them back.',
    objectives: [{ type: 'kill', target: ['nestSpawn', 'releasedCurse'], count: 20, map: 'outskirts', label: 'Destroy the curses around the Womb Tree' }],
    offer: [
      { who: 'monk', text: 'When the Culling Game started, something was released into these hills. It took root in the middle of the valley.' },
      { who: 'monk', text: 'The tree keeps spawning curses. Special grades, some of them. You are strong enough now. I can see it.' },
    ],
    progress: [{ who: 'monk', text: 'The tree in the centre, north of the river. Keep cutting them back.' }],
    complete: [{ who: 'monk', text: 'The tree is quiet. For now. The hills will always grow curses, but you have made them a place people can walk again.' }],
    rewards: { exp: 160000, gold: 60000, items: [{ id: 'core', qty: 10 }, { id: 'hpL', qty: 6 }] },
  },

  // ===================== Culling Game: Sakurajima =====================
  {
    id: 's_saku1', name: 'The Sakurajima Colony', type: 'side', chapter: 7, giver: 'maki', turnIn: 'kamo', prereq: ['m21'], level: 60,
    summary: 'Noritoshi Kamo has sent word from the Sakurajima colony: something wearing Naoya\'s face is hunting players there.',
    objectives: [
      { type: 'reach', map: 'sakurajima', label: 'Travel to the Sakurajima Colony' },
      { type: 'talk', npc: 'kamo', label: 'Find Noritoshi Kamo at the harbour' },
    ],
    offer: [
      { who: 'maki', text: 'Kamo sent a message out of Sakurajima. There is a cursed spirit in the colony. It has Naoya\'s hair. It has his voice.' },
      { who: 'maki', text: 'My mother stabbed him in the storehouse. He died hating me so much that he came back as a curse.' },
      { who: 'maki', text: 'That\'s my mess. But I want someone watching my back when I clean it up. Ijichi can get you there.' },
    ],
    progress: [{ who: 'maki', text: 'Sakurajima. Kamo is waiting at the harbour.' }],
    complete: [
      { who: 'kamo', text: 'You came. Good. I am Noritoshi Kamo, from the Kyoto school. I fought him once already. He was faster than anything I have seen.' },
      { who: 'kamo', text: 'The players here are terrified, and the curses are worse. Clear a path to the crater. He waits at the rim.' },
    ],
    rewards: { exp: 40000, gold: 24000, items: [{ id: 'ceL', qty: 4 }] },
  },
  {
    id: 's_saku2', name: 'The Zen\'in Heir, Again', type: 'side', chapter: 7, giver: 'kamo', prereq: ['s_saku1'], autoAccept: true,
    summary: 'Cut a path through the Sakurajima colony and destroy Naoya\'s cursed spirit at the crater rim.',
    objectives: [
      { type: 'kill', target: ['ashCurse', 'magmaHound', 'cgVeteran', 'heiRemnant'], count: 16, map: 'sakurajima', label: 'Fight your way to the crater' },
      { type: 'boss', target: 'naoyaCurse', label: 'Defeat Naoya\'s cursed spirit at the crater rim' },
    ],
    offer: [{ who: 'kamo', text: 'His domain makes every movement follow his rules. Keep moving. If you stand still inside it, you will freeze.' }],
    progress: [{ who: 'kamo', text: 'North, up the slope to the crater. Watch the lines on the ground: that\'s where he will run.' }],
    complete: [
      { who: 'kamo', text: 'It\'s over. Maki-san asked me to tell you something when it was done.' },
      { who: 'maki', text: 'Thanks. Really. ...He kept those stupid earrings even as a curse. Here. I don\'t want them.' },
    ],
    rewards: { exp: 160000, gold: 70000, items: [{ id: 'heirEarrings', rarity: 2 }, { id: 'core', qty: 10 }] },
  },

  // ===================== Chapter 9: Memories in the Barrier =====================
  {
    id: 'm27', name: 'The Barrier Master', type: 'main', chapter: 9, giver: 'yaga', turnIn: 'tengen', prereq: ['m26'], level: 80,
    summary: 'Tengen has asked to see you. Take the lift in the Jujutsu High storehouse down to the Tombs of the Star.',
    objectives: [
      { type: 'reach', map: 'starCorridor', label: 'Take the storehouse lift to the Tombs of the Star' },
      { type: 'talk', npc: 'tengen', label: 'Speak with Tengen beneath the great tree' },
    ],
    offer: [
      { who: 'yaga', text: 'Tengen has asked for you. In person. In all my years, that has happened to very few sorcerers.' },
      { who: 'yaga', text: 'The lift is in the storehouse, behind the dormitory. Go down until it stops.' },
    ],
    progress: [{ who: 'yaga', text: 'The storehouse lift. Tengen is waiting.' }],
    complete: [
      { who: 'tengen', text: 'Welcome. I am Tengen. I have kept Japan\'s barriers for over a thousand years. I remember everything that has happened inside them.' },
      { who: 'tengen', text: 'With Kenjaku gone, those memories have started to curdle into curses. Old fights. Old grief. They are leaking out.' },
      { who: 'tengen', text: 'I need someone to walk into them and lay them to rest. The first happened here, in 2006.' },
    ],
    rewards: { exp: 80000, gold: 40000, items: [{ id: 'starTalisman', rarity: 2 }, { id: 'core', qty: 6 }] },
  },
  {
    id: 'm28', name: 'Hidden Inventory', type: 'main', chapter: 9, giver: 'tengen', prereq: ['m27'], autoAccept: true, level: 82,
    summary: 'Relive the memory of 2006: the Star Plasma Vessel and the sorcerer killer who walked into Tengen\'s barrier. Defeat Toji Fushiguro.',
    objectives: [
      { type: 'kill', target: ['memoryCurse', 'templeAssassin'], count: 12, map: 'starCorridor', label: 'Clear the memory\'s curses' },
      { type: 'boss', target: 'toji', label: 'Defeat Toji Fushiguro in the corridor' },
    ],
    offer: [
      { who: 'tengen', text: 'In 2006 a girl named Riko Amanai was to merge with me. Two students guarded her: Satoru Gojo and Suguru Geto.' },
      { who: 'tengen', text: 'A man with no cursed energy at all walked through my barriers as if they were not there. Toji Fushiguro. He nearly ended everything.' },
      { who: 'tengen', text: 'He has no cursed energy, so domains can barely find him. Fight him with your own hands.' },
      { who: 'player', text: 'Fushiguro... Megumi\'s dad?', only: ['yuji', 'nobara'] },
      { who: 'player', text: '...I know who he is.', only: ['megumi'] },
    ],
    progress: [{ who: 'tengen', text: 'The memory waits in the corridor. Clear its curses first; he will come when the way is quiet.' }],
    complete: [
      { who: 'tengen', text: 'That night changed Satoru Gojo. He became the strongest. And Suguru Geto began to lose his way.' },
      { who: 'tengen', text: 'The next memory is his. The night he came back to Jujutsu High with a hundred curses behind him.' },
    ],
    rewards: { exp: 200000, gold: 80000, items: [{ id: 'heavenBand', rarity: 2 }, { id: 'core', qty: 12 }] },
  },
  {
    id: 'm29', name: 'Night Parade of a Hundred Demons', type: 'main', chapter: 9, giver: 'tengen', turnIn: 'tengen', prereq: ['m28'], autoAccept: true, level: 86,
    summary: 'Step through the memory gate into December 24th, 2017, break the Night Parade and defeat Suguru Geto.',
    objectives: [
      { type: 'reach', map: 'nightParade', label: 'Enter the memory through the left gate' },
      { type: 'kill', target: ['paradeCurse', 'paradeFlyer'], count: 20, map: 'nightParade', label: 'Break the Night Parade' },
      { type: 'boss', target: 'geto', label: 'Defeat Suguru Geto in the plaza' },
    ],
    offer: [
      { who: 'tengen', text: 'December 24th, 2017. Suguru Geto set a thousand curses on Shinjuku and Kyoto, and came to Jujutsu High himself for Yuta Okkotsu\'s Rika.' },
      { who: 'tengen', text: 'The left gate. Report to me when it is done.' },
    ],
    progress: [{ who: 'tengen', text: 'The left gate leads into that night.' }],
    complete: [
      { who: 'tengen', text: 'In the real memory, Satoru found him in an alley afterwards. They were best friends, once. Only one of them walked away.' },
      { who: 'tengen', text: 'One memory is left. Satoru left it for you himself. It is waiting behind the right gate.' },
    ],
    rewards: { exp: 260000, gold: 100000, items: [{ id: 'getoKesa', rarity: 2 }, { id: 'core', qty: 14 }] },
  },
  {
    id: 'm30', name: 'The Strongest\'s Last Lesson', type: 'main', chapter: 9, giver: 'tengen', turnIn: 'tengen', prereq: ['m29'], autoAccept: true, level: 92,
    summary: 'Gojo left one last lesson in Tengen\'s barrier. Enter Unlimited Void and beat the strongest.',
    objectives: [
      { type: 'reach', map: 'lastLesson', label: 'Enter the memory through the right gate' },
      { type: 'boss', target: 'gojoMemory', label: 'Defeat Satoru Gojo\'s memory' },
    ],
    offer: [
      { who: 'tengen', text: 'Before Shinjuku, Satoru asked me to keep something. A copy of his technique, and of himself. "For the kids," he said. "In case."' },
      { who: 'tengen', text: 'He has Infinity. Only a Black Flash or a domain of your own will reach him while it is up.' },
    ],
    progress: [{ who: 'tengen', text: 'The right gate. He is waiting, and I suspect he is enjoying it.' }],
    complete: [
      { who: 'gojo', text: 'Ow! Okay, okay. You win. You actually won. I knew you would. I mean, I taught you, so.' },
      { who: 'gojo', text: 'Listen. Being the strongest was lonely. You don\'t have to be the strongest. Just be someone people can rely on. Got it?' },
      { who: 'player', text: 'Got it, sensei.', only: ['yuji', 'nobara'] },
      { who: 'player', text: '...Yeah. Got it.', only: ['megumi'] },
      { who: 'narrator', text: 'The void folds away like a closing book. Tengen\'s barrier is quiet at last.' },
      { who: 'tengen', text: 'Thank you. Whatever comes next — and something always comes next — the barriers will hold.' },
      { who: 'narrator', text: 'MEMORIES COMPLETE. A new sorcerer is waiting: Yuji Itadori, decades from now.' },
    ],
    rewards: { exp: 400000, gold: 200000, items: [{ id: 'infinityEcho', rarity: 2 }, { id: 'core', qty: 20 }] },
  },
];

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
  mechamaru: "Mechamaru's Reforge — +11 to +30",
};
