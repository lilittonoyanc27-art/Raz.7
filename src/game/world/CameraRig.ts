// Third-person orbit camera: mouse/touch rotation (360°), wheel zoom,
// wall collision, smoothing and automatic vehicle-follow mode.
import * as THREE from 'three';
import type { Physics } from './physics';
import type { Input } from './Input';
import { settings } from '../settings';
import { angleLerp } from './util';

export class CameraRig {
  cam: THREE.PerspectiveCamera;
  yaw = Math.PI; // camera behind a character facing +z
  pitch = 0.22;
  dist = 4.2;
  targetDist = 4.2;
  /** over-the-shoulder offset (m to the right) */
  shoulder = 0.55;
  private shoulderNow = 0.55;
  private fov = 58;
  minDist = 1.6;
  maxDist = 11;
  private pos = new THREE.Vector3();
  private look = new THREE.Vector3();
  private idleT = 0;
  vehicleMode = false;
  /** first-person view (eyes of RAZ / driver seat) */
  firstPerson = false;
  /** 1 = first person, 2 = close behind, 3 = classic far third person */
  view: 1 | 2 | 3 = 3;
  private big = false;
  private lookAhead = 0;
  private lastHeading = 0;
  private phys: Physics;
  interior = false;

  constructor(cam: THREE.PerspectiveCamera, phys: Physics) {
    this.cam = cam;
    this.phys = phys;
  }

  setVehicle(on: boolean, big = false) {
    this.vehicleMode = on;
    this.big = big;
    this.minDist = on ? 3 : 1.4;
    this.maxDist = on ? (big ? 20 : 14) : 11;
    this.applyView();
  }

  setView(v: 1 | 2 | 3) {
    this.view = v;
    this.applyView();
  }

  applyView() {
    this.firstPerson = this.view === 1;
    if (this.vehicleMode) {
      this.targetDist = this.view === 2 ? (this.big ? 8 : 4.6) : this.big ? 12 : 7.5;
      this.shoulder = 0;
      this.pitch = this.view === 1 ? 0.02 : this.view === 2 ? 0.18 : 0.26;
    } else {
      this.targetDist = this.view === 2 ? 2.3 : 4.2;
      this.shoulder = this.interior ? 0.35 : this.view === 2 ? 0.5 : 0.55;
      this.pitch = this.view === 1 ? 0 : this.view === 2 ? 0.15 : 0.24;
    }
    this.targetDist = Math.min(this.targetDist, this.maxDist);
  }

  setInterior(on: boolean) {
    this.interior = on;
    this.maxDist = on ? 4 : this.vehicleMode ? 14 : 11;
    this.applyView();
  }

