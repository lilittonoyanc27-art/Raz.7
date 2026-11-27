// Procedural sound with the Web Audio API: city ambience, footsteps, engine,
// ball kicks, stadium crowd, rain, birds and UI blips.
import { settings } from '../settings';

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  private noiseBuf!: AudioBuffer;
  private loops: Record<string, { g: GainNode; src: AudioScheduledSourceNode; filter?: BiquadFilterNode; osc?: OscillatorNode }> = {};

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
      return true;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch {
      return false;
    }
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolume();
    settings.subscribe(() => this.applyVolume());
    // ambient loops
    // no continuous background noise (city / crowd / wind / rain loops removed)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 400;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    osc.connect(f).connect(g).connect(this.master);
    osc.start();
    this.loops.engine = { g, src: osc, filter: f, osc };
    return true;
  }

  private applyVolume() {
    if (!this.ctx) return;
    const s = settings.get();
    this.master.gain.value = s.masterVolume * s.sfxVolume;
  }

  private noiseLoop(name: string, type: BiquadFilterType, freq: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start();
    this.loops[name] = { g, src, filter: f };
  }

  setLoop(name: string, vol: number) {
    const l = this.loops[name];
    if (!l || !this.ctx) return;
    l.g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.3);
  }

  setEngine(on: boolean, speed: number, kind: 'car' | 'bike') {
    const l = this.loops.engine;
    if (!l || !this.ctx) return;
    const vol = on && kind === 'car' ? 0.05 + Math.min(0.08, Math.abs(speed) * 0.004) : 0;
    l.g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    l.osc!.frequency.setTargetAtTime(45 + Math.abs(speed) * 6, this.ctx.currentTime, 0.1);
    l.filter!.frequency.setTargetAtTime(300 + Math.abs(speed) * 40, this.ctx.currentTime, 0.1);
  }

  private burst(freq: number, dur: number, vol: number, type: BiquadFilterType = 'lowpass', q = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', slide = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  step(surface: 'hard' | 'grass' | 'sand' = 'hard') {
    this.burst(surface === 'hard' ? 1800 : surface === 'grass' ? 900 : 600, 0.07, 0.12, 'bandpass', 1.2);
  }
  kick(power: number) {
    this.tone(140, 0.12, 0.5 * (0.5 + power), 'sine', -80);
    this.burst(2500, 0.05, 0.2, 'bandpass', 2);
  }
  jump() {
    this.burst(700, 0.1, 0.1, 'bandpass');
  }
  crash() {
    this.burst(400, 0.4, 0.5, 'lowpass');
    this.tone(90, 0.3, 0.3, 'square', -50);
  }
  door() {
    this.tone(300, 0.08, 0.15, 'triangle', 100);
    this.burst(1200, 0.12, 0.1, 'bandpass');
  }
  bell() {
    this.tone(1600, 0.25, 0.08, 'sine');
  }
  bird() {
    if (!this.ctx) return;
    const f = 2500 + Math.random() * 1500;
    this.tone(f, 0.08, 0.04, 'sine', 900);
    setTimeout(() => this.tone(f * 1.1, 0.07, 0.03, 'sine', -700), 110);
  }
  ok() {
    this.tone(660, 0.12, 0.15, 'triangle');
    setTimeout(() => this.tone(990, 0.18, 0.15, 'triangle'), 100);
  }
  bad() {
    this.tone(220, 0.25, 0.15, 'square', -60);
  }
  click() {
    this.tone(880, 0.04, 0.06, 'triangle');
  }
  coin() {
    this.tone(1320, 0.08, 0.1, 'square');
    setTimeout(() => this.tone(1760, 0.12, 0.1, 'square'), 70);
  }
  whistle() {
    this.tone(2800, 0.35, 0.1, 'sine', 200);
  }
  goal() {
    this.burst(900, 2.5, 0.35, 'bandpass', 0.6);
    this.ok();
  }
  horn() {
    this.tone(420, 0.3, 0.12, 'square');
    this.tone(520, 0.3, 0.08, 'square');
  }
}

export const sfx = new AudioEngine();
