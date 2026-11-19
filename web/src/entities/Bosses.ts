// Boss attack patterns. Each boss is a small move-set with telegraphs, phases and, for the special grades,
// a domain expansion the player can clash with. The machinery is in bossBase.ts, the scripts in
// bossesStory.ts, bossesLate.ts and bossesWorld.ts, and each boss's stage moves in bossStages.ts.
import type { Enemy } from './Enemy';
import { pick } from '../core/util';
import { Glutton, FingerBearer, Mahito, Todo, Hanami, Dagon, Jogo, Sukuna, Mahoraga, Choso } from './bossesStory';
import { Kechizu, Eso, YujiRival, Yuta, Naoya, Higuruma, Kashimo, Ishigori, Uro, Uraume, Kenjaku, SukunaTrue } from './bossesLate';
import { Smallpox, RainbowDragon, Kuchisake, NaoyaCurse, Toji, Geto, GojoMemory } from './bossesWorld';
export type { BossScript } from './bossBase';
import type { BossScript } from './bossBase';

export function createBoss(id: string, e: Enemy): BossScript | null {
  switch (id) {
    case 'glutton': return new Glutton(e);
    case 'fingerBearer': return new FingerBearer(e);
    case 'mahito': return new Mahito(e);
    case 'todo': return new Todo(e);
    case 'hanami': return new Hanami(e);
    case 'dagon': return new Dagon(e);
    case 'jogo': return new Jogo(e);
    case 'sukuna': return new Sukuna(e);
    case 'mahoraga': return new Mahoraga(e);
    case 'choso': return new Choso(e);
    case 'kechizu': return new Kechizu(e);
    case 'eso': return new Eso(e);
    case 'yuta': return new Yuta(e);
    case 'yujiRival': return new YujiRival(e);
    case 'naoya': return new Naoya(e);
    case 'higuruma': return new Higuruma(e);
    case 'kashimo': return new Kashimo(e);
    case 'ishigori': return new Ishigori(e);
    case 'uro': return new Uro(e);
    case 'uraume': return new Uraume(e);
    case 'kenjaku': return new Kenjaku(e);
    case 'sukunaTrue': return new SukunaTrue(e);
    case 'smallpox': return new Smallpox(e);
    case 'rainbowDragon': return new RainbowDragon(e);
    case 'kuchisake': return new Kuchisake(e);
    case 'naoyaCurse': return new NaoyaCurse(e);
    case 'toji': return new Toji(e);
    case 'geto': return new Geto(e);
    case 'gojoMemory': return new GojoMemory(e);
  }
  return null;
}

export { pick };
