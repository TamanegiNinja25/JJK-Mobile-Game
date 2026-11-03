// Parametric anime-style humanoid: one builder drives every sorcerer and NPC.
//
// Since 2.7.9 bodies have realistic proportions, about seven heads tall, instead of the old chibi
// build: long legs, a waist, shoulders and a neck, and a smaller head with a tapered jaw and an
// anime face sized to it. Jujutsu High uniforms are long coats with a stand-up collar, a row of
// buttons and a hood. The skirts of coats, robes and kimonos are panels that swing with each thigh,
// so a kick opens the coat instead of passing through it. Hair is layered strands (see hair.ts).
// Every character keeps the overall height it had, so collisions, cameras and health bars still fit.
import * as THREE from 'three';
import { G, V3, concat, LOW_POLY } from '../geo';
import { RigBuilder, RigModel, resetPose } from '../rig';
import { TAU, clamp, lerp } from '../../core/util';
import { darken, lighten, mix } from './colors';
import { buildHair } from './hair';

export { darken, lighten } from './colors';

export type HairStyle =
  | 'yuji' | 'megumi' | 'nobara' | 'gojo' | 'nanami' | 'maki' | 'inumaki' | 'shoko' | 'todo'
  | 'yaga' | 'ijichi' | 'junpei' | 'meimei' | 'mahito' | 'geto' | 'miwa' | 'bald' | 'short' | 'bun' | 'long'
  | 'bob' | 'choso' | 'yuta' | 'naoya' | 'pompadour' | 'kashimo' | 'uro' | 'mai' | 'sukunaBack' | 'toji' | 'kamo'
  | 'hakari' | 'uraume' | 'kenjaku';

export type Outfit = 'uniform' | 'uniformHood' | 'uniformSkirt' | 'suit' | 'labcoat' | 'casual' | 'robe' | 'tank' | 'patchwork' | 'kimono' | 'uniformHigh';

export interface HumanoidSpec {
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  eyes: number;
  outfit: Outfit;
  top: number;          // jacket / shirt colour
  bottom: number;       // trousers / skirt colour
  accent: number;       // buttons, trims
  shoes: number;
  inner?: number;       // hood / shirt / tie colour
  height?: number;      // 1 = standard
  bulk?: number;        // 1 = standard build
  head?: number;        // head size multiplier
  glasses?: 'round' | 'goggles' | 'shades' | 'blindfold' | 'none';
  extras?: ('scars' | 'stitches' | 'collar' | 'tie' | 'braid' | 'eyepatch' | 'mask' | 'facescar' | 'sukunaMarks' | 'cursedEyes' | 'gloves' | 'bloodStripe' | 'browStitch' | 'bandage'
    | 'goatee' | 'leopardTie' | 'eyeBags' | 'mole' | 'backPolearm' | 'hairpin' | 'zipper'
    | 'katana' | 'gavel' | 'staff' | 'stubble' | 'piercings' | 'secondFace' | 'bellyMouth' | 'ring' | 'scarf' | 'wristMarks'
    | 'lipScar' | 'wormCurse' | 'kesa' | 'scissors' | 'longCoat' | 'fourEyes' | 'surgicalMask')[];
  outline?: number;
  /** silhouette, so characters aren't one body in different colours: leg length and shoulder width */
  legs?: number;
  shoulders?: number;
  /** eye shape: round (open, young), sharp (focused), narrow (cold, menacing), tired (heavy lids) */
  eyeShape?: 'round' | 'sharp' | 'narrow' | 'tired';
  /** a woman's build: narrower shoulders, a waist, wider hips */
  fem?: boolean;
  /** how far a coat, robe or kimono reaches below the hips: 0 hip length, 1 the knee, 2 the ankle (each outfit has its own default) */
  coat?: number;
  /** a hood hanging behind the collar: its colour, or true for the coat's own */
  hood?: number | boolean;
}

export interface Humanoid extends RigModel {
  spec: HumanoidSpec;
  /** bone used for weapons in the right hand */
  hand: THREE.Bone;
  handL: THREE.Bone;
  anim: HumanoidAnimator;
  /** size of the face against the old chibi head (expressions scale their moves by it) */
  faceK: number;
}

/** overall scale: keeps every character about the height it was before 2.7.9 */
const S0 = 1.03;
/** how far each outfit's coat reaches by default (see HumanoidSpec.coat) */
const COAT: Record<Outfit, number> = {
  uniform: 1.0, uniformHood: 1.0, uniformHigh: 1.08, uniformSkirt: 0, suit: 0.14, labcoat: 1.12,
  casual: 0, robe: 1.92, tank: 0, patchwork: 0, kimono: 1.95,
};

/** Every measurement of one body, worked out once from its spec. */
interface Body {
  r: RigBuilder;
  spec: HumanoidSpec;
  fem: boolean;
  /** length scale (height) and width scale (build) */
  S: number; W: number;
  LU: number; LL: number; AH: number; hipY: number; SC: number; CS: number; CN: number; NH: number;
  SW: number; AU: number; AL: number; hipW: number;
  /** head: radius, centre (in the head bone's space), eye placement, and the face's scale against the old head */
  hr: number; hc: V3; eyeX: number; eyeY: number; eyeZ: number; fk: number;
  chest: { rx: number; ry: number; rz: number; y: number };
  waist: [number, number, number];
  waistZ: number;
  pelvis: { rx: number; ry: number; rz: number };
  arm: [number, number, number, number];
  leg: [number, number, number, number];
  /** how far the coat reaches below the hip joints (0: no coat skirt) */
  coatLen: number;
}

function measure(r: RigBuilder, spec: HumanoidSpec): Body {
  const H = spec.height ?? 1, B = spec.bulk ?? 1, fem = !!spec.fem;
  const S = S0 * H;
  const W = S0 * B * (0.7 + 0.3 * H);
  const legs = spec.legs ?? 1, sh = spec.shoulders ?? 1;
  const LU = 0.455 * S * legs, LL = 0.43 * S * legs, AH = 0.072 * S;
  const hipY = LU + LL + AH + 0.035 * S + 0.013 * S;
  const hr = 0.106 * S0 * (spec.head ?? 1) * (0.68 + 0.32 * H);
  const hc: V3 = [0, hr * 0.98, hr * 0.04];
  const f = spec.coat ?? COAT[spec.outfit];
  const coatLen = f <= 0 ? 0 : f <= 1 ? f * LU : LU + (f - 1) * LL * 0.92;
  return {
    r, spec, fem, S, W, LU, LL, AH, hipY,
    SC: 0.21 * S, CS: 0.25 * S, CN: 0.285 * S, NH: 0.072 * S,
    SW: (fem ? 0.148 : 0.17) * W * sh,
    AU: 0.29 * S, AL: 0.255 * S,
    hipW: (fem ? 0.09 : 0.086) * W,
    hr, hc, eyeX: hr * 0.36, eyeY: hc[1] - hr * 0.08, eyeZ: hc[2] + hr * 0.835, fk: hr / 0.215,
    chest: { rx: (fem ? 0.135 : 0.158) * W * Math.sqrt(sh), ry: 0.155 * S, rz: (fem ? 0.104 : 0.112) * W, y: 0.115 * S },
    waist: fem ? [0.142 * W, 0.118 * W, 0.13 * W] : [0.138 * W, 0.13 * W, 0.152 * W],
    waistZ: fem ? 0.8 : 0.74,
    pelvis: { rx: (fem ? 0.158 : 0.145) * W, ry: 0.1 * S, rz: (fem ? 0.112 : 0.104) * W },
    arm: fem ? [0.041 * W, 0.034 * W, 0.034 * W, 0.027 * W] : [0.048 * W, 0.04 * W, 0.04 * W, 0.031 * W],
    leg: fem ? [0.074 * W, 0.05 * W, 0.05 * W, 0.034 * W] : [0.076 * W, 0.054 * W, 0.054 * W, 0.038 * W],
    coatLen,
  };
}

// ------------------------------------------------------------------ geometry helpers

const lp = (n: number, min: number) => Math.max(min, Math.round(n * LOW_POLY.factor));

/** An open shell seen from both sides: the outer surface, and an inner copy pushed in by `th` and turned to face inward. */
function shell2(g: THREE.BufferGeometry, th: number): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const a = g.index ? g.toNonIndexed() : g;
  a.computeVertexNormals();
  const b = a.clone();
  const P = b.getAttribute('position') as THREE.BufferAttribute, N = b.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    P.setXYZ(i, P.getX(i) - N.getX(i) * th, P.getY(i) - N.getY(i) * th, P.getZ(i) - N.getZ(i) * th);
    N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
  }
  // reverse the winding so the inner copy faces the other way
  for (let i = 0; i + 2 < P.count; i += 3) {
    for (const A of [P, N]) {
      const x = A.getX(i + 1), y = A.getY(i + 1), z = A.getZ(i + 1);
      A.setXYZ(i + 1, A.getX(i + 2), A.getY(i + 2), A.getZ(i + 2));
      A.setXYZ(i + 2, x, y, z);
    }
  }
  return [concat([a]), b];
}

/** Part of a cone frustum around Y, hanging down from y = 0: radius `rt` at the top, `rb` at the bottom. theta 0 = front (+z), PI/2 = +x. */
function panel(rt: number, rb: number, h: number, t0: number, tl: number, seg = 10, hseg = 2) {
  const g = new THREE.CylinderGeometry(rt, rb, h, lp(seg, 5), hseg, true, t0, tl);
  g.translate(0, -h / 2, 0);
  return g;
}

