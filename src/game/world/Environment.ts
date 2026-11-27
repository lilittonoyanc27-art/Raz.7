// Sky, sun, day/night cycle, street lighting and rain.
import * as THREE from 'three';
import { createStore } from '../store';

export const weather = createStore<{ rain: boolean; hour: number }>({ rain: false, hour: 9 });

export class Environment {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  hour: number;
  rain = false;
  rainAmount = 0;
  private rainPts: THREE.Points;
  private scene: THREE.Scene;
  private skyDay: THREE.Color;
  private weatherT = 90;
  private skyMesh: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  lampMats: THREE.MeshStandardMaterial[] = [];
  windowMats: THREE.MeshStandardMaterial[] = [];
  interiorLight: THREE.PointLight;
  indoor = false;
  daySpeed = 1 / 60; // game hours per real second (1 day = 24 min)

  constructor(scene: THREE.Scene, skyColor: string, hour: number, shadows: boolean, shadowSize: number) {
    this.scene = scene;
    this.hour = hour < 8 || hour > 18.5 ? 9 : hour;
    this.skyDay = new THREE.Color(skyColor);
    this.hemi = new THREE.HemisphereLight('#cfe6ff', '#6b5a45', 0.9);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff3dd', 2.4);
    this.sun.castShadow = shadows;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    const s = 45;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.06;
    scene.add(this.sun, this.sun.target);
    this.interiorLight = new THREE.PointLight('#fff2dd', 0, 40, 1.2);
    scene.add(this.interiorLight);

    // gradient sky dome
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#4a8fd8') }, bottom: { value: new THREE.Color('#cfe6f7') }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color('#fff2cc') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader:
        'uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP; void main(){ float h = clamp(vP.y*1.4+0.1,0.0,1.0); vec3 c = mix(bottom, top, h); float s = max(dot(normalize(vP), normalize(sunDir)),0.0); c += sunCol*pow(s,400.0)*2.0 + sunCol*pow(s,8.0)*0.25; gl_FragColor = vec4(c,1.0);} ',
    });
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), this.skyMat);
    this.skyMesh.renderOrder = -1;
    scene.add(this.skyMesh);
    const starGeo = new THREE.BufferGeometry();
    const sp: number[] = [];
    for (let i = 0; i < 800; i++) {
      const v = new THREE.Vector3().randomDirection();
      if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
      v.multiplyScalar(850);
      sp.push(v.x, v.y, v.z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
    scene.add(this.stars);
    scene.fog = new THREE.Fog('#cfe6f7', 120, 520);

    // rain particles around the camera
    const n = 6000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rainPts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#b8c8d8', size: 0.08, transparent: true, opacity: 0.0 }));
    this.rainPts.frustumCulled = false;
    scene.add(this.rainPts);
  }

  setRain(on: boolean) {
    this.rain = on;
    weather.set({ rain: on });
  }

  setHour(h: number) {
    this.hour = ((h % 24) + 24) % 24;
  }

  update(dt: number, center: THREE.Vector3, cam: THREE.Camera) {
    // always a clear, bright day: time runs from 8:00 to 18:30 and starts again
    this.hour += dt * this.daySpeed;
    if (this.hour < 8 || this.hour > 18.5) this.hour = 8;
    if (this.rain) this.setRain(false);
    if (Math.floor(this.hour * 4) !== Math.floor(weather.get().hour * 4)) weather.set({ hour: this.hour });
    this.rainAmount = THREE.MathUtils.lerp(this.rainAmount, this.rain ? 1 : 0, 1 - Math.exp(-dt * 0.5));

    // sun position
    const t = ((this.hour - 6) / 12) * Math.PI; // 6h sunrise, 18h sunset
    const elev = Math.sin(t);
    const dir = new THREE.Vector3(Math.cos(t) * 0.8, Math.max(-0.3, elev), 0.45).normalize();
    const day = THREE.MathUtils.smoothstep(elev, -0.15, 0.25);
    const dusk = Math.max(0, 1 - Math.abs(elev) * 4) * (elev > -0.2 ? 1 : 0);
    const cloud = 1 - this.rainAmount * 0.55;
    this.sun.position.copy(center).addScaledVector(dir, 120);
    this.sun.target.position.copy(center);
    this.sun.intensity = (this.indoor ? 0 : 2.9) * day * cloud;
    this.sun.color.setRGB(1, 0.92 - dusk * 0.25, 0.85 - dusk * 0.45);
    this.hemi.intensity = 0.45 + day * 0.85 * cloud + (this.indoor ? 0.4 : 0);
    const top = new THREE.Color('#0b1430').lerp(this.skyDay.clone().multiplyScalar(0.75), day);
    const bottom = new THREE.Color('#1a2340').lerp(new THREE.Color('#dcecf7'), day).lerp(new THREE.Color('#ffb070'), dusk * 0.6);
    const grey = new THREE.Color('#8d969e').multiplyScalar(0.4 + day * 0.6);
    top.lerp(grey, this.rainAmount * 0.7);
    bottom.lerp(grey, this.rainAmount * 0.7);
    this.skyMat.uniforms.top.value.copy(top);
    this.skyMat.uniforms.bottom.value.copy(bottom);
    this.skyMat.uniforms.sunDir.value.copy(dir);
    this.skyMesh.position.copy(cam.position);
    this.stars.position.copy(cam.position);
    (this.stars.material as THREE.PointsMaterial).opacity = (1 - day) * (1 - this.rainAmount);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(bottom);
    fog.far = 520 - this.rainAmount * 300;
    fog.near = 120 - this.rainAmount * 80;
    const night = 1 - day;
    for (const m of this.lampMats) m.emissiveIntensity = 0.1 + night * 2.5;
    for (const m of this.windowMats) m.emissiveIntensity = night * 0.9;

    // rain
    const mat = this.rainPts.material as THREE.PointsMaterial;
    mat.opacity = this.rainAmount * 0.6;
    this.rainPts.visible = this.rainAmount > 0.02 && !this.indoor;
    if (this.rainPts.visible) {
      this.rainPts.position.set(cam.position.x, 0, cam.position.z);
      const p = this.rainPts.geometry.attributes.position as THREE.BufferAttribute;
      const arr = p.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= dt * 22;
        if (arr[i] < 0) arr[i] += 40;
      }
      p.needsUpdate = true;
    }
  }

  isNight() {
    return this.hour < 6.5 || this.hour > 19.5;
  }
}
