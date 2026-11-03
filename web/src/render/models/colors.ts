// Colour helpers shared by every model builder.
import * as THREE from 'three';

export function darken(hex: number, f: number) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return c.getHex();
}

export function lighten(hex: number, f: number) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * f + 0.02); c.g = Math.min(1, c.g * f + 0.02); c.b = Math.min(1, c.b * f + 0.02);
  return c.getHex();
}

/** Mix two colours: t = 0 gives `a`, 1 gives `b`. */
export function mix(a: number, b: number, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
}