/** The anime head: an egg-shaped skull narrowing into the jaw and a pointed chin, `hr` in radius. */
function headGeo(hr: number) {
  const g = new THREE.SphereGeometry(1, lp(26, 14), lp(20, 11));
  const P = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i) * 0.92, y = P.getY(i) * 1.04, z = P.getZ(i);
    if (y < 0.15) {
      const t = Math.min(1, (0.15 - y) / 1.19);
      const front = Math.max(0, z);
      x *= 1 - 0.42 * Math.pow(t, 1.25);
      z *= z < 0 ? 1 - 0.35 * t : 1 - 0.06 * t;
      y -= 0.16 * t * t * (0.4 + 0.6 * front);
    }
    if (z > 0.55) z = 0.55 + (z - 0.55) * 0.8;
    P.setXYZ(i, x * hr, y * hr, z * hr);
  }
  g.computeVertexNormals();
  return g;
}

/** A surface of revolution around Y from [radius, height] points, `zs` deep for every unit wide. */
function lathe(pts: [number, number][], zs: number, seg = 14) {
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), lp(seg, 7));
  g.scale(1, 1, zs);
  return g;
}

// ------------------------------------------------------------------ the builder

export function buildHumanoid(spec: HumanoidSpec): Humanoid {
  const r = new RigBuilder();
  const b = measure(r, spec);
  skeleton(b);
  torso(b);
  limbs(b);
  outfit(b);
  head(b);
  // eyes, brows, nose, mouth and the marks on a face get a fine ink line: the full one swallows them
  r.ink = 0.32;
  face(b);
  r.ink = undefined;
  extras(b);
  // every hair part on the head gets the anime sheen: a light band across the crown
  r.partDefaults = { bone: 'head', o: { shine: { y: b.hc[1] + b.hr * 0.72, band: b.hr * 0.16, k: 0.3 } } };
  buildHair(r, spec, b.hr, b.hc);
  r.partDefaults = null;

  const model = r.build({ outline: spec.outline ?? 0.016 });
  const hm = model as Humanoid;
  hm.spec = spec;
  hm.hand = model.bones.handR;
  hm.handL = model.bones.handL;
  hm.faceK = b.fk;
  hm.anim = new HumanoidAnimator(hm);
  return hm;
}

function skeleton(b: Body) {
  const { r, S } = b;
  r.bone('hips', 'root', [0, b.hipY, 0]);
  r.bone('spine', 'hips', [0, 0.05 * S, 0]);
  r.bone('chest', 'spine', [0, b.SC, 0]);
  r.bone('neck', 'chest', [0, b.CN, -0.008 * S]);
  r.bone('head', 'neck', [0, b.NH, 0.006 * S]);
  // face bones: eyes close (blink, smile), brows tilt, the mouth opens — for dialogue art and talking
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('eye' + s, 'head', [sx * b.eyeX, b.eyeY, b.eyeZ]);
    r.bone('brow' + s, 'head', [sx * b.eyeX * 1.04, b.eyeY + b.hr * 0.3, b.eyeZ - b.hr * 0.01], [0, sx * 0.3, sx * 0.1]);
  }
  r.bone('mouth', 'head', [0, b.hc[1] - b.hr * 0.74, b.hc[2] + b.hr * 0.71]);
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    r.bone('armUp' + s, 'chest', [sx * b.SW, b.CS, -0.006 * S]);
    r.bone('armLow' + s, 'armUp' + s, [0, -b.AU, 0]);
    r.bone('hand' + s, 'armLow' + s, [0, -b.AL, 0]);
    r.bone('legUp' + s, 'hips', [sx * b.hipW, -0.035 * S, 0]);
    r.bone('legLow' + s, 'legUp' + s, [0, -b.LU, 0]);
    r.bone('foot' + s, 'legLow' + s, [0, -b.LL, 0]);
  }
}

/** Front surface of the chest at height y (chest bone space): how far forward it is. */
function chestFront(b: Body, y: number) {
  const c = b.chest, t = (y - c.y) / c.ry;
  return c.rz * Math.sqrt(Math.max(0, 1 - t * t));
}
/** Front surface of the waist at height y (spine bone space). */
function waistFront(b: Body, y: number) {
  const [w0, w1, w2] = b.waist, k = clamp(y / b.SC, 0, 1);
  const rad = k < 0.45 ? lerp(w0, w1, k / 0.45) : lerp(w1, w2, (k - 0.45) / 0.55);
  return rad * b.waistZ;
}

function torso(b: Body) {
  const { r, spec, S, W, fem } = b;
  const o = spec.outfit;
  const top = spec.top, bottom = spec.bottom;
  const skin = spec.skin;
  const tank = o === 'tank';
  const coatOver = b.coatLen > 0 || o.startsWith('uniform') || o === 'suit';
  // pelvis: trousers, or the coat over them
  r.part('hips', G.ellipsoid(b.pelvis.rx, b.pelvis.ry, b.pelvis.rz, 14, 9), coatOver ? top : bottom, { pos: [0, -0.012 * S, -0.004 * S] });
  // waist and belly
  const [w0, w1, w2] = b.waist;
  r.part('spine', lathe([[w0 * 0.9, -0.03 * S], [w0, 0], [w1, b.SC * 0.45], [w2, b.SC + 0.03 * S], [w2 * 0.7, b.SC + 0.06 * S]], b.waistZ), top);
  // ribcage and chest
  const c = b.chest;
  r.part('chest', G.ellipsoid(c.rx, c.ry, c.rz, 16, 11), top, { pos: [0, c.y, 0] });
  if (fem) for (const sx of [1, -1]) r.part('chest', G.ellipsoid(0.05 * W, 0.044 * W, 0.034 * W, 12, 8), top, { pos: [sx * 0.054 * W, c.y + 0.014 * S, c.rz * 0.76], smooth: true });
  // the slope from the neck out to the shoulders
  // (a vest stops short of the bare shoulders)
  r.part('chest', G.ellipsoid(tank ? b.SW * 0.72 : b.SW + 0.004 * W, 0.034 * S, 0.074 * W, 14, 7), top, { pos: [0, b.CS - 0.004 * S, -0.012 * S] });
  r.part('chest', G.ellipsoid(b.SW * 0.55, 0.05 * S, 0.07 * W, 12, 7), top, { pos: [0, b.CS + 0.014 * S, -0.014 * S] });
  if (tank) {
    // a vest: bare upper chest and shoulders, a strap over each
    r.part('chest', G.ellipsoid(c.rx * 0.45, c.ry * 0.36, c.rz * 0.5, 12, 7), skin, { pos: [0, c.y + c.ry * 0.7, c.rz * 0.58] });
    r.part('chest', G.ellipsoid(c.rx * 0.4, c.ry * 0.3, c.rz * 0.4, 10, 6), skin, { pos: [0, c.y + c.ry * 0.82, -c.rz * 0.5] });
  }
}

function limbs(b: Body) {
  const { r, spec, S, W } = b;
  const o = spec.outfit;
  const skin = spec.skin;
  const bare = o === 'tank';
  const sleeve = spec.top;
  const gloves = spec.extras?.includes('gloves');
  const uniform = o.startsWith('uniform') && o !== 'uniformSkirt';
  const hw = S0 * (0.75 + 0.25 * (spec.bulk ?? 1)) * (0.8 + 0.2 * (spec.height ?? 1));
  const [a0, a1, a2, a3] = b.arm;
  for (const s of ['L', 'R'] as const) {
    const sx = s === 'L' ? 1 : -1;
    // shoulder (deltoid) and arm
    r.part('armUp' + s, G.ellipsoid(a0 * 1.08, a0 * 1.2, a0 * 1.1, 10, 8), bare ? skin : sleeve, { pos: [0, -0.02 * S, 0] });
    r.part('armUp' + s, G.limb(a0, a1, b.AU * 0.98), bare ? skin : sleeve);
    r.part('armLow' + s, G.limb(a2, a3, b.AL * 0.94), bare ? skin : sleeve);
    if ((spec.bulk ?? 1) > 1.15) {
      // biceps and forearm muscle
      r.part('armUp' + s, G.ellipsoid(a0 * 1.12, b.AU * 0.3, a0 * 1.18, 10, 7), bare ? skin : sleeve, { pos: [0, -b.AU * 0.45, a0 * 0.18] });
      r.part('armLow' + s, G.ellipsoid(a2 * 1.12, b.AL * 0.26, a2 * 1.1, 10, 7), bare ? skin : sleeve, { pos: [0, -b.AL * 0.25, 0] });
    }
    if (!bare) {
      // the cuff, a shade darker
      r.part('armLow' + s, G.cyl(a3 + 0.009 * W, a3 + 0.012 * W, 0.045 * S, 10, false), darken(sleeve, 0.82), { pos: [0, -b.AL * 0.86, 0] });
    }
    // hand: a loose fist and a thumb
    const hc = gloves ? 0x1c1c22 : skin;
    r.part('hand' + s, G.ellipsoid(0.03 * hw, 0.045 * hw, 0.027 * hw, 10, 8), hc, { pos: [0, -0.046 * hw, 0.004 * hw] });
    r.part('hand' + s, G.ellipsoid(0.011 * hw, 0.024 * hw, 0.011 * hw, 6, 5), hc, { pos: [sx * -0.022 * hw, -0.032 * hw, 0.02 * hw], rot: [0, 0, sx * 0.5] });
    // Sukuna's black bands around each wrist
    if (spec.extras?.includes('wristMarks')) for (let i = 0; i < 2; i++) r.part('hand' + s, G.cyl(0.03 * hw, 0.03 * hw, 0.008 * hw, 10, false), 0x141014, { pos: [0, 0.012 * hw - i * 0.016 * hw, 0] });
  }
  const [l0, l1, l2, l3] = b.leg;
  const skirt = o === 'uniformSkirt';
  const legCol = skirt ? 0x1a1a1f : spec.bottom; // dark tights under a skirt
  for (const s of ['L', 'R'] as const) {
    r.part('legUp' + s, G.limb(l0, l1, b.LU), legCol);
    // uniform trousers are cut wide at the ankle
    r.part('legLow' + s, G.limb(l2, uniform ? l3 * 1.3 : l3, b.LL - 0.012 * S), legCol);
    // shoe: the upper, the toe and a darker sole
    const sh = spec.shoes;
    r.part('foot' + s, G.ellipsoid(0.044 * S0, 0.04 * S0, 0.07 * S0, 10, 7), sh, { pos: [0, -0.032 * S, 0.035 * S] });
    r.part('foot' + s, G.ellipsoid(0.043 * S0, 0.031 * S0, 0.072 * S0, 10, 6), sh, { pos: [0, -0.044 * S, 0.105 * S] });
    r.part('foot' + s, G.box(0.088 * S0, 0.02 * S, 0.255 * S0), darken(sh, 0.5), { pos: [0, -0.062 * S, 0.05 * S] });
  }
}

