// Keyboard, mouse (pointer lock) and touch input aggregated into one state.
export class Input {
  keys = new Set<string>();
  pressed = new Set<string>(); // edge-triggered this frame
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  locked = false;
  mouseDown = false;
  mouseClicked = false;
  mouseReleased = false;
  // touch / virtual joystick
  joy = { x: 0, y: 0 };
  touchRun = false;
  touchSprint = false;
  enabled = true;
  private el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('pointerlockchange', this.onLockChange);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.el.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.el.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  private isTyping(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
  }
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isTyping(e)) return;
    const k = e.code;
    if (!this.keys.has(k)) this.pressed.add(k);
    this.keys.add(k);
    if (k === 'Space' || k.startsWith('Arrow')) e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private onBlur = () => {
    this.keys.clear();
    this.mouseDown = false;
  };
  private onMouseDown = (e: MouseEvent) => {
    if (!this.enabled) return;
    if (e.button !== 0) return;
    if (!this.locked && matchMedia('(pointer: fine)').matches) {
      try {
        const r = this.el.requestPointerLock() as unknown as Promise<void> | undefined;
        r?.catch?.(() => undefined);
      } catch {
        /* ignore */
      }
      return;
    }
    this.mouseDown = true;
    this.mouseClicked = true;
  };
  private onMouseUp = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (this.mouseDown) this.mouseReleased = true;
    this.mouseDown = false;
  };
  private onMouseMove = (e: MouseEvent) => {
    if (!this.locked) return;
    this.mouseDX += e.movementX;
    this.mouseDY += e.movementY;
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.wheel += Math.sign(e.deltaY);
  };
  private onLockChange = () => {
    this.locked = document.pointerLockElement === this.el;
  };

  /** add camera look delta (from touch) */
  look(dx: number, dy: number) {
    this.mouseDX += dx;
    this.mouseDY += dy;
  }
  press(code: string) {
    this.pressed.add(code);
  }
  hold(code: string, down: boolean) {
    if (down) {
      if (!this.keys.has(code)) this.pressed.add(code);
      this.keys.add(code);
    } else this.keys.delete(code);
  }

  down(...codes: string[]) {
    return this.enabled && codes.some((c) => this.keys.has(c));
  }
  hit(...codes: string[]) {
    return this.enabled && codes.some((c) => this.pressed.has(c));
  }

  axis() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    x += this.joy.x;
    y += this.joy.y;
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.mouseClicked = false;
    this.mouseReleased = false;
  }
}
