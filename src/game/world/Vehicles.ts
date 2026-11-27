// Drivable vehicles: arcade handling with Rapier collision (kinematic body +
// character controller for sliding against the world).
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { GROUP, groups, type Physics } from './physics';

export type VehicleType = 'bike_city' | 'bike_mtb' | 'scooter' | 'car_compact' | 'car_sport' | 'taxi' | 'bus';

interface Spec {
  name: { es: string; hy: string };
  max: number; // m/s
  reverse: number;
  accel: number;
  brake: number;
  steer: number;
  size: [number, number, number]; // half extents
  pose: 'bike' | 'car';
  seat: [number, number, number];
  kind: 'bike' | 'car';
  color: string;
}

export const SPECS: Record<VehicleType, Spec> = {
  bike_city: { name: { es: 'bicicleta', hy: 'հեծանիվ' }, max: 9, reverse: 2, accel: 4, brake: 9, steer: 2.2, size: [0.3, 0.55, 0.9], pose: 'bike', seat: [0, 0.1, -0.15], kind: 'bike', color: '#ff6a00' },
  bike_mtb: { name: { es: 'bicicleta de montaña', hy: 'լեռնային հեծանիվ' }, max: 11, reverse: 2, accel: 5, brake: 10, steer: 2.4, size: [0.3, 0.55, 0.9], pose: 'bike', seat: [0, 0.12, -0.15], kind: 'bike', color: '#2b2e35' },
  scooter: { name: { es: 'patinete eléctrico', hy: 'էլեկտրական սքութեր' }, max: 8, reverse: 1.5, accel: 5, brake: 8, steer: 2.6, size: [0.25, 0.55, 0.6], pose: 'bike', seat: [0, -0.35, 0], kind: 'bike', color: '#16181c' },
  car_compact: { name: { es: 'coche', hy: 'մեքենա' }, max: 18, reverse: 5, accel: 6, brake: 14, steer: 1.6, size: [0.9, 0.7, 2.0], pose: 'car', seat: [-0.38, -0.25, 0.1], kind: 'car', color: '#2f5fa7' },
  car_sport: { name: { es: 'coche deportivo', hy: 'սպորտային մեքենա' }, max: 28, reverse: 6, accel: 11, brake: 18, steer: 1.8, size: [0.95, 0.6, 2.15], pose: 'car', seat: [-0.4, -0.33, 0.0], kind: 'car', color: '#ff6a00' },
  taxi: { name: { es: 'taxi', hy: 'տաքսի' }, max: 17, reverse: 5, accel: 6, brake: 14, steer: 1.6, size: [0.9, 0.75, 2.1], pose: 'car', seat: [-0.38, -0.25, 0.1], kind: 'car', color: '#f4f4f4' },
  bus: { name: { es: 'autobús', hy: 'ավտոբուս' }, max: 12, reverse: 3, accel: 3, brake: 8, steer: 1.0, size: [1.3, 1.6, 5.5], pose: 'car', seat: [-0.7, 0.1, 4.6], kind: 'car', color: '#ff6a00' },
};

const m = (c: string, r = 0.5, me = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: me });
const tire = m('#151515', 0.9);
const rim = m('#c9ced3', 0.3, 0.8);
const glass = new THREE.MeshStandardMaterial({ color: '#1d2b38', roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.85 });
const chrome = m('#d0d4d8', 0.2, 0.9);

// ---------------------------------------------------------------- realistic cars
const paintCache = new Map<string, THREE.MeshPhysicalMaterial>();
function carPaint(color: string) {
  let p = paintCache.get(color);
  if (!p) {
    p = new THREE.MeshPhysicalMaterial({ color, metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 });
    paintCache.set(color, p);
  }
  return p;
}
const carGlass = new THREE.MeshPhysicalMaterial({ color: '#2c3d4d', metalness: 0.6, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 });
const blackPlastic = new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.65 });
const archMat = new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.9, side: THREE.DoubleSide });
const headMat = new THREE.MeshStandardMaterial({ color: '#f4f6ff', emissive: '#fff6dc', emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.3 });
const tailMat = new THREE.MeshStandardMaterial({ color: '#8a0b10', emissive: '#ff1a1a', emissiveIntensity: 0.7, roughness: 0.2 });
const plateMat = new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.6 });
const tireMat = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.95 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#d8dce0', metalness: 0.95, roughness: 0.18 });
const discMat = new THREE.MeshStandardMaterial({ color: '#555a60', metalness: 0.8, roughness: 0.4 });

