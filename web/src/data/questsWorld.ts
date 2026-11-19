// Quests and dialogue: The open world, Sakurajima and Chapter 9 (the memories in the barrier). All lines are original writing for this fan game.
import type { QuestDef } from './story';

export const WORLD_QUESTS: QuestDef[] = [
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
    progress: [{ who: 'monk', text: 'You came from the school? The road behind you is still crawling with curses. Clear it, and then we can talk properly.' }],
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
    progress: [{ who: 'kamo', text: 'You made it to the colony. Good. Stay close to the harbour until we have talked.' }],
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
    summary: 'Relive the memory of 2006: the Star Plasma Vessel, the sorcerer killer who walked into Tengen\'s barrier, and the fight in the corridor.',
    objectives: [
      { type: 'kill', target: ['memoryCurse', 'templeAssassin'], count: 12, map: 'starCorridor', label: 'Clear the memory\'s curses' },
      { type: 'boss', target: 'toji', label: 'Win the fight in the corridor' },
    ],
    offer: [
      { who: 'tengen', text: 'In 2006 a girl named Riko Amanai was to merge with me. Two students guarded her: Satoru Gojo and Suguru Geto.' },
      { who: 'tengen', text: 'A man with no cursed energy at all walked through my barriers as if they were not there. Toji Fushiguro. He nearly ended everything.', notCls: ['toji'] },
      { who: 'tengen', text: 'He has no cursed energy, so domains can barely find him. Fight him with your own hands.', notCls: ['toji'] },
      { who: 'tengen', text: 'You walked through my barriers as if they were not there, Toji Fushiguro. A man with no cursed energy at all. You nearly ended everything.', cls: ['toji'] },
      { who: 'tengen', text: 'The memory has a hole where you should be. It will fill it with the one you fought that night: Satoru Gojo, the moment he became the strongest.', cls: ['toji'] },
      { who: 'player', text: 'Getting paid to relive my own job. Fine. Point me at him.', cls: ['toji'] },
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
    cine: { outro: { kicker: 'Inside Tengen\'s barrier', title: 'The Strongest\'s Last Lesson', jp: '最強の最後の授業', cam: 'close', tint: 'cyan' } },
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
