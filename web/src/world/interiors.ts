// Enterable buildings. Each visit lays out a fresh floor plan: a randomised
// spanning tree of rooms and halls with a few extra loops, cutaway walls on the
// camera side, furniture per room type, curses in the halls and the story beat
// in the room farthest from the door.
import { MapBuilder, MapDef, SpawnerDef } from './MapBuilder';
import { Rng, TAU } from '../core/util';
import { TileKind, SplatPainter } from '../render/textures';
import { LightingPreset } from '../render/Renderer';
import { Surface } from '../audio/Audio';
import { AmbLayer } from '../audio/Music';

type Side = 0 | 1 | 2 | 3; // N, E, S, W
const DI = [0, 1, 0, -1], DJ = [-1, 0, 1, 0];
/** yaw that turns a room's local -Z (its "front") toward each side */
const FRONT_YAW = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

export interface Cell {
  i: number; j: number; k: number;
  x: number; z: number;
  links: Side[];
  room: boolean;
  dist: number;
  /** the wall a room's furniture faces (opposite its door) */
  front: Side;
}

export interface Layout {
  cols: number; rows: number; C: number;
  cells: Cell[];
  entry: Cell;
  goal: Cell;
}

const DOOR = 2.6;

function generate(cols: number, rows: number, C: number, rng: Rng, loops: number): Layout {
  const cells: Cell[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    cells.push({ i, j, k: j * cols + i, x: (i + 0.5 - cols / 2) * C, z: (j + 0.5 - rows / 2) * C, links: [], room: false, dist: -1, front: 0 });
  }
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= cols || j >= rows ? null : cells[j * cols + i]);
  const link = (a: Cell, s: Side) => {
    const b = at(a.i + DI[s], a.j + DJ[s])!;
    if (!a.links.includes(s)) a.links.push(s);
    const o = ((s + 2) % 4) as Side;
    if (!b.links.includes(o)) b.links.push(o);
  };
  const entry = at(Math.floor(cols / 2), rows - 1)!;
  // randomised depth-first spanning tree
  const seen = new Set<number>([entry.k]);
  const stack = [entry];
  while (stack.length) {
    const c = stack[stack.length - 1];
    const opts = ([0, 1, 2, 3] as Side[]).filter(s => { const n = at(c.i + DI[s], c.j + DJ[s]); return n && !seen.has(n.k); });
    if (!opts.length) { stack.pop(); continue; }
    const s = rng.pick(opts);
    const n = at(c.i + DI[s], c.j + DJ[s])!;
    link(c, s);
    seen.add(n.k);
    stack.push(n);
  }
  // a few extra openings so the plan has loops instead of one long corridor
  for (const c of cells) for (const s of [1, 2] as Side[]) {
    const n = at(c.i + DI[s], c.j + DJ[s]);
    if (n && !c.links.includes(s) && rng.chance(loops)) link(c, s);
  }
  // dead ends become rooms; some pass-through cells too
  for (const c of cells) {
    if (c === entry) continue;
    c.room = c.links.length === 1 || (c.links.length === 2 && rng.chance(0.3));
  }
  // breadth-first distance from the door
  entry.dist = 0;
  const q = [entry];
  while (q.length) {
    const c = q.shift()!;
    for (const s of c.links) {
      const n = at(c.i + DI[s], c.j + DJ[s])!;
      if (n.dist < 0) { n.dist = c.dist + 1; q.push(n); }
    }
  }
  for (const c of cells) {
    if (c.links.length === 1) c.front = ((c.links[0] + 2) % 4) as Side;
    else c.front = ([0, 1, 3, 2] as Side[]).find(s => !c.links.includes(s)) ?? 0;
  }
  const goal = cells.filter(c => c !== entry).sort((a, b) => (b.room ? 1 : 0) - (a.room ? 1 : 0) || b.dist - a.dist)[0];
  goal.room = true;
  if (goal.links.length === 1) goal.front = ((goal.links[0] + 2) % 4) as Side;
  return { cols, rows, C, cells, entry, goal };
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

