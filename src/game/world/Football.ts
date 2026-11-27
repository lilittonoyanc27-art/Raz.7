// Football simulation: physical ball (Rapier), dribbling, passing, charged
// shots, AI goalkeeper, teammates/opponents and training modes.
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { GROUP, groups, type Physics } from './physics';
import { Humanoid, randomLook } from './character';
import { canvasTex, mulberry32 } from './util';
import type { FootballMode } from '../data/missions';
import type { Tr } from '../../i18n/T';
import { createStore } from '../store';
import { game } from '../state';

export const BALL_R = 0.14;
const GOAL_HALF = 3.66;
const GOAL_H = 2.44;

export interface FootballHud {
  mode: FootballMode | null;
  us: number;
  them: number;
  time: number;
  attempts: number;
  target: number;
  charge: number;
  near: boolean;
  coach: Tr | null;
}
export const footballHud = createStore<FootballHud>({ mode: null, us: 0, them: 0, time: 0, attempts: 0, target: 0, charge: 0, near: false, coach: null });

const COACH: Record<string, Tr> = {
  pass: { es: '¡Pasa el balón!', hy: 'Փոխանցի՛ր գնդակը։' },
  shoot: { es: '¡Tira a portería!', hy: 'Հարվածի՛ր դարպասին։' },
  run: { es: '¡Corre más rápido!', hy: 'Ավելի արագ վազի՛ր։' },
  defend: { es: '¡Defiende tu posición!', hy: 'Պաշտպանի՛ր դիրքդ։' },
  recover: { es: '¡Recupera el balón!', hy: 'Հետ վերցրո՛ւ գնդակը։' },
  space: { es: '¡Busca un espacio libre!', hy: 'Փնտրի՛ր ազատ տարածություն։' },
  focus: { es: '¡No pierdas la concentración!', hy: 'Մի՛ կորցրու կենտրոնացումը։' },
  trust: { es: '¡Confía en tus compañeros!', hy: 'Վստահի՛ր թիմակիցներիդ։' },
  goal: { es: '¡Gooool! ¡Muy bien!', hy: 'Գո՜լ։ Շատ լավ է։' },
  save: { es: '¡Qué parada!', hy: 'Ինչ փրկություն։' },
  miss: { es: '¡Fuera! Inténtalo otra vez.', hy: 'Դուրս։ Կրկին փորձիր։' },
};

interface AiPlayer {
  h: Humanoid;
  pos: THREE.Vector3;
  team: 'us' | 'them';
  home: THREE.Vector3;
  body: RAPIER.RigidBody;
  cooldown: number;
  hasBall: number;
}

export class Football {
  ball: RAPIER.RigidBody;
  ballMesh: THREE.Mesh;
  pitch: { cx: number; cz: number; hx: number; hz: number };
  mode: FootballMode | null = null;
  keeper: Humanoid;
  keeperPos = new THREE.Vector3();
  keeperBody: RAPIER.RigidBody;
  ourKeeper: Humanoid;
  ourKeeperPos = new THREE.Vector3();
  ourKeeperBody: RAPIER.RigidBody;
  charge = 0;
  charging = false;
  private phys: Physics;
  private scene: THREE.Scene;
  private resetT = -1;
  private shotT = -1;
  private kickCooldown = 0;
  private ai: AiPlayer[] = [];
  private wall: { h: Humanoid; body: RAPIER.RigidBody }[] = [];
  private cones: THREE.Mesh[] = [];
  private coneIndex = 0;
  private coachT = 0;
  private lastTouch: 'us' | 'them' | 'raz' = 'raz';
  private keeperHold = -1;
  private ourKeeperHold = -1;
  private shooterT = 0;
  private dive = 0;
  private rnd = mulberry32(5);
  private matchTime = 0;
  onGoal?: (us: boolean) => void;
  onSave?: () => void;
  onKick?: (power: number) => void;
  onModeEnd?: (mode: FootballMode, success: boolean) => void;
  onProgress?: (mode: FootballMode, count: number) => void;
  onWhistle?: () => void;