/** Coats, collars, buttons, hoods, lapels, skirts and sashes: what the outfit adds over the body. */
function outfit(b: Body) {
  const { r, spec, S, W } = b;
  const o = spec.outfit;
  const top = spec.top, accent = spec.accent;
  const inner = spec.inner ?? 0x222222;
  const uniform = o.startsWith('uniform');
  const c = b.chest;

  // ---- the coat's skirt: a panel on each thigh (they swing with the legs, so a stride or a kick opens the
  // coat at the front) and one behind the hips
  if (b.coatLen > 0.05 && b.coatLen < b.LU * 0.45) {
    // a jacket that ends just below the hips: a fitted hem, open a little at the front
    const L = b.coatLen + 0.1 * S;
    const [ho, hi] = shell2(panel(b.pelvis.rx * 1.05, b.pelvis.rx * 1.1, L, 0.22, TAU - 0.44, 16, 1), 0.005 * S);
    r.part('hips', ho, top, { pos: [0, 0.07 * S, -0.004 * S], scale: [1, 1, 0.84] });
    r.part('hips', hi, darken(top, 0.55), { pos: [0, 0.07 * S, -0.004 * S], scale: [1, 1, 0.84] });
  } else if (b.coatLen > 0.05) {
    const L = b.coatLen + 0.1 * S;
    const long = b.coatLen > b.LU * 1.2;
    const flare = (long ? 0.08 : 0.05) * W;
    const legCol = o === 'kimono' ? spec.bottom : top;
    const lining = darken(legCol, 0.55);
    const rt = 0.118 * W;
    for (const s of ['L', 'R'] as const) {
      const sx = s === 'L' ? 1 : -1;
      // from just past the middle of the front, round the outer side, to the back
      const t0 = sx > 0 ? -1.12 : -2.2, tl = 3.32;
      const [out, inn] = shell2(panel(rt, rt + flare, L, t0, tl, 20, long ? 4 : 3), 0.006 * S);
      const at: V3 = [sx * 0.006 * W, 0.1 * S, -0.006 * S];
      r.part('legUp' + s, out, legCol, { pos: at });
      r.part('legUp' + s, inn, lining, { pos: at });
    }
    // behind: fills the gap between the two thigh panels
    const br = b.pelvis.rx * 1.1;
    const [out, inn] = shell2(panel(br, br + flare * 1.4, L - 0.03 * S, Math.PI - 0.95, 1.9, 12, 3), 0.006 * S);
    r.part('hips', out, legCol, { pos: [0, 0.04 * S, -0.008 * S] });
    r.part('hips', inn, lining, { pos: [0, 0.04 * S, -0.008 * S] });
  }

  // ---- Jujutsu High: stand-up collar, a placket with gold buttons, a hood, the jacket hem
  if (uniform) {
    const high = o === 'uniformHigh';
    const ch = (high ? 0.125 : 0.058) * S;
    const [co, ci] = shell2(new THREE.CylinderGeometry(0.05 * S0, 0.058 * S0, ch, lp(14, 8), 1, true), 0.005 * S);
    const cy = b.CN + ch / 2 - 0.022 * S;
    r.part('chest', co, top, { pos: [0, cy, -0.008 * S] });
    r.part('chest', ci, darken(top, 0.6), { pos: [0, cy, -0.008 * S] });
    // placket: a dark seam down the front, chest then belly
    const seam = darken(top, 0.55);
    const yTop = b.CS - 0.01 * S;
    r.part('chest', G.box(0.007 * W, yTop - (c.y - c.ry * 0.85), 0.004 * S), seam, { pos: [0.004 * W, (yTop + c.y - c.ry * 0.85) / 2, chestFront(b, c.y) + 0.002 * S] });
    r.part('spine', G.box(0.007 * W, b.SC * 0.9, 0.004 * S), seam, { pos: [0.004 * W, b.SC * 0.5, waistFront(b, b.SC * 0.5) + 0.002 * S] });
    // buttons: three down the chest, two on the belly
    const btn = (bone: string, y: number, z: number) => {
      r.part(bone, G.sphere(0.011 * S0, 8, 6), accent, { pos: [0.012 * W, y, z + 0.005 * S], glow: 0.25 });
      r.part(bone, G.torus(0.006 * S0, 0.0018 * S0, 3, 8), darken(accent, 0.55), { pos: [0.012 * W, y, z + 0.0145 * S] });
    };
    for (let i = 0; i < 3; i++) { const y = b.CS - 0.035 * S - i * 0.075 * S; btn('chest', y, chestFront(b, y)); }
    for (let i = 0; i < 2; i++) { const y = b.SC * (0.72 - i * 0.48); btn('spine', y, waistFront(b, y)); }
    if (o === 'uniformSkirt') {
      // a short jacket over the skirt: its hem flares at the hips
      const [ho, hi] = shell2(panel(b.pelvis.rx * 1.06, b.pelvis.rx * 1.2, 0.1 * S, 0, TAU, 14, 1), 0.005 * S);
      r.part('hips', ho, top, { pos: [0, 0.03 * S, -0.004 * S] });
      r.part('hips', hi, darken(top, 0.6), { pos: [0, 0.03 * S, -0.004 * S] });
    }
  }
  const hood = spec.hood ?? (o === 'uniformHood' ? inner : o === 'uniform' ? true : false);
  if (hood !== false) {
    const hc = hood === true ? top : hood;
    // the hood's edge runs right round the collar, dipping at the front
    const rim = new THREE.TorusGeometry(0.068 * S0, 0.022 * S0, lp(6, 4), lp(18, 10));
    rim.rotateX(Math.PI / 2 + 0.3);
    r.part('chest', rim, hc, { pos: [0, b.CN - 0.004 * S, -0.016 * S] });
    // the hood itself lies folded on the upper back
    r.part('chest', G.ellipsoid(0.112 * W, 0.085 * S, 0.05 * W, 12, 8), hc, { pos: [0, b.CN - 0.1 * S, -c.rz - 0.022 * W], rot: [0.22, 0, 0] });
    r.part('chest', G.ellipsoid(0.07 * W, 0.045 * S, 0.026 * W, 10, 6), darken(hc, 0.55), { pos: [0, b.CN - 0.065 * S, -c.rz - 0.04 * W], rot: [0.5, 0, 0] });
  }

  // ---- suits: lapels over a white shirt, a tie, the jacket hem
  if (o === 'suit') {
    const lap = darken(top, 0.86);
    r.part('chest', G.box(0.075 * W, c.ry * 1.0, 0.006 * S), 0xf2f0ea, { pos: [0, c.y + c.ry * 0.38, chestFront(b, c.y + c.ry * 0.38) - 0.002 * S], rot: [-0.16, 0, 0] });
    for (const sx of [1, -1]) r.part('chest', G.box(0.036 * W, c.ry * 1.2, 0.008 * S), lap, { pos: [sx * 0.05 * W, c.y + c.ry * 0.22, chestFront(b, c.y + c.ry * 0.1) + 0.005 * S], rot: [-0.12, 0, -sx * 0.3] });
    for (let i = 0; i < 2; i++) { const y = b.SC * (0.62 - i * 0.4); r.part('spine', G.sphere(0.009 * S0, 6, 5), darken(top, 0.6), { pos: [0, y, waistFront(b, y) + 0.004 * S] }); }
  }
  if (spec.extras?.includes('tie') || o === 'suit') {
    if (spec.extras?.includes('tie')) {
      // Nanami's tie is leopard print: dark rosettes over the base colour
      const leopard = spec.extras.includes('leopardTie');
      r.part('chest', G.box(0.028 * W, c.ry * 1.05, 0.012 * S), inner, {
        pos: [0, c.y + c.ry * 0.18, chestFront(b, c.y + c.ry * 0.18) + 0.011 * S], rot: [-0.14, 0, 0],
        colorFn: leopard ? (x, y, _z, col) => { if (Math.sin(x * 330 + y * 77) * Math.sin(y * 180) > 0.35) col.setHex(0x2a1a10); } : undefined,
      });
      r.part('chest', G.box(0.03 * W, 0.022 * S, 0.016 * S), inner, { pos: [0, b.CS - 0.03 * S, chestFront(b, b.CS - 0.03 * S) + 0.013 * S] });
    }
  }
  // ---- a lab coat: open down the front over a dark top
  if (o === 'labcoat') {
    r.part('chest', G.box(0.08 * W, c.ry * 1.3, 0.008 * S), inner, { pos: [0, c.y + c.ry * 0.1, chestFront(b, c.y) + 0.001 * S] });
    r.part('spine', G.box(0.07 * W, b.SC, 0.008 * S), inner, { pos: [0, b.SC * 0.5, waistFront(b, b.SC * 0.5) + 0.001 * S] });
    for (const sx of [1, -1]) r.part('chest', G.box(0.045 * W, c.ry * 1.25, 0.012 * S), lighten(top, 1.02), { pos: [sx * 0.058 * W, c.y + c.ry * 0.05, chestFront(b, c.y) + 0.004 * S], rot: [-0.05, 0, sx * 0.2] });
  }
  // ---- robes and kimonos: a crossed collar, an obi sash, wide sleeves
  if (o === 'robe' || o === 'kimono') {
    const trim = o === 'kimono' ? (spec.inner ?? accent) : inner;
    for (const sx of [1, -1]) r.part('chest', G.box(0.03 * W, c.ry * 1.5, 0.012 * S), trim, { pos: [sx * 0.042 * W, c.y + c.ry * 0.28, chestFront(b, c.y + c.ry * 0.1) + 0.004 * S], rot: [-0.12, 0, -sx * 0.4] });
    r.part('spine', G.cyl(b.waist[0] * 1.06, b.waist[0] * 1.08, 0.085 * S, 16), accent, { pos: [0, 0.045 * S, 0], scale: [1, 1, b.waistZ + 0.04] });
    for (const s of ['L', 'R'] as const) {
      const [so, si] = shell2(panel(b.arm[2] + 0.02 * W, b.arm[2] + 0.075 * W, b.AL * 0.78, 0, TAU, 12, 1), 0.005 * S);
      r.part('armLow' + s, so, top, { pos: [0, -0.02 * S, -0.012 * S] });
      r.part('armLow' + s, si, darken(top, 0.6), { pos: [0, -0.02 * S, -0.012 * S] });
    }
  }
  // ---- Mahito: a patchwork shirt held together with seams
  if (o === 'patchwork') {
    const seam = 0x5a5a6a;
    for (let i = 0; i < 4; i++) r.part('chest', G.box(0.06 * W, 0.004 * S, 0.004 * S), seam, { pos: [0.03 * W, c.y + c.ry * (0.5 - i * 0.3), chestFront(b, c.y + c.ry * (0.5 - i * 0.3)) + 0.002 * S], rot: [0, 0, 0.5] });
    r.part('chest', G.box(0.004 * W, c.ry * 1.4, 0.004 * S), seam, { pos: [0.03 * W, c.y, chestFront(b, c.y) + 0.002 * S] });
    r.part('spine', G.box(0.09 * W, 0.004 * S, 0.004 * S), seam, { pos: [-0.02 * W, b.SC * 0.5, waistFront(b, b.SC * 0.5) + 0.002 * S], rot: [0, 0, -0.3] });
  }
  // ---- casual: an open shirt collar
  if (o === 'casual' && spec.hood === undefined) {
    r.part('chest', G.torus(0.052 * S0, 0.012 * S0, 4, 12), darken(top, 0.85), { pos: [0, b.CN - 0.018 * S, -0.004 * S], rot: [Math.PI / 2 + 0.25, 0, 0] });
  }
  // ---- a pleated skirt (uniform skirts)
  if (o === 'uniformSkirt') {
    const L = 0.36 * S;
    const [so, si] = shell2(panel(b.pelvis.rx * 1.02, b.pelvis.rx * 1.75, L, 0, TAU, 16, 1), 0.005 * S);
    const pleat = darken(spec.bottom, 0.72);
    r.part('hips', so, spec.bottom, { pos: [0, 0.035 * S, 0], colorFn: (x, _y, z, col) => { if (Math.sin(Math.atan2(x, z) * 8) > 0.55) col.setHex(pleat); } });
    r.part('hips', si, darken(spec.bottom, 0.5), { pos: [0, 0.035 * S, 0] });
  }
}

