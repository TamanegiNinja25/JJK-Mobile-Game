// Every playable area, built from props and buildings. North is -Z (top of screen).
import { MapDef } from './MapBuilder';
import { PlayerState } from '../rpg/PlayerState';
import { QUEST_BY_ID } from '../data/story';
import { INTERIORS } from './interiors';

const done = (id: string) => (ps: PlayerState) => ps.questState(id)?.state === 'done';
const active = (id: string) => (ps: PlayerState) => !!ps.questState(id) && ps.questState(id)!.state !== 'done';
const objDone = (id: string, i: number) => (ps: PlayerState) => { const q = QUEST_BY_ID[id]; return !!ps.questState(id) && ps.objectiveDone(q, i); };
/** Gojo is away from the end of Shibuya (sealed in the Prison Realm) until he is released, and gone after Shinjuku. */
const gojoAround = (ps: PlayerState) => !done('m14')(ps) || (!!ps.questState('m22') && !done('m23')(ps));
/** From Gojo's return until the final battle, Sukuna holds Megumi's body. */
const megumiTaken = (ps: PlayerState) => !!ps.questState('m22') && !done('m26')(ps);

// ============================================================================
// Sugisawa Third High — night
// ============================================================================
const sugisawa: MapDef = {
  id: 'sugisawa', name: 'Sugisawa Third High', jp: '杉沢第三高校', size: [64, 72], night: true,
  lighting: { sky: 0x5a6aa0, ground: 0x22222e, hemiIntensity: 1.15, sun: 0xa8bcff, sunIntensity: 1.25, sunDir: [0.4, 1, -0.4], ambient: 0x7a8ab8, ambientIntensity: 0.3, playerLight: 2.2, fog: 0x101428, fogNear: 26, fogFar: 70, bg: 0x0a0c1a, bloom: 0.55, exposure: 1.0 },
  music: 'sugisawa', ambience: ['crickets', 'wind'], weather: 'none', levelRange: [1, 6],
  terrain: {
    kinds: ['darkGrass', 'tile', 'dirt', 'asphalt'], scales: [0.18, 0.22, 0.2, 0.15],
    paint: (p) => {
      p.rect(1, 0, 11, 34, 18, 0.5);        // courtyard
      p.rect(1, 0, 24, 6, 12, 0.4);         // gate path
      p.rect(1, 0, 0.6, 5, 4.4, 0.3);       // school entrance
      p.rect(1, 22, -6, 7, 26, 0.5);        // east passage
      p.rect(3, 0, 33, 64, 4, 0.3);         // street outside the gate
      p.circle(2, 0, -24, 12, 1.0);         // sports field track
      p.circle(0, 0, -24, 7, 0.6, 0.2);     // grass infield
      p.rect(1, -20, 6, 12, 18, 0.3);       // gym apron
      p.patches(2, 0.08, 0.62, 0.7);
    },
  },
  surfaces: ['grass', 'stone', 'dirt', 'concrete'],
  spawn: { x: 0, z: 27, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 11, 34, 18).keepClear(0, 24, 6, 12).keepClear(22, -6, 7, 26).keepClear(0, -24, 24, 24);
    b.building('schoolBuilding', 0, -6, 0);
    b.building('gym', -22, 8, 1);
    // gate + perimeter
    b.prop('wallConcrete', -5, 30.5, 0).prop('wallConcrete', 5, 30.5, 0);
    b.wall('wallConcrete', -32, 30.5, -7, 30.5).wall('wallConcrete', 7, 30.5, 32, 30.5);
    b.wall('wallConcrete', -32, -36, 32, -36).wall('wallConcrete', -32, -36, -32, 30.5).wall('wallConcrete', 32, -36, 32, 30.5);
    b.prop('streetLamp', -4, 28, Math.PI).prop('streetLamp', 4, 28, 0);
    b.row('streetLamp', -14, 18, 14, 18, 7, Math.PI / 2);
    b.prop('streetLamp', 19, 2, 0).prop('streetLamp', 25, -10, Math.PI);
    b.prop('floodLight', -12, -34, 0).prop('floodLight', 12, -34, 0);
    // courtyard dressing
    for (const x of [-12, -6, 6, 12]) b.prop('sakura', x, 15.5);
    b.prop('bench', -9, 8, 0).prop('bench', 9, 8, 0).prop('bench', 0, 14, Math.PI);
    b.prop('bikeRack', 12, 0.5, 0).prop('vendingRed', -8, 0.2, 0).prop('vendingBlue', -6.8, 0.2, 0);
    b.prop('signboard', 3, 21, 0).prop('postBox', -3, 30, 0);
    b.prop('carBlack', -9, 34, Math.PI / 2);
    // field
    b.prop('goal', 0, -33, 0).prop('goal', 0, -15, Math.PI);
    b.prop('bench', -12, -24, Math.PI / 2).prop('bench', 12, -24, -Math.PI / 2);
    b.scatter(['roundTree', 'darkTree', 'pine'], -27, -16, 8, 36, 10);
    b.scatter(['roundTree', 'darkTree'], 28, 14, 6, 26, 6);
    b.scatter(['bush', 'flowerBush'], 0, 18, 30, 4, 6);
    b.decor('grass', 0, -24, 60, 24, 70);
    b.decor('grass', -26, 10, 10, 40, 30);
    b.scatter(['rock1', 'rock3'], 25, -28, 10, 10, 4);
    // NPCs
    b.npc({ id: 'gojo', x: 3, z: 24, facing: Math.PI, cond: (ps) => ps.questState('m3')?.state !== 'done' });
    b.npc({ id: 'ijichi', x: -6, z: 27, facing: Math.PI, shop: 'travel', cond: done('m2') });
    b.portal({ x: -10.5, z: 27.5, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    // curses
    b.spawner({ enemies: [{ id: 'flyhead', w: 3 }, { id: 'crawler', w: 2 }], x: 0, z: 9, w: 28, d: 12, count: 7, respawn: 9, level: [1, 3] });
    b.spawner({ enemies: [{ id: 'crawler' }, { id: 'lanky' }], x: 23, z: -6, w: 6, d: 22, count: 5, respawn: 10, level: [3, 5] });
    b.spawner({ enemies: [{ id: 'lanky', w: 2 }, { id: 'flyhead' }, { id: 'crawler' }], x: -2, z: -24, w: 40, d: 18, count: 7, respawn: 11, level: [4, 6] });
    b.spawner({ enemies: [{ id: 'flyhead' }, { id: 'crawler' }], x: -26, z: -12, w: 8, d: 20, count: 4, respawn: 12, level: [2, 4] });
    b.boss({ id: 'glutton', x: 0, z: -24, r: 10, quest: 'm2', intro: [
      { who: 'narrator', text: 'Something enormous is crouched in the middle of the field, gnawing on a goalpost. Its belly opens like a second mouth.' },
      { who: 'player', text: 'Okay. That\'s… a lot of teeth.', only: ['yuji'] },
      { who: 'player', text: 'It already absorbed some of the finger\'s energy. Stay sharp.', only: ['megumi'] },
      { who: 'player', text: 'Ugh, it\'s drooling. I\'m going to nail its face shut.', only: ['nobara'] },
    ] });
    b.portal({ x: 0, z: 32.5, r: 2.2, to: 'hub', toX: 0, toZ: 26, label: 'Jujutsu High (Ijichi\'s car)', cond: 'm2', condText: 'Gojo: "Not yet! There\'s a finger to find first."' });
    b.portal({ x: 0, z: -0.8, r: 1.0, to: 'sugisawaIn', label: 'School building', style: 'door', cond: 'm1', condText: 'Gojo: "Courtyard first. Then we go inside."' });
  },
};

// ============================================================================
// Tokyo Jujutsu High — hub town
// ============================================================================
const hub: MapDef = {
  id: 'hub', name: 'Tokyo Jujutsu High', jp: '東京都立呪術高等専門学校', size: [76, 80], night: false, town: true,
  lighting: { sky: 0xfff0e2, ground: 0x6a5a40, hemiIntensity: 1.3, sun: 0xffe0b4, sunIntensity: 2.8, sunDir: [-0.55, 0.85, 0.6], ambient: 0xffffff, ambientIntensity: 0.12, fog: 0xf0d4bc, fogNear: 46, fogFar: 120, bg: 0xf0c6a4, bloom: 0.35, exposure: 1.0 },
  music: 'hub', ambience: ['birds', 'wind', 'leaves'], weather: 'sakura', levelRange: [1, 50],
  terrain: {
    kinds: ['grass', 'stone', 'gravel', 'sand'], scales: [0.18, 0.2, 0.25, 0.2],
    paint: (p) => {
      p.rect(1, 0, 8, 5, 52, 0.4);           // main approach
      p.rect(1, 0, -16, 22, 8, 0.4);          // hall forecourt
      p.circle(2, 0, 2, 9, 0.8);              // plaza
      p.rect(1, -10, 4, 18, 3.5, 0.3);        // west path
      p.rect(1, -19, -1.2, 3, 10.5, 0.3);      // path to the dorm door
      p.rect(1, 10, 4, 18, 3.5, 0.3);         // east path
      p.rect(3, 19, 14, 14, 12, 0.6);         // training ground
      p.rect(2, -18, -8, 8, 22, 0.5);
      p.rect(2, 19, -8, 8, 22, 0.5);
      p.patches(2, 0.07, 0.66, 0.5);
    },
  },
  surfaces: ['grass', 'stone', 'dirt', 'dirt'],
  spawn: { x: 0, z: 24, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 8, 6, 54).keepClear(0, -16, 24, 8).keepClear(0, 2, 18, 18).keepClear(19, 14, 15, 13).keepClear(-10, 4, 18, 4).keepClear(10, 4, 18, 4);
    b.building('templeHall', 0, -27, 0);
    b.building('dorm', -24, -6, 1);
    b.portal({ x: -20.1, z: -6, r: 1.0, to: 'dormIn', label: 'First-year dorm', style: 'door', rot: Math.PI / 2 });
    b.building('classroom', 25, -6, 3);
    b.building('infirmary', -22, 13, 1);
    b.building('pagoda', 26, -28, 0);
    b.building('koiPond', -20, 27, 0);
    b.building('storehouse', -26, -26, 0);
    b.prop('toriiBig', 0, 32, 0);
    b.prop('torii', 0, -18.5, 0);
    for (let z = 28; z >= -14; z -= 5) { b.prop('stoneLantern', -3.6, z); b.prop('stoneLantern', 3.6, z); }
    b.prop('bell', -14, -24, 0).prop('well', 9, -15, 0).prop('shrineSmall', -30, 4, Math.PI / 2);
    b.prop('signboard', 3, 8, -0.3);
    for (let i = 0; i < 4; i++) b.prop('trainingPost', 14 + i * 3, 19.5);
    b.prop('crate', 25, 18).prop('barrel', 26, 16.5).prop('crate', 25, 10, 0.4);
    b.prop('bench', -8, 9, 0).prop('bench', 8, 9, 0).prop('bench', -14, 22, Math.PI / 2);
    b.prop('carBlack', 8, 30, 0.2).prop('vendingRed', -6, 20, Math.PI / 2).prop('vendingWhite', -6, 21.2, Math.PI / 2);
    b.prop('paperLantern', -9, -18, 0).prop('paperLantern', 9, -18, Math.PI);
    // vegetation
    b.scatter('sakura', 0, 0, 70, 74, 18, { minDist: 4 });
    b.scatter(['bamboo'], -32, -10, 6, 30, 6);
    b.scatter(['cedar', 'pine'], 30, 18, 8, 26, 6);
    b.scatter(['flowerBush', 'bush'], 0, 0, 68, 70, 22);
    b.decor(['grass', 'fern'], 0, 0, 72, 76, 160);
    b.decor('lilyPad', -20, 27, 7, 5, 8);
    b.decor('koi', -20, 27, 6, 4, 6);
    b.border(['cedar', 'pine', 'roundTree', 'bamboo'], 1.5, 3, 1, [{ x: 0, z: 38, r: 4 }]);
    b.scatter('rock2', -30, 20, 8, 16, 3);
    // people
    b.npc({ id: 'gojo', x: 3, z: 3, facing: Math.PI * 0.9, cond: (ps) => (ps.questState('m3')?.state === 'done' || active('m3')(ps)) && gojoAround(ps) });
    b.npc({ id: 'yuta', x: 6.5, z: 1, facing: -Math.PI * 0.6, cond: done('m15') });
    b.npc({ id: 'yaga', x: 0, z: -16, facing: Math.PI, shop: 'workshop' });
    b.npc({ id: 'mechamaru', x: -19.5, z: -21.5, facing: Math.PI * 0.75, shop: 'reforge', cond: done('m3') });
    b.npc({ id: 'shoko', x: -16.5, z: 13, facing: -Math.PI / 2, shop: 'potions' });
    b.npc({ id: 'maki', x: 13, z: 11, facing: Math.PI, shop: 'armory' });
    b.npc({ id: 'panda', x: -13, z: 24, facing: Math.PI / 2 });
    b.npc({ id: 'inumaki', x: -12, z: 26.5, facing: Math.PI / 2 });
    b.npc({ id: 'ijichi', x: 6, z: 27.5, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 11.5, z: 26, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'meimei', x: 20, z: -21, facing: Math.PI, shop: 'exchange', cond: done('m6') });
    b.npc({ id: 'yuji', x: -5, z: 6, facing: Math.PI / 3, cond: (ps) => ps.d.cls !== 'yuji' });
    b.npc({ id: 'megumi', x: -7, z: 3.5, facing: Math.PI / 2, cond: (ps) => ps.d.cls !== 'megumi' && !megumiTaken(ps) });
    b.npc({ id: 'nobara', x: -3.5, z: 2.5, facing: -Math.PI / 4, cond: (ps) => ps.d.cls !== 'nobara' });
    b.dummy(15.5, 14).dummy(19, 13).dummy(22.5, 14.5);
  },
};

