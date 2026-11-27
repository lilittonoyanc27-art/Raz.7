// AI traffic driving in lanes on the road grid, turning at intersections and
// obeying the global traffic-light cycle; plus pedestrians on the sidewalks.
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { GROUP, groups, type Physics } from './physics';
import { ROADS, ROAD_W, blockCenter } from '../data/places';
import { buildVehicleMesh, SPECS, type VehicleType } from './Vehicles';
import type { TrafficLights } from './CityBuilder';
import { Humanoid, randomLook, CLOTH_COLORS } from './character';
import { mulberry32 } from './util';

const MIN = ROADS[0];
const MAX = ROADS[ROADS.length - 1];
const LANE = 3;

export type LightState = { x: 'green' | 'yellow' | 'red'; z: 'green' | 'yellow' | 'red' };
const CYCLE = 26;
export function lightState(t: number): LightState {
  const c = t % CYCLE;
  if (c < 11) return { x: 'green', z: 'red' };
  if (c < 13) return { x: 'yellow', z: 'red' };
  if (c < 24) return { x: 'red', z: 'green' };
  return { x: 'red', z: 'yellow' };
}

interface Car {
  mesh: THREE.Group;
  wheels: THREE.Object3D[];
  body: RAPIER.RigidBody;
  axis: 'x' | 'z';
  dir: 1 | -1;
  road: number; // coordinate of the road (z for axis x, x for axis z)
  t: number; // position along the axis
  speed: number;
  max: number;
  heading: number;
  nextTurnAt: number | null;
  half: number;
  type: VehicleType;
  color?: string;
  rider?: Humanoid;
}

export class Traffic {
  cars: Car[] = [];
  time = 0;
  state: LightState = lightState(0);
  private phys: Physics;
  private scene: THREE.Scene;
  private rnd = mulberry32(99);
  private lights: TrafficLights;