const geoCache = new Map<string, THREE.BufferGeometry>();
/** Extrude a side profile (z,y) across the car width (x). */
function extrudeProfile(key: string, build: (sh: THREE.Shape) => void, width: number, bevel: number) {
  const k = key + width.toFixed(2);
  const hit = geoCache.get(k);
  if (hit) return hit;
  const sh = new THREE.Shape();
  build(sh);
  const depth = Math.max(0.01, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.85, bevelSegments: 4, curveSegments: 18 });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  geoCache.set(k, g);
  return g;
}

function buildWheel(r: number, width: number) {
  const w = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r - 0.02, width, 28), tireMat);
  tire.rotation.z = Math.PI / 2;
  w.add(tire);
  for (const sx of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.TorusGeometry(r - 0.045, 0.045, 8, 28), tireMat);
    edge.rotation.y = Math.PI / 2;
    edge.position.x = (sx * width) / 2 - sx * 0.03;
    w.add(edge);
  }
  const rimR = r * 0.62;
  const rimFace = new THREE.Mesh(new THREE.CylinderGeometry(rimR, rimR, width * 0.9, 24), discMat);
  rimFace.rotation.z = Math.PI / 2;
  w.add(rimFace);
  for (const sx of [-1, 1]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.014, 6, 24), rimMat);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = (sx * width) / 2 * 0.92;
    w.add(lip);
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, rimR * 1.9, 0.045), rimMat);
      spoke.rotation.x = (i / 5) * Math.PI;
      spoke.position.x = (sx * width) / 2 * 0.95;
      w.add(spoke);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), rimMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = (sx * width) / 2 * 0.97;
    w.add(cap);
  }
  return w;
}

