// Procedural articulated humanoid with realistic proportions (≈1.62 m) and
// procedural animation (idle, walk, run, jump, kick, cycling, sitting).
import * as THREE from 'three';

export interface Look {
  shirt: string;
  shorts: string;
  shoes: string;
  skin: string;
  hair: string;
  longPants?: boolean;
  number?: string;
  name?: string;
  accessory?: string;
  hairStyle?: 'short' | 'fade' | 'long' | 'bun';
  height?: number;
}

export type Pose = 'ground' | 'bike' | 'car' | 'sit';

const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 14);

function backPrint(name: string, num: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = color;
  g.textAlign = 'center';
  g.font = '800 46px Inter, Arial, sans-serif';
  g.fillText(name, 128, 62);
  g.font = '900 150px Inter, Arial, sans-serif';
  g.fillText(num, 128, 200);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function contrast(hex: string) {
  const c = new THREE.Color(hex);
  return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.55 ? '#16181c' : '#ffffff';
}

export class Humanoid {
  root = new THREE.Group();
  hips = new THREE.Group();
  spine = new THREE.Group();
  head = new THREE.Group();
  armL = new THREE.Group();
  armR = new THREE.Group();
  elbowL = new THREE.Group();
  elbowR = new THREE.Group();
  legL = new THREE.Group();
  legR = new THREE.Group();
  kneeL = new THREE.Group();
  kneeR = new THREE.Group();
  mats: Record<string, THREE.MeshStandardMaterial> = {};
  private printMesh?: THREE.Mesh;
  private frontMesh?: THREE.Mesh;
  private accessoryGroup = new THREE.Group();
  phase = Math.random() * 10;
  kickT = 0;
  look: Look;
  /** hip height of the rig (adult athletic proportions, ~1.75 m total) */
  hipY = 0.93;

  constructor(look: Look) {
    this.look = look;
    const m = (color: string, rough = 0.75) => new THREE.MeshStandardMaterial({ color, roughness: rough });
    const skin = new THREE.Color(look.skin);
    this.mats = {
      skin: m(look.skin, 0.55),
      skinDark: m('#' + skin.clone().multiplyScalar(0.78).getHexString(), 0.6),
      shirt: m(look.shirt, 0.82),
      trim: m(contrast(look.shirt) === '#ffffff' ? '#f2f2f2' : '#16181c', 0.7),
      shorts: m(look.shorts, 0.85),
      shoes: m(look.shoes, 0.45),
      hair: m(look.hair, 0.95),
      lower: m(look.longPants ? look.shorts : look.skin, 0.6),
      sole: m('#1c1c1c', 0.9),
      eyeW: m('#f4f1ec', 0.3),
      eye: m('#2a1a10', 0.2),
      sock: m('#f2f2f2', 0.9),
      accent: m('#ff6a00', 0.6),
    };
    const sc = 1 + ((look.height ?? 1) - 1) * 0.6;
    this.root.scale.setScalar(sc);
    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
      const me = new THREE.Mesh(geo, mat);
      me.castShadow = cast;
      return me;
    };
    const H = this.hipY;

    // ---------------- pelvis ----------------
    this.hips.position.y = H;
    this.root.add(this.hips);
    const pelvis = mesh(capsule(0.125, 0.13), this.mats.shorts);
    pelvis.rotation.z = Math.PI / 2;
    pelvis.scale.set(1, 1, 0.78);
    pelvis.position.y = 0.02;
    this.hips.add(pelvis);
    if (!look.longPants) {
      const band = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.035, 20), this.mats.shorts);
      band.scale.set(1.05, 1, 0.8);
      band.position.y = 0.1;
      this.hips.add(band);
    }

    // ---------------- torso (V shape) ----------------
    this.hips.add(this.spine);
    const waist = mesh(capsule(0.125, 0.14), this.mats.shirt);
    waist.position.y = 0.15;
    waist.scale.set(1.08, 1, 0.64);
    this.spine.add(waist);
    const chest = mesh(capsule(0.165, 0.2), this.mats.shirt);
    chest.position.set(0, 0.34, -0.005);
    chest.scale.set(1.2, 1.0, 0.62);
    this.spine.add(chest);
    const shoulders = mesh(capsule(0.064, 0.25), this.mats.shirt);
    shoulders.rotation.z = Math.PI / 2;
    shoulders.position.y = 0.47;
    shoulders.scale.set(1, 1, 0.85);
    this.spine.add(shoulders);
    // traps
    const traps = mesh(new THREE.SphereGeometry(0.1, 14, 10), this.mats.shirt);
    traps.scale.set(1.3, 0.45, 0.7);
    traps.position.set(0, 0.52, -0.01);
    this.spine.add(traps);
    // collar
    const collar = mesh(new THREE.TorusGeometry(0.056, 0.009, 6, 24), this.mats.trim);
    collar.rotation.x = Math.PI / 2 - 0.25;
    collar.position.set(0, 0.555, 0.005);
    this.spine.add(collar);
    // neck
    const neck = mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.13, 14), this.mats.skin);
    neck.position.y = 0.58;
    this.spine.add(neck);

    // ---------------- head ----------------
    this.head.position.y = 0.62;
    this.head.scale.setScalar(1.08);
    this.spine.add(this.head);
    // One smooth sculpted head with a hand-painted face texture
    const head = new THREE.Mesh(headGeometry(), new THREE.MeshStandardMaterial({ map: faceTexture(look, !!look.number), roughness: 0.62 }));
    head.position.y = 0.1;
    head.castShadow = true;
    this.head.add(head);
    for (const side of [-1, 1]) {
      const ear = mesh(new THREE.SphereGeometry(0.021, 12, 10), this.mats.skin);
      ear.scale.set(0.4, 1.0, 0.68);
      ear.position.set(0.084 * side, 0.095, -0.008);
      this.head.add(ear);
    }
    this.buildHair(look.hairStyle ?? 'fade');
    this.head.add(this.accessoryGroup);

    // ---------------- arms ----------------
    for (const [arm, elbow, side] of [
      [this.armL, this.elbowL, 1],
      [this.armR, this.elbowR, -1],
    ] as const) {
      arm.position.set(0.225 * side, 0.46, 0);
      this.spine.add(arm);

      const sleeve = mesh(capsule(0.058, 0.1), this.mats.shirt);
      sleeve.position.y = -0.08;
      arm.add(sleeve);
      const cuff = mesh(new THREE.TorusGeometry(0.057, 0.009, 6, 16), this.mats.trim, false);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.15;
      arm.add(cuff);
      const upper = mesh(capsule(0.046, 0.19), this.mats.skin);
      upper.position.y = -0.17;
      arm.add(upper);
      elbow.position.y = -0.3;
      arm.add(elbow);
      const fore = mesh(capsule(0.041, 0.18), this.mats.skin);
      fore.position.y = -0.12;
      fore.scale.set(1, 1, 0.9);
      elbow.add(fore);
      const palm = mesh(new THREE.BoxGeometry(0.06, 0.09, 0.03, 2, 2, 2), this.mats.skin);
      rounded(palm.geometry as THREE.BoxGeometry, 0.013);
      palm.position.set(0, -0.285, 0);
      elbow.add(palm);
      const thumb = mesh(capsule(0.011, 0.035), this.mats.skin, false);
      thumb.position.set(-0.01 * side, -0.27, 0.025);
      thumb.rotation.x = 0.5;
      elbow.add(thumb);
      const fingers = mesh(capsule(0.016, 0.045), this.mats.skin, false);
      fingers.scale.set(1.7, 1, 0.9);
      fingers.position.set(0, -0.345, 0.004);
      elbow.add(fingers);
    }

    // ---------------- legs ----------------
    for (const [leg, knee, side] of [
      [this.legL, this.kneeL, 1],
      [this.legR, this.kneeR, -1],
    ] as const) {
      leg.position.set(0.095 * side, 0, 0);
      this.hips.add(leg);
      const shortLeg = mesh(capsule(0.09, 0.16), this.mats.shorts);
      shortLeg.position.y = -0.15;
      leg.add(shortLeg);
      if (!look.longPants) {
        const stripe = mesh(new THREE.BoxGeometry(0.008, 0.22, 0.04), this.mats.trim, false);
        stripe.position.set(0.09 * side, -0.14, 0);
        leg.add(stripe);
      }
      const thigh = mesh(capsule(0.066, 0.27), look.longPants ? this.mats.shorts : this.mats.skin);
      thigh.position.y = -0.24;
      leg.add(thigh);
      knee.position.y = -0.45;
      leg.add(knee);
      const shin = mesh(capsule(0.055, 0.29), this.mats.lower);
      shin.position.y = -0.19;
      knee.add(shin);
      const calf = mesh(new THREE.SphereGeometry(0.058, 10, 8), this.mats.lower);
      calf.scale.set(0.9, 1.5, 0.9);
      calf.position.set(0, -0.12, -0.018);
      knee.add(calf);
      if (!look.longPants) {
        const sock = mesh(new THREE.CylinderGeometry(0.054, 0.05, 0.13, 12), this.mats.sock);
        sock.position.y = -0.34;
        knee.add(sock);
        const band = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), this.mats.accent, false);
        band.position.y = -0.285;
        knee.add(band);
      }
      const shoe = mesh(new THREE.BoxGeometry(0.1, 0.075, 0.26, 2, 2, 3), this.mats.shoes);
      rounded(shoe.geometry as THREE.BoxGeometry, 0.035);
      shoe.position.set(0, -0.415, 0.045);
      knee.add(shoe);
      const swoosh = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.12), this.mats.accent);
      swoosh.position.set(0.051 * side, -0.41, 0.05);
      swoosh.rotation.x = 0.25;
      knee.add(swoosh);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.022, 0.27), this.mats.sole);
      sole.position.set(0, -0.455, 0.045);
      knee.add(sole);
    }

    if (look.number) {
      const print = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.28),
        new THREE.MeshStandardMaterial({ map: backPrint(look.name ?? '', look.number, contrast(look.shirt)), transparent: true, roughness: 0.8 }),
      );
      print.position.set(0, 0.34, -0.128);
      print.rotation.y = Math.PI;
      this.spine.add(print);
      this.printMesh = print;
      const front = new THREE.Mesh(
        new THREE.PlaneGeometry(0.09, 0.09),
        new THREE.MeshStandardMaterial({ map: backPrint('', look.number, contrast(look.shirt)), transparent: true, roughness: 0.8 }),
      );
      front.position.set(-0.08, 0.4, 0.127);
      this.spine.add(front);
      this.frontMesh = front;
    }
    this.setAccessory(look.accessory ?? 'none');
  }

  private hairGroup = new THREE.Group();
  buildHair(style: NonNullable<Look['hairStyle']>) {
    this.head.remove(this.hairGroup);
    this.hairGroup = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0) => {
      const me = new THREE.Mesh(geo, this.mats.hair);
      me.position.set(x, y, z);
      me.scale.set(sx, sy, sz);
      me.rotation.x = rx;
      me.castShadow = true;
      this.hairGroup.add(me);
      return me;
    };
    // short men's cut: a shell built from the head shape itself, trimmed at a
    // natural hairline (high on the forehead, lower at the nape)
    const shell = new THREE.Mesh(hairGeometry(style === 'fade' ? 1 : 0.6), this.mats.hair);
    shell.position.y = 0.1;
    shell.castShadow = true;
    this.hairGroup.add(shell);
    if (style === 'long') {
      add(capsule(0.09, 0.14), 0, 0.03, -0.05, 1.12, 1, 0.6);
      for (const s of [-1, 1]) add(capsule(0.03, 0.12), 0.085 * s, 0.05, 0.01, 1, 1, 1);
    }
    if (style === 'bun') add(new THREE.SphereGeometry(0.045, 10, 8), 0, 0.2, -0.07);
    this.head.add(this.hairGroup);
  }

  setAccessory(a: string) {
    this.accessoryGroup.clear();
    if (a === 'cap') {
      const mat = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.7 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.112, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
      cap.position.y = 0.115;
      cap.scale.set(0.95, 1, 1.02);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16, 1, false, -Math.PI / 2, Math.PI), mat);
      brim.position.set(0, 0.12, 0.08);
      brim.scale.set(1, 1, 0.9);
      const logo = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), new THREE.MeshStandardMaterial({ color: '#ff6a00' }));
      logo.position.set(0, 0.175, 0.098);
      logo.rotation.x = -0.4;
      this.accessoryGroup.add(cap, brim, logo);
    } else if (a === 'headband') {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.012, 6, 24), new THREE.MeshStandardMaterial({ color: '#ff6a00' }));
      band.rotation.x = Math.PI / 2 - 0.15;
      band.position.y = 0.15;
      band.scale.set(0.92, 1, 1);
      this.accessoryGroup.add(band);
    } else if (a === 'headphones') {
      const mat = new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.4 });
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 6, 20, Math.PI), mat);
      arc.position.y = 0.1;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.03, 12), mat);
      l.rotation.z = Math.PI / 2;
      l.position.set(0.1, 0.09, 0);
      const r = l.clone();
      r.position.x = -0.1;
      this.accessoryGroup.add(arc, l, r);
    } else if (a === 'sunglasses') {
      const mat = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.1, metalness: 0.6 });
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.024, 0.008), mat);
        lens.position.set(0.034 * s, 0.105, 0.097);
        this.accessoryGroup.add(lens);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.006), mat);
      bar.position.set(0, 0.112, 0.097);
      this.accessoryGroup.add(bar);
    }
  }

  setOutfit(o: { shirt: string; shorts: string; shoes: string; hair?: string; accessory?: string }) {
    this.mats.shirt.color.set(o.shirt);
    this.mats.trim.color.set(contrast(o.shirt) === '#ffffff' ? '#f2f2f2' : '#16181c');
    this.mats.shorts.color.set(o.shorts);
    this.mats.shoes.color.set(o.shoes);
    if (o.hair) this.mats.hair.color.set(o.hair);
    if (this.look.number) {
      for (const [mesh, name] of [
        [this.printMesh, this.look.name ?? ''],
        [this.frontMesh, ''],
      ] as const) {
        if (!mesh) continue;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
        mat.map = backPrint(name, this.look.number, contrast(o.shirt));
        mat.needsUpdate = true;
      }
    }
    if (o.accessory !== undefined) this.setAccessory(o.accessory);
  }

  // ---------------- shopping basket in the right hand ----------------
  holding = false;
  private basket?: THREE.Group;
  private basketInner?: THREE.Group;
  private basketCount = 0;
  holdBasket(on: boolean) {
    if (on && !this.basket) {
      const g = new THREE.Group();
      const plastic = new THREE.MeshStandardMaterial({ color: '#ff6a00', roughness: 0.55 });
      const dark = new THREE.MeshStandardMaterial({ color: '#c24f00', roughness: 0.6 });
      const W = 0.34;
      const D = 0.22;
      const H = 0.16;
      const wall = (w: number, h: number, d: number, x: number, y: number, z: number, mat = plastic) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        g.add(m);
      };
      wall(W, 0.012, D, 0, -H / 2, 0, dark);
      wall(W, H, 0.012, 0, 0, D / 2);
      wall(W, H, 0.012, 0, 0, -D / 2);
      wall(0.012, H, D, W / 2, 0, 0);
      wall(0.012, H, D, -W / 2, 0, 0);
      // rim and slots
      for (const z of [D / 2, -D / 2]) for (let i = -2; i <= 2; i++) wall(0.03, 0.05, 0.014, i * 0.065, 0.01, z, dark);
      // handle up to the hand
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.01, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.4 }));
      handle.position.y = H / 2;
      g.add(handle);
      this.basketInner = new THREE.Group();
      this.basketInner.position.y = -H / 2 + 0.01;
      g.add(this.basketInner);
      // hang it from the hand, along the body
      g.position.set(-0.07, -0.5, 0.03);
      g.rotation.y = Math.PI / 2;
      this.elbowR.add(g);
      this.basket = g;
      this.basketCount = 0;
    } else if (!on && this.basket) {
      this.elbowR.remove(this.basket);
      this.basket = undefined;
      this.basketInner = undefined;
      this.basketCount = 0;
    }
    this.holding = on;
  }
  /** put a small product model into the basket */
  addToBasket(color: string, shape: string) {
    if (!this.basketInner) return;
    const i = this.basketCount++;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const geo =
      shape === 'bottle'
        ? new THREE.CylinderGeometry(0.025, 0.025, 0.12, 10)
        : shape === 'round'
          ? new THREE.SphereGeometry(0.035, 10, 8)
          : shape === 'long'
            ? new THREE.CapsuleGeometry(0.02, 0.09, 4, 8)
            : new THREE.BoxGeometry(0.07, 0.08, 0.05);
    const m = new THREE.Mesh(geo, mat);
    const col = i % 4;
    const row = Math.floor(i / 4) % 2;
    const layer = Math.floor(i / 8);
    m.position.set(-0.12 + col * 0.08, 0.08 + layer * 0.06, -0.05 + row * 0.1);
    if (shape === 'long') m.rotation.z = Math.PI / 2;
    m.castShadow = true;
    this.basketInner.add(m);
  }
  clearBasket() {
    this.basketInner?.clear();
    this.basketCount = 0;
  }

  kick() {
    this.kickT = 0.35;
  }

  /** speed: horizontal m/s; airborne flag; pose */
  animate(dt: number, speed: number, airborne: boolean, pose: Pose = 'ground', pedal = 0) {
    const L = THREE.MathUtils.lerp;
    const k = 1 - Math.exp(-dt * 14);
    const set = (g: THREE.Object3D, x: number, z = 0, y = 0) => {
      g.rotation.x = L(g.rotation.x, x, k);
      g.rotation.z = L(g.rotation.z, z, k);
      g.rotation.y = L(g.rotation.y, y, k);
    };
    const H = this.hipY;
    if (pose === 'bike' || pose === 'car' || pose === 'sit') {
      this.phase += dt * pedal * 2.2;
      const p = this.phase;
      this.hips.position.y = L(this.hips.position.y, pose === 'bike' ? H + 0.07 : 0.52, k);
      set(this.spine, pose === 'bike' ? 0.5 : 0.05);
      set(this.head, pose === 'bike' ? -0.4 : 0);
      const armF = pose === 'bike' ? -1.15 : pose === 'car' ? -1.2 : -0.2;
      set(this.armL, armF, 0.12);
      set(this.armR, armF, -0.12);
      set(this.elbowL, pose === 'sit' ? -0.6 : -0.3);
      set(this.elbowR, pose === 'sit' ? -0.6 : -0.3);
      if (pose === 'bike') {
        set(this.legL, -1.15 + Math.sin(p) * 0.45);
        set(this.legR, -1.15 + Math.sin(p + Math.PI) * 0.45);
        set(this.kneeL, 1.35 + Math.cos(p) * 0.45);
        set(this.kneeR, 1.35 + Math.cos(p + Math.PI) * 0.45);
      } else {
        set(this.legL, -1.5, 0.05);
        set(this.legR, -1.5, -0.05);
        set(this.kneeL, 1.5);
        set(this.kneeR, 1.5);
      }
      return;
    }
    const run = Math.min(1.3, speed / 8);
    const moving = speed > 0.3;
    this.phase += dt * (moving ? 3.0 + Math.min(speed, 14) * 0.95 : 0);
    const p = this.phase;
    const amp = moving ? 0.38 + run * 0.5 : 0;
    const now = performance.now() * 0.001;
    const breathe = Math.sin(now * 1.7) * 0.012;
    const bob = moving ? Math.abs(Math.sin(p)) * 0.035 * (0.6 + run) - 0.025 * run : 0;
    this.hips.position.y = L(this.hips.position.y, H + bob, k);
    // weight shift and pelvis twist
    this.hips.rotation.y = L(this.hips.rotation.y, moving ? Math.sin(p) * 0.12 * (0.5 + run) : 0, k);
    this.hips.rotation.z = L(this.hips.rotation.z, moving ? Math.cos(p) * 0.04 : Math.sin(now * 0.4) * 0.015, k);

    if (airborne) {
      set(this.legL, -0.7);
      set(this.legR, 0.25);
      set(this.kneeL, 1.0);
      set(this.kneeR, 0.55);
      set(this.armL, -0.5, 0.45);
      set(this.armR, 0.35, -0.45);
      set(this.spine, 0.12);
      set(this.elbowL, -0.6);
      set(this.elbowR, -0.6);
      return;
    }
    // counter-rotate the chest against the pelvis, lean into the run
    set(this.spine, run * 0.22 + breathe, 0, moving ? -Math.sin(p) * 0.2 * (0.5 + run) : 0);
    set(this.head, -run * 0.15 + (moving ? 0 : Math.sin(now * 0.3) * 0.03), 0, moving ? Math.sin(p) * 0.08 : Math.sin(now * 0.23) * 0.12);
    set(this.legL, Math.sin(p) * amp, 0.02);
    set(this.legR, Math.sin(p + Math.PI) * amp, -0.02);
    set(this.kneeL, moving ? Math.max(0, -Math.cos(p)) * (0.5 + run * 1.1) + 0.06 : 0.04);
    set(this.kneeR, moving ? Math.max(0, -Math.cos(p + Math.PI)) * (0.5 + run * 1.1) + 0.06 : 0.04);
    set(this.armL, Math.sin(p + Math.PI) * amp * 0.85, 0.07);
    set(this.armR, Math.sin(p) * amp * 0.85, -0.07);
    set(this.elbowL, -0.2 - run * 1.0 - (moving ? 0 : 0.05));
    set(this.elbowR, -0.2 - run * 1.0 - (moving ? 0 : 0.05));
    if (this.holding) {
      // carry the basket: right arm hangs a little away from the body
      set(this.armR, Math.sin(p) * amp * 0.25 + 0.05, -0.22);
      set(this.elbowR, -0.1);
    }

    if (this.kickT > 0) {
      this.kickT -= dt;
      const t = 1 - this.kickT / 0.35;
      const swing = t < 0.35 ? THREE.MathUtils.lerp(0, 0.75, t / 0.35) : THREE.MathUtils.lerp(0.75, -1.35, Math.min(1, (t - 0.35) / 0.3));
      this.legR.rotation.x = swing;
      this.kneeR.rotation.x = t < 0.5 ? 1.05 : 0.15;
      this.armL.rotation.x = -0.6;
      this.armL.rotation.z = 0.6;
      this.armR.rotation.z = -0.7;
      this.spine.rotation.x = -0.12;
    }
  }
}


