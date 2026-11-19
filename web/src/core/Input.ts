// Unified input: keyboard for desktop testing, virtual joystick + buttons on touch screens.

export type Action = 'attack' | 'skill1' | 'skill2' | 'skill3' | 'skill4' | 'skill5' | 'skill6' | 'potion1' | 'potion2' | 'ultimate' | 'interact' | 'menu' | 'inventory' | 'skills' | 'quests' | 'map' | 'dash';

export class Input {
  moveX = 0;
  moveZ = 0;
  private held = new Set<Action>();
  private pressedQ = new Set<Action>();
  private keys = new Set<string>();
  joyActive = false;
  joyId: number | null = null;
  joyOrigin = { x: 0, y: 0 };
  joyPos = { x: 0, y: 0 };
  joyRadius = 60;
  enabled = true;
  /** element (left half) that hosts the dynamic joystick */
  private joyBase: HTMLElement | null = null;
  private joyKnob: HTMLElement | null = null;
  usingTouch = false;
  /** the HUD's zoom (tablet UI scale): touch positions are divided by it to land under the finger */
  uiZoom = 1;
  /** a controller is connected and has been used */
  usingPad = false;
  private padPrev: boolean[] = [];
  private padHeld = new Set<Action>();

  private keymap: Record<string, Action> = {
    KeyJ: 'attack', Space: 'attack', Digit1: 'skill1', Digit2: 'skill2', Digit3: 'skill3', Digit4: 'skill4', Digit5: 'skill5', Digit6: 'skill6',
    KeyQ: 'potion1', KeyE: 'potion2', KeyR: 'ultimate', KeyF: 'interact', Enter: 'interact', Escape: 'menu', KeyI: 'inventory',
    KeyK: 'skills', KeyL: 'quests', KeyM: 'map', ShiftLeft: 'dash', ShiftRight: 'dash',
  };