function buildCar(type: VehicleType, color: string, root: THREE.Group, wheels: THREE.Object3D[], steer: THREE.Object3D[]) {
  const spec = SPECS[type];
  const [hx, , hz] = spec.size;
  const W = hx * 2;
  const L = hz * 2;
  const r = L / 2;
  const sport = type === 'car_sport';
  const belt = sport ? 0.76 : 0.9;
  const roof = sport ? 1.1 : 1.32;
  const wr = sport ? 0.35 : 0.33;
  const zf = r - 0.62;
  const zr = -r + 0.62;
  const arch = wr + 0.08;
  const paint = carPaint(color);

  // lower body with wheel arches cut out
  const body = new THREE.Mesh(
    extrudeProfile(
      'body_' + type,
      (sh) => {
        sh.moveTo(-r + 0.12, 0.2);
        sh.lineTo(-r, 0.38);
        sh.quadraticCurveTo(-r - 0.04, belt - 0.1, -r + 0.1, belt - 0.02);
        sh.lineTo(-r + 0.55, belt + (sport ? 0.04 : 0));
        sh.lineTo(r - (sport ? 1.35 : 1.15), belt);
        sh.quadraticCurveTo(r - 0.6, belt - 0.04, r - 0.2, belt - (sport ? 0.2 : 0.14));
        sh.quadraticCurveTo(r + 0.03, belt - 0.24, r, 0.42);
        sh.lineTo(r - 0.1, 0.2);
        sh.lineTo(zf + arch, 0.2);
        sh.absarc(zf, wr, arch, -0.15, Math.PI + 0.15, false);
        sh.lineTo(zr + arch, 0.2);
        sh.absarc(zr, wr, arch, -0.15, Math.PI + 0.15, false);
        sh.lineTo(-r + 0.12, 0.2);
      },
      W,
      0.07,
    ),
    paint,
  );
  root.add(body);
  // greenhouse (glass) and roof
  const rearBase = -r + (sport ? 0.75 : 0.55);
  const frontBase = r - (sport ? 1.35 : 1.15);
  const glass = new THREE.Mesh(
    extrudeProfile(
      'glass_' + type,
      (sh) => {
        sh.moveTo(rearBase, belt - 0.02);
        sh.quadraticCurveTo(rearBase + 0.35, roof - 0.05, sport ? -0.25 : -0.4, roof);
        sh.lineTo(sport ? 0.2 : 0.35, roof);
        sh.quadraticCurveTo(frontBase - 0.15, roof - 0.08, frontBase, belt - 0.02);
        sh.lineTo(rearBase, belt - 0.02);
      },
      W - 0.3,
      0.05,
    ),
    carGlass,
  );
  root.add(glass);
  const roofPanel = new THREE.Mesh(
    extrudeProfile(
      'roof_' + type,
      (sh) => {
        const a0 = sport ? -0.22 : -0.38;
        const a1 = sport ? 0.17 : 0.32;
        sh.moveTo(a0, roof - 0.02);
        sh.lineTo(a1, roof - 0.02);
        sh.quadraticCurveTo(a1 + 0.06, roof + 0.03, a1, roof + 0.035);
        sh.lineTo(a0, roof + 0.035);
        sh.quadraticCurveTo(a0 - 0.06, roof + 0.03, a0, roof - 0.02);
      },
      W - 0.3,
      0.04,
    ),
    paint,
  );
  root.add(roofPanel);
  // B pillars, door lines, handles, mirrors
  for (const sx of [-1, 1]) {
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.03, roof - belt - 0.05, 0.08), blackPlastic);
    bp.position.set(sx * (W / 2 - 0.16), (roof + belt) / 2, sport ? 0 : -0.05);
    bp.rotation.z = sx * -0.12;
    root.add(bp);
    for (const dz of sport ? [0.15] : [-0.05, 0.95]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.004, belt - 0.32, 0.01), blackPlastic);
      line.position.set(sx * (W / 2 + 0.002), (belt + 0.3) / 2, dz - (sport ? 0 : 0.9) + (sport ? 0 : 0.85));
      root.add(line);
    }
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.13), rimMat);
    handle.position.set(sx * (W / 2 + 0.01), belt - 0.12, sport ? -0.1 : 0.15);
    root.add(handle);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.08), paint);
    mirror.position.set(sx * (W / 2 + 0.06), belt + 0.08, frontBase - 0.12);
    root.add(mirror);
    // headlights / tail lights
    const hl = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 10), headMat);
    hl.rotation.z = Math.PI / 2;
    hl.scale.set(1, 1, 0.6);
    hl.position.set(sx * (W / 2 - 0.27), belt - (sport ? 0.24 : 0.2), r - 0.03);
    root.add(hl);
    const tl = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, sport ? 0.35 : 0.24, 4, 10), tailMat);
    tl.rotation.z = Math.PI / 2;
    tl.scale.set(1, 1, 0.5);
    tl.position.set(sx * (W / 2 - 0.25), belt - 0.12, -r - 0.01);
    root.add(tl);
    // dark wheel-well liners
    for (const z of [zf, zr]) {
      const liner = new THREE.Mesh(new THREE.CylinderGeometry(arch - 0.01, arch - 0.01, 0.26, 20, 1, true, 0, Math.PI), archMat);
      liner.rotation.set(0, 0, Math.PI / 2);
      liner.rotation.x = -Math.PI / 2;
      liner.position.set(sx * (W / 2 - 0.2), wr, z);
      root.add(liner);
    }
  }
  // grille, bumpers, plates
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42, sport ? 0.1 : 0.13, 0.05), blackPlastic);
  grille.position.set(0, sport ? 0.4 : 0.48, r + 0.01);
  root.add(grille);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42, 0.015, 0.06), rimMat);
  bar.position.set(0, sport ? 0.44 : 0.53, r + 0.02);
  root.add(bar);
  for (const z of [r - 0.02, -r + 0.02]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(W - 0.05, 0.12, 0.14), blackPlastic);
    bumper.position.set(0, 0.27, z);
    root.add(bumper);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.02), plateMat);
    plate.position.set(0, z > 0 ? 0.33 : 0.5, z + Math.sign(z) * 0.08);
    root.add(plate);
  }
  if (sport) {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.04, 0.26), blackPlastic);
    spoiler.position.set(0, belt + 0.2, -r + 0.18);
    root.add(spoiler);
    for (const sx of [-0.55, 0.55]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), blackPlastic);
      leg.position.set(sx, belt + 0.1, -r + 0.2);
      root.add(leg);
    }
    for (const sx of [-1, 1]) {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.4), blackPlastic);
      intake.position.set(sx * (W / 2 + 0.005), 0.5, -0.4);
      root.add(intake);
    }
  }
  if (type === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.22), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#22dd55', emissiveIntensity: 0.8 }));
    sign.position.set(0, roof + 0.11, 0);
    root.add(sign);
    for (const sx of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, L * 0.62), new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.4 }));
      stripe.position.set(sx * (W / 2 + 0.004), belt - 0.2, 0.05);
      root.add(stripe);
    }
  }
  // wheels
  for (const [x, z, front] of [
    [W / 2 - 0.14, zf, true],
    [-W / 2 + 0.14, zf, true],
    [W / 2 - 0.14, zr, false],
    [-W / 2 + 0.14, zr, false],
  ] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(x, wr, z);
    const w = buildWheel(wr, 0.24);
    pivot.add(w);
    root.add(pivot);
    wheels.push(w);
    if (front) steer.push(pivot);
  }
}