/** Places a prop in a room's local frame, where -Z is the room's front wall. Chainable: place(a).p(b). */
export interface Place { (name: string, lx: number, lz: number, rot?: number, scale?: number): Place; p: Place }

interface Theme {
  wall: string;
  post: string;
  postLow: string;
  kinds: [TileKind, TileKind, TileKind, TileKind];
  scales: [number, number, number, number];
  tint?: number;
  surfaces: [Surface, Surface, Surface, Surface];
  minimap: [number, number, number][];
  lighting: LightingPreset;
  light: { color: number; intensity: number; range: number; flicker: number };
  music: string;
  ambience: AmbLayer[];
  night: boolean;
  /** dress a room (local frame, -Z = front) */
  room: (p: Place, rng: Rng, c: Cell, C: number) => void;
  /** dress a hall; `walls` lists the sides that are solid */
  hall: (p: Place, rng: Rng, walls: Side[], C: number) => void;
}

const darkLighting = (bg: number, fog: number, ambient: number, sky: number, playerLight: number, bloom = 0.5): LightingPreset => ({
  sky, ground: 0x1a1a1e, hemiIntensity: 0.65, sun: 0xd8dcff, sunIntensity: 0.55, sunDir: [0.3, 1, 0.5],
  ambient, ambientIntensity: 0.28, playerLight, fog, fogNear: 30, fogFar: 70, bg, bloom, exposure: 1.05,
});

/** Props lined up against the solid walls of a hall, leaving the centre and doorways clear. */
function againstWalls(p: Place, rng: Rng, walls: Side[], C: number, names: string[], chance = 0.6) {
  for (const s of walls) {
    if (!rng.chance(chance)) continue;
    const off = C / 2 - 0.75;
    const along = rng.pick([-1, 1]) * rng.range(1.8, C / 2 - 1.6);
    const yaw = [0, -Math.PI / 2, Math.PI, Math.PI / 2][s];
    const x = s === 1 ? off : s === 3 ? -off : along;
    const z = s === 0 ? -off : s === 2 ? off : along;
    p(rng.pick(names), x, z, yaw);
  }
}