  constructor(phys: Physics, scene: THREE.Scene, lights: TrafficLights, count: number) {
    this.phys = phys;
    this.scene = scene;
    this.lights = lights;
    const types: VehicleType[] = ['car_compact', 'car_compact', 'taxi', 'car_sport', 'bus', 'car_compact'];
    const colors = ['#f4f4f4', '#f4f4f4', '#16181c', '#2f5fa7', '#c0392b', '#9aa1a8', '#f4f4f4', '#1e3a5f', '#7a1c22'];
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const axis: 'x' | 'z' = this.rnd() > 0.5 ? 'x' : 'z';
      const dir: 1 | -1 = this.rnd() > 0.5 ? 1 : -1;
      const road = ROADS[Math.floor(this.rnd() * ROADS.length)];
      const seg = Math.floor(this.rnd() * (ROADS.length - 1));
      const t = ROADS[seg] + 20 + this.rnd() * 40;
      const color = type === 'car_compact' || type === 'car_sport' ? colors[Math.floor(this.rnd() * colors.length)] : undefined;
      this.addCar(type, color, axis, dir, road, t);
    }
    // cyclists riding in the traffic lanes
    const bikes = Math.max(4, Math.round(count / 4));
    for (let i = 0; i < bikes; i++) {
      const axis: 'x' | 'z' = this.rnd() > 0.5 ? 'x' : 'z';
      const dir: 1 | -1 = this.rnd() > 0.5 ? 1 : -1;
      const road = ROADS[Math.floor(this.rnd() * ROADS.length)];
      const t = ROADS[Math.floor(this.rnd() * (ROADS.length - 1))] + 15 + this.rnd() * 50;
      this.addCar(this.rnd() > 0.5 ? 'bike_city' : 'bike_mtb', CLOTH_COLORS[Math.floor(this.rnd() * CLOTH_COLORS.length)], axis, dir, road, t);
    }
  }

  private addCar(type: VehicleType, color: string | undefined, axis: 'x' | 'z', dir: 1 | -1, road: number, t: number) {
    const built = buildVehicleMesh(type, color);
    this.scene.add(built.root);
    const [hx, hy, hz] = SPECS[type].size;
    const body = this.phys.world.createRigidBody(this.phys.R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, hy, 0));
    this.phys.world.createCollider(this.phys.R.ColliderDesc.cuboid(hx, hy, hz).setCollisionGroups(groups(GROUP.VEHICLE, 0xffff)), body);
    const bike = SPECS[type].kind === 'bike';
    let rider: Humanoid | undefined;
    if (bike) {
      rider = new Humanoid(randomLook(this.rnd, { longPants: true }));
      rider.root.position.set(0, 0.03, -0.12);
      built.root.add(rider.root);
    }
    this.cars.push({ mesh: built.root, wheels: built.wheels, body, axis, dir, road, t, speed: 0, max: type === 'bus' ? 8 : bike ? 4.5 + this.rnd() * 1.5 : 10 + this.rnd() * 3, heading: 0, nextTurnAt: null, half: hz, type, color, rider });
  }

  /** Nearest traffic vehicle to p within max metres. */
  nearest(p: THREE.Vector3, max: number) {
    let best = -1;
    let bd = max;
    this.cars.forEach((c, i) => {
      const d = Math.hypot(c.mesh.position.x - p.x, c.mesh.position.z - p.z) - (SPECS[c.type].kind === 'car' ? 1 : 0);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best >= 0 ? this.cars[best] : null;
  }

  /** Remove a vehicle from the traffic (its driver hands it over to RAZ). */
  release(c: Car) {
    const i = this.cars.indexOf(c);
    if (i < 0) return null;
    this.cars.splice(i, 1);
    this.scene.remove(c.mesh);
    if (c.rider) c.mesh.remove(c.rider.root);
    this.phys.world.removeRigidBody(c.body);
    return { type: c.type, color: c.color, x: c.mesh.position.x, z: c.mesh.position.z, heading: c.mesh.rotation.y, rider: c.rider };
  }

  private carPos(c: Car) {
    const off = LANE * (c.axis === 'x' ? c.dir : -c.dir);
    return c.axis === 'x' ? new THREE.Vector3(c.t, 0, c.road + off) : new THREE.Vector3(c.road + off, 0, c.t);
  }

  /** player (or player vehicle) world position to avoid */
  update(dt: number, avoid: THREE.Vector3[], playerVehiclePositions: THREE.Vector3[]) {
    this.time += dt;
    this.state = lightState(this.time);
    for (const axis of ['x', 'z'] as const) {
      const s = this.state[axis];
      this.lights[axis].red.emissiveIntensity = s === 'red' ? 2.2 : 0.05;
      this.lights[axis].yellow.emissiveIntensity = s === 'yellow' ? 2.2 : 0.05;
      this.lights[axis].green.emissiveIntensity = s === 'green' ? 2.2 : 0.05;
    }
    const positions = this.cars.map((c) => this.carPos(c));
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      const p = positions[i];
      const fwd = c.axis === 'x' ? new THREE.Vector3(c.dir, 0, 0) : new THREE.Vector3(0, 0, c.dir);
      let target = c.max;
      // next intersection ahead
      const ahead = ROADS.filter((r) => (r - c.t) * c.dir > 0).sort((a, b) => (a - c.t) * c.dir - (b - c.t) * c.dir)[0];
      if (ahead !== undefined) {
        const distToCenter = (ahead - c.t) * c.dir;
        const stopLine = distToCenter - ROAD_W / 2 - 3.2;
        const st = this.state[c.axis];
        if (st !== 'green' && stopLine > 0 && stopLine < 16) target = Math.min(target, Math.max(0, (stopLine - 0.5) * 1.2));
      }
      // obstacles ahead (cars, player)
      const check = (q: THREE.Vector3, gap: number) => {
        const d = q.clone().sub(p);
        const along = d.dot(fwd);
        const lateral = Math.abs(d.x * fwd.z - d.z * fwd.x);
        if (along > 0 && along < gap + c.half && lateral < 2.2) target = Math.min(target, Math.max(0, (along - c.half - 2.5) * 1.2));
      };
      for (let j = 0; j < this.cars.length; j++) if (j !== i) check(positions[j], 9);
      for (const a of avoid) check(a, 9);
      for (const a of playerVehiclePositions) check(a, 10);
      c.speed = THREE.MathUtils.lerp(c.speed, target, 1 - Math.exp(-dt * (target < c.speed ? 5 : 1.5)));
      const prevT = c.t;
      c.t += c.speed * c.dir * dt;
      // crossed an intersection centre?
      for (const r of ROADS) {
        if ((prevT - r) * c.dir < 0 && (c.t - r) * c.dir >= 0) {
          const atEdge = (c.dir > 0 && r === MAX) || (c.dir < 0 && r === MIN);
          const turn = atEdge || this.rnd() < 0.28;
          if (turn) {
            // choose left or right that stays inside the grid
            const options: { axis: 'x' | 'z'; dir: 1 | -1 }[] = [];
            const newAxis = c.axis === 'x' ? 'z' : 'x';
            for (const nd of [1, -1] as const) {
              const along = c.road;
              if ((nd > 0 && along < MAX) || (nd < 0 && along > MIN)) options.push({ axis: newAxis, dir: nd });
            }
            if (options.length) {
              const o = options[Math.floor(this.rnd() * options.length)];
              const oldRoad = c.road;
              c.road = r;
              c.t = oldRoad;
              c.axis = o.axis;
              c.dir = o.dir;
              c.speed *= 0.6;
            } else {
              c.dir = (c.dir * -1) as 1 | -1;
            }
          }
          break;
        }
      }
      const np = this.carPos(c);
      const heading = c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : c.dir > 0 ? 0 : Math.PI;
      c.heading = heading;
      c.mesh.position.lerp(new THREE.Vector3(np.x, 0, np.z), c.mesh.position.lengthSq() === 0 ? 1 : Math.min(1, dt * 12));
      let cur = c.mesh.rotation.y;
      let d = heading - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      cur += d * Math.min(1, dt * 6);
      c.mesh.rotation.y = cur;
      for (const w of c.wheels) w.rotation.x += (c.speed * dt) / 0.34;
      if (c.rider && c.mesh.position.distanceTo(avoid[0] ?? c.mesh.position) < 70) c.rider.animate(dt, 0, false, 'bike', c.speed);
      const hy = (c.body.translation().y as number) || 0.7;
      c.body.setNextKinematicTranslation({ x: c.mesh.position.x, y: hy, z: c.mesh.position.z });
      c.body.setNextKinematicRotation({ x: 0, y: Math.sin(cur / 2), z: 0, w: Math.cos(cur / 2) });
    }
  }

  positions() {
    return this.cars.map((c) => c.mesh.position);
  }

  dispose() {
    for (const c of this.cars) {
      this.scene.remove(c.mesh);
      this.phys.world.removeRigidBody(c.body);
    }
    this.cars = [];
  }
}

