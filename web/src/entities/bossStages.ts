/**
 * Every boss's Phase 2 and Final Phase: the move it opens the stage with, the line the banner shows, the
 * moves it leans on from then on (twice as likely, cooldowns about halved), an aura colour, and for some a
 * bigger form. Move ids are the boss's own (see its moves()).
 */
export interface StageSig { open?: string; line?: string; favor?: string[]; aura?: number; grow?: number }
export const STAGES: Record<string, [StageSig, StageSig]> = {
  glutton: [{ open: 'vomit', line: 'It gorges on cursed energy', favor: ['charge'] }, { open: 'slam', line: 'Bloated and frenzied', favor: ['bite', 'slam'], grow: 1.12 }],
  fingerBearer: [{ open: 'spikes', line: 'The finger awakens', favor: ['claws'] }, { open: 'beam', line: 'Sukuna\'s finger burns', favor: ['beam', 'leap'], aura: 0xff2a3a, grow: 1.1 }],
  mahito: [{ open: 'spikes', line: 'Idle Transfiguration', favor: ['grab'], aura: 0x7ac0c0 }, { open: 'grab', line: 'Instant Spirit Body of Distorted Killing', favor: ['blade', 'grab', 'dash'], aura: 0x4a8a8a, grow: 1.25 }],
  todo: [{ open: 'clap', line: 'Boogie Woogie!', favor: ['clap'] }, { open: 'bf', line: 'Black Flash!', favor: ['bf', 'punches'], aura: 0xff1a2a }],
  hanami: [{ open: 'roots', line: 'The forest rises', favor: ['roots'], aura: 0x6ad86a }, { open: 'sea', line: 'Flower Field', favor: ['bloom', 'seeds'], aura: 0xf0a0c0, grow: 1.1 }],
  dagon: [{ open: 'wave', line: 'The tide comes in', favor: ['tentacle'], aura: 0x3a8ad8 }, { open: 'geyser', line: 'Death Swarm', favor: ['fish', 'geyser'], aura: 0x2a6ab8 }],
  jogo: [{ open: 'eruption', line: 'Ember Insects', favor: ['insects'], aura: 0xff6a1a }, { open: 'meteor', line: 'Maximum: Meteor!', favor: ['fireballs', 'eruption'], aura: 0xff3a0a, grow: 1.1 }],
  sukuna: [{ open: 'dismantle', line: 'Dismantle', favor: ['dismantle'], aura: 0xff2a3a }, { open: 'fuga', line: 'Open: Furnace', favor: ['cleave', 'fuga'], aura: 0xff5a1a }],
  mahoraga: [{ open: 'quake', line: 'The wheel turns: adapted', favor: ['sword'], aura: 0xe8e0c0 }, { open: 'charge', line: 'Fully adapted', favor: ['sword', 'charge'], aura: 0xffffff, grow: 1.12 }],
  choso: [{ open: 'convergence', line: 'Convergence', favor: ['piercing'], aura: 0xc81a2a }, { open: 'supernova', line: 'Flowing Red Scale: Stack', favor: ['piercing', 'supernova'], aura: 0xff1a2a }],
  kechizu: [{ open: 'puddles', line: 'Rot spreads', favor: ['spit'], aura: 0x8ab83a }, { open: 'spit', line: 'Brother, I\'m coming!', favor: ['puddles', 'bite'], aura: 0x6a9a2a, grow: 1.1 }],
  eso: [{ open: 'rot', line: 'Decay', favor: ['rot'], aura: 0x9aba3a }, { open: 'wing', line: 'Wing King', favor: ['wing', 'rot'], aura: 0x7a9a2a }],
  yujiRival: [{ open: 'divergent', line: 'Divergent Fist', favor: ['divergent'], aura: 0x9ad0ff }, { open: 'bf', line: 'Black Flash!', favor: ['bf'], aura: 0xff1a2a }],
  yuta: [{ open: 'rika', line: 'Rika!', favor: ['rika'], aura: 0xe8e8ff }, { open: 'love', line: 'Authentic Mutual Love', favor: ['katana', 'copy'], aura: 0xffffff }],
  naoya: [{ open: 'frames', line: 'Projection Sorcery', favor: ['frames'], aura: 0xc8e0ff }, { open: 'boom', line: 'Twenty-four frames, faster', favor: ['blink', 'boom'], aura: 0xa0c8ff }],
  higuruma: [{ open: 'enlarge', line: 'Judgeman watches', favor: ['gavel'], aura: 0xe8c86a }, { open: 'execute', line: 'Executioner\'s Sword', favor: ['execute', 'throw'], aura: 0xffe08a }],
  kashimo: [{ open: 'discharge', line: 'Lightning discharge', favor: ['bolts'], aura: 0x6ac8ff }, { open: 'amber', line: 'Mythical Beast Amber', favor: ['bolts', 'discharge'], aura: 0x9ae8ff, grow: 1.1 }],
  ishigori: [{ open: 'barrage', line: 'Output: maximum', favor: ['barrage'], aura: 0xffb04a }, { open: 'granite', line: 'Granite Blast', favor: ['granite', 'stomp'], aura: 0xff8a2a }],
  uro: [{ open: 'fold', line: 'Sky Manipulation', favor: ['fold'], aura: 0x9ab8ff }, { open: 'breaker', line: 'Thin Ice Breaker', favor: ['breaker', 'kicks'], aura: 0xc8d8ff }],
  uraume: [{ open: 'calm', line: 'Frost Calm', favor: ['shards'], aura: 0xbfe8ff }, { open: 'icefall', line: 'Ice Formation: Icefall', favor: ['icefall', 'calm'], aura: 0xe0f4ff }],
  kenjaku: [{ open: 'gravity', line: 'Anti-Gravity System', favor: ['orbs'], aura: 0x8a6aff }, { open: 'uzumaki', line: 'Maximum: Uzumaki', favor: ['uzumaki', 'gravity'], aura: 0x6a3aff }],
  sukunaTrue: [{ open: 'dogs', line: 'Ten Shadows: Divine Dogs', favor: ['dismantle'], aura: 0xff2a3a }, { open: 'world', line: 'World-Cutting Slash', favor: ['world', 'cleave', 'fuga'], aura: 0xff0a1a }],
  smallpox: [{ open: 'coffin', line: 'Coffin of the dead', favor: ['pox'], aura: 0x8a6a4a }, { open: 'pox', line: 'The plague spreads', favor: ['coffin', 'wisps'], aura: 0x6a4a3a, grow: 1.1 }],
  rainbowDragon: [{ open: 'breath', line: 'Rainbow Breath', favor: ['dive'], aura: 0xc8a0ff }, { open: 'coil', line: 'The dragon coils', favor: ['breath', 'coil'], aura: 0xff8ad8, grow: 1.1 }],
  kuchisake: [{ open: 'question', line: '"Am I pretty?"', favor: ['snip'], aura: 0xd84a5a }, { open: 'scream', line: '"Now am I pretty?!"', favor: ['lunge', 'snip'], aura: 0xff2a3a }],
  naoyaCurse: [{ open: 'mach', line: 'Sound barrier broken', favor: ['mach'], aura: 0xc8e8ff }, { open: 'frames', line: 'Time Cell Moon Palace', favor: ['frames', 'blink'], aura: 0xa8d0ff, grow: 1.1 }],
  toji: [{ open: 'chain', line: 'Chain of a Thousand Miles', favor: ['vanish'], aura: 0x6a6a6a }, { open: 'spear', line: 'Inverted Spear of Heaven', favor: ['spear', 'vanish', 'cloud'], aura: 0x4a4a4a }],
  geto: [{ open: 'dragon', line: 'Rainbow Dragon', favor: ['spirits'], aura: 0x8a6aff }, { open: 'uzumaki', line: 'Maximum: Uzumaki', favor: ['uzumaki', 'orbs'], aura: 0x5a2aff }],
  gojoMemory: [{ open: 'red', line: 'Reversal: Red', favor: ['blue', 'red'], aura: 0xff3a4a }, { open: 'purple', line: 'Hollow Purple', favor: ['purple', 'blink'], aura: 0xa04aff }],
};
