// Builds walk-in interiors. They live far from the city (x≥1000) and the
// player is teleported in/out through doors.
import * as THREE from 'three';
import type { Physics } from './physics';
import type { InteriorKind } from '../data/places';
import type { Interactable, NpcSpawn } from './types';
import { PRODUCTS } from '../data/products';
import { canvasTex, signTexture } from './util';
import { MINIGAMES } from '../data/minigames';

export interface Room {
  kind: InteriorKind;
  origin: THREE.Vector3;
  spawn: THREE.Vector3;
  w: number;
  d: number;
  floor: string;
  wall: string;
}

export interface InteriorBuild {
  rooms: Map<InteriorKind, Room>;
  interactables: Interactable[];
  npcs: NpcSpawn[];
  decor: Map<string, THREE.Object3D>;
  cinemaScreen: THREE.MeshStandardMaterial;
}

const KINDS: { kind: InteriorKind; w: number; d: number; floor: string; wall: string }[] = [
  { kind: 'home', w: 16, d: 14, floor: '#a47a52', wall: '#efe6da' },
  { kind: 'supermarket', w: 34, d: 26, floor: '#dcdcdc', wall: '#f4f4f4' },
  { kind: 'cafe', w: 18, d: 16, floor: '#8a5a3c', wall: '#f1e3cf' },
  { kind: 'restaurant', w: 22, d: 18, floor: '#6b3f2a', wall: '#e9d6c0' },
  { kind: 'sportshop', w: 22, d: 18, floor: '#2b2e35', wall: '#f4f4f4' },
  { kind: 'mall', w: 40, d: 30, floor: '#e7e2da', wall: '#f7f7f7' },
  { kind: 'gym', w: 24, d: 20, floor: '#33363c', wall: '#d9dde2' },
  { kind: 'cinema', w: 22, d: 24, floor: '#3a1b22', wall: '#2a1218' },
  { kind: 'school', w: 20, d: 16, floor: '#c9b38f', wall: '#f4ecd9' },
  { kind: 'workshop', w: 24, d: 20, floor: '#6f747a', wall: '#b7bec5' },
  { kind: 'gamecenter', w: 30, d: 24, floor: '#141826', wall: '#1f2a44' },
  { kind: 'academy', w: 24, d: 18, floor: '#2b2e35', wall: '#e9e9e9' },
  { kind: 'airport', w: 40, d: 28, floor: '#e8ecef', wall: '#f7f9fb' },
  { kind: 'station', w: 34, d: 20, floor: '#c8bba6', wall: '#efe6d6' },
];

