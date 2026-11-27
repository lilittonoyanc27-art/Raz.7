// Engine: owns renderer, physics, the world and the main loop.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { initRapier, Physics } from './physics';
import { Input } from './Input';
import { CameraRig } from './CameraRig';
import { Player } from './Player';
import { buildCity, type CityBuild } from './CityBuilder';
import { buildInteriors, type InteriorBuild } from './Interiors';
import { Environment } from './Environment';
import { Traffic, Pedestrians } from './Traffic';
import { Npcs } from './Npcs';
import { NPCS } from '../data/npcs';
import { Humanoid, randomLook } from './character';
import { Football } from './Football';
import { Vehicle, SPECS, type VehicleType } from './Vehicles';
import { sfx } from './Audio';
import type { Interactable, Action } from './types';
import { PLACES, cityById, doorPoint, placeCenter, type InteriorKind } from '../data/places';
import { createStore } from '../store';
import { game, type CityId } from '../state';
import { settings } from '../settings';
import type { Tr } from '../../i18n/T';
import type { FootballMode } from '../data/missions';

export interface Hud {
  prompt: Tr | null;
  promptKey: string;
  inVehicle: boolean;
  vehicle: Tr | null;
  kmh: number;
  stamina: number;
  interior: InteriorKind | null;
  target: { x: number; z: number } | null;
  px: number;
  pz: number;
  yaw: number;
  camYaw: number;
  route: { i: number; n: number; time: number | null } | null;
  hint: Tr | null;
  nearVehicle: boolean;
  ready: boolean;
  locked: boolean;
  fps: number;
  firstPerson: boolean;
  view: 1 | 2 | 3;
  sprint: boolean;
}
export const hud = createStore<Hud>({
  prompt: null,
  promptKey: 'E',
  inVehicle: false,
  vehicle: null,
  kmh: 0,
  stamina: 1,
  interior: null,
  target: null,
  px: 0,
  pz: 0,
  yaw: 0,
  camYaw: 0,
  route: null,
  hint: null,
  nearVehicle: false,
  ready: false,
  locked: false,
  fps: 60,
  firstPerson: false,
  view: 3,
  sprint: false,
});

type Events = {
  action: Action & { source?: Interactable };
  enter: InteriorKind;
  exit: InteriorKind;
  mount: Vehicle;
  dismount: Vehicle;
  routeDone: boolean;
  routeCheckpoint: number;
  goal: boolean;
  footballEnd: { mode: FootballMode; success: boolean };
  footballProgress: { mode: FootballMode; count: number };
  redLight: void;
  borrowed: 'car' | 'bike' | 'bus';
  tick: number;
  key: string;
};

class Emitter {
  private m = new Map<string, Set<(v: unknown) => void>>();
  on<K extends keyof Events>(k: K, f: (v: Events[K]) => void) {
    if (!this.m.has(k)) this.m.set(k, new Set());
    this.m.get(k)!.add(f as (v: unknown) => void);
    return () => this.m.get(k)!.delete(f as (v: unknown) => void);
  }
  emit<K extends keyof Events>(k: K, v: Events[K]) {
    this.m.get(k)?.forEach((f) => f(v));
  }
}

interface Route {
  points: THREE.Vector3[];
  i: number;
  time: number | null;
  vtype: string;
  hints: Tr[];
  lights: boolean;
  ring: THREE.Mesh;
  r: number;
  redCooldown: number;
}

export class Engine {
  static current: Engine | null = null;
  events = new Emitter();
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  phys!: Physics;
  input!: Input;
  rig!: CameraRig;
  player!: Player;
  env!: Environment;
  city!: CityBuild;
  interiors!: InteriorBuild;
  npcs!: Npcs;
  traffic!: Traffic;
  peds!: Pedestrians;
  football!: Football;
  vehicles: Vehicle[] = [];
  vehicle: Vehicle | null = null;
  interactables: Interactable[] = [];
  interior: InteriorKind | null = null;
  paused = false;
  private container!: HTMLElement;
  private raf = 0;
  private last = 0;
  private hudT = 0;
  private marker!: THREE.Group;
  private target: THREE.Vector3 | null = null;
  private route: Route | null = null;
  private worldItems: { id: string; mesh: THREE.Object3D }[] = [];
  private highlight = new Set<string>();
  private nearest: Interactable | null = null;
  private fpsAcc = { t: 0, n: 0 };
  private birdT = 2;
  private disposed = false;
  private lastOutdoor = new THREE.Vector3();
  private envTex: THREE.Texture | null = null;
  nearPed = -1;
  hasBasket = false;
  kickPressed = false;
  passPressed = false;
  private resizeObs?: ResizeObserver;