// ---------------------------------------------------------------- face
let headGeoCache: THREE.BufferGeometry | null = null;
/** Sculpted head: oval skull, tapered jaw, soft chin, small nose and brow ridge. */
function headGeometry() {
  if (headGeoCache) return headGeoCache;
  const g = new THREE.SphereGeometry(1, 96, 72);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const gauss = (dx: number, dy: number, sx: number, sy: number) => Math.exp(-((dx * dx) / (sx * sx) + (dy * dy) / (sy * sy)));
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let { x, y, z } = v;
    // jaw taper and rounded chin
    if (y < 0) {
      const t = Math.pow(-y, 1.6);
      x *= 1 - 0.28 * t;
      z *= 1 - 0.12 * t;
      if (z > 0) z += 0.06 * t * z;
    }
    // slightly flatter sides at the temples, fuller back of head
    if (y > -0.2 && y < 0.6) x *= 0.97;
    if (z < 0) z *= 1.04;
    if (z > 0) {
      // nose (bridge + tip), brow ridge, cheekbones, soft lips
      z += 0.12 * gauss(x, y + 0.12, 0.075, 0.17) + 0.05 * gauss(x, y + 0.26, 0.11, 0.07);
      z += 0.035 * gauss(x, y - 0.12, 0.45, 0.08);
      z -= 0.035 * (gauss(x - 0.33, y - 0.03, 0.14, 0.09) + gauss(x + 0.33, y - 0.03, 0.14, 0.09));
      z += 0.025 * (gauss(x - 0.45, y + 0.15, 0.15, 0.12) + gauss(x + 0.45, y + 0.15, 0.15, 0.12));
      z += 0.03 * gauss(x, y + 0.48, 0.16, 0.06);
    }
    pos.setXYZ(i, x * 0.086, y * 0.11, z * 0.096);
  }
  g.computeVertexNormals();
  headGeoCache = g;
  return g;
}

