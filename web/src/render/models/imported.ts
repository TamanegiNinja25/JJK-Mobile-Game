// The player's own 3D character models (System → Your Pictures, Sounds & Models → 3D character models).
//
// A file picked on the phone (GLB/glTF, VRM, FBX, or the .zip of a glTF with its textures, which is how
// Sketchfab downloads come) replaces a character's look wherever that character appears: as the player,
// as an NPC, as a boss, and in portraits and dialogue art. The game's own animation keeps driving it.
// The built-in procedural body still runs every move, invisibly, and each frame its pose is copied onto
// the imported skeleton.
//
// The copy happens in character space. Each mapped bone takes the rotation its game joint has made
// since rest and applies it on top of its own rest rotation, after a per-limb alignment that turns the
// file's rest pose (usually a T-pose: Mixamo, VRoid) into the game's arms-down rest pose. So proportions,
// bone axes and in-between bones (clavicles, extra spine and twist bones, fingers) don't matter: the
// arms, legs, spine and head land where the game's do. Bones are recognised by name for Mixamo, VRM
// (from its own humanoid table), Unity, Blender (Rigify and metarig), MMD (Japanese or English names),
// Daz, Character Creator and 3ds Max Biped rigs.
//
// A file can also carry its own idle / walk / run clips (a Mixamo export with animations, for one).
// Those play while the character just stands or moves, and every attack, skill, hit and fall is the
// game's. A model without a skeleton is shown as a statue that sways and falls with the body.
//
// Nothing here is shipped with the game: the files stay on the phone (IndexedDB, see CustomMedia).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { clone as cloneRigged } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';
import { toonGradient, outlineMaterial } from '../toon';
import { resetPose, RigModel } from '../rig';
import { ACTION_TIMING, type ActionName, type Humanoid } from './humanoid';
import type { ModelHandle } from './model';
import { media, type ModelFile } from '../../core/CustomMedia';

export type Joint = 'hips' | 'spine' | 'chest' | 'neck' | 'head'
  | 'armUpL' | 'armLowL' | 'handL' | 'armUpR' | 'armLowR' | 'handR'
  | 'legUpL' | 'legLowL' | 'footL' | 'legUpR' | 'legLowR' | 'footR';

export const JOINTS: Joint[] = ['hips', 'spine', 'chest', 'neck', 'head', 'armUpL', 'armLowL', 'handL', 'armUpR', 'armLowR', 'handR',
  'legUpL', 'legLowL', 'footL', 'legUpR', 'legLowR', 'footR'];
/** each joint's parent in the game's skeleton (the procedural rig's 'root' bone is above the hips) */
const PARENT: Record<Joint, Joint | 'root'> = {
  hips: 'root', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  armUpL: 'chest', armLowL: 'armUpL', handL: 'armLowL', armUpR: 'chest', armLowR: 'armUpR', handR: 'armLowR',
  legUpL: 'hips', legLowL: 'legUpL', footL: 'legLowL', legUpR: 'hips', legLowR: 'legUpR', footR: 'legLowR',
};
/** where a limb bone points: used to line the file's rest pose up with the game's */
const AIM: Partial<Record<Joint, Joint>> = { armUpL: 'armLowL', armLowL: 'handL', armUpR: 'armLowR', armLowR: 'handR', legUpL: 'legLowL', legLowL: 'footL', legUpR: 'legLowR', legLowR: 'footR' };
/** when the middle joint of a limb is missing, the upper bone aims at the limb's end instead */
const AIM_FAR: Partial<Record<Joint, Joint>> = { armUpL: 'handL', armUpR: 'handR', legUpL: 'footL', legUpR: 'footR' };
/** hands and feet keep their forearm's and shin's alignment */
const INHERIT: Partial<Record<Joint, Joint>> = { handL: 'armLowL', handR: 'armLowR', footL: 'legLowL', footR: 'legLowR' };

/** Largest file (or set of files) accepted. */
export const MODEL_MAX_BYTES = 48 * 1024 * 1024;
/** Textures are shrunk to this many pixels on their long side: phones have little video memory. */
const TEX_MAX = 1024;

export interface ModelInfo {
  format: string;
  rig: string;
  joints: number;
  bones: number;
  meshes: number;
  triangles: number;
  clips: string[];
  /** a short, readable summary for the menu */
  summary: string;
}

export interface ModelTemplate {
  /** the loaded scene; never shown itself, only cloned */
  root: THREE.Object3D;
  /** turns the file upright and facing +Z */
  base: THREE.Quaternion;
  /** bind-pose bounds after `base` */
  box: { minY: number; height: number; cx: number; cz: number };
  /** game joint → path of child indices from `root` to the bone */
  paths: Partial<Record<Joint, number[]>>;
  rigged: boolean;
  clips: { idle?: THREE.AnimationClip; walk?: THREE.AnimationClip; run?: THREE.AnimationClip };
  info: ModelInfo;
}

// ---------------------------------------------------------------------------------------------
// Reading the file
// ---------------------------------------------------------------------------------------------

const ext = (n: string) => (n.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '');
const base = (n: string) => n.replace(/\\/g, '/').split('/').pop()!;

/** A zip's files (folders flattened, macOS litter dropped). */
function unzip(data: ArrayBuffer): ModelFile[] {
  const out: ModelFile[] = [];
  const all = unzipSync(new Uint8Array(data));
  for (const [name, bytes] of Object.entries(all)) {
    if (!bytes.length || name.endsWith('/') || name.includes('__MACOSX') || base(name).startsWith('.')) continue;
    out.push({ name, data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer });
  }
  return out;
}

interface Loaded { root: THREE.Object3D; clips: THREE.AnimationClip[]; vrm: Partial<Record<Joint, THREE.Object3D>> | null; format: string }

const MODEL_EXT = ['glb', 'vrm', 'gltf', 'fbx'];
/** Clip names that say nothing (Mixamo calls every take "mixamo.com"): such a clip is named after its file. */
const GENERIC_CLIP = /^(|mixamo\.?com|take\s*0*\d*|.*\|mixamo\.com.*|armature.*|action\d*|anim(ation)?\s*\d*|clip\s*\d*|default|scene|unreal take)$/i;

function geometrySize(o: THREE.Object3D) { let n = 0; o.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh) n += m.geometry.getAttribute('position')?.count ?? 0; }); return n; }

/**
 * Parses the picked file(s). Separate textures and .bin files are found by name. When several models are
 * picked (a Mixamo character with its Idle / Walking / Running files), the one with the most geometry is
 * the character and the others lend it their animation clips.
 */