// ============================================================================
// Eishu Juvenile Detention Center — rain
// ============================================================================
const eishu: MapDef = {
  id: 'eishu', name: 'Eishu Juvenile Detention Center', jp: '英集少年院', size: [64, 72], night: true,
  lighting: { sky: 0x6a7c8a, ground: 0x2a3236, hemiIntensity: 1.45, sun: 0xa8bccc, sunIntensity: 1.25, sunDir: [-0.3, 1, -0.4], ambient: 0x8a9aa6, ambientIntensity: 0.45, playerLight: 3, fog: 0x1a2428, fogNear: 20, fogFar: 56, bg: 0x10161a, bloom: 0.6, exposure: 1.05 },
  music: 'eishu', ambience: ['rain', 'hum'], weather: 'rain', levelRange: [7, 13],
  terrain: {
    kinds: ['concrete', 'asphalt', 'mud', 'flesh'], scales: [0.15, 0.15, 0.2, 0.2],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 14, 40, 26, 0.5);
      p.patches(2, 0.1, 0.6, 0.8);
      p.circle(3, 0, -24, 10, 3, 0.8);
      p.rect(1, -12, 16, 8, 4, 0.4);          // walkway to the admin block
    },
  },
  surfaces: ['concrete', 'concrete', 'dirt', 'flesh'],
  spawn: { x: 0, z: 29, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 14, 16, 30).keepClear(0, -24, 22, 22);
    b.building('prisonAdmin', -20, 16, 1);
    b.portal({ x: -14.9, z: 16, r: 1.0, to: 'eishuIn', label: 'Admin block', style: 'door', rot: Math.PI / 2 });
    b.building('prisonBlock', 19, 14, 3);
    b.building('prisonBlock', -20, -2, 1);
    b.building('guardTower', -26, 30, 0);
    b.building('guardTower', 26, 30, 0);
    b.building('guardTower', 26, -6, 0);
    b.building('wombGrowth', 0, -24, 0);
    b.wall('wallBarbed', -32, 33, -4, 33).wall('wallBarbed', 4, 33, 32, 33);
    b.wall('wallBarbed', -32, -40, 32, -40).wall('wallBarbed', -32, -40, -32, 33).wall('wallBarbed', 32, -40, 32, 33);
    b.wall('wallBarbed', -32, -10, -4, -10).wall('wallBarbed', 4, -10, 32, -10);
    b.prop('floodLight', -10, 24, 0).prop('floodLight', 10, 4, 0).prop('floodLight', -6, -6, 0).prop('floodLight', 12, -14, 0);
    b.prop('fenceMetal', -2, 33, 0);
    b.prop('van', 6, 36, Math.PI / 2).prop('carBlack', -8, 36.5, Math.PI / 2);
    b.scatter(['cocoon'], 0, -24, 22, 18, 6, { minDist: 4 });
    b.scatter(['deadTree'], 0, 0, 56, 60, 8, { minDist: 5 });
    b.scatter(['barrel', 'crate', 'trafficCone', 'barricade'], 0, 10, 48, 30, 12);
    b.decor('grassDry', 0, 0, 60, 70, 60);
    for (let i = 0; i < 9; i++) b.water(-14 + (i % 3) * 14 + (i * 3.7 % 5), 22 - Math.floor(i / 3) * 12 + (i * 2.3 % 4), 2.5 + (i % 2), 1.8, 0x23303a, false);
    b.npc({ id: 'ijichi', x: -5, z: 29, facing: Math.PI, shop: 'travel' });
    b.portal({ x: -9.5, z: 29, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.spawner({ enemies: [{ id: 'womb', w: 2 }, { id: 'hound', w: 2 }], x: 0, z: 14, w: 36, d: 24, count: 8, respawn: 10, level: [7, 9] });
    b.spawner({ enemies: [{ id: 'hound' }, { id: 'wretch' }], x: 4, z: -1, w: 22, d: 10, count: 5, respawn: 11, level: [9, 11] });
    b.spawner({ enemies: [{ id: 'wretch', w: 2 }, { id: 'womb' }], x: 0, z: -24, w: 36, d: 20, count: 6, respawn: 12, level: [10, 12] });
    b.boss({ id: 'fingerBearer', x: 0, z: -25, r: 11, quest: 'm5', intro: [
      { who: 'narrator', text: 'The air in the inner block is thick and wet. The womb has burst — and something tall is unfolding from it.' },
      { who: 'narrator', text: 'It turns its head. Four eyes. All of them looking at you.' },
      { who: 'player', text: '…This is a Special Grade. Okay. Okay. We do this.', only: ['yuji'] },
      { who: 'player', text: 'If I fall back, it follows me out. No retreat then.', only: ['megumi'] },
      { who: 'player', text: 'My hands are shaking. Good. That means I\'m awake.', only: ['nobara'] },
    ] });
  },
};