const THEMES: Record<string, Theme> = {
  school: {
    wall: 'iwSchool', post: 'wallPost', postLow: 'wallPostLow',
    kinds: ['tile', 'wood', 'concrete', 'void'], scales: [0.3, 0.25, 0.3, 0.2], tint: 0xd8dce8,
    surfaces: ['stone', 'wood', 'concrete', 'stone'],
    minimap: [[150, 150, 160], [150, 116, 80], [120, 120, 126], [16, 16, 22]],
    lighting: darkLighting(0x05060c, 0x080a14, 0x6a7aa8, 0x4a5a90, 2.4),
    light: { color: 0xd8e6ff, intensity: 5, range: 10, flicker: 0.35 },
    music: 'indoors', ambience: ['hum', 'wind'], night: true,
    room: (p, rng, c) => {
      if (c.links.length === 1 && rng.chance(0.35)) {
        // club room
        p('bookshelf', -3, -4.2, 0).p('bookshelf', 3, -4.2, 0);
        p('chabudai', 0, -0.5).p('tvSet', -3.6, 1.2, Math.PI / 2).p('pottedPlant', 3.7, 3.2);
        return;
      }
      p('blackboard', 0, -4.6, 0).p('teacherDesk', 0, -3.3, Math.PI);
      for (const x of [-3, -1.6, 1.6, 3]) for (const z of [-1.4, 0.4, 2.2]) if (rng.chance(0.85)) p('desk', x, z, rng.range(-0.15, 0.15));
      if (rng.chance(0.5)) p('lockerRow', 3.4, 3.9, Math.PI);
    },
    hall: (p, rng, walls, C) => { againstWalls(p, rng, walls, C, ['lockerRow', 'lockerRow', 'vendingBlue', 'pottedPlant', 'bench']); },
  },
  theater: {
    wall: 'iwTheater', post: 'wallPostDark', postLow: 'wallPostDarkLow',
    kinds: ['tile', 'mud', 'stone', 'void'], scales: [0.35, 0.2, 0.3, 0.2], tint: 0xe8c8c0,
    surfaces: ['stone', 'wood', 'stone', 'stone'],
    minimap: [[170, 150, 140], [110, 40, 46], [140, 120, 110], [16, 12, 14]],
    lighting: darkLighting(0x080406, 0x100608, 0xa86a5a, 0x8a4a4a, 2.2, 0.6),
    light: { color: 0xffc890, intensity: 4.5, range: 9, flicker: 0.15 },
    music: 'indoors', ambience: ['hum'], night: true,
    room: (p, rng) => {
      p('cinemaScreen', 0, -4.5, 0);
      for (let r = 0; r < 4; r++) for (const x of [-2.2, 2.2]) if (rng.chance(0.9)) p('theaterSeats', x, -1.2 + r * 1.35, 0, 0.62);
    },
    hall: (p, rng, walls, C) => {
      if (rng.chance(0.35)) p(rng.pick(['ticketBooth', 'popcornCart']), rng.range(-2, 2), rng.range(-2, 2), rng.pick([0, Math.PI / 2]));
      againstWalls(p, rng, walls, C, ['pottedPlant', 'bench', 'popcornCart', 'vendingRed']);
    },
  },
  station: {
    wall: 'iwStation', post: 'wallPost', postLow: 'wallPostLow',
    kinds: ['tile', 'concrete', 'asphalt', 'void'], scales: [0.4, 0.3, 0.25, 0.2], tint: 0xe0e4e8,
    surfaces: ['stone', 'concrete', 'concrete', 'stone'],
    minimap: [[170, 172, 176], [130, 130, 134], [60, 60, 66], [14, 14, 18]],
    lighting: darkLighting(0x06060a, 0x0a080c, 0x8a90a8, 0x6a6a8a, 2.4, 0.6),
    light: { color: 0xf0f4ff, intensity: 5, range: 10, flicker: 0.3 },
    music: 'indoors', ambience: ['hum', 'drips'], night: true,
    room: (p, rng) => {
      // platform edge and track bed along the front wall
      p('trackBed', 0, -3.9, 0);
      for (const x of [-3, 3]) p('stationPillar', x, -1.2);
      p('bench', 0, 1.4, Math.PI).p('bench', rng.pick([-3, 3]), 3, Math.PI);
    },
    hall: (p, rng, walls, C) => {
      for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) if (rng.chance(0.55)) p('stationPillar', x, z);
      if (rng.chance(0.35)) for (const x of [-1.6, 0, 1.6]) p('ticketGate', x, 0, 0);
      againstWalls(p, rng, walls, C, ['bench', 'vendingWhite', 'vendingBlue'], 0.4);
    },
  },
  prison: {
    wall: 'iwPrison', post: 'wallPost', postLow: 'wallPostLow',
    kinds: ['concrete', 'tile', 'flesh', 'void'], scales: [0.3, 0.35, 0.25, 0.2], tint: 0xc8d0c0,
    surfaces: ['concrete', 'stone', 'flesh', 'stone'],
    minimap: [[120, 124, 118], [140, 140, 136], [120, 40, 60], [14, 16, 14]],
    lighting: darkLighting(0x060806, 0x0c100a, 0x7a9a7a, 0x5a7a5a, 2.3, 0.55),
    light: { color: 0xc8ffd0, intensity: 4.5, range: 9, flicker: 0.45 },
    music: 'eishu', ambience: ['drips', 'hum'], night: true,
    room: (p, rng) => {
      p('bunkBed', -3.4, -2.6, 0).p('bunkBed', 3.4, -2.6, 0);
      if (rng.chance(0.6)) p('metalTable', 0, -3.6, 0);
      if (rng.chance(0.5)) p('bunkBed', -3.4, 2.4, 0);
    },
    hall: (p, rng, walls, C) => againstWalls(p, rng, walls, C, ['metalTable', 'bench', 'crate'], 0.4),
  },
  dorm: {
    wall: 'iwDorm', post: 'wallPost', postLow: 'wallPostLow',
    kinds: ['wood', 'tile', 'stone', 'void'], scales: [0.25, 0.3, 0.3, 0.2], tint: 0xfff0dc,
    surfaces: ['wood', 'wood', 'stone', 'stone'],
    minimap: [[170, 130, 90], [190, 184, 150], [150, 146, 140], [18, 14, 12]],
    lighting: { sky: 0xfff0e2, ground: 0x6a5a40, hemiIntensity: 1.0, sun: 0xffe0b4, sunIntensity: 1.2, sunDir: [-0.4, 1, 0.5], ambient: 0xffffff, ambientIntensity: 0.18, playerLight: 1.2, fog: 0x2a2018, fogNear: 34, fogFar: 80, bg: 0x140e0a, bloom: 0.35, exposure: 1.0 },
    light: { color: 0xffd8a8, intensity: 4, range: 10, flicker: 0 },
    music: 'dorm', ambience: ['birds'], night: false,
    room: (p, rng) => {
      p('tatami', 0, 0.2, 0);
      p('futon', rng.pick([-2.6, 2.6]), -2.2, 0).p('chabudai', 0, 1.2);
      p('bookshelf', -3.6, -4.2, 0).p('tvSet', 3.2, -4.1, 0);
      if (rng.chance(0.6)) p('pottedPlant', 3.8, 3.6);
    },
    hall: (p, rng, walls, C) => againstWalls(p, rng, walls, C, ['pottedPlant', 'bench', 'bookshelf', 'vendingWhite'], 0.5),
  },
};