async function load(files: ModelFile[]): Promise<Loaded> {
  const list = files.flatMap(f => ext(f.name) === 'zip' ? unzip(f.data) : [f]);
  const models = list.filter(f => MODEL_EXT.includes(ext(f.name)));
  if (!models.length) throw new Error('No 3D model in that. Pick a .glb, .gltf, .vrm or .fbx file, or the .zip it came in.');
  // the other files, by full path and by bare name, for textures and buffers the model refers to
  const urls = new Map<string, string>();
  const made: string[] = [];
  for (const f of list) {
    if (models.includes(f)) continue;
    const u = URL.createObjectURL(new Blob([f.data]));
    made.push(u);
    urls.set(f.name.replace(/\\/g, '/').toLowerCase(), u);
    urls.set(base(f.name).toLowerCase(), u);
  }
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/^(data|blob):/.test(url)) return url;
    let key = url;
    try { key = decodeURIComponent(url); } catch { /* keep as is */ }
    key = key.replace(/\\/g, '/').replace(/^(\.\/)+/, '').toLowerCase();
    return urls.get(key) ?? urls.get(base(key)) ?? url;
  });
  // the blobs are only needed while textures load
  setTimeout(() => made.forEach(u => URL.revokeObjectURL(u)), 60000);
  const parsed: (Loaded & { file: string })[] = [];
  for (const f of models.slice(0, 8)) {
    const kind = ext(f.name);
    let one: Loaded;
    if (kind === 'fbx') {
      const root = new FBXLoader(manager).parse(f.data, '');
      one = { root, clips: root.animations ?? [], vrm: null, format: 'FBX' };
    } else {
      const loader = new GLTFLoader(manager);
      const gltf = await new Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF>((res, rej) => loader.parse(f.data, '', res, rej));
      const vrm = await vrmBones(gltf.parser);
      one = { root: gltf.scene, clips: gltf.animations ?? [], vrm, format: kind === 'vrm' || vrm ? 'VRM' : kind === 'gltf' ? 'glTF' : 'GLB' };
    }
    // a lone clip with a meaningless name takes its file's name ("Walking.fbx" → "Walking")
    if (one.clips.length === 1 && GENERIC_CLIP.test(one.clips[0].name.trim())) one.clips[0].name = base(f.name).replace(/\.[^.]+$/, '');
    parsed.push({ ...one, file: f.name });
  }
  parsed.sort((a, b) => geometrySize(b.root) - geometrySize(a.root));
  const main = parsed[0];
  if (!geometrySize(main.root)) throw new Error('That file has no meshes to show.');
  return { root: main.root, clips: parsed.flatMap(p => p.clips), vrm: main.vrm, format: main.format };
}

