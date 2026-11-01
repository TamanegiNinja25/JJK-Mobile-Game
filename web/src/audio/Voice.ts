// Character voices for dialogue. 'gen' synthesises a voice per character while the text types: each
// syllable is a buzzing glottal source shaped by two vowel formants, at that character's pitch, pace
// and grain (curses growl and echo). 'tts' reads the line aloud with the phone's text-to-speech engine
// (the Android host's bridge, or the browser's speech API), pitched and paced per character.
import { audio } from './Audio';

export type VoiceMode = 'gen' | 'tts' | 'off';

export interface VoiceProfile {
  /** base pitch, Hz */
  f0: number;
  /** how far the pitch wanders between syllables, semitones */
  range: number;
  /** syllables per second when speaking at full pace */
  rate: number;
  /** vowel formant scale: about 1 for adult male, 1.15–1.25 female, under 0.9 for something huge */
  formant: number;
  wave?: OscillatorType;
  /** 0..1 breathy noise mixed into each syllable */
  breath?: number;
  /** 0..1 rough amplitude flutter (curses, the King of Curses) */
  growl?: number;
  /** 0..1 reverb send: voices that don't quite come from this world */
  echo?: number;
  /** text-to-speech pitch and speed multipliers */
  ttsPitch?: number;
  ttsRate?: number;
}

const P = (f0: number, range: number, rate: number, formant: number, x: Partial<VoiceProfile> = {}): VoiceProfile => ({ f0, range, rate, formant, ...x });
const SUKUNA = P(82, 3, 7.5, 0.84, { growl: 0.45, echo: 0.22, breath: 0.1, ttsPitch: 0.55, ttsRate: 0.88 });

