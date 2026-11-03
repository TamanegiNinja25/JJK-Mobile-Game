// Layered anime hair (2.7.9). Every style is a scalp cap cut to a hairline, with strands on top of it:
// tapered, slightly curved locks rooted on the scalp in rows, each row overlapping the one above, so the
// hair reads as layers rather than one helmet. Spiky styles use rounder, stiffer strands that point out
// and up; hanging styles lay flat strands down along the head and let the tips flick in or out.
import * as THREE from 'three';
import { G, V3, LOW_POLY } from '../geo';
import { RigBuilder } from '../rig';
import { darken, lighten } from './colors';
import type { HumanoidSpec } from './humanoid';

const TAU = Math.PI * 2;
const lp = (n: number, min: number) => Math.max(min, Math.round(n * LOW_POLY.factor));

interface Ctx {
  r: RigBuilder;
  /** head centre and the cap's radii (an ellipsoid hugging the skull) */
  hc: V3;
  R: V3;
  hr: number;
  c: number;
  /** deterministic variation, so a character looks the same every time */
  seed: number;
}

interface StrandOpts {
  /** growth direction, mixed from: along the surface normal, down the head, up, backward, sideways round the head */
  out?: number; fall?: number; lift?: number; back?: number; side?: number;
  /** bend along the strand: + flicks the tip outward, - curls it in toward the head */
  curl?: number;
  /** thickness against width (0.3 flat lock .. 1 round spike) */
  flat?: number;
  col?: number;
  /** how deep in the scalp the root sits (1 = on the cap) */
  root?: number;
  spike?: boolean;
  /** how much falling hair drops straight down instead of following the skull (default 1) */
  grav?: number;
}

/** Unit vector at polar angle `pol` from the crown and azimuth `az` from the front (+z), +x at az = PI/2. */
function sph(pol: number, az: number): V3 {
  return [Math.sin(pol) * Math.sin(az), Math.cos(pol), Math.sin(pol) * Math.cos(az)];
}

function rand(x: Ctx) {
  x.seed = (x.seed * 16807 + 11) % 2147483647;
  return (x.seed % 10000) / 10000;
}

/** A tapered lock of hair along +Y from the root (y = 0) to the tip (y = len), `w` wide, flat in Z. */
function bladeGeo(len: number, w: number, flat: number, curl: number, spike: boolean) {
  const pts: [number, number][] = spike
    ? [[0, -w * 0.12], [w * 0.5, 0], [w * 0.42, len * 0.32], [w * 0.22, len * 0.7], [0.0004, len]]
    : [[0, -w * 0.16], [w * 0.36, 0], [w * 0.5, len * 0.2], [w * 0.43, len * 0.5], [w * 0.25, len * 0.8], [0.0004, len]];
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), spike ? lp(8, 5) : 4);
  g.scale(1, 1, flat);
  if (curl) {
    const P = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < P.count; i++) {
      const t = Math.max(0, Math.min(1, P.getY(i) / len));
      P.setZ(i, P.getZ(i) + curl * len * t * t);
    }
  }
  g.computeVertexNormals();
  return g;
}

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _a = new THREE.Vector3();
const _m = new THREE.Matrix4();