// ============================================================================
// Kawasaki — city at dusk
// ============================================================================
const kawasaki: MapDef = {
  id: 'kawasaki', name: 'Kawasaki City', jp: '川崎市', size: [72, 76], night: false,
  lighting: { sky: 0xffd2b8, ground: 0x4a3a40, hemiIntensity: 1.25, sun: 0xffb888, sunIntensity: 2.1, sunDir: [0.75, 0.6, 0.3], ambient: 0xffe0d0, ambientIntensity: 0.2, fog: 0xc88070, fogNear: 30, fogFar: 78, bg: 0xd8906c, bloom: 0.55, exposure: 1.05 },
  music: 'kawasaki', ambience: ['city', 'wind'], weather: 'none', levelRange: [13, 18],
  terrain: {
    kinds: ['grass', 'concrete', 'dirt', 'asphalt'], scales: [0.18, 0.2, 0.2, 0.15],
    paint: (p) => {
      p.fill(1);
      p.rect(3, 0, 4, 72, 9, 0.2);
      p.rect(3, 0, -8, 9, 64, 0.2);
      p.rect(0, -20, 22, 26, 18, 0.6);
      p.rect(2, -20, 22, 8, 3, 0.4);
      p.rect(0, 22, 27, 30, 8, 0.6);
      p.patches(0, 0.15, 0.7, 0.4);
      p.rect(3, -16, -5.2, 5, 4, 0.2);        // cinema forecourt
    },
  },
  surfaces: ['grass', 'concrete', 'dirt', 'concrete'],
  spawn: { x: 4, z: 29, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 4, 72, 10).keepClear(0, -8, 10, 64).keepClear(14, 22, 40, 8);
    b.building('theater', -16, -12, 0);
    b.portal({ x: -16, z: -6.9, r: 1.0, to: 'theaterIn', label: 'Cinema', style: 'door' });
    b.building('shopRow', 17, -12, 0, { seed: 2 });
    b.building('apartment', -27, -30, 0);
    b.building('office', 15, -30, 0);
    b.building('shopRow', 31, -14, 3, { seed: 5 });
    b.building('house', -30, -10, 1, { seed: 3 });
    b.building('canal', 14, 22, 0);
    // road dressing
    for (let x = -34; x <= 34; x += 4) if (Math.abs(x) > 6) b.decal(x, 4, 2, 0.18, 0xf0f0e0);
    for (let z = -38; z <= 30; z += 4) if (Math.abs(z - 4) > 6) b.decal(0, z, 0.18, 2, 0xf0f0e0);
    b.crosswalk(-7, 4, 8, 3.5, Math.PI / 2).crosswalk(7, 4, 8, 3.5, Math.PI / 2).crosswalk(0, -3, 8, 3.5, 0).crosswalk(0, 11, 8, 3.5, 0);
    b.prop('trafficLight', -5.5, -1.5, 0).prop('trafficLight', 5.5, 9.5, Math.PI);
    b.row('utilityPole', -32, -1, 32, -1, 9, 0);
    b.row('streetLampWarm', -30, 10, 30, 10, 10, Math.PI);
    b.prop('carWhite', -14, 6.5, Math.PI / 2).prop('carRed', 18, 2, -Math.PI / 2).prop('van', 26, 6.5, Math.PI / 2).prop('carBlue', -3, -20, 0);
    b.prop('vendingRed', -8, -6, 0).prop('vendingWhite', -6.8, -6, 0).prop('vendingBlue', 9, -6, 0).prop('postBox', -4, -5.5, 0);
    b.prop('trafficCone', 2.5, -14).prop('trafficCone', 3.5, -15).prop('barricade', 3, -16.5, 0);
    // park + river
    b.scatter(['roundTree', 'autumnTree'], -20, 22, 24, 16, 9, { minDist: 3 });
    b.prop('bench', -24, 18, 0).prop('bench', -16, 26, Math.PI).prop('bench', 4, 18, Math.PI);
    b.scatter(['bush', 'flowerBush'], -20, 22, 24, 16, 6);
    b.decor('grass', -20, 22, 24, 16, 40);
    b.wall('fenceMetal', -6, 18.5, 34, 18.5, 2);
    b.border(['roundTree', 'autumnTree'], 1.5, 3.2, 1, [{ x: 0, z: 38, r: 6 }, { x: 0, z: 4, r: 6 }, { x: 36, z: 4, r: 6 }, { x: -36, z: 4, r: 6 }]);
    b.npc({ id: 'nanami', x: -10, z: -3.5, facing: Math.PI });
    b.npc({ id: 'junpei', x: 4, z: 17, facing: 0, pose: 'sit' });
    b.npc({ id: 'ijichi', x: 8, z: 29, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 12.5, z: 29, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.spawner({ enemies: [{ id: 'transfigured', w: 2 }, { id: 'bloated' }], x: 0, z: 4, w: 60, d: 8, count: 8, respawn: 10, level: [13, 16] });
    b.spawner({ enemies: [{ id: 'leech' }, { id: 'transfigured' }], x: -20, z: 22, w: 22, d: 14, count: 5, respawn: 11, level: [13, 15] });
    b.spawner({ enemies: [{ id: 'bloated' }, { id: 'transfigured', w: 2 }, { id: 'leech' }], x: 0, z: -24, w: 10, d: 28, count: 6, respawn: 12, level: [15, 18] });
    b.portal({ x: -9, z: 25, r: 2, to: 'sewer', toX: 0, toZ: 18, label: 'Sewer entrance', cond: 'm7', condText: 'A rusted grate. You have no reason to go down there yet.' });
  },
};

// ============================================================================
// Kawasaki Sewers
// ============================================================================
const sewer: MapDef = {
  id: 'sewer', name: 'Kawasaki Underground', jp: '川崎地下水路', size: [48, 56], night: true,
  lighting: { sky: 0x5a7a6a, ground: 0x1a2a1e, hemiIntensity: 1.2, sun: 0x8aaa9a, sunIntensity: 0.8, sunDir: [0.2, 1, 0.2], ambient: 0x6a8a7a, ambientIntensity: 0.4, playerLight: 3, fog: 0x0a120e, fogNear: 16, fogFar: 46, bg: 0x050806, bloom: 0.7, exposure: 1.1 },
  music: 'sewer', ambience: ['drips', 'hum'], weather: 'drips', levelRange: [15, 19],
  terrain: {
    kinds: ['sewer', 'concrete', 'mud', 'tile'], scales: [0.2, 0.2, 0.2, 0.25],
    paint: (p) => { p.fill(0); p.patches(2, 0.12, 0.6, 0.7); p.circle(3, 0, -14, 10, 1.5, 0.5); },
  },
  surfaces: ['concrete', 'concrete', 'water', 'stone'],
  spawn: { x: 0, z: 20, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, -14, 22, 22);
    b.wall('wallConcrete', -24, 26, 24, 26).wall('wallConcrete', -24, -28, 24, -28).wall('wallConcrete', -24, -28, -24, 26).wall('wallConcrete', 24, -28, 24, 26);
    b.water(-12, 6, 6, 30, 0x2a4a2a).water(12, 6, 6, 30, 0x2a4a2a);
    for (const z of [18, 8, -2]) { b.prop('pipe', -12, z, Math.PI / 2); b.prop('pipe', 12, z, Math.PI / 2); }
    b.scatter(['barrel', 'crate'], 0, 4, 14, 26, 6);
    for (const [x, z] of [[-6, 16], [6, 6], [-6, -4], [6, -20], [-8, -22], [18, -20], [-18, -18]]) b.light(x, 2.6, z, 0x6aff9a, 6, 9, true);
    b.row('streetLamp', -20, 20, -20, -20, 10, Math.PI / 2);
    b.scatter('cocoon', 0, -14, 20, 16, 3, { minDist: 5 });
    b.npc({ id: 'nanami', x: 4, z: 21, facing: Math.PI, cond: active('m8') });
    b.spawner({ enemies: [{ id: 'leech', w: 2 }, { id: 'transfigured' }], x: 0, z: 6, w: 14, d: 26, count: 6, respawn: 11, level: [15, 18] });
    b.spawner({ enemies: [{ id: 'leech' }], x: 18, z: -6, w: 8, d: 30, count: 3, respawn: 14, level: [16, 18] });
    b.boss({ id: 'mahito', x: 0, z: -15, r: 10, quest: 'm8', intro: [
      { who: 'mahito', text: 'Oh! A sorcerer came all the way down here just for me? I\'m flattered.' },
      { who: 'mahito', text: 'Do you know what a soul is? I do. I can touch it. Reshape it. Isn\'t that the most fun thing in the world?' },
      { who: 'player', text: 'Junpei told me about you. You don\'t get to treat people like toys.', only: ['yuji'] },
      { who: 'player', text: 'You talk too much for something that\'s about to be exorcised.', only: ['megumi', 'nobara'] },
      { who: 'mahito', text: 'Let\'s find out what shape YOUR soul is!' },
    ] });
    b.portal({ x: 0, z: 23.5, r: 2, to: 'kawasaki', toX: -9, toZ: 22, label: 'Back to the surface' });
  },
};