function head(b: Body) {
  const { r, spec, S } = b;
  const skin = spec.skin;
  const nr = (b.fem ? 0.034 : 0.04) * S0 * (0.85 + 0.15 * (spec.bulk ?? 1));
  r.part('neck', G.cyl(nr * 0.95, nr * 1.08, b.NH + 0.07 * S, 12), skin, { pos: [0, (b.NH + 0.07 * S) / 2 - 0.02 * S, 0], smooth: true });
  r.part('head', headGeo(b.hr), skin, { pos: b.hc, smooth: true });
  // ears
  for (const sx of [1, -1]) r.part('head', G.ellipsoid(0.15 * b.hr, 0.27 * b.hr, 0.11 * b.hr, 8, 6), skin, { pos: [sx * b.hr * 0.86, b.hc[1] - b.hr * 0.16, b.hc[2] - b.hr * 0.06], rot: [0, sx * 0.35, 0], smooth: true, ink: 0.5 });
}

/** Eyes, brows, nose and mouth, and the marks on a face (scars, stitches, Sukuna's eyes, glasses, masks). */
function face(b: Body) {
  const { r, spec, hr, hc, eyeX, eyeY, eyeZ, fk } = b;
  const skin = spec.skin;
  const glasses = spec.glasses ?? 'none';
  const ex = spec.extras ?? [];
  if (glasses !== 'blindfold') {
    // eye shape: how open the eye is, how the lash line slants, and how heavy it is
    const shape = spec.eyeShape ?? 'round';
    const ey = shape === 'sharp' ? 0.78 : shape === 'narrow' ? 0.6 : shape === 'tired' ? 0.8 : 1;
    // positive: inner corners low (a hard stare); negative: inner corners high (soft, worried, tired)
    const slant = shape === 'sharp' ? 0.14 : shape === 'narrow' ? 0.24 : shape === 'tired' ? -0.18 : -0.08;
    const browTilt = shape === 'sharp' ? 0.16 : shape === 'narrow' ? 0.24 : shape === 'tired' ? -0.1 : 0;
    const glow = ex.includes('cursedEyes') ? 0.55 : 0.12;
    for (const sx of [1, -1]) {
      const yaw = sx * 0.32, eb = sx === 1 ? 'eyeL' : 'eyeR';
      // eyeball, iris, pupil and highlight ride the eye bone
      r.part(eb, G.ellipsoid(hr * 0.2, hr * 0.13 * ey, hr * 0.07, 12, 8), 0xf9f7f2, { rot: [0, yaw, 0], smooth: true });
      r.part(eb, G.ellipsoid(hr * 0.122, hr * 0.122 * Math.max(0.8, ey), hr * 0.06, 12, 8), spec.eyes, { pos: [-sx * hr * 0.012, -hr * 0.006, hr * 0.022], rot: [0, yaw, 0], smooth: true, glow, topColor: darken(spec.eyes, 0.5) });
      r.part(eb, G.ellipsoid(hr * 0.058, hr * 0.078 * Math.max(0.8, ey), hr * 0.035, 8, 6), 0x08080e, { pos: [-sx * hr * 0.016, -hr * 0.008, hr * 0.04], rot: [0, yaw, 0], smooth: true });
      r.part(eb, G.sphere(hr * 0.03, 6, 4), 0xffffff, { pos: [-sx * hr * 0.03 + hr * 0.035, hr * 0.045 * ey, hr * 0.06], glow: 0.3 });
      // upper lash line (stays put, so a closed eye reads as a line); its slant carries the expression
      const lidY = hr * 0.125 * ey;
      r.part('head', G.box(hr * 0.46, hr * 0.045, hr * 0.05), 0x15121a, { pos: [sx * eyeX, eyeY + lidY, eyeZ + hr * 0.025], rot: [0, yaw, sx * slant] });
      // the outer corner flicks out a little
      r.part('head', G.box(hr * 0.12, hr * 0.032, hr * 0.04), 0x15121a, { pos: [sx * (eyeX + hr * 0.22), eyeY + lidY - hr * 0.035, eyeZ - hr * 0.035], rot: [0, yaw * 1.5, sx * (slant - 0.55)] });
      // a soft lower lash
      r.part('head', G.box(hr * 0.28, hr * 0.018, hr * 0.03), darken(skin, 0.62), { pos: [sx * (eyeX + hr * 0.02), eyeY - hr * 0.12 * ey, eyeZ + hr * 0.008], rot: [0, yaw, sx * 0.08] });
      if (shape === 'tired') r.part('head', G.ellipsoid(hr * 0.21, hr * 0.06, hr * 0.05, 10, 6), darken(skin, 0.86), { pos: [sx * eyeX, eyeY + lidY - hr * 0.04, eyeZ + hr * 0.02], rot: [0, yaw, sx * 0.08] });
      // brow (its bone carries the tilt)
      r.part(sx === 1 ? 'browL' : 'browR', G.box(hr * 0.34, hr * 0.045, hr * 0.045), darken(spec.hair, 0.6), { rot: [0, 0, sx * browTilt] });
    }
    if (ex.includes('sukunaMarks')) {
      for (const sx of [1, -1]) {
        // the marks under the eyes, and a second pair of eyes beneath the first
        r.part('head', G.box(hr * 0.3, hr * 0.05, hr * 0.05), 0x8a0d18, { pos: [sx * eyeX, eyeY - hr * 0.33, eyeZ - hr * 0.01], rot: [0, sx * 0.32, 0] });
        r.part('head', G.ellipsoid(hr * 0.12, hr * 0.06, hr * 0.05), 0xff2a3a, { pos: [sx * (eyeX + hr * 0.1), eyeY - hr * 0.2, eyeZ - hr * 0.05], rot: [0, sx * 0.45, 0], glow: 1.5 });
      }
    }
  }
  // nose
  r.part('head', G.ellipsoid(hr * 0.065, hr * 0.13, hr * 0.07, 6, 5), darken(skin, 0.92), { pos: [0, hc[1] - hr * 0.36, hc[2] + hr * 0.84], rot: [0.3, 0, 0], smooth: true });
  r.part('head', G.ellipsoid(hr * 0.055, hr * 0.045, hr * 0.05, 6, 5), darken(skin, 0.86), { pos: [0, hc[1] - hr * 0.45, hc[2] + hr * 0.88], smooth: true });
  if (ex.includes('surgicalMask')) {
    r.part('head', G.ellipsoid(hr * 0.66, hr * 0.42, hr * 0.38, 12, 8), 0xf2f2ee, { pos: [0, hc[1] - hr * 0.6, hc[2] + hr * 0.5], smooth: true });
    for (const sx of [1, -1]) r.part('head', G.box(0.008 * fk, 0.008 * fk, hr * 0.9), 0xd8d8d0, { pos: [sx * hr * 0.66, hc[1] - hr * 0.42, hc[2]], rot: [0, sx * 0.3, 0] });
  }
  if (!ex.includes('collar') && !ex.includes('mask') && !ex.includes('surgicalMask')) {
    r.part('mouth', G.box(hr * 0.26, hr * 0.035, hr * 0.04), 0x6a2a2a);
  }
  if (glasses === 'round' || glasses === 'shades' || glasses === 'goggles') {
    const lens = glasses === 'shades' ? 0x101014 : glasses === 'goggles' ? 0x2a2c34 : 0x9ad8ff;
    for (const sx of [1, -1]) {
      r.part('head', G.torus(hr * 0.2, hr * 0.03, 5, 14), 0x222228, { pos: [sx * eyeX, eyeY, eyeZ + hr * 0.15], rot: [0, sx * 0.2, 0] });
      r.part('head', G.ellipsoid(hr * 0.19, glasses === 'goggles' ? hr * 0.13 : hr * 0.18, hr * 0.025, 10, 6), lens, { pos: [sx * eyeX, eyeY, eyeZ + hr * 0.15], rot: [0, sx * 0.2, 0], glow: glasses === 'round' ? 0.25 : 0.05 });
      // arms back to the ears
      r.part('head', G.box(hr * 0.02, hr * 0.03, hr * 0.85), 0x222228, { pos: [sx * hr * 0.8, eyeY + hr * 0.02, hc[2] + hr * 0.4] });
    }
    r.part('head', G.box(hr * 0.24, hr * 0.03, hr * 0.03), 0x222228, { pos: [0, eyeY + hr * 0.04, eyeZ + hr * 0.17] });
  }
  if (glasses === 'blindfold') {
    r.part('head', G.cyl(hr * 0.96, hr * 0.98, hr * 0.42, 18, false), 0x111116, { pos: [0, eyeY + hr * 0.04, hc[2] - hr * 0.01], scale: [0.96, 1, 1.0] });
  }
  if (ex.includes('eyepatch')) r.part('head', G.ellipsoid(hr * 0.22, hr * 0.22, hr * 0.06), 0x111111, { pos: [eyeX, eyeY, eyeZ + hr * 0.12] });
  if (ex.includes('collar') || ex.includes('mask')) {
    // a high zipped collar over the mouth (Inumaki), or a mask over the lower face
    r.part('head', G.cyl(hr * 0.86, hr * 0.74, hr * 0.78, 16, false), ex.includes('mask') ? 0x1a1a1a : spec.top, { pos: [0, hc[1] - hr * 0.72, hc[2] + hr * 0.04] });
  }
  if (ex.includes('facescar') || ex.includes('scars')) r.part('head', G.box(hr * 0.05, hr * 0.5, hr * 0.04), darken(skin, 0.6), { pos: [-eyeX - hr * 0.06, eyeY - hr * 0.08, eyeZ + hr * 0.02], rot: [0, -0.3, 0.3] });
  if (ex.includes('goatee')) {
    r.part('head', G.ellipsoid(hr * 0.22, hr * 0.2, hr * 0.12, 8, 6), darken(spec.hair, 0.9), { pos: [0, hc[1] - hr * 0.98, hc[2] + hr * 0.62] });
    r.part('head', G.box(hr * 0.42, hr * 0.05, hr * 0.05), darken(spec.hair, 0.9), { pos: [0, hc[1] - hr * 0.62, hc[2] + hr * 0.76] });
  }
  if (ex.includes('eyeBags')) for (const sx of [1, -1]) r.part('head', G.box(hr * 0.26, hr * 0.03, hr * 0.03), darken(skin, 0.68), { pos: [sx * eyeX, eyeY - hr * 0.2, eyeZ + hr * 0.02], rot: [0, sx * 0.32, sx * -0.12] });
  if (ex.includes('mole')) r.part('head', G.sphere(hr * 0.035, 5, 4), 0x2a1a18, { pos: [-eyeX - hr * 0.06, eyeY - hr * 0.3, eyeZ - hr * 0.02], smooth: true });
  if (ex.includes('zipper')) {
    r.part('head', G.box(hr * 0.05, hr * 0.6, hr * 0.05), 0xb8bcc4, { pos: [0, hc[1] - hr * 0.72, hc[2] + hr * 0.86] });
    r.part('head', G.box(hr * 0.12, hr * 0.13, hr * 0.06), 0xd8dce4, { pos: [0, hc[1] - hr * 0.42, hc[2] + hr * 0.88] });
  }
  if (ex.includes('hairpin')) {
    for (let i = 0; i < 2; i++) r.part('head', G.box(hr * 0.32, hr * 0.065, hr * 0.065), 0xe8d06a, { pos: [-hr * 0.62, hc[1] + hr * (0.55 - i * 0.14), hc[2] + hr * 0.7], rot: [0, -0.5, 0.4], glow: 0.15 });
  }
  if (ex.includes('bloodStripe')) r.part('head', G.box(hr * 1.45, hr * 0.12, hr * 0.06), 0x5a0e16, { pos: [0, eyeY - hr * 0.2, eyeZ + hr * 0.02] });
  if (ex.includes('browStitch')) {
    // Kenjaku: the stitched seam across the forehead
    r.part('head', G.box(hr * 1.3, hr * 0.035, hr * 0.04), 0x3a2a2a, { pos: [0, eyeY + hr * 0.6, eyeZ - hr * 0.12], rot: [-0.32, 0, 0] });
    for (let i = 0; i < 7; i++) r.part('head', G.box(hr * 0.03, hr * 0.13, hr * 0.04), 0x3a2a2a, { pos: [-hr * 0.55 + i * hr * 0.18, eyeY + hr * 0.6, eyeZ - hr * 0.1], rot: [-0.32, 0, 0] });
  }
  if (ex.includes('stitches')) {
    for (let i = 0; i < 6; i++) r.part('head', G.box(hr * 0.13, hr * 0.028, hr * 0.028), 0x2a2030, { pos: [-hr * 0.42 + i * hr * 0.055, eyeY - hr * 0.08 - i * hr * 0.13, eyeZ + hr * 0.04 - i * hr * 0.02], rot: [0, 0, 0.6] });
    r.part('head', G.box(hr * 0.035, hr * 0.9, hr * 0.035), 0x2a2030, { pos: [-hr * 0.4, eyeY - hr * 0.3, eyeZ + hr * 0.02], rot: [0, 0, 0.5] });
  }
  if (ex.includes('stubble')) r.part('head', G.ellipsoid(hr * 0.58, hr * 0.42, hr * 0.46, 10, 6), darken(skin, 0.8), { pos: [0, hc[1] - hr * 0.72, hc[2] + hr * 0.3] });
  if (ex.includes('piercings')) {
    for (const sx of [1, -1]) for (let i = 0; i < 2; i++) r.part('head', G.torus(hr * 0.06, hr * 0.018, 4, 8), 0xd8dce4, { pos: [sx * hr * 0.92, hc[1] - hr * (0.2 + i * 0.16), hc[2] - hr * 0.04], rot: [0, Math.PI / 2, 0], glow: 0.3 });
  }
  if (ex.includes('secondFace')) {
    // Heian-era Sukuna: a second face grown over the right side of the head
    const fx = -hr * 0.72, fz = hc[2] + hr * 0.58;
    r.part('head', G.ellipsoid(hr * 0.36, hr * 0.5, hr * 0.2, 10, 8), darken(skin, 0.9), { pos: [fx, hc[1] - hr * 0.08, fz], rot: [0, -0.9, 0] });
    for (const dy of [0.1, -0.06]) r.part('head', G.ellipsoid(hr * 0.12, hr * 0.06, hr * 0.045), 0xff2a3a, { pos: [fx - hr * 0.08, hc[1] + hr * dy, fz + hr * 0.18], rot: [0, -0.9, 0], glow: 1.4 });
    r.part('head', G.box(hr * 0.28, hr * 0.045, hr * 0.045), 0x4a0a10, { pos: [fx - hr * 0.12, hc[1] - hr * 0.36, fz + hr * 0.16], rot: [0, -0.9, 0] });
  }
  if (ex.includes('fourEyes')) {
    // Tengen: a second, smaller pair of eyes above the first
    for (const sx of [1, -1]) {
      r.part('head', G.ellipsoid(hr * 0.13, hr * 0.15, hr * 0.06, 10, 6), 0xf9f7f2, { pos: [sx * eyeX * 0.8, eyeY + hr * 0.5, eyeZ - hr * 0.08], rot: [0, sx * 0.3, 0], smooth: true });
      r.part('head', G.ellipsoid(hr * 0.07, hr * 0.09, hr * 0.045, 8, 6), 0x2a2a3a, { pos: [sx * eyeX * 0.8, eyeY + hr * 0.5, eyeZ - hr * 0.02], rot: [0, sx * 0.3, 0], glow: 0.2 });
    }
  }
  if (ex.includes('lipScar')) r.part('head', G.box(hr * 0.035, hr * 0.26, hr * 0.04), darken(skin, 0.55), { pos: [hr * 0.09, hc[1] - hr * 0.74, hc[2] + hr * 0.72], rot: [0, 0, -0.2] });
}

