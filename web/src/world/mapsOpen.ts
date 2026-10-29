// The open regions (Tokyo Outskirts, Sakurajima) and the memories inside Tengen's barrier.
// The open regions are several times the size of a story area: roads lead out of them into the
// neighbouring areas, curses get stronger the further you wander, and landmarks, sealed caches
// and wandering special grades reward exploring off the road.
import { MapDef, MapBuilder } from './MapBuilder';
import { PlayerState } from '../rpg/PlayerState';

const done = (id: string) => (ps: PlayerState) => ps.questState(id)?.state === 'done';
const active = (id: string) => (ps: PlayerState) => !!ps.questState(id) && ps.questState(id)!.state !== 'done';

/** Keep scatter off a road: clear boxes every few metres along it. */
function clearRoad(b: MapBuilder, pts: [number, number][], w: number) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3));
    for (let k = 0; k <= n; k++) b.keepClear(ax + (bx - ax) * k / n, az + (bz - az) * k / n, w + 2, w + 2);
  }
}

// ============================================================================
// Tokyo Outskirts — the hills east of Jujutsu High
// ============================================================================
const R_WEST: [number, number][] = [[-110, 24], [-80, 22], [-56, 30], [-30, 42], [-6, 46]];
const R_SOUTH: [number, number][] = [[-6, 46], [10, 64], [30, 84], [40, 110]];
const R_NORTH: [number, number][] = [[-6, 46], [-8, 20], [-10, 0], [-12, -20], [-20, -40], [-30, -60], [-40, -84]];
const R_EAST: [number, number][] = [[-6, 46], [20, 30], [45, 12], [55, 0], [62, -10], [85, -18], [110, -20]];
const R_HOSP: [number, number][] = [[62, -10], [70, 18], [80, 36]];
const R_LAKE: [number, number][] = [[-12, -20], [10, -40], [30, -48]];

