// RAZ: third-person character controller (Rapier kinematic character
// controller) with camera-relative movement, running, stamina and jumping.
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { GROUP, groups, type Physics } from './physics';
import { Humanoid } from './character';
import { angleLerp } from './util';
import type { Input } from './Input';
import { game } from '../state';

const RADIUS = 0.3;
const HALF = 0.6;

export class Player {
  model: Humanoid;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  ctrl: RAPIER.KinematicCharacterController;
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0;
  grounded = true;
  stamina = 1;
  sprinting = false;
  private lastShift = 0;
  speed = 0;
  enabled = true;
  frozen = false;
  private phys: Physics;
  private stepT = 0;
  onStep?: () => void;
  onJump?: () => void;

  constructor(phys: Physics, scene: THREE.Scene) {
    this.phys = phys;
    const o = game.get().outfit;
    this.model = new Humanoid({ shirt: o.shirt, shorts: o.shorts, shoes: o.shoes, skin: '#e8b994', hair: o.hair, number: '7', name: 'RAZ', hairStyle: 'fade', accessory: o.accessory, height: 1.0 });
    scene.add(this.model.root);
    const R = phys.R;
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 2, 0));
    this.collider = phys.world.createCollider(
      R.ColliderDesc.capsule(HALF, RADIUS).setCollisionGroups(groups(GROUP.PLAYER, GROUP.STATIC | GROUP.VEHICLE | GROUP.BALL | GROUP.NPC)),
      this.body,
    );
    this.ctrl = phys.world.createCharacterController(0.02);
    this.ctrl.enableAutostep(0.45, 0.2, true);
    this.ctrl.enableSnapToGround(0.35);
    this.ctrl.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.ctrl.setApplyImpulsesToDynamicBodies(true);
    this.ctrl.setSlideEnabled(true);
  }

  teleport(x: number, y: number, z: number, yaw = this.yaw) {
    this.pos.set(x, y + HALF + RADIUS + 0.02, z);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.body.setTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z }, true);
    this.syncModel();
  }

  feet() {
    return new THREE.Vector3(this.pos.x, this.pos.y - HALF - RADIUS, this.pos.z);
  }

  setActive(on: boolean) {
    this.enabled = on;
    this.collider.setEnabled(on);
  }

  update(dt: number, input: Input, camYaw: number) {
    if (!this.enabled) return;
    const stats = game.get().stats;
    const ax = this.frozen ? { x: 0, y: 0 } : input.axis();
    const moving = Math.hypot(ax.x, ax.y) > 0.05;
    const shiftDown = input.down('ShiftLeft', 'ShiftRight');
    const wantRun = shiftDown || input.touchRun;
    // double-tap Shift (or the mobile button) = sprint
    const now = performance.now();
    if (input.hit('ShiftLeft', 'ShiftRight')) {
      if (now - this.lastShift < 350) this.sprinting = true;
      this.lastShift = now;
    }
    if (this.stamina < 0.04) input.touchSprint = false;
    if (input.touchSprint) this.sprinting = true;
    if ((!shiftDown && !input.touchSprint) || this.stamina < 0.04 || !moving) this.sprinting = false;
    const canRun = this.stamina > 0.05;
    const running = moving && wantRun && canRun;
    const sprint = running && this.sprinting;
    const walk = 3.0;
    const run = 10 + stats.speed * 0.3;
    const fast = 14 + stats.speed * 0.35;
    const target = moving ? (sprint ? fast : running ? run : walk) * Math.min(1, Math.hypot(ax.x, ax.y)) : 0;
    // stamina
    const drain = (sprint ? 0.28 : 0.1) / (1 + stats.stamina * 0.25);
    this.stamina = THREE.MathUtils.clamp(this.stamina + (running ? -drain : 0.22) * dt, 0, 1);

    // camera-relative direction
    const fx = -Math.sin(camYaw);
    const fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw);
    const rz = -Math.sin(camYaw);
    const dx = fx * ax.y + rx * ax.x;
    const dz = fz * ax.y + rz * ax.x;
    const len = Math.hypot(dx, dz) || 1;
    const accel = this.grounded ? 16 : 4;
    const tvx = (dx / len) * target;
    const tvz = (dz / len) * target;
    this.vel.x = THREE.MathUtils.lerp(this.vel.x, tvx, 1 - Math.exp(-accel * dt));
    this.vel.z = THREE.MathUtils.lerp(this.vel.z, tvz, 1 - Math.exp(-accel * dt));
    if (moving) this.yaw = angleLerp(this.yaw, Math.atan2(dx, dz), 1 - Math.exp(-12 * dt));

    // jump & gravity
    if (this.grounded && !this.frozen && input.hit('Space')) {
      this.vel.y = 6.2;
      this.grounded = false;
      this.onJump?.();
    }
    this.vel.y -= 20 * dt;
    if (this.vel.y < -30) this.vel.y = -30;

    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.ctrl.computeColliderMovement(this.collider, desired, undefined, groups(GROUP.PLAYER, GROUP.STATIC | GROUP.VEHICLE | GROUP.BALL | GROUP.NPC));
    const mv = this.ctrl.computedMovement();
    this.grounded = this.ctrl.computedGrounded();
    if (this.grounded && this.vel.y < 0) this.vel.y = 0;
    this.pos.x += mv.x;
    this.pos.y += mv.y;
    this.pos.z += mv.z;
    if (this.pos.y < -10) this.teleport(this.pos.x, 3, this.pos.z);
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
    this.speed = Math.hypot(mv.x, mv.z) / Math.max(dt, 1e-4);

    // footsteps
    if (this.grounded && this.speed > 0.5) {
      this.stepT -= dt * (this.speed / 2.2);
      if (this.stepT <= 0) {
        this.stepT = 0.5;
        this.onStep?.();
      }
    }
    this.model.animate(dt, this.speed, !this.grounded, 'ground');
    this.syncModel();
  }

  syncModel() {
    this.model.root.position.set(this.pos.x, this.pos.y - HALF - RADIUS, this.pos.z);
    this.model.root.rotation.y = this.yaw;
  }
}