interface Ped {
  h: Humanoid;
  path: THREE.Vector3[];
  i: number;
  speed: number;
  wait: number;
}

/** Pedestrians walking around block perimeters on the sidewalk. */
export class Pedestrians {
  peds: Ped[] = [];
  private scene: THREE.Scene;
  constructor(scene: THREE.Scene, count: number, seed: number) {
    this.scene = scene;
    const rnd = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const bx = Math.floor(rnd() * 6);
      const bz = Math.floor(rnd() * 6);
      const cx = blockCenter(bx);
      const cz = blockCenter(bz);
      const e = 80 / 2 - ROAD_W / 2 - 1.2;
      const corners = [new THREE.Vector3(cx - e, 0.16, cz - e), new THREE.Vector3(cx + e, 0.16, cz - e), new THREE.Vector3(cx + e, 0.16, cz + e), new THREE.Vector3(cx - e, 0.16, cz + e)];
      const path = rnd() > 0.5 ? corners : corners.reverse();
      const h = new Humanoid(randomLook(rnd));
      const start = Math.floor(rnd() * 4);
      const a = path[start];
      const b = path[(start + 1) % 4];
      h.root.position.copy(a).lerp(b, rnd());
      scene.add(h.root);
      this.peds.push({ h, path, i: (start + 1) % 4, speed: 1.1 + rnd() * 0.5, wait: 0 });
    }
  }

  /** Add a person (e.g. a driver who left the car) who walks to the sidewalk and strolls around. */
  addWalker(h: Humanoid, x: number, z: number) {
    const bx = Math.max(0, Math.min(5, Math.round((x + 200) / 80)));
    const bz = Math.max(0, Math.min(5, Math.round((z + 200) / 80)));
    const cx = blockCenter(bx);
    const cz = blockCenter(bz);
    const e = 80 / 2 - ROAD_W / 2 - 1.2;
    const corners = [new THREE.Vector3(cx - e, 0.16, cz - e), new THREE.Vector3(cx + e, 0.16, cz - e), new THREE.Vector3(cx + e, 0.16, cz + e), new THREE.Vector3(cx - e, 0.16, cz + e)];
    const near = new THREE.Vector3(THREE.MathUtils.clamp(x, cx - e, cx + e), 0.16, THREE.MathUtils.clamp(z, cz - e, cz + e));
    let ci = 0;
    corners.forEach((c, i) => {
      if (c.distanceTo(near) < corners[ci].distanceTo(near)) ci = i;
    });
    h.root.position.set(x, 0.16, z);
    if (!h.root.parent) this.scene.add(h.root);
    this.peds.push({ h, path: [near, ...corners.slice(ci), ...corners.slice(0, ci)], i: 0, speed: 1.4, wait: 0.6 });
    if (this.peds.length > 60) {
      const old = this.peds.splice(0, 1)[0];
      this.scene.remove(old.h.root);
    }
  }

  /** index of the nearest visible pedestrian within r metres, or -1 */
  nearestIndex(p: THREE.Vector3, r: number) {
    let best = -1;
    let bd = r;
    this.peds.forEach((q, i) => {
      if (!q.h.root.visible) return;
      const d = Math.hypot(q.h.root.position.x - p.x, q.h.root.position.z - p.z);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }

  /** make a pedestrian stop and wait (e.g. while talking with RAZ) */
  hold(i: number, seconds: number) {
    const q = this.peds[i];
    if (q) q.wait = Math.max(q.wait, seconds);
  }

  update(dt: number, player: THREE.Vector3, camPos: THREE.Vector3) {
    for (const p of this.peds) {
      const dCam = p.h.root.position.distanceTo(camPos);
      p.h.root.visible = dCam < 110;
      if (!p.h.root.visible) {
        // still advance cheaply
        const tgt = p.path[p.i];
        const dir = tgt.clone().sub(p.h.root.position);
        if (dir.length() < 0.5) p.i = (p.i + 1) % p.path.length;
        else p.h.root.position.addScaledVector(dir.normalize(), p.speed * dt);
        continue;
      }
      const near = p.h.root.position.distanceTo(player) < 1.4;
      let speed = 0;
      if (!near && p.wait <= 0) {
        const tgt = p.path[p.i];
        const dir = tgt.clone().sub(p.h.root.position);
        dir.y = 0;
        if (dir.length() < 0.4) {
          p.i = (p.i + 1) % p.path.length;
          p.wait = Math.random() < 0.3 ? 1 + Math.random() * 3 : 0;
        } else {
          dir.normalize();
          p.h.root.position.addScaledVector(dir, p.speed * dt);
          p.h.root.rotation.y = Math.atan2(dir.x, dir.z);
          speed = p.speed;
        }
      } else p.wait -= dt;
      if (near) {
        const d = player.clone().sub(p.h.root.position);
        p.h.root.rotation.y = Math.atan2(d.x, d.z);
      }
      if (dCam < 60) p.h.animate(dt, speed, false);
    }
  }

  dispose() {
    for (const p of this.peds) this.scene.remove(p.h.root);
    this.peds = [];
  }
}