// ---------------------------------------------------------------------------
// Interior map factory
// ---------------------------------------------------------------------------

export interface InteriorCtx {
  b: MapBuilder;
  rng: Rng;
  layout: Layout;
  /** place a prop in the goal room's frame */
  place: Place;
  /** local room coords -> world */
  toWorld: (c: Cell, lx: number, lz: number) => [number, number];
}

export interface InteriorSpec {
  id: string;
  name: string;
  jp: string;
  theme: keyof typeof THEMES;
  cols: number;
  rows: number;
  cell?: number;
  levelRange: [number, number];
  enemies: SpawnerDef['enemies'];
  /** where the door leads back to */
  exit: { map: string; x: number; z: number; facing: number; label: string };
  /** story content for the room farthest from the door */
  goal?: (ctx: InteriorCtx, c: Cell) => void;
  /** chance an ordinary cell gets a curse spawner */
  density?: number;
  loops?: number;
}

export function interiorMap(spec: InteriorSpec): MapDef {
  const T = THEMES[spec.theme];
  const C = spec.cell ?? 10;
  const W = spec.cols * C + 2, D = spec.rows * C + 2;
  let seed = 1;
  let L = generate(spec.cols, spec.rows, C, new Rng(seed), spec.loops ?? 0.15);

  const def: MapDef = {
    id: spec.id, name: spec.name, jp: spec.jp, size: [W, D], night: T.night, interior: true,
    lighting: T.lighting, music: T.music, ambience: T.ambience, weather: 'none', levelRange: spec.levelRange,
    terrain: {
      kinds: T.kinds, scales: T.scales, tint: T.tint, minimap: T.minimap,
      paint: (p: SplatPainter) => {
        p.fill(3);
        for (const c of L.cells) p.rect(c.room ? 1 : 0, c.x, c.z, C - 0.2, C - 0.2, 0.05, 0);
        // runner along the hall network: the generated pathway reads at a glance
        for (const c of L.cells) for (const s of c.links) {
          if (s !== 1 && s !== 2) continue;
          const n = L.cells[(c.j + DJ[s]) * L.cols + c.i + DI[s]];
          if (c.room || n.room) continue;
          const w = 2.2;
          if (s === 1) p.rect(2, c.x + C / 2, c.z, C + w, w, 0.05, 0);
          else p.rect(2, c.x, c.z + C / 2, w, C + w, 0.05, 0);
        }
        // doorway thresholds into rooms
        for (const c of L.cells) if (c.room) for (const s of c.links) p.rect(0, c.x + DI[s] * (C / 2), c.z + DJ[s] * (C / 2), s % 2 ? 1.0 : DOOR, s % 2 ? DOOR : 1.0, 0.05, 0);
        p.rect(0, L.entry.x, L.entry.z + C / 2, DOOR, 1.2, 0.05, 0);
      },
    },
    surfaces: T.surfaces,
    spawn: { x: 0, z: 0, facing: Math.PI },
    prepare: (s) => {
      seed = s;
      L = generate(spec.cols, spec.rows, C, new Rng(seed), spec.loops ?? 0.15);
      def.spawn = { x: L.entry.x, z: L.entry.z + C / 2 - 1.8, facing: Math.PI };
    },
    build: (b) => buildInterior(b, spec, T, L, new Rng(seed ^ 0x5bd1e995)),
  };
  def.spawn = { x: L.entry.x, z: L.entry.z + C / 2 - 1.8, facing: Math.PI };
  return def;
}

