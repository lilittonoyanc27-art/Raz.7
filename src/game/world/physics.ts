import RAPIER from '@dimforge/rapier3d-compat';

let ready: Promise<void> | null = null;
export function initRapier() {
  if (!ready) ready = RAPIER.init();
  return ready;
}

/** Collision groups: membership << 16 | filter */
export const GROUP = {
  STATIC: 0x0001,
  PLAYER: 0x0002,
  VEHICLE: 0x0004,
  BALL: 0x0008,
  NPC: 0x0010,
};
export const groups = (member: number, filter: number) => (member << 16) | filter;

export class Physics {
  R = RAPIER;
  world: RAPIER.World;
  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  }
  addBox(x: number, y: number, z: number, hx: number, hy: number, hz: number, rotY = 0) {
    const d = RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z);
    if (rotY) d.setRotation({ x: 0, y: Math.sin(rotY / 2), z: 0, w: Math.cos(rotY / 2) });
    d.setCollisionGroups(groups(GROUP.STATIC, 0xffff));
    return this.world.createCollider(d);
  }
  addCylinder(x: number, y: number, z: number, halfH: number, r: number) {
    const d = RAPIER.ColliderDesc.cylinder(halfH, r).setTranslation(x, y, z);
    d.setCollisionGroups(groups(GROUP.STATIC, 0xffff));
    return this.world.createCollider(d);
  }
  remove(c: RAPIER.Collider) {
    this.world.removeCollider(c, false);
  }
  /** Ray against static geometry only. Returns distance or null. */
  ray(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number) {
    const r = new RAPIER.Ray({ x: ox, y: oy, z: oz }, { x: dx, y: dy, z: dz });
    const hit = this.world.castRay(r, max, true, undefined, groups(0xffff, GROUP.STATIC));
    return hit ? hit.timeOfImpact : null;
  }
}
