// Cursed spirits, bosses and shikigami: the kinds and the one place that builds them. The models are in
// creaturesHumanoid.ts, creaturesBeasts.ts and creaturesLate.ts, their shared parts in creatureParts.ts.
import { ModelHandle } from './model';
import { clamp } from '../../core/util';
export { Creature } from './creatureParts';
import { buildLanky, buildGlutton, buildWretch, buildFingerBearer, buildTransfigured, buildHanami, buildJogo, buildMahoraga, buildRika, buildDummy } from './creaturesHumanoid';
import { flyHead, crawler, womb, quadruped, serpent, nue, toad, rabbit, leech, rootCurse, bud, cursedHand, fish, pumpkin, dagon } from './creaturesBeasts';
import { buildKechizu, buildEso, buildRiverCurse, bloodFetus, barrierCurse, roach, buildManipCurse, rainbowDragon, smallpox, naoyaCurse } from './creaturesLate';

export type CreatureKind =
  | 'flyhead' | 'crawler' | 'lanky' | 'glutton' | 'womb' | 'wretch' | 'hound' | 'fingerBearer'
  | 'transfigured' | 'bloated' | 'leech' | 'rootCurse' | 'bud' | 'hanami' | 'hand' | 'fish'
  | 'pumpkin' | 'dagon' | 'jogo' | 'mahoraga' | 'dummy'
  | 'dogWhite' | 'dogBlack' | 'nue' | 'toad' | 'elephant' | 'rabbit' | 'serpent' | 'ox' | 'totality' | 'rika'
  | 'kechizu' | 'eso' | 'riverCurse' | 'bloodFetus' | 'barrierCurse' | 'roach' | 'manipCurse'
  | 'rainbowDragon' | 'smallpox' | 'naoyaCurse';

let seedCounter = 1;

export function buildCreature(kind: CreatureKind): ModelHandle {
  switch (kind) {
    case 'flyhead': return flyHead();
    case 'crawler': return crawler();
    case 'lanky': return buildLanky();
    case 'glutton': return buildGlutton();
    case 'womb': return womb();
    case 'wretch': return buildWretch();
    case 'fingerBearer': return buildFingerBearer();
    case 'transfigured': return buildTransfigured(seedCounter++);
    case 'bloated': return buildTransfigured(seedCounter++, true);
    case 'leech': return leech();
    case 'rootCurse': return rootCurse();
    case 'bud': return bud();
    case 'hanami': return buildHanami();
    case 'hand': return cursedHand();
    case 'fish': return fish();
    case 'pumpkin': return pumpkin();
    case 'dagon': return dagon();
    case 'jogo': return buildJogo();
    case 'mahoraga': return buildMahoraga();
    case 'rika': return buildRika();
    case 'dummy': return buildDummy();
    case 'kechizu': return buildKechizu();
    case 'eso': return buildEso();
    case 'riverCurse': return buildRiverCurse();
    case 'bloodFetus': return bloodFetus();
    case 'barrierCurse': return barrierCurse();
    case 'roach': return roach();
    case 'manipCurse': return buildManipCurse();
    case 'rainbowDragon': return rainbowDragon();
    case 'smallpox': return smallpox();
    case 'naoyaCurse': return naoyaCurse();
    case 'hound': return quadruped({ bodyLen: 0.8, bodyR: 0.24, legLen: 0.42, legR: 0.05, neck: 0.18, headR: 0.17, snout: 0.16, ears: 'pointy', tail: 'long', color: 0x2c2430, belly: 0x3a3040, dark: 0x16121a, eye: 0xff3a2a, eyeGlow: 1.5, spikes: true });
    case 'dogWhite': return quadruped({ bodyLen: 0.9, bodyR: 0.25, legLen: 0.45, legR: 0.055, neck: 0.2, headR: 0.18, snout: 0.17, ears: 'pointy', tail: 'long', color: 0xf3f3f6, belly: 0xffffff, dark: 0xc8c8d0, eye: 0x3a2a2a, eyeGlow: 0.2, mask: 0x2a2a3a });
    case 'dogBlack': return quadruped({ bodyLen: 0.9, bodyR: 0.25, legLen: 0.45, legR: 0.055, neck: 0.2, headR: 0.18, snout: 0.17, ears: 'pointy', tail: 'long', color: 0x1e1e26, belly: 0x2a2a34, dark: 0x101016, eye: 0xd8d8f0, eyeGlow: 0.6, mask: 0xd8d8e0 });
    case 'elephant': return quadruped({ bodyLen: 1.6, bodyR: 0.62, legLen: 0.75, legR: 0.17, neck: 0.1, headR: 0.42, snout: 0, ears: 'elephant', tail: 'short', trunk: true, color: 0x7e8a9c, belly: 0x9aa6b4, dark: 0x5a6676, eye: 0x111111, eyeGlow: 0, mask: 0x2a2a3a });
    case 'nue': return nue();
    case 'toad': return toad();
    case 'rabbit': return rabbit();
    case 'serpent': return serpent();
    case 'ox': return quadruped({ bodyLen: 1.5, bodyR: 0.5, legLen: 0.62, legR: 0.12, neck: 0.12, headR: 0.34, snout: 0.22, ears: 'none', tail: 'long', horns: 0xe8dcc0, color: 0x2a2630, belly: 0x3a3442, dark: 0x16131c, eye: 0xffb04a, eyeGlow: 1.5, mask: 0xe8e4f0 });
    case 'totality': return quadruped({ bodyLen: 1.8, bodyR: 0.5, legLen: 0.85, legR: 0.11, neck: 0.32, headR: 0.36, snout: 0.34, ears: 'pointy', tail: 'long', color: 0x1c1c24, belly: 0xe8e8f0, dark: 0x101016, eye: 0xffffff, eyeGlow: 1.2, spikes: true, mask: 0xf0f0f6 });
  }
}

export { clamp };