/** Accessories and what a character carries: weapons in hand, the polearm, Toji's worm, a scarf, a stole. */
function extras(b: Body) {
  const { r, spec, S, W } = b;
  const ex = spec.extras ?? [];
  const c = b.chest;
  if (ex.includes('backPolearm')) {
    // Maki: a cursed polearm slung across her back
    const z = -c.rz - 0.03 * W;
    r.part('chest', G.cyl(0.014 * S0, 0.014 * S0, 1.55 * S0, 6), 0x5a3a24, { pos: [0, c.y, z], rot: [0, 0, 0.7] });
    const ux = -Math.sin(0.7), uy = Math.cos(0.7);
    r.part('chest', G.cone(0.03 * S0, 0.26 * S0, 4), 0xc8ccd4, { pos: [ux * 0.9 * S0, c.y + uy * 0.9 * S0, z], rot: [0, 0, 0.7], glow: 0.08 });
    r.part('chest', G.box(0.04 * S0, 0.06 * S0, 0.04 * S0), 0x2a2a30, { pos: [ux * 0.74 * S0, c.y + uy * 0.74 * S0, z], rot: [0, 0, 0.7] });
    // the strap across the chest
    r.part('chest', G.box(0.026 * W, c.ry * 2.2, 0.012 * S), 0x3a2a20, { pos: [0, c.y + 0.01 * S, chestFront(b, c.y) + 0.006 * S], rot: [-0.1, 0, -0.7] });
  }
  if (ex.includes('bandage')) {
    r.part('armUpL', G.cyl(b.arm[0] * 1.15, b.arm[0] * 1.15, 0.1 * S, 10), 0xf4f0e8, { pos: [0, -0.12 * S, 0] });
    r.part('armUpL', G.box(0.026 * S0, 0.045 * S0, 0.016 * S0), 0xc02a2a, { pos: [0.018 * S0, -0.1 * S, b.arm[0] * 1.15] });
  }
  if (ex.includes('bellyMouth')) {
    r.part('spine', G.ellipsoid(b.waist[1] * 0.55, 0.045 * S, 0.03 * W, 12, 6), 0x3a0810, { pos: [0, b.SC * 0.35, waistFront(b, b.SC * 0.35)], glow: 0.2 });
    for (let i = 0; i < 6; i++) r.part('spine', G.cone(0.011 * S0, 0.032 * S0, 4), 0xf4efe0, { pos: [(i - 2.5) * b.waist[1] * 0.16, b.SC * 0.35 + 0.025 * S, waistFront(b, b.SC * 0.35) + 0.01 * S], rot: [Math.PI, 0, 0] });
  }
  if (ex.includes('scarf')) {
    const col = spec.inner ?? 0x8a2a2a;
    r.part('neck', G.torus(0.06 * S0, 0.026 * S0, 6, 14), col, { pos: [0, -0.01 * S, 0.006 * S], rot: [Math.PI / 2, 0, 0] });
    r.part('chest', G.box(0.07 * W, 0.24 * S, 0.026 * S), col, { pos: [0.06 * W, b.CS - 0.1 * S, chestFront(b, b.CS - 0.1 * S) + 0.012 * S], rot: [0.12, 0, 0.12] });
  }
  if (ex.includes('ring')) r.part('handL', G.torus(0.012 * S0, 0.004 * S0, 4, 8), 0xd8dce4, { pos: [-0.008 * S0, -0.07 * S0, 0.018 * S0], rot: [Math.PI / 2, 0, 0], glow: 0.6 });
  // held weapons for NPCs and human bosses (the player's weapon is attached separately)
  if (ex.includes('katana')) {
    r.part('handR', G.cyl(0.016 * S0, 0.018 * S0, 0.24 * S0, 6), 0x1a1a22, { pos: [0, -0.06 * S0, 0.02 * S0], rot: [Math.PI / 2, 0, 0] });
    r.part('handR', G.box(0.09 * S0, 0.018 * S0, 0.036 * S0), 0x8a7a4a, { pos: [0, -0.06 * S0, 0.15 * S0], rot: [Math.PI / 2, 0, 0] });
    r.part('handR', G.box(0.028 * S0, 0.008 * S0, 0.82 * S0), 0xe8ecf4, { pos: [0, -0.06 * S0, 0.57 * S0], glow: 0.15 });
  }
  if (ex.includes('gavel')) {
    r.part('handR', G.cyl(0.016 * S0, 0.02 * S0, 0.5 * S0, 6), 0x5a3a24, { pos: [0, -0.06 * S0, 0.18 * S0], rot: [Math.PI / 2, 0, 0] });
    r.part('handR', G.cyl(0.065 * S0, 0.065 * S0, 0.22 * S0, 10), 0x7a5232, { pos: [0, -0.06 * S0, 0.44 * S0], rot: [0, 0, Math.PI / 2] });
    for (const sx of [-1, 1]) r.part('handR', G.cyl(0.07 * S0, 0.07 * S0, 0.022 * S0, 10), 0xd8b04a, { pos: [sx * 0.1 * S0, -0.06 * S0, 0.44 * S0], rot: [0, 0, Math.PI / 2], glow: 0.2 });
  }
  if (ex.includes('staff')) {
    r.part('handR', G.cyl(0.018 * S0, 0.018 * S0, 1.5 * S0, 6), 0x2a3a5a, { pos: [0, -0.06 * S0, 0.1 * S0], rot: [Math.PI / 2, 0, 0] });
    for (const z of [-0.62, 0.82]) r.part('handR', G.cyl(0.028 * S0, 0.028 * S0, 0.08 * S0, 6), 0x6adfff, { pos: [0, -0.06 * S0, z * S0], rot: [Math.PI / 2, 0, 0], glow: 0.9 });
  }
  if (ex.includes('scissors')) {
    for (const sx of [-1, 1]) r.part('handR', G.box(0.018 * S0, 0.008 * S0, 0.7 * S0), 0xc8ccd4, { pos: [sx * 0.018 * S0, -0.06 * S0, 0.38 * S0], rot: [0, sx * 0.12, 0], glow: 0.1 });
    r.part('handR', G.torus(0.036 * S0, 0.011 * S0, 5, 10), 0x3a1a1a, { pos: [0, -0.06 * S0, 0.0], rot: [Math.PI / 2, 0, 0] });
  }
  if (ex.includes('wormCurse')) {
    // Toji's inventory curse, coiled around his shoulders
    for (let i = 0; i < 12; i++) {
      // round the neck and down across the chest, like a sash
      const a = -1.5 + i * 0.32;
      const rr = b.SW * 0.82 + 0.02 * W, y = b.CS + 0.035 * S - Math.max(0, i - 6) * 0.045 * S;
      r.part('chest', G.sphere((0.036 - i * 0.0012) * S0, 8, 6), i % 2 ? 0x8a6aa0 : 0x7a5a90, { pos: [Math.sin(a) * rr * (i > 6 ? 0.8 : 1), y, Math.cos(a) * c.rz * 1.25 - 0.01 * S], smooth: true });
    }
    r.part('chest', G.sphere(0.022 * S0, 6, 4), 0xffd23a, { pos: [Math.sin(-1.5) * (b.SW * 0.82 + 0.02 * W), b.CS + 0.06 * S, Math.cos(-1.5) * c.rz * 1.25 + 0.012 * S], glow: 1.2 });
  }
  if (ex.includes('kesa')) {
    // a monk's stole draped over one shoulder (Geto)
    r.part('chest', G.box(0.08 * W, c.ry * 2.6, 0.026 * S), spec.accent, { pos: [0.04 * W, c.y + 0.02 * S, chestFront(b, c.y) + 0.012 * S], rot: [0.05, 0, -0.5] });
    r.part('chest', G.box(0.08 * W, c.ry * 2.3, 0.026 * S), spec.accent, { pos: [-0.02 * W, c.y + 0.02 * S, -c.rz - 0.012 * S], rot: [-0.05, 0, -0.5] });
  }
}

