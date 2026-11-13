// Recorded sound effects: Kenney's CC0 packs (Impact Sounds, RPG Audio, Interface Sounds, www.kenney.nl) and
// CC0 packs from itch.io (ognomo's Retro Horror and Lo-Fi Fantasy SFX, SquigglyFish's Hit & Impact sampler),
// shipped in www/sfx as small Ogg Opus clips with AAC copies for iPhone and iPad. A named sound the game plays can have a few takes. Each time,
// one is picked at random (never the same take twice running) and re-pitched a touch. A take either replaces
// the synthesised sound or plays over a quieter copy of it, so a punch keeps its low thump and gains a real
// smack. Cursed techniques, domains and music stay synthesised. Settings → Audio → Sound effects switches
// between these and the fully synthesised set, and a clip the player picks for a sound overrides both.

import type { Surface } from './Audio';

export interface SampleDef {
  /** clip names in www/sfx (without .ogg) */
  files: string[];
  /** loudness of the recording, before the caller's volume */
  vol: number;
  /** also play the synthesised sound underneath, at this share of its usual loudness */
  synth?: number;
  /** base playback rate (below 1 is deeper and slower) */
  rate?: number;
}

/** `base` + numbers: takes('click_', 3, 1) → click_001, click_002, click_003 */
const takes = (base: string, n: number, from = 0, pad = 3) => Array.from({ length: n }, (_, i) => base + String(from + i).padStart(pad, '0'));

export const SAMPLES: Record<string, SampleDef> = {
  // ---- blows ----
  punch: { files: takes('impactPunch_medium_', 5), vol: 0.58, synth: 0.5 },
  hit: { files: takes('impactPunch_medium_', 5), vol: 0.32, synth: 0.55 },
  kick: { files: takes('impactPunch_heavy_', 5), vol: 0.61, synth: 0.5 },
  crit: { files: takes('critHit', 5, 1, 1), vol: 0.75, synth: 0.6 },
  slash: { files: ['knifeSlice', 'knifeSlice2', 'chop'], vol: 0.44, synth: 0.55 },
  swing: { files: takes('cloth', 4, 1, 1), vol: 0.15, synth: 0.8, rate: 1.15 },
  swingHeavy: { files: takes('cloth', 4, 1, 1), vol: 0.21, synth: 0.85, rate: 0.8 },
  dash: { files: takes('cloth', 4, 1, 1), vol: 0.19, synth: 0.9, rate: 1.3 },
  block: { files: [...takes('impactPlate_medium_', 3), ...takes('shieldBlock', 5, 1, 1)], vol: 0.55, synth: 0.45 },
  hurt: { files: takes('impactSoft_heavy_', 5), vol: 0.47, synth: 0.75 },
  land: { files: takes('impactSoft_heavy_', 5), vol: 0.66, synth: 0.6, rate: 0.9 },
  stomp: { files: takes('groundSlam', 5, 1, 1), vol: 0.55, synth: 0.7, rate: 0.9 },
  // ---- cursed tools and props ----
  hammer: { files: takes('impactMetal_heavy_', 5), vol: 1.0, synth: 0.8 },
  nail: { files: takes('impactMetal_light_', 5), vol: 0.39, synth: 0.6, rate: 1.1 },
  tink: { files: takes('impactTin_medium_', 3), vol: 0.34 },
  squish: { files: takes('impactSoft_medium_', 3), vol: 0.78, synth: 0.6 },
  shatter: { files: takes('impactGlass_heavy_', 3), vol: 1.0, synth: 0.8 },
  gavel: { files: takes('impactWood_heavy_', 3), vol: 1.0, synth: 0.9 },
  explosion: { files: takes('groundSlam', 5, 1, 1), vol: 0.8, synth: 1, rate: 0.75 },
  shockwave: { files: takes('energyHit', 5, 1, 1), vol: 0.5, synth: 0.8, rate: 0.85 },
  // ---- cursed spirits (ognomo's CC0 Retro Horror and Lo-Fi Fantasy packs, itch.io) ----
  growl: { files: takes('monsterGrowl', 4, 1, 1), vol: 0.5, synth: 0.6, rate: 0.85 },
  roar: { files: takes('ogreRoar', 5, 1, 1), vol: 0.62, synth: 0.8, rate: 0.7 },
  screech: { files: takes('curseScreech', 6, 1, 1), vol: 0.45, synth: 0.55 },
  curse: { files: takes('ghostImpact', 4, 1, 1), vol: 0.5, synth: 0.7 },
  potion: { files: takes('potionUse', 2, 1, 1), vol: 0.45, synth: 0.4 },
  // ---- menus and the world ----
  click: { files: takes('click_', 5, 1), vol: 0.59 },
  tab: { files: takes('select_', 4, 1), vol: 0.21 },
  open: { files: takes('open_', 4, 1), vol: 0.17 },
  close: { files: takes('close_', 4, 1), vol: 0.22 },
  error: { files: takes('error_', 3, 1), vol: 0.22 },
  equip: { files: ['metalLatch', 'metalClick', 'beltHandle1', 'beltHandle2', 'clothBelt', 'clothBelt2'], vol: 0.3 },
  coin: { files: ['handleCoins', 'handleCoins2'], vol: 0.39 },
  buy: { files: ['handleCoins', 'handleCoins2'], vol: 0.4, synth: 0.6 },
  door: { files: ['doorOpen_1', 'doorOpen_2'], vol: 0.19 },
};