export function buildInteriors(scene: THREE.Scene, phys: Physics, shadows: boolean): InteriorBuild {
  const rooms = new Map<InteriorKind, Room>();
  const interactables: Interactable[] = [];
  const npcs: NpcSpawn[] = [];
  const decor = new Map<string, THREE.Object3D>();
  const group = new THREE.Group();
  group.name = 'interiors';
  scene.add(group);
  const mat = (c: string, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const orange = mat('#ff6a00', 0.6);
  const graphite = mat('#2b2e35', 0.6);
  const white = mat('#f4f4f4');
  const wood = mat('#8b5e3c');
  const metal = mat('#9aa1a8', 0.35, 0.7);
  const cinemaScreen = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#ffffff', emissiveIntensity: 0.8 });

  const box = (parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, collide = true, ox = 0, oz = 0) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    me.position.set(x, y, z);
    me.castShadow = shadows;
    me.receiveShadow = true;
    parent.add(me);
    if (collide) phys.addBox(ox + x, y, oz + z, w / 2, h / 2, d / 2);
    return me;
  };

  KINDS.forEach((k, i) => {
    const origin = new THREE.Vector3(1000 + i * 80, 0, 1000);
    const g = new THREE.Group();
    g.position.copy(origin);
    group.add(g);
    const H = k.kind === 'airport' || k.kind === 'mall' ? 9 : 5;
    const ox = origin.x;
    const oz = origin.z;
    const B = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, c = true) => box(g, w, h, d, m, x, y, z, c, ox, oz);

    // floor texture with tiles
    const floorTex = canvasTex(128, 128, (c) => {
      c.fillStyle = k.floor;
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = 'rgba(0,0,0,0.12)';
      c.lineWidth = 2;
      c.strokeRect(0, 0, 64, 64);
      c.strokeRect(64, 64, 64, 64);
      c.strokeRect(64, 0, 64, 64);
      c.strokeRect(0, 64, 64, 64);
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(k.w / 4, k.d / 4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(k.w, k.d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    g.add(floor);
    const wallMat = mat(k.wall, 0.9);
    // walls (with colliders)
    B(k.w, H, 0.3, wallMat, 0, H / 2, -k.d / 2);
    B(k.w, H, 0.3, wallMat, 0, H / 2, k.d / 2);
    B(0.3, H, k.d, wallMat, -k.w / 2, H / 2, 0);
    B(0.3, H, k.d, wallMat, k.w / 2, H / 2, 0);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(k.w, k.d), mat('#fafafa'));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    g.add(ceil);
    phys.addBox(ox, H + 0.2, oz, k.w / 2, 0.2, k.d / 2);
    // solid floor (the city ground does not reach the interiors)
    phys.addBox(ox, -0.25, oz, k.w / 2 + 1, 0.25, k.d / 2 + 1);
    // ceiling lights strips
    for (let x = -k.w / 2 + 4; x < k.w / 2 - 2; x += 6) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, k.d * 0.7), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff7e0', emissiveIntensity: 1 }));
      strip.position.set(x, H - 0.05, 0);
      g.add(strip);
    }
    // exit door (south wall)
    B(2.4, 3, 0.2, mat('#223344', 0.2, 0.4), 0, 1.5, k.d / 2 - 0.2, false);
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshStandardMaterial({ map: signTexture('SALIDA', '#1d8f3a', '#fff'), emissive: '#ffffff', emissiveIntensity: 0.4 }));
    (exitSign.material as THREE.MeshStandardMaterial).emissiveMap = (exitSign.material as THREE.MeshStandardMaterial).map;
    exitSign.position.set(0, 3.4, k.d / 2 - 0.35);
    exitSign.rotation.y = Math.PI;
    g.add(exitSign);
    const room: Room = { kind: k.kind, origin, spawn: new THREE.Vector3(ox, 0.1, oz + k.d / 2 - 2.2), w: k.w, d: k.d, floor: k.floor, wall: k.wall };
    rooms.set(k.kind, room);
    const at = (x: number, z: number, y = 1) => new THREE.Vector3(ox + x, y, oz + z);
    const inter = (id: string, x: number, z: number, label: Interactable['label'], action: Interactable['action'], r = 1.8, mesh?: THREE.Object3D) =>
      interactables.push({ id, pos: at(x, z), r, label, action, mesh, interior: k.kind });
    const npc = (npcId: string, x: number, z: number, yaw = 0, sit = false) => npcs.push({ npcId, x: ox + x, z: oz + z, yaw, interior: k.kind, sit });
    inter(k.kind + '_exit', 0, k.d / 2 - 1, { es: 'Salir a la calle', hy: 'Դուրս գալ փողոց' }, { type: 'exit' }, 1.6);

    const wallSign = (text: string, x: number, y: number, z: number, rotY = 0, w = 6, bg = '#16181c', fg = '#ff6a00') => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: signTexture(text, bg, fg) }));
      s.position.set(x, y, z);
      s.rotation.y = rotY;
      g.add(s);
    };

    switch (k.kind) {
      case 'home': {
        // bed
        B(2.2, 0.5, 3.4, wood, -5.5, 0.25, -4.5);
        B(2.0, 0.25, 3.2, mat('#ff6a00', 0.9), -5.5, 0.6, -4.5, false);
        B(1.6, 0.2, 0.6, white, -5.5, 0.8, -5.8, false);
        inter('bed', -5.5, -3.0, { es: 'Dormir hasta mañana', hy: 'Քնել մինչև առավոտ' }, { type: 'bed' });
        // desk & chair
        B(2.4, 0.08, 1.0, wood, 4.5, 0.8, -6.0);
        for (const [x, z] of [[3.4, -5.6], [5.6, -5.6], [3.4, -6.4], [5.6, -6.4]]) B(0.08, 0.8, 0.08, graphite, x, 0.4, z, false);
        B(0.8, 0.5, 0.6, mat('#3a3d44'), 4.5, 0.75, -6.3, false);
        // wardrobe
        const wd = B(2.4, 2.6, 0.8, mat('#e3d7c4'), 7.4 - 0.6, 1.3, -1, true);
        wd.rotation.y = Math.PI / 2;
        inter('wardrobe', 6.0, -1, { es: 'Abrir el armario', hy: 'Բացել զգեստապահարանը' }, { type: 'wardrobe' });
        // sofa
        B(3.2, 0.5, 1.0, mat('#3a3d44'), -4, 0.25, 3.5);
        B(3.2, 0.8, 0.3, mat('#3a3d44'), -4, 0.6, 4.0, false);
        // kitchen counter
        B(4.0, 0.95, 0.8, white, 4, 0.47, 3.8);
        B(4.0, 0.06, 0.85, graphite, 4, 0.97, 3.8, false);
        // collectibles for mission 2
        const bag = B(0.7, 0.4, 0.35, mat('#16181c'), -2.5, 0.2, -5.5, false);
        const strap = B(0.72, 0.06, 0.37, orange, -2.5, 0.38, -5.5, false);
        bag.add(strap);
        strap.position.set(0, 0.18, 0);
        inter('item_mochila', -2.5, -5.5, { es: 'Tomar la mochila de deporte', hy: 'Վերցնել մարզական պայուսակը' }, { type: 'item', id: 'mochila' }, 1.6, bag);
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 12), mat('#7ec8f0', 0.1));
        bottle.position.set(3.2, 1.14, 3.8);
        g.add(bottle);
        inter('item_agua', 3.2, 3.8, { es: 'Tomar la botella de agua', hy: 'Վերցնել ջրի շիշը' }, { type: 'item', id: 'agua' }, 1.6, bottle);
        const boots = new THREE.Group();
        for (const s of [-0.12, 0.12]) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.27), orange);
          b.position.x = s;
          boots.add(b);
        }
        boots.position.set(6.5, 0.05, 4.8);
        g.add(boots);
        inter('item_botas', 6.5, 4.8, { es: 'Tomar las botas de fútbol', hy: 'Վերցնել ֆուտբոլային բութսերը' }, { type: 'item', id: 'botas' }, 1.6, boots);
        npc('mama', 2.5, 2.5, Math.PI);
        // purchasable decor
        const poster = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), new THREE.MeshStandardMaterial({ map: signTexture('ESTADIO 7', '#ff6a00', '#16181c') }));
        poster.position.set(-2, 2.4, -6.84);
        g.add(poster);
        decor.set('room_poster', poster);
        const lamp = new THREE.Group();
        const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), graphite);
        lb.position.y = 0.75;
        const ls = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#ff6a00', emissive: '#ff6a00', emissiveIntensity: 0.6, side: THREE.DoubleSide }));
        ls.position.y = 1.6;
        lamp.add(lb, ls);
        lamp.position.set(6.6, 0, -6);
        g.add(lamp);
        decor.set('room_lamp', lamp);
        const trophy = new THREE.Group();
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.4), wood);
        shelf.position.y = 1.8;
        trophy.add(shelf);
        for (let t = 0; t < 3; t++) {
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.3, 12), mat('#e0b23a', 0.2, 0.9));
          cup.position.set(-0.7 + t * 0.7, 2.0, 0);
          trophy.add(cup);
        }
        trophy.position.set(2.5, 0, -6.7);
        g.add(trophy);
        decor.set('room_trophy', trophy);
        const plant = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 12), white);
        pot.position.y = 0.25;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), mat('#3f7f35', 0.9));
        leaves.position.y = 1.0;
        plant.add(pot, leaves);
        plant.position.set(-7, 0, 1);
        g.add(plant);
        decor.set('room_plant', plant);
        const rug = new THREE.Mesh(
          new THREE.CircleGeometry(1.6, 32),
          new THREE.MeshStandardMaterial({
            map: canvasTex(128, 128, (c) => {
              c.fillStyle = '#f4f4f4';
              c.fillRect(0, 0, 128, 128);
              c.fillStyle = '#16181c';
              for (let a = 0; a < 6; a++) {
                c.beginPath();
                c.arc(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34, 12, 0, Math.PI * 2);
                c.fill();
              }
            }),
          }),
        );
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.02, -1);
        g.add(rug);
        decor.set('room_rug', rug);
        const tv = B(2.4, 1.4, 0.1, mat('#0b0b0b', 0.2), -4, 1.8, 6.8, false);
        decor.set('room_tv', tv);
        break;
      }
      case 'supermarket': {
        wallSign('SUPERMERCADO', 0, 4, -k.d / 2 + 0.2, 0, 10);
        // shelves (aisles)
        const shelfMat = mat('#d0d4d8', 0.5, 0.3);
        const aisles = 4;
        let pi = 0;
        for (let a = 0; a < aisles; a++) {
          const x = -12 + a * 8;
          B(1.2, 2.0, 12, shelfMat, x, 1.0, -3);
          for (const y of [0.55, 1.15, 1.75]) B(1.3, 0.05, 11.96, mat('#9aa1a8'), x, y, -3, false);
          const shelfName = PRODUCTS[Math.min(pi, PRODUCTS.length - 1)].shelf;
          const s = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.7), new THREE.MeshStandardMaterial({ map: signTexture(shelfName.es.toUpperCase(), '#ff6a00', '#fff') }));
          s.position.set(x, 3.0, 3.1);
          g.add(s);
          for (let side = -1; side <= 1; side += 2)
            for (let j = 0; j < 3 && pi < PRODUCTS.length; j++) {
              const p = PRODUCTS[pi++];
              const z = -7 + j * 4;
              const geo =
                p.shape === 'bottle'
                  ? new THREE.CylinderGeometry(0.08, 0.08, 0.3, 10)
                  : p.shape === 'round'
                    ? new THREE.SphereGeometry(0.12, 10, 8)
                    : p.shape === 'long'
                      ? new THREE.CapsuleGeometry(0.06, 0.3, 4, 8)
                      : new THREE.BoxGeometry(0.22, 0.28, 0.16);
              const grp = new THREE.Group();
              for (let n = 0; n < 6; n++) {
                const m = new THREE.Mesh(geo, mat(p.color, 0.5));
                m.position.set(side * 0.45, [0.72, 1.32, 1.92][n % 3], -0.6 + Math.floor(n / 3) * 1.2);
                if (p.shape === 'long') m.rotation.z = Math.PI / 2;
                grp.add(m);
              }
              grp.position.set(x, 0, z);
              g.add(grp);
              const tag = new THREE.Mesh(
                new THREE.PlaneGeometry(1.4, 0.35),
                new THREE.MeshStandardMaterial({ map: signTexture(p.price.toFixed(2).replace('.', ',') + ' €', '#fff', '#c0392b') }),
              );
              tag.position.set(x + side * 0.66, 0.4, z);
              tag.rotation.y = side * (Math.PI / 2);
              g.add(tag);
              inter('prod_' + p.id, x + side * 1.4, z, { es: `Tomar ${p.name.es} (${p.price.toFixed(2).replace('.', ',')} €)`, hy: `Վերցնել ${p.name.hy} (${p.price.toFixed(2)} €)` }, { type: 'product', id: p.id }, 1.5);
            }
        }
        // stack of shopping baskets at the entrance
        const stack = new THREE.Group();
        const bmat = mat('#ff6a00', 0.55);
        for (let i = 0; i < 6; i++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.24), bmat);
          b.position.y = 0.07 + i * 0.07;
          b.castShadow = true;
          stack.add(b);
        }
        stack.position.set(-4, 0, 10.5);
        g.add(stack);
        const cestaSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshStandardMaterial({ map: signTexture('CESTAS', '#ff6a00', '#fff') }));
        cestaSign.position.set(-4, 1.1, 10.36);
        cestaSign.rotation.y = Math.PI;
        g.add(cestaSign);
        inter('basket_stack', -4, 9.8, { es: 'Tomar una cesta', hy: 'Վերցնել զամբյուղ' }, { type: 'basket' }, 1.6);
        // checkout
        B(4, 1.0, 1.2, graphite, 10, 0.5, 8);
        B(1.2, 0.08, 1.2, mat('#111'), 9, 1.04, 8, false);
        npc('cajera', 10, 9.4, Math.PI);
        inter('checkout', 10, 6.6, { es: 'Ir a la caja y pagar', hy: 'Գնալ դրամարկղ և վճարել' }, { type: 'checkout' }, 2);
        break;
      }
      case 'cafe':
      case 'restaurant': {
        const isCafe = k.kind === 'cafe';
        wallSign(isCafe ? 'CAFETERÍA' : 'RESTAURANTE', 0, 3.6, -k.d / 2 + 0.2, 0, 7, '#16181c', '#ffb36b');
        // counter
        B(8, 1.1, 1.0, wood, 0, 0.55, -k.d / 2 + 2.5);
        B(8.2, 0.06, 1.1, mat('#e9e2d6', 0.3), 0, 1.135, -k.d / 2 + 2.5, false);
        // menu board
        const board = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 2.4),
          new THREE.MeshStandardMaterial({
            map: canvasTex(512, 300, (c) => {
              c.fillStyle = '#1d2b22';
              c.fillRect(0, 0, 512, 300);
              c.fillStyle = '#fff';
              c.font = '700 34px Inter, Arial';
              c.fillText('MENÚ', 200, 44);
              c.font = '24px Inter, Arial';
              const items = isCafe
                ? ['Café con leche ..... 1,50 €', 'Zumo de naranja ..... 2,00 €', 'Bocadillo de pollo ..... 3,50 €', 'Tostada con tomate ..... 2,20 €', 'Chocolate con churros ..... 3,00 €']
                : ['Paella valenciana ..... 12,00 €', 'Tortilla de patatas ..... 6,50 €', 'Ensalada mixta ..... 5,00 €', 'Pescado a la plancha ..... 11,00 €', 'Flan casero ..... 3,50 €'];
              items.forEach((t, i2) => c.fillText(t, 30, 100 + i2 * 40));
            }),
          }),
        );
        board.position.set(0, 2.35, -k.d / 2 + 0.27);
        g.add(board);
        npc(isCafe ? 'camarero' : 'camarera_rest', 0, -k.d / 2 + 1.5, 0);
        // tables
        const tables = isCafe
          ? [
              [-5, 1],
              [0, 1],
              [5, 1],
              [-5, 5],
              [5, 5],
            ]
          : [
              [-6, 0],
              [0, 0],
              [6, 0],
              [-6, 5],
              [0, 5],
              [6, 5],
            ];
        tables.forEach(([x, z], ti) => {
          B(1.2, 0.06, 1.2, isCafe ? white : mat('#f3e8e0'), x, 0.76, z, false);
          B(0.12, 0.76, 0.12, graphite, x, 0.38, z);
          for (const s of [-1, 1]) B(0.5, 0.45, 0.5, isCafe ? orange : wood, x + s * 1.0, 0.22, z, false);
          const occupied = ti % 2 === 0;
          if (occupied) npcs.push({ npcId: 'cliente_' + k.kind + ti, x: ox + x + 1.0, z: oz + z, yaw: -Math.PI / 2, interior: k.kind, sit: true });
          else inter(`table_${k.kind}_${ti}`, x - 1.0, z, { es: 'Sentarse en una mesa libre', hy: 'Նստել ազատ սեղանի մոտ' }, { type: 'table', place: isCafe ? 'cafe' : 'restaurant' }, 1.4);
        });
        break;
      }
      case 'sportshop': {
        wallSign('DEPORTES 7', 0, 3.6, -k.d / 2 + 0.2, 0, 7);
        for (let r = -1; r <= 1; r++) {
          B(0.1, 1.8, 3, metal, r * 6, 1.4, -3, true);
          const colors = ['#ff6a00', '#f2f2f2', '#1f5fbf', '#c0392b', '#121212'];
          for (let s = 0; s < 5; s++) {
            const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.06), mat(colors[s]));
            shirt.position.set(r * 6 + 0.15, 1.6, -4.2 + s * 0.6);
            shirt.rotation.y = Math.PI / 2;
            g.add(shirt);
          }
        }
        B(5, 1.0, 1.0, graphite, 0, 0.5, 4);
        npc('vendedor', 0, 5.2, Math.PI);
        inter('shop_clothes', -6, 0, { es: 'Mirar la ropa deportiva', hy: 'Նայել մարզական հագուստը' }, { type: 'shop', cat: 'clothes' });
        inter('shop_equipment', 6, 0, { es: 'Mirar el equipamiento', hy: 'Նայել սարքավորումները' }, { type: 'shop', cat: 'equipment' });
        inter('shop_vehicles', 0, -5, { es: 'Mirar bicicletas y patinetes', hy: 'Նայել հեծանիվներն ու սքութերները' }, { type: 'shop', cat: 'vehicles' });
        // bikes display
        for (let b = 0; b < 3; b++) {
          const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 20), graphite);
          wheel.position.set(-2 + b * 2, 0.4, -7.5);
          g.add(wheel);
          const w2 = wheel.clone();
          w2.position.x += 0.9;
          g.add(w2);
        }
        break;
      }
      case 'mall': {
        wallSign('CENTRO COMERCIAL', 0, 7, -k.d / 2 + 0.2, 0, 12);
        const shops = [
          ['MODA', 'clothes', -14],
          ['DECORACIÓN', 'room', 0],
          ['MOTOR', 'vehicles', 14],
        ] as const;
        for (const [name, cat, x] of shops) {
          B(10, 4, 0.3, mat('#dfe5ea'), x, 2, -8);
          B(0.3, 4, 6, mat('#dfe5ea'), x - 5, 2, -11);
          B(0.3, 4, 6, mat('#dfe5ea'), x + 5, 2, -11);
          const s = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshStandardMaterial({ map: signTexture(name, '#16181c', '#ffffff') }));
          s.position.set(x, 4.8, -7.8);
          g.add(s);
          inter('mall_' + cat, x, -6.5, { es: `Entrar en la tienda: ${name}`, hy: `Մտնել խանութ՝ ${name === 'MODA' ? 'Նորաձևություն' : name === 'DECORACIÓN' ? 'Ձևավորում' : 'Ավտո'}` }, { type: 'shop', cat }, 2.2);
        }
        // fountain and benches
        const f = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.7, 24), white);
        f.position.set(0, 0.35, 4);
        g.add(f);
        phys.addCylinder(ox, 0.35, oz + 4, 0.35, 2.8);
        npc('amiga', 6, 5, -Math.PI / 2);
        break;
      }
      case 'gym': {
        wallSign('GIMNASIO', 0, 3.6, -k.d / 2 + 0.2, 0, 7);
        const machines = [
          { x: -7, z: -4, stat: 'speed', es: 'Correr en la cinta', hy: 'Վազել վազքուղու վրա' },
          { x: 0, z: -4, stat: 'stamina', es: 'Pedalear en la bicicleta estática', hy: 'Ոտնակել մարզահեծանիվի վրա' },
          { x: 7, z: -4, stat: 'shooting', es: 'Hacer ejercicios de piernas', hy: 'Ոտքերի վարժություններ անել' },
          { x: -7, z: 3, stat: 'technique', es: 'Entrenar con la escalera de agilidad', hy: 'Մարզվել ճարպկության սանդուղքով' },
          { x: 7, z: 3, stat: 'teamwork', es: 'Clase de entrenamiento en grupo', hy: 'Խմբային մարզման դաս' },
        ] as const;
        for (const m of machines) {
          B(1.0, 1.2, 2.2, graphite, m.x, 0.6, m.z);
          B(0.9, 0.08, 2.0, orange, m.x, 1.24, m.z, false);
          inter('train_' + m.stat, m.x + 1.4, m.z, { es: m.es, hy: m.hy }, { type: 'train', stat: m.stat }, 1.6);
        }
        npc('recepcion_gym', 0, 6, Math.PI);
        break;
      }
      case 'cinema': {
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), cinemaScreen);
        screen.position.set(0, 3.0, -k.d / 2 + 0.25);
        g.add(screen);
        for (let r = 0; r < 5; r++)
          for (let s = -4; s <= 4; s++) {
            if (s === 0) continue;
            B(0.9, 0.5, 0.8, mat('#8e1b2b'), s * 1.3, 0.25 + r * 0.05, -2 + r * 2.2, false);
            B(0.9, 0.8, 0.15, mat('#8e1b2b'), s * 1.3, 0.8, -1.6 + r * 2.2, false);
          }
        inter('cinema_seat', 0, 0.3, { es: 'Sentarse y ver la película', hy: 'Նստել և դիտել ֆիլմը' }, { type: 'cinema' }, 1.8);
        npc('taquillero', -8, 9, Math.PI / 2);
        break;
      }
      case 'school': {
        const board = new THREE.Mesh(
          new THREE.PlaneGeometry(6, 2.2),
          new THREE.MeshStandardMaterial({
            map: canvasTex(512, 190, (c) => {
              c.fillStyle = '#1f3b2c';
              c.fillRect(0, 0, 512, 190);
              c.fillStyle = '#fff';
              c.font = '28px Inter, Arial';
              c.fillText('Hoy: el pretérito indefinido', 40, 60);
              c.fillText('Ayer jugué al fútbol.', 40, 110);
              c.fillText('Ayer fui al estadio.', 40, 150);
            }),
          }),
        );
        board.position.set(0, 2.2, -k.d / 2 + 0.24);
        g.add(board);
        for (let r = 0; r < 3; r++)
          for (let c = -2; c <= 2; c++) {
            B(1.1, 0.06, 0.7, wood, c * 2.4, 0.75, -2 + r * 2.4, false);
            B(0.1, 0.75, 0.1, graphite, c * 2.4, 0.37, -2 + r * 2.4);
          }
        npc('profesora', -4, -5.6, 0);
        inter('lesson', 0, -4.2, { es: 'Asistir a la clase de gramática', hy: 'Մասնակցել քերականության դասին' }, { type: 'lesson' }, 2);
        npc('companero', 4.8, 2.8, 0, true);
        break;
      }
      case 'workshop': {
        wallSign('TALLER MECÁNICO', 0, 3.6, -k.d / 2 + 0.2, 0, 8);
        B(4.5, 0.25, 2.2, metal, -4, 1.4, -2);
        for (const s of [-1, 1]) B(0.3, 1.4, 0.3, mat('#d4a017'), -4 + s * 2, 0.7, -2);
        B(3, 1.0, 0.8, mat('#c0392b'), 7, 0.5, -6);
        npc('mecanico', 1, -2, -Math.PI / 2);
        inter('shop_cars', 7, -4.5, { es: 'Ver los coches en venta', hy: 'Տեսնել վաճառվող մեքենաները' }, { type: 'shop', cat: 'vehicles' });
        break;
      }
      case 'gamecenter': {
        wallSign('GAME ZONE', 0, 3.8, -k.d / 2 + 0.2, 0, 8, '#ff6a00', '#16181c');
        const cols = 5;
        MINIGAMES.forEach((mg, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const x = -11 + col * 5.5;
          const z = -8 + row * 4.0;
          const cab = new THREE.Group();
          const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.9), mat(idx % 2 ? '#2b2e35' : '#1c2233'));
          body.position.y = 1.0;
          const scr = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.7),
            new THREE.MeshStandardMaterial({ map: signTexture(mg.name.es.toUpperCase(), mg.color, '#fff'), emissive: '#ffffff', emissiveIntensity: 0.5 }),
          );
          (scr.material as THREE.MeshStandardMaterial).emissiveMap = (scr.material as THREE.MeshStandardMaterial).map;
          scr.position.set(0, 1.45, 0.46);
          const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 0.95), new THREE.MeshStandardMaterial({ color: mg.color, emissive: mg.color, emissiveIntensity: 0.5 }));
          top.position.y = 2.1;
          cab.add(body, scr, top);
          cab.position.set(x, 0, z);
          g.add(cab);
          phys.addBox(ox + x, 1, oz + z, 0.55, 1, 0.45);
          inter('mg_' + mg.id, x, z + 1.2, { es: `Jugar: ${mg.name.es}`, hy: `Խաղալ՝ ${mg.name.hy}` }, { type: 'minigame', id: mg.id }, 1.1);
        });
        npc('arcade', 12, 9, Math.PI);
        break;
      }
      case 'academy': {
        wallSign('ACADEMIA DE FÚTBOL', 0, 3.8, -k.d / 2 + 0.2, 0, 10);
        for (let t = 0; t < 5; t++) {
          B(1, 1.0, 1, graphite, -8 + t * 4, 0.5, -6);
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.1, 0.6, 14), mat('#e0b23a', 0.2, 0.9));
          cup.position.set(-8 + t * 4, 1.3, -6);
          g.add(cup);
        }
        B(3.6, 0.8, 1.6, wood, 0, 0.4, 0);
        npc('director', 0, -1.3, 0);
        inter('football_hub', 7, 4, { es: 'Ver el centro de fútbol', hy: 'Տեսնել ֆուտբոլային կենտրոնը' }, { type: 'football' });
        break;
      }
      case 'airport': {
        wallSign('SALIDAS · LLEGADAS', 0, 6, -k.d / 2 + 0.2, 0, 14, '#16181c', '#ffd24a');
        // check-in counters
        for (let c = -2; c <= 2; c++) B(3, 1.1, 1, white, c * 6, 0.55, -6);
        npc('azafata', 0, -7.2, 0);
        // security arch
        for (const s of [-1, 1]) B(0.3, 2.6, 0.6, graphite, 10 + s * 1.1, 1.3, 4);
        B(2.5, 0.3, 0.6, graphite, 10, 2.75, 4);
        npc('seguridad', 12.5, 4, -Math.PI / 2);
        // gate boards
        const fids = new THREE.Mesh(
          new THREE.PlaneGeometry(6, 3),
          new THREE.MeshStandardMaterial({
            map: canvasTex(512, 256, (c) => {
              c.fillStyle = '#0b1020';
              c.fillRect(0, 0, 512, 256);
              c.fillStyle = '#ffd24a';
              c.font = '700 26px Inter, monospace';
              c.fillText('VUELO   DESTINO     PUERTA', 20, 40);
              c.font = '24px Inter, monospace';
              ['RZ701   MADRID      B12', 'RZ702   BARCELONA   A03', 'RZ703   SEVILLA     C07', 'RZ704   BILBAO      B05', 'RZ705   MÁLAGA      A09'].forEach((t, i2) => c.fillText(t, 20, 85 + i2 * 34));
            }),
            emissive: '#ffffff',
            emissiveIntensity: 0.3,
          }),
        );
        fids.position.set(-12, 3.5, 4);
        fids.rotation.y = Math.PI / 2;
        g.add(fids);
        inter('gate', -14, 9, { es: 'Ir a la puerta de embarque', hy: 'Գնալ նստեցման դարպաս' }, { type: 'travel', mode: 'plane' }, 2.2);
        B(6, 0.5, 1, mat('#3a3d44'), -14, 0.25, 11, false);
        break;
      }
      case 'station': {
        wallSign('ESTACIÓN DE TREN', 0, 3.8, -k.d / 2 + 0.2, 0, 10);
        B(8, 1.1, 1, wood, -6, 0.55, -5);
        npc('taquilla_tren', -6, -6.3, 0);
        inter('train_platform', 10, -6, { es: 'Ir al andén y subir al tren', hy: 'Գնալ կառամատույց և նստել գնացք' }, { type: 'travel', mode: 'train' }, 2.2);
        inter('bus_stop', 10, 5, { es: 'Tomar el autobús interurbano', hy: 'Նստել միջքաղաքային ավտոբուս' }, { type: 'travel', mode: 'bus' }, 2.2);
        break;
      }
    }
  });

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.receiveShadow = true;
  });
  return { rooms, interactables, npcs, decor, cinemaScreen };
}