// ------------------------------------------------------------------------
// Procedural animation
// ------------------------------------------------------------------------

export type ActionName =
  | 'punch1' | 'punch2' | 'punch3' | 'kick' | 'spinKick' | 'uppercut' | 'slam' | 'dash'
  | 'slash1' | 'slash2' | 'slash3' | 'thrust' | 'spin'
  | 'throw' | 'cast' | 'castUp' | 'summon' | 'hammer' | 'clap' | 'hit' | 'die' | 'victory'
  | 'channel' | 'domain' | 'pointUp' | 'wave' | 'bow' | 'sit';

/** Fractions of an action's duration: the strike starts moving at `strike` and connects at `impact`. */
export const ACTION_TIMING = { strike: 0.3, impact: 0.48 };

export class HumanoidAnimator {
  m: Humanoid;
  walkPhase = 0;
  speed = 0;          // current move speed (units/s)
  action: ActionName | null = null;
  actionT = 0;        // 0..1 progress
  actionDur = 0.3;
  hitT = 0;
  dead = false;
  deadT = 0;
  idleT = Math.random() * 10;
  stance: 'fist' | 'blade' | 'hammer' | 'none' = 'none';
  lean = 0;
  /** 0 = standing pose, 1 = full walk cycle; eased so starting and stopping don't pop */
  moveW = 0;
  /** base pose saved before an action is layered on, so actions ease in and out of it */
  private snap: Float32Array | null = null;
  /** called on every foot plant of the walk cycle */
  onStep: (() => void) | null = null;
  /** set while this character is the one speaking in a conversation: the mouth moves */
  talking = false;
  private blinkT = 2 + Math.random() * 3;
  private mouthT = 0;