// ============================================================================
// Kyoto Goodwill Event — forest
// ============================================================================
const kyoto: MapDef = {
  id: 'kyoto', name: 'Kyoto Goodwill Forest', jp: '京都姉妹校交流会', size: [78, 84], night: false,
  lighting: { sky: 0xdaf2ff, ground: 0x3a4a2a, hemiIntensity: 1.15, sun: 0xfff4d8, sunIntensity: 2.5, sunDir: [0.35, 1, 0.45], ambient: 0xe0ffe0, ambientIntensity: 0.12, fog: 0x9ac4a0, fogNear: 26, fogFar: 72, bg: 0xa4cfae, bloom: 0.4, exposure: 1.0 },
  music: 'kyoto', ambience: ['birds', 'leaves', 'wind'], weather: 'leaves', levelRange: [19, 26],
  terrain: {
    kinds: ['moss', 'dirt', 'grass', 'stone'], scales: [0.2, 0.22, 0.18, 0.2],
    paint: (p) => {
      p.path(1, [[0, 36], [-4, 22], [-12, 8], [-6, -6], [0, -20], [0, -30]], 4);
      p.path(1, [[-4, 22], [10, 12], [24, -2]], 3.4);
      p.circle(2, -14, 4, 8, 1.2);
      p.circle(2, 0, -27, 11, 1.4);
      p.circle(3, 24, -4, 4.5, 0.8);
      p.rect(3, -22, 26, 18, 10, 0.5);
      p.patches(2, 0.08, 0.6, 0.6);
    },
  },
  surfaces: ['grass', 'dirt', 'grass', 'stone'],
  spawn: { x: 0, z: 34, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 34, 6, 8).keepClear(-14, 4, 16, 16).keepClear(0, -27, 22, 22).keepClear(24, -4, 9, 9);
    // keep the paths clear
    for (const [x, z] of [[-4, 22], [-12, 8], [-6, -6], [0, -20], [10, 12], [2, 28], [-8, 15], [-9, 1], [-3, -13], [17, 5]]) b.keepClear(x, z, 5, 5);
    b.building('kyotoHall', -24, 28, 0);
    b.prop('toriiBlack', 0, 37, 0);
    b.prop('shrineSmall', 24, -6, 0).prop('stoneLantern', 21.5, -3).prop('stoneLantern', 26.5, -3);
    b.prop('torii', 24, -0.5, 0);
    b.scatter(['cedar', 'cedar', 'pine', 'roundTree'], 0, 0, 74, 80, 70, { minDist: 2.8 });
    b.scatter(['mossRock', 'rock2', 'log'], 0, 0, 70, 76, 14, { minDist: 3 });
    b.scatter(['bamboo'], 30, 24, 14, 22, 5);
    b.decor(['fern', 'grass'], 0, 0, 76, 82, 220);
    b.water(18, 18, 3, 16, 0x3a6a6a, false);
    b.border(['cedar', 'pine'], 1.5, 2.6, 1, [{ x: 0, z: 41, r: 4 }]);
    b.npc({ id: 'ijichi', x: 4, z: 34, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 8.5, z: 34, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'miwa', x: -3, z: 30, facing: Math.PI });
    b.npc({ id: 'todo', x: -14, z: 4, facing: Math.PI, cond: (ps) => ['ready', 'done'].includes(ps.questState('m9')?.state ?? '') });
    b.pickup('miwaSword', 27, -9, 's_miwa');
    b.spawner({ enemies: [{ id: 'rootCurse' }, { id: 'bud', w: 2 }], x: 8, z: 14, w: 30, d: 16, count: 7, respawn: 11, level: [19, 21] });
    b.spawner({ enemies: [{ id: 'bud' }, { id: 'forestHound' }], x: -16, z: -12, w: 22, d: 16, count: 6, respawn: 12, level: [20, 23] });
    b.spawner({ enemies: [{ id: 'rootCurse' }, { id: 'forestHound' }, { id: 'bud' }], x: 14, z: -18, w: 22, d: 18, count: 6, respawn: 12, level: [22, 25] });
    b.boss({ id: 'todo', x: -14, z: 4, r: 8, quest: 'm9', intro: [
      { who: 'todo', text: 'So YOU are Tokyo\'s rumoured first-year. Before we fight, answer me one question.', emote: 'pointUp' },
      { who: 'todo', text: 'What kind of woman is your type?!' },
    ] });
    b.boss({ id: 'hanami', x: 0, z: -28, r: 11, quest: 'm10', cond: objDone('m10', 0), intro: [
      { who: 'hanami', text: '…Humans. You poison the earth and call it living. I only wish to return the land to those who came first.' },
      { who: 'hanami', text: 'Lie down. Let the flowers take you. It will not hurt — for long.' },
    ] });
  },
};

// ============================================================================
// Yasohachi Bridge — Saitama, after dark (Death Painting arc)
// ============================================================================
const yasohachi: MapDef = {
  id: 'yasohachi', name: 'Yasohachi Bridge', jp: '八十八橋', size: [72, 80], night: true,
  lighting: { sky: 0x7a7aaa, ground: 0x2a2e30, hemiIntensity: 1.55, sun: 0xffb898, sunIntensity: 1.45, sunDir: [-0.6, 0.6, -0.3], ambient: 0x9a9ac0, ambientIntensity: 0.45, playerLight: 2.6, fog: 0x1a1e2a, fogNear: 28, fogFar: 76, bg: 0x10121e, bloom: 0.55, exposure: 1.12 },
  music: 'yasohachi', ambience: ['crickets', 'wind'], weather: 'fireflies', levelRange: [21, 27],
  terrain: {
    kinds: ['darkGrass', 'mud', 'gravel', 'asphalt'], scales: [0.18, 0.2, 0.25, 0.15],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 0, 72, 15, 0.5);          // muddy banks either side of the river
      p.rect(2, 0, 8.5, 72, 2.5, 0.4); p.rect(2, 0, -8.5, 72, 2.5, 0.4);
      p.rect(3, 0, 31, 72, 6, 0.2);          // road along the south bank
      p.rect(3, 0, -30, 72, 6, 0.2);         // road along the north bank
      p.rect(3, 0, 19, 6, 20, 0.2); p.rect(3, 0, -19, 6, 18, 0.2);
      p.patches(1, 0.09, 0.62, 0.6);
    },
  },
  surfaces: ['grass', 'dirt', 'stone', 'concrete'],
  spawn: { x: 0, z: 33, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 0, 8, 22).keepClear(0, 31, 72, 6).keepClear(0, -30, 72, 6).keepClear(-18, 15, 18, 14).keepClear(18, -16, 18, 14);
    // the river, and the bridge everyone who died had crossed
    b.water(-19.3, 0, 33.4, 10, 0x1e2e3a).water(19.3, 0, 33.4, 10, 0x1e2e3a);
    b.building('riverBridge', 0, 0, 0);
    for (const sz of [-1, 1]) {
      b.row('reeds', -34, sz * 5.6, -4, sz * 5.6, 2.4).row('reeds', 4, sz * 5.6, 34, sz * 5.6, 2.4);
      b.scatter(['rock1', 'rock3', 'mossRock'], -20, sz * 6.8, 26, 1.5, 4).scatter(['rock1', 'rock3'], 20, sz * 6.8, 26, 1.5, 4);
    }
    // south bank: a riverside park the victims walked through
    b.row('streetLampWarm', -30, 27.5, 30, 27.5, 10, Math.PI);
    b.prop('bench', -24, 20, Math.PI).prop('bench', 10, 22, Math.PI).prop('bench', 24, 20, Math.PI);
    b.prop('vendingWhite', -5, 27, Math.PI).prop('vendingRed', -6.2, 27, Math.PI).prop('signboard', 4, 12, 0.3);
    b.scatter(['roundTree', 'darkTree', 'autumnTree'], -22, 20, 26, 10, 7, { minDist: 3.5 });
    b.scatter(['roundTree', 'darkTree'], 22, 18, 24, 12, 7, { minDist: 3.5 });
    b.decor(['grass', 'fern'], 0, 18, 70, 18, 70);
    // north bank: an old graveyard and the town beyond the road
    // the graveyard wraps around Eso's clearing; rows are placed directly so the arena stays open
    for (const z of [-24.5, -27]) b.row('grave', 8, z, 28, z, 2.6);
    for (const x of [6.5, 29.5]) b.row('grave', x, -9, x, -22, 2.6, Math.PI / 2);
    b.prop('stoneLantern', 9, -8.5).prop('stoneLantern', 27, -8.5).prop('shrineSmall', 18, -29, 0);
    b.light(9, 1.4, -8.5, 0xffc880, 5, 9, true).light(27, 1.4, -8.5, 0xffc880, 5, 9, true).light(18, 6, -16, 0x9ab0ff, 4, 16);
    b.light(-18, 6, 15, 0x9ab0ff, 3.5, 14);
    b.scatter(['pine', 'darkTree', 'deadTree'], -20, -18, 26, 12, 8, { minDist: 3.5 });
    b.decor(['grassDry', 'grass'], 0, -18, 70, 16, 60);
    for (const [x, s] of [[-26, 11], [-12, 12], [12, 13], [26, 14]] as const) b.building('house', x, -36, 0, { seed: s });
    b.row('utilityPole', -32, -26.5, 32, -26.5, 9, 0);
    b.prop('carWhite', -16, 31, Math.PI / 2).prop('van', 18, -30, -Math.PI / 2);
    b.border(['darkTree', 'pine', 'roundTree'], 1.5, 3, 1, [{ x: -35, z: 0, r: 7 }, { x: 35, z: 0, r: 7 }, { x: 0, z: 39, r: 5 }]);
    b.npc({ id: 'ijichi', x: 5, z: 33, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 33, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.spawner({ enemies: [{ id: 'riverCurse', w: 2 }, { id: 'bloodFetus' }], x: 8, z: 16, w: 40, d: 12, count: 7, respawn: 10, level: [21, 23] });
    b.spawner({ enemies: [{ id: 'riverLeech' }, { id: 'riverCurse' }], x: -8, z: -17, w: 44, d: 12, count: 7, respawn: 11, level: [22, 25] });
    b.spawner({ enemies: [{ id: 'bloodFetus', w: 2 }, { id: 'riverLeech' }], x: 0, z: 9, w: 60, d: 3, count: 4, respawn: 12, level: [23, 26] });
    b.scene({ x: 0, z: 0, r: 2.6, flag: 'scene_bridge', cond: active('m10y'), lines: [
      { who: 'narrator', text: 'Halfway across, the night goes quiet. No insects. No traffic. Just the river, far too loud.' },
      { who: 'narrator', text: 'Every victim crossed this bridge after dark. Every one of them came home with a mark on their skin.' },
      { who: 'player', text: 'So now we\'ve crossed it too. Great. Let\'s see what wants us.', only: ['yuji', 'nobara'] },
      { who: 'player', text: 'The curse only marks people who cross. It will come to us now.', only: ['megumi'] },
    ] });
    b.boss({ id: 'kechizu', x: -18, z: 15, r: 9, quest: 'm10k', intro: [
      { who: 'narrator', text: 'Something squat and wet scrabbles out of the reeds, a face crowded with eyes, blood running from its lips.' },
      { who: 'kechizu', text: 'Brother! Brother, a sorcerer! Can I eat it? Can I, can I?' },
      { who: 'player', text: 'That\'s not a curse... it\'s talking. What ARE you?', only: ['yuji'] },
      { who: 'player', text: 'A cursed womb that took on flesh. Don\'t let its blood touch you.', only: ['megumi'] },
      { who: 'player', text: 'Ugh. You\'re even uglier than the last one. And it\'s drooling. Why are they always drooling?', only: ['nobara'] },
    ] });
    b.boss({ id: 'eso', x: 18, z: -16, r: 10, quest: 'm10e', intro: [
      { who: 'narrator', text: 'On the north bank, among the graves, a tall figure waits. One half of his face is pale; the other is the green of old bruises.' },
      { who: 'eso', text: 'Kechizu was my little brother. He was stupid, and loud, and mine.' },
      { who: 'eso', text: 'My blood rots whatever it touches. I am going to let it touch every part of you.' },
    ] });
  },
};