const CUT = 0.42; // camera-side walls are cut down to this fraction of full height

function buildInterior(b: MapBuilder, spec: InteriorSpec, T: Theme, L: Layout, rng: Rng) {
  const { C, cols, rows, cells, entry } = L;
  b.rng = new Rng(rng.int(1, 1e9));
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= cols || j >= rows ? null : cells[j * cols + i]);
  const x0 = -cols * C / 2, z0 = -rows * C / 2;

  /** 'wall' | 'door' | 'open' for the edge on side `s` of cell (i,j) (cell may be outside on one side). */
  const edge = (c: Cell | null, n: Cell | null, s: Side): 'wall' | 'door' | 'open' => {
    if (!c || !n) {
      const inner = c ?? n!;
      return inner === entry && ((c && s === 2) || (n && s === 0)) ? 'door' : 'wall';
    }
    if (!c.links.includes(s)) return 'wall';
    return c.room || n.room ? 'door' : 'open';
  };

  const posts = new Map<string, { x: number; z: number; tall: boolean }>();
  const post = (x: number, z: number, tall: boolean) => {
    const key = `${Math.round(x * 10)},${Math.round(z * 10)}`;
    const p = posts.get(key);
    if (p) p.tall ||= tall; else posts.set(key, { x, z, tall });
  };
  /** One wall run with an optional doorway in the middle. */
  const run = (ax: number, az: number, bx: number, bz: number, kind: 'wall' | 'door' | 'open', sy: number) => {
    if (kind === 'open') return;
    const tall = sy >= 1;
    post(ax, az, tall); post(bx, bz, tall);
    if (kind === 'wall') { b.wall(T.wall, ax, az, bx, bz, 4, sy); return; }
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    const g = DOOR / 2;
    b.wall(T.wall, ax, az, mx - ux * g, mz - uz * g, 4, sy);
    b.wall(T.wall, mx + ux * g, mz + uz * g, bx, bz, 4, sy);
    post(mx - ux * g, mz - uz * g, tall); post(mx + ux * g, mz + uz * g, tall);
  };

  // horizontal runs (E-W). The north edge stays full height; everything in front of the camera is cut away.
  for (let j = -1; j < rows; j++) for (let i = 0; i < cols; i++) {
    const c = at(i, j), n = at(i, j + 1);
    const z = z0 + (j + 1) * C;
    run(x0 + i * C, z, x0 + (i + 1) * C, z, edge(c, n, 2), j === -1 ? 1 : CUT);
  }
  // vertical runs (N-S) are full height: they don't hide anything from this camera
  for (let i = -1; i < cols; i++) for (let j = 0; j < rows; j++) {
    const c = at(i, j), n = at(i + 1, j);
    const x = x0 + (i + 1) * C;
    run(x, z0 + j * C, x, z0 + (j + 1) * C, edge(c, n, 1), 1);
  }
  for (const p of posts.values()) b.prop(p.tall ? T.post : T.postLow, p.x, p.z);

  const toWorld = (c: Cell, lx: number, lz: number): [number, number] => {
    const a = FRONT_YAW[c.front];
    return [c.x + lx * Math.cos(a) + lz * Math.sin(a), c.z - lx * Math.sin(a) + lz * Math.cos(a)];
  };
  const placer = (c: Cell, frameYaw: number): Place => {
    const fn = ((name: string, lx: number, lz: number, rot = 0, scale = 1) => {
      const a = frameYaw;
      const wx = c.x + lx * Math.cos(a) + lz * Math.sin(a), wz = c.z - lx * Math.sin(a) + lz * Math.cos(a);
      b.prop(name, wx, wz, rot + a, scale);
      return fn;
    }) as Place;
    fn.p = fn;
    return fn;
  };

  for (const c of cells) {
    // light per cell, a little off-centre so shadows read
    const fl = rng.chance(T.light.flicker);
    b.light(c.x + rng.range(-1, 1), 2.6, c.z + rng.range(-1, 1), T.light.color, T.light.intensity * (c.room ? 0.9 : 1), T.light.range, fl);
    if (c === L.goal && spec.goal) {
      spec.goal({ b, rng, layout: L, place: placer(c, FRONT_YAW[c.front]), toWorld }, c);
      continue;
    }
    if (c === entry) {
      const walls = ([0, 1, 3] as Side[]).filter(s => !c.links.includes(s));
      T.hall(placer(c, 0), rng, walls, C);
      continue;
    }
    if (c.room) T.room(placer(c, FRONT_YAW[c.front]), rng, c, C);
    else T.hall(placer(c, 0), rng, ([0, 1, 2, 3] as Side[]).filter(s => !c.links.includes(s)), C);
    if (rng.chance(spec.density ?? (c.room ? 0.6 : 0.4))) {
      b.spawner({ enemies: spec.enemies, x: c.x, z: c.z, w: C - 4, d: C - 4, count: rng.int(1, 2), respawn: 35, level: spec.levelRange });
    }
  }

  // the door back outside
  const ex = spec.exit;
  b.portal({ x: entry.x, z: entry.z + C / 2 - 0.5, r: 1.1, to: ex.map, toX: ex.x, toZ: ex.z, toFacing: ex.facing, label: ex.label, style: 'door', rot: Math.PI });
  b.prop('exitSign', entry.x + DOOR / 2 + 0.6, entry.z + C / 2 - 0.3, 0);
  void TAU;
}