/** Footsteps by ground, with the level each set plays at. Water, metal and flesh keep their synthesised steps. */
export const STEPS: Partial<Record<Surface, { files: string[]; vol: number }>> = {
  grass: { files: takes('footstep_grass_', 5), vol: 0.26 },
  dirt: { files: takes('footstep0', 6, 0, 1), vol: 0.085 },
  stone: { files: takes('footstep_concrete_', 5), vol: 0.34 },
  concrete: { files: takes('footstep_concrete_', 5), vol: 0.34 },
  wood: { files: takes('footstep_wood_', 5), vol: 0.36 },
};

/** Every clip the game uses, for loading (and for the build's check that each one exists). */
export function sampleFiles() {
  return [...new Set([...Object.values(SAMPLES).flatMap(d => d.files), ...Object.values(STEPS).flatMap(st => st?.files ?? [])])];
}

class SampleBank {
  private bufs = new Map<string, AudioBuffer>();
  private lastTake = new Map<string, string>();
  private started = false;
  loaded = 0;
  failed = 0;
  get total() { return sampleFiles().length; }

  /** Fetches and decodes every clip in the background, a few at a time. Missing ones are simply skipped. */
  async load(ctx: BaseAudioContext, base = 'sfx/') {
    if (this.started) return;
    this.started = true;
    const all = sampleFiles();
    // Ogg everywhere it plays (Android); iPhone and iPad get the AAC copies of the same clips
    let ext = 'ogg';
    try { if (!new Audio().canPlayType('audio/ogg; codecs="opus"')) ext = 'm4a'; } catch { ext = 'm4a'; }
    const decode = async (url: string) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.arrayBuffer();
      return new Promise<AudioBuffer>((res, rej) => {
        // the callback form also works on older Android WebViews
        const p = ctx.decodeAudioData(data, res, rej) as Promise<AudioBuffer> | undefined;
        p?.catch?.(rej);
      });
    };
    let i = 0;
    const worker = async () => {
      while (i < all.length) {
        const f = all[i++];
        try {
          let buf: AudioBuffer;
          try { buf = await decode(base + f + '.' + ext); } catch (e) {
            // a browser that claims Ogg but can't decode it: the AAC copy, and AAC from then on
            if (ext !== 'ogg') throw e;
            buf = await decode(base + f + '.m4a');
            ext = 'm4a';
          }
          this.bufs.set(f, buf);
          this.loaded++;
        } catch {
          this.failed++;
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  /** A take of one of `files`, not the one `key` played last time. Null while none is ready. */
  pick(key: string, files: string[]) {
    let ready = files.filter(f => this.bufs.has(f));
    if (!ready.length) return null;
    const last = this.lastTake.get(key);
    if (ready.length > 1 && last) ready = ready.filter(f => f !== last);
    const f = ready[Math.floor(Math.random() * ready.length)];
    this.lastTake.set(key, f);
    return this.bufs.get(f)!;
  }

  has(f: string) { return this.bufs.has(f); }
}

export const samples = new SampleBank();