  constructor(m: Humanoid) { this.m = m; }

  play(a: ActionName, dur: number) {
    this.action = a;
    this.actionT = 0;
    this.actionDur = Math.max(0.05, dur);
  }

  update(dt: number) {
    const m = this.m;
    resetPose(m);
    const b = m.bones;
    this.idleT += dt;
    const sp = this.speed;
    const moving = sp > 0.3;
    if (moving) {
      // a foot plants each time the leg swing reaches an extreme (phase = π/2 + kπ)
      const before = Math.floor((this.walkPhase - Math.PI / 2) / Math.PI);
      this.walkPhase += dt * (4 + sp * 1.55);
      if (Math.floor((this.walkPhase - Math.PI / 2) / Math.PI) !== before && !this.dead) this.onStep?.();
    }
    const run = clamp(sp / 6, 0, 1);
    const ph = this.walkPhase;

    // ---- locomotion ---- (walk cycle and standing pose cross-fade instead of switching)
    this.moveW = clamp(this.moveW + (moving ? 1 : -1) * dt * 7, 0, 1);
    const ww = this.moveW * this.moveW * (3 - 2 * this.moveW);
    if (ww > 0.001 && !this.dead) {
      const sw = Math.sin(ph);
      const amp = lerp(0.55, 0.95, run) * ww;
      b.legUpL.rotation.x = sw * amp;
      b.legUpR.rotation.x = -sw * amp;
      b.legLowL.rotation.x = (Math.max(0, -Math.cos(ph)) * 1.3) * amp + 0.1 * ww;
      b.legLowR.rotation.x = (Math.max(0, Math.cos(ph)) * 1.3) * amp + 0.1 * ww;
      b.armUpL.rotation.x = -sw * amp * 0.8;
      b.armUpR.rotation.x = sw * amp * 0.8;
      b.armLowL.rotation.x = (-0.4 - run * 0.7) * ww;
      b.armLowR.rotation.x = (-0.4 - run * 0.7) * ww;
      b.hips.position.y += Math.abs(Math.cos(ph)) * 0.05 * (0.5 + run) * ww;
      b.spine.rotation.x = (0.08 + run * 0.18) * ww;
      b.hips.rotation.y = sw * 0.12 * ww;
      b.chest.rotation.y = -sw * 0.18 * ww;
      b.head.rotation.x = (-0.05 - run * 0.1) * ww;
    }
    if (ww < 0.999 && !this.dead) {
      // idle breathing + guard stance, layered on top with the remaining weight
      const iw = 1 - ww;
      const br = Math.sin(this.idleT * 2.2);
      b.chest.rotation.x += br * 0.025 * iw;
      b.hips.position.y -= (0.01 + br * 0.006) * iw;
      b.armUpL.rotation.z += (0.12 + br * 0.02) * iw;
      b.armUpR.rotation.z += (-0.12 - br * 0.02) * iw;
      if (this.stance === 'fist') {
        b.legUpL.rotation.x += -0.25 * iw; b.legLowL.rotation.x += 0.35 * iw;
        b.legUpR.rotation.x += 0.2 * iw; b.legLowR.rotation.x += 0.25 * iw;
        b.armUpL.rotation.x += -0.7 * iw; b.armLowL.rotation.x += -1.6 * iw;
        b.armUpR.rotation.x += -0.4 * iw; b.armLowR.rotation.x += -1.8 * iw;
        b.hips.position.y -= 0.04 * iw;
        b.chest.rotation.y += 0.2 * iw;
      } else if (this.stance === 'blade') {
        b.armUpR.rotation.x += -0.4 * iw; b.armLowR.rotation.x += -0.6 * iw;
        b.legUpL.rotation.x += -0.15 * iw; b.legUpR.rotation.x += 0.15 * iw;
      } else if (this.stance === 'hammer') {
        b.armUpR.rotation.x += -0.15 * iw; b.armLowR.rotation.x += -0.9 * iw;
        b.armUpL.rotation.x += -0.2 * iw; b.armLowL.rotation.x += -0.4 * iw;
      }
      b.head.rotation.y += Math.sin(this.idleT * 0.4) * 0.15 * iw;
    }

    // ---- actions ----
    if (this.action && !this.dead) {
      this.actionT += dt / this.actionDur;
      if (this.actionT >= 1) { this.action = null; this.actionT = 0; }
      else {
        // ease from the current stance into the action and back out, instead of snapping to it
        const el = this.actionT * this.actionDur, left = (1 - this.actionT) * this.actionDur;
        const w = Math.min(1, el / 0.07, left / 0.1);
        if (w >= 1) this.applyAction(this.action, this.actionT);
        else {
          this.savePose();
          this.applyAction(this.action, this.actionT);
          this.mixPose(w);
        }
      }
    }

    // ---- hit flinch ----
    if (this.hitT > 0) {
      this.hitT -= dt;
      const k = Math.max(0, this.hitT / 0.25);
      b.spine.rotation.x -= k * 0.35;
      b.head.rotation.x -= k * 0.3;
      b.armUpL.rotation.z += k * 0.5;
      b.armUpR.rotation.z -= k * 0.5;
    }

    if (this.dead) {
      this.deadT = Math.min(1, this.deadT + dt * 2.2);
      const k = this.deadT;
      b.hips.rotation.x = -k * 1.45;
      b.hips.position.y = lerp(m.rest.hips.pos.y, 0.22, k);
      b.armUpL.rotation.z = k * 1.2; b.armUpR.rotation.z = -k * 1.2;
      b.legUpL.rotation.x = k * 0.3;
      b.head.rotation.x = -k * 0.4;
    }

    // ---- face: a blink every few seconds, and a moving mouth while talking ----
    if (b.eyeL && !this.dead) {
      this.blinkT -= dt;
      if (this.blinkT < 0.12) { const s = Math.max(0.08, Math.abs(this.blinkT - 0.06) / 0.06); b.eyeL.scale.y = s; b.eyeR.scale.y = s; }
      if (this.blinkT <= 0) this.blinkT = 2.2 + Math.random() * 3.5;
      if (this.talking) { this.mouthT += dt * 13; b.mouth.scale.y = 1 + Math.max(0, Math.sin(this.mouthT) + Math.sin(this.mouthT * 0.53) * 0.6) * 1.4; }
    }
  }

  private savePose() {
    const bones = this.m.bones;
    let n = 0;
    for (const k in bones) n++;
    if (!this.snap || this.snap.length !== n * 4) this.snap = new Float32Array(n * 4);
    let i = 0;
    for (const k in bones) {
      const b = bones[k];
      this.snap[i++] = b.rotation.x; this.snap[i++] = b.rotation.y; this.snap[i++] = b.rotation.z; this.snap[i++] = b.position.y;
    }
  }

  /** Blend the freshly applied action pose with the saved base pose: w = 1 keeps the action. */
  private mixPose(w: number) {
    const bones = this.m.bones, sn = this.snap!;
    let i = 0;
    for (const k in bones) {
      const b = bones[k];
      b.rotation.x = sn[i] + (b.rotation.x - sn[i]) * w; i++;
      b.rotation.y = sn[i] + (b.rotation.y - sn[i]) * w; i++;
      b.rotation.z = sn[i] + (b.rotation.z - sn[i]) * w; i++;
      b.position.y = sn[i] + (b.position.y - sn[i]) * w; i++;
    }
  }