const outskirts: MapDef = {
  id: 'outskirts', name: 'Tokyo Outskirts', jp: '東京郊外', size: [220, 220], night: false, open: true,
  lighting: { sky: 0xe4f2ff, ground: 0x4a5a34, hemiIntensity: 1.2, sun: 0xfff0d0, sunIntensity: 2.4, sunDir: [-0.4, 1, 0.5], ambient: 0xf0fff0, ambientIntensity: 0.12, fog: 0xb8d4c0, fogNear: 34, fogFar: 92, bg: 0xb4d2c4, bloom: 0.35, exposure: 1.0 },
  music: 'outskirts', ambience: ['birds', 'wind', 'leaves'], weather: 'leaves', levelRange: [6, 90],
  terrain: {
    kinds: ['grass', 'dirt', 'mud', 'stone'], scales: [0.18, 0.2, 0.2, 0.2],
    minimap: [[70, 110, 60], [150, 128, 96], [96, 84, 60], [120, 120, 124]],
    paint: (p) => {
      for (const r of [R_WEST, R_SOUTH, R_EAST]) p.path(1, r, 4.2);
      for (const r of [R_NORTH, R_HOSP, R_LAKE]) p.path(1, r, 3.6);
      p.rect(2, 35, 0, 152, 11, 1.2);                       // river banks
      for (const [x, z, w, d] of [[-42, 62, 12, 9], [-26, 70, 11, 8], [-44, 80, 12, 9], [-28, 86, 10, 7], [4, 80, 11, 9]] as const) p.rect(2, x, z, w, d, 0.4);
      p.circle(2, 0, -68, 34, 2);                           // lake shore
      p.circle(3, -40, -90, 16, 3); p.circle(3, -70, -70, 14, 3); p.circle(3, 40, -92, 18, 3);
      p.rect(3, 84, 40, 46, 56, 1);                          // hospital district
      p.rect(3, -20, 90, 20, 13, 0.6);                       // graveyard
      p.circle(2, 18, -22, 13, 1.5);                         // the womb tree
      p.rect(1, -10, 44, 30, 22, 0.8);                       // village square
      p.patches(1, 0.07, 0.68, 0.35);
    },
  },
  surfaces: ['grass', 'dirt', 'dirt', 'stone'],
  spawn: { x: -98, z: 24, facing: Math.PI / 2 },
  build: (b) => {
    for (const r of [R_WEST, R_SOUTH, R_EAST]) clearRoad(b, r, 4.2);
    for (const r of [R_NORTH, R_HOSP, R_LAKE]) clearRoad(b, r, 3.6);
    b.keepClear(-10, 44, 34, 26).keepClear(-20, 86, 22, 16).keepClear(30, -50, 22, 16).keepClear(78, 42, 22, 22).keepClear(18, -22, 20, 18).keepClear(-96, 28, 14, 12);

    // ---- roads out to the neighbouring areas ----
    b.portal({ x: -107, z: 24, r: 2.6, to: 'hub', toX: 33, toZ: 4, toFacing: -Math.PI / 2, label: 'Jujutsu High', style: 'road', rot: Math.PI / 2 });
    b.portal({ x: 40, z: 107, r: 2.6, to: 'kawasaki', toX: -31, toZ: 4, toFacing: Math.PI / 2, label: 'Kawasaki', style: 'road', rot: Math.PI, cond: 'm5', condText: 'Ijichi: "Kawasaki is outside our area until a mission sends us there."' });
    b.portal({ x: 107, z: -20, r: 2.6, to: 'shibuya', toX: -36, toZ: 0, toFacing: Math.PI / 2, label: 'Shibuya', style: 'road', rot: -Math.PI / 2, cond: 'm10e', condText: 'A police cordon. "Shibuya is closed. Turn around."' });
    b.npc({ id: 'ijichi', x: -96, z: 31, facing: Math.PI / 2, shop: 'travel' });
    b.portal({ x: -91, z: 31, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.prop('signboard', -100, 19, Math.PI / 2).prop('stoneLantern', -102, 28).prop('stoneLantern', -102, 20);

    // ---- west: cedar forest and the roadside shrine (Lv 6-14) ----
    b.scatter(['cedar', 'cedar', 'pine', 'darkTree'], -82, 18, 52, 150, 130, { minDist: 3.2 });
    b.scatter(['mossRock', 'log', 'rock2'], -82, 18, 50, 140, 22, { minDist: 4 });
    b.decor(['fern', 'grass'], -82, 18, 54, 150, 260);
    b.prop('shrineSmall', -80, 4, 0).prop('torii', -80, 9, 0).prop('stoneLantern', -82.5, 7.5).prop('stoneLantern', -77.5, 7.5);
    b.landmark({ x: -80, z: 9, r: 5, name: 'Roadside Shrine', lines: [{ who: 'narrator', text: 'A tiny shrine to a forgotten god. The offerings are fresh. Someone in the village still comes up here.' }] });

    // ---- the village, its rice paddies and the old graveyard (Lv 14-28) ----
    // houses sit back from the roads (the road from the west bends through the square)
    b.building('house', -30, 52, 0, { seed: 1 }).building('house', -22, 34, 1, { seed: 2 }).building('house', 14, 54, 3, { seed: 3 });
    b.building('house', 14, 44, 2, { seed: 4 }).building('house', -40, 48, 1, { seed: 5 }).building('house', -14, 62, 0, { seed: 6 });
    b.building('storehouse', 2, 30, 0);
    b.prop('torii', 2, 36.5, 0).prop('bell', 8, 33, 0).prop('stoneLantern', -1, 35).prop('stoneLantern', 5, 35);
    b.prop('well', -16, 53, 0).prop('bench', -12, 52.5, 0).prop('vendingRed', -24, 47.5, Math.PI / 2).prop('bikeRack', 4, 49.5, 0).prop('postBox', -8, 52, 0);
    for (const [x, z] of [[-56, 34], [-44, 39.5], [-32, 47], [-20, 48.5]] as const) b.prop('utilityPole', x, z, 0);
    for (const [x, z, w, d] of [[-42, 62, 12, 9], [-26, 70, 11, 8], [-44, 80, 12, 9], [-28, 86, 10, 7], [4, 80, 11, 9]] as const) {
      b.wall('fenceWood', x - w / 2, z - d / 2, x + w / 2, z - d / 2, 2).wall('fenceWood', x - w / 2, z + d / 2, x + w / 2, z + d / 2, 2);
      b.decor('grassDry', x, z, w - 1, d - 1, 26, [0.9, 1.4]);
    }
    b.npc({ id: 'monk', x: 0, z: 38, facing: 0 });
    b.npc({ id: 'farmer', x: -19, z: 49, facing: Math.PI });
    b.landmark({ x: -10, z: 46, r: 8, name: 'Sakaki Village' });
    for (let row = 0; row < 3; row++) b.row('grave', -28, 86 + row * 3.4, -12, 86 + row * 3.4, 2.6, 0);
    b.prop('deadTree', -31, 92).prop('deadTree', -9, 84).prop('stoneLantern', -20, 80.5).prop('bell', -30, 82, 0.5);
    b.landmark({ x: -20, z: 93, r: 6, name: 'Old Graveyard', lines: [{ who: 'narrator', text: 'The graves are old and the names worn away. Something under the stones is breathing.' }] });
    b.boss({ id: 'smallpox', x: -20, z: 82, r: 9, world: 300, intro: [{ who: 'narrator', text: 'A gravestone lifts itself out of the earth on two thick arms. The Smallpox Deity begins to count.' }] });
    b.scatter(['roundTree', 'autumnTree', 'sakura'], -10, 70, 90, 60, 36, { minDist: 4 });
    b.scatter(['bush', 'flowerBush'], -10, 60, 80, 50, 24);
    b.decor('grass', -10, 66, 96, 70, 180);

    // ---- the river and its two bridges (Lv 20-30) ----
    for (const [x, w] of [[-26.5, 27], [22.5, 59], [84, 52]] as const) b.water(x, 0, w, 6, 0x3a7a8a);
    for (const bx of [-10, 55]) {
      b.decal(bx, 0, 6.2, 7.6, 0x6a4a2a, 0, 1, 0.09);
      for (let i = -3; i <= 3; i++) b.decal(bx, i * 1.05, 6, 0.08, 0x3a2a1a, 0, 1, 0.1);
      b.wall('fenceWood', bx - 3.2, -4, bx - 3.2, 4, 2).wall('fenceWood', bx + 3.2, -4, bx + 3.2, 4, 2);
    }
    b.decor('reeds', 35, -4.5, 140, 2, 50).decor('reeds', 35, 4.5, 140, 2, 50);

    // ---- north: the mountain, the lake and the shrine at the top (Lv 30-48) ----
    b.water(0, -68, 56, 24, 0x2a6a8a);
    b.decor(['reeds', 'lilyPad'], 0, -68, 64, 32, 50);
    b.scatter(['pine', 'pineDark', 'cedar'], 0, -86, 210, 44, 150, { minDist: 3.4 });
    b.scatter(['rock1', 'rock2', 'mossRock'], 0, -86, 200, 40, 40, { minDist: 4 });
    b.decor(['fern', 'grass'], 0, -80, 210, 50, 200);
    b.building('pagoda', -40, -96, 0);
    b.prop('toriiBig', -40, -80, 0).prop('stoneLantern', -43, -84).prop('stoneLantern', -37, -84);
    b.landmark({ x: -40, z: -84, r: 6, name: 'Mountain Shrine', lines: [{ who: 'narrator', text: 'A five-storey pagoda above the clouds of pine. You can see all the way back to Jujutsu High from here.' }] });
    b.landmark({ x: -30, z: -52, r: 6, name: 'Kamisato Lake' });
    b.boss({ id: 'rainbowDragon', x: 30, z: -50, r: 11, world: 360, intro: [{ who: 'narrator', text: 'The lake surface bulges. A dragon of every colour rises out of it, scales clicking like glass.' }] });

    // ---- centre: the womb tree, where something special grade took root (Lv 70-90) ----
    b.building('wombGrowth', 18, -22, 0);
    b.scatter(['deadTree', 'darkTree'], 18, -22, 40, 32, 22, { minDist: 3 });
    b.light(18, 3, -22, 0xff3a5a, 8, 16, true);
    b.landmark({ x: 18, z: -14, r: 7, name: 'The Womb Tree', lines: [{ who: 'narrator', text: 'The air here tastes of iron. Whatever grew this tree is gone, but the curses it left behind are far stronger than anything near the village.' }] });

    // ---- east: Tamagawa Hospital and the highway (Lv 50-68) ----
    b.building('office', 88, 30, 2, { seed: 51 }).building('apartment', 98, 62, 3).building('ruinedTower', 68, 64, 0, { seed: 41 }).building('shopRow', 100, 8, 3, { seed: 42 });
    b.prop('van', 76.5, 22, 0.4).prop('carWhite', 92, 46, 2.1).prop('barricade', 70, 34, 0.2).prop('trafficCone', 72, 36).prop('trafficCone', 73.5, 37);
    b.scatter(['rubble', 'rubbleBig', 'crate', 'barrel', 'deadTree'], 84, 42, 44, 52, 30, { minDist: 3 });
    b.row('streetLamp', 66, -6, 106, -15, 10);
    b.row('utilityPole', 66, 20, 66, 70, 10, 0);
    b.landmark({ x: 86, z: 38, r: 7, name: 'Tamagawa Hospital', lines: [{ who: 'narrator', text: 'The hospital closed years ago. The lights in the third-floor ward still turn on at night.' }] });
    b.landmark({ x: 100, z: -28, r: 6, name: 'Highway Overpass' });
    b.boss({ id: 'kuchisake', x: 78, z: 44, r: 10, world: 420, intro: [{ who: 'narrator', text: 'A tall woman in a long coat stands in the courtyard, a surgical mask over her mouth and a pair of shears in her hand.' }, { who: 'narrator', text: '"...Am I pretty?"' }] });
    b.scatter(['roundTree', 'autumnTree'], 84, -60, 50, 60, 26, { minDist: 4 });

    // ---- sealed caches, hidden off the roads ----
    for (const [x, z] of [[-92, -20], [-70, 62], [-48, 96], [12, 96], [-58, -8], [-74, -72], [6, -98], [54, -80], [30, -6], [102, 80], [60, 30], [96, -62]] as const) b.cache(x, z);

    // ---- curses, by zone ----
    b.spawner({ enemies: [{ id: 'forestCurse', w: 2 }, { id: 'crawler' }, { id: 'flyhead' }], x: -80, z: 0, w: 40, d: 40, count: 8, respawn: 11, level: [6, 10] });
    b.spawner({ enemies: [{ id: 'forestCurse' }, { id: 'lanky' }], x: -76, z: 62, w: 34, d: 34, count: 6, respawn: 12, level: [9, 14] });
    b.spawner({ enemies: [{ id: 'paddyCurse', w: 2 }, { id: 'villageGhoul' }], x: -32, z: 74, w: 40, d: 28, count: 8, respawn: 11, level: [14, 20] });
    b.spawner({ enemies: [{ id: 'graveWisp', w: 2 }, { id: 'villageGhoul' }], x: 0, z: 94, w: 40, d: 14, count: 5, respawn: 12, level: [20, 26] });
    b.spawner({ enemies: [{ id: 'riverCurse' }, { id: 'riverLeech' }, { id: 'graveWisp' }], x: 22, z: 12, w: 60, d: 14, count: 7, respawn: 11, level: [22, 30] });
    b.spawner({ enemies: [{ id: 'mountainHound' }, { id: 'tenguCurse' }], x: -52, z: -62, w: 40, d: 36, count: 7, respawn: 12, level: [30, 38] });
    b.spawner({ enemies: [{ id: 'tenguCurse' }, { id: 'lakeCurse' }, { id: 'mountainHound' }], x: 44, z: -82, w: 50, d: 30, count: 8, respawn: 12, level: [38, 48] });
    b.spawner({ enemies: [{ id: 'mountainHound', w: 2 }, { id: 'tenguCurse' }], x: -8, z: -98, w: 60, d: 14, count: 6, respawn: 12, level: [40, 48] });
    b.spawner({ enemies: [{ id: 'wardWraith', w: 2 }, { id: 'hospitalHand' }], x: 84, z: 52, w: 40, d: 40, count: 9, respawn: 11, level: [50, 60] });
    b.spawner({ enemies: [{ id: 'hospitalHand' }, { id: 'shibuyaTransfig' }], x: 90, z: 2, w: 30, d: 22, count: 6, respawn: 12, level: [56, 64] });
    b.spawner({ enemies: [{ id: 'manipCurse' }, { id: 'shadowHound' }], x: 76, z: -40, w: 44, d: 22, count: 6, respawn: 13, level: [62, 72] });
    b.spawner({ enemies: [{ id: 'nestSpawn', w: 2 }, { id: 'releasedCurse' }], x: 18, z: -24, w: 30, d: 26, count: 7, respawn: 13, level: [72, 90] });

    b.border(['cedar', 'pine', 'roundTree'], 1.5, 3, 1, [{ x: -110, z: 24, r: 6 }, { x: 40, z: 110, r: 6 }, { x: 110, z: -20, r: 6 }]);
  },
};

// ============================================================================
// Sakurajima Colony — Culling Game (Maki and Noritoshi Kamo against Naoya's curse)
// ============================================================================
const S_MAIN: [number, number][] = [[0, 96], [0, 70], [-14, 44], [-6, 18], [10, -6], [6, -30], [0, -48]];
const S_WEST: [number, number][] = [[-14, 44], [-44, 36], [-66, 14], [-72, -16]];
const S_EAST: [number, number][] = [[10, -6], [40, -10], [70, -22]];

const sakurajima: MapDef = {
  id: 'sakurajima', name: 'Sakurajima Colony', jp: '桜島結界', size: [200, 200], night: false, open: true,
  lighting: { sky: 0xe8a080, ground: 0x3a2a26, hemiIntensity: 1.25, sun: 0xffa070, sunIntensity: 1.8, sunDir: [0.6, 0.6, -0.4], ambient: 0xf0c0a8, ambientIntensity: 0.22, fog: 0x8a5a4a, fogNear: 30, fogFar: 86, bg: 0x9a6a5a, bloom: 0.55, exposure: 1.0 },
  music: 'sakurajima', ambience: ['wind', 'fire'], weather: 'ash', levelRange: [60, 72],
  terrain: {
    kinds: ['gravel', 'dirt', 'concrete', 'stone'], scales: [0.22, 0.2, 0.2, 0.2],
    minimap: [[96, 88, 84], [130, 104, 80], [140, 140, 140], [70, 64, 64]],
    paint: (p) => {
      p.fill(0);
      p.path(1, S_MAIN, 4.4); p.path(1, S_WEST, 3.8); p.path(1, S_EAST, 3.8);
      p.rect(2, 0, 84, 110, 30, 1);                       // harbour town
      p.circle(3, 0, -66, 32, 3);                          // crater
      p.circle(3, 70, -22, 12, 2);                         // observatory hill
      p.rect(3, -86, -4, 22, 80, 2);                        // lava gorge walls
      p.patches(1, 0.06, 0.66, 0.5);
    },
  },
  surfaces: ['dirt', 'dirt', 'concrete', 'stone'],
  spawn: { x: 0, z: 92, facing: Math.PI },
  build: (b) => {
    clearRoad(b, S_MAIN, 4.4); clearRoad(b, S_WEST, 3.8); clearRoad(b, S_EAST, 3.8);
    b.keepClear(0, 88, 30, 16).keepClear(0, -58, 26, 22).keepClear(70, -22, 18, 16);
    // harbour town
    b.building('shopRow', -30, 80, 0, { seed: 61 }).building('shopRow', 30, 80, 0, { seed: 62 }).building('apartment', -54, 74, 1).building('office', 54, 72, 3, { seed: 63 });
    b.building('house', -16, 64, 0, { seed: 64 }).building('house', 18, 62, 0, { seed: 65 });
    b.wall('wallConcrete', -96, 99, 96, 99);
    b.scatter(['crate', 'barrel', 'fireBarrel', 'van', 'carWhite', 'rubble'], 0, 90, 100, 14, 26, { minDist: 3.5 });
    b.row('streetLampWarm', -40, 94, 40, 94, 10, Math.PI);
    b.npc({ id: 'ijichi', x: 8, z: 92, facing: Math.PI, shop: 'travel' });
    b.portal({ x: 12.5, z: 92, r: 1.2, to: '@travel', label: 'Travel point', style: 'travel' });
    b.npc({ id: 'kamo', x: -6, z: 88, facing: Math.PI });
    b.npc({ id: 'maki', x: -10, z: 90, facing: Math.PI * 0.9, cond: (ps) => !!ps.questState('s_saku1') });
    b.landmark({ x: 0, z: 80, r: 8, name: 'Sakurajima Harbour', lines: [{ who: 'narrator', text: 'Ash falls on everything here like grey snow. The volcano has not stopped smoking since the colony barrier went up.' }] });
    // ash fields and the lava gorge
    b.scatter(['deadTree', 'rubble', 'rubbleBig', 'rock1', 'rock3'], 0, 10, 180, 110, 90, { minDist: 4 });
    b.decor('grassDry', 0, 20, 180, 120, 160, [0.7, 1.2]);
    for (const [z, w] of [[-40, 12], [-16, 9], [10, 11], [32, 8]] as const) b.water(-86, z, w, 16, 0xff5a1a);
    b.light(-86, 2, -20, 0xff6a1a, 10, 22).light(-86, 2, 14, 0xff6a1a, 10, 22);
    b.landmark({ x: -70, z: -4, r: 7, name: 'Lava Gorge' });
    b.landmark({ x: -6, z: 20, r: 7, name: 'Ash Fields' });
    // the observatory on the east hill
    b.building('guardTower', 72, -26, 0).building('ruinedTower', 86, -6, 3, { seed: 66 });
    b.landmark({ x: 70, z: -20, r: 7, name: 'Abandoned Observatory', lines: [{ who: 'narrator', text: 'The telescope still points at the summit. Someone pinned a Culling Game rule list to the door.' }] });
    // the crater
    b.water(0, -80, 26, 14, 0xff5a1a);
    b.light(0, 2, -80, 0xff5a1a, 14, 28, true);
    b.scatter(['rock2', 'rubbleBig', 'iceSpike'], 0, -66, 70, 50, 30, { minDist: 4 });
    b.landmark({ x: 0, z: -46, r: 6, name: 'Crater Rim' });
    b.boss({ id: 'naoyaCurse', x: 0, z: -58, r: 12, quest: 's_saku2', intro: [
      { who: 'narrator', text: 'Something huge crawls up over the crater rim on long, wrong arms. Under the ash, its hair is still bleached gold.' },
      { who: 'naoyaCurse', text: 'Maaaki... Maki, Maki, Maki. Look what they did to me. Look what YOU did to me.' },
      { who: 'kamo', text: 'That is Naoya Zen\'in. Killed by his own mother, and cursed by his own spite. Stay off his projected lines.' },
      { who: 'naoyaCurse', text: 'Twenty-four frames, then. Let\'s see if you can keep up this time.' },
    ] });
    for (const [x, z] of [[-86, 60], [86, 40], [-40, -10], [40, 20], [-30, -70], [30, -88], [90, -60], [-88, -50]] as const) b.cache(x, z);
    b.spawner({ enemies: [{ id: 'cgVeteran' }, { id: 'heiRemnant' }], x: 0, z: 54, w: 70, d: 24, count: 7, respawn: 12, level: [60, 64] });
    b.spawner({ enemies: [{ id: 'ashCurse', w: 2 }, { id: 'magmaHound' }], x: -50, z: 10, w: 50, d: 60, count: 8, respawn: 12, level: [62, 67] });
    b.spawner({ enemies: [{ id: 'magmaHound' }, { id: 'ashCurse' }, { id: 'cgVeteran' }], x: 40, z: 0, w: 60, d: 50, count: 8, respawn: 12, level: [63, 68] });
    b.spawner({ enemies: [{ id: 'ashCurse' }, { id: 'heiRemnant' }, { id: 'magmaHound' }], x: 0, z: -40, w: 80, d: 30, count: 7, respawn: 13, level: [66, 72] });
    b.border(['deadTree', 'rock2'], 1.5, 3.4, 1);
  },
};

// ============================================================================
// Tombs of the Star — Tengen's barrier, far beneath Jujutsu High
// ============================================================================
const starCorridor: MapDef = {
  id: 'starCorridor', name: 'Tombs of the Star', jp: '薨星宮', size: [96, 110], night: true,
  lighting: { sky: 0x8a7a9a, ground: 0x2a2228, hemiIntensity: 1.3, sun: 0xffd8a8, sunIntensity: 1.0, sunDir: [0.2, 1, 0.3], ambient: 0xc0a8c8, ambientIntensity: 0.4, playerLight: 2.8, fog: 0x1a1218, fogNear: 26, fogFar: 72, bg: 0x0e0a10, bloom: 0.7, exposure: 1.1 },
  music: 'memory', ambience: ['hum', 'drips'], weather: 'fireflies', levelRange: [82, 90],
  terrain: {
    kinds: ['stone', 'wood', 'tile', 'moss'], scales: [0.2, 0.22, 0.22, 0.2],
    paint: (p) => {
      p.rect(1, 0, 10, 12, 86, 0.3);                        // the long corridor
      p.circle(2, 0, 8, 12, 0.8);                           // the hall halfway down
      p.circle(3, 0, -38, 16, 1.4);                         // moss around the tree
      p.patches(3, 0.08, 0.7, 0.4);
    },
  },
  surfaces: ['stone', 'wood', 'stone', 'grass'],
  spawn: { x: 0, z: 48, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 10, 14, 90).keepClear(0, 8, 26, 24).keepClear(0, -36, 34, 26);
    b.wall('wallStone', -7, 54, -7, 22).wall('wallStone', 7, 54, 7, 22).wall('wallStone', -7, -6, -7, -22).wall('wallStone', 7, -6, 7, -22);
    for (let z = 50; z >= -20; z -= 6) { if (Math.abs(z - 8) < 12) continue; b.prop('stoneLantern', -5.5, z).prop('stoneLantern', 5.5, z); }
    // row upon row of identical shrines: the barrier's endless copies of the same building
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) for (const off of [16, 32]) b.building('storehouse', sx * off, 40 - i * 15, sx > 0 ? 3 : 1);
    b.prop('cedar', 0, -44, 0, 3.6).prop('cedar', -6, -42, 1, 2.4).prop('cedar', 6, -42, 2, 2.4);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; b.prop('stoneLantern', Math.sin(a) * 12, -38 + Math.cos(a) * 10); }
    b.light(0, 4, -38, 0xffe8b0, 10, 22).light(0, 3, 8, 0xffd8a8, 6, 16);
    b.portal({ x: 0, z: 52.5, r: 1.2, to: 'hub', toX: -26, toZ: -21.5, toFacing: 0, label: 'Lift to Jujutsu High', style: 'door' });
    b.npc({ id: 'tengen', x: 0, z: -28, facing: 0 });
    b.portal({ x: -12, z: -24, r: 1.8, to: 'nightParade', label: 'Memory: December 24th, 2017', cond: 'm28', condText: 'Tengen: "One memory at a time. Finish this one first."' });
    b.portal({ x: 12, z: -24, r: 1.8, to: 'lastLesson', label: 'Memory: the Strongest', cond: 'm29', condText: 'Tengen: "That memory is the heaviest of all. Not yet."' });
    b.boss({ id: 'toji', x: 0, z: 8, r: 11, quest: 'm28', intro: [
      { who: 'narrator', text: 'The memory takes hold. 2006: a corridor full of lanterns, and a man in black leaning against a pillar, as if he had been waiting for hours.' },
      { who: 'toji', text: 'Huh. Not the kid with the Six Eyes. Guess the memory picked someone else to play him.' },
      { who: 'toji', text: 'Nothing personal. Somebody paid me, and I don\'t give refunds.' },
      { who: 'player', text: 'You\'re Megumi\'s... no. You\'re just a memory. Let\'s finish this.', only: ['yuji', 'nobara'] },
      { who: 'player', text: '...Dad.', only: ['megumi'] },
      { who: 'toji', text: 'Heh. Whoever you are, don\'t blink.' },
    ] });
    b.scene({ x: 0, z: 40, r: 4, flag: 'scene_tombs', cond: active('m28'), lines: [
      { who: 'narrator', text: 'Tengen\'s memory spreads out around you. The air smells of incense and old stone, and somewhere ahead a cursed tool clinks against another.' },
    ] });
    b.spawner({ enemies: [{ id: 'memoryCurse', w: 2 }, { id: 'templeAssassin' }], x: -24, z: 16, w: 22, d: 60, count: 6, respawn: 12, level: [82, 86] });
    b.spawner({ enemies: [{ id: 'memoryCurse' }, { id: 'templeAssassin', w: 2 }], x: 24, z: 16, w: 22, d: 60, count: 6, respawn: 12, level: [83, 88] });
  },
};