/** A VRM file says which node is which bone; trust that over names. Handles VRM 0.x and 1.0. */
async function vrmBones(parser: { json: any; getDependency: (t: string, i: number) => Promise<any> }) {
  const ex = parser.json?.extensions ?? {};
  const pairs: [string, number][] = [];
  const v1 = ex.VRMC_vrm?.humanoid?.humanBones;
  if (v1 && typeof v1 === 'object') for (const [k, v] of Object.entries(v1)) { const n = (v as { node?: number })?.node; if (typeof n === 'number') pairs.push([k, n]); }
  const v0 = ex.VRM?.humanoid?.humanBones;
  if (Array.isArray(v0)) for (const b of v0) if (typeof b?.node === 'number' && typeof b?.bone === 'string') pairs.push([b.bone, b.node]);
  if (!pairs.length) return null;
  const NAMES: Record<string, Joint> = {
    hips: 'hips', spine: 'spine', chest: 'chest', upperChest: 'chest', neck: 'neck', head: 'head',
    leftUpperArm: 'armUpL', leftLowerArm: 'armLowL', leftHand: 'handL', rightUpperArm: 'armUpR', rightLowerArm: 'armLowR', rightHand: 'handR',
    leftUpperLeg: 'legUpL', leftLowerLeg: 'legLowL', leftFoot: 'footL', rightUpperLeg: 'legUpR', rightLowerLeg: 'legLowR', rightFoot: 'footR',
  };
  const out: Partial<Record<Joint, THREE.Object3D>> = {};
  // upperChest wins over chest when both are given: the arms hang from it
  for (const [k, n] of pairs.sort((a, b) => (a[0] === 'upperChest' ? 1 : 0) - (b[0] === 'upperChest' ? 1 : 0))) {
    const j = NAMES[k];
    if (!j) continue;
    try { out[j] = await parser.getDependency('node', n); } catch { /* a broken entry is skipped */ }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Which bone is which
// ---------------------------------------------------------------------------------------------

/** Name prefixes that say nothing about the body part. */
const NOISE = new Set(['mixamorig', 'mixamorig1', 'mixamorig2', 'mixamorig3', 'mixamorig4', 'mixamorig5', 'mixamorig6', 'mixamorig7', 'mixamorig8', 'mixamorig9', 'mixamorig10',
  'def', 'org', 'mch', 'j', 'bip', 'bip01', 'bip001', 'bip002', 'cc', 'base', 'valvebiped', 'b', 'bn', 'jnt', 'jt', 'bone', 'armature', 'rig', 'skeleton', 'sk', 'c', 'char', 'character',
  'npc', 'joint', 'jnt', 'ctrl', 'deform', 'skin', 'ue', 'humanoid', 'avatar', 'model', 'root']);
const SIDED: Record<string, 'armUp' | 'armLow' | 'hand' | 'legUp' | 'legLow' | 'foot'> = {
  arm: 'armUp', upperarm: 'armUp', uparm: 'armUp', armupper: 'armUp', shldrbend: 'armUp', shoulderbend: 'armUp', humerus: 'armUp', bicep: 'armUp',
  forearm: 'armLow', lowerarm: 'armLow', lowarm: 'armLow', armlower: 'armLow', elbow: 'armLow', forearmbend: 'armLow',
  hand: 'hand', wrist: 'hand', palm: 'hand',
  upleg: 'legUp', upperleg: 'legUp', thigh: 'legUp', thighbend: 'legUp', legupper: 'legUp', femur: 'legUp', hip: 'legUp',
  leg: 'legLow', lowerleg: 'legLow', lowleg: 'legLow', leglower: 'legLow', shin: 'legLow', calf: 'legLow', knee: 'legLow',
  foot: 'foot', ankle: 'foot',
};
const CENTER: Record<string, Joint> = {
  hips: 'hips', hip: 'hips', pelvis: 'hips', center: 'hips', centre: 'hips', cog: 'hips',
  spine: 'spine', spine0: 'spine', spine00: 'spine', spine01: 'spine', abdomen: 'spine', abdomenlower: 'spine', spinelower: 'spine', waist: 'spine', upperbody: 'spine', lowerspine: 'spine', torso: 'spine',
  chest: 'chest', upperchest: 'chest', chestlower: 'chest', chestupper: 'chest', spine2: 'chest', spine02: 'chest', spine3: 'chest', spine03: 'chest', thorax: 'chest', upperbody2: 'chest', spineupper: 'chest', abdomenupper: 'chest',
  neck: 'neck', neck1: 'neck', neck01: 'neck', necklower: 'neck',
  head: 'head',
};
/** MMD's Japanese bone names */
const MMD_SIDED: [RegExp, 'armUp' | 'armLow' | 'hand' | 'legUp' | 'legLow' | 'foot'][] = [
  [/^.腕$/, 'armUp'], [/^.(ひじ|肘)$/, 'armLow'], [/^.手首$/, 'hand'], [/^.足$/, 'legUp'], [/^.(ひざ|膝)$/, 'legLow'], [/^.足首$/, 'foot'],
];
const MMD_CENTER: [RegExp, Joint][] = [[/^センター$/, 'hips'], [/^上半身$/, 'spine'], [/^上半身2$/, 'chest'], [/^首$/, 'neck'], [/^頭$/, 'head']];

function tokens(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Words that mark a helper bone standing in for a body part (VRM roll/aim helpers, sleeves, twists). */
const HELPER = new Set(['roll', 'aim', 'twist', 'tw', 'adj', 'sec', 'tops', 'helper', 'sub', 'aux', 'corrective', 'support']);

/**
 * What a bone's name says it is: a sided limb part, a centre part, or nothing. With `helper`, words like
 * "roll" or "twist" are looked past, to find which part a helper bone follows.
 */
function classify(name: string, helper = false): { joint: Joint; side?: 'L' | 'R' } | null {
  const raw = name.replace(/^.*[|]/, '').trim();
  // MMD (Japanese): 左 = left, 右 = right
  if (/[぀-ヿ一-鿿]/.test(raw)) {
    const side = raw.startsWith('左') ? 'L' : raw.startsWith('右') ? 'R' : undefined;
    if (side) for (const [re, part] of MMD_SIDED) if (re.test(raw)) return { joint: (part + side) as Joint, side };
    for (const [re, j] of MMD_CENTER) if (re.test(raw)) return { joint: j };
    return null;
  }
  const t = tokens(raw);
  const side = t.includes('left') || t.includes('l') ? 'L' : t.includes('right') || t.includes('r') ? 'R' : undefined;
  const part = t.filter(x => !NOISE.has(x) && !(helper && HELPER.has(x)) && x !== 'left' && x !== 'right' && x !== 'l' && x !== 'r').join('');
  if (side) { const p = SIDED[part]; return p ? { joint: (p + side) as Joint, side } : null; }
  const c = CENTER[part];
  return c ? { joint: c } : null;
}

const isAncestor = (a: THREE.Object3D, b: THREE.Object3D) => { for (let p = b.parent; p; p = p.parent) if (p === a) return true; return false; };
function commonAncestor(objs: THREE.Object3D[], stop: THREE.Object3D) {
  if (!objs.length) return null;
  const chain: THREE.Object3D[] = [];
  for (let p = objs[0].parent; p && p !== stop; p = p.parent) chain.push(p);
  return chain.find(c => objs.every(o => isAncestor(c, o))) ?? null;
}

/**
 * For rigs whose bone names say nothing ("joint_12", "Bone.003"): finds the joints from the skeleton's
 * shape. The feet are the two lowest leaf bones, the hips are where those legs meet, the head is up the
 * branch of the hips that reaches highest, and the arms are the leaves farthest out to the sides (finger
 * tips in a T- or A-pose). Joints along each limb are placed by where they sit on a body (knee about half
 * way up the leg, ankle near the ground, elbow half way out the arm). Left and right come from the way the
 * toes point. Returns nothing when the skeleton doesn't look like a person.
 */
function mapByShape(root: THREE.Object3D, bones: THREE.Object3D[]): Partial<Record<Joint, THREE.Object3D>> {
  const at = new Map(bones.map(b => [b, new THREE.Vector3().setFromMatrixPosition(b.matrixWorld)]));
  const P = (b: THREE.Object3D) => at.get(b)!;
  const kids = (b: THREE.Object3D) => b.children.filter(c => at.has(c));
  const leaves = bones.filter(b => !kids(b).length);
  if (bones.length < 10 || leaves.length < 4) return {};
  const ys = bones.map(b => P(b).y), minY = Math.min(...ys), H = Math.max(...ys) - minY;
  if (!(H > 0)) return {};
  const flat = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(a.x - b.x, a.z - b.z);
  const low = leaves.slice().sort((a, b) => P(a).y - P(b).y);
  const f1 = low[0], f2 = low.find(l => l !== f1 && flat(P(l), P(f1)) > 0.06 * H && P(l).y < minY + 0.25 * H);
  if (!f2) return {};
  const hips = commonAncestor([f1, f2], root);
  if (!hips || !at.has(hips) || P(hips).y < minY + 0.25 * H) return {};
  const toward = (anc: THREE.Object3D, d: THREE.Object3D) => { let n: THREE.Object3D | null = d; while (n && n.parent !== anc) n = n.parent; return n; };
  const path = (from: THREE.Object3D, to: THREE.Object3D) => { const p: THREE.Object3D[] = []; for (let n: THREE.Object3D | null = to; n && n !== from; n = n.parent) p.unshift(n); return p; };
  const leg1 = toward(hips, f1)!, leg2 = toward(hips, f2)!;
  const inLeg = (o: THREE.Object3D) => o === leg1 || o === leg2 || isAncestor(leg1, o) || isAncestor(leg2, o);
  const upper = leaves.filter(l => isAncestor(hips, l) && !inLeg(l));
  const top = upper.slice().sort((a, b) => P(b).y - P(a).y)[0];
  if (!top || P(top).y < P(hips).y + 0.2 * H) return {};
  const spinePath = path(hips, top);
  // the arms: leaves farthest out to the sides, one on each side
  const hp = P(hips);
  const lat = (l: THREE.Object3D) => new THREE.Vector3(P(l).x - hp.x, 0, P(l).z - hp.z);
  const armLeaves = upper.filter(l => !spinePath.includes(l) && P(l).y > hp.y).sort((a, b) => lat(b).length() - lat(a).length());
  const a1 = armLeaves[0], a2 = a1 && armLeaves.find(l => lat(l).dot(lat(a1)) < 0 && lat(l).length() > 0.15 * H);
  if (!a1 || !a2 || lat(a1).length() < 0.15 * H) return {};
  const junction = (l: THREE.Object3D) => { for (let n = l.parent; n; n = n.parent) if (n === hips || spinePath.includes(n)) return n; return null; };
  const j1 = junction(a1), j2 = junction(a2);
  if (!j1 || !j2) return {};
  const chest = spinePath.indexOf(j1) >= spinePath.indexOf(j2) ? j1 : j2;
  const map: Partial<Record<Joint, THREE.Object3D>> = { hips };
  if (chest !== hips) map.chest = chest;
  const ci = spinePath.indexOf(chest);
  if (ci > 0) map.spine = spinePath[0];
  // the head sits at the base of the skull, about seven eighths of the way up; the neck between it and the chest
  const above = spinePath.slice(ci + 1).filter(b => b !== top || spinePath.length - ci <= 2);
  if (above.length) {
    const head = above.slice().sort((a, b) => Math.abs(P(a).y - (minY + 0.875 * H)) - Math.abs(P(b).y - (minY + 0.875 * H)))[0];
    map.head = head;
    const hi = above.indexOf(head);
    if (hi > 0) map.neck = above[hi - 1];
  }
  // along a limb: the bone nearest each target height (legs) or distance out (arms)
  const nearest = (list: THREE.Object3D[], f: (b: THREE.Object3D) => number) => list.slice().sort((a, b) => f(a) - f(b))[0];
  const leg = (first: THREE.Object3D, leaf: THREE.Object3D) => {
    const pth = [first, ...path(first, leaf)];
    const hy = hp.y - minY;
    const up = pth.find(b => P(b).y > minY + 0.7 * hy) ?? pth[0];
    const rest = pth.slice(pth.indexOf(up) + 1);
    const lowB = nearest(rest, b => Math.abs(P(b).y - (minY + 0.5 * hy)));
    const after = lowB ? rest.slice(rest.indexOf(lowB) + 1) : [];
    const foot = nearest(after.filter(b => P(b).y < minY + 0.3 * hy), b => Math.abs(P(b).y - (minY + 0.08 * hy)));
    return { up, low: lowB, foot };
  };
  const arm = (j: THREE.Object3D, leaf: THREE.Object3D) => {
    const pth = path(j, leaf), o = P(j), reach = P(leaf).distanceTo(o);
    const d = (b: THREE.Object3D) => P(b).distanceTo(o);
    const up = pth.find(b => d(b) >= 0.12 * reach && b !== leaf) ?? pth[0];
    const out = pth.slice(pth.indexOf(up) + 1);
    // the hand is where the fingers branch off; a bare chain (no finger bones) is elbow then wrist; a single
    // finger chain puts the hand about four fifths of the way out
    let hand = out.find(b => kids(b).length >= 3);
    if (!hand) hand = out.length === 2 ? out[1] : out.length >= 3 ? nearest(out.slice(1), b => Math.abs(d(b) - 0.8 * reach)) : undefined;
    const mid = out.slice(0, hand ? out.indexOf(hand) : out.length);
    const lowB = nearest(mid, b => Math.abs(d(b) - (d(up) + (hand ? d(hand) : reach)) / 2));
    return { up, low: lowB, hand };
  };
  // facing: the way the toes point (or +Z); the character's left is then up × forward
  const fwd = new THREE.Vector3();
  for (const f of [f1, f2]) { const st = path(hips, f); if (st.length >= 2) { const v = P(st[st.length - 1]).clone().sub(P(st[st.length - 2])); v.y = 0; fwd.add(v); } }
  if (fwd.lengthSq() < 1e-10 || Math.abs(fwd.z) < Math.abs(fwd.x) * 0.5) fwd.set(0, 0, 1);
  const left = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), fwd.normalize());
  const legA = leg(leg1, f1), legB = leg(leg2, f2);
  const [lL, lR] = lat(f1).dot(left) >= 0 ? [legA, legB] : [legB, legA];
  const armA = arm(j1, a1), armB = arm(j2, a2);
  const [aL, aR] = lat(a1).dot(left) >= 0 ? [armA, armB] : [armB, armA];
  const put = (j: Joint, b: THREE.Object3D | undefined) => { if (b) map[j] = b; };
  put('legUpL', lL.up); put('legLowL', lL.low); put('footL', lL.foot); put('legUpR', lR.up); put('legLowR', lR.low); put('footR', lR.foot);
  put('armUpL', aL.up); put('armLowL', aL.low); put('handL', aL.hand); put('armUpR', aR.up); put('armLowR', aR.low); put('handR', aR.hand);
  return map;
}

/** Finds the game's joints among the file's bones: VRM's own table first, then names, then shape. */
function mapBones(root: THREE.Object3D, bones: THREE.Object3D[], vrm: Loaded['vrm'], skinned: Set<THREE.Object3D>) {
  const map: Partial<Record<Joint, THREE.Object3D>> = {};
  let rig = 'generic';
  if (vrm && vrm.hips) { Object.assign(map, vrm); rig = 'VRM'; }
  const names = bones.map(b => b.name);
  if (rig === 'generic') {
    if (names.some(n => /mixamorig/i.test(n))) rig = 'Mixamo';
    else if (names.some(n => /^(DEF|ORG)-/.test(n) || /spine\.00[3-6]/i.test(n))) rig = 'Blender (Rigify)';
    else if (names.some(n => /[぀-ヿ一-鿿]/.test(n))) rig = 'MMD';
    else if (names.some(n => /^J_Bip_/i.test(n))) rig = 'VRoid';
    else if (names.some(n => /^CC_Base_/i.test(n))) rig = 'Character Creator';
    else if (names.some(n => /^Bip0*1/i.test(n))) rig = '3ds Max Biped';
    else if (names.some(n => /ShldrBend|ForearmBend|ThighBend/i.test(n))) rig = 'Daz';
    else if (names.some(n => /\.(L|R)$/.test(n))) rig = 'Blender';
    else if (names.some(n => /^(Left|Right)(UpperArm|UpperLeg)$/.test(n))) rig = 'Unity';

    // Rigify names its spine chain by number: spine = hips, .001 spine, .003 chest, .004 neck, .006 head
    if (rig === 'Blender (Rigify)') {
      const pick = (re: RegExp) => bones.find(b => re.test(b.name) && /^DEF-/.test(b.name)) ?? bones.find(b => re.test(b.name));
      map.hips = pick(/^(DEF-|ORG-)?spine$/); map.spine = pick(/^(DEF-|ORG-)?spine\.001$/); map.chest = pick(/^(DEF-|ORG-)?spine\.003$/);
      map.neck = pick(/^(DEF-|ORG-)?spine\.004$/); map.head = pick(/^(DEF-|ORG-)?spine\.006$/) ?? pick(/^(DEF-|ORG-)?spine\.005$/);
    }
    // everything else by name; deforming (skinned) bones win over helpers, and shallow ones over deep
    const cands: Partial<Record<Joint, THREE.Object3D[]>> = {};
    let legLowFromLeg = false;
    for (const b of bones) {
      const c = classify(b.name);
      if (!c) continue;
      (cands[c.joint] ??= []).push(b);
      if ((c.joint === 'legLowL' || c.joint === 'legLowR') && /leg$/i.test(tokens(b.name).filter(x => !NOISE.has(x) && x !== 'left' && x !== 'right' && x !== 'l' && x !== 'r').join(''))) legLowFromLeg = true;
    }
    // a rig with "Leg" but no thigh/upper-leg bone calls the thigh "Leg"
    for (const s of ['L', 'R'] as const) {
      if (!cands[('legUp' + s) as Joint] && legLowFromLeg && cands[('legLow' + s) as Joint]) {
        const legs = cands[('legLow' + s) as Joint]!;
        const named = legs.filter(b => /leg$/i.test(b.name.replace(/[._\-\s]?(l|r|left|right)$/i, '')));
        if (named.length) { cands[('legUp' + s) as Joint] = named; cands[('legLow' + s) as Joint] = legs.filter(b => !named.includes(b)); }
      }
    }
    const depth = (o: THREE.Object3D) => { let d = 0; for (let p = o.parent; p; p = p.parent) d++; return d; };
    const best = (list: THREE.Object3D[]) => list.slice().sort((a, b) => (skinned.has(b) ? 1 : 0) - (skinned.has(a) ? 1 : 0)
      || (/^DEF-/.test(b.name) ? 1 : 0) - (/^DEF-/.test(a.name) ? 1 : 0) || depth(a) - depth(b))[0];
    for (const j of JOINTS) if (!map[j] && cands[j]?.length) map[j] = best(cands[j]!);
    // limb chains must run in order (upper → lower → end); a helper bone that breaks the chain is dropped
    for (const s of ['L', 'R'] as const) {
      for (const [a, b] of [['armUp', 'armLow'], ['armLow', 'hand'], ['legUp', 'legLow'], ['legLow', 'foot']] as const) {
        const ja = (a + s) as Joint, jb = (b + s) as Joint;
        if (map[ja] && map[jb] && !isAncestor(map[ja]!, map[jb]!)) {
          const alt = cands[jb]?.find(x => isAncestor(map[ja]!, x));
          if (alt) map[jb] = alt; else delete map[jb];
        }
      }
    }
  }
  // names that didn't give a whole body: try the skeleton's shape
  if (rig !== 'VRM' && !(map.hips && map.armUpL && map.armUpR && map.legUpL && map.legUpR)) {
    const shaped = mapByShape(root, bones.filter(b => skinned.has(b) || !skinned.size));
    if (shaped.hips && shaped.armUpL && shaped.armUpR && shaped.legUpL && shaped.legUpR) {
      for (const j of JOINTS) map[j] = shaped[j];
      rig = rig === 'generic' ? 'unnamed (matched by shape)' : rig + ' (matched by shape)';
    }
  }
  // no hand or foot bone (or one that hangs off an IK helper): the forearm's or shin's child that carries
  // the limb on (a palm, a toe base) stands in, so weapons still sit in a hand
  const P = (o: THREE.Object3D) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
  for (const s of ['L', 'R'] as const) {
    for (const [mid, end, up] of [['armLow', 'hand', 'armUp'], ['legLow', 'foot', 'legUp']] as const) {
      const m = map[(mid + s) as Joint], u = map[(up + s) as Joint];
      if (!m || map[(end + s) as Joint]) continue;
      const dir = u ? P(m).sub(P(u)).normalize() : new THREE.Vector3(0, -1, 0);
      let best: THREE.Object3D | null = null, score = 0.3;
      for (const c of m.children) {
        if (!(c as THREE.Bone).isBone) continue;
        const d = P(c).sub(P(m));
        if (d.lengthSq() < 1e-12) continue;
        const sc = d.normalize().dot(dir);
        if (sc > score) { score = sc; best = c; }
      }
      if (best) map[(end + s) as Joint] = best;
    }
  }
  // the hips are where the legs and the spine meet; the chest is where the arms meet
  const legs = [map.legUpL, map.legUpR].filter(Boolean) as THREE.Object3D[];
  const up = map.spine ?? map.chest ?? map.neck ?? map.head;
  if (legs.length === 2 && up && rig !== 'VRM') {
    const meet = commonAncestor([...legs, up], root);
    if (meet && (meet as THREE.Bone).isBone) map.hips = meet;
  }
  if (map.armUpL && map.armUpR && rig !== 'VRM') {
    const meet = commonAncestor([map.armUpL, map.armUpR], root);
    if (meet && (meet as THREE.Bone).isBone && meet !== map.hips && (!map.hips || isAncestor(map.hips, meet))) {
      if (map.chest && map.chest !== meet && isAncestor(map.chest, meet) && (!map.spine || map.spine === map.chest)) map.spine = map.chest;
      map.chest = meet;
    }
  }
  if (map.spine && map.chest && map.spine === map.chest) delete map.spine;
  // a missing spine is the bone between the hips and the chest, if there is one
  if (!map.spine && map.hips && map.chest) { let p = map.chest.parent; while (p && p.parent !== map.hips && p !== map.hips) p = p.parent; if (p && p !== map.hips && p !== map.chest) map.spine = p; }
  if (!map.neck && map.head && map.head.parent && map.head.parent !== map.chest && (map.head.parent as THREE.Bone).isBone) map.neck = map.head.parent;
  return { map, rig };
}

// ---------------------------------------------------------------------------------------------
// Preparing a template
// ---------------------------------------------------------------------------------------------

/** The game's cel shading for the file's materials: base colour, texture, transparency and glow are kept. */
function toonOf(src: THREE.Material): THREE.Material {
  const s = src as THREE.MeshStandardMaterial & { vertexColors?: boolean };
  const m = new THREE.MeshToonMaterial({
    color: s.color ? s.color.clone() : new THREE.Color(0xffffff),
    map: s.map ?? null,
    gradientMap: toonGradient(),
    transparent: !!s.transparent,
    opacity: s.opacity ?? 1,
    alphaTest: s.alphaTest ?? 0,
    alphaMap: s.alphaMap ?? null,
    side: s.side ?? THREE.FrontSide,
    vertexColors: !!s.vertexColors,
    emissive: s.emissive ? s.emissive.clone() : new THREE.Color(0),
    emissiveMap: s.emissiveMap ?? null,
    emissiveIntensity: s.emissiveIntensity ?? 1,
  });
  m.depthWrite = s.depthWrite ?? true;
  m.name = s.name;
  return m;
}

function shrinkTexture(t: THREE.Texture) {
  const run = () => {
    const img = t.image as (CanvasImageSource & { width: number; height: number }) | undefined;
    if (!img || !img.width || Math.max(img.width, img.height) <= TEX_MAX) return;
    const k = TEX_MAX / Math.max(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    t.image = c;
    t.needsUpdate = true;
  };
  const img = t.image as HTMLImageElement | undefined;
  // FBX textures are still loading when the model is parsed
  if (img && 'complete' in img && !img.complete) img.addEventListener('load', run, { once: true }); else run();
}

/** Picks idle / walk / run clips by name (a clip's own name, or its file's): plain names before variants. */
function sortClips(clips: THREE.AnimationClip[], hipsName: string | undefined) {
  const VARIANT = /jump|back|left|right|strafe|turn|crouch|injur|stop|start|sneak|drunk|zombie|swim|climb|ladder|push|carry|aim|fire|shoot/i;
  const find = (exact: RegExp, loose: RegExp) => clips.find(c => exact.test(c.name.trim()))
    ?? clips.find(c => loose.test(c.name) && !VARIANT.test(c.name)) ?? clips.find(c => loose.test(c.name));
  const out: ModelTemplate['clips'] = {
    idle: find(/^(idle|idling|stand(ing)?|breathing idle|happy idle)$/i, /idle|breath|stand/i),
    walk: find(/^(walk|walking)$/i, /walk/i),
    run: find(/^(run|running|jog|jogging|sprint)$/i, /run|jog|sprint/i),
  };
  if (out.run && out.run === out.walk) out.run = undefined;
  // the clips play in place: the game moves the character, so the hips' travel is taken out
  for (const c of [out.idle, out.walk, out.run]) {
    if (!c || !hipsName) continue;
    const tr = c.tracks.find(t => t.name === hipsName + '.position');
    if (!tr) continue;
    const v = tr.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  return out;
}

function pathTo(root: THREE.Object3D, o: THREE.Object3D) {
  const p: number[] = [];
  for (let n = o; n !== root && n.parent; n = n.parent) p.unshift(n.parent.children.indexOf(n));
  return p;
}
function follow(root: THREE.Object3D, path: number[]) {
  let n: THREE.Object3D | undefined = root;
  for (const i of path) n = n?.children[i];
  return n ?? null;
}

/** Reads the file(s) and gets the model ready to be cloned onto characters. */
export async function prepareModel(files: ModelFile[]): Promise<ModelTemplate> {
  const L = await load(files);
  const root = L.root;
  // lights and cameras a file brings along (Sketchfab scenes often do) would light and film the game's world
  const strays: THREE.Object3D[] = [];
  root.traverse(o => { if ((o as THREE.Light).isLight || (o as THREE.Camera).isCamera) strays.push(o); });
  for (const o of strays) o.parent?.remove(o);
  root.updateMatrixWorld(true);
  const bones: THREE.Object3D[] = [];
  const skinned = new Set<THREE.Object3D>();
  root.traverse(o => {
    if ((o as THREE.Bone).isBone) bones.push(o);
    const sk = o as THREE.SkinnedMesh;
    if (sk.isSkinnedMesh) for (const b of sk.skeleton.bones) skinned.add(b);
  });
  const { map, rig } = mapBones(root, bones, L.vrm, skinned);
  const found = JOINTS.filter(j => map[j]);
  const rigged = !!(map.hips && (map.armUpL || map.legUpL) && skinned.size);
  // a rigged character's loose static meshes (a showcase's pedestal, ground or props) are left out;
  // things fixed to a bone (glasses, a hat, a sword in hand) stay
  if (rigged) {
    const loose: THREE.Object3D[] = [];
    root.traverse(o => {
      if (!(o as THREE.Mesh).isMesh || (o as THREE.SkinnedMesh).isSkinnedMesh) return;
      let onBone = false;
      for (let p = o.parent; p; p = p.parent) if ((p as THREE.Bone).isBone) { onBone = true; break; }
      if (!onBone) loose.push(o);
    });
    for (const o of loose) o.parent?.remove(o);
  }
  let meshes = 0, triangles = 0;
  const mats = new Map<THREE.Material, THREE.Material>();
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    meshes++;
    const g = m.geometry;
    triangles += (g.index ? g.index.count : g.getAttribute('position')?.count ?? 0) / 3;
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    // cel-shaded like the rest of the game; shared materials stay shared
    const conv = (x: THREE.Material) => { let t = mats.get(x); if (!t) { t = toonOf(x); mats.set(x, t); } return t; };
    m.material = Array.isArray(m.material) ? m.material.map(conv) : conv(m.material);
    m.castShadow = true;
    m.frustumCulled = false;
  });
  if (!meshes) throw new Error('That file has no meshes to show.');
  for (const t of new Set([...mats.values()].flatMap(x => ['map', 'emissiveMap', 'alphaMap'].map(k => (x as any)[k] as THREE.Texture | null)).filter(Boolean) as THREE.Texture[])) shrinkTexture(t);
  for (const old of mats.keys()) old.dispose();

  // upright and facing +Z: the head above the hips, the character's left on +X
  const P = (o: THREE.Object3D | undefined) => o ? new THREE.Vector3().setFromMatrixPosition(o.matrixWorld) : null;
  const q = new THREE.Quaternion();
  if (rigged) {
    const hp = P(map.hips)!, top = P(map.head ?? map.neck ?? map.chest ?? map.spine);
    if (top) {
      const upv = top.sub(hp).normalize();
      if (upv.y < 0.7 && upv.lengthSq() > 0.5) q.setFromUnitVectors(upv, new THREE.Vector3(0, 1, 0));
    }
    const l = P(map.armUpL ?? map.legUpL), r = P(map.armUpR ?? map.legUpR);
    if (l && r) {
      const side = l.sub(r).applyQuaternion(q);
      const fwd = new THREE.Vector3().crossVectors(side, new THREE.Vector3(0, 1, 0));
      fwd.y = 0;
      if (fwd.lengthSq() > 1e-8) q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(fwd.x, fwd.z)));
    }
  }
  const holder = new THREE.Group();
  holder.quaternion.copy(q);
  holder.add(root);
  holder.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(root, true);
  // how big a unit of each mesh's own geometry ends up in the world (skinning can scale it in ways the
  // node transforms don't show); the outline's width is given in those units
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.computeBoundingBox();
    const g = m.geometry.boundingBox!.getSize(new THREE.Vector3()).length();
    const w = new THREE.Box3().setFromObject(m, true).getSize(new THREE.Vector3()).length();
    m.userData.geoScale = g > 1e-9 && w > 1e-9 ? w / g : 1;
  });
  holder.remove(root);
  root.updateMatrixWorld(true);
  if (bb.isEmpty() || bb.max.y - bb.min.y < 1e-6) throw new Error('That model has no size.');

  const clips = rigged ? sortClips(L.clips, map.hips?.name) : {};
  const clipNames = Object.entries(clips).filter(([, c]) => c).map(([k]) => k);
  const paths: ModelTemplate['paths'] = {};
  for (const j of found) paths[j] = pathTo(root, map[j]!);
  const tri = Math.round(triangles);
  const info: ModelInfo = {
    format: L.format, rig: rigged ? rig : 'none', joints: rigged ? found.length : 0, bones: bones.length, meshes, triangles: tri, clips: clipNames,
    summary: rigged
      ? `${L.format} · ${rig} rig · ${found.length}/${JOINTS.length} joints moved by the game${clipNames.length ? ` · its own ${clipNames.join(', ')}` : ''} · ${tri >= 1000 ? Math.round(tri / 1000) + 'k' : tri} triangles`
      : `${L.format} · ${skinned.size ? 'its skeleton could not be matched to a body' : 'no skeleton'}, so it is shown as a statue · ${tri >= 1000 ? Math.round(tri / 1000) + 'k' : tri} triangles`,
  };
  return { root, base: q, box: { minY: bb.min.y, height: bb.max.y - bb.min.y, cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2 }, paths, rigged, clips, info };
}