const hairCache = new Map<number, THREE.BufferGeometry>();
function hairGeometry(volume: number) {
  const hit = hairCache.get(volume);
  if (hit) return hit;
  const head = headGeometry();
  const g = head.clone();
  const pos = g.attributes.position as THREE.BufferAttribute;
  const keep: boolean[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const zn = v.z / 0.096;
    const xn = Math.abs(v.x) / 0.086;
    // hairline: forehead ~ +0.045, temples/sides ~ +0.01, nape ~ -0.06
    const line = zn > 0 ? 0.012 + 0.036 * zn - 0.02 * xn * zn : 0.012 + 0.07 * zn;
    keep.push(v.y > line);
    // push out to give the hair thickness, more on top
    const lift = v.y > 0 ? 1 + (0.03 + 0.05 * volume) * (v.y / 0.11) : 1;
    v.multiplyScalar(1.05);
    v.y *= lift;
    if (v.z > 0 && v.y > 0.05) v.z *= 1 + 0.04 * volume;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const idx = g.index!;
  const out: number[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    const b = idx.getX(i + 1);
    const c = idx.getX(i + 2);
    if (keep[a] && keep[b] && keep[c]) out.push(a, b, c);
  }
  g.setIndex(out);
  g.computeVertexNormals();
  hairCache.set(volume, g);
  return g;
}

const faceCache = new Map<string, THREE.CanvasTexture>();
const EYE_COLORS = ['#6b4423', '#4a3018', '#3d6b8a', '#5c6b3a', '#2a1a0e'];
/** Paint a natural-looking face onto the head's UV map (front = u 0.25). */
function faceTexture(look: Look, hd: boolean) {
  const eye = look.number ? '#6b4423' : EYE_COLORS[Math.abs(hashStr(look.skin + look.hair)) % EYE_COLORS.length];
  const key = look.skin + '|' + look.hair + '|' + eye + '|' + hd;
  const cached = faceCache.get(key);
  if (cached) return cached;
  const W = hd ? 1024 : 512;
  const k = W / 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W / 2;
  const g = c.getContext('2d')!;
  g.scale(k, k);
  const skin = new THREE.Color(look.skin);
  const css = (col: THREE.Color, a = 1) => {
    const o = { r: 0, g: 0, b: 0 };
    col.getRGB(o, THREE.SRGBColorSpace);
    return `rgba(${Math.round(o.r * 255)},${Math.round(o.g * 255)},${Math.round(o.b * 255)},${a})`;
  };
  const dark = skin.clone().multiplyScalar(0.72);
  g.fillStyle = css(skin);
  g.fillRect(0, 0, 1024, 512);
  const blob = (x: number, y: number, r: number, color: string, sy = 1) => {
    g.save();
    g.translate(x, y);
    g.scale(1, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  const X = 256; // face centre (front of the head)
  // soft modelling: temples, eye sockets, under the cheekbones, under the jaw
  for (const s of [-1, 1]) {
    blob(X + s * 52, 246, 34, css(dark, 0.16), 0.7);
    blob(X + s * 74, 300, 38, css(dark, 0.12), 1.2);
    blob(X + s * 66, 288, 30, 'rgba(225,120,110,0.16)');
  }
  blob(X, 352, 70, css(dark, 0.18), 0.35);
  blob(X, 205, 80, 'rgba(255,255,255,0.05)', 0.4);
  // nose: side shading, nostrils, tip highlight
  for (const s of [-1, 1]) {
    g.strokeStyle = css(dark, 0.25);
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(X + s * 9, 250);
    g.quadraticCurveTo(X + s * 13, 268, X + s * 15, 282);
    g.stroke();
    g.fillStyle = 'rgba(70,35,25,0.5)';
    g.beginPath();
    g.ellipse(X + s * 8, 289, 5, 2.6, s * 0.3, 0, Math.PI * 2);
    g.fill();
  }
  blob(X, 280, 9, 'rgba(255,255,255,0.18)');
  // eyes
  for (const s of [-1, 1]) {
    const ex = X + s * 50;
    const ey = 252;
    const w = 24;
    const h = 9.5;
    g.save();
    g.beginPath();
    g.moveTo(ex - w, ey);
    g.bezierCurveTo(ex - w * 0.5, ey - h * 1.5, ex + w * 0.55, ey - h * 1.4, ex + w, ey - 1);
    g.bezierCurveTo(ex + w * 0.5, ey + h * 1.1, ex - w * 0.5, ey + h * 1.15, ex - w, ey);
    g.closePath();
    g.fillStyle = '#f5f1ec';
    g.fill();
    g.clip();
    const ir = g.createRadialGradient(ex, ey - 1, 2, ex, ey - 1, 11);
    ir.addColorStop(0, eye);
    ir.addColorStop(0.75, eye);
    ir.addColorStop(1, '#1a120c');
    g.fillStyle = ir;
    g.beginPath();
    g.arc(ex, ey - 1, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0d0907';
    g.beginPath();
    g.arc(ex, ey - 1, 4.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(ex - w, ey - h * 1.6, w * 2, 6);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.arc(ex + 3.5, ey - 4.5, 2.4, 0, Math.PI * 2);
    g.fill();
    // upper lash line and crease, soft lower line
    g.strokeStyle = '#1d140e';
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(ex - w - 1, ey + 0.5);
    g.bezierCurveTo(ex - w * 0.5, ey - h * 1.55, ex + w * 0.55, ey - h * 1.45, ex + w + 2, ey - 2.5);
    g.stroke();
    g.strokeStyle = css(dark, 0.45);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ex - w * 0.8, ey - h * 1.5);
    g.quadraticCurveTo(ex, ey - h * 2.4, ex + w * 0.9, ey - h * 1.5);
    g.stroke();
    g.strokeStyle = css(dark, 0.35);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(ex - w * 0.8, ey + 3);
    g.quadraticCurveTo(ex, ey + h * 1.35, ex + w * 0.9, ey + 1);
    g.stroke();
    // eyebrow: tapered strokes
    const hair = new THREE.Color(look.hair);
    for (let i = 0; i < 7; i++) {
      g.strokeStyle = css(hair, 0.55);
      g.lineWidth = 6.5 - i * 0.7;
      g.beginPath();
      const ix = ex - s * 26;
      g.moveTo(ix, 226 + i * 0.6);
      g.quadraticCurveTo(ex + s * 4, 214 + i * 0.5, ex + s * 30 - s * i, 224 + i * 0.4);
      g.stroke();
    }
  }
  // lips
  const lip = skin.clone().lerp(new THREE.Color('#b4535a'), 0.42);
  const lipDark = lip.clone().multiplyScalar(0.7);
  const my = 309;
  g.fillStyle = css(lip);
  g.beginPath();
  g.moveTo(X - 23, my);
  g.bezierCurveTo(X - 14, my - 8, X - 6, my - 9, X, my - 5);
  g.bezierCurveTo(X + 6, my - 9, X + 14, my - 8, X + 23, my);
  g.bezierCurveTo(X + 12, my + 1, X - 12, my + 1, X - 23, my);
  g.fill();
  g.beginPath();
  g.moveTo(X - 21, my + 0.5);
  g.bezierCurveTo(X - 12, my + 13, X + 12, my + 13, X + 21, my + 0.5);
  g.fill();
  g.strokeStyle = css(lipDark);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(X - 23, my);
  g.bezierCurveTo(X - 10, my + 2.5, X + 10, my + 2.5, X + 23, my);
  g.stroke();
  blob(X, my + 7, 9, 'rgba(255,255,255,0.22)', 0.5);
  blob(X, my + 22, 16, css(dark, 0.25), 0.5);
  // philtrum
  g.strokeStyle = css(dark, 0.18);
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(X, 292);
  g.lineTo(X, my - 6);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  faceCache.set(key, t);
  return t;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Softly round a subdivided box geometry. */
function rounded(geo: THREE.BoxGeometry, r: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  const half = new THREE.Vector3().subVectors(b.max, b.min).multiplyScalar(0.5);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const inner = new THREE.Vector3(
      THREE.MathUtils.clamp(v.x, -half.x + r, half.x - r),
      THREE.MathUtils.clamp(v.y, -half.y + r, half.y - r),
      THREE.MathUtils.clamp(v.z, -half.z + r, half.z - r),
    );
    const d = v.clone().sub(inner);
    if (d.lengthSq() > 0) d.setLength(r);
    v.copy(inner.add(d));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
}

export const SKIN_TONES = ['#f1c7a5', '#e0ac85', '#c68863', '#a86c4a', '#7d4b30', '#f5d3b8'];
export const HAIR_COLORS = ['#1b120c', '#3a2416', '#6b4423', '#a87a3d', '#d6b16b', '#2a2a2a', '#8a8a8a'];
export const CLOTH_COLORS = ['#2f5fa7', '#c0392b', '#2e8b57', '#f4f4f4', '#16181c', '#7d3c98', '#e67e22', '#34495e', '#d4a017', '#1abc9c', '#b03a5b', '#5d6d7e'];
export function randomLook(rnd: () => number, extra: Partial<Look> = {}): Look {
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  return {
    shirt: pick(CLOTH_COLORS),
    shorts: pick(['#2c3e50', '#1b1b1b', '#5d4037', '#34495e', '#7f8c8d', '#283593', '#3e2723']),
    shoes: pick(['#f2f2f2', '#1b1b1b', '#8d6e63', '#c0392b']),
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_COLORS),
    longPants: rnd() > 0.35,
    hairStyle: pick(['short', 'fade', 'long', 'bun'] as const),
    height: 0.96 + rnd() * 0.12,
    ...extra,
  };
}