// ============================================================================
// Zen'in Clan Estate — Kyoto, autumn night (Perfect Preparation arc)
// ============================================================================
const zenin: MapDef = {
  id: 'zenin', name: 'Zen\'in Clan Estate', jp: '禪院家', size: [76, 80], night: true,
  lighting: { sky: 0x5a6a9a, ground: 0x2a2620, hemiIntensity: 1.3, sun: 0xc8d4ff, sunIntensity: 1.3, sunDir: [0.4, 1, -0.5], ambient: 0x8a8ab8, ambientIntensity: 0.32, playerLight: 2.3, fog: 0x141826, fogNear: 28, fogFar: 78, bg: 0x0c0e1a, bloom: 0.5, exposure: 1.05 },
  music: 'zenin', ambience: ['crickets', 'leaves', 'wind'], weather: 'leaves', levelRange: [38, 46],
  terrain: {
    kinds: ['moss', 'gravel', 'stone', 'dirt'], scales: [0.2, 0.28, 0.2, 0.2],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 4, 60, 50, 0.4);          // raked gravel courtyards
      p.rect(2, 0, 20, 5, 30, 0.2);          // stone path from the gate
      p.rect(2, 0, -12, 22, 22, 0.3);        // inner courtyard
      p.rect(2, -12, 8, 20, 4, 0.2); p.rect(2, 13, 14, 18, 4, 0.2);
      p.rect(3, 0, 37.5, 76, 5, 0.3);        // lane outside the walls
      p.patches(3, 0.08, 0.66, 0.5);
    },
  },
  surfaces: ['grass', 'stone', 'stone', 'dirt'],
  spawn: { x: 0, z: 37, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 20, 6, 30).keepClear(0, -12, 24, 24).keepClear(0, 37.5, 76, 5).keepClear(-12, 8, 20, 4).keepClear(13, 14, 18, 4);
    b.building('manorGate', 0, 33.6, 0);
    b.wall('wallStone', -37, 33.6, -3.6, 33.6).wall('wallStone', 3.6, 33.6, 37, 33.6);
    b.wall('wallStone', -37, -38, 37, -38).wall('wallStone', -37, -38, -37, 33.6).wall('wallStone', 37, -38, 37, 33.6);
    b.building('manorHouse', 0, -29, 0);
    b.building('manorWing', -26, -14, 1);
    b.building('manorWing', 26, -16, 3);
    b.building('manorWing', -26, 18, 1);
    b.building('zeninStore', 27, 14, 3);
    b.portal({ x: 23.1, z: 14, r: 1.0, to: 'zeninIn', label: 'Cursed Spirit Storehouse', style: 'door', rot: -Math.PI / 2, cond: 'm16', condText: 'The storehouse doors are sealed with Zen\'in wards.' });
    b.building('koiPond', -14, 22, 0);
    for (let z = 30; z >= 6; z -= 6) { b.prop('stoneLantern', -3.4, z); b.prop('stoneLantern', 3.4, z); }
    b.prop('paperLantern', -8, -21, 0).prop('paperLantern', 8, -21, Math.PI).prop('well', 14, -2, 0).prop('bell', -14, -2, 0);
    b.prop('stoneLantern', -11, -12).prop('stoneLantern', 11, -12);
    b.scatter(['autumnTree', 'pine', 'sakura'], -22, 4, 18, 16, 7, { minDist: 4 });
    b.scatter(['autumnTree', 'pine'], 22, 2, 14, 14, 6, { minDist: 4 });
    b.scatter(['bamboo'], -32, -26, 6, 20, 5).scatter(['bamboo'], 32, 26, 6, 10, 3);
    b.scatter(['flowerBush', 'bush', 'mossRock'], 0, 0, 66, 66, 18);
    b.decor(['grass', 'fern'], 0, 0, 70, 70, 120);
    b.decor('lilyPad', -14, 22, 7, 5, 8);
    b.border(['cedar', 'pine', 'autumnTree'], 1.2, 3, 1, [{ x: 0, z: 39, r: 8 }]);
    b.npc({ id: 'ijichi', x: 5, z: 37, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 37, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'maki', x: -4, z: 29.5, facing: Math.PI, cond: (ps) => active('m16')(ps) || active('m17')(ps) });
    b.spawner({ enemies: [{ id: 'heiGuard', w: 2 }, { id: 'heiCaster' }], x: 0, z: 12, w: 30, d: 16, count: 7, respawn: 10, level: [38, 41] });
    b.spawner({ enemies: [{ id: 'heiGuard' }, { id: 'heiCaster' }], x: -20, z: -2, w: 14, d: 14, count: 5, respawn: 11, level: [40, 43] });
    b.spawner({ enemies: [{ id: 'heiCaster' }, { id: 'heiCaptain' }], x: 20, z: -2, w: 14, d: 14, count: 5, respawn: 12, level: [41, 45] });
    b.spawner({ enemies: [{ id: 'heiCaptain' }, { id: 'heiGuard', w: 2 }], x: 0, z: -18, w: 26, d: 8, count: 4, respawn: 13, level: [43, 46] });
    b.boss({ id: 'naoya', x: 0, z: -12, r: 10, quest: 'm17', intro: [
      { who: 'naoya', text: 'Maki. You came crawling home. And you brought a stray from Tokyo with you.' },
      { who: 'naoya', text: 'Projection Sorcery divides one second into twenty-four frames. I\'ve already seen how this ends. You lose. Try to make it interesting anyway.' },
      { who: 'maki', text: 'Talk all you want. You\'re slow where it counts.' },
    ] });
  },
};