  async start(container: HTMLElement) {
    this.container = container;
    await initRapier();
    if (this.disposed) return;
    const q = settings.get().quality;
    // logarithmic depth removes z-fighting flicker on far / near-coplanar surfaces
    this.renderer = new THREE.WebGLRenderer({ antialias: q !== 'low', powerPreference: 'high-performance', logarithmicDepthBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === 'high' ? 2 : q === 'medium' ? 1.5 : 1));
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'game-canvas';
    this.input = new Input(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.15, 2000);
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    window.addEventListener('keydown', this.onKey);
    this.build(game.get().city);
    Engine.current = this;
    if (import.meta.env.DEV) (window as unknown as { __raz: Engine }).__raz = this;
    sfx.ensure();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    hud.set({ ready: true });
  }

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    this.events.emit('key', e.code);
  };

  resize() {
    if (!this.renderer) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Build (or rebuild) a whole city. */
  build(cityId: CityId) {
    const cfg = cityById(cityId);
    const q = settings.get().quality;
    const shadows = q !== 'low';
    this.scene = new THREE.Scene();
    // image-based lighting: gives glossy paint and glass realistic reflections
    if (!this.envTex) {
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.35;
    this.phys = new Physics();
    this.city = buildCity(this.scene, this.phys, cfg, shadows);
    this.interiors = buildInteriors(this.scene, this.phys, shadows);
    this.env = new Environment(this.scene, cfg.sky, game.get().timeOfDay, shadows, q === 'high' ? 2048 : 1024);
    this.env.lampMats = [this.city.lampMat];
    this.env.windowMats = this.city.windowMats;
    this.interactables = [...this.interiors.interactables];
    for (const pl of PLACES) {
      if (!pl.interior) continue;
      const d = doorPoint(pl);
      this.interactables.push({
        id: 'door_' + pl.id,
        pos: new THREE.Vector3(d.x, 1, d.z),
        r: 2.6,
        label: { es: `Entrar: ${pl.name.es}`, hy: `Մտնել՝ ${pl.name.hy}` },
        action: { type: 'enter', place: pl.id },
        interior: null,
      });
    }
    // stadium hub
    const st = placeCenter(PLACES.find((p) => p.id === 'stadium')!);
    this.interactables.push({ id: 'stadium_hub', pos: new THREE.Vector3(st.x, 1, st.z + 22), r: 3, label: { es: 'Centro de fútbol: elegir entrenamiento', hy: 'Ֆուտբոլային կենտրոն՝ ընտրել մարզումը' }, action: { type: 'football' }, interior: null });
    for (const b of this.city.benches) this.bench(b.x, b.z, b.rot);
    // extra people placed inside rooms
    for (const d of NPCS) {
      if (!d.interior || !d.spot) continue;
      const room = this.interiors.rooms.get(d.interior);
      if (room) this.interiors.npcs.push({ npcId: d.id, x: room.origin.x + d.spot[0], z: room.origin.z + d.spot[1], yaw: 0, interior: d.interior });
    }
    this.npcs = new Npcs(this.scene, this.phys, this.interiors.npcs, this.interactables);
    this.traffic = new Traffic(this.phys, this.scene, this.city.lights, q === 'low' ? 14 : q === 'medium' ? 24 : 34);
    this.peds = new Pedestrians(this.scene, q === 'low' ? 10 : q === 'medium' ? 22 : 34, cfg.seed);
    this.football = new Football(this.phys, this.scene, this.city.pitch);
    this.football.onKick = (p) => sfx.kick(p);
    this.football.onGoal = (us) => {
      if (us) sfx.goal();
      this.events.emit('goal', us);
    };
    this.football.onWhistle = () => sfx.whistle();
    this.football.onModeEnd = (mode, success) => {
      sfx.whistle();
      this.events.emit('footballEnd', { mode, success });
    };
    this.football.onProgress = (mode, count) => this.events.emit('footballProgress', { mode, count });
    this.spawnVehicles();
    this.player = new Player(this.phys, this.scene);
    this.player.onStep = () => sfx.step(this.surface());
    this.player.onJump = () => sfx.jump();
    this.rig = new CameraRig(this.camera, this.phys);
    // marker
    this.marker = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#ff6a00', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 30;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 32), new THREE.MeshBasicMaterial({ color: '#ff6a00', transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    this.marker.add(beam, ring);
    this.marker.visible = false;
    this.scene.add(this.marker);
    // spawn player
    const s = game.get();
    const home = doorPoint(PLACES.find((p) => p.id === 'home')!);
    if (s.pos && s.pos.x < 900 && Math.abs(s.pos.x) < 400) this.player.teleport(s.pos.x, s.pos.y, s.pos.z, s.pos.yaw);
    else this.player.teleport(home.x, 0.2, home.z + 1, 0);
    this.rig.yaw = this.player.yaw + Math.PI;
    this.rig.snap(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
    this.interior = null;
    this.applyRoomDecor();
    this.applyQualityFog();
  }

  private applyQualityFog() {
    const q = settings.get().quality;
    this.camera.far = q === 'low' ? 600 : 1500;
    this.camera.updateProjectionMatrix();
  }

  private bench(x: number, z: number, rot: number) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: '#8b5e3c' });
    const iron = new THREE.MeshStandardMaterial({ color: '#2b2e35' });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), wood);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.06), wood);
    back.position.set(0, 0.75, -0.22);
    for (const sx of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.5), iron);
      leg.position.set(sx, 0.22, 0);
      g.add(leg);
    }
    g.add(seat, back);
    g.position.set(x, 0.16, z);
    g.rotation.y = rot;
    g.traverse((o) => (o.castShadow = true));
    this.scene.add(g);
    this.phys.addBox(x, 0.5, z, 0.9, 0.4, 0.3, rot);
  }

  surface(): 'hard' | 'grass' | 'sand' {
    const p = this.player.pos;
    if (p.z > 250) return 'sand';
    if (this.football && this.football.inStadium(p, 0)) return 'grass';
    return 'hard';
  }

  spawnVehicles() {
    for (const v of this.vehicles) v.dispose(this.scene);
    this.vehicles = [];
    const owned = game.get().owned;
    const bs = this.city.bikeSpot;
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'bike_city', bs.x, bs.z, 0, true));
    const homeD = doorPoint(PLACES.find((p) => p.id === 'home')!);
    const ownList: VehicleType[] = ['bike_mtb', 'scooter', 'car_compact', 'car_sport'];
    let k = 0;
    for (const t of ownList)
      if (owned.includes(t)) {
        this.vehicles.push(new Vehicle(this.phys, this.scene, t, homeD.x + 8 + k * 4, homeD.z + 18, Math.PI / 2, true));
        k++;
      }
    const pub: VehicleType[] = ['car_compact', 'taxi', 'car_compact', 'car_sport', 'car_compact', 'taxi'];
    const pcols = ['#f4f4f4', '#16181c', '#f4f4f4', '#2f5fa7', '#c0392b', '#9aa1a8'];
    this.city.parkedSpots.slice(0, 10).forEach((s, i) => this.vehicles.push(new Vehicle(this.phys, this.scene, pub[i % pub.length], s.x, s.z, s.rot, false, pub[i % pub.length] === 'taxi' ? undefined : pcols[i % pcols.length])));
    // public scooters and bikes
    const st = placeCenter(PLACES.find((p) => p.id === 'stadium')!);
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'scooter', st.x - 8, st.z + 31, 0));
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'bike_mtb', st.x - 5, st.z + 31, 0));
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'scooter', 30, 255, 0));
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'bike_city', -46, 52, 0));
    const tr = this.city.training;
    this.vehicles.push(new Vehicle(this.phys, this.scene, 'scooter', tr.cx - 12, tr.cz + 28, 0));
  }

  applyRoomDecor() {
    const owned = game.get().owned;
    for (const [id, obj] of this.interiors.decor) obj.visible = owned.includes(id);
  }

  applyOutfit() {
    const o = game.get().outfit;
    this.player.model.setOutfit(o);
  }

  // ------------- public API used by game logic -------------
  setTarget(p: { x: number; z: number } | null) {
    this.target = p ? new THREE.Vector3(p.x, 0, p.z) : null;
    hud.set({ target: p });
  }
  setHighlight(ids: string[]) {
    this.highlight = new Set(ids);
  }

  enterInterior(kind: InteriorKind) {
    const room = this.interiors.rooms.get(kind);
    if (!room) return;
    if (this.vehicle) this.dismount();
    if (!this.interior) this.lastOutdoor.copy(this.player.feet());
    this.interior = kind;
    this.player.teleport(room.spawn.x, room.spawn.y, room.spawn.z, Math.PI);
    this.rig.yaw = 0;
    this.rig.pitch = 0.25;
    this.rig.setInterior(true);
    this.rig.snap(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
    this.env.indoor = true;
    this.env.interiorLight.position.set(room.origin.x, room.kind === 'airport' || room.kind === 'mall' ? 8 : 4.5, room.origin.z);
    this.env.interiorLight.intensity = 60;
    this.env.interiorLight.distance = Math.max(room.w, room.d) * 1.4;
    this.city.group.visible = false;
    sfx.door();
    hud.set({ interior: kind });
    this.events.emit('enter', kind);
  }

  exitInterior() {
    const kind = this.interior;
    if (!kind) return;
    if (this.hasBasket) this.setBasket(false); // leave the basket in the shop
    const pl = PLACES.find((p) => p.interior === kind);
    const d = pl ? doorPoint(pl) : { x: this.lastOutdoor.x, z: this.lastOutdoor.z };
    this.interior = null;
    this.player.teleport(d.x, 0.2, d.z + 1.2, 0);
    this.rig.yaw = Math.PI;
    this.rig.setInterior(false);
    this.rig.snap(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
    this.env.indoor = false;
    this.env.interiorLight.intensity = 0;
    this.city.group.visible = true;
    sfx.door();
    hud.set({ interior: null });
    this.events.emit('exit', kind);
  }

  mount(v: Vehicle) {
    this.vehicle = v;
    v.occupied = true;
    this.player.setActive(false);
    this.rig.setVehicle(true, v.type === 'bus');
    hud.set({ inVehicle: true, vehicle: SPECS[v.type].name });
    sfx.door();
    this.events.emit('mount', v);
  }

  dismount() {
    const v = this.vehicle;
    if (!v) return;
    const out = v.exitPoint(new THREE.Vector3());
    v.occupied = false;
    v.speed = 0;
    this.vehicle = null;
    this.player.setActive(true);
    this.player.teleport(out.x, Math.max(0.15, out.y), out.z, v.heading);
    this.rig.setVehicle(false);
    hud.set({ inVehicle: false, vehicle: null, kmh: 0 });
    sfx.setEngine(false, 0, 'car');
    this.events.emit('dismount', v);
  }

  /** The driver/cyclist kindly gets out and lends the vehicle to RAZ. */
  borrow(c: NonNullable<ReturnType<Traffic['nearest']>>) {
    const info = this.traffic.release(c);
    if (!info) return;
    // keep only a few borrowed vehicles around
    const borrowed = this.vehicles.filter((v) => v.id.startsWith('borrow') && !v.occupied);
    while (borrowed.length > 4) {
      const old = borrowed.shift()!;
      old.dispose(this.scene);
      this.vehicles = this.vehicles.filter((v) => v !== old);
    }
    const veh = new Vehicle(this.phys, this.scene, info.type, info.x, info.z, info.heading, false, info.color);
    veh.id = 'borrow_' + Math.random().toString(36).slice(2);
    this.vehicles.push(veh);
    const driver = info.rider ?? new Humanoid(randomLook(Math.random));
    driver.root.rotation.set(0, info.heading, 0);
    const side = new THREE.Vector3(-(veh.spec.size[0] + 1.0), 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), info.heading);
    this.peds.addWalker(driver, info.x + side.x, info.z + side.z);
    this.mount(veh);
    this.events.emit('borrowed', veh.spec.kind === 'bike' ? 'bike' : veh.type === 'bus' ? 'bus' : 'car');
  }

  nearestVehicle(max = 3.2) {
    let best: Vehicle | null = null;
    let bd = max;
    const p = this.player.pos;
    for (const v of this.vehicles) {
      const d = Math.hypot(v.pos.x - p.x, v.pos.z - p.z) - (v.spec.kind === 'car' ? 1 : 0);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  }

  startRoute(points: [number, number][], opts: { time?: number; vtype?: string; hints?: Tr[]; lights?: boolean }) {
    this.clearRoute();
    const big = opts.vtype === 'car' || opts.vtype === 'bike' || opts.vtype === 'any';
    const r = big ? 5 : 2.4;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 8, 40), new THREE.MeshBasicMaterial({ color: '#ff6a00', transparent: true, opacity: 0.85 }));
    this.scene.add(ring);
    this.route = { points: points.map(([x, z]) => new THREE.Vector3(x, 0, z)), i: 0, time: opts.time ?? null, vtype: opts.vtype ?? 'any', hints: opts.hints ?? [], lights: !!opts.lights, ring, r, redCooldown: 0 };
    this.placeRing();
    hud.set({ route: { i: 0, n: points.length, time: opts.time ?? null }, hint: this.route.hints[0] ?? null });
  }
  private placeRing() {
    const r = this.route!;
    const p = r.points[r.i];
    r.ring.position.set(p.x, r.r + 0.2, p.z);
    const next = r.points[r.i + 1] ?? p.clone().add(new THREE.Vector3(0, 0, 1));
    r.ring.lookAt(next.x, r.r + 0.2, next.z);
    this.setTarget({ x: p.x, z: p.z });
  }
  clearRoute() {
    if (this.route) this.scene.remove(this.route.ring);
    this.route = null;
    hud.set({ route: null, hint: null });
  }

  spawnWorldItem(id: string, x: number, z: number, label: Tr, interior: InteriorKind | null = null, shape = 'box') {
    if (this.worldItems.find((w) => w.id === id)) return;
    const g = itemMesh(shape);
    g.position.set(x, interior ? 0.02 : groundY(x, z) + 0.02, z);
    this.scene.add(g);
    this.worldItems.push({ id, mesh: g });
    this.interactables.push({ id: 'witem_' + id, pos: new THREE.Vector3(x, 1, z), r: 2.2, label, action: { type: 'item', id }, mesh: g, interior });
  }
  removeWorldItem(id: string) {
    const w = this.worldItems.find((x) => x.id === id);
    if (w) this.scene.remove(w.mesh);
    this.worldItems = this.worldItems.filter((x) => x.id !== id);
    this.interactables = this.interactables.filter((i) => i.id !== 'witem_' + id);
  }

  startFootball(mode: FootballMode, target: number) {
    if (this.vehicle) this.dismount();
    if (this.interior) this.exitInterior();
    const p = this.football.start(mode, target);
    this.player.teleport(p.x, 0.2, p.z, p.yaw);
    this.rig.yaw = p.yaw + Math.PI;
    this.rig.pitch = 0.22;
    this.rig.snap(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
  }

  teleportTo(x: number, z: number, yaw = 0) {
    if (this.vehicle) this.dismount();
    if (this.interior) this.exitInterior();
    this.player.teleport(x, 0.2, z, yaw);
    this.rig.yaw = yaw + Math.PI;
    this.rig.snap(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
  }

  travel(city: CityId) {
    this.football?.dispose();
    this.traffic?.dispose();
    this.peds?.dispose();
    this.npcs?.dispose();
    for (const v of this.vehicles) v.dispose(this.scene);
    this.vehicles = [];
    this.vehicle = null;
    this.route = null;
    this.worldItems = [];
    this.target = null;
    disposeScene(this.scene);
    this.phys.world.free();
    game.set({ city, pos: null });
    this.build(city);
    hud.set({ interior: null, inVehicle: false, vehicle: null, route: null, hint: null, target: null });
  }

  /** Cycle 3ª → 2ª → 1ª → 3ª */
  toggleView() {
    this.setView(this.rig.view === 3 ? 2 : this.rig.view === 2 ? 1 : 3);
  }
  setView(v: 1 | 2 | 3) {
    this.rig.setView(v);
    hud.set({ firstPerson: v === 1, view: v });
  }

  setBasket(on: boolean) {
    this.hasBasket = on;
    this.player.model.holdBasket(on);
  }
  addBasketItem(color: string, shape: string) {
    this.player.model.addToBasket(color, shape);
  }
  clearBasket() {
    this.player.model.clearBasket();
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.input.enabled = !p;
    if (p && document.pointerLockElement) document.exitPointerLock();
  }

  // ------------- loop -------------
  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.fpsAcc.t += dt;
    this.fpsAcc.n++;
    try {
      if (!this.paused) this.update(dt);
      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      console.error(e);
    }
    this.input.endFrame();
  };

  private update(dt: number) {
    const input = this.input;
    this.playAcc += dt;

    // vehicles
    if (this.vehicle) {
      const v = this.vehicle;
      const ax = input.axis();
      const crashed = v.drive(dt, ax.y, -ax.x, input.down('Space'), input.down('ShiftLeft', 'ShiftRight') && v.spec.kind === 'car' ? 1.15 : 1);
      if (crashed) sfx.crash();
      const seat = v.seatWorld(new THREE.Vector3());
      this.player.pos.copy(seat).add(new THREE.Vector3(0, 0.8, 0));
      this.player.model.root.position.set(seat.x, seat.y - (v.type === 'scooter' ? 0.05 : v.spec.pose === 'car' ? 0.55 : 0.62), seat.z);
      this.player.model.root.rotation.set(0, v.heading, 0);
      if (v.spec.kind === 'bike') this.player.model.root.rotateZ(v.lean);
      this.player.model.animate(dt, 0, false, v.type === 'scooter' ? 'ground' : v.spec.pose, v.type === 'scooter' ? 0 : v.speed);
      if (input.hit('KeyH')) sfx.horn();
      sfx.setEngine(true, v.speed, v.spec.kind);
    } else {
      this.player.update(dt, input, this.rig.yaw);
    }
    for (const v of this.vehicles) if (v !== this.vehicle) v.idle(dt);

    // F: enter/exit vehicle
    if (input.hit('KeyF')) {
      if (this.vehicle) {
        if (Math.abs(this.vehicle.speed) < 3) this.dismount();
      } else if (!this.interior) {
        const v = this.nearestVehicle();
        if (v) this.mount(v);
        else {
          const c = this.traffic.nearest(this.player.pos, 4);
          if (c) this.borrow(c);
        }
      }
    }

    // world actors
    const pPos = this.player.pos;
    if (!this.interior) {
      this.traffic.update(dt, [pPos], this.vehicle ? [this.vehicle.pos] : []);
      this.peds.update(dt, pPos, this.camera.position);
    }
    this.npcs.update(dt, pPos, this.highlight);

    // football
    const inPlay = !this.interior && (this.football.mode !== null || this.football.inStadium(pPos, 25));
    if (inPlay) {
      this.football.update(dt, {
        playerPos: this.player.feet(),
        playerVel: this.player.vel,
        playerYaw: this.player.yaw,
        camYaw: this.rig.yaw,
        camPitch: this.rig.pitch,
        chargeHeld: !this.vehicle && (input.mouseDown || input.down('KeyK')),
        chargeReleased: input.mouseReleased || (this.kickReleased(input)),
        quickKick: this.kickPressed,
        pass: !this.vehicle && (input.hit('KeyQ') || this.passPressed),
        onFoot: !this.vehicle,
        playerKick: () => this.player.model.kick(),
      });
      if (this.football.mode === 'goalkeeper' && !this.vehicle) {
        // keep RAZ on the goal line
        const lineX = this.football.pitch.cx + this.football.pitch.hx - 0.8;
        const pz = THREE.MathUtils.clamp(this.player.pos.z, this.football.pitch.cz - 3.6, this.football.pitch.cz + 3.6);
        if (Math.abs(this.player.pos.x - lineX) > 0.05 || pz !== this.player.pos.z) {
          this.player.pos.x = lineX;
          this.player.pos.z = pz;
          this.player.body.setNextKinematicTranslation({ x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z });
        }
      }
    }
    this.kickPressed = false;
    this.passPressed = false;

    this.phys.world.timestep = Math.max(1 / 120, dt);
    this.phys.world.step();
    for (const v of this.vehicles) v.sync();
    if (!inPlay) this.football.ballMesh.position.copy(this.football.ballPos());

    // camera
    const target = this.vehicle ? this.vehicle.pos.clone().add(new THREE.Vector3(0, this.vehicle.type === 'bus' ? 3 : 1.6, 0)) : this.player.pos.clone().add(new THREE.Vector3(0, 0.65, 0));
    if (input.hit('KeyV')) this.toggleView();
    let eye: THREE.Vector3 | undefined;
    if (this.rig.firstPerson) {
      if (this.vehicle) {
        eye = this.vehicle.seatWorld(new THREE.Vector3()).add(new THREE.Vector3(0, this.vehicle.spec.kind === 'car' ? 0.62 : 0.95, 0));
        eye.addScaledVector(this.vehicle.forward(), this.vehicle.spec.kind === 'car' ? 0.05 : 0.15);
      } else {
        const fwd = new THREE.Vector3(-Math.sin(this.rig.yaw), 0, -Math.cos(this.rig.yaw));
        eye = this.player.pos.clone().add(new THREE.Vector3(0, 0.76, 0)).addScaledVector(fwd, 0.12);
      }
    }
    // hide RAZ's own body in first person (it would block the view)
    this.player.model.root.visible = !this.rig.firstPerson;
    // on foot: when walking forward the camera follows behind RAZ
    const fwdHeld = !this.vehicle && input.axis().y > 0.3 && this.player.speed > 0.5;
    const follow = this.vehicle ? this.vehicle.heading : fwdHeld ? this.player.yaw : null;
    this.rig.update(dt, input, target, follow, this.vehicle ? this.vehicle.speed : this.player.speed * 0.5, eye);
    this.env.update(dt, this.vehicle ? this.vehicle.pos : pPos, this.camera);

    // marker
    if (this.target && !this.interior) {
      this.marker.visible = true;
      this.marker.position.set(this.target.x, 0, this.target.z);
      this.marker.rotation.y += dt;
    } else this.marker.visible = false;

    // route checkpoints
    if (this.route) this.updateRoute(dt);

    // interactions
    this.nearest = null;
    if (!this.vehicle) {
      let bd = 1e9;
      for (const it of this.interactables) {
        if ((it.interior ?? null) !== this.interior) continue;
        if (it.enabled && !it.enabled()) continue;
        if (it.mesh && !it.mesh.visible) continue;
        const d = Math.hypot(it.pos.x - pPos.x, it.pos.z - pPos.z);
        if (d < it.r && d < bd) {
          bd = d;
          this.nearest = it;
        }
      }
      if (this.nearest && input.hit('KeyE')) this.events.emit('action', { ...this.nearest.action, source: this.nearest });
      // stop a passer-by and talk
      this.nearPed = !this.nearest && !this.interior ? this.peds.nearestIndex(pPos, 2.0) : -1;
      if (this.nearPed >= 0 && input.hit('KeyE')) {
        this.peds.hold(this.nearPed, 4);
        this.events.emit('action', { type: 'ped', index: this.nearPed });
      }
    }

    // ambience
    const nearStadium = this.football.inStadium(pPos, 10);
    sfx.setLoop('city', this.interior ? 0.01 : 0.05);
    sfx.setLoop('rain', 0); // rain is visual only (no noise)
    sfx.setLoop('crowd', nearStadium && !this.interior ? (this.football.mode === 'match' ? 0.2 : 0.06) : 0);
    sfx.setLoop('wind', pPos.z > 240 && !this.interior ? 0.12 : 0.02);
    if (!this.vehicle) sfx.setEngine(false, 0, 'car');
    this.birdT -= dt;
    if (this.birdT < 0) {
      this.birdT = 2 + Math.random() * 6;
      const park = placeCenter(PLACES.find((p) => p.id === 'park')!);
      if (!this.interior && !this.env.isNight() && !this.env.rain && Math.hypot(pPos.x - park.x, pPos.z - park.z) < 60) sfx.bird();
    }

    // HUD (10 Hz)
    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.1;
      const nv = !this.vehicle && !this.interior ? this.nearestVehicle() : null;
      const tc = !nv && !this.vehicle && !this.interior ? this.traffic.nearest(pPos, 4) : null;
      const fps = Math.round(this.fpsAcc.n / Math.max(0.001, this.fpsAcc.t));
      this.fpsAcc = { t: 0, n: 0 };
      hud.set({
        prompt: this.nearest?.label ?? (this.nearPed >= 0 ? { es: 'Parar al peatón y hablar', hy: 'Կանգնեցնել անցորդին և խոսել' } : nv ? { es: `Subir: ${nv.spec.name.es}`, hy: `Նստել՝ ${nv.spec.name.hy}` } : tc ? (SPECS[tc.type].kind === 'bike' ? { es: 'Pedir la bici al ciclista', hy: 'Խնդրել հեծանվորդից հեծանիվը' } : { es: 'Pedir el coche al conductor', hy: 'Խնդրել վարորդից մեքենան' }) : null),
        promptKey: this.nearest || this.nearPed >= 0 ? 'E' : 'F',
        nearVehicle: !!nv || !!tc || !!this.vehicle,
        kmh: this.vehicle ? Math.round(Math.abs(this.vehicle.speed) * 3.6) : 0,
        stamina: this.player.stamina,
        sprint: this.player.sprinting && !this.vehicle,
        px: this.vehicle ? this.vehicle.pos.x : pPos.x,
        pz: this.vehicle ? this.vehicle.pos.z : pPos.z,
        yaw: this.vehicle ? this.vehicle.heading : this.player.yaw,
        camYaw: this.rig.yaw,
        locked: this.input.locked,
        fps,
      });
      game.set((g) => ({ timeOfDay: this.env.hour, playSeconds: g.playSeconds + this.playAcc }));
      this.playAcc = 0;
      if (!this.interior && !this.vehicle) game.set({ pos: { x: pPos.x, y: this.player.feet().y, z: pPos.z, yaw: this.player.yaw } });
      if (this.vehicle && Math.abs(this.vehicle.speed) > 1) this.events.emit('tick', Math.abs(this.vehicle.speed) * 0.1);
    }
  }

  private playAcc = 0;
  private kHeld = false;
  private kickReleased(input: Input) {
    const held = input.down('KeyK');
    const rel = this.kHeld && !held;
    this.kHeld = held;
    return rel;
  }

  private updateRoute(dt: number) {
    const r = this.route!;
    const pos = this.vehicle ? this.vehicle.pos : this.player.pos;
    r.ring.rotation.z += dt * 0.8;
    if (r.time !== null) {
      r.time -= dt;
      hud.set({ route: { i: r.i, n: r.points.length, time: Math.max(0, r.time) } });
      if (r.time <= 0) {
        this.clearRoute();
        this.setTarget(null);
        this.events.emit('routeDone', false);
        return;
      }
    }
    // red light check while driving
    if (r.lights && this.vehicle && this.vehicle.spec.kind === 'car') {
      r.redCooldown -= dt;
      const v = this.vehicle;
      const fwd = v.forward();
      const axis = Math.abs(fwd.x) > Math.abs(fwd.z) ? 'x' : 'z';
      const st = this.traffic.state[axis];
      if (st === 'red' && Math.abs(v.speed) > 3 && r.redCooldown <= 0) {
        for (const x of [-240, -160, -80, 0, 80, 160, 240])
          for (const z of [-240, -160, -80, 0, 80, 160, 240])
            if (Math.abs(v.pos.x - x) < 5 && Math.abs(v.pos.z - z) < 5) {
              r.redCooldown = 4;
              this.events.emit('redLight', undefined);
            }
      }
    }
    const p = r.points[r.i];
    const ok = r.vtype === 'foot' ? !this.vehicle : r.vtype === 'any' ? true : r.vtype === 'car' ? this.vehicle?.spec.kind === 'car' : r.vtype === 'bike' ? this.vehicle?.spec.kind === 'bike' : true;
    if (ok && Math.hypot(pos.x - p.x, pos.z - p.z) < r.r + 0.5) {
      sfx.bell();
      r.i++;
      this.events.emit('routeCheckpoint', r.i);
      if (r.i >= r.points.length) {
        this.clearRoute();
        this.setTarget(null);
        this.events.emit('routeDone', true);
        return;
      }
      this.placeRing();
      hud.set({ route: { i: r.i, n: r.points.length, time: r.time }, hint: r.hints[r.i] ?? null });
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    this.resizeObs?.disconnect();
    this.input?.dispose();
    if (this.scene) disposeScene(this.scene);
    try {
      this.phys?.world.free();
    } catch {
      /* already freed */
    }
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    if (Engine.current === this) Engine.current = null;
    hud.set({ ready: false });
  }
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
  scene.clear();
}