function buildBus(root: THREE.Group, wheels: THREE.Object3D[], steer: THREE.Object3D[], color: string) {
  const [hx, hy, hz] = SPECS.bus.size;
  const W = hx * 2;
  const paint = carPaint(color);
  const body = new THREE.Mesh(
    extrudeProfile(
      'bus',
      (sh) => {
        sh.moveTo(-hz, 0.35);
        sh.lineTo(-hz, hy * 2 + 0.1);
        sh.quadraticCurveTo(-hz, hy * 2 + 0.35, -hz + 0.3, hy * 2 + 0.35);
        sh.lineTo(hz - 0.4, hy * 2 + 0.35);
        sh.quadraticCurveTo(hz, hy * 2 + 0.3, hz, hy * 2 - 0.1);
        sh.lineTo(hz, 0.35);
        sh.lineTo(-hz, 0.35);
      },
      W,
      0.08,
    ),
    paint,
  );
  root.add(body);
  for (const sx of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.9, hz * 1.8), carGlass);
    band.position.set(sx * (W / 2 + 0.005), hy * 2 - 0.35, -0.1);
    root.add(band);
  }
  const wind = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 1.2, 0.03), carGlass);
  wind.position.set(0, hy * 2 - 0.3, hz + 0.005);
  root.add(wind);
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.03), headMat);
    hl.position.set(sx * (W / 2 - 0.3), 0.7, hz + 0.01);
    root.add(hl);
  }
  const wr = 0.52;
  for (const [x, z, front] of [
    [W / 2 - 0.15, hz - 1.3, true],
    [-W / 2 + 0.15, hz - 1.3, true],
    [W / 2 - 0.15, -hz + 1.4, false],
    [-W / 2 + 0.15, -hz + 1.4, false],
  ] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(x, wr, z);
    const w = buildWheel(wr, 0.3);
    pivot.add(w);
    root.add(pivot);
    wheels.push(w);
    if (front) steer.push(pivot);
  }
}