// ============================================================================
// Shibuya — Halloween night
// ============================================================================
const shibuya: MapDef = {
  id: 'shibuya', name: 'Shibuya', jp: '渋谷事変', size: [84, 84], night: true,
  lighting: { sky: 0x8a6aba, ground: 0x2a2036, hemiIntensity: 1.35, sun: 0xc0a0ff, sunIntensity: 1.1, sunDir: [0.3, 1, 0.2], ambient: 0xa08ac0, ambientIntensity: 0.38, playerLight: 2.5, fog: 0x1a0e2a, fogNear: 30, fogFar: 88, bg: 0x0e0818, bloom: 0.8, exposure: 1.05 },
  music: 'shibuya', ambience: ['crowd', 'city'], weather: 'ash', levelRange: [26, 45],
  terrain: {
    kinds: ['concrete', 'asphalt', 'tile', 'stone'], scales: [0.2, 0.15, 0.22, 0.2],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 0, 34, 34, 0.2);
      p.rect(1, 0, 0, 84, 10, 0.2);
      p.rect(1, 0, 0, 10, 84, 0.2);
      p.rect(2, 0, -24, 26, 10, 0.4);
      p.rect(3, -24, 22, 22, 18, 0.4);
      p.rect(3, 24, 22, 20, 18, 0.4);
    },
  },
  surfaces: ['concrete', 'concrete', 'stone', 'stone'],
  spawn: { x: 0, z: 36, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 0, 36, 36).keepClear(0, -24, 28, 12).keepClear(-24, 22, 24, 20).keepClear(24, 22, 22, 20).keepClear(0, 36, 10, 10);
    b.building('station', 0, -36, 0);
    b.portal({ x: 0, z: -30.4, r: 1.0, to: 'stationIn', label: 'Shibuya Station', style: 'door', cond: 'm11', condText: 'A second, smaller veil seals the station entrance. Break the outer veil first.' });
    for (const [x, s] of [[-30, 1], [-15, 2], [15, 3], [30, 4]] as const) b.building('skyscraper', x, -33, 0, { seed: s });
    b.building('shopRow', -36, -8, 1, { seed: 7 });
    b.building('shopRow', 36, -8, 3, { seed: 8 });
    b.building('apartment', -36, 6, 1);
    b.building('office', 36, 8, 3);
    // the scramble
    b.crosswalk(0, -15, 14, 4, 0).crosswalk(0, 15, 14, 4, 0).crosswalk(-15, 0, 14, 4, Math.PI / 2).crosswalk(15, 0, 14, 4, Math.PI / 2);
    b.crosswalk(0, 0, 26, 3, Math.PI / 4).crosswalk(0, 0, 26, 3, -Math.PI / 4);
    for (const [x, z, r] of [[-17, -17, 0], [17, -17, Math.PI / 2], [17, 17, Math.PI], [-17, 17, -Math.PI / 2]] as const) b.prop('trafficLight', x, z, r);
    b.prop('hachiko', -9, -22, Math.PI);
    b.prop('signPink', -22, -20, 0).prop('signCyan', 22, -20, 0).prop('signGold', -22, 14, Math.PI / 2).prop('signPurple', 22, 14, -Math.PI / 2);
    b.row('streetLamp', -40, 10, -20, 10, 7, Math.PI).row('streetLamp', 20, 10, 40, 10, 7, 0);
    b.prop('carWhite', -6, 7, 0.3).prop('carRed', 9, -8, 2.0).prop('van', -11, -6, 1.2).prop('carBlack', 12, 10, -0.6).prop('carBlue', 3, 22, 0.1);
    b.scatter(['pumpkin', 'trafficCone', 'barricade', 'crate'], 0, 0, 76, 76, 26, { minDist: 2.5 });
    b.scatter(['vendingRed', 'vendingBlue', 'vendingWhite'], 0, 0, 70, 30, 6);
    b.scatter(['roundTree'], -24, 26, 16, 10, 4, { minDist: 4 });
    b.scatter(['roundTree'], 24, 26, 16, 10, 4, { minDist: 4 });
    b.wall('wallConcrete', -42, 42, 42, 42).wall('wallConcrete', -42, -42, -42, 42).wall('wallConcrete', 42, -42, 42, 42);
    b.npc({ id: 'ijichi', x: 5, z: 36, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 36, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'civilian', model: 'civilianA', x: -6, z: 32, facing: 0.5 });
    b.npc({ id: 'civilian', model: 'civilianB', x: -30, z: 30, facing: 1.2 });
    b.npc({ id: 'civilian', model: 'civilianC', x: 30, z: 30, facing: -1.2 });
    b.npc({ id: 'yuta', x: 3, z: 23, facing: Math.PI, cond: (ps) => ['ready', 'done'].includes(ps.questState('m15')?.state ?? '') });
    b.npc({ id: 'todo', x: 9, z: 31, facing: -Math.PI * 0.75, cond: done('m14') });
    b.spawner({ enemies: [{ id: 'veilAnchor' }], x: 0, z: 0, w: 60, d: 50, count: 3, respawn: 9999, level: [26, 26], cond: active('m11') });
    b.spawner({ enemies: [{ id: 'hand' }, { id: 'pumpkin' }, { id: 'shibuyaTransfig', w: 2 }], x: 0, z: 0, w: 34, d: 30, count: 9, respawn: 10, level: [26, 30] });
    b.spawner({ enemies: [{ id: 'fish', w: 2 }, { id: 'hand' }], x: 0, z: -22, w: 30, d: 10, count: 6, respawn: 11, level: [28, 31] });
    b.spawner({ enemies: [{ id: 'pumpkin' }, { id: 'shibuyaTransfig' }], x: -24, z: 22, w: 20, d: 16, count: 5, respawn: 12, level: [30, 34] });
    b.spawner({ enemies: [{ id: 'hand' }, { id: 'pumpkin' }], x: 24, z: 22, w: 20, d: 16, count: 5, respawn: 12, level: [31, 36] });
    b.boss({ id: 'dagon', x: 0, z: -24, r: 11, quest: 'm12', intro: [
      { who: 'dagon', text: '…' },
      { who: 'narrator', text: 'Seawater pours from the station exits. Something vast and red-lipped rises out of the flood, watching you with tiny black eyes.' },
    ] });
    b.boss({ id: 'jogo', x: 0, z: 0, r: 12, quest: 'm13', intro: [
      { who: 'jogo', text: 'You\'re the brats who killed Hanami\'s friends? Pathetic. Humans are a fake. Curses are the TRUE humans!' },
      { who: 'jogo', text: 'I\'ll burn you to ash, and the ash to nothing!' },
    ] });
    b.boss({ id: 'sukuna', x: -24, z: 22, r: 11, quest: 'm14', intro: [
      { who: 'sukuna', text: 'So. You\'re the one who has been collecting my fingers. Thank you for the delivery.' },
      { who: 'sukuna', text: 'I\'m in a good mood. I\'ll give you three seconds to entertain me. One.' },
      { who: 'player', text: 'You\'re not taking anyone else. Not today.' },
      { who: 'sukuna', text: 'Two… Oh, never mind. Come, brat. Show me what this era calls "strong".' },
    ] });
    b.boss({ id: 'mahito', x: 0, z: -22, r: 10, quest: 's_soul', level: 42, intro: [
      { who: 'mahito', text: 'There you are~! And you brought the big one. Did you come to watch me reshape your friend?' },
      { who: 'todo', text: 'Brother! Remember: when I clap, nothing stays where it was. Not even you.', emote: 'clap' },
      { who: 'mahito', text: 'Souls, bodies, it\'s all clay. Let\'s find out whose shape is better.' },
    ] });
    b.boss({ id: 'yuta', x: 0, z: 20, r: 9, quest: 'm15', intro: [
      { who: 'narrator', text: 'In the ruins at the heart of Shibuya, a young man in a white uniform waits with a katana across his knees. He looks exhausted.' },
      { who: 'yuta', text: 'Sorry. I was given an order, and I said I would carry it out.' },
      { who: 'yuta', text: 'Rika. Let\'s go.' },
      { who: 'narrator', text: 'A colossal curse unfolds behind him — all teeth and grasping arms, and a voice like a little girl\'s.' },
    ] });
    b.boss({ id: 'mahoraga', x: 24, z: 22, r: 11, quest: 's_mahoraga', intro: [
      { who: 'narrator', text: 'A colossal figure crouches beneath a slowly turning golden wheel. As it rises, the wheel clicks once.' },
      { who: 'yuta', text: 'Remember: it adapts. Mix up your attacks — strikes, techniques, everything.' },
    ] });
  },
};

// ============================================================================
// Tokyo Colony No. 1 — Culling Game
// ============================================================================
/** Every colony has the same barrier gate at its south edge: two anchor posts and a cleared lane. */
function colonyGate(b: import('./MapBuilder').MapBuilder, z: number) {
  b.prop('barrierPost', -6, z, 0).prop('barrierPost', 6, z, 0);
  b.light(0, 3, z, 0x9a6aff, 6, 10);
}

