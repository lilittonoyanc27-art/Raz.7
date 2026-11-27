// Builds the static 3D city: ground, roads, buildings, special places, props,
// and their static colliders.
import * as THREE from 'three';
import type { Physics } from './physics';
import { PLACES, ROADS, ROAD_W, blockCenter, type CityConfig, type Place } from '../data/places';
import { boxUV, canvasTex, mulberry32, signTexture } from './util';

type LampSet = { red: THREE.MeshStandardMaterial; yellow: THREE.MeshStandardMaterial; green: THREE.MeshStandardMaterial };
/** lights.x controls traffic moving along the x axis */
export type TrafficLights = { x: LampSet; z: LampSet };

export interface CityBuild {
  group: THREE.Group;
  lampMat: THREE.MeshStandardMaterial;
  windowMats: THREE.MeshStandardMaterial[];
  lights: TrafficLights;
  pitch: { cx: number; cz: number; hx: number; hz: number };
  training: { cx: number; cz: number };
  parkedSpots: { x: number; z: number; rot: number }[];
  benches: { x: number; z: number; rot: number }[];
  bikeSpot: { x: number; z: number };
  waterMat: THREE.MeshStandardMaterial;
}

const HALF = ROAD_W / 2;
const WORLD = 330;

export function buildCity(scene: THREE.Scene, phys: Physics, cfg: CityConfig, shadows: boolean): CityBuild {
  const rnd = mulberry32(cfg.seed);
  const group = new THREE.Group();
  group.name = 'city';
  scene.add(group);
  const add = (m: THREE.Object3D, cast = true, receive = true) => {
    m.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = cast && shadows;
        o.receiveShadow = receive;
      }
    });
    group.add(m);
    return m;
  };

  // ---------- ground ----------
  const grassTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#5f8f3e';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `hsl(${90 + Math.random() * 25},${35 + Math.random() * 20}%,${28 + Math.random() * 14}%)`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(120, 120);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  add(ground, false);
  phys.addBox(0, -0.5, 0, 700, 0.5, 700);

  // asphalt base for the grid
  const asphaltTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#3a3d42';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const v = 50 + Math.random() * 30;
      g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
    }
  });
  asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;
  const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.92 });
  const lineTex = canvasTex(64, 256, (g) => {
    g.clearRect(0, 0, 64, 256);
    g.fillStyle = '#f5f5f0';
    g.fillRect(28, 0, 8, 140);
  });
  lineTex.wrapS = lineTex.wrapT = THREE.RepeatWrapping;
  const lineMat = new THREE.MeshStandardMaterial({ map: lineTex, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const L = ROADS[ROADS.length - 1] - ROADS[0] + ROAD_W;
  for (const r of ROADS) {
    for (const axis of ['x', 'z'] as const) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(axis === 'x' ? L : ROAD_W, axis === 'x' ? ROAD_W : L), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(axis === 'x' ? 0 : r, 0.01, axis === 'x' ? r : 0);
      (road.material as THREE.MeshStandardMaterial).map!.repeat.set(1, 1);
      add(road, false);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.4, L), lineMat);
      line.rotation.x = -Math.PI / 2;
      if (axis === 'x') line.rotation.z = Math.PI / 2;
      line.position.set(axis === 'x' ? 0 : r, 0.025, axis === 'x' ? r : 0);
      lineTex.repeat.set(1, L / 8);
      add(line, false);
    }
  }
  asphaltTex.repeat.set(L / 12, 1);
  // bike lane along z=0 road (north side) — green strip
  const bikeLane = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.6), new THREE.MeshStandardMaterial({ color: '#2f8f5b', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  bikeLane.rotation.x = -Math.PI / 2;
  bikeLane.position.set(0, 0.03, -HALF + 1.0);
  add(bikeLane, false);
  const bikeLane2 = bikeLane.clone();
  bikeLane2.rotation.z = Math.PI / 2;
  bikeLane2.position.set(-HALF + 1.0, 0.03, 0);
  add(bikeLane2, false);

  // crosswalks at intersections
  const zebraTex = canvasTex(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    g.fillStyle = '#f5f5f0';
    for (let i = 0; i < 8; i++) g.fillRect(8 + i * 31, 0, 18, 64);
  });
  const zebraMat = new THREE.MeshStandardMaterial({ map: zebraTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
  const zebraMs: THREE.Matrix4[] = [];
  for (const x of ROADS)
    for (const z of ROADS)
      for (const [dx, dz, rot] of [
        [0, HALF + 1.6, 0],
        [0, -HALF - 1.6, 0],
        [HALF + 1.6, 0, Math.PI / 2],
        [-HALF - 1.6, 0, Math.PI / 2],
      ])
        zebraMs.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(x + dx, 0.03, z + dz),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rot)),
            new THREE.Vector3(1, 1, 1),
          ),
        );
  const zebra = new THREE.InstancedMesh(new THREE.PlaneGeometry(ROAD_W - 1, 2.6), zebraMat, zebraMs.length);
  zebraMs.forEach((m, i) => zebra.setMatrixAt(i, m));
  add(zebra, false);

  // sidewalks: one slab per block
  const sideTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#c9c6c0';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#aaa69e';
    g.lineWidth = 2;
    for (let i = 0; i <= 128; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.moveTo(0, i);
      g.lineTo(128, i);
      g.stroke();
    }
  });
  sideTex.wrapS = sideTex.wrapT = THREE.RepeatWrapping;
  sideTex.repeat.set(17, 17);
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.95 });
  const blockSize = 80 - ROAD_W;
  const placeAt = new Map<string, Place>();
  for (const pl of PLACES) placeAt.set(pl.bx + ',' + pl.bz, pl);
  for (let bx = 0; bx < 6; bx++)
    for (let bz = 0; bz < 6; bz++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.16, blockSize), sideMat);
      s.position.set(blockCenter(bx), 0.08, blockCenter(bz));
      add(s, false);
      // walkable kerb: characters, the ball and parked cars stand on the sidewalk
      phys.addBox(blockCenter(bx), 0.08, blockCenter(bz), blockSize / 2, 0.08, blockSize / 2);
    }

  // ---------- materials for buildings ----------
  const facade = canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#e9e9e9';
    g.fillRect(0, 118, 128, 10);
    for (const x of [14, 74]) {
      g.fillStyle = '#5b6b7a';
      g.fillRect(x, 26, 40, 62);
      g.fillStyle = '#8fa4b8';
      g.fillRect(x + 3, 29, 34, 28);
      g.fillStyle = '#ffffff';
      g.fillRect(x - 3, 88, 46, 5);
    }
  });
  facade.wrapS = facade.wrapT = THREE.RepeatWrapping;
  const emissive = canvasTex(128, 128, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = Math.random() > 0.5 ? '#ffd58a' : '#000';
    g.fillRect(14, 26, 40, 62);
    g.fillStyle = Math.random() > 0.4 ? '#ffe1a6' : '#000';
    g.fillRect(74, 26, 40, 62);
  });
  emissive.wrapS = emissive.wrapT = THREE.RepeatWrapping;
  const roofMat = new THREE.MeshStandardMaterial({ color: '#55585e', roughness: 0.95 });
  const windowMats = cfg.palette.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, map: facade, emissiveMap: emissive, emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 0, roughness: 0.85 }),
  );

  const building = (x: number, z: number, w: number, d: number, h: number, mat: THREE.Material, rot = 0) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    boxUV(geo, w, h, d, 8, 4);
    const mesh = new THREE.Mesh(geo, [mat, mat, roofMat, roofMat, mat, mat]);
    mesh.position.set(x, h / 2, z);
    mesh.rotation.y = rot;
    add(mesh);
    phys.addBox(x, h / 2, z, w / 2, h / 2, d / 2, rot);
    // roof details
    if (h > 12 && rnd() > 0.4) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4, w / 3), 2, Math.min(4, d / 3)), roofMat);
      box.position.set(x + (rnd() - 0.5) * w * 0.4, h + 1, z + (rnd() - 0.5) * d * 0.4);
      add(box);
    }
    return mesh;
  };

  const trunks: THREE.Matrix4[] = [];
  const crowns: THREE.Matrix4[] = [];
  // ---------- filler buildings ----------
  for (let bx = 0; bx < 6; bx++)
    for (let bz = 0; bz < 6; bz++) {
      const pl = placeAt.get(bx + ',' + bz);
      const cx = blockCenter(bx);
      const cz = blockCenter(bz);
      if (pl) {
        // add side buildings behind small places to keep the city dense
        if (pl.interior && pl.w < 40) {
          for (const sx of [-1, 1]) {
            const w = 14;
            const h = cfg.heights[0] + rnd() * (cfg.heights[1] - cfg.heights[0]) * 0.7;
            building(cx + sx * 24, cz - 18, w, 20, h, windowMats[Math.floor(rnd() * windowMats.length)]);
          }
        }
        continue;
      }
      // 2x2 lots
      for (const ox of [-1, 1])
        for (const oz of [-1, 1]) {
          if (rnd() < 0.12) {
            // small square with trees
            tree(cx + ox * 16, cz + oz * 16, rnd);
            continue;
          }
          const w = 20 + rnd() * 10;
          const d = 20 + rnd() * 10;
          const h = cfg.heights[0] + rnd() * (cfg.heights[1] - cfg.heights[0]);
          building(cx + ox * 16, cz + oz * 16, w, d, h, windowMats[Math.floor(rnd() * windowMats.length)]);
        }
    }

  // ---------- trees (instanced) ----------
  function tree(x: number, z: number, r: () => number, scale = 1) {
    const s = (0.8 + r() * 0.6) * scale;
    trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 1.5 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)));
    crowns.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, 4 * s, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 3, r())),
        new THREE.Vector3(s * 1.1, s * (0.9 + r() * 0.3), s * 1.1),
      ),
    );
    phys.addCylinder(x, 1.5, z, 1.5, 0.3 * s);
  }
  // street trees along sidewalks
  for (let bx = 0; bx < 6; bx++)
    for (let bz = 0; bz < 6; bz++) {
      const cx = blockCenter(bx);
      const cz = blockCenter(bz);
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        if (rnd() > 0.55) tree(cx + i * 12, cz - blockSize / 2 + 1.6, rnd, 0.8);
        if (rnd() > 0.55) tree(cx - blockSize / 2 + 1.6, cz + i * 12, rnd, 0.8);
      }
    }

  // ---------- special places ----------
  const lampMat = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0.1 });
  const bikeSpot = { x: 0, z: 0 };
  const parkedSpots: CityBuild['parkedSpots'] = [];
  const benches: CityBuild['benches'] = [];
  let pitch = { cx: 0, cz: 0, hx: 30, hz: 19 };
  let training = { cx: 0, cz: 0 };
  const poleMat = new THREE.MeshStandardMaterial({ color: '#2b2e35', metalness: 0.5, roughness: 0.5 });
  const orange = new THREE.MeshStandardMaterial({ color: '#ff6a00', roughness: 0.6 });
  const graphite = new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: '#223344', roughness: 0.1, metalness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.6 });

  for (const pl of PLACES) {
    const cx = blockCenter(pl.bx);
    const cz = blockCenter(pl.bz);
    if (pl.interior) {
      const mat =
        pl.interior === 'home'
          ? new THREE.MeshStandardMaterial({ color: pl.color, map: facade, emissiveMap: emissive, emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 0, roughness: 0.85 })
          : windowMats[0].clone();
      mat.color.set(pl.color);
      windowMats.push(mat);
      building(cx, cz, pl.w, pl.d, pl.h, mat);
      // entrance: door, awning and sign
      const fz = cz + pl.d / 2;
      const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.3), glass);
      door.position.set(cx, 1.6, fz + 0.05);
      add(door);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 0.4), graphite);
      frame.position.set(cx, 3.3, fz + 0.1);
      add(frame);
      const awning = new THREE.Mesh(new THREE.BoxGeometry(Math.min(pl.w - 2, 14), 0.25, 2.4), pl.interior === 'home' ? graphite : orange);
      awning.position.set(cx, 4.0, fz + 1.2);
      add(awning);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTexture(pl.sign ?? pl.name.es.toUpperCase(), pl.interior === 'gamecenter' ? '#ff6a00' : '#16181c', '#ffffff'),
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.15,
      });
      signMat.emissiveMap = signMat.map;
      windowMats.push(signMat);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), signMat);
      sign.position.set(cx, Math.min(pl.h - 1.6, 6.4), fz + 0.06);
      add(sign, false);
      if (pl.interior === 'airport') buildAirport(cx, cz);
      if (pl.interior === 'station') buildStation(cx, cz);
      if (pl.interior === 'home') {
        // small garden & mailbox
        const hedge = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 1), new THREE.MeshStandardMaterial({ color: '#3f6f2a' }));
        hedge.position.set(cx - 7, 0.5, fz + 3);
        add(hedge);
        phys.addBox(cx - 7, 0.5, fz + 3, 3, 0.5, 0.5);
      }
    } else if (pl.area === 'park') {
      const grass = new THREE.Mesh(new THREE.PlaneGeometry(blockSize - 2, blockSize - 2), new THREE.MeshStandardMaterial({ map: grassTex.clone(), roughness: 1 }));
      (grass.material as THREE.MeshStandardMaterial).map!.repeat.set(12, 12);
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(cx, 0.18, cz);
      add(grass, false);
      const path = new THREE.Mesh(new THREE.RingGeometry(14, 17, 48), new THREE.MeshStandardMaterial({ color: '#d8c7a3', roughness: 1 }));
      path.rotation.x = -Math.PI / 2;
      path.position.set(cx, 0.2, cz);
      add(path, false);
      for (const [a, b] of [
        [0, 1],
        [1, 0],
      ]) {
        const pth = new THREE.Mesh(new THREE.PlaneGeometry(a ? blockSize - 2 : 3, b ? blockSize - 2 : 3), path.material);
        pth.rotation.x = -Math.PI / 2;
        pth.position.set(cx, 0.2, cz);
        add(pth, false);
      }
      const pond = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshStandardMaterial({ color: '#3d7fa8', roughness: 0.1, metalness: 0.3 }));
      pond.rotation.x = -Math.PI / 2;
      pond.position.set(cx + 20, 0.22, cz - 20);
      add(pond, false);
      phys.addCylinder(cx + 20, 0.5, cz - 20, 0.5, 8);
      const fountain = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 0.8, 24), white);
      fountain.position.set(cx, 0.4, cz);
      add(fountain);
      phys.addCylinder(cx, 0.4, cz, 0.4, 3.4);
      bikeSpot.x = cx - blockSize / 2 + 4;
      bikeSpot.z = cz + 6;
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2;
        const rr = 20 + rnd() * 12;
        const tx = cx + Math.cos(a) * rr;
        const tz = cz + Math.sin(a) * rr;
        if (Math.hypot(tx - bikeSpot.x, tz - bikeSpot.z) < 7) continue;
        tree(tx, tz, rnd, 1.1);
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        benches.push({ x: cx + Math.cos(a) * 12, z: cz + Math.sin(a) * 12, rot: -a + Math.PI / 2 });
      }
    } else if (pl.area === 'stadium') {
      pitch = { cx, cz, hx: 26, hz: 17 };
      buildPitch(cx, cz, 26, 17, true);
    } else if (pl.area === 'training') {
      training = { cx, cz };
      buildPitch(cx, cz, 22, 15, false);
      // cones
      const coneMat = new THREE.MeshStandardMaterial({ color: '#ff6a00' });
      for (let i = 0; i < 8; i++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 12), coneMat);
        c.position.set(cx - 14 + i * 4, 0.42, cz + (i % 2 ? 3 : -3));
        add(c);
      }
    } else if (pl.area === 'parking') {
      const lot = new THREE.Mesh(new THREE.PlaneGeometry(blockSize - 4, blockSize - 4), roadMat);
      lot.rotation.x = -Math.PI / 2;
      lot.position.set(cx, 0.18, cz);
      add(lot, false);
      const pline = new THREE.MeshStandardMaterial({ color: '#f5f5f0' });
      for (let row = -1; row <= 1; row += 2)
        for (let i = -5; i <= 5; i++) {
          const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5), pline);
          ln.rotation.x = -Math.PI / 2;
          ln.position.set(cx + i * 3, 0.21, cz + row * 14);
          add(ln, false);
          if (i < 5 && (i + row) % 3 !== 0) parkedSpots.push({ x: cx + i * 3 + 1.5, z: cz + row * 14, rot: row > 0 ? Math.PI : 0 });
        }
      const P = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshStandardMaterial({ map: signTexture('P', '#1f5fbf', '#fff') }));
      P.position.set(cx, 4, cz + blockSize / 2 - 2);
      add(P);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4), graphite);
      pole.position.set(cx, 2, cz + blockSize / 2 - 2.1);
      add(pole);
    } else if (pl.area === 'plaza') {
      const pav = new THREE.Mesh(new THREE.PlaneGeometry(blockSize - 2, blockSize - 2), new THREE.MeshStandardMaterial({ color: '#d7cbb5', roughness: 0.9 }));
      pav.rotation.x = -Math.PI / 2;
      pav.position.set(cx, 0.18, cz);
      add(pav, false);
      buildLandmark(cx, cz);
      for (let i = 0; i < 8; i++) tree(cx + (i < 4 ? -26 : 26), cz - 24 + (i % 4) * 16, rnd, 0.9);
    }
  }

  // ---------- beach ----------
  if (cfg.hasBeach) {
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(700, 60), new THREE.MeshStandardMaterial({ color: '#e9d5a8', roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.0, 276);
    add(sand, false);
    for (let i = 0; i < 18; i++) {
      const x = -260 + i * 30 + rnd() * 10;
      palm(x, 262 + rnd() * 8);
      if (i % 3 === 0) umbrella(x + 6, 280 + rnd() * 6);
    }
  }
  const waterMat = new THREE.MeshStandardMaterial({ color: cfg.hasBeach ? '#2f7fb0' : '#4a8f5a', roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.92 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 400), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, cfg.hasBeach ? -0.05 : 0.0, cfg.hasBeach ? 506 : 560);
  if (cfg.hasBeach) add(water, false);
  // invisible world bounds
  phys.addBox(0, 5, WORLD - 20 + (cfg.hasBeach ? 0 : 0), WORLD, 10, 1);
  phys.addBox(0, 5, -WORLD, WORLD, 10, 1);
  phys.addBox(-WORLD, 5, 0, 1, 10, WORLD);
  phys.addBox(WORLD + 260, 5, 0, 1, 10, WORLD);
  phys.addBox(WORLD + 130, 5, -60, 130, 10, 1);
  phys.addBox(WORLD + 130, 5, 200, 130, 10, 1);

  // ---------- street lamps & traffic lights ----------
  const lampGeo = new THREE.CylinderGeometry(0.06, 0.08, 6, 6);
  const headGeo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
  const lampPoles: THREE.Matrix4[] = [];
  const lampHeads: THREE.Matrix4[] = [];
  for (const r of ROADS)
    for (let t = -230; t <= 230; t += 40) {
      for (const [x, z] of [
        [r + HALF + 0.6, t + 20],
        [t + 20, r + HALF + 0.6],
      ]) {
        lampPoles.push(new THREE.Matrix4().makeTranslation(x, 3, z));
        lampHeads.push(new THREE.Matrix4().makeTranslation(x, 6, z));
      }
    }
  const poles = new THREE.InstancedMesh(lampGeo, poleMat, lampPoles.length);
  lampPoles.forEach((m, i) => poles.setMatrixAt(i, m));
  add(poles, false);
  const heads = new THREE.InstancedMesh(headGeo, lampMat, lampHeads.length);
  lampHeads.forEach((m, i) => heads.setMatrixAt(i, m));
  add(heads, false);

  // traffic lights: all intersections share one global cycle per axis, so the
  // lamp materials are shared and everything can be instanced.
  const mkLamp = (c: string) => new THREE.MeshStandardMaterial({ color: '#222', emissive: new THREE.Color(c), emissiveIntensity: 0 });
  const lights: TrafficLights = {
    x: { red: mkLamp('#ff2a1a'), yellow: mkLamp('#ffb300'), green: mkLamp('#21e05a') },
    z: { red: mkLamp('#ff2a1a'), yellow: mkLamp('#ffb300'), green: mkLamp('#21e05a') },
  };
  const housing = new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.5 });
  const tlPole: THREE.Matrix4[] = [];
  const tlBox: THREE.Matrix4[] = [];
  const tlLamp: Record<'x' | 'z', [THREE.Matrix4[], THREE.Matrix4[], THREE.Matrix4[]]> = { x: [[], [], []], z: [[], [], []] };
  for (const x of ROADS)
    for (const z of ROADS) {
      // corners: light facing traffic that moves along x (faces -x/+x) and along z
      const corners: [number, number, number, 'x' | 'z'][] = [
        [-HALF - 0.6, HALF + 0.6, -Math.PI / 2, 'x'],
        [HALF + 0.6, -HALF - 0.6, Math.PI / 2, 'x'],
        [HALF + 0.6, HALF + 0.6, 0, 'z'],
        [-HALF - 0.6, -HALF - 0.6, Math.PI, 'z'],
      ];
      for (const [dx, dz, rot, axis] of corners) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        const base = new THREE.Vector3(x + dx, 0, z + dz);
        const one = new THREE.Vector3(1, 1, 1);
        tlPole.push(new THREE.Matrix4().compose(base.clone().setY(1.6), q, one));
        tlBox.push(new THREE.Matrix4().compose(base.clone().setY(3.5), q, one));
        [3.82, 3.5, 3.18].forEach((y, i) => {
          const off = new THREE.Vector3(0, y, 0.16).applyQuaternion(q);
          tlLamp[axis][i].push(new THREE.Matrix4().compose(base.clone().add(off), q, one));
        });
      }
    }
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material, ms: THREE.Matrix4[]) => {
    const im = new THREE.InstancedMesh(geo, mat, ms.length);
    ms.forEach((m, i) => im.setMatrixAt(i, m));
    add(im, false);
  };
  inst(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6), poleMat, tlPole);
  inst(new THREE.BoxGeometry(0.35, 1.0, 0.3), housing, tlBox);
  const disc = new THREE.CircleGeometry(0.11, 12);
  for (const axis of ['x', 'z'] as const) {
    inst(disc, lights[axis].red, tlLamp[axis][0]);
    inst(disc, lights[axis].yellow, tlLamp[axis][1]);
    inst(disc, lights[axis].green, tlLamp[axis][2]);
  }

  // instanced trees
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 3, 7), new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 1 }), trunks.length);
  trunks.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
  add(trunkMesh);
  const crownMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.1, 1), new THREE.MeshStandardMaterial({ color: '#4f7f35', roughness: 0.95, flatShading: true }), crowns.length);
  crowns.forEach((m, i) => {
    crownMesh.setMatrixAt(i, m);
    crownMesh.setColorAt(i, new THREE.Color().setHSL(0.25 + rnd() * 0.06, 0.45, 0.3 + rnd() * 0.1));
  });
  add(crownMesh);

  // ---------- helpers ----------
  function buildPitch(cx: number, cz: number, hx: number, hz: number, stadium: boolean) {
    const tex = canvasTex(1024, 640, (g) => {
      for (let i = 0; i < 12; i++) {
        g.fillStyle = i % 2 ? '#3f8f3a' : '#47a042';
        g.fillRect((i * 1024) / 12, 0, 1024 / 12 + 1, 640);
      }
      g.strokeStyle = '#ffffff';
      g.lineWidth = 6;
      g.strokeRect(12, 12, 1000, 616);
      g.beginPath();
      g.moveTo(512, 12);
      g.lineTo(512, 628);
      g.stroke();
      g.beginPath();
      g.arc(512, 320, 80, 0, Math.PI * 2);
      g.stroke();
      g.strokeRect(12, 170, 150, 300);
      g.strokeRect(862, 170, 150, 300);
      g.strokeRect(12, 250, 55, 140);
      g.strokeRect(957, 250, 55, 140);
      g.fillStyle = '#fff';
      for (const x of [112, 912]) {
        g.beginPath();
        g.arc(x, 320, 6, 0, Math.PI * 2);
        g.fill();
      }
    });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(hx * 2 + 2, hz * 2 + 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    field.rotation.x = -Math.PI / 2;
    field.position.set(cx, 0.18, cz);
    add(field, false);
    // goals along x ends
    for (const side of [-1, 1]) goal(cx + side * (hx + 0.2), cz, side);
    if (stadium) {
      const standMat = new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.8 });
      const seatMat = new THREE.MeshStandardMaterial({ color: '#ff6a00', roughness: 0.7 });
      const tiers = 5;
      // long sides (z) and short sides (x), leaving a gap in the south side for the entrance
      const sides: [number, number, number, number, number][] = [
        [cx, cz - hz - 4, hx * 2 + 4, 0, 0],
        [cx - hx - 4.5, cz, hz * 2 + 2, Math.PI / 2, 0],
        [cx + hx + 4.5, cz, hz * 2 + 2, -Math.PI / 2, 0],
        [cx - hx / 2 - 6, cz + hz + 4, hx - 8, Math.PI, 0],
        [cx + hx / 2 + 6, cz + hz + 4, hx - 8, Math.PI, 0],
      ];
      for (const [sx, sz, len, rot] of sides) {
        const st = new THREE.Group();
        for (let t = 0; t < tiers; t++) {
          // one solid block per tier (no overlapping faces -> no flicker)
          const h = 0.9 + t * 0.9;
          const block = new THREE.Mesh(new THREE.BoxGeometry(len, h, 1.3), standMat);
          block.position.set(0, h / 2, -t * 1.3);
          st.add(block);
          // seat row sitting clearly on top of the step
          const seats = new THREE.Mesh(new THREE.BoxGeometry(len - 0.4, 0.28, 0.55), seatMat);
          seats.position.set(0, h + 0.14, -t * 1.3 - 0.25);
          st.add(seats);
        }
        st.position.set(sx, 0, sz);
        st.rotation.y = rot;
        add(st);
        const off = new THREE.Vector3(0, 0, -2.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        const isX = Math.abs(Math.sin(rot)) > 0.5;
        phys.addBox(sx + off.x, 2.3, sz + off.z, isX ? 3.4 : len / 2, 2.3, isX ? len / 2 : 3.4);
      }
      // floodlights
      for (const [fx, fz] of [
        [cx - hx - 7, cz - hz - 7],
        [cx + hx + 7, cz - hz - 7],
        [cx - hx - 7, cz + hz + 7],
        [cx + hx + 7, cz + hz + 7],
      ]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 22, 8), poleMat);
        pole.position.set(fx, 11, fz);
        add(pole);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.4), lampMat);
        panel.position.set(fx, 22, fz);
        panel.lookAt(cx, 0, cz);
        add(panel);
        phys.addCylinder(fx, 11, fz, 11, 0.35);
      }
      // scoreboard
      const sb = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), new THREE.MeshStandardMaterial({ map: signTexture('ESTADIO RAZ 7', '#16181c', '#ff6a00'), emissive: '#ffffff', emissiveIntensity: 0.2 }));
      sb.position.set(cx, 9, cz - hz - 10.6);
      add(sb, false);
    }
  }

  function goal(x: number, z: number, side: number) {
    const postMat = white;
    const gw = 3.66;
    const gh = 2.44;
    const depth = 1.6;
    const g = new THREE.Group();
    const r = 0.06;
    const post = (px: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gh, 8), postMat);
      m.position.set(px, gh / 2, pz);
      g.add(m);
    };
    post(0, -gw);
    post(0, gw);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gw * 2, 8), postMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, gh, 0);
    g.add(bar);
    const netMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, wireframe: true });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(gw * 2, gh, 14, 6), netMat);
    back.position.set(side * depth, gh / 2, 0);
    back.rotation.y = Math.PI / 2;
    g.add(back);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(depth, gw * 2, 4, 14), netMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set((side * depth) / 2, gh, 0);
    g.add(top);
    for (const s of [-1, 1]) {
      const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(depth, gh, 4, 6), netMat);
      sideNet.position.set((side * depth) / 2, gh / 2, s * gw);
      g.add(sideNet);
    }
    g.position.set(x, 0.16, z);
    add(g, true, false);
    // colliders: posts, crossbar, back and sides (thin)
    phys.addCylinder(x, gh / 2, z - gw, gh / 2, r);
    phys.addCylinder(x, gh / 2, z + gw, gh / 2, r);
    phys.addBox(x, gh, z, r, r, gw);
    phys.addBox(x + side * depth, gh / 2, z, 0.05, gh / 2, gw);
    phys.addBox(x + (side * depth) / 2, gh / 2, z - gw, depth / 2, gh / 2, 0.05);
    phys.addBox(x + (side * depth) / 2, gh / 2, z + gw, depth / 2, gh / 2, 0.05);
    phys.addBox(x + (side * depth) / 2, gh + 0.05, z, depth / 2, 0.05, gw);
  }

  function palm(x: number, z: number) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 7, 8), new THREE.MeshStandardMaterial({ color: '#8a6b47' }));
    trunk.position.y = 3.5;
    trunk.rotation.z = 0.08;
    g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#3f7f3a', side: THREE.DoubleSide, roughness: 0.9 });
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), leafMat);
      leaf.position.set(0.3, 7, 0);
      leaf.rotation.set(-1.0, (i / 7) * Math.PI * 2, 0, 'YXZ');
      leaf.translateY(1.5);
      g.add(leaf);
    }
    g.position.set(x, 0, z);
    add(g);
    phys.addCylinder(x, 3.5, z, 3.5, 0.3);
  }
  function umbrella(x: number, z: number) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6), white);
    pole.position.y = 1.3;
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 12, 1, true), rnd() > 0.5 ? orange : white);
    top.position.y = 2.6;
    const towel = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshStandardMaterial({ color: rnd() > 0.5 ? '#2f7fb0' : '#ff6a00' }));
    towel.rotation.x = -Math.PI / 2;
    towel.position.set(1.4, 0.02, 0);
    g.add(pole, top, towel);
    g.position.set(x, 0, z);
    add(g);
  }

  function buildAirport(cx: number, cz: number) {
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(280, 34), roadMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(400, 0.02, cz);
    add(runway, false);
    const stripes = new THREE.Mesh(new THREE.PlaneGeometry(260, 0.8), new THREE.MeshStandardMaterial({ color: '#f5f5f0' }));
    stripes.rotation.x = -Math.PI / 2;
    stripes.position.set(400, 0.04, cz);
    add(stripes, false);
    // aircraft
    const plane = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(2, 22, 8, 16), white);
    body.rotation.z = Math.PI / 2;
    body.position.y = 3.2;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 26), white);
    wing.position.set(1, 2.8, 0);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.3), orange);
    tail.position.set(-11, 6, 0);
    const stab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 9), white);
    stab.position.set(-11, 3.8, 0);
    const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(2.02, 22, 8, 16, 1), new THREE.MeshStandardMaterial({ color: '#ff6a00' }));
    stripe.rotation.z = Math.PI / 2;
    stripe.scale.set(1, 1, 0.2);
    stripe.position.y = 2.6;
    for (const s of [-1, 1]) {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 12), graphite);
      eng.rotation.z = Math.PI / 2;
      eng.position.set(2, 2.0, s * 6);
      plane.add(eng);
    }
    plane.add(body, wing, tail, stab, stripe);
    plane.position.set(330, 0, cz + 0);
    add(plane);
    phys.addBox(330, 3, cz, 13, 3, 2.2);
    phys.addBox(331, 2.8, cz, 2.5, 0.4, 13);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 24, 10), white);
    tower.position.set(cx + 20, 12, cz - 26);
    add(tower);
  }

  function buildStation(cx: number, cz: number) {
    const railZ = cz - 22;
    const sleeperMat = new THREE.MeshStandardMaterial({ color: '#5a4636' });
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.12, 3), sleeperMat, 220);
    for (let i = 0; i < 220; i++) sleepers.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-330 + i * 3, 0.15, railZ));
    add(sleepers, false);
    for (const s of [-0.75, 0.75]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(660, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: '#8d9399', metalness: 0.8, roughness: 0.3 }));
      rail.position.set(0, 0.25, railZ + s);
      add(rail, false);
    }
    // train
    const train = new THREE.Group();
    for (let c = 0; c < 3; c++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(18, 3.6, 3.2), c === 0 ? orange : white);
      car.position.set(c * 19, 2.2, 0);
      const win = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 3.25), glass);
      win.position.set(c * 19, 2.8, 0);
      train.add(car, win);
    }
    train.position.set(cx - 18, 0, railZ);
    add(train);
    phys.addBox(cx - 18 + 19, 2.2, railZ, 29, 1.8, 1.6);
  }

  function buildLandmark(cx: number, cz: number) {
    const stone = new THREE.MeshStandardMaterial({ color: '#d8c8a8', roughness: 0.85 });
    const g = new THREE.Group();
    switch (cfg.landmark) {
      case 'arch': {
        for (const s of [-1, 1]) {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), stone);
          pier.position.set(s * 5, 6, 0);
          g.add(pier);
          phys.addBox(cx + s * 5, 6, cz, 1.5, 6, 1.5);
        }
        const top = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 3.4), stone);
        top.position.y = 13.5;
        g.add(top);
        break;
      }
      case 'cathedral': {
        for (let i = 0; i < 4; i++) {
          const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 26 + i * 3, 10), stone);
          spire.position.set(-6 + i * 4, 13 + i * 1.5, 0);
          g.add(spire);
        }
        phys.addBox(cx, 8, cz, 9, 8, 2);
        break;
      }
      case 'giralda': {
        const t = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), new THREE.MeshStandardMaterial({ color: '#e0b47a' }));
        t.position.y = 15;
        const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 6, 3.6), white);
        top.position.y = 33;
        g.add(t, top);
        phys.addBox(cx, 15, cz, 2.5, 15, 2.5);
        break;
      }
      case 'lighthouse': {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 22, 16), white);
        t.position.y = 11;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 3, 16), orange);
        band.position.y = 12;
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), lampMat);
        lamp.position.y = 23;
        g.add(t, band, lamp);
        phys.addCylinder(cx, 11, cz, 11, 2.4);
        break;
      }
      case 'museum': {
        const metal = new THREE.MeshStandardMaterial({ color: '#c0c6cc', metalness: 0.9, roughness: 0.25 });
        for (let i = 0; i < 6; i++) {
          const blob = new THREE.Mesh(new THREE.SphereGeometry(4 + rnd() * 3, 16, 12), metal);
          blob.scale.set(1.4, 0.8 + rnd(), 1);
          blob.position.set(-8 + i * 3.2, 4 + rnd() * 4, (rnd() - 0.5) * 6);
          g.add(blob);
        }
        phys.addBox(cx, 5, cz, 12, 5, 6);
        break;
      }
      case 'arts': {
        const shell = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), white);
        shell.scale.set(1.8, 1, 1);
        const fin = new THREE.Mesh(new THREE.TorusGeometry(10, 0.6, 8, 32, Math.PI), white);
        fin.position.y = 0.5;
        fin.scale.set(1.6, 1.1, 1);
        g.add(shell, fin);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), new THREE.MeshStandardMaterial({ color: '#4fb4d8', roughness: 0.05, metalness: 0.2 }));
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, 0.15, 14);
        g.add(pool);
        phys.addBox(cx, 4, cz, 15, 4, 8);
        break;
      }
      case 'tower': {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 18, 12), stone);
        t.position.y = 9;
        const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), orange);
        dome.position.y = 18;
        g.add(t, dome);
        phys.addCylinder(cx, 9, cz, 9, 3.5);
        break;
      }
    }
    g.position.set(cx, 0.16, cz);
    add(g);
  }

  group.updateMatrixWorld(true);
  return { group, lampMat, windowMats, lights, pitch, training, parkedSpots, benches, bikeSpot, waterMat };
}