// ---------------------------------------------------------------------------------------------
// A character wearing the model
// ---------------------------------------------------------------------------------------------

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const PROC_ORDER: (Joint | 'root')[] = ['root', ...JOINTS];

/** Puts template `tpl` on a character whose procedural body is `proc` (which keeps animating, unseen). */
export function createImported(tpl: ModelTemplate, proc: Humanoid): ModelHandle {
  const root = new THREE.Group();
  // the procedural body is measured where it stands (at the origin, like `root`); it only joins `root`
  // at the end, so a model that fails half way leaves the built-in one untouched
  resetPose(proc);
  proc.root.updateMatrixWorld(true);

  const inst = cloneRigged(tpl.root);
  const fit = new THREE.Group(), outer = new THREE.Group();
  fit.quaternion.copy(tpl.base);
  fit.add(inst);
  outer.add(fit);
  const s = proc.height / tpl.box.height;
  outer.scale.setScalar(s);
  outer.position.set(-tpl.box.cx * s, -tpl.box.minY * s, -tpl.box.cz * s);
  root.add(outer);
  root.updateMatrixWorld(true);

  // own materials per character, so a hit flash lights up only this one; and the game's ink outline,
  // as wide as on the built-in characters whatever units the file uses
  const flashMats: { m: THREE.MeshToonMaterial; e: THREE.Color }[] = [];
  const meshes: THREE.Mesh[] = [];
  inst.traverse(o => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  for (const m of meshes) {
    m.userData.shared = true;
    const own = (x: THREE.Material) => { const c = x.clone() as THREE.MeshToonMaterial; if (c.emissive) flashMats.push({ m: c, e: c.emissive.clone() }); return c; };
    m.material = Array.isArray(m.material) ? m.material.map(own) : own(m.material);
    const ws = (m.userData.geoScale ?? 1) * s;
    const sk = m as THREE.SkinnedMesh;
    let hull: THREE.Mesh;
    if (sk.isSkinnedMesh) { const h = new THREE.SkinnedMesh(m.geometry, outlineMaterial(0.016 / ws)); h.bind(sk.skeleton, sk.bindMatrix); hull = h; }
    else hull = new THREE.Mesh(m.geometry, outlineMaterial(0.016 / ws));
    hull.userData.shared = true;
    hull.frustumCulled = false;
    hull.castShadow = false;
    m.add(hull);
  }

  // faces: a model's mouth-open and blink shapes (VRoid, MMD, ARKit and most anime models have them)
  // follow the game's face bones, so it talks, blinks and squints in dialogue art like a built-in character
  const MOUTH = /^(fcl_mth_a|mth_a|aa|a|vrc\.v_aa|v_aa|mouth_?open|jaw_?open|あ|口開け)$/i;
  const BLINK_BOTH = /^(fcl_eye_close|eye_?close|eyes_?closed|blink|blink_?both|vrc\.blink|まばたき|目閉じ)$/i;
  const BLINK_ONE = /^(eye_?blink_?(l|r|left|right)|fcl_eye_close_(l|r)|blink_?(l|r|left|right))$/i;
  for (const m of meshes) {
    const dict = m.morphTargetDictionary, inf = m.morphTargetInfluences;
    if (!dict || !inf) continue;
    // names can carry a prefix ("Face_Blendshape.Fcl_EYE_Close"): match what follows it
    const keys = Object.entries(dict).map(([k, i]) => [k.trim().replace(/^.*[.|:]/, ''), i] as const);
    const mouthI = keys.filter(([k]) => MOUTH.test(k)).map(([, i]) => i).slice(0, 1);
    let blinkI = keys.filter(([k]) => BLINK_BOTH.test(k)).map(([, i]) => i).slice(0, 1);
    if (!blinkI.length) blinkI = keys.filter(([k]) => BLINK_ONE.test(k)).map(([, i]) => i).slice(0, 2);
    if (!mouthI.length && !blinkI.length) continue;
    m.onBeforeRender = () => {
      const mo = Math.min(1, Math.max(0, (proc.bones.mouth?.scale.y ?? 1) - 1) / 1.8);
      const bl = Math.min(1, Math.max(0, 1 - (proc.bones.eyeL?.scale.y ?? 1)) / 0.9);
      for (const i of mouthI) inf[i] = mo;
      for (const i of blinkI) inf[i] = bl;
    };
  }

  const a = proc.anim;
  let update: (dt: number) => void;
  let hand: THREE.Object3D = proc.hand, handL: THREE.Object3D = proc.handL, head: THREE.Object3D = proc.bones.head;

  // the procedural joints in character space, worked out each frame
  const procQ: Record<string, THREE.Quaternion> = {};
  const procRest: Record<string, THREE.Quaternion> = {};
  for (const k of PROC_ORDER) { procQ[k] = new THREE.Quaternion(); procRest[k] = new THREE.Quaternion(); }
  const hipsRestP = new THREE.Vector3(), hipsP = new THREE.Vector3();
  const procPose = (into: Record<string, THREE.Quaternion>, hp: THREE.Vector3) => {
    const b = proc.bones;
    into.root.copy(b.root?.quaternion ?? _q.identity());
    for (const j of JOINTS) into[j].copy(into[PARENT[j]]).multiply(b[j].quaternion);
    hp.copy(b.hips.position).applyQuaternion(into.root).add(b.root?.position ?? _v.set(0, 0, 0));
  };
  procPose(procRest, hipsRestP);
  for (const k of PROC_ORDER) procRest[k].invert();
  const procRestPos: Record<string, THREE.Vector3> = {};
  for (const j of JOINTS) procRestPos[j] = proc.bones[j].getWorldPosition(new THREE.Vector3());

  if (!tpl.rigged) {
    // a statue: it bobs, leans and falls with the body's hips
    const p0 = outer.position.clone(), pivot = hipsRestP.clone();
    update = (dt) => {
      a.update(dt);
      procPose(procQ, hipsP);
      const d = _q.copy(procQ.hips).multiply(procRest.hips);
      outer.quaternion.copy(d);
      outer.position.copy(p0).sub(pivot).applyQuaternion(d).add(pivot).add(_v.copy(hipsP).sub(hipsRestP));
    };
  } else {
    // the imported skeleton, parents before children
    const bones: THREE.Object3D[] = [];
    inst.traverse(o => { if ((o as THREE.Bone).isBone) bones.push(o); });
    const index = new Map(bones.map((b, i) => [b, i]));
    const n = bones.length;
    const parent = new Int32Array(n).fill(-1);
    const baseRot: THREE.Quaternion[] = [];
    const W: THREE.Quaternion[] = [];
    const restQ: THREE.Quaternion[] = [], restP: THREE.Vector3[] = [];
    const jointOf: (Joint | null)[] = new Array(n).fill(null);
    const aligned: THREE.Quaternion[] = [];
    // a plain node between two bones (some files have them) keeps its turn: a fixed offset after the bone above
    const offRot: (THREE.Quaternion | null)[] = new Array(n).fill(null);
    const worldQ = (o: THREE.Object3D) => { const q = new THREE.Quaternion(); o.matrixWorld.decompose(_v, q, _s); return q; };
    for (let i = 0; i < n; i++) {
      const b = bones[i];
      let p = b.parent;
      while (p && !index.has(p) && p !== root) p = p.parent;
      parent[i] = p && index.has(p) ? index.get(p)! : -1;
      baseRot[i] = new THREE.Quaternion();
      if (parent[i] < 0 && b.parent) b.parent.matrixWorld.decompose(_v, baseRot[i], _s);
      if (parent[i] >= 0 && b.parent && b.parent !== bones[parent[i]]) offRot[i] = worldQ(bones[parent[i]]).invert().multiply(worldQ(b.parent));
      W[i] = new THREE.Quaternion();
      restQ[i] = b.quaternion.clone();
      restP[i] = b.position.clone();
      aligned[i] = new THREE.Quaternion();
    }
    const boneOf: Partial<Record<Joint, THREE.Object3D>> = {};
    for (const j of JOINTS) { const path = tpl.paths[j]; const o = path ? follow(inst, path) : null; if (o && index.has(o)) boneOf[j] = o; }
    const restW = (o: THREE.Object3D) => { const q = new THREE.Quaternion(); o.matrixWorld.decompose(_v, q, _s); return q; };
    const pos = (o: THREE.Object3D) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const align: Partial<Record<Joint, THREE.Quaternion>> = {};
    for (const j of JOINTS) {
      const bo = boneOf[j];
      if (!bo) continue;
      const aim = AIM[j] && boneOf[AIM[j]!] ? AIM[j] : AIM_FAR[j] && boneOf[AIM_FAR[j]!] ? AIM_FAR[j] : undefined;
      let A = new THREE.Quaternion();
      if (aim && boneOf[aim]) {
        const dB = pos(boneOf[aim]!).sub(pos(bo)), dJ = procRestPos[aim].clone().sub(procRestPos[j]);
        if (dB.lengthSq() > 1e-10 && dJ.lengthSq() > 1e-10) A = new THREE.Quaternion().setFromUnitVectors(dB.normalize(), dJ.normalize());
      } else if (INHERIT[j] && align[INHERIT[j]!]) A = align[INHERIT[j]!]!.clone();
      else if ((j === 'handL' || j === 'handR' || j === 'footL' || j === 'footR') && align[(j.startsWith('hand') ? 'armUp' : 'legUp') + j.slice(-1) as Joint]) A = align[(j.startsWith('hand') ? 'armUp' : 'legUp') + j.slice(-1) as Joint]!.clone();
      align[j] = A;
      const i = index.get(bo)!;
      jointOf[i] = j;
      aligned[i].copy(A).multiply(restW(bo));
    }
    // helper bones standing beside a matched bone rather than under it (VRM's roll and aim helpers, a
    // sleeve's bone) turn with the bone they are named after, the way their constraints would make them
    for (let i = 0; i < n; i++) {
      if (jointOf[i]) continue;
      const c = classify(bones[i].name, true);
      const bo = c ? boneOf[c.joint] : undefined;
      if (!c || !bo || !align[c.joint] || isAncestor(bo, bones[i])) continue;
      jointOf[i] = c.joint;
      aligned[i].copy(align[c.joint]!).multiply(restW(bones[i]));
    }
    const hipsBone = boneOf.hips!;
    const hi = index.get(hipsBone)!;
    const hipsParentScale = hipsBone.parent ? hipsBone.parent.getWorldScale(_s).x || 1 : 1;

    // hand and head sockets: weapons and effects attached to them sit on the model's own hands the
    // way they sit on the built-in ones (same orientation, same size)
    const socket = (j: Joint) => {
      const bo = boneOf[j];
      if (!bo) return null;
      const sk = new THREE.Object3D();
      sk.name = 'socket:' + j;
      // Qjoint = Qbone × R at all times, so R = Qbone_rest⁻¹ × A⁻¹ × Qjoint_rest
      const R = restW(bo).invert().multiply(align[j]!.clone().invert()).multiply(procRest[j].clone().invert());
      sk.quaternion.copy(R);
      sk.scale.setScalar(1 / (bo.getWorldScale(_s).x || 1));
      bo.add(sk);
      return sk;
    };
    hand = socket('handR') ?? hand;
    handL = socket('handL') ?? handL;
    head = socket('head') ?? head;

    // the file's own idle / walk / run, while the character isn't doing anything else
    const mixer = tpl.clips.idle || tpl.clips.walk || tpl.clips.run ? new THREE.AnimationMixer(inst) : null;
    const act = (c?: THREE.AnimationClip) => { if (!c || !mixer) return null; const x = mixer.clipAction(c); x.play(); x.setEffectiveWeight(0); return x; };
    const idle = act(tpl.clips.idle), walk = act(tpl.clips.walk), run = act(tpl.clips.run);
    let wProc = 1, mixed = false;

    const hipsLocal = new THREE.Vector3();
    /** a bone's parent's character-space rotation this frame (the parent is done first) */
    const parentW = (i: number) => parent[i] < 0 ? baseRot[i] : offRot[i] ? _q3.copy(W[parent[i]]).multiply(offRot[i]!) : W[parent[i]];
    update = (dt) => {
      a.update(dt);
      procPose(procQ, hipsP);
      // who drives: the game's moves, or the file's own clip while standing or walking
      let target = 1;
      if (mixer && !a.action && a.hitT <= 0 && !a.dead) {
        const moving = a.speed > 0.3;
        if (moving && (walk || run)) target = 0;
        else if (!moving && idle) target = 0;
      }
      wProc += (target - wProc) * Math.min(1, dt * 10);
      if (Math.abs(target - wProc) < 0.002) wProc = target;
      if (mixer && wProc < 1) {
        const sp = a.speed, runW = walk && run ? Math.min(1, Math.max(0, (sp - 3) / 2.5)) : run ? 1 : 0;
        const moving = sp > 0.3;
        idle?.setEffectiveWeight(moving ? 0 : 1);
        walk?.setEffectiveWeight(moving ? 1 - runW : 0);
        run?.setEffectiveWeight(moving ? runW : 0);
        if (walk) walk.timeScale = Math.min(1.8, Math.max(0.6, sp / 2.2));
        if (run) run.timeScale = Math.min(1.6, Math.max(0.7, sp / 5));
        for (let i = 0; i < n; i++) { bones[i].quaternion.copy(restQ[i]); bones[i].position.copy(restP[i]); }
        mixer.update(dt);
        mixed = true;
      } else if (mixed) {
        // back to the game's moves: whatever the clip moved goes home
        for (let i = 0; i < n; i++) bones[i].position.copy(restP[i]);
        mixed = false;
      }
      // parents first: each bone's character-space rotation, and the local one that gets it there
      for (let i = 0; i < n; i++) {
        const b = bones[i];
        const pw = parentW(i);
        const j = jointOf[i];
        if (j) {
          // target = (joint now × joint at rest⁻¹) × alignment × bone at rest
          _q.copy(procQ[j]).multiply(procRest[j]).multiply(aligned[i]);
          _q2.copy(pw).invert().multiply(_q);
          if (wProc < 1) b.quaternion.slerp(_q2, wProc); else b.quaternion.copy(_q2);
        } else if (wProc >= 1) b.quaternion.copy(restQ[i]);
        else if (wProc > 0) b.quaternion.slerp(restQ[i], wProc);
        W[i].copy(pw).multiply(b.quaternion);
      }
      // the hips carry the body's bob, crouch and fall
      const pw = parentW(hi);
      hipsLocal.copy(hipsP).sub(hipsRestP).applyQuaternion(_q.copy(pw).invert()).divideScalar(hipsParentScale).add(restP[hi]);
      if (wProc < 1) hipsBone.position.lerp(hipsLocal, wProc); else hipsBone.position.copy(hipsLocal);
    };
  }

  const rig: RigModel = {
    root, mesh: proc.mesh, outline: proc.outline, bones: proc.bones, rest: proc.rest, height: proc.height,
    flash: (amount, color) => { for (const f of flashMats) { if (amount > 0.001) f.m.emissive.setHex(color).multiplyScalar(amount).add(f.e); else f.m.emissive.copy(f.e); } },
  };
  const handle: ModelHandle = {
    root,
    rig,
    height: proc.height,
    get speed() { return a.speed; },
    set speed(v: number) { a.speed = v; },
    get dead() { return a.dead; },
    set dead(v: boolean) { a.dead = v; },
    update: (dt) => update(dt),
    play: (action, dur) => a.play(action as ActionName, dur),
    hit: () => { a.hitT = 0.25; },
    die: () => { a.dead = true; a.deadT = 0; },
    revive: () => { a.dead = false; a.deadT = 0; },
    hand,
    handL,
    head,
    setStance: (st) => { a.stance = st; },
    impactFrac: ACTION_TIMING.impact,
    get onStep() { return a.onStep; },
    set onStep(f: (() => void) | null) { a.onStep = f; },
    get talking() { return a.talking; },
    set talking(v: boolean) { a.talking = v; },
  };
  // the procedural body stays as the puppeteer: its bones move, nothing of it is drawn
  root.add(proc.root);
  proc.root.traverse(o => { if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints || (o as THREE.Sprite).isSprite) o.visible = false; });
  handle.update(0);
  return handle;
}