const colony1: MapDef = {
  id: 'colony1', name: 'Tokyo Colony No. 1', jp: '東京第1結界', size: [84, 84], night: false,
  lighting: { sky: 0xd8a890, ground: 0x3a3236, hemiIntensity: 1.3, sun: 0xffc8a0, sunIntensity: 1.9, sunDir: [-0.6, 0.6, 0.4], ambient: 0xf0d0c0, ambientIntensity: 0.2, fog: 0x8a6a6a, fogNear: 30, fogFar: 84, bg: 0x9a7272, bloom: 0.45, exposure: 1.0 },
  music: 'colony', ambience: ['city', 'wind', 'fire'], weather: 'ash', levelRange: [46, 60],
  terrain: {
    kinds: ['concrete', 'asphalt', 'dirt', 'gravel'], scales: [0.2, 0.15, 0.2, 0.25],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 0, 10, 84, 0.2);           // main avenue
      p.rect(1, 0, 4, 84, 9, 0.2);            // cross street
      p.circle(2, 0, -18, 10, 1.0);           // the plaza where Higuruma waits
      p.circle(2, 26, 22, 8, 1.2);            // scorched block (Kashimo)
      p.patches(3, 0.1, 0.62, 0.6);
    },
  },
  surfaces: ['concrete', 'concrete', 'dirt', 'stone'],
  spawn: { x: 0, z: 37, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 0, 12, 84).keepClear(0, 4, 84, 10).keepClear(0, -18, 22, 22).keepClear(26, 22, 18, 18);
    colonyGate(b, 33);
    for (const [x, z, q, s] of [[-30, -32, 0, 1], [-14, -34, 0, 2], [14, -34, 0, 3], [30, -32, 0, 4], [-34, -12, 1, 5], [34, -14, 3, 6], [-30, 22, 1, 7]] as const) b.building('ruinedTower', x, z, q, { seed: s });
    b.building('shopRow', -20, 34, 2, { seed: 11 }).building('apartment', 34, 34, 2);
    for (const x of [-34, -24, -14, 14, 24, 34]) if (Math.abs(x) > 8) b.decal(x, 4, 2, 0.18, 0xd0d0c8);
    b.crosswalk(0, -3, 8, 3, 0).crosswalk(0, 11, 8, 3, 0);
    b.prop('carBlack', -8, 7, 0.4).prop('carWhite', 9, -2, 2.2).prop('van', -10, -8, 1.4).prop('carRed', 14, 9, -0.5).prop('carBlue', 4, 20, 2.8);
    b.scatter(['rubble', 'rubbleBig', 'ruinedWall', 'barricade', 'crate'], 0, 0, 78, 78, 30, { minDist: 3 });
    b.scatter(['fireBarrel'], 0, 0, 70, 70, 7, { minDist: 9 });
    b.scatter(['deadTree', 'trafficCone', 'utilityPole'], 0, 0, 74, 74, 10, { minDist: 4 });
    b.wall('ruinedWall', -42, 42, 42, 42).wall('ruinedWall', -42, -42, 42, -42).wall('ruinedWall', -42, -42, -42, 42).wall('ruinedWall', 42, -42, 42, 42);
    b.npc({ id: 'ijichi', x: 5, z: 37, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 37, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'hakari', x: -4, z: 32, facing: Math.PI });
    b.npc({ id: 'higuruma', x: -3, z: -11, facing: Math.PI, cond: done('m19') });
    b.spawner({ enemies: [{ id: 'cgBrawler', w: 2 }, { id: 'cgCaster' }], x: 0, z: 18, w: 40, d: 18, count: 8, respawn: 10, level: [46, 50] });
    b.spawner({ enemies: [{ id: 'cgCaster' }, { id: 'barrierCurse' }], x: -22, z: 0, w: 22, d: 30, count: 6, respawn: 11, level: [48, 53] });
    b.spawner({ enemies: [{ id: 'cgBrawler' }, { id: 'barrierCurse' }, { id: 'cgCaster' }], x: 20, z: -6, w: 22, d: 22, count: 6, respawn: 11, level: [50, 55] });
    b.spawner({ enemies: [{ id: 'barrierCurse', w: 2 }, { id: 'cgBrawler' }], x: 0, z: -32, w: 50, d: 10, count: 6, respawn: 12, level: [53, 58] });
    b.scene({ x: 0, z: 29, r: 3.2, flag: 'scene_kogane', cond: active('m18'), lines: [
      { who: 'narrator', text: 'The barrier swallows you. A small golden shikigami pops into the air in front of your nose.' },
      { who: 'narrator', text: '"NEW PLAYER CONFIRMED! Welcome to the Culling Game! Killing another player earns points. Score nothing for nineteen days, and your technique is removed!"' },
      { who: 'narrator', text: '"One hundred points lets you add a new rule to the game! Good luck! Try not to die!"' },
      { who: 'player', text: 'A game where the prize is killing people. Kenjaku really thought of everything.', only: ['yuji', 'megumi'] },
      { who: 'player', text: 'I hate this shikigami. I hate its little voice.', only: ['nobara'] },
    ] });
    b.boss({ id: 'higuruma', x: 0, z: -18, r: 10, quest: 'm19', intro: [
      { who: 'higuruma', text: 'Another player who thinks this game makes murder legal. I used to defend people like you.' },
      { who: 'higuruma', text: 'I spent years watching the guilty walk free and the innocent hang. So now I hold the court myself.' },
      { who: 'player', text: 'I\'m not here for your points to save myself. I need them to bring someone back.', only: ['yuji', 'megumi'] },
      { who: 'player', text: 'A lawyer with a gavel the size of a car. Sure. Why not.', only: ['nobara'] },
      { who: 'higuruma', text: 'Then let the court decide.' },
    ] });
    b.scene({ x: 0, z: -18, r: 7, flag: 'scene_higuruma', cond: (ps) => ps.questState('m19')?.state === 'ready', lines: [
      { who: 'narrator', text: 'Higuruma lowers his gavel. The courtroom fades, and for a moment he only looks tired.' },
      { who: 'higuruma', text: 'You never lied to the court. Not once. Even when the truth could have hanged you.' },
      { who: 'player', text: 'People died in Shibuya because of what\'s inside me. I\'m not going to pretend it wasn\'t me.', only: ['yuji'] },
      { who: 'player', text: 'I made choices in Shibuya I have to live with. I won\'t dress them up.', not: ['yuji'] },
      { who: 'higuruma', text: '...I had forgotten what an honest defendant looks like. Take my points. Spend them on something worth it.' },
    ] });
    b.boss({ id: 'kashimo', x: 26, z: 22, r: 9, quest: 's_kashimo', intro: [
      { who: 'kashimo', text: 'You\'re not Sukuna. But you smell like you\'ve stood next to him. That\'s close enough — for a warm-up!' },
      { who: 'kashimo', text: 'Four hundred years I\'ve waited for a real fight. Don\'t you dare be boring!' },
    ] });
  },
};

// ============================================================================
// Sendai Colony — Culling Game
// ============================================================================
const sendai: MapDef = {
  id: 'sendai', name: 'Sendai Colony', jp: '仙台結界', size: [84, 84], night: true,
  lighting: { sky: 0x7a6a8a, ground: 0x2a2228, hemiIntensity: 1.3, sun: 0xffa070, sunIntensity: 1.4, sunDir: [0.6, 0.5, -0.4], ambient: 0xb09ab0, ambientIntensity: 0.3, playerLight: 2.2, fog: 0x2a1e24, fogNear: 28, fogFar: 80, bg: 0x1a1218, bloom: 0.6, exposure: 1.05 },
  music: 'sendai', ambience: ['fire', 'wind'], weather: 'embers', levelRange: [56, 68],
  terrain: {
    kinds: ['concrete', 'asphalt', 'mud', 'gravel'], scales: [0.2, 0.15, 0.2, 0.25],
    paint: (p) => {
      p.fill(0);
      p.rect(1, 0, 0, 10, 84, 0.25); p.rect(1, 0, 10, 84, 9, 0.25);
      for (const [x, z, r] of [[0, -16, 11], [-24, 18, 8], [22, -2, 6], [-18, -24, 5], [28, 26, 5]] as const) p.circle(2, x, z, r, 1.2);
      p.patches(3, 0.1, 0.6, 0.6);
    },
  },
  surfaces: ['concrete', 'concrete', 'dirt', 'stone'],
  spawn: { x: 0, z: 37, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 0, 12, 84).keepClear(0, 10, 84, 10).keepClear(0, -16, 24, 24).keepClear(-24, 18, 18, 18);
    colonyGate(b, 33);
    for (const [x, z, q, s] of [[-32, -32, 0, 21], [-12, -36, 0, 22], [14, -36, 0, 23], [32, -30, 0, 24], [34, -6, 3, 25], [-34, -6, 1, 26], [32, 24, 3, 27]] as const) b.building('ruinedTower', x, z, q, { seed: s });
    b.building('office', -22, 34, 2).building('shopRow', 22, 34, 2, { seed: 13 });
    b.prop('carRed', -8, 13, 0.6).prop('carBlack', 10, 6, -2.4).prop('van', 6, -30, 1.1).prop('carWhite', -14, 2, 2.0);
    b.scatter(['rubble', 'rubbleBig', 'ruinedWall', 'barricade'], 0, 0, 78, 78, 34, { minDist: 3 });
    b.scatter(['fireBarrel'], 0, 0, 70, 70, 8, { minDist: 9 });
    b.scatter(['snowPine', 'deadTree'], 0, 0, 78, 78, 10, { minDist: 6 });
    b.wall('ruinedWall', -42, 42, 42, 42).wall('ruinedWall', -42, -42, 42, -42).wall('ruinedWall', -42, -42, -42, 42).wall('ruinedWall', 42, -42, 42, 42);
    b.npc({ id: 'ijichi', x: 5, z: 37, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 37, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'yuta', x: -4, z: 32, facing: Math.PI });
    b.npc({ id: 'ishigori', x: 6, z: -10, facing: Math.PI, pose: 'sit', cond: done('m21') });
    b.spawner({ enemies: [{ id: 'roach', w: 3 }, { id: 'cgBrawler' }], x: 0, z: 18, w: 44, d: 16, count: 10, respawn: 8, level: [56, 59] });
    b.spawner({ enemies: [{ id: 'roach', w: 2 }, { id: 'roachQueen' }], x: 24, z: 4, w: 18, d: 26, count: 7, respawn: 10, level: [58, 62] });
    b.spawner({ enemies: [{ id: 'cgCaster' }, { id: 'barrierCurse' }, { id: 'cgBrawler' }], x: -24, z: -6, w: 18, d: 24, count: 6, respawn: 11, level: [59, 63] });
    b.spawner({ enemies: [{ id: 'roach', w: 2 }, { id: 'barrierCurse' }, { id: 'roachQueen' }], x: 0, z: -32, w: 56, d: 10, count: 7, respawn: 12, level: [62, 67] });
    b.scene({ x: 0, z: 26, r: 3.5, flag: 'scene_sendai', cond: active('m20'), lines: [
      { who: 'narrator', text: 'The Sendai colony is a city of craters. Whole blocks have been flattened by something that fires cursed energy like artillery.' },
      { who: 'narrator', text: 'In the rubble, the cockroaches are as big as dogs. They move like one animal.' },
    ] });
    b.boss({ id: 'ishigori', x: 0, z: -16, r: 11, quest: 'm21', intro: [
      { who: 'ishigori', text: 'FINALLY! Someone with some meat on them! Four hundred years ago I fought everyone in sight and never once felt full!' },
      { who: 'ishigori', text: 'They called me the sorcerer with the greatest output in history. Let\'s see how much of it you can swallow!' },
      { who: 'player', text: 'I don\'t have time to be your dinner. Let\'s get this over with.', only: ['yuji', 'megumi'] },
      { who: 'player', text: 'Nice hair. I\'m going to flatten it.', only: ['nobara'] },
    ] });
    b.boss({ id: 'uro', x: -24, z: 18, r: 9, quest: 's_uro', intro: [
      { who: 'uro', text: 'A thousand years ago I led the Fujiwara clan\'s Moonlit Wings. And this era sends me... you?' },
      { who: 'uro', text: 'The sky is only a surface. Let me show you what it looks like folded in half.' },
    ] });
  },
};