// ============================================================================
// Memory: Jujutsu High, December 24th 2017 — the Night Parade of a Hundred Demons
// ============================================================================
const nightParade: MapDef = {
  id: 'nightParade', name: 'Night Parade of a Hundred Demons', jp: '百鬼夜行', size: [92, 92], night: true,
  lighting: { sky: 0x6a5a8a, ground: 0x241e2a, hemiIntensity: 1.3, sun: 0xff9a6a, sunIntensity: 1.2, sunDir: [-0.4, 0.8, 0.5], ambient: 0xb08ac0, ambientIntensity: 0.35, playerLight: 2.4, fog: 0x1a1022, fogNear: 28, fogFar: 80, bg: 0x0c0812, bloom: 0.65, exposure: 1.05 },
  music: 'memory', ambience: ['fire', 'wind'], weather: 'embers', levelRange: [86, 94],
  terrain: {
    kinds: ['grass', 'stone', 'gravel', 'mud'], scales: [0.18, 0.2, 0.25, 0.2],
    paint: (p) => {
      p.rect(1, 0, 10, 6, 60, 0.4);
      p.circle(2, 0, 0, 13, 0.8);
      p.rect(1, 0, -18, 24, 8, 0.4);
      p.patches(3, 0.09, 0.62, 0.6);
    },
  },
  surfaces: ['grass', 'stone', 'dirt', 'dirt'],
  spawn: { x: 0, z: 38, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, 10, 8, 66).keepClear(0, 0, 28, 28).keepClear(0, -18, 26, 10);
    b.building('templeHall', 0, -30, 0);
    b.building('dorm', -26, -6, 1).building('classroom', 27, -6, 3).building('pagoda', 28, -30, 0).building('storehouse', -28, -28, 0);
    b.prop('toriiBig', 0, 34, 0).prop('torii', 0, -20.5, 0);
    for (let z = 30; z >= -14; z -= 5) if (Math.abs(z) > 13) { b.prop('stoneLantern', -3.6, z); b.prop('stoneLantern', 3.6, z); }
    b.scatter(['fireBarrel', 'rubble', 'rubbleBig', 'ruinedWall'], 0, 0, 84, 84, 26, { minDist: 4 });
    b.scatter(['sakura', 'cedar', 'deadTree'], 0, 0, 86, 86, 24, { minDist: 5 });
    b.decor('grassDry', 0, 0, 86, 86, 120);
    b.border(['cedar', 'pine', 'darkTree'], 1.5, 3, 1);
    b.portal({ x: 7, z: 40, r: 1.6, to: 'starCorridor', toX: -10, toZ: -18, label: 'Leave the memory' });
    b.npc({ id: 'yuta', x: -5, z: 36, facing: Math.PI });
    b.scene({ x: 0, z: 30, r: 5, flag: 'scene_parade', cond: active('m29'), lines: [
      { who: 'narrator', text: 'December 24th, 2017. Suguru Geto declared war on the jujutsu world and loosed a thousand curses on Shinjuku and Kyoto.' },
      { who: 'narrator', text: 'But that was the distraction. He came here himself, for one student and the Special Grade curse bound to her promise.' },
      { who: 'yuta', text: 'This is the night Rika and I fought him. I didn\'t think I\'d ever have to see it again.' },
    ] });
    b.boss({ id: 'geto', x: 0, z: 0, r: 12, quest: 'm29', intro: [
      { who: 'geto', text: 'You\'re not Yuta Okkotsu. Then again, a memory has no reason to be precise.' },
      { who: 'geto', text: 'Non-sorcerers are monkeys. I\'ll make a world where only sorcerers live, even if I have to carry it alone.' },
      { who: 'player', text: 'Kenjaku wore your face for a year and used you for all of it. You don\'t get to talk about carrying things.', only: ['yuji', 'megumi'] },
      { who: 'player', text: 'Monkeys, huh? This monkey brought a hammer.', only: ['nobara'] },
      { who: 'geto', text: 'Then let\'s see if you\'re worth sparing.' },
    ] });
    b.spawner({ enemies: [{ id: 'paradeCurse', w: 2 }, { id: 'paradeFlyer' }], x: -20, z: 14, w: 30, d: 34, count: 7, respawn: 9, level: [86, 90] });
    b.spawner({ enemies: [{ id: 'paradeCurse' }, { id: 'paradeFlyer', w: 2 }], x: 20, z: 14, w: 30, d: 34, count: 7, respawn: 9, level: [87, 91] });
    b.spawner({ enemies: [{ id: 'paradeCurse' }, { id: 'hand' }, { id: 'paradeFlyer' }], x: 0, z: -30, w: 70, d: 16, count: 6, respawn: 11, level: [88, 93] });
  },
};

