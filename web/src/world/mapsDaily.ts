// The daily exorcism arena: a stone ring under a curtain, where the boss picked at Akari Nitta's
// board waits. Rebuilt on every visit, so the boss is whichever one was chosen.
import { MapDef } from './MapBuilder';
import { dailyPick, dailyPickLevel, dailyCleared } from '../rpg/Daily';

const dailyArena: MapDef = {
  id: 'dailyArena', name: 'Curtain Arena', jp: '帳の修練場', size: [56, 60], night: true,
  lighting: { sky: 0x4a3a6a, ground: 0x1a1420, hemiIntensity: 1.2, sun: 0xb8a8ff, sunIntensity: 1.1, sunDir: [0.3, 1, -0.4], ambient: 0x7a6aa8, ambientIntensity: 0.34, playerLight: 2.6, fog: 0x100a18, fogNear: 22, fogFar: 56, bg: 0x08050e, bloom: 0.6, exposure: 1.08 },
  music: 'memory', ambience: ['hum', 'wind'], weather: 'embers', levelRange: [5, 100],
  terrain: {
    kinds: ['stone', 'gravel', 'tile', 'void'], scales: [0.22, 0.28, 0.25, 0.3],
    paint: (p) => {
      p.fill(1);
      p.circle(0, 0, -4, 17, 1.4, 0.5);     // the stone ring
      p.circle(2, 0, -4, 6, 1, 0.3);        // ritual circle at its centre
      p.rect(0, 0, 20, 5, 18, 0.3);         // path from the gate
      p.patches(3, 0.06, 0.5, 0.4);
    },
  },
  surfaces: ['stone', 'dirt', 'stone', 'stone'],
  spawn: { x: 0, z: 22, facing: Math.PI },
  build: (b) => {
    b.keepClear(0, -4, 34, 34);
    b.wall('wallStone', -28, 30, 28, 30).wall('wallStone', -28, -30, 28, -30).wall('wallStone', -28, -30, -28, 30).wall('wallStone', 28, -30, 28, 30);
    // pillars and lanterns ring the arena
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = Math.sin(a) * 19, z = -4 + Math.cos(a) * 19;
      if (z > 10 && Math.abs(x) < 6) continue; // the way in
      b.prop(i % 2 ? 'stoneLantern' : 'barrierPost', x, z, -a);
      if (i % 2) b.light(x, 2.2, z, 0xb08aff, 5, 8, true);
    }
    b.prop('toriiBlack', 0, 13, 0);
    b.prop('signboard', 3.5, 24, Math.PI);
    for (const [x, z] of [[-14, 22], [14, 22], [-22, -20], [22, -20], [-22, 12], [22, 12]]) b.prop('deadTree', x, z, Math.random() * 6);
    b.light(0, 3, -4, 0x9a6aff, 8, 14, true);
    b.portal({ x: 0, z: 26.5, r: 1.8, to: 'hub', toX: 3, toZ: 25, label: 'Back to Jujutsu High' });
    const pick = dailyPick;
    if (pick) {
      b.boss({ id: pick.id, x: 0, z: -4, r: 13, repeatable: true, cond: (ps) => !dailyCleared(ps, pick.id), level: dailyPickLevel });
    }
  },
};

export const DAILY_MAPS: Record<string, MapDef> = { dailyArena };