/** One lock rooted on the scalp at (pol, az). Lengths are in head radii. */
function strand(x: Ctx, pol: number, az: number, len: number, w: number, o: StrandOpts = {}) {
  const { hr, hc, R } = x;
  const n = sph(pol, az);
  _n.set(n[0], n[1], n[2]);
  // down along the head's surface (at the crown: away from the face, toward the strand's azimuth)
  _t.set(n[0] * n[1], -1 + n[1] * n[1], n[2] * n[1]);
  if (_t.lengthSq() < 0.02) _t.set(Math.sin(az), -0.3, Math.cos(az));
  _t.normalize();
  // hair is heavy: below the crown it hangs rather than following the slope of the skull out into a brim
  _t.y -= o.grav ?? 1;
  _t.normalize();
  // round the head, toward growing azimuth
  _a.set(n[2], 0, -n[0]);
  if (_a.lengthSq() < 1e-4) _a.set(1, 0, 0);
  _a.normalize();
  _y.copy(_n).multiplyScalar(o.out ?? 0.3)
    .addScaledVector(_t, o.fall ?? 0)
    .add(_x.set(0, o.lift ?? 0, -(o.back ?? 0)))
    .addScaledVector(_a, o.side ?? 0);
  if (_y.lengthSq() < 1e-6) _y.copy(_n);
  _y.normalize();
  // the broad face of the lock faces outward
  _z.copy(_n).addScaledVector(_y, -_n.dot(_y));
  if (_z.lengthSq() < 1e-4) _z.crossVectors(_y, _a);
  _z.normalize();
  _x.crossVectors(_y, _z).normalize();
  const k = o.root ?? 0.88;
  _m.makeBasis(_x, _y, _z).setPosition(hc[0] + n[0] * R[0] * k, hc[1] + n[1] * R[1] * k, hc[2] + n[2] * R[2] * k);
  const g = bladeGeo(len * hr * 1.38, w * hr * 1.22, o.flat ?? (o.spike ? 0.75 : 0.34), o.curl ?? 0, !!o.spike);
  g.applyMatrix4(_m);
  const col = o.col ?? x.c;
  x.r.part('head', g, darken(col, 0.8), { topColor: lighten(col, 1.1) });
}

/** `n` strands in a row at polar angle `pol`, from azimuth a0 to a1 (a full circle when a1 - a0 >= TAU), lengths varied by `jit`. */
function row(x: Ctx, n: number, pol: number, a0: number, a1: number, len: number, w: number, o: StrandOpts = {}, jit = 0.15, spread = 0) {
  const full = a1 - a0 >= TAU - 1e-3;
  for (let i = 0; i < n; i++) {
    const t = full ? i / n : n === 1 ? 0.5 : i / (n - 1);
    const az = a0 + (a1 - a0) * t + (rand(x) - 0.5) * 0.12;
    // spiky hair: each spike leans its own way, so the head doesn't wear a crown of identical cones
    const oo = spread ? { ...o, side: (o.side ?? 0) + (rand(x) - 0.5) * spread, lift: (o.lift ?? 0) + (rand(x) - 0.5) * spread } : o;
    strand(x, pol + (rand(x) - 0.5) * 0.1, az, len * (1 + (rand(x) - 0.5) * 2 * jit), w * (0.9 + rand(x) * 0.2), oo);
  }
}

/**
 * The scalp cap, cut along a hairline: polar angle `front` at the forehead, `side` above the ears and
 * `back` at the nape. `grow` puffs it out from the skull.
 */
function cap(x: Ctx, front: number, side: number, back: number, col = x.c, grow = 1) {
  const g = new THREE.SphereGeometry(1, lp(28, 16), lp(18, 10)).toNonIndexed();
  const P = g.getAttribute('position') as THREE.BufferAttribute;
  const keep: number[] = [];
  for (let i = 0; i + 2 < P.count; i += 3) {
    const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cy = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
    const l = Math.hypot(cx, cy, cz) || 1;
    const pol = Math.acos(Math.max(-1, Math.min(1, cy / l))), f = Math.cos(Math.atan2(cx, cz));
    const lim = f >= 0 ? side + (front - side) * f : side + (back - side) * -f;
    if (pol <= lim) keep.push(i);
  }
  const pos = new Float32Array(keep.length * 9);
  keep.forEach((i, j) => { for (let v = 0; v < 3; v++) { pos[j * 9 + v * 3] = P.getX(i + v) * x.R[0] * grow; pos[j * 9 + v * 3 + 1] = P.getY(i + v) * x.R[1] * grow; pos[j * 9 + v * 3 + 2] = P.getZ(i + v) * x.R[2] * grow; } });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.computeVertexNormals();
  // smooth normals for the outline: point straight out from the centre
  const N = out.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < N.count; i++) { _n.set(pos[i * 3] / x.R[0], pos[i * 3 + 1] / x.R[1], pos[i * 3 + 2] / x.R[2]).normalize(); N.setXYZ(i, _n.x, _n.y, _n.z); }
  x.r.part('head', out, col, { pos: x.hc, topColor: lighten(col, 1.15) });
}