/** Simple, readable props for quest items (glowing ring so they are easy to spot). */
function itemMesh(shape: string) {
  const g = new THREE.Group();
  const m = (c: string, r = 0.5, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const me = new THREE.Mesh(geo, mat);
    me.position.set(x, y, z);
    me.castShadow = true;
    g.add(me);
    return me;
  };
  switch (shape) {
    case 'ball': {
      add(new THREE.SphereGeometry(0.16, 18, 14), m('#f4f4f4', 0.4), 0, 0.16, 0);
      add(new THREE.TorusGeometry(0.16, 0.02, 6, 20), m('#c0392b'), 0, 0.16, 0);
      break;
    }
    case 'wallet':
      add(new THREE.BoxGeometry(0.2, 0.04, 0.12), m('#5d3a1a', 0.6), 0, 0.03, 0);
      break;
    case 'glasses': {
      for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.045, 0.008, 6, 16), m('#16181c', 0.3), s * 0.055, 0.05, 0).rotation.x = -Math.PI / 2;
      add(new THREE.BoxGeometry(0.03, 0.008, 0.008), m('#16181c'), 0, 0.05, 0);
      break;
    }
    case 'passport':
      add(new THREE.BoxGeometry(0.12, 0.02, 0.17), m('#7a1c22', 0.6), 0, 0.02, 0);
      break;
    case 'suitcase': {
      add(new THREE.BoxGeometry(0.45, 0.6, 0.22), m('#1f5fbf', 0.4), 0, 0.32, 0);
      add(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), m('#16181c'), 0, 0.63, 0);
      break;
    }
    case 'dog': {
      const fur = m('#f2efe8', 0.9);
      const brown = m('#8d5a2b', 0.9);
      add(new THREE.CapsuleGeometry(0.1, 0.22, 4, 10), fur, 0, 0.24, 0).rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(0.09, 12, 10), brown, 0, 0.36, 0.17);
      add(new THREE.SphereGeometry(0.035, 8, 6), m('#16181c'), 0, 0.34, 0.26);
      for (const s of [-1, 1]) {
        add(new THREE.SphereGeometry(0.04, 8, 6), brown, s * 0.07, 0.42, 0.15).scale.set(0.6, 1.4, 0.6);
        for (const z of [-0.1, 0.1]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.16), fur, s * 0.06, 0.08, z);
      }
      add(new THREE.CylinderGeometry(0.015, 0.01, 0.14), brown, 0, 0.32, -0.18).rotation.x = -0.8;
      break;
    }
    case 'watch':
      add(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 20), m('#d0d4d8', 0.2, 0.9), 0, 0.03, 0);
      add(new THREE.CylinderGeometry(0.058, 0.058, 0.032, 20), m('#1b2a3a', 0.1), 0, 0.035, 0);
      add(new THREE.BoxGeometry(0.05, 0.01, 0.3), m('#5d3a1a', 0.7), 0, 0.012, 0);
      break;
    case 'keys':
      add(new THREE.TorusGeometry(0.05, 0.01, 6, 16), m('#c9ced3', 0.2, 0.9), 0, 0.02, 0).rotation.x = -Math.PI / 2;
      for (const a of [0, 0.7]) {
        const k = add(new THREE.BoxGeometry(0.025, 0.012, 0.12), m('#d4a017', 0.25, 0.9), Math.sin(a) * 0.06, 0.02, 0.08);
        k.rotation.y = a;
      }
      break;
    case 'phone':
      add(new THREE.BoxGeometry(0.08, 0.012, 0.16), m('#111', 0.2, 0.3), 0, 0.012, 0);
      add(new THREE.BoxGeometry(0.07, 0.002, 0.145), new THREE.MeshStandardMaterial({ color: '#2a5d9c', emissive: '#2a5d9c', emissiveIntensity: 0.6 }), 0, 0.02, 0);
      break;
    case 'book':
      add(new THREE.BoxGeometry(0.2, 0.04, 0.26), m('#1f5fbf', 0.6), 0, 0.02, 0);
      add(new THREE.BoxGeometry(0.19, 0.035, 0.25), m('#f4efe2', 0.9), 0.008, 0.02, 0);
      break;
    case 'cap': {
      const cap = add(new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m('#ff6a00', 0.7), 0, 0, 0);
      cap.scale.set(1, 0.8, 1);
      add(new THREE.BoxGeometry(0.16, 0.01, 0.1), m('#ff6a00', 0.7), 0, 0.01, 0.13);
      break;
    }
    case 'umbrella': {
      const sh = add(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8), m('#222'), 0, 0.03, 0);
      sh.rotation.z = Math.PI / 2;
      const top = add(new THREE.ConeGeometry(0.12, 0.6, 8), m('#c0392b', 0.6), 0.15, 0.06, 0);
      top.rotation.z = Math.PI / 2;
      break;
    }
    case 'camera':
      add(new THREE.BoxGeometry(0.18, 0.11, 0.08), m('#1b1b1b', 0.4), 0, 0.06, 0);
      add(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 16), m('#333', 0.2, 0.6), 0, 0.06, 0.07).rotation.x = Math.PI / 2;
      break;
    case 'guitar': {
      const body = add(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20), m('#a0522d', 0.5), 0, 0.05, 0.1);
      body.scale.set(1, 1, 1.3);
      add(new THREE.BoxGeometry(0.05, 0.03, 0.5), m('#5d3a1a', 0.6), 0, 0.07, -0.3);
      break;
    }
    case 'skates':
      for (const s of [-0.08, 0.08]) {
        add(new THREE.BoxGeometry(0.09, 0.1, 0.24), m('#f4f4f4', 0.6), s, 0.09, 0);
        for (const z of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), m('#ff6a00'), s, 0.03, z).rotation.z = Math.PI / 2;
      }
      break;
    case 'scarf':
      add(new THREE.TorusGeometry(0.12, 0.04, 8, 20), m('#c0392b', 0.9), 0, 0.04, 0).rotation.x = -Math.PI / 2;
      add(new THREE.BoxGeometry(0.08, 0.02, 0.3), m('#c0392b', 0.9), 0.1, 0.02, 0.15);
      break;
    case 'medal':
      add(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 24), m('#e0b23a', 0.2, 0.95), 0, 0.012, 0);
      add(new THREE.BoxGeometry(0.04, 0.005, 0.25), m('#c0392b'), 0, 0.005, -0.15);
      break;
    case 'map':
      add(new THREE.BoxGeometry(0.3, 0.008, 0.22), m('#e9dfc4', 0.9), 0, 0.006, 0);
      add(new THREE.BoxGeometry(0.06, 0.009, 0.06), m('#2e8b57', 0.9), -0.06, 0.008, 0.03);
      break;
    case 'tennis':
      add(new THREE.SphereGeometry(0.05, 14, 10), m('#d7f03a', 0.7), 0, 0.05, 0);
      break;
    case 'card':
      add(new THREE.BoxGeometry(0.14, 0.005, 0.09), m('#1abc9c', 0.4), 0, 0.005, 0);
      break;
    default:
      add(new THREE.BoxGeometry(0.4, 0.3, 0.3), m('#c9a46b', 0.8), 0, 0.15, 0);
      add(new THREE.BoxGeometry(0.41, 0.05, 0.31), m('#ff6a00'), 0, 0.2, 0);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.55, 32), new THREE.MeshBasicMaterial({ color: '#ff6a00', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  g.add(ring);
  return g;
}

/** Height of the walkable surface outdoors (sidewalk blocks are 0.16 m high). */
export function groundY(x: number, z: number) {
  const bx = Math.round((x + 200) / 80);
  const bz = Math.round((z + 200) / 80);
  if (bx < 0 || bx > 5 || bz < 0 || bz > 5) return 0;
  const cx = -200 + bx * 80;
  const cz = -200 + bz * 80;
  return Math.abs(x - cx) < 34 && Math.abs(z - cz) < 34 ? 0.16 : 0;
}