  private applyAction(a: ActionName, t: number) {
    const b = this.m.bones;
    // windup (0..0.35) -> strike (0.35..0.6) -> recover
    const wind = clamp(t / 0.35, 0, 1);
    const strike = clamp((t - 0.3) / 0.25, 0, 1);
    const rec = clamp((t - 0.6) / 0.4, 0, 1);
    const pose = (w: number, s: number) => (t < 0.3 ? w * wind : lerp(w, s, strike)) * (1 - rec) + 0;
    switch (a) {
      case 'punch1': case 'punch3': {
        const R = a === 'punch1';
        const up = R ? b.armUpR : b.armUpL, low = R ? b.armLowR : b.armLowL;
        up.rotation.x = pose(-0.2, -1.55);
        low.rotation.x = pose(-1.9, -0.05);
        up.rotation.z = (R ? 1 : -1) * pose(0, 0.15);
        b.chest.rotation.y = (R ? 1 : -1) * pose(-0.5, 0.55);
        b.spine.rotation.x = pose(0, 0.2);
        b.legUpL.rotation.x = -0.3 * (1 - rec); b.legUpR.rotation.x = 0.3 * (1 - rec);
        break;
      }
      case 'punch2': {
        b.armUpL.rotation.x = pose(-0.2, -1.55);
        b.armLowL.rotation.x = pose(-1.9, -0.05);
        b.chest.rotation.y = pose(0.5, -0.55);
        b.spine.rotation.x = pose(0, 0.2);
        break;
      }
      case 'kick': {
        b.legUpR.rotation.x = pose(0.3, -1.6);
        b.legLowR.rotation.x = pose(1.4, 0.05);
        b.spine.rotation.x = pose(0, -0.3);
        b.armUpL.rotation.x = pose(0, -0.6);
        b.armUpR.rotation.z = pose(0, -0.8);
        break;
      }
      case 'spinKick': {
        b.hips.rotation.y = t * TAU;
        b.legUpR.rotation.z = -1.3 * Math.sin(t * Math.PI);
        b.legUpR.rotation.x = -0.4 * Math.sin(t * Math.PI);
        b.armUpL.rotation.z = 1.0 * Math.sin(t * Math.PI);
        b.armUpR.rotation.z = -1.0 * Math.sin(t * Math.PI);
        b.hips.position.y += 0.2 * Math.sin(t * Math.PI);
        break;
      }
      case 'uppercut': {
        b.armUpR.rotation.x = pose(0.4, -2.9);
        b.armLowR.rotation.x = pose(-2.0, -0.4);
        b.legUpL.rotation.x = pose(0.4, -0.2);
        b.legLowL.rotation.x = pose(0.8, 0.1);
        b.hips.position.y += pose(-0.12, 0.15);
        b.spine.rotation.x = pose(0.3, -0.3);
        break;
      }
      case 'slam': {
        b.armUpL.rotation.x = pose(-2.9, -0.9);
        b.armUpR.rotation.x = pose(-2.9, -0.9);
        b.armLowL.rotation.x = pose(-0.4, -0.1);
        b.armLowR.rotation.x = pose(-0.4, -0.1);
        b.hips.position.y += pose(0.25, -0.22);
        b.spine.rotation.x = pose(-0.3, 0.6);
        b.legUpL.rotation.x = pose(-0.4, -0.9); b.legLowL.rotation.x = pose(0.6, 1.2);
        b.legUpR.rotation.x = pose(-0.4, 0.4); b.legLowR.rotation.x = pose(0.6, 0.9);
        break;
      }
      case 'dash': {
        b.spine.rotation.x = 0.5;
        b.armUpR.rotation.x = -1.5; b.armLowR.rotation.x = -0.1;
        b.armUpL.rotation.x = 0.8; b.armLowL.rotation.x = -0.6;
        b.legUpL.rotation.x = -0.9; b.legLowL.rotation.x = 1.0;
        b.legUpR.rotation.x = 0.6; b.legLowR.rotation.x = 0.4;
        break;
      }
      case 'slash1': case 'slash3': {
        const k = a === 'slash1' ? 1 : -1;
        b.armUpR.rotation.x = pose(-2.6, -0.6);
        b.armUpR.rotation.z = pose(-0.6 * k, 0.6 * k);
        b.armLowR.rotation.x = pose(-0.6, -0.2);
        b.chest.rotation.y = pose(0.6 * k, -0.7 * k);
        b.spine.rotation.x = pose(-0.1, 0.25);
        break;
      }
      case 'slash2': {
        b.armUpR.rotation.x = pose(-1.4, -1.4);
        b.armUpR.rotation.z = pose(-1.2, 0.9);
        b.armLowR.rotation.x = pose(-0.3, -0.1);
        b.chest.rotation.y = pose(0.9, -0.9);
        break;
      }
      case 'thrust': {
        b.armUpR.rotation.x = pose(-0.6, -1.6);
        b.armLowR.rotation.x = pose(-1.6, 0);
        b.spine.rotation.x = pose(-0.1, 0.3);
        b.legUpL.rotation.x = pose(0, -0.6); b.legLowL.rotation.x = pose(0, 0.5);
        break;
      }
      case 'spin': {
        b.hips.rotation.y = t * TAU * 1.5;
        b.armUpR.rotation.z = -1.4; b.armUpL.rotation.z = 1.4;
        b.armUpR.rotation.x = -0.2;
        break;
      }
      case 'throw': {
        b.armUpR.rotation.x = pose(-3.0, -1.3);
        b.armLowR.rotation.x = pose(-1.2, -0.1);
        b.chest.rotation.y = pose(0.5, -0.4);
        b.armUpL.rotation.x = pose(-1.0, 0.3);
        b.spine.rotation.x = pose(-0.15, 0.25);
        break;
      }
      case 'hammer': {
        b.armUpR.rotation.x = pose(-3.1, -0.8);
        b.armLowR.rotation.x = pose(-0.9, -0.1);
        b.armUpL.rotation.x = pose(-1.2, -0.7);
        b.armLowL.rotation.x = pose(-1.0, -0.5);
        b.spine.rotation.x = pose(-0.25, 0.45);
        b.legUpL.rotation.x = pose(0, -0.5); b.legLowL.rotation.x = pose(0, 0.5);
        break;
      }
      case 'cast': {
        b.armUpL.rotation.x = pose(-0.8, -1.5);
        b.armUpR.rotation.x = pose(-0.8, -1.5);
        b.armUpL.rotation.z = pose(0, -0.25);
        b.armUpR.rotation.z = pose(0, 0.25);
        b.armLowL.rotation.x = pose(-1.0, -0.1);
        b.armLowR.rotation.x = pose(-1.0, -0.1);
        break;
      }
      case 'castUp': {
        b.armUpR.rotation.x = pose(-1.5, -3.0);
        b.armLowR.rotation.x = pose(-0.6, 0);
        b.armUpL.rotation.z = pose(0.3, 0.5);
        b.head.rotation.x = pose(0, -0.4);
        break;
      }
      case 'summon': {
        // hand-sign: hands together in front of chest
        b.armUpL.rotation.x = -0.9; b.armUpR.rotation.x = -0.9;
        b.armUpL.rotation.z = -0.55; b.armUpR.rotation.z = 0.55;
        b.armLowL.rotation.x = -1.3; b.armLowR.rotation.x = -1.3;
        b.armLowL.rotation.z = -0.3; b.armLowR.rotation.z = 0.3;
        b.head.rotation.x = 0.15;
        b.hips.position.y -= 0.05 * Math.sin(t * Math.PI);
        break;
      }
      case 'clap': {
        const c = Math.sin(t * Math.PI);
        b.armUpL.rotation.x = -1.4; b.armUpR.rotation.x = -1.4;
        b.armUpL.rotation.z = -0.6 * c; b.armUpR.rotation.z = 0.6 * c;
        b.armLowL.rotation.x = -0.3; b.armLowR.rotation.x = -0.3;
        break;
      }
      case 'channel': {
        const w = Math.sin(this.idleT * 18) * 0.05;
        b.armUpL.rotation.x = -0.6 + w; b.armUpR.rotation.x = -0.6 - w;
        b.armUpL.rotation.z = 0.7; b.armUpR.rotation.z = -0.7;
        b.armLowL.rotation.x = -0.8; b.armLowR.rotation.x = -0.8;
        b.hips.position.y -= 0.08;
        b.legUpL.rotation.x = -0.3; b.legLowL.rotation.x = 0.5; b.legUpR.rotation.x = -0.3; b.legLowR.rotation.x = 0.5;
        b.legUpL.rotation.z = 0.25; b.legUpR.rotation.z = -0.25;
        break;
      }
      case 'domain': {
        // Hand sign raised to the face
        const k = clamp(t * 4, 0, 1);
        b.armUpR.rotation.x = -1.7 * k; b.armLowR.rotation.x = -1.4 * k;
        b.armUpR.rotation.z = 0.35 * k;
        b.armUpL.rotation.x = -1.2 * k; b.armLowL.rotation.x = -1.6 * k;
        b.armUpL.rotation.z = -0.4 * k;
        b.head.rotation.x = -0.1 * k;
        break;
      }
      case 'pointUp': {
        b.armUpR.rotation.x = -2.8; b.armLowR.rotation.x = -0.1;
        break;
      }
      case 'wave': {
        b.armUpR.rotation.z = -2.5; b.armLowR.rotation.z = Math.sin(t * TAU * 3) * 0.5;
        break;
      }
      case 'bow': {
        b.spine.rotation.x = Math.sin(t * Math.PI) * 0.8;
        break;
      }
      case 'victory': {
        const k = Math.sin(t * Math.PI);
        b.armUpR.rotation.x = -2.9 * k;
        b.armUpL.rotation.z = 0.4 * k;
        b.hips.position.y += 0.15 * k;
        break;
      }
      case 'hit': {
        const k = Math.sin(t * Math.PI);
        b.spine.rotation.x = -0.4 * k;
        b.head.rotation.x = -0.35 * k;
        break;
      }
      case 'sit': {
        b.legUpL.rotation.x = -1.5; b.legUpR.rotation.x = -1.5;
        b.legLowL.rotation.x = 1.5; b.legLowR.rotation.x = 1.5;
        // the seat is about a thigh's length below standing hips
        b.hips.position.y -= -this.m.rest.legLowL.pos.y * 0.92;
        break;
      }
      case 'die':
        break;
    }
  }
}