/** A round lump of hair (a bun, a topknot, a tuft), centred at a point on the head in head radii. */
function lump(x: Ctx, at: V3, rad: V3, col = x.c, rot: V3 = [0, 0, 0]) {
  const { hr, hc } = x;
  x.r.part('head', G.ellipsoid(rad[0] * hr, rad[1] * hr, rad[2] * hr, 12, 9), col, { pos: [hc[0] + at[0] * hr, hc[1] + at[1] * hr, hc[2] + at[2] * hr], rot, topColor: lighten(col, 1.15) });
}

/** A hair tie round a tail or bun. */
function tie(x: Ctx, at: V3, rad: number, col: number, rot: V3 = [Math.PI / 2, 0, 0]) {
  const { hr, hc } = x;
  x.r.part('head', G.torus(rad * hr, 0.06 * hr, 5, 12), col, { pos: [hc[0] + at[0] * hr, hc[1] + at[1] * hr, hc[2] + at[2] * hr], rot });
}

/** A braid: a chain of overlapping lumps from `a` to `b` (head radii), getting thinner toward the end. */
function braid(x: Ctx, a: V3, b: V3, n: number, w: number, col = x.c) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), s = w * (1 - t * 0.4);
    lump(x, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], [s, s * 1.25, s * 0.9], i % 2 ? darken(col, 0.9) : col, [0, 0, (i % 2 ? 1 : -1) * 0.3]);
  }
}

/** A ponytail: a bundle of long locks from one point on the back of the head. */
function tail(x: Ctx, pol: number, az: number, len: number, w: number, o: StrandOpts) {
  for (let i = 0; i < 5; i++) {
    const da = (i - 2) * 0.09, dp = (i % 2) * 0.06;
    strand(x, pol + dp, az + da, len * (0.86 + 0.07 * (i % 3)), w * (i === 2 ? 1.1 : 0.85), { root: 0.95, ...o, side: (o.side ?? 0) + (i - 2) * 0.05 });
  }
}