// ---------------------------------------------------------------------------------------------
// The models the player has picked
// ---------------------------------------------------------------------------------------------

class CustomModels {
  private tpls = new Map<string, ModelTemplate>();
  private pending = new Map<string, Promise<ModelTemplate | null>>();
  /** why a stored model couldn't be used */
  errors = new Map<string, string>();
  /** bumped whenever a model is added or removed */
  version = 0;

  get(id: string) { return this.tpls.get(id) ?? null; }
  info(id: string) { return this.tpls.get(id)?.info ?? null; }
  loading(id: string) { return this.pending.has(id); }

  /** (Re)reads character `id`'s stored model. Resolves to null when there is none or it can't be used. */
  load(id: string): Promise<ModelTemplate | null> {
    const prev = this.pending.get(id);
    if (prev) return prev;
    const job = (async () => {
      const rec = media.model(id);
      if (!rec) { this.tpls.delete(id); this.errors.delete(id); return null; }
      try {
        const t = await prepareModel(rec.files);
        this.tpls.set(id, t);
        this.errors.delete(id);
        return t;
      } catch (e) {
        this.tpls.delete(id);
        this.errors.set(id, (e as Error)?.message || 'That model could not be read.');
        return null;
      } finally {
        this.version++;
      }
    })();
    this.pending.set(id, job);
    void job.finally(() => this.pending.delete(id));
    return job;
  }

  forget(id: string) { this.tpls.delete(id); this.errors.delete(id); this.version++; }

  /** Reads every stored model, one after another (at start-up, after the saved files are found). */
  async loadAll() { for (const id of media.modelIds()) await this.load(id); }
}

export const customModels = new CustomModels();

/**
 * Character `id`'s model: the player's own if they picked one for it, otherwise `base` (the built-in
 * model). Only humanoid-rigged built-in models can carry an imported one.
 */
export function withCustomModel(id: string, base: ModelHandle): ModelHandle {
  const tpl = customModels.get(id);
  if (!tpl) return base;
  const h = base.rig as Humanoid;
  if (!h.anim || !h.bones?.hips || !h.bones.armUpL || !h.bones.legUpL) return base;
  try { return createImported(tpl, h); } catch (e) { console.warn('custom model', id, e); return base; }
}