  snap(target: THREE.Vector3) {
    this.look.copy(target);
    this.computeDesired(target, this.pos, this.dist);
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.look);
  }

  private computeDesired(target: THREE.Vector3, out: THREE.Vector3, d: number) {
    const cp = Math.cos(this.pitch);
    out.set(target.x + Math.sin(this.yaw) * cp * d, target.y + Math.sin(this.pitch) * d, target.z + Math.cos(this.yaw) * cp * d);
  }

  /** followHeading: when driving, the heading the camera drifts behind */
  /** First-person camera placed at the eyes; yaw/pitch come from mouse/touch. */
  private updateFirst(dt: number, input: Input, eye: THREE.Vector3, followHeading: number | null, speed: number) {
    const sens = 0.0024 * settings.get().mouseSensitivity;
    const inv = settings.get().invertY ? -1 : 1;
    const hasLook = Math.abs(input.mouseDX) + Math.abs(input.mouseDY) > 0;
    this.yaw -= input.mouseDX * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch + input.mouseDY * sens * inv, -1.2, 1.25);
    if (hasLook) this.idleT = 0;
    else this.idleT += dt;
    if (followHeading !== null && this.idleT > 0.6 && Math.abs(speed) > 0.5) {
      this.yaw = angleLerp(this.yaw, followHeading + Math.PI, 1 - Math.exp(-dt * 4));
      this.pitch = THREE.MathUtils.lerp(this.pitch, 0.05, 1 - Math.exp(-dt * 2));
    }
    const wantFov = 70 + Math.min(12, Math.abs(speed) * 0.4);
    this.fov = THREE.MathUtils.lerp(this.fov, wantFov, 1 - Math.exp(-dt * 4));
    this.cam.fov = this.fov;
    this.cam.updateProjectionMatrix();
    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * cp, -Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    this.pos.copy(eye);
    this.look.copy(eye).add(dir);
    this.cam.position.copy(eye);
    this.cam.lookAt(this.look);
  }

  update(dt: number, input: Input, target: THREE.Vector3, followHeading: number | null, speed = 0, eye?: THREE.Vector3) {
    if (this.firstPerson && eye) {
      this.updateFirst(dt, input, eye, followHeading, speed);
      return;
    }
    const sens = 0.0024 * settings.get().mouseSensitivity;
    const inv = settings.get().invertY ? -1 : 1;
    const hasLook = Math.abs(input.mouseDX) + Math.abs(input.mouseDY) > 0;
    this.yaw -= input.mouseDX * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch + input.mouseDY * sens * inv, -0.35, 1.25);
    if (input.wheel) this.targetDist = THREE.MathUtils.clamp(this.targetDist + input.wheel * 0.8, this.minDist, this.maxDist);
    if (hasLook) this.idleT = 0;
    else this.idleT += dt;
    // follow: swing behind the direction of travel so you see what is ahead
    const foot = !this.vehicleMode;
    if (followHeading !== null && this.idleT > (foot ? 0.35 : 1.2) && Math.abs(speed) > (foot ? 0.2 : 1.5)) {
      const behind = followHeading + Math.PI;
      this.yaw = angleLerp(this.yaw, speed < 0 ? followHeading : behind, 1 - Math.exp(-dt * (foot ? 3.2 : 2.2)));
      const wantPitch = foot ? (this.view === 2 ? 0.08 : 0.12) : 0.22;
      this.pitch = THREE.MathUtils.lerp(this.pitch, wantPitch, 1 - Math.exp(-dt * 2));
    }
    this.dist = THREE.MathUtils.lerp(this.dist, this.targetDist, 1 - Math.exp(-dt * 8));

    // over-the-shoulder framing: shift pivot to the character's right
    this.shoulderNow = THREE.MathUtils.lerp(this.shoulderNow, this.shoulder * Math.min(1, this.dist / 3), 1 - Math.exp(-dt * 6));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const pivot = target.clone();
    // look a little ahead of the character / vehicle when moving
    if (followHeading !== null && Math.abs(speed) > 0.2) {
      const ahead = Math.min(foot ? 2.5 : 4, Math.abs(speed) * (foot ? 0.9 : 0.25)) * Math.sign(speed);
      this.lookAhead = THREE.MathUtils.lerp(this.lookAhead, ahead, 1 - Math.exp(-dt * 2));
    } else this.lookAhead = THREE.MathUtils.lerp(this.lookAhead, 0, 1 - Math.exp(-dt * 2));
    if (followHeading !== null || Math.abs(this.lookAhead) > 0.01) {
      const h = followHeading ?? this.lastHeading;
      this.lastHeading = h;
      pivot.x += Math.sin(h) * this.lookAhead;
      pivot.z += Math.cos(h) * this.lookAhead;
    }
    const side = this.phys.ray(target.x, target.y, target.z, right.x, 0, right.z, this.shoulderNow + 0.3);
    pivot.addScaledVector(right, side !== null ? Math.max(0, side - 0.3) : this.shoulderNow);
    this.look.lerp(pivot, 1 - Math.exp(-dt * 18));
    // dynamic field of view: wider at speed (driving / sprinting)
    const wantFov = 56 + Math.min(14, Math.abs(speed) * 0.45);
    this.fov = THREE.MathUtils.lerp(this.fov, wantFov, 1 - Math.exp(-dt * 3));
    if (Math.abs(this.cam.fov - this.fov) > 0.05) {
      this.cam.fov = this.fov;
      this.cam.updateProjectionMatrix();
    }
    // collision: ray from target to desired camera
    const desired = new THREE.Vector3();
    this.computeDesired(this.look, desired, this.dist);
    const dir = desired.clone().sub(this.look);
    const len = dir.length();
    dir.normalize();
    const hit = this.phys.ray(this.look.x, this.look.y, this.look.z, dir.x, dir.y, dir.z, len);
    let d = len;
    if (hit !== null) d = Math.max(0.4, hit - 0.25);
    const final = this.look.clone().addScaledVector(dir, d);
    if (final.y < 0.3) final.y = 0.3;
    // smooth only when not pulling in (avoid clipping)
    if (d < this.pos.distanceTo(this.look) - 0.05) this.pos.copy(final);
    else this.pos.lerp(final, 1 - Math.exp(-dt * 14));
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.look);
  }
}