export function buildHair(r: RigBuilder, spec: HumanoidSpec, hr: number, hc: V3) {
  const c = spec.hair;
  const x: Ctx = { r, hc, hr, c, R: [hr * 1.04, hr * 1.16, hr * 1.1], seed: 7 + spec.hairStyle.length * 131 + (c & 0xffff) };
  const dk = darken(c, 0.75);
  switch (spec.hairStyle) {
    case 'yuji': {
      // pink on top, swept up and back with the tips sticking out; a dark undercut at the sides and back;
      // the fringe juts forward over the brow
      cap(x, 0.9, 1.62, 2.0, 0x3a2626, 0.995);
      cap(x, 1.05, 0.9, 1.0, c, 1.05);
      row(x, 5, 0.25, 0, TAU, 0.42, 0.52, { spike: true, flat: 0.42, out: 0.6, lift: 0.4, back: 0.5 }, 0.2, 0.5);
      row(x, 6, 0.55, -0.9, 0.9, 0.46, 0.5, { spike: true, flat: 0.42, out: 0.7, lift: 0.45, back: -0.2 }, 0.2, 0.5);
      row(x, 6, 0.6, Math.PI - 1.4, Math.PI + 1.4, 0.4, 0.48, { spike: true, flat: 0.42, out: 0.8, lift: 0.25, back: 0.6 }, 0.2, 0.5);
      row(x, 5, 0.88, -0.55, 0.55, 0.36, 0.42, { spike: true, flat: 0.42, out: 0.9, lift: 0.1, fall: 0.25, grav: 0.15 }, 0.2, 0.4);
      break;
    }
    case 'sukunaBack': {
      // Sukuna wearing Yuji: the same pink hair, pushed flat and straight back off the forehead
      cap(x, 1.3, 1.62, 2.0, 0x3a2626, 0.995);
      cap(x, 1.05, 0.98, 1.05, c, 1.05);
      row(x, 7, 0.45, -1.4, 1.4, 0.6, 0.46, { spike: true, flat: 0.45, out: 0.35, back: 1.2, lift: 0.3 }, 0.2, 0.3);
      row(x, 9, 0.85, -1.6, 1.6, 0.55, 0.44, { spike: true, flat: 0.45, out: 0.45, back: 1.1, lift: 0.15 }, 0.2, 0.3);
      row(x, 6, 0.65, Math.PI - 1.2, Math.PI + 1.2, 0.5, 0.42, { spike: true, flat: 0.5, out: 0.6, back: 0.9, lift: 0.2 }, 0.2, 0.3);
      break;
    }
    case 'megumi': {
      // a black sea urchin: long spikes standing out in every direction, a ragged fringe
      cap(x, 1.0, 1.55, 1.88, c, 1.03);
      row(x, 7, 0.18, 0, TAU, 0.7, 0.46, { spike: true, flat: 0.6, out: 0.7, lift: 0.7, back: 0.3 }, 0.2, 0.6);
      row(x, 12, 0.55, 0, TAU, 0.72, 0.46, { spike: true, flat: 0.6, out: 1, lift: 0.25, back: 0.3 }, 0.2, 0.6);
      row(x, 11, 0.98, 1.0, TAU - 1.0, 0.62, 0.44, { spike: true, flat: 0.6, out: 0.95, back: 0.3, fall: 0.1, grav: 0.2 }, 0.2, 0.5);
      row(x, 6, 0.86, -0.7, 0.7, 0.5, 0.38, { spike: true, flat: 0.5, out: 0.45, fall: 0.85, grav: 0.5 }, 0.2, 0.3);
      break;
    }
    case 'nobara': {
      // an orange bob to the chin, the ends flicking out a little, a side-swept fringe
      cap(x, 0.96, 1.62, 2.02, c, 1.05);
      row(x, 14, 0.75, 0.75, TAU - 0.75, 0.82, 0.52, { out: 0.2, fall: 1, curl: -0.05 });
      row(x, 13, 1.15, 1.0, TAU - 1.0, 0.72, 0.52, { out: 0.18, fall: 1, curl: 0.22 });
      row(x, 6, 0.86, -0.85, 0.55, 0.5, 0.44, { out: 0.32, fall: 0.9, side: 0.55, curl: -0.12, grav: 0.4 });
      break;
    }
    case 'gojo': {
      // white hair standing up and out above the blindfold
      cap(x, 0.95, 1.5, 1.82, c, 1.03);
      row(x, 7, 0.12, 0, TAU, 0.75, 0.48, { spike: true, flat: 0.55, out: 0.4, lift: 1.4, back: 0.15 }, 0.2, 0.6);
      row(x, 12, 0.45, 0, TAU, 0.72, 0.46, { spike: true, flat: 0.55, out: 0.7, lift: 0.95, back: 0.15 }, 0.2, 0.6);
      row(x, 12, 0.85, 0, TAU, 0.56, 0.42, { spike: true, flat: 0.55, out: 0.85, lift: 0.55 }, 0.2, 0.5);
      row(x, 5, 0.74, -0.6, 0.6, 0.6, 0.4, { spike: true, flat: 0.55, out: 0.55, lift: 1.05 }, 0.2, 0.5);
      break;
    }
    case 'nanami': {
      // neat blond hair parted at the side and combed over, short at the back
      cap(x, 0.98, 1.5, 1.8, c, 1.03);
      row(x, 14, 0.62, 0.6, TAU - 0.2, 0.52, 0.48, { out: 0.18, fall: 1, side: -0.35, curl: -0.15, grav: 0.6 });
      row(x, 5, 0.84, 0.2, 1.3, 0.5, 0.44, { out: 0.28, fall: 0.6, side: -1.0, curl: -0.15, grav: 0.2 });
      row(x, 8, 1.25, 1.9, TAU - 1.9, 0.38, 0.42, { out: 0.15, fall: 1 });
      break;
    }
    case 'maki': {
      // dark green, tied back in a ponytail; a fringe and two locks framing the face
      cap(x, 0.95, 1.55, 1.75, c, 1.03);
      row(x, 12, 0.6, 0.7, TAU - 0.7, 0.5, 0.46, { out: 0.15, fall: 0.8, back: 0.5, curl: -0.15, grav: 0.4 });
      row(x, 5, 0.86, -0.55, 0.55, 0.45, 0.4, { out: 0.26, fall: 1, curl: -0.1, grav: 0.5 }, 0.2);
      for (const sx of [1, -1]) strand(x, 1.02, sx * 1.12, 0.8, 0.36, { out: 0.12, fall: 1, curl: -0.1 });
      tail(x, 1.12, Math.PI, 1.8, 0.52, { out: 0.3, fall: 1, back: 0.75, curl: 0.1, grav: 0.6 });
      tie(x, [0, 0.0, -1.1], 0.18, darken(c, 0.5), [0.3, 0, 0]);
      break;
    }
    case 'inumaki': {
      // light, short and soft, a full fringe
      cap(x, 0.95, 1.5, 1.82, c, 1.04);
      row(x, 12, 0.45, 0, TAU, 0.4, 0.46, { out: 0.55, lift: 0.2, fall: 0.35, curl: 0.12, grav: 0.3 }, 0.15, 0.3);
      row(x, 6, 0.85, -0.75, 0.75, 0.42, 0.4, { out: 0.35, fall: 0.9, curl: -0.08, grav: 0.5 }, 0.2);
      row(x, 10, 1.12, 1.0, TAU - 1.0, 0.38, 0.42, { out: 0.22, fall: 1 });
      break;
    }
    case 'shoko': {
      // brown hair past the shoulders, parted in the middle
      cap(x, 0.95, 1.6, 2.05, c, 1.05);
      row(x, 14, 0.62, 0.6, TAU - 0.6, 0.6, 0.5, { out: 0.16, fall: 1, curl: -0.25, grav: 0.6 });
      row(x, 14, 1.12, 0.9, TAU - 0.9, 1.25, 0.52, { out: 0.12, fall: 1, curl: 0.05 });
      row(x, 3, 0.86, 0.12, 0.75, 0.75, 0.42, { out: 0.22, fall: 1, side: 0.3, curl: -0.12 });
      row(x, 3, 0.86, -0.75, -0.12, 0.75, 0.42, { out: 0.22, fall: 1, side: -0.3, curl: -0.12 });
      break;
    }
    case 'todo': {
      // short at the sides, the rest gathered in a topknot
      cap(x, 1.0, 1.42, 1.72, c, 1.0);
      row(x, 8, 0.6, 0, TAU, 0.28, 0.44, { out: 0.2, back: 0.3, lift: 0.6 });
      lump(x, [0, 1.3, -0.22], [0.34, 0.46, 0.34]);
      tie(x, [0, 1.06, -0.2], 0.25, 0x8a2a2a, [Math.PI / 2 + 0.2, 0, 0]);
      row(x, 5, 0.0, 0, TAU, 0.26, 0.3, { spike: true, out: 0.5, lift: 0.8 }, 0.2, 0.4);
      break;
    }
    case 'yaga': {
      // a buzz cut
      cap(x, 0.92, 1.35, 1.62, c, 0.995);
      break;
    }
    case 'ijichi': {
      // neat, combed, over the ears
      cap(x, 0.95, 1.6, 1.9, c, 1.04);
      row(x, 14, 0.62, 0.6, TAU - 0.6, 0.55, 0.48, { out: 0.15, fall: 1, curl: -0.22, grav: 0.6 });
      row(x, 5, 0.86, -0.6, 0.6, 0.5, 0.42, { out: 0.22, fall: 1, side: 0.2, curl: -0.12, grav: 0.5 });
      break;
    }
    case 'junpei': {
      // long bangs falling over one eye
      cap(x, 0.95, 1.6, 1.95, c, 1.04);
      row(x, 14, 0.62, 0.6, TAU - 0.6, 0.65, 0.5, { out: 0.16, fall: 1, curl: -0.2, grav: 0.6 });
      row(x, 7, 0.82, -0.95, 0.35, 0.82, 0.46, { out: 0.2, fall: 1, side: -0.25, curl: -0.12 });
      row(x, 12, 1.12, 1.0, TAU - 1.0, 0.7, 0.48, { out: 0.12, fall: 1 });
      break;
    }
    case 'meimei': {
      // long silver hair down the back, the fringe in one braid down the front
      cap(x, 0.95, 1.6, 2.1, c, 1.04);
      row(x, 12, 1.05, 1.2, TAU - 1.2, 2.0, 0.58, { out: 0.08, fall: 1, curl: 0.03 });
      row(x, 10, 0.65, 0.9, TAU - 0.9, 0.65, 0.5, { out: 0.14, fall: 1, curl: -0.25, grav: 0.6 });
      for (const sx of [1, -1]) strand(x, 0.98, sx * 1.1, 1.3, 0.42, { out: 0.1, fall: 1 });
      braid(x, [0.32, 0.55, 0.9], [0.28, -1.75, 1.08], 9, 0.17);
      break;
    }
    case 'mahito': {
      // long, messy blue-grey hair to the shoulders, parted in the middle
      cap(x, 0.95, 1.6, 2.05, c, 1.05);
      row(x, 14, 0.62, 0.6, TAU - 0.6, 0.65, 0.52, { out: 0.2, fall: 1, curl: -0.12, grav: 0.6 }, 0.2);
      row(x, 14, 1.1, 0.95, TAU - 0.95, 1.05, 0.52, { out: 0.16, fall: 1, curl: 0.18 }, 0.2);
      row(x, 3, 0.86, 0.12, 0.8, 0.8, 0.42, { out: 0.24, fall: 1, side: 0.35, curl: 0.06 });
      row(x, 3, 0.86, -0.8, -0.12, 0.8, 0.42, { out: 0.24, fall: 1, side: -0.35, curl: 0.06 });
      break;
    }
    case 'geto': case 'kenjaku': {
      // long black hair, the top half in a bun, one long lock over the forehead
      cap(x, 0.95, 1.6, 2.05, c, 1.04);
      lump(x, [0, 0.65, -0.98], [0.34, 0.32, 0.3]);
      tie(x, [0, 0.47, -0.88], 0.2, darken(c, 0.5), [0.9, 0, 0]);
      row(x, 10, 1.2, 1.35, TAU - 1.35, 1.5, 0.52, { out: 0.06, fall: 1 });
      row(x, 8, 0.7, 1.0, TAU - 1.0, 0.6, 0.48, { out: 0.14, fall: 0.6, back: 0.6, curl: -0.2, grav: 0.5 });
      for (const sx of [1, -1]) strand(x, 1.05, sx * 1.2, 0.95, 0.38, { out: 0.1, fall: 1 });
      strand(x, 0.8, -0.32, 0.92, 0.26, { out: 0.22, fall: 1, curl: -0.15, grav: 0.6 });
      break;
    }
    case 'miwa': {
      // long straight blue hair with a blunt fringe
      cap(x, 0.95, 1.6, 2.1, c, 1.05);
      row(x, 16, 0.8, 0.8, TAU - 0.8, 1.75, 0.52, { out: 0.08, fall: 1 });
      for (const sx of [1, -1]) strand(x, 0.98, sx * 1.02, 1.4, 0.44, { out: 0.1, fall: 1 });
      row(x, 7, 0.84, -0.72, 0.72, 0.45, 0.4, { out: 0.2, fall: 1, curl: -0.1, grav: 0.5 }, 0.06);
      break;
    }
    case 'bun': {
      cap(x, 0.95, 1.55, 1.85, c, 1.03);
      row(x, 12, 0.62, 0.6, TAU - 0.6, 0.5, 0.46, { out: 0.15, fall: 0.6, back: 0.6, curl: -0.2, grav: 0.4 });
      lump(x, [0, 0.58, -1.02], [0.36, 0.34, 0.32]);
      row(x, 4, 0.86, -0.5, 0.5, 0.36, 0.38, { out: 0.22, fall: 1, side: 0.3, curl: -0.1, grav: 0.5 });
      break;
    }
    case 'long': {
      cap(x, 0.95, 1.6, 2.1, c, 1.05);
      row(x, 16, 0.8, 0.7, TAU - 0.7, 1.8, 0.52, { out: 0.09, fall: 1 });
      row(x, 3, 0.86, 0.1, 0.75, 1.3, 0.44, { out: 0.14, fall: 1, side: 0.28 });
      row(x, 3, 0.86, -0.75, -0.1, 1.3, 0.44, { out: 0.14, fall: 1, side: -0.28 });
      break;
    }
    case 'bob': case 'uraume': {
      // a straight bob to the chin with a blunt fringe, the ends turned under (Sasaki, Uraume)
      cap(x, 0.95, 1.6, 1.98, c, 1.05);
      row(x, 16, 0.72, 0.68, TAU - 0.68, 0.78, 0.52, { out: 0.14, fall: 1, curl: -0.22 });
      row(x, 8, 0.82, -0.78, 0.78, 0.42, 0.38, { out: 0.18, fall: 1, curl: -0.1, grav: 0.6 }, 0.05);
      break;
    }
    case 'choso': {
      // messy black hair with two short tufts tied up on top
      cap(x, 0.95, 1.55, 1.88, c, 1.03);
      for (const sx of [1, -1]) {
        lump(x, [sx * 0.45, 0.98, -0.15], [0.2, 0.2, 0.2]);
        for (let i = 0; i < 4; i++) strand(x, 0.32 + i * 0.05, sx * (0.7 + i * 0.18), 0.45, 0.32, { spike: true, flat: 0.6, out: 0.5, lift: 1.1, side: sx * 0.5 });
      }
      row(x, 12, 0.66, 0.6, TAU - 0.6, 0.48, 0.46, { out: 0.35, fall: 0.7, curl: 0.12, grav: 0.5 }, 0.2, 0.3);
      row(x, 5, 0.86, -0.6, 0.6, 0.48, 0.38, { out: 0.3, fall: 1, curl: -0.08, grav: 0.5 }, 0.2);
      break;
    }
    case 'yuta': {
      // messy black hair, the fringe hanging down to the eyes
      cap(x, 0.95, 1.55, 1.92, c, 1.04);
      row(x, 12, 0.5, 0, TAU, 0.5, 0.46, { out: 0.42, fall: 0.7, curl: 0.12, grav: 0.4 }, 0.2, 0.3);
      row(x, 12, 1.02, 0.9, TAU - 0.9, 0.55, 0.46, { out: 0.2, fall: 1, curl: 0.1 }, 0.2);
      row(x, 7, 0.84, -0.78, 0.78, 0.56, 0.4, { out: 0.24, fall: 1, curl: -0.1, grav: 0.6 }, 0.2);
      break;
    }
    case 'naoya': {
      // short bleached hair swept back, dark at the roots
      cap(x, 1.0, 1.5, 1.8, darken(c, 0.5), 1.0);
      row(x, 14, 0.5, -1.6, 1.6, 0.55, 0.44, { spike: true, flat: 0.45, out: 0.4, back: 1.0, lift: 0.25 }, 0.2, 0.3);
      row(x, 9, 0.78, Math.PI - 1.3, Math.PI + 1.3, 0.45, 0.4, { spike: true, flat: 0.5, out: 0.5, back: 0.7, fall: 0.3, grav: 0.3 }, 0.2, 0.3);
      row(x, 3, 0.9, -0.3, 0.3, 0.45, 0.34, { spike: true, flat: 0.45, out: 0.4, back: 0.9, lift: 0.4 }, 0.2, 0.2);
      break;
    }
    case 'pompadour': {
      // a towering quiff swept up and out over the forehead (Ishigori)
      cap(x, 1.0, 1.45, 1.8, c, 1.02);
      lump(x, [0, 0.95, 0.55], [0.78, 0.5, 1.05], c, [-0.45, 0, 0]);
      lump(x, [0, 1.2, 1.35], [0.62, 0.46, 0.72], c, [-0.75, 0, 0]);
      lump(x, [0, 1.25, 1.95], [0.42, 0.36, 0.42], c, [-0.9, 0, 0]);
      row(x, 10, 0.62, Math.PI - 1.5, Math.PI + 1.5, 0.32, 0.44, { out: 0.25, back: 0.8, fall: 0.2, curl: -0.2, grav: 0.3 });
      break;
    }
    case 'hakari': {
      // light hair brushed up and back into a short quiff
      cap(x, 1.0, 1.5, 1.82, c, 1.03);
      lump(x, [0, 0.98, 0.5], [0.58, 0.38, 0.78], c, [-0.4, 0, 0]);
      row(x, 12, 0.45, -1.8, 1.8, 0.5, 0.44, { spike: true, flat: 0.5, out: 0.5, back: 0.9, lift: 0.4 }, 0.2, 0.3);
      row(x, 8, 0.86, Math.PI - 1.3, Math.PI + 1.3, 0.4, 0.42, { out: 0.25, fall: 0.6, back: 0.6, curl: -0.15, grav: 0.4 });
      break;
    }
    case 'kashimo': {
      // long pale-blue hair gathered high on the head, long locks either side of the face
      cap(x, 0.95, 1.55, 1.85, c, 1.04);
      lump(x, [0, 1.18, -0.32], [0.28, 0.26, 0.28]);
      tail(x, 0.2, Math.PI, 1.45, 0.5, { out: 0.4, back: 0.9, fall: 0.8, curl: 0.12, grav: 0.5 });
      for (const sx of [1, -1]) strand(x, 1.0, sx * 1.05, 1.2, 0.42, { out: 0.08, fall: 1, curl: -0.05 });
      row(x, 5, 0.85, -0.6, 0.6, 0.5, 0.38, { out: 0.25, fall: 1, curl: -0.1, grav: 0.5 }, 0.2);
      break;
    }
    case 'uro': {
      // long dark hair parted in the middle, tied low behind
      cap(x, 0.95, 1.6, 2.0, c, 1.04);
      row(x, 4, 0.86, 0.25, 1.25, 1.1, 0.46, { out: 0.12, fall: 1, side: 0.3, curl: -0.08 });
      row(x, 4, 0.86, -1.25, -0.25, 1.1, 0.46, { out: 0.12, fall: 1, side: -0.3, curl: -0.08 });
      row(x, 10, 0.78, 1.4, TAU - 1.4, 0.7, 0.48, { out: 0.1, fall: 1, back: 0.3, curl: -0.15 });
      tail(x, 1.6, Math.PI, 1.3, 0.48, { out: 0.15, fall: 1 });
      break;
    }
    case 'mai': {
      // a short bob with one long lock at the side
      cap(x, 0.95, 1.6, 1.95, c, 1.05);
      row(x, 15, 0.72, 0.65, TAU - 0.65, 0.7, 0.5, { out: 0.14, fall: 1, curl: -0.18 });
      row(x, 7, 0.84, -0.72, 0.72, 0.4, 0.38, { out: 0.18, fall: 1, curl: -0.1, grav: 0.5 }, 0.1);
      strand(x, 0.98, 1.1, 1.4, 0.46, { out: 0.1, fall: 1 });
      break;
    }
    case 'toji': {
      // short, messy black hair
      cap(x, 0.95, 1.5, 1.82, c, 1.03);
      row(x, 12, 0.48, 0, TAU, 0.4, 0.44, { out: 0.6, fall: 0.4, back: 0.3, curl: 0.2, grav: 0.3 }, 0.2, 0.4);
      row(x, 9, 0.98, 1.2, TAU - 1.2, 0.36, 0.42, { out: 0.3, fall: 0.8, grav: 0.6 });
      row(x, 5, 0.86, -0.6, 0.6, 0.36, 0.36, { out: 0.36, fall: 0.8, grav: 0.4 }, 0.25, 0.3);
      break;
    }
    case 'kamo': {
      // black hair tied back in a ponytail, the fringe swept aside
      cap(x, 0.95, 1.55, 1.85, c, 1.03);
      row(x, 12, 0.6, 0.7, TAU - 0.7, 0.48, 0.46, { out: 0.15, fall: 0.6, back: 0.6, curl: -0.2, grav: 0.4 });
      row(x, 2, 0.86, 0.15, 0.6, 0.45, 0.4, { out: 0.26, fall: 0.8, side: 0.6, grav: 0.3 });
      row(x, 2, 0.86, -0.6, -0.15, 0.45, 0.4, { out: 0.26, fall: 0.8, side: -0.6, grav: 0.3 });
      tail(x, 1.25, Math.PI, 1.05, 0.46, { out: 0.2, fall: 1, back: 0.5, grav: 0.6 });
      break;
    }
    case 'short': {
      cap(x, 0.95, 1.5, 1.8, c, 1.03);
      row(x, 10, 0.52, 0, TAU, 0.36, 0.44, { out: 0.42, fall: 0.6, back: 0.2, grav: 0.4 }, 0.15, 0.2);
      row(x, 4, 0.86, -0.5, 0.5, 0.3, 0.36, { out: 0.3, fall: 0.9, grav: 0.4 }, 0.2);
      break;
    }
    case 'bald':
      break;
  }
  void dk;
}