export function buildVehicleMesh(type: VehicleType, color?: string): { root: THREE.Group; wheels: THREE.Object3D[]; steerWheels: THREE.Object3D[] } {
  const s = SPECS[type];
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const steerWheels: THREE.Object3D[] = [];
  const paint = m(color ?? s.color, 0.35, 0.4);
  if (s.kind === 'car') {
    if (type === 'bus') buildBus(root, wheels, steerWheels, color ?? s.color);
    else buildCar(type, color ?? (type === 'taxi' ? '#f4f4f4' : s.color), root, wheels, steerWheels);
  } else {
    // two-wheeler
    const frameMat = paint;
    const wr = type === 'scooter' ? 0.12 : 0.34;
    for (const z of [0.55, -0.55]) {
      const pivot = new THREE.Group();
      pivot.position.set(0, wr, z * (type === 'scooter' ? 0.75 : 1));
      const w = new THREE.Group();
      const t = new THREE.Mesh(new THREE.TorusGeometry(wr, type === 'bike_mtb' ? 0.05 : 0.03, 8, 24), tire);
      t.rotation.y = Math.PI / 2;
      w.add(t);
      if (type !== 'scooter')
        for (let i = 0; i < 6; i++) {
          const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, wr * 2), rim);
          sp.rotation.x = (i / 6) * Math.PI;
          w.add(sp);
        }
      pivot.add(w);
      root.add(pivot);
      wheels.push(w);
      if (z > 0) steerWheels.push(pivot);
    }
    const tube = (a: THREE.Vector3, b: THREE.Vector3, r = 0.025, mat: THREE.Material = frameMat) => {
      const len = a.distanceTo(b);
      const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
      me.position.copy(a).add(b).multiplyScalar(0.5);
      me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      root.add(me);
      return me;
    };
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    if (type === 'scooter') {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.85), frameMat);
      deck.position.y = 0.17;
      root.add(deck);
      tube(V(0, 0.15, 0.42), V(0, 1.05, 0.5), 0.025);
      tube(V(-0.25, 1.05, 0.5), V(0.25, 1.05, 0.5), 0.02, m('#222'));
      const acc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.4), m('#ff6a00'));
      acc.position.set(0, 0.2, 0);
      root.add(acc);
    } else {
      tube(V(0, 0.34, -0.55), V(0, 0.5, 0.0));
      tube(V(0, 0.5, 0), V(0, 0.95, -0.12));
      tube(V(0, 0.95, -0.12), V(0, 0.95, 0.42));
      tube(V(0, 0.5, 0), V(0, 0.95, 0.42));
      tube(V(0, 0.34, 0.55), V(0, 1.05, 0.45));
      tube(V(0, 0.34, -0.55), V(0, 0.95, -0.12));
      tube(V(-0.27, 1.07, 0.45), V(0.27, 1.07, 0.45), 0.018, m('#222'));
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), m('#151515'));
      seat.position.set(0, 1.0, -0.15);
      root.add(seat);
      tube(V(0, 0.95, -0.12), V(0, 1.0, -0.15), 0.02, chrome);
    }
  }
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  return { root, wheels, steerWheels };
}

export class Vehicle {
  type: VehicleType;
  spec: Spec;
  mesh: THREE.Group;
  wheels: THREE.Object3D[];
  steerWheels: THREE.Object3D[];
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  ctrl: RAPIER.KinematicCharacterController;
  pos = new THREE.Vector3();
  heading = 0;
  speed = 0;
  steer = 0;
  vy = 0;
  occupied = false;
  owned: boolean;
  wheelSpin = 0;
  lean = 0;
  id: string;
  odometer = 0;
  private phys: Physics;