  constructor(phys: Physics, scene: THREE.Scene, pitch: { cx: number; cz: number; hx: number; hz: number }) {
    this.phys = phys;
    this.scene = scene;
    this.pitch = pitch;
    const R = phys.R;
    this.ball = phys.world.createRigidBody(
      R.RigidBodyDesc.dynamic().setTranslation(pitch.cx, 1, pitch.cz).setLinearDamping(0.35).setAngularDamping(0.8).setCcdEnabled(true),
    );
    phys.world.createCollider(
      R.ColliderDesc.ball(BALL_R).setRestitution(0.55).setFriction(0.6).setDensity(40).setCollisionGroups(groups(GROUP.BALL, 0xffff)),
      this.ball,
    );
    const tex = canvasTex(256, 128, (g) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#16181c';
      for (let i = 0; i < 12; i++) {
        const x = (i % 6) * 44 + (Math.floor(i / 6) % 2) * 22 + 12;
        const y = Math.floor(i / 6) * 64 + 32;
        g.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
          g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
        }
        g.fill();
      }
      g.fillStyle = '#ff6a00';
      g.fillRect(0, 60, 256, 8);
    });
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }));
    this.ballMesh.castShadow = true;
    scene.add(this.ballMesh);

    const mkKeeper = (shirt: string) => {
      const h = new Humanoid({ ...randomLook(this.rnd), shirt, shorts: '#16181c', longPants: false, hairStyle: 'fade', height: 1.06, number: '1', name: '' });
      scene.add(h.root);
      const body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased());
      phys.world.createCollider(R.ColliderDesc.cuboid(0.45, 0.85, 0.25).setTranslation(0, 0.85, 0).setCollisionGroups(groups(GROUP.NPC, GROUP.BALL | GROUP.PLAYER)), body);
      return { h, body };
    };
    const k1 = mkKeeper('#39e75f');
    this.keeper = k1.h;
    this.keeperBody = k1.body;
    this.keeperPos.set(pitch.cx + pitch.hx - 0.6, 0.16, pitch.cz);
    const k2 = mkKeeper('#d4a017');
    this.ourKeeper = k2.h;
    this.ourKeeperBody = k2.body;
    this.ourKeeperPos.set(pitch.cx - pitch.hx + 0.6, 0.16, pitch.cz);
    this.ourKeeper.root.visible = false;
    this.ourKeeperBody.setEnabled(false);
  }

  ballPos() {
    const t = this.ball.translation();
    return new THREE.Vector3(t.x, t.y, t.z);
  }
  ballVel() {
    const v = this.ball.linvel();
    return new THREE.Vector3(v.x, v.y, v.z);
  }
  placeBall(x: number, z: number) {
    this.ball.setTranslation({ x, y: BALL_R + 0.15, z }, true);
    this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }

  inStadium(p: THREE.Vector3, margin = 8) {
    return Math.abs(p.x - this.pitch.cx) < this.pitch.hx + margin && Math.abs(p.z - this.pitch.cz) < this.pitch.hz + margin;
  }

  penaltySpot() {
    return new THREE.Vector3(this.pitch.cx + this.pitch.hx - 11, 0, this.pitch.cz);
  }

  /** Start a mode. Returns where the player should stand. */
  start(mode: FootballMode, target: number): { x: number; z: number; yaw: number } {
    this.stop(false);
    this.mode = mode;
    footballHud.set({ mode, us: 0, them: 0, time: mode === 'match' ? 180 : mode === 'dribble' ? 60 : 0, attempts: 0, target, coach: null });
    const { cx, cz, hx } = this.pitch;
    this.matchTime = 0;
    this.onWhistle?.();
    switch (mode) {
      case 'penalty': {
        const s = this.penaltySpot();
        this.placeBall(s.x, s.z);
        this.say('shoot');
        return { x: s.x - 2.5, z: s.z, yaw: Math.PI / 2 };
      }
      case 'freekick': {
        const bx = cx + hx - 20;
        const bz = cz + (this.rnd() - 0.5) * 10;
        this.placeBall(bx, bz);
        this.buildWall(bx, bz);
        this.say('focus');
        return { x: bx - 2.5, z: bz, yaw: Math.PI / 2 };
      }
      case 'match': {
        this.placeBall(cx, cz);
        this.buildTeams();
        this.ourKeeper.root.visible = true;
        this.ourKeeperBody.setEnabled(true);
        this.say('trust');
        return { x: cx - 2, z: cz, yaw: Math.PI / 2 };
      }
      case 'dribble': {
        this.placeBall(cx - hx + 6, cz);
        this.buildCones();
        this.say('run');
        return { x: cx - hx + 4, z: cz, yaw: Math.PI / 2 };
      }
      case 'goalkeeper': {
        this.keeper.root.visible = false;
        this.keeperBody.setEnabled(false);
        const s = this.penaltySpot();
        this.placeBall(s.x - 3, s.z);
        this.shooterT = 2.5;
        this.buildShooter();
        return { x: cx + hx - 0.8, z: cz, yaw: -Math.PI / 2 };
      }
      default:
        this.placeBall(cx, cz);
        this.say('shoot');
        return { x: cx - 3, z: cz, yaw: Math.PI / 2 };
    }
  }

  stop(notify = true, success = false) {
    const m = this.mode;
    for (const a of this.ai) {
      this.scene.remove(a.h.root);
      this.phys.world.removeRigidBody(a.body);
    }
    this.ai = [];
    for (const w of this.wall) {
      this.scene.remove(w.h.root);
      this.phys.world.removeRigidBody(w.body);
    }
    this.wall = [];
    for (const c of this.cones) this.scene.remove(c);
    this.cones = [];
    this.keeper.root.visible = true;
    this.keeperBody.setEnabled(true);
    this.ourKeeper.root.visible = false;
    this.ourKeeperBody.setEnabled(false);
    this.mode = null;
    footballHud.set({ mode: null, coach: null });
    if (notify && m) this.onModeEnd?.(m, success);
  }

  private say(k: keyof typeof COACH) {
    footballHud.set({ coach: COACH[k] });
    this.coachT = 3.5;
  }

  private mkAi(team: 'us' | 'them', x: number, z: number, number: string) {
    const h = new Humanoid({ ...randomLook(this.rnd), shirt: team === 'us' ? '#ff6a00' : '#1f5fbf', shorts: team === 'us' ? '#16181c' : '#f4f4f4', longPants: false, number, name: '', height: 1.02 });
    h.root.position.set(x, 0.16, z);
    this.scene.add(h.root);
    const body = this.phys.world.createRigidBody(this.phys.R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.9, z));
    this.phys.world.createCollider(this.phys.R.ColliderDesc.capsule(0.5, 0.28).setCollisionGroups(groups(GROUP.NPC, GROUP.PLAYER)), body);
    const a: AiPlayer = { h, pos: new THREE.Vector3(x, 0.16, z), team, home: new THREE.Vector3(x, 0.16, z), body, cooldown: 0, hasBall: 0 };
    this.ai.push(a);
    return a;
  }

  private buildTeams() {
    const { cx, cz, hx } = this.pitch;
    this.mkAi('us', cx - 6, cz - 9, '10');
    this.mkAi('us', cx - 6, cz + 9, '11');
    this.mkAi('them', cx + 6, cz, '9');
    this.mkAi('them', cx + hx * 0.5, cz - 7, '4');
    this.mkAi('them', cx + hx * 0.5, cz + 7, '5');
  }

  private buildWall(bx: number, bz: number) {
    const goal = new THREE.Vector3(this.pitch.cx + this.pitch.hx, 0, this.pitch.cz);
    const dir = goal.clone().sub(new THREE.Vector3(bx, 0, bz)).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const c = new THREE.Vector3(bx, 0, bz).addScaledVector(dir, 9.15);
    for (let i = -1.5; i <= 1.5; i++) {
      const p = c.clone().addScaledVector(perp, i * 0.6);
      const h = new Humanoid({ ...randomLook(this.rnd), shirt: '#1f5fbf', shorts: '#f4f4f4', longPants: false, height: 1.04 });
      h.root.position.set(p.x, 0.16, p.z);
      h.root.rotation.y = Math.atan2(-dir.x, -dir.z);
      this.scene.add(h.root);
      const body = this.phys.world.createRigidBody(this.phys.R.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x, 0.95, p.z));
      this.phys.world.createCollider(this.phys.R.ColliderDesc.cuboid(0.28, 0.85, 0.2).setCollisionGroups(groups(GROUP.NPC, GROUP.BALL | GROUP.PLAYER)), body);
      this.wall.push({ h, body });
    }
  }

  private buildCones() {
    const { cx, cz, hx } = this.pitch;
    const mat = new THREE.MeshStandardMaterial({ color: '#ff6a00', emissive: '#ff6a00', emissiveIntensity: 0.4 });
    for (let i = 0; i < 7; i++) {
      const cone = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 24), mat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(cx - hx + 12 + i * 6, 0.2, cz + (i % 2 ? 4 : -4));
      this.scene.add(cone);
      this.cones.push(cone);
    }
    this.coneIndex = 0;
  }

  private shooter?: Humanoid;
  private buildShooter() {
    const s = this.penaltySpot();
    const a = this.mkAi('them', s.x - 4, s.z, '9');
    this.shooter = a.h;
  }

  /** kick ball with an impulse in direction (normalized horizontal) */
  kickBall(dir: THREE.Vector3, power: number, lift: number) {
    const v = new THREE.Vector3(dir.x * power, lift * power, dir.z * power);
    const m = this.ball.mass();
    this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.ball.applyImpulse({ x: v.x * m, y: v.y * m, z: v.z * m }, true);
    this.ball.setAngvel({ x: -dir.z * power * 2, y: 0, z: dir.x * power * 2 }, true);
    this.shotT = 0;
    this.kickCooldown = 0.35;
  }

  /** returns true if the player's input was consumed by football (so the
   * game doesn't treat the click as something else). */
  update(dt: number, ctx: { playerPos: THREE.Vector3; playerVel: THREE.Vector3; playerYaw: number; camYaw: number; camPitch: number; chargeHeld: boolean; chargeReleased: boolean; quickKick: boolean; pass: boolean; onFoot: boolean; playerKick: () => void }) {
    const bp = this.ballPos();
    const bv = this.ballVel();
    this.ballMesh.position.copy(bp);
    const rot = this.ball.rotation();
    this.ballMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    const { cx, cz, hx, hz } = this.pitch;
    const near = this.inStadium(ctx.playerPos, 14);
    const stats = game.get().stats;
    this.kickCooldown -= dt;
    if (this.coachT > 0) {
      this.coachT -= dt;
      if (this.coachT <= 0) footballHud.set({ coach: null });
    }

    // ---- player interaction with the ball ----
    const feet = ctx.playerPos.clone();
    feet.y = bp.y;
    const toBall = bp.clone().sub(feet);
    const dist = Math.hypot(toBall.x, toBall.z);
    const canTouch = ctx.onFoot && dist < 1.5 && bp.y < 1.2;
    if (ctx.onFoot && this.mode !== 'goalkeeper') {
      if (ctx.chargeHeld) {
        this.charging = true;
        this.charge = Math.min(1, this.charge + dt * 1.1);
      }
      const shootNow = (ctx.chargeReleased && this.charging) || ctx.quickKick;
      if (shootNow) {
        const power = ctx.quickKick && !this.charging ? 0.55 : this.charge;
        this.charging = false;
        this.charge = 0;
        ctx.playerKick();
        if (canTouch && this.kickCooldown <= 0) {
          // aim: camera forward, slightly corrected by shooting accuracy
          const aim = new THREE.Vector3(-Math.sin(ctx.camYaw), 0, -Math.cos(ctx.camYaw));
          const facing = new THREE.Vector3(Math.sin(ctx.playerYaw), 0, Math.cos(ctx.playerYaw));
          if (aim.dot(facing) < 0.2) aim.copy(facing);
          const spread = (1 - stats.shooting / 12) * 0.09;
          aim.applyAxisAngle(new THREE.Vector3(0, 1, 0), (this.rnd() - 0.5) * spread * 2).normalize();
          const p = 9 + power * (15 + stats.shooting * 0.6);
          const lift = 0.06 + power * 0.22 + Math.max(0, 0.25 - ctx.camPitch) * 0.35;
          this.kickBall(aim, p, lift);
          this.lastTouch = 'raz';
          this.onKick?.(power);
        }
      }
      if (ctx.pass && canTouch && this.kickCooldown <= 0) {
        ctx.playerKick();
        const mates = this.ai.filter((a) => a.team === 'us');
        let dir = new THREE.Vector3(Math.sin(ctx.playerYaw), 0, Math.cos(ctx.playerYaw));
        let power = 9;
        if (mates.length) {
          const best = mates.sort((a, b) => a.pos.distanceTo(bp) - b.pos.distanceTo(bp))[0];
          dir = best.pos.clone().sub(bp).setY(0);
          power = Math.min(16, 5 + dir.length() * 0.75);
          dir.normalize();
          game.set((s) => ({ stats: { ...s.stats, teamwork: Math.min(10, s.stats.teamwork + 0.02) } }));
        }
        this.kickBall(dir, power, 0.04);
        this.lastTouch = 'raz';
        this.onKick?.(0.3);
      }
      // dribbling: keep the ball close in front while moving
      const pv = ctx.playerVel;
      const pSpeed = Math.hypot(pv.x, pv.z);
      if (dist < 1.1 && bp.y < 0.5 && pSpeed > 0.5 && this.kickCooldown <= 0) {
        const fwd = new THREE.Vector3(pv.x, 0, pv.z).normalize();
        const want = feet.clone().addScaledVector(fwd, 0.75 + pSpeed * 0.05);
        const ctrl = 0.35 + stats.technique * 0.05;
        const tv = want.sub(bp).multiplyScalar(6).add(new THREE.Vector3(pv.x, 0, pv.z));
        const nv = bv.clone().lerp(new THREE.Vector3(tv.x, bv.y, tv.z), Math.min(1, ctrl));
        this.ball.setLinvel({ x: nv.x, y: nv.y, z: nv.z }, true);
        this.lastTouch = 'raz';
      }
    } else {
      this.charging = false;
      this.charge = 0;
    }
    footballHud.set({ charge: this.charge, near: near && ctx.onFoot && dist < 6 });

    // ---- goalkeepers ----
    this.updateKeeper(dt, bp, bv, this.keeper, this.keeperPos, this.keeperBody, cx + hx, 1);
    if (this.mode === 'match') this.updateKeeper(dt, bp, bv, this.ourKeeper, this.ourKeeperPos, this.ourKeeperBody, cx - hx, -1);

    // ---- goal detection ----
    if (this.resetT < 0) {
      const inMouth = Math.abs(bp.z - cz) < GOAL_HALF - BALL_R && bp.y < GOAL_H;
      if (inMouth && bp.x > cx + hx + BALL_R) {
        this.goal(true);
      } else if (inMouth && bp.x < cx - hx - BALL_R && this.mode === 'match') {
        this.goal(false);
      } else if (Math.abs(bp.x - cx) > hx + 3 || Math.abs(bp.z - cz) > hz + 3) {
        // out of play
        if (near || this.mode) {
          this.resetT = 1.2;
          if (this.mode === 'penalty' || this.mode === 'freekick') this.attempt(false);
          else if (this.mode === 'goalkeeper') this.saved();
          else if (this.mode !== 'dribble') this.say('miss');
        }
      }
    } else {
      this.resetT -= dt;
      if (this.resetT <= 0) {
        this.resetT = -1;
        this.resetBall();
      }
    }

    // ---- attempt resolution for set pieces ----
    if ((this.mode === 'penalty' || this.mode === 'freekick') && this.shotT >= 0 && this.resetT < 0) {
      this.shotT += dt;
      if ((this.shotT > 1.2 && bv.length() < 1.5) || this.shotT > 5) {
        this.shotT = -1;
        this.attempt(false);
        this.resetT = 0.6;
      }
    }

    // ---- modes ----
    if (this.mode === 'match') this.updateMatch(dt, bp, ctx.playerPos);
    if (this.mode === 'dribble') this.updateDribble(dt, bp, ctx.playerPos);
    if (this.mode === 'goalkeeper') this.updateGoalkeeperMode(dt, bp, bv);
    for (const w of this.wall) w.h.animate(dt, 0, this.shotT >= 0 && this.shotT < 0.6, 'ground');
    return near;
  }

  private updateKeeper(dt: number, bp: THREE.Vector3, bv: THREE.Vector3, h: Humanoid, pos: THREE.Vector3, body: RAPIER.RigidBody, lineX: number, side: 1 | -1) {
    if (!h.root.visible) return;
    const { cz } = this.pitch;
    const holdKey = side > 0 ? 'keeperHold' : 'ourKeeperHold';
    const hold = this[holdKey];
    let targetZ = cz + THREE.MathUtils.clamp((bp.z - cz) * 0.45, -2.6, 2.6);
    const towards = bv.x * side > 2;
    if (towards) {
      const tReach = (lineX - side * 0.6 - bp.x) / bv.x;
      if (tReach > 0 && tReach < 2) targetZ = THREE.MathUtils.clamp(bp.z + bv.z * tReach, cz - GOAL_HALF + 0.3, cz + GOAL_HALF - 0.3);
    }
    const level = this.mode === 'match' ? 3.4 : 3.0 + game.get().football.goals * 0.01;
    const setPiece = this.mode === 'penalty' || this.mode === 'freekick';
    const maxSpeed = towards && Math.abs(bp.x - lineX) < 14 ? (setPiece ? 2.9 : level + 2.2) : 2.6;
    const dz = THREE.MathUtils.clamp(targetZ - pos.z, -maxSpeed * dt, maxSpeed * dt);
    pos.z += dz;
    pos.x = lineX - side * 0.6;
    // catch
    const d = bp.distanceTo(new THREE.Vector3(pos.x, 1.0, pos.z));
    if (hold < 0 && d < 0.95 && bp.y < 2.3 && this.resetT < 0) {
      const chance = this.mode === 'penalty' || this.mode === 'freekick' ? 0.75 : 0.85;
      if (bv.length() < 18 || this.rnd() < chance) {
        this[holdKey] = 1.0;
        this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
        if (side > 0) {
          if (this.mode === 'penalty' || this.mode === 'freekick') {
            this.attempt(false, true);
            this.shotT = -1;
          } else this.say('save');
          this.onSave?.();
        }
      }
    }
    if (this[holdKey] >= 0) {
      this[holdKey] -= dt;
      this.ball.setTranslation({ x: pos.x - side * 0.5, y: 1.0, z: pos.z }, true);
      this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (this[holdKey] < 0) {
        if (this.mode === 'penalty' || this.mode === 'freekick') this.resetBall();
        else {
          const dir = new THREE.Vector3(-side, 0, (this.rnd() - 0.5) * 0.8).normalize();
          this.kickBall(dir, 16, 0.35);
          this.lastTouch = side > 0 ? 'them' : 'us';
        }
      }
    }
    body.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
    h.root.position.copy(pos);
    h.root.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    this.dive = Math.abs(dz) / dt;
    h.animate(dt, Math.abs(dz) / Math.max(dt, 1e-3), Math.abs(dz) / dt > 4.5, 'ground');
    h.armL.rotation.z = -0.9 - Math.min(0.6, this.dive * 0.1);
    h.armR.rotation.z = 0.9 + Math.min(0.6, this.dive * 0.1);
  }

  private goal(us: boolean) {
    if (this.mode === 'goalkeeper') {
      this.resetT = 1.5;
      this.shotT = -1;
      const h = footballHud.get();
      footballHud.set({ them: h.them + 1, attempts: h.attempts + 1 });
      this.say('focus');
      if (h.attempts + 1 >= h.target + 4) this.finishLater(false);
      return;
    }
    this.resetT = 2.0;
    this.shotT = -1;
    this.say(us ? 'goal' : 'defend');
    const hud = footballHud.get();
    if (us) {
      footballHud.set({ us: hud.us + 1 });
      if (this.lastTouch === 'raz' || this.mode !== 'match') this.onGoal?.(true);
    } else {
      footballHud.set({ them: hud.them + 1 });
      this.onGoal?.(false);
    }
    if (this.mode === 'penalty' || this.mode === 'freekick') this.attempt(true);
    else if (this.mode === 'free' || this.mode === 'match') {
      const h = footballHud.get();
      this.onProgress?.(this.mode, h.us);
      if (this.mode === 'free' && h.us >= h.target && h.target > 0) this.finishLater(true);
      if (this.mode === 'match' && h.us >= h.target) this.finishLater(true);
    }
  }

  private finishing = false;
  private finishLater(success: boolean) {
    if (this.finishing) return;
    this.finishing = true;
    setTimeout(() => {
      this.finishing = false;
      if (this.mode) this.stop(true, success);
    }, 1800);
  }

  private attempt(scored: boolean, saved = false) {
    const h = footballHud.get();
    if (!this.mode) return;
    const attempts = h.attempts + 1;
    footballHud.set({ attempts });
    if (!scored) this.say(saved ? 'save' : 'miss');
    const goals = footballHud.get().us;
    this.onProgress?.(this.mode, goals);
    if (goals >= h.target) this.finishLater(true);
    else if (attempts >= h.target + 4) this.finishLater(false);
  }

  private saved() {
    const h = footballHud.get();
    footballHud.set({ us: h.us + 1, attempts: h.attempts + 1 });
    this.say('save');
    this.onSave?.();
    this.onProgress?.('goalkeeper', h.us + 1);
    if (h.us + 1 >= h.target) this.finishLater(true);
  }

  resetBall() {
    const { cx, cz, hx } = this.pitch;
    if (this.mode === 'penalty') {
      const s = this.penaltySpot();
      this.placeBall(s.x, s.z);
    } else if (this.mode === 'freekick') {
      for (const w of this.wall) {
        this.scene.remove(w.h.root);
        this.phys.world.removeRigidBody(w.body);
      }
      this.wall = [];
      const bx = cx + hx - 18 - this.rnd() * 6;
      const bz = cz + (this.rnd() - 0.5) * 12;
      this.placeBall(bx, bz);
      this.buildWall(bx, bz);
    } else if (this.mode === 'goalkeeper') {
      const s = this.penaltySpot();
      this.placeBall(s.x - 3 + this.rnd() * 3, s.z + (this.rnd() - 0.5) * 6);
      this.shooterT = 2.0;
    } else if (this.mode === 'dribble') {
      this.placeBall(cx - hx + 6, cz);
      this.coneIndex = 0;
      this.cones.forEach((c) => ((c.material as THREE.MeshStandardMaterial).color.set('#ff6a00'), (c.visible = true)));
    } else this.placeBall(cx, cz);
  }

  private updateMatch(dt: number, bp: THREE.Vector3, player: THREE.Vector3) {
    const hud = footballHud.get();
    this.matchTime += dt;
    const left = Math.max(0, 180 - this.matchTime);
    if (Math.floor(left) !== Math.floor(hud.time)) footballHud.set({ time: left });
    if (left <= 0) {
      this.stop(true, hud.us >= hud.target || hud.us > hud.them);
      return;
    }
    const { cx, cz, hx, hz } = this.pitch;
    let nearestThem: AiPlayer | null = null;
    let nd = 1e9;
    for (const a of this.ai)
      if (a.team === 'them') {
        const d = a.pos.distanceTo(bp);
        if (d < nd) {
          nd = d;
          nearestThem = a;
        }
      }
    for (const a of this.ai) {
      a.cooldown -= dt;
      let target: THREE.Vector3;
      let speed = 4.2;
      if (a.team === 'them') {
        if (a === nearestThem && this.resetT < 0) {
          target = bp.clone();
          speed = 4.6;
        } else target = a.home.clone().lerp(new THREE.Vector3(bp.x, 0, bp.z), 0.3);
      } else {
        // teammates move to open space ahead of the ball
        const side = a.home.z > cz ? 1 : -1;
        target = new THREE.Vector3(THREE.MathUtils.clamp(bp.x + 8, cx - hx + 4, cx + hx - 6), 0, cz + side * 8);
        if (a.hasBall > 0) target = a.pos.clone();
      }
      target.y = 0.16;
      const d = target.clone().sub(a.pos);
      d.y = 0;
      const len = d.length();
      if (len > 0.3) {
        d.normalize();
        a.pos.addScaledVector(d, Math.min(len, speed * dt));
        a.h.root.rotation.y = Math.atan2(d.x, d.z);
      }
      a.h.root.position.copy(a.pos);
      a.body.setNextKinematicTranslation({ x: a.pos.x, y: 0.93, z: a.pos.z });
      a.h.animate(dt, len > 0.3 ? speed : 0, false);
      // ball contact
      const bd = Math.hypot(bp.x - a.pos.x, bp.z - a.pos.z);
      if (bd < 0.9 && bp.y < 0.8 && a.cooldown <= 0 && this.resetT < 0) {
        a.cooldown = 1.2;
        if (a.team === 'them') {
          // kick toward our goal (west) with some randomness
          const goal = new THREE.Vector3(cx - hx, 0, cz + (this.rnd() - 0.5) * 5);
          const dir = goal.sub(bp).setY(0).normalize();
          const far = Math.abs(bp.x - (cx - hx)) > 18;
          this.kickBall(dir, far ? 11 : 15, far ? 0.08 : 0.12);
          this.lastTouch = 'them';
          this.say(this.rnd() > 0.5 ? 'recover' : 'defend');
        } else {
          a.hasBall = 0.8;
          const toGoal = new THREE.Vector3(cx + hx, 0, cz).sub(a.pos);
          setTimeout(() => {
            if (this.mode !== 'match') return;
            a.hasBall = 0;
            const bpos = this.ballPos();
            if (toGoal.length() < 16 && this.rnd() > 0.4) {
              const dir = new THREE.Vector3(cx + hx, 0, cz + (this.rnd() - 0.5) * 5).sub(bpos).setY(0).normalize();
              this.kickBall(dir, 18, 0.12);
              this.lastTouch = 'us';
            } else {
              // pass back to RAZ, a bit ahead of him
              const dir = player.clone().add(new THREE.Vector3(3, 0, 0)).sub(bpos).setY(0);
              const pw = Math.min(15, 5 + dir.length() * 0.7);
              this.kickBall(dir.normalize(), pw, 0.05);
              this.lastTouch = 'us';
              this.say('space');
              game.set((s) => ({ football: { ...s.football, assists: s.football.assists } }));
            }
          }, 700);
        }
      }
    }
    // contextual coach orders
    if (this.coachT <= 0) {
      const dGoal = Math.abs(player.x - (cx + hx));
      const pd = player.distanceTo(new THREE.Vector3(bp.x, player.y, bp.z));
      if (pd < 2 && dGoal < 20) this.say('shoot');
      else if (pd < 2) this.say('pass');
      else if (nd < 1.5) this.say('recover');
      else if (this.rnd() < 0.01) this.say(this.rnd() > 0.5 ? 'focus' : 'space');
    }
    void hz;
  }

  private updateDribble(dt: number, bp: THREE.Vector3, player: THREE.Vector3) {
    const hud = footballHud.get();
    const left = Math.max(0, hud.time - dt);
    footballHud.set({ time: left, attempts: this.coneIndex });
    if (left <= 0) {
      this.stop(true, false);
      return;
    }
    const cone = this.cones[this.coneIndex];
    if (!cone) return;
    const dBall = Math.hypot(bp.x - cone.position.x, bp.z - cone.position.z);
    const dP = Math.hypot(player.x - cone.position.x, player.z - cone.position.z);
    if (dBall < 1.6 && dP < 3) {
      cone.material = (cone.material as THREE.MeshStandardMaterial).clone();
      (cone.material as THREE.MeshStandardMaterial).color.set('#21e05a');
      cone.visible = false;
      this.coneIndex++;
      this.say(this.coneIndex % 2 ? 'run' : 'focus');
      if (this.coneIndex >= this.cones.length) {
        footballHud.set({ us: 1 });
        this.onProgress?.('dribble', 1);
        this.finishLater(true);
      }
    }
  }

  private updateGoalkeeperMode(dt: number, bp: THREE.Vector3, bv: THREE.Vector3) {
    const shooter = this.ai[0];
    if (!shooter) return;
    shooter.h.root.position.copy(shooter.pos);
    shooter.h.animate(dt, 0, false);
    if (this.shooterT > 0 && this.resetT < 0) {
      this.shooterT -= dt;
      // walk shooter behind the ball
      const goal = new THREE.Vector3(this.pitch.cx + this.pitch.hx, 0, this.pitch.cz);
      const dir = goal.clone().sub(bp).setY(0).normalize();
      shooter.pos.copy(bp).addScaledVector(dir, -1.2).setY(0.16);
      shooter.h.root.rotation.y = Math.atan2(dir.x, dir.z);
      if (this.shooterT <= 0) {
        const aimZ = this.pitch.cz + (this.rnd() - 0.5) * 6.4;
        const aimY = 0.1 + this.rnd() * 0.25;
        const d2 = new THREE.Vector3(goal.x, 0, aimZ).sub(bp).setY(0).normalize();
        shooter.h.kick();
        this.kickBall(d2, 15 + this.rnd() * 6, aimY);
        this.shotT = 0;
        this.say('focus');
      }
    }
    if (this.shotT >= 0 && this.resetT < 0) {
      this.shotT += dt;
      if (this.shotT > 1.0 && bv.length() < 2) {
        this.shotT = -1;
        this.saved();
        this.resetT = 0.8;
      }
    }
  }

  dispose() {
    this.stop(false);
    this.scene.remove(this.ballMesh, this.keeper.root, this.ourKeeper.root);
  }
}