// ============================================================================
// Memory: the Strongest — inside Unlimited Void
// ============================================================================
const lastLesson: MapDef = {
  id: 'lastLesson', name: 'The Strongest\'s Last Lesson', jp: '無量空処', size: [72, 72], night: true,
  lighting: { sky: 0x6a8aff, ground: 0x0a0a1a, hemiIntensity: 1.2, sun: 0xbfe4ff, sunIntensity: 1.4, sunDir: [0.3, 1, 0.3], ambient: 0x9ab0ff, ambientIntensity: 0.35, playerLight: 2.4, fog: 0x060818, fogNear: 22, fogFar: 60, bg: 0x02030a, bloom: 0.95, exposure: 1.1 },
  music: 'void', ambience: ['hum'], weather: 'snow', levelRange: [94, 100],
  terrain: {
    kinds: ['void', 'stone', 'tile', 'void'], scales: [0.08, 0.2, 0.2, 0.12],
    paint: (p) => { p.circle(2, 0, -4, 14, 2); p.patches(1, 0.1, 0.72, 0.3); },
  },
  surfaces: ['stone', 'stone', 'stone', 'stone'],
  spawn: { x: 0, z: 26, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, -4, 30, 30).keepClear(0, 26, 8, 8);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; b.prop('iceSpike', Math.sin(a) * 26, -4 + Math.cos(a) * 26, a, 1.3); }
    b.scatter(['rock1', 'rock3', 'iceSpike'], 0, 0, 66, 66, 18, { minDist: 5 });
    b.light(0, 5, -4, 0x9ad8ff, 10, 26);
    b.portal({ x: 7, z: 28, r: 1.6, to: 'starCorridor', toX: 10, toZ: -18, label: 'Leave the memory' });
    b.scene({ x: 0, z: 20, r: 4, flag: 'scene_lesson', cond: active('m30'), lines: [
      { who: 'narrator', text: 'There is no floor here, only the idea of one. Stars wheel overhead. Every one of them is information, and none of it stops.' },
      { who: 'gojo', text: 'Yo! Surprised? Tengen asked me to leave something behind, just in case. So I left the best thing I had: me.' },
      { who: 'gojo', text: 'Last lesson. If you can take a hit from the strongest, you can protect anyone. Ready? No? Too bad!' },
    ] });
    b.boss({ id: 'gojoMemory', x: 0, z: -4, r: 13, quest: 'm30', intro: [
      { who: 'gojo', text: 'Infinity\'s on. Find a way through it. Hint: hit me REALLY hard, or bring your own domain.' },
    ] });
  },
};

export const OPEN_MAPS: Record<string, MapDef> = { outskirts, sakurajima, starCorridor, nightParade, lastLesson };