  constructor(phys: Physics, scene: THREE.Scene, type: VehicleType, x: number, z: number, heading: number, owned = false, color?: string) {
    this.phys = phys;
    this.type = type;
    this.spec = SPECS[type];
    this.owned = owned;
    this.id = type + '_' + Math.round(x) + '_' + Math.round(z);
    const built = buildVehicleMesh(type, color);
    this.mesh = built.root;
    this.wheels = built.wheels;
    this.steerWheels = built.steerWheels;
    scene.add(this.mesh);
    const [hx, hy, hz] = this.spec.size;
    this.pos.set(x, hy + 0.05, z);
    this.heading = heading;
    const R = phys.R;
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, this.pos.y, z).setRotation(this.quat()));
    this.collider = phys.world.createCollider(
      R.ColliderDesc.cuboid(hx, hy, hz)
        .setCollisionGroups(groups(GROUP.VEHICLE, GROUP.STATIC | GROUP.PLAYER | GROUP.VEHICLE | GROUP.BALL | GROUP.NPC)),
      this.body,
    );
    this.ctrl = phys.world.createCharacterController(0.05);
    this.ctrl.setSlideEnabled(true);
    this.ctrl.enableAutostep(0.25, 0.3, false);
    this.ctrl.enableSnapToGround(0.4);
    this.ctrl.setMaxSlopeClimbAngle((40 * Math.PI) / 180);
    this.ctrl.setApplyImpulsesToDynamicBodies(true);
    this.sync();
  }

  quat() {
    return { x: 0, y: Math.sin(this.heading / 2), z: 0, w: Math.cos(this.heading / 2) };
  }
  forward() {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  /** throttle -1..1, steering -1..1 (positive = left), brake */
  drive(dt: number, throttle: number, steerIn: number, handbrake: boolean, boost = 1) {
    const s = this.spec;
    const max = s.max * boost;
    if (throttle > 0) {
      if (this.speed < 0) this.speed = Math.min(0, this.speed + s.brake * dt);
      else this.speed = Math.min(max, this.speed + s.accel * throttle * dt * (1 - (this.speed / max) * 0.6));
    } else if (throttle < 0) {
      if (this.speed > 0) this.speed = Math.max(0, this.speed - s.brake * dt);
      else this.speed = Math.max(-s.reverse, this.speed - s.accel * 0.6 * dt);
    } else {
      const drag = (s.kind === 'bike' ? 1.6 : 2.2) * dt;
      this.speed = Math.abs(this.speed) < drag ? 0 : this.speed - Math.sign(this.speed) * drag;
    }
    if (handbrake) this.speed *= Math.pow(0.15, dt);
    this.steer = THREE.MathUtils.lerp(this.steer, steerIn, 1 - Math.exp(-dt * 8));
    const speedFactor = Math.min(1, Math.abs(this.speed) / 4) * (1 - Math.min(0.55, Math.abs(this.speed) / (max * 2.2)));
    this.heading += this.steer * s.steer * speedFactor * dt * Math.sign(this.speed || 1);
    return this.move(dt);
  }

  move(dt: number) {
    this.vy -= 20 * dt;
    const f = this.forward();
    const desired = { x: f.x * this.speed * dt, y: this.vy * dt, z: f.z * this.speed * dt };
    this.ctrl.computeColliderMovement(this.collider, desired, undefined, groups(GROUP.VEHICLE, GROUP.STATIC | GROUP.VEHICLE | GROUP.NPC | GROUP.BALL));
    const mv = this.ctrl.computedMovement();
    if (this.ctrl.computedGrounded()) this.vy = 0;
    const want = Math.hypot(desired.x, desired.z);
    const got = Math.hypot(mv.x, mv.z);
    let crashed = false;
    if (want > 0.02 && got < want * 0.35 && Math.abs(this.speed) > 4) {
      crashed = Math.abs(this.speed) > 7;
      this.speed *= -0.25;
    } else if (want > 0.001 && got < want * 0.9) {
      this.speed *= 0.97;
    }
    this.pos.x += mv.x;
    this.pos.y += mv.y;
    this.pos.z += mv.z;
    if (this.pos.y < -5) this.pos.y = this.spec.size[1] + 1;
    this.odometer += got;
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
    this.body.setNextKinematicRotation(this.quat());
    this.wheelSpin += (this.speed * dt) / (this.spec.kind === 'bike' ? 0.34 : 0.34);
    return crashed;
  }

  idle(dt: number) {
    if (Math.abs(this.speed) > 0.01 || this.vy !== 0) {
      this.drive(dt, 0, 0, true);
    }
  }

  sync() {
    const [, hy] = this.spec.size;
    this.mesh.position.set(this.pos.x, this.pos.y - hy, this.pos.z);
    this.mesh.rotation.set(0, this.heading, 0);
    if (this.spec.kind === 'bike') {
      const targetLean = -this.steer * Math.min(1, Math.abs(this.speed) / 6) * 0.35;
      this.lean = THREE.MathUtils.lerp(this.lean, targetLean, 0.1);
      this.mesh.rotateZ(this.lean);
      if (!this.occupied && Math.abs(this.speed) < 0.1) this.mesh.rotateZ(0.12); // kickstand
    }
    for (const w of this.wheels) w.rotation.x = this.wheelSpin;
    for (const p of this.steerWheels) p.rotation.y = this.steer * 0.45;
  }

  seatWorld(out: THREE.Vector3) {
    const [sx, sy, sz] = this.spec.seat;
    out.set(sx, sy, sz).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
    out.add(this.pos);
    return out;
  }

  exitPoint(out: THREE.Vector3) {
    const side = this.spec.kind === 'car' ? this.spec.size[0] + 0.9 : 0.9;
    out.set(side, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading).add(this.pos);
    out.y = this.pos.y - this.spec.size[1] + 0.2;
    return out;
  }

  teleport(x: number, z: number, heading: number) {
    this.pos.set(x, this.spec.size[1] + 0.05, z);
    this.heading = heading;
    this.speed = 0;
    this.body.setTranslation({ x, y: this.pos.y, z }, true);
    this.body.setRotation(this.quat(), true);
    this.sync();
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.phys.world.removeCharacterController(this.ctrl);
    this.phys.world.removeRigidBody(this.body);
  }
}