// ---------------------------------------------------------------------------
// The buildings
// ---------------------------------------------------------------------------

const has = (q: string) => (ps: import('../rpg/PlayerState').PlayerState) => !!ps.questState(q);
const isActive = (q: string) => (ps: import('../rpg/PlayerState').PlayerState) => ps.questState(q)?.state === 'active';

export const INTERIORS: Record<string, MapDef> = {
  sugisawaIn: interiorMap({
    id: 'sugisawaIn', name: 'Sugisawa Third High — Corridors', jp: '杉沢第三高校 校舎', theme: 'school', cols: 5, rows: 3,
    levelRange: [2, 5], enemies: [{ id: 'flyhead', w: 2 }, { id: 'crawler', w: 2 }, { id: 'lanky' }],
    exit: { map: 'sugisawa', x: 0, z: 1.6, facing: 0, label: 'Courtyard' },
    goal: ({ b, place, toWorld }, c) => {
      // the Occult Research Club room, where the seal on the finger was broken
      place('bookshelf', -3, -4.2, 0).p('bookshelf', 3, -4.2, 0);
      place('chabudai', 0, -1.6).p('cursedBox', 0.2, -1.5, 0.4).p('tvSet', -3.6, 1.6, Math.PI / 2);
      const [sx, sz] = toWorld(c, 1.4, 0.6), [ix, iz] = toWorld(c, -1.6, 0.2);
      const face = Math.atan2(c.x - sx, c.z - sz) + Math.PI;
      const cond = (ps: import('../rpg/PlayerState').PlayerState) => has('m1c')(ps) && ps.questState('m2')?.state !== 'done';
      b.npc({ id: 'sasaki', x: sx, z: sz, facing: face, cond });
      b.npc({ id: 'iguchi', x: ix, z: iz, facing: face, pose: 'sit', cond });
      b.scene({ x: c.x, z: c.z, r: 4.2, flag: 'scene_occult', cond: isActive('m1c'), lines: [
        { who: 'narrator', text: 'A cramped club room. Candles, a ouija board, a small wooden box with its paper seal torn clean off. It is empty.' },
        { who: 'narrator', text: 'Two students huddle in the corner. The boy is clutching a bleeding arm.' },
        { who: 'player', text: 'Senpai! Sasaki-senpai, Iguchi-senpai — are you okay?!', only: ['yuji'] },
        { who: 'player', text: 'You two opened that box. Do you have any idea what was in it?', only: ['megumi'] },
        { who: 'player', text: 'Occult club, huh. You picked the worst possible night to do your homework.', only: ['nobara'] },
      ] });
    },
  }),
  eishuIn: interiorMap({
    id: 'eishuIn', name: 'Eishu Detention — Admin Block', jp: '英集少年院 管理棟', theme: 'prison', cols: 4, rows: 4,
    levelRange: [8, 11], enemies: [{ id: 'womb', w: 2 }, { id: 'hound', w: 2 }, { id: 'wretch' }],
    exit: { map: 'eishu', x: -13.2, z: 16, facing: Math.PI / 2, label: 'Detention yard' },
    goal: ({ b, place, toWorld }, c) => {
      place('bunkBed', -3.4, -2.6, 0).p('metalTable', 2.6, -3.4, 0);
      const [px, pz] = toWorld(c, 0, -1.2);
      b.pickup('nameTag', px, pz, 's_okazaki');
      b.scene({ x: c.x, z: c.z, r: 4, flag: 'scene_okazaki', cond: isActive('s_okazaki'), lines: [
        { who: 'narrator', text: 'The last cell. Whatever happened here happened quickly. On the floor lies a laminated inmate tag.' },
        { who: 'narrator', text: 'OKAZAKI TADASHI.' },
        { who: 'player', text: '...His mom was waiting at the gate. She kept asking if he was okay.', only: ['yuji'] },
        { who: 'player', text: 'We were sent here to confirm deaths, not to save anyone. I hate that the higher-ups were right.', only: ['megumi'] },
        { who: 'player', text: '...Let\'s at least take this back to her.', only: ['nobara'] },
      ] });
    },
  }),
  theaterIn: interiorMap({
    id: 'theaterIn', name: 'Kawasaki Cinema', jp: '川崎 映画館', theme: 'theater', cols: 4, rows: 3,
    levelRange: [13, 16], enemies: [{ id: 'transfigured', w: 3 }, { id: 'bloated' }],
    exit: { map: 'kawasaki', x: -16, z: -5.2, facing: 0, label: 'Kawasaki streets' },
    goal: ({ b, place, rng }, c) => {
      place('cinemaScreen', 0, -4.5, 0);
      for (let r = 0; r < 4; r++) for (const x of [-2.2, 2.2]) place('theaterSeats', x, -1.2 + r * 1.35, 0, 0.62);
      b.spawner({ enemies: [{ id: 'transfigured' }], x: c.x, z: c.z, w: 5, d: 5, count: 3, respawn: 40, level: [14, 16] });
      void rng;
      b.scene({ x: c.x, z: c.z, r: 4.5, flag: 'scene_screen3', cond: has('m6'), lines: [
        { who: 'narrator', text: 'Screen 3. The film is still flickering. Three seats in the back row hold what used to be three high school boys.' },
        { who: 'narrator', text: 'Their bodies have been folded and stretched like clay. Their student IDs say Satozakura High.' },
        { who: 'player', text: 'Satozakura... that\'s the school Nanami mentioned. Somebody did this for fun.', only: ['yuji'] },
        { who: 'player', text: 'A cursed technique that reshapes the body itself. This isn\'t a normal curse.', only: ['megumi'] },
        { who: 'player', text: 'I\'m going to find whoever did this and nail them to the wall.', only: ['nobara'] },
        { who: 'narrator', text: 'Ticket stubs are scattered under the seats, all from the same screening. Every one of them is from tonight.' },
      ] });
    },
  }),
  stationIn: interiorMap({
    id: 'stationIn', name: 'Shibuya Station — B5F', jp: '渋谷駅 地下五階', theme: 'station', cols: 5, rows: 4,
    levelRange: [27, 32], enemies: [{ id: 'shibuyaTransfig', w: 2 }, { id: 'hand' }, { id: 'fish' }],
    exit: { map: 'shibuya', x: 0, z: -28.6, facing: 0, label: 'Shibuya streets' },
    goal: ({ b, place, toWorld }, c) => {
      place('trackBed', 0, -3.9, 0);
      for (const x of [-3, 3]) place('stationPillar', x, -1.6);
      const [bx, bz] = toWorld(c, 0, -0.8);
      b.boss({ id: 'choso', x: bx, z: bz, r: 5.5, quest: 'm11p', intro: [
        { who: 'narrator', text: 'B5F, the Fukutoshin Line platform. The tiles are cracked in a perfect square where something was sealed away.' },
        { who: 'narrator', text: 'A man in a dark robe waits by the tracks, a stripe of blood across his nose. Two more like him lie still at his feet.' },
        { who: 'choso', text: 'You. You\'re the one who killed my little brothers, Eso and Kechizu.', only: ['yuji'] },
        { who: 'choso', text: 'You. You\'re one of the sorcerers who killed my little brothers, Eso and Kechizu.', not: ['yuji'] },
        { who: 'choso', text: 'I am Choso, the eldest of the Death Paintings. An older brother protects his siblings. That is all I am.' },
        { who: 'player', text: 'Get out of my way. Gojo-sensei is down here somewhere.', only: ['yuji'] },
        { who: 'player', text: 'Blood Manipulation. Same as the Kamo clan... Let\'s go, Divine Dogs.', only: ['megumi'] },
        { who: 'player', text: 'Big brother act, huh? I\'ve got one of those too. Mine doesn\'t bleed on people.', only: ['nobara'] },
      ] });
      // after the fight
      b.scene({ x: bx, z: bz, r: 7, flag: 'scene_choso', cond: (ps) => ps.questState('m11p')?.state === 'ready', lines: [
        { who: 'narrator', text: 'Choso staggers back against a pillar... and freezes, staring at you as if he is seeing someone else.' },
        { who: 'choso', text: 'Why... why do I remember eating dinner with you? Laughing with you? You\'re... my little brother?', only: ['yuji'] },
        { who: 'player', text: 'Huh?! I\'m not your— I\'ve never seen you before in my life!', only: ['yuji'] },
        { who: 'choso', text: 'This fight is over. Get out of my way.', not: ['yuji'] },
        { who: 'narrator', text: 'He vanishes into the tunnel. On the platform, the square of cracked tiles is empty. The Prison Realm is gone.' },
        { who: 'narrator', text: 'Far down the tracks, a man in monk\'s robes walks away with a small cube in his hand. He has Suguru Geto\'s face. Stitches run across his forehead.' },
        { who: 'narrator', text: 'By the time you reach the end of the platform, he is gone. Ijichi needs to hear about this.' },
      ] });
    },
  }),
  dormIn: interiorMap({
    id: 'dormIn', name: 'Jujutsu High — First-Year Dorm', jp: '高専 学生寮', theme: 'dorm', cols: 4, rows: 2,
    levelRange: [8, 12], enemies: [{ id: 'tsukamoto' }], density: 0,
    exit: { map: 'hub', x: -18.6, z: -6, facing: Math.PI / 2, label: 'School grounds' },
    goal: ({ b, place }, c) => {
      // Yuji's room: one TV, a stack of terrible movies, and a cursed doll that punches you if your energy wavers
      place('tatami', 0, 0.2, 0).p('futon', -2.6, -2.2, 0).p('tvSet', 0, -4.1, 0).p('chabudai', 0, -1.4).p('bookshelf', 3.4, -4.2, 0);
      b.spawner({ enemies: [{ id: 'tsukamoto' }], x: c.x, z: c.z, w: 5, d: 5, count: 3, respawn: 6, level: [8, 12], cond: isActive('s_movies') });
      b.scene({ x: c.x, z: c.z, r: 4, flag: 'scene_movies', cond: isActive('s_movies'), lines: [
        { who: 'narrator', text: 'A TV is playing a terrible B-movie on loop. On the futon sit three stitched dolls with boxing gloves.' },
        { who: 'narrator', text: 'The moment your cursed energy flickers, the nearest one opens its eyes.' },
      ] });
    },
  }),
};
