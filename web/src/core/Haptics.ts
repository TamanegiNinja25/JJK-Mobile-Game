// Vibration: the phone's (Android; iPhone browsers don't vibrate) and a connected controller's rumble.
// Short pulses for taking a blow, stronger ones for critical hits, Black Flash and a boss changing phase.

let enabled = true;
export function setHaptics(on: boolean) { enabled = on; }

type Kind = 'hurt' | 'crit' | 'blackFlash' | 'phase' | 'domain' | 'death';
const PATTERN: Record<Kind, { ms: number | number[]; strong: number; weak: number }> = {
  hurt: { ms: 30, strong: 0.25, weak: 0.4 },
  crit: { ms: 22, strong: 0.35, weak: 0.5 },
  blackFlash: { ms: [40, 30, 60], strong: 1, weak: 0.8 },
  phase: { ms: [80, 40, 120], strong: 0.9, weak: 0.6 },
  domain: { ms: [60, 40, 60, 40, 160], strong: 0.8, weak: 0.8 },
  death: { ms: 300, strong: 1, weak: 1 },
};

let last = 0;
export function haptic(kind: Kind) {
  if (!enabled) return;
  const now = performance.now();
  // a flurry of blows is one buzz, not a stutter
  if (now - last < 70 && kind !== 'blackFlash' && kind !== 'phase') return;
  last = now;
  const p = PATTERN[kind];
  try { navigator.vibrate?.(p.ms); } catch { /* not allowed */ }
  try {
    const dur = Array.isArray(p.ms) ? p.ms.reduce((a, b) => a + b, 0) : p.ms;
    for (const pad of navigator.getGamepads?.() ?? []) {
      const act = (pad as unknown as { vibrationActuator?: { playEffect?: (t: string, o: object) => Promise<unknown> } } | null)?.vibrationActuator;
      void act?.playEffect?.('dual-rumble', { duration: dur, strongMagnitude: p.strong, weakMagnitude: p.weak })?.catch?.(() => {});
    }
  } catch { /* no controller rumble */ }
}
