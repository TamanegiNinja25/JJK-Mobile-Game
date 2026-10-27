// Quests and dialogue. All lines are original writing for this fan game.
import { ClassId } from '../rpg/types';

export interface Line {
  who: string;            // npc id, 'player', 'narrator', 'sukuna'
  text: string;
  only?: ClassId[];       // shown only for these classes
  not?: ClassId[];        // hidden for these classes
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
  mechamaru: 'Mechamaru', sasaki: 'Sasaki (Occult Club)', iguchi: 'Iguchi (Occult Club)', choso: 'Choso', kenjaku: '???', grandpa: 'Wasuke Itadori',
};

/** How the UI refers to people in tight spaces (map labels, quest log). */
export const NPC_SHORT: Record<string, string> = {
  gojo: 'Gojo', yaga: 'Yaga', shoko: 'Shoko', maki: 'Maki', panda: 'Panda', inumaki: 'Inumaki', ijichi: 'Ijichi', nanami: 'Nanami',
  junpei: 'Junpei', todo: 'Todo', miwa: 'Miwa', meimei: 'Mei Mei', sasaki: 'Sasaki', iguchi: 'Iguchi', yuji: 'Yuji', megumi: 'Megumi', nobara: 'Nobara',
  mechamaru: 'Mechamaru',
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

  // ===================== Chapter 5: Shibuya Incident =====================
  {
    id: 'm11', name: 'October 31st', type: 'main', chapter: 5, giver: 'yaga', prereq: ['m10'], level: 24,
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
      { who: 'narrator', text: 'THE END — of this chapter. The Culling Game will come. For now: free roam, bounties, and one more shadow that waits in Shibuya...' },
      { who: 'narrator', text: 'From now on, the curses of Japan grow stronger as you do. The road to level 100 is open.' },
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
    id: 's_mahoraga', name: 'The Strongest Shikigami', type: 'side', chapter: 6, giver: 'gojo', prereq: ['m14'], level: 40,
    summary: 'A Divine General stalks the depths of Shibuya. Defeat Mahoraga.',
    objectives: [{ type: 'boss', target: 'mahoraga', label: 'Defeat Mahoraga' }],
    offer: [
      { who: 'gojo', text: 'Guess who\'s back! Seals are so last season.' },
      { who: 'gojo', text: 'Bad news though. Something adaptive is wandering Shibuya. Eight-handled wheel, very rude. Every time you hit it, it learns.' },
      { who: 'gojo', text: 'Beat it before it adapts to you. Or don\'t, and I\'ll do it. But then I get the credit.' },
    ],
    complete: [{ who: 'gojo', text: 'Okay, wow. I take back everything I said about you being a first-year. Mostly.' }],
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
};

export const SHOP_LINES: Record<string, string> = {
  shoko: 'Infirmary — potions and remedies',
  maki: 'Armory — weapons and gear',
  yaga: 'Workshop — cursed energy infusion',
  meimei: 'Mei Mei\'s Exchange — rare goods, rare prices',
  ijichi: 'Travel — where to?',
  mechamaru: "Mechamaru's Reforge — +11 to +30",
};