  constructor() {
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      this.keys.add(e.code);
      const a = this.keymap[e.code];
      if (a) {
        // Keys pressed while dialogue/menus own the input must not fire once play resumes.
        if (this.enabled && !this.held.has(a)) this.pressedQ.add(a);
        this.held.add(a);
        if (e.code === 'Space') e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      const a = this.keymap[e.code];
      if (a) this.held.delete(a);
    });
    window.addEventListener('blur', () => { this.keys.clear(); this.held.clear(); });
  }

  /** Attach the touch joystick to a zone element. */
  bindJoystick(zone: HTMLElement, base: HTMLElement, knob: HTMLElement) {
    this.joyBase = base;
    this.joyKnob = knob;
    const start = (id: number, x0: number, y0: number) => {
      const x = x0 / this.uiZoom, y = y0 / this.uiZoom;
      this.joyActive = true;
      this.joyId = id;
      this.joyOrigin = { x, y };
      this.joyPos = { x, y };
      base.style.display = 'block';
      base.style.left = x + 'px';
      base.style.top = y + 'px';
      knob.style.transform = 'translate(-50%, -50%)';
    };
    const move = (x0: number, y0: number) => {
      const x = x0 / this.uiZoom, y = y0 / this.uiZoom;
      this.joyPos = { x, y };
      let dx = x - this.joyOrigin.x, dy = y - this.joyOrigin.y;
      const d = Math.hypot(dx, dy);
      const r = this.joyRadius;
      if (d > r) {
        // drag the base along so the stick never feels stuck
        this.joyOrigin.x = x - (dx / d) * r;
        this.joyOrigin.y = y - (dy / d) * r;
        base.style.left = this.joyOrigin.x + 'px';
        base.style.top = this.joyOrigin.y + 'px';
        dx = (dx / d) * r; dy = (dy / d) * r;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };
    const end = () => {
      this.joyActive = false;
      this.joyId = null;
      base.style.display = 'none';
    };
    zone.addEventListener('touchstart', (e) => {
      this.usingTouch = true;
      if (this.joyId !== null) return;
      const t = e.changedTouches[0];
      start(t.identifier, t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      for (const t of Array.from(e.changedTouches)) if (t.identifier === this.joyId) move(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    const endH = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) if (t.identifier === this.joyId) end();
    };
    zone.addEventListener('touchend', endH);
    zone.addEventListener('touchcancel', endH);
    // mouse fallback for desktop browsers
    let mouseDown = false;
    zone.addEventListener('mousedown', (e) => { mouseDown = true; start(-1, e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => { if (mouseDown) move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => { if (mouseDown) { mouseDown = false; end(); } });
  }

  /** Bind an on-screen button to an action (supports multi-touch + hold). */
  bindButton(elm: HTMLElement, a: Action) {
    const down = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.enabled) return;
      if (!this.held.has(a)) this.pressedQ.add(a);
      this.held.add(a);
      elm.classList.add('down');
    };
    const up = (e: Event) => {
      e.preventDefault();
      this.held.delete(a);
      elm.classList.remove('down');
    };
    elm.addEventListener('touchstart', (e) => { this.usingTouch = true; down(e); }, { passive: false });
    elm.addEventListener('touchend', up, { passive: false });
    elm.addEventListener('touchcancel', up, { passive: false });
    elm.addEventListener('mousedown', down);
    elm.addEventListener('mouseup', up);
    elm.addEventListener('mouseleave', (e) => { if (this.held.has(a)) up(e); });
  }

  update() {
    let x = 0, z = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.joyActive) {
      const dx = this.joyPos.x - this.joyOrigin.x, dy = this.joyPos.y - this.joyOrigin.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) { x = dx / this.joyRadius; z = dy / this.joyRadius; }
    }
    const pad = this.pollPads();
    if (pad && Math.hypot(pad.x, pad.z) > Math.hypot(x, z)) { x = pad.x; z = pad.z; }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    if (!this.enabled) { x = 0; z = 0; }
    this.moveX = x;
    this.moveZ = z;
  }

  /** True once per press. */
  pressed(a: Action) {
    if (this.pressedQ.has(a)) { this.pressedQ.delete(a); return this.enabled; }
    return false;
  }
  isHeld(a: Action) { return this.enabled && this.held.has(a); }
  clearPressed() { this.pressedQ.clear(); }
  releaseAll() {
    this.held.clear();
    this.pressedQ.clear();
    this.joyActive = false;
    this.joyId = null;
    if (this.joyBase) this.joyBase.style.display = 'none';
    void this.joyKnob;
  }
  /**
   * Game controllers (standard layout, as Android, iPhone/iPad and desktop browsers report Xbox, PlayStation
   * and Switch Pro pads): left stick or d-pad moves, A attacks, B dodges, X/Y/LB/RB/LT are the five skills, RT
   * the ultimate, L3/R3 the potions (A also talks next to someone), Start opens the menu and Select the map. While a
   * conversation or menu has the controls, A advances (Space) and B goes back (Escape).
   */
  private pollPads(): { x: number; z: number } | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads ?? []).find(p => p && p.connected);
    if (!pad) return null;
    const MAP: (Action | null)[] = ['attack', 'dash', 'skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'ultimate', 'map', 'menu', 'potion1', 'potion2', null, null, null, null];
    const now: boolean[] = pad.buttons.map(b => b.pressed || b.value > 0.5);
    for (let i = 0; i < now.length; i++) {
      const down = now[i], was = !!this.padPrev[i];
      if (down === was) continue;
      this.usingPad = true;
      const a = MAP[i] ?? null;
      if (down) {
        if (this.enabled) {
          if (a) { if (!this.held.has(a)) this.pressedQ.add(a); this.held.add(a); this.padHeld.add(a); }
        } else if (i === 0 || i === 1 || i === 9) {
          // conversations, cutscenes and menus listen for keys
          const code = i === 0 ? 'Space' : 'Escape';
          window.dispatchEvent(new KeyboardEvent('keydown', { code, key: i === 0 ? ' ' : 'Escape' }));
          window.dispatchEvent(new KeyboardEvent('keyup', { code, key: i === 0 ? ' ' : 'Escape' }));
        }
      } else if (a && this.padHeld.has(a)) { this.padHeld.delete(a); this.held.delete(a); }
    }
    this.padPrev = now;
    const dz = (v: number) => (Math.abs(v) < 0.22 ? 0 : (v - Math.sign(v) * 0.22) / 0.78);
    let x = dz(pad.axes[0] ?? 0), z = dz(pad.axes[1] ?? 0);
    if (now[14]) x = -1; if (now[15]) x = 1; if (now[12]) z = -1; if (now[13]) z = 1;
    if (x || z) this.usingPad = true;
    return { x, z };
  }

  /** Simulate an action press (used by automated tests and UI shortcuts). */
  tap(a: Action) { this.pressedQ.add(a); }
}