export const VOICES: Record<string, VoiceProfile> = {
  yuji: P(150, 4.5, 11, 1.0, { breath: 0.08, ttsPitch: 1.05, ttsRate: 1.08 }),
  megumi: P(118, 2.2, 8.5, 0.97, { breath: 0.06, ttsPitch: 0.9, ttsRate: 0.98 }),
  nobara: P(232, 5, 11.5, 1.2, { ttsPitch: 1.3, ttsRate: 1.08 }),
  gojo: P(134, 6, 10.5, 1.02, { breath: 0.12, ttsPitch: 1.0, ttsRate: 1.06 }),
  gojoMemory: P(134, 6, 10.5, 1.02, { breath: 0.12, echo: 0.25, ttsPitch: 1.0, ttsRate: 1.04 }),
  sukuna: SUKUNA, sukunaYuji: SUKUNA, sukunaMegumi: { ...SUKUNA, f0: 88 }, heianSukuna: { ...SUKUNA, f0: 74, formant: 0.8 },
  moduloYuji: P(124, 3, 9, 0.96, { breath: 0.12, ttsPitch: 0.9, ttsRate: 0.96 }),
  nanami: P(98, 1.5, 7.8, 0.92, { ttsPitch: 0.78, ttsRate: 0.92 }),
  yaga: P(88, 2, 7.2, 0.9, { breath: 0.08, ttsPitch: 0.68, ttsRate: 0.88 }),
  shoko: P(198, 2, 8.2, 1.15, { breath: 0.25, ttsPitch: 1.12, ttsRate: 0.94 }),
  maki: P(208, 3, 10, 1.14, { ttsPitch: 1.15, ttsRate: 1.06 }),
  mai: P(222, 3.5, 10, 1.17, { ttsPitch: 1.22, ttsRate: 1.02 }),
  panda: P(108, 3, 9, 0.94, { breath: 0.12, ttsPitch: 0.82, ttsRate: 1.0 }),
  inumaki: P(140, 3, 8.5, 1.0, { breath: 0.35, ttsPitch: 1.0, ttsRate: 0.95 }),
  ijichi: P(142, 5.5, 12, 1.0, { ttsPitch: 1.06, ttsRate: 1.18 }),
  junpei: P(146, 3, 9.5, 1.02, { breath: 0.1, ttsPitch: 1.06, ttsRate: 0.98 }),
  todo: P(94, 6, 9, 0.87, { ttsPitch: 0.72, ttsRate: 1.02 }),
  miwa: P(246, 5, 11.5, 1.22, { ttsPitch: 1.34, ttsRate: 1.1 }),
  meimei: P(214, 2, 8.4, 1.15, { breath: 0.2, ttsPitch: 1.12, ttsRate: 0.92 }),
  mechamaru: P(140, 1, 10, 1.0, { wave: 'square', echo: 0.08, ttsPitch: 0.95, ttsRate: 1.0 }),
  mahito: P(162, 7, 11, 1.05, { echo: 0.15, ttsPitch: 1.18, ttsRate: 1.06 }),
  hanami: P(98, 2, 6.5, 0.9, { breath: 0.3, echo: 0.35, ttsPitch: 0.8, ttsRate: 0.85 }),
  jogo: P(188, 6, 12, 1.1, { growl: 0.18, ttsPitch: 1.25, ttsRate: 1.12 }),
  dagon: P(68, 2, 6, 0.78, { growl: 0.35, echo: 0.35, ttsPitch: 0.5, ttsRate: 0.82 }),
  choso: P(104, 2, 8, 0.92, { ttsPitch: 0.82, ttsRate: 0.94 }),
  kenjaku: P(124, 3, 9, 0.98, { echo: 0.12, ttsPitch: 0.95, ttsRate: 0.98 }),
  kechizu: P(150, 6, 10, 1.05, { growl: 0.25, ttsPitch: 1.15, ttsRate: 1.05 }),
  eso: P(110, 3, 8, 0.93, { growl: 0.12, ttsPitch: 0.85, ttsRate: 0.95 }),
  yuta: P(134, 3, 9, 1.0, { breath: 0.14, ttsPitch: 0.98, ttsRate: 0.98 }),
  naoya: P(130, 5, 11, 1.0, { ttsPitch: 1.0, ttsRate: 1.1 }),
  naoyaCurse: P(126, 5, 11, 0.98, { growl: 0.3, echo: 0.25, ttsPitch: 0.9, ttsRate: 1.08 }),
  hakari: P(124, 5, 11, 0.98, { ttsPitch: 0.96, ttsRate: 1.1 }),
  higuruma: P(104, 2, 8, 0.93, { ttsPitch: 0.84, ttsRate: 0.94 }),
  kashimo: P(114, 4, 10, 0.95, { growl: 0.1, ttsPitch: 0.9, ttsRate: 1.04 }),
  ishigori: P(90, 6, 10, 0.88, { growl: 0.2, ttsPitch: 0.72, ttsRate: 1.08 }),
  uro: P(204, 4, 10, 1.12, { ttsPitch: 1.12, ttsRate: 1.04 }),
  uraume: P(170, 2, 8, 1.08, { breath: 0.1, ttsPitch: 1.06, ttsRate: 0.92 }),
  tengen: P(160, 1.5, 7, 1.05, { echo: 0.32, breath: 0.12, ttsPitch: 1.0, ttsRate: 0.86 }),
  kamo: P(124, 2, 8.5, 0.98, { ttsPitch: 0.95, ttsRate: 0.98 }),
  toji: P(94, 2.5, 8, 0.9, { breath: 0.16, ttsPitch: 0.75, ttsRate: 0.95 }),
  geto: P(110, 2.5, 8.5, 0.95, { breath: 0.1, ttsPitch: 0.86, ttsRate: 0.95 }),
  grandpa: P(100, 2, 7, 0.92, { breath: 0.2, ttsPitch: 0.75, ttsRate: 0.86 }),
  sasaki: P(222, 4, 10.5, 1.18, { ttsPitch: 1.25, ttsRate: 1.04 }),
  iguchi: P(150, 4, 10, 1.0, { ttsPitch: 1.05, ttsRate: 1.04 }),
  monk: P(96, 2, 7, 0.92, { breath: 0.15, ttsPitch: 0.75, ttsRate: 0.88 }),
  farmer: P(112, 3, 8.5, 0.95, { ttsPitch: 0.85, ttsRate: 0.95 }),
  kuchisake: P(198, 3, 8, 1.12, { echo: 0.3, breath: 0.2, ttsPitch: 1.1, ttsRate: 0.9 }),
  smallpox: P(78, 2, 6, 0.82, { growl: 0.3, echo: 0.4, ttsPitch: 0.55, ttsRate: 0.82 }),
  rainbowDragon: P(60, 2, 5, 0.75, { growl: 0.5, echo: 0.3, ttsPitch: 0.5, ttsRate: 0.8 }),
  mahoraga: P(62, 1, 5, 0.75, { growl: 0.4, echo: 0.3, ttsPitch: 0.5, ttsRate: 0.8 }),
  nitta: P(214, 4, 10.5, 1.16, { ttsPitch: 1.2, ttsRate: 1.08 }),
  fingerBearer: P(70, 3, 6, 0.8, { growl: 0.5, echo: 0.3, ttsPitch: 0.5, ttsRate: 0.8 }),
  civilian: P(150, 3, 9.5, 1.04, { ttsPitch: 1.0, ttsRate: 1.0 }),
  student: P(165, 3.5, 10, 1.08, { ttsPitch: 1.08, ttsRate: 1.02 }),
};

/** Vowel formants (F1, F2) for a, i, u, e, o at an adult male's size. */
const VOWELS: [number, number][] = [[730, 1090], [290, 2250], [320, 900], [520, 1800], [560, 860]];

export function voiceFor(id: string): VoiceProfile {
  return VOICES[id] ?? VOICES.civilian;
}