// ============================================================================
// Shinjuku — December 24th (Shinjuku Showdown arc)
// ============================================================================
const shinjuku: MapDef = {
  id: 'shinjuku', name: 'Shinjuku Showdown', jp: '新宿決戦', size: [90, 90], night: false,
  lighting: { sky: 0xf0b0a0, ground: 0x3a2a2e, hemiIntensity: 1.3, sun: 0xffb890, sunIntensity: 1.8, sunDir: [0.5, 0.55, 0.5], ambient: 0xffd8d0, ambientIntensity: 0.22, fog: 0xb07a7a, fogNear: 34, fogFar: 92, bg: 0xc08a84, bloom: 0.5, exposure: 1.0 },
  music: 'shinjuku', ambience: ['wind', 'fire'], weather: 'snow', levelRange: [68, 82],
  terrain: {
    kinds: ['asphalt', 'concrete', 'mud', 'stone'], scales: [0.15, 0.2, 0.2, 0.2],
    paint: (p) => {
      p.fill(1);
      p.rect(0, 0, 0, 12, 90, 0.2); p.rect(0, 0, 8, 90, 10, 0.2);
      p.circle(2, 0, -24, 14, 1.2);           // the crater where Gojo and Sukuna fought
      p.circle(3, -24, 6, 9, 0.8); p.circle(3, 24, 6, 9, 0.8);
      p.patches(2, 0.09, 0.64, 0.6);
    },
  },
  surfaces: ['concrete', 'concrete', 'dirt', 'stone'],
  spawn: { x: 0, z: 40, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 0, 14, 90).keepClear(0, 8, 90, 12).keepClear(0, -24, 30, 30).keepClear(-24, 6, 20, 20).keepClear(24, 6, 20, 20);
    for (const [x, z, q, s] of [[-34, -36, 0, 31], [-16, -40, 0, 32], [16, -40, 0, 33], [34, -36, 0, 34], [-38, -14, 1, 35], [38, -14, 3, 36], [-36, 26, 1, 37], [36, 26, 3, 38]] as const) b.building('ruinedTower', x, z, q, { seed: s });
    b.building('skyscraper', -20, 40, 2, { seed: 9 }).building('skyscraper', 22, 40, 2, { seed: 10 });
    b.scatter('iceSpike', -24, 6, 16, 16, 9, { minDist: 2.5 });
    b.scatter(['rubble', 'rubbleBig', 'ruinedWall'], 0, -24, 34, 30, 14, { minDist: 4 });
    b.scatter(['rubble', 'rubbleBig', 'ruinedWall', 'barricade', 'fireBarrel'], 0, 0, 84, 84, 30, { minDist: 4 });
    b.scatter(['deadTree', 'utilityPole', 'trafficLight'], 0, 0, 80, 80, 9, { minDist: 6 });
    b.prop('carWhite', -9, 14, 0.4).prop('carRed', 10, 12, -2.4).prop('van', -12, -4, 1.0).prop('carBlack', 14, -8, 2.2);
    b.wall('ruinedWall', -45, 45, 45, 45).wall('ruinedWall', -45, -45, 45, -45).wall('ruinedWall', -45, -45, -45, 45).wall('ruinedWall', 45, -45, 45, 45);
    b.npc({ id: 'ijichi', x: 5, z: 40, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 9.5, z: 40, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'yuta', x: -4, z: 36, facing: Math.PI });
    b.npc({ id: 'higuruma', x: -11, z: 37, facing: Math.PI * 0.85 });
    b.npc({ id: 'hakari', x: 13, z: 35, facing: -Math.PI * 0.85 });
    b.npc({ id: 'choso', x: -15, z: 33, facing: Math.PI * 0.75 });
    b.spawner({ enemies: [{ id: 'manipCurse', w: 2 }, { id: 'shinJelly' }], x: 0, z: 20, w: 50, d: 14, count: 8, respawn: 10, level: [68, 72] });
    b.spawner({ enemies: [{ id: 'shadowHound' }, { id: 'manipCurse' }], x: -26, z: -12, w: 18, d: 18, count: 6, respawn: 11, level: [70, 75] });
    b.spawner({ enemies: [{ id: 'shinJelly' }, { id: 'manipCurse' }], x: 26, z: -12, w: 18, d: 18, count: 6, respawn: 11, level: [71, 76] });
    b.spawner({ enemies: [{ id: 'manipCurse' }, { id: 'shadowHound', w: 2 }, { id: 'shinJelly' }], x: 0, z: 0, w: 70, d: 10, count: 7, respawn: 12, level: [74, 80] });
    b.scene({ x: 0, z: -10, r: 4, flag: 'scene_crater', cond: done('m23'), lines: [
      { who: 'narrator', text: 'The edge of the crater. The ground is cut clean, as if the world itself had been sliced along a single line.' },
      { who: 'narrator', text: 'Somewhere in the rubble lies a pair of round black sunglasses.' },
    ] });
    b.boss({ id: 'uraume', x: -24, z: 6, r: 10, quest: 'm24', intro: [
      { who: 'uraume', text: 'Insects. Lord Sukuna is resting. You will not disturb him.' },
      { who: 'uraume', text: 'I have served him for a thousand years. I will serve him a thousand more. Ice Formation.' },
    ] });
    b.boss({ id: 'kenjaku', x: 24, z: 6, r: 10, quest: 'm25', intro: [
      { who: 'kenjaku', text: 'Ah, there you are. I\'ve watched your generation with great interest. Humanity\'s potential, laid bare.' },
      { who: 'kenjaku', text: 'A thousand years of experiments, and the Culling Game was the last. Let me see what you\'ve become.' },
      { who: 'player', text: 'You started all of this. Shibuya. The Culling Game. You don\'t get to walk away from it.', only: ['yuji'] },
      { who: 'player', text: 'You\'re wearing Geto-san\'s face. Take it off.', only: ['megumi'] },
      { who: 'player', text: 'Experiments? You\'re just a parasite with stitches.', only: ['nobara'] },
    ] });
    b.boss({ id: 'sukunaTrue', x: 0, z: -24, r: 13, quest: 'm26', intro: [
      { who: 'narrator', text: 'Four arms. Two faces. A mouth across the belly. The King of Curses, as he walked the earth a thousand years ago.' },
      { who: 'sukuna', text: 'Satoru Gojo was the finest fight of the last thousand years. You will not be.' },
      { who: 'sukuna', text: 'But you\'ve come this far, and I am in a generous mood. I will kill you with my own hands.' },
      { who: 'player', text: 'I\'m not here to win your respect. I\'m here to end you.', only: ['yuji'] },
      { who: 'player', text: 'You don\'t get to use what you took from us anymore.', only: ['megumi', 'nobara'] },
    ] });
  },
};

export const MAPS: Record<string, MapDef> = { sugisawa, hub, eishu, kawasaki, sewer, kyoto, yasohachi, shibuya, zenin, colony1, sendai, shinjuku, ...INTERIORS };
/** Destinations Ijichi can drive to; `need` is the quest that must be accepted first. */
export const TRAVEL_LIST: { id: string; need?: string; level: string }[] = [
  { id: 'hub', need: 'm2', level: 'Town' },
  { id: 'sugisawa', level: 'Lv 1–6' },
  { id: 'eishu', need: 'm4', level: 'Lv 7–13' },
  { id: 'kawasaki', need: 'm6', level: 'Lv 13–19' },
  { id: 'kyoto', need: 'm9', level: 'Lv 19–26' },
  { id: 'yasohachi', need: 'm10y', level: 'Lv 21–27' },
  { id: 'shibuya', need: 'm11', level: 'Lv 26–40' },
  { id: 'zenin', need: 'm16', level: 'Lv 38–46' },
  { id: 'colony1', need: 'm18', level: 'Lv 46–60' },
  { id: 'sendai', need: 'm20', level: 'Lv 56–68' },
  { id: 'shinjuku', need: 'm23', level: 'Lv 68–82' },
];
export function travelUnlocked(ps: PlayerState, id: string) {
  const t = TRAVEL_LIST.find(x => x.id === id);
  if (!t) return false;
  if (!t.need || ps.d.cheats?.travel) return true;
  return !!ps.questState(t.need);
}
