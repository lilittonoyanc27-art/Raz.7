// Interactive NPC characters placed in the city and inside buildings.
import * as THREE from 'three';
import { Humanoid, randomLook } from './character';
import { NPCS, npcById } from '../data/npcs';
import { placeById, placeCenter } from '../data/places';
import type { Interactable, NpcSpawn } from './types';
import { mulberry32 } from './util';
import { GROUP, groups, type Physics } from './physics';

export interface NpcActor {
  id: string;
  h: Humanoid;
  home: THREE.Vector3;
  baseYaw: number;
  sit: boolean;
  marker?: THREE.Mesh;
}

export class Npcs {
  actors: NpcActor[] = [];
  private scene: THREE.Scene;
  markerMat = new THREE.MeshBasicMaterial({ color: '#ff6a00' });

  constructor(scene: THREE.Scene, phys: Physics, interiorSpawns: NpcSpawn[], interactables: Interactable[]) {
    this.scene = scene;
    const rnd = mulberry32(1234);
    const spawn = (id: string, x: number, z: number, yaw: number, sit: boolean, interior: Interactable['interior']) => {
      const def = npcById(id);
      const look = def
        ? { ...randomLook(rnd), ...def.look, skin: def.look.skin ?? randomLook(rnd).skin, hair: def.look.hair ?? randomLook(rnd).hair }
        : randomLook(rnd);
      const h = new Humanoid(look);
      h.root.position.set(x, sit || interior ? 0 : 0.16, z);
      h.root.rotation.y = yaw;
      this.scene.add(h.root);
      const actor: NpcActor = { id, h, home: new THREE.Vector3(x, 0, z), baseYaw: yaw, sit };
      if (def) {
        const marker = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), this.markerMat);
        marker.rotation.x = Math.PI;
        marker.position.y = 2.05 * (def.look.height ?? 1);
        h.root.add(marker);
        actor.marker = marker;
        interactables.push({
          id: 'npc_' + id,
          pos: new THREE.Vector3(x, 1, z),
          r: 2.2,
          label: { es: `Hablar con ${def.name}`, hy: `Խոսել ${def.name}-ի հետ` },
          action: { type: 'npc', id },
          interior,
        });
        // solid body so the player can't walk through
        if (!sit) phys.world.createCollider(phys.R.ColliderDesc.cylinder(0.8, 0.28).setTranslation(x, 0.9, z).setCollisionGroups(groups(GROUP.NPC, GROUP.PLAYER | GROUP.VEHICLE)));
      }
      this.actors.push(actor);
    };
    for (const s of interiorSpawns) spawn(s.npcId, s.x, s.z, s.yaw, !!s.sit, s.interior);
    for (const def of NPCS) {
      if (!def.place) continue;
      const pl = placeById(def.place);
      if (!pl) continue;
      const c = placeCenter(pl);
      const [ox, oz] = def.offset ?? [0, 0];
      spawn(def.id, c.x + ox, c.z + oz, Math.PI, false, null);
    }
  }

  get(id: string) {
    return this.actors.find((a) => a.id === id);
  }

  update(dt: number, player: THREE.Vector3, highlight: Set<string>) {
    const t = performance.now() * 0.001;
    for (const a of this.actors) {
      const d = a.h.root.position.distanceTo(player);
      a.h.root.visible = d < 120;
      if (!a.h.root.visible) continue;
      if (!a.sit && d < 5) {
        const v = player.clone().sub(a.h.root.position);
        const target = Math.atan2(v.x, v.z);
        let cur = a.h.root.rotation.y;
        let diff = target - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        cur += diff * Math.min(1, dt * 4);
        a.h.root.rotation.y = cur;
      }
      if (d < 50) a.h.animate(dt, 0, false, a.sit ? 'sit' : 'ground');
      if (a.marker) {
        const hl = highlight.has(a.id);
        a.marker.visible = hl || d < 12;
        a.marker.scale.setScalar(hl ? 1.8 : 1);
        a.marker.position.y = 2.0 * (a.h.look.height ?? 1) + Math.sin(t * 3) * 0.06 + (hl ? 0.2 : 0);
        a.marker.rotation.y = t * 2;
      }
    }
  }

  dispose() {
    for (const a of this.actors) this.scene.remove(a.h.root);
    this.actors = [];
  }
}