class VoiceSys {
  mode: VoiceMode = 'gen';
  volume = 0.9;
  private bus: GainNode | null = null;
  private ttsId = 0;
  private ttsBusy = false;
  private ttsTimer = 0;

  constructor() {
    (window as any).__ttsDone = (id: string) => { if (id === 'cc' + this.ttsId) this.ttsBusy = false; };
  }

  private out() {
    const ctx = audio.ctx!;
    if (!this.bus) { this.bus = ctx.createGain(); this.bus.connect(audio.sfxBus); }
    this.bus.gain.value = this.volume;
    return this.bus;
  }

  /** Whether spoken (text-to-speech) dialogue can work on this device right now. */
  ttsAvailable(): boolean {
    const a = (window as any).CCAndroid;
    if (a?.ttsReady) { try { return !!a.ttsReady(); } catch { return false; } }
    return typeof speechSynthesis !== 'undefined';
  }

  /** One syllable of a character's generated voice, starting now. `stress` raises the pitch a little. */
  syllable(p: VoiceProfile, dur = 0.09, stress = 0) {
    if (this.mode === 'off' || !audio.ctx || audio.muted) return;
    const ctx = audio.ctx, t = ctx.currentTime + 0.005;
    const out = this.out();
    const semis = (Math.random() * 2 - 1) * p.range + stress;
    const f = p.f0 * Math.pow(2, semis / 12);
    const src = ctx.createOscillator();
    src.type = p.wave ?? 'sawtooth';
    src.frequency.setValueAtTime(f, t);
    src.frequency.linearRampToValueAtTime(f * (0.95 + Math.random() * 0.08), t + dur);
    const [v1, v2] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.32, t + 0.014);
    env.gain.setValueAtTime(0.28, t + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
    for (const [fr, q, g] of [[v1 * p.formant, 7, 1], [v2 * p.formant, 10, 0.55]] as const) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q;
      const gg = ctx.createGain(); gg.gain.value = g;
      src.connect(bp); bp.connect(gg); gg.connect(env);
    }
    // a little of the raw source keeps low voices from sounding like a kazoo
    const body = ctx.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 900 * p.formant;
    const bg = ctx.createGain(); bg.gain.value = 0.18;
    src.connect(body); body.connect(bg); bg.connect(env);
    if (p.growl) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 26 + Math.random() * 18;
      const depth = ctx.createGain(); depth.gain.value = 0.14 * p.growl;
      lfo.connect(depth); depth.connect(env.gain);
      lfo.start(t); lfo.stop(t + dur + 0.06);
    }
    env.connect(out);
    if (p.echo) { const s = ctx.createGain(); s.gain.value = p.echo; env.connect(s); s.connect(audio.reverbSend); }
    src.start(t); src.stop(t + dur + 0.06);
    // consonant onset and breath
    if (Math.random() < 0.45) audio.noiseBurst(t - 0.004, 0.025, out, { type: 'highpass', f0: 2600 + Math.random() * 2400, q: 0.8, vol: 0.06 });
    if (p.breath) audio.noiseBurst(t, dur, out, { type: 'bandpass', f0: v2 * p.formant, q: 2, vol: 0.12 * p.breath, pink: true });
  }

  /** Read a whole line aloud with text-to-speech. Returns false if speech isn't available. */
  speak(text: string, p: VoiceProfile): boolean {
    if (this.mode !== 'tts' || audio.muted) return false;
    const clean = text.replace(/[—–]/g, ', ').replace(/\.\.\.|…/g, '. ').replace(/[*_"]/g, '');
    const id = ++this.ttsId;
    const a = (window as any).CCAndroid;
    try {
      if (a?.ttsSpeak && a.ttsReady?.()) {
        a.ttsSpeak(clean, p.ttsPitch ?? 1, p.ttsRate ?? 1, 'cc' + id);
      } else if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'en-US'; u.pitch = Math.min(2, Math.max(0, p.ttsPitch ?? 1)); u.rate = p.ttsRate ?? 1; u.volume = this.volume * audio.volumes.master;
        u.onend = u.onerror = () => { if (id === this.ttsId) this.ttsBusy = false; };
        speechSynthesis.speak(u);
      } else return false;
    } catch { return false; }
    this.ttsBusy = true;
    // safety net in case the engine never reports back: a generous reading time
    clearTimeout(this.ttsTimer);
    this.ttsTimer = window.setTimeout(() => { if (id === this.ttsId) this.ttsBusy = false; }, 1500 + clean.length * 90);
    return true;
  }

  /** Still reading the current line aloud. */
  get speaking() { return this.ttsBusy; }

  stop() {
    if (!this.ttsBusy) return;
    this.ttsBusy = false;
    this.ttsId++;
    const a = (window as any).CCAndroid;
    try { if (a?.ttsStop) a.ttsStop(); else if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch { /* engine gone */ }
  }
}

export const voice = new VoiceSys();
