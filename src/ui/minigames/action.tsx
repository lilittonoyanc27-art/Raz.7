import { useEffect, useMemo, useRef, useState } from 'react';
import { T, TBadge } from '../../i18n/T';
import { speak } from '../../i18n/speech';
import { shuffle } from '../../game/data/grammar';
import { recordAnswer } from '../../game/state';
import type { MgProps } from './index';

const COLORS = [
  { es: 'rojo', esF: 'roja', hy: 'կարմիր', c: '#ff4d4d' },
  { es: 'azul', esF: 'azul', hy: 'կապույտ', c: '#2fb5ff' },
  { es: 'verde', esF: 'verde', hy: 'կանաչ', c: '#2ecc71' },
  { es: 'amarillo', esF: 'amarilla', hy: 'դեղին', c: '#ffd24a' },
  { es: 'blanco', esF: 'blanca', hy: 'սպիտակ', c: '#f4f4f4' },
];
const SIZES = [
  { es: 'grande', hy: 'մեծ', r: 38 },
  { es: 'pequeño', esF: 'pequeña', hy: 'փոքր', r: 20 },
];

// ---------------------------------------------------------------- Laser / Paintball
export function Laser({ level, add, variant }: MgProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paint = variant === 'paintball';
  const [cmd, setCmd] = useState<{ es: string; hy: string }>({ es: '', hy: '' });
  const cmdRef = useRef<(t: Target) => boolean>(() => false);
  interface Target { x: number; y: number; vx: number; vy: number; color: (typeof COLORS)[number]; size: (typeof SIZES)[number]; num: number; hit: number }
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = devicePixelRatio;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    let targets: Target[] = [];
    const splats: { x: number; y: number; c: string }[] = [];
    const newRound = () => {
      const n = 5 + level * 2;
      targets = Array.from({ length: n }, (_, i) => ({
        x: (80 + Math.random() * (c.clientWidth - 160)) * dpr,
        y: (60 + Math.random() * (c.clientHeight - 120)) * dpr,
        vx: (Math.random() - 0.5) * (paint ? 30 : 80 + level * 50) * dpr,
        vy: (Math.random() - 0.5) * (paint ? 30 : 80 + level * 50) * dpr,
        color: COLORS[Math.floor(Math.random() * (3 + level))],
        size: SIZES[Math.floor(Math.random() * 2)],
        num: i + 1,
        hit: 0,
      }));
      const t = targets[Math.floor(Math.random() * targets.length)];
      const noun = paint ? 'la diana' : 'el robot';
      const kind = Math.random();
      let es: string;
      let hy: string;
      let test: (x: Target) => boolean;
      if (kind < 0.4 || level === 0) {
        es = `Dispara a ${noun} ${paint ? t.color.esF : t.color.es}.`;
        hy = `Կրակիր ${t.color.hy} ${paint ? 'թիրախին' : 'ռոբոտին'}։`;
        test = (x) => x.color === t.color;
      } else if (kind < 0.75) {
        const sz = paint ? t.size.esF ?? t.size.es : t.size.es;
        es = `Dispara a ${noun} ${paint ? t.color.esF : t.color.es} ${sz}.`;
        hy = `Կրակիր ${t.size.hy} ${t.color.hy} ${paint ? 'թիրախին' : 'ռոբոտին'}։`;
        test = (x) => x.color === t.color && x.size === t.size;
      } else {
        const nums = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        es = `Dispara a ${noun} número ${nums[t.num]}.`;
        hy = `Կրակիր ${t.num} համարի ${paint ? 'թիրախին' : 'ռոբոտին'}։`;
        test = (x) => x.num === t.num;
      }
      cmdRef.current = test;
      setCmd({ es, hy });
      speak(es);
    };
    newRound();
    let raf = 0;
    let last = performance.now();
    const parts: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
    const beams: { x: number; y: number; t: number }[] = [];
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    };
    (c as unknown as { __fx: (x: number, y: number, col: string) => void }).__fx = (x, y, col) => {
      beams.push({ x, y, t: performance.now() });
      for (let i = 0; i < 30; i++) {
        const an = Math.random() * Math.PI * 2;
        const v = (1 + Math.random() * 5) * dpr;
        parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: 1, c: col });
      }
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // background: neon perspective floor (laser) or park grass (paintball)
      const bg = g.createLinearGradient(0, 0, 0, c.height);
      if (paint) {
        bg.addColorStop(0, '#1e3a24');
        bg.addColorStop(1, '#0f1f13');
      } else {
        bg.addColorStop(0, '#07091a');
        bg.addColorStop(1, '#1b0730');
      }
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      if (!paint) {
        const hz = c.height * 0.35;
        g.strokeStyle = 'rgba(255,59,107,0.35)';
        g.lineWidth = 1 * dpr;
        for (let i = -12; i <= 12; i++) {
          g.beginPath();
          g.moveTo(c.width / 2 + i * 12 * dpr, hz);
          g.lineTo(c.width / 2 + i * 120 * dpr, c.height);
          g.stroke();
        }
        const off = ((now * 0.05) % 40) * dpr;
        for (let y = 0; y < 14; y++) {
          const t = (y * 40 * dpr + off) / (c.height - hz);
          const yy = hz + Math.pow(t, 1.6) * (c.height - hz);
          if (yy > c.height) continue;
          g.globalAlpha = Math.min(1, t * 1.5);
          g.beginPath();
          g.moveTo(0, yy);
          g.lineTo(c.width, yy);
          g.stroke();
        }
        g.globalAlpha = 1;
      } else {
        g.fillStyle = 'rgba(255,255,255,0.03)';
        for (let i = 0; i < 12; i++) g.fillRect(((i * 137) % c.width) | 0, 0, 40 * dpr, c.height);
      }
      for (const s of splats) {
        g.fillStyle = s.c;
        g.globalAlpha = 0.55;
        g.beginPath();
        for (let k = 0; k < 9; k++) {
          const an = (k / 9) * Math.PI * 2;
          const rad = (10 + ((k * 7) % 6)) * dpr;
          g.lineTo(s.x + Math.cos(an) * rad, s.y + Math.sin(an) * rad);
        }
        g.fill();
        g.globalAlpha = 1;
      }
      for (const t of targets) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        const r = t.size.r * dpr;
        if (t.x < r || t.x > c.width - r) t.vx *= -1;
        if (t.y < r || t.y > c.height - r) t.vy *= -1;
        g.save();
        g.shadowColor = t.color.c;
        g.shadowBlur = 22 * dpr;
        if (paint) {
          for (let k = 4; k > 0; k--) {
            g.fillStyle = k % 2 ? t.color.c : '#ffffff';
            g.beginPath();
            g.arc(t.x, t.y, (r * k) / 4, 0, Math.PI * 2);
            g.fill();
          }
        } else {
          const bob = Math.sin(now * 0.005 + t.num) * 3 * dpr;
          const gr = g.createLinearGradient(t.x, t.y - r, t.x, t.y + r);
          gr.addColorStop(0, t.color.c);
          gr.addColorStop(1, '#1a1a24');
          g.fillStyle = gr;
          rr(t.x - r, t.y - r + bob, r * 2, r * 2, r * 0.35);
          g.fill();
          g.shadowBlur = 0;
          g.fillStyle = '#0b0d18';
          rr(t.x - r * 0.75, t.y - r * 0.55 + bob, r * 1.5, r * 0.6, r * 0.2);
          g.fill();
          g.fillStyle = '#7df9ff';
          g.shadowColor = '#7df9ff';
          g.shadowBlur = 12 * dpr;
          for (const s of [-1, 1]) {
            g.beginPath();
            g.arc(t.x + s * r * 0.35, t.y - r * 0.25 + bob, r * 0.14, 0, Math.PI * 2);
            g.fill();
          }
          g.strokeStyle = t.color.c;
          g.lineWidth = 2 * dpr;
          g.beginPath();
          g.moveTo(t.x, t.y - r + bob);
          g.lineTo(t.x, t.y - r * 1.45 + bob);
          g.stroke();
          g.beginPath();
          g.arc(t.x, t.y - r * 1.5 + bob, 3 * dpr, 0, Math.PI * 2);
          g.fillStyle = t.color.c;
          g.fill();
        }
        g.restore();
        g.fillStyle = paint ? '#111' : '#fff';
        g.font = `900 ${14 * dpr}px Inter`;
        g.textAlign = 'center';
        g.fillText(String(t.num), t.x, t.y + r * (paint ? 0.15 : 0.6));
      }
      const nowT = performance.now();
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        const k = 1 - (nowT - b.t) / 200;
        if (k <= 0) {
          beams.splice(i, 1);
          continue;
        }
        g.save();
        g.shadowColor = paint ? '#ff6a00' : '#ff3b6b';
        g.shadowBlur = 24 * dpr;
        g.strokeStyle = paint ? `rgba(255,140,40,${k})` : `rgba(255,80,140,${k})`;
        g.lineWidth = 5 * dpr * k;
        g.beginPath();
        g.moveTo(c.width / 2, c.height);
        g.lineTo(b.x, b.y);
        g.stroke();
        g.restore();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1 * dpr;
        p.life -= dt * 1.5;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        g.globalAlpha = p.life;
        g.fillStyle = p.c;
        g.beginPath();
        g.arc(p.x, p.y, 3 * dpr * p.life + 1, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const click = (e: PointerEvent) => {
      const rr = c.getBoundingClientRect();
      const x = (e.clientX - rr.left) * dpr;
      const y = (e.clientY - rr.top) * dpr;
      const hit = targets.find((t) => Math.hypot(t.x - x, t.y - y) < t.size.r * dpr + 6);
      if (paint) splats.push({ x, y, c: ['#ff6a00', '#2fb5ff', '#ff3b6b', '#2ecc71'][splats.length % 4] });
      const fx = (c as unknown as { __fx: (x: number, y: number, col: string) => void }).__fx;
      if (!hit) {
        fx(x, y, 'rgba(255,255,255,0.6)');
        return;
      }
      const ok = cmdRef.current(hit);
      fx(hit.x, hit.y, ok ? '#ffd24a' : '#ff4d4d');
      add(ok ? 12 : -5);
      recordAnswer(ok, { es: 'colores y números', hy: 'գույներ և թվեր', topic: 'deporte' });
      if (ok) newRound();
    };
    c.addEventListener('pointerdown', click);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener('pointerdown', click);
    };
  }, [level, add, paint]);
  return (
    <>
      <div className="mg-top">
        <span className="hint">
          <T {...cmd} />
        </span>
        <button className="btn sm" onClick={() => speak(cmd.es)}>
          Escuchar <TBadge es="Escuchar" hy="Լսել" />
        </button>
      </div>
      <canvas ref={ref} className="mg-canvas" style={{ cursor: 'crosshair' }} />
    </>
  );
}

// ---------------------------------------------------------------- Reaction
const ORDERS = [
  { es: '¡Arriba!', hy: 'Վերև', key: 'ArrowUp', icon: '↑' },
  { es: '¡Abajo!', hy: 'Ներքև', key: 'ArrowDown', icon: '↓' },
  { es: '¡A la izquierda!', hy: 'Ձախ', key: 'ArrowLeft', icon: '←' },
  { es: '¡A la derecha!', hy: 'Աջ', key: 'ArrowRight', icon: '→' },
  { es: '¡Salta!', hy: 'Ցատկիր', key: 'Space', icon: '⤒' },
];
export function Reaction({ level, add }: MgProps) {
  const [o, setO] = useState(() => ORDERS[0]);
  const [t0, setT0] = useState(performance.now());
  const [fb, setFb] = useState('');
  const window_ = [2600, 1900, 1300][level];
  const next = () => {
    const n = ORDERS[Math.floor(Math.random() * ORDERS.length)];
    setO(n);
    setT0(performance.now());
    if (level < 2) speak(n.es);
  };
  useEffect(() => {
    const id = setTimeout(() => {
      add(-3);
      setFb('⏱');
      next();
    }, window_);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o, t0]);
  const press = (key: string) => {
    const ok = key === o.key;
    const ms = performance.now() - t0;
    add(ok ? Math.max(3, Math.round(15 - ms / 150)) : -4);
    setFb(ok ? `✓ ${Math.round(ms)} ms` : '✗');
    recordAnswer(ok, { es: o.es, hy: o.hy, topic: 'imperativo' });
    next();
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (ORDERS.some((x) => x.key === e.code)) {
        e.preventDefault();
        press(e.code);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  return (
    <div style={{ textAlign: 'center', paddingTop: 30 }}>
      <div style={{ fontSize: 56, fontWeight: 900 }}>{o.es}</div>
      <div className="muted">{fb}</div>
      <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
        {shuffle(ORDERS).map((x) => (
          <button key={x.key} className="btn" style={{ fontSize: 28, width: 90, height: 90, justifyContent: 'center' }} onClick={() => press(x.key)}>
            {x.icon}
          </button>
        ))}
      </div>
      <p className="small muted">
        <T es="Usa las flechas del teclado y la barra espaciadora, o los botones." hy="Օգտագործիր ստեղնաշարի սլաքները և բացատը, կամ կոճակները։" />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- Freestyle
const TRICKS = [
  { es: 'Toque con el pie derecho', hy: 'Հպում աջ ոտքով', id: 'pd' },
  { es: 'Toque con el pie izquierdo', hy: 'Հպում ձախ ոտքով', id: 'pi' },
  { es: 'Toque con la rodilla', hy: 'Հպում ծնկով', id: 'ro' },
  { es: 'Toque con la cabeza', hy: 'Հպում գլխով', id: 'ca' },
  { es: 'Toque con el pecho', hy: 'Հպում կրծքով', id: 'pe' },
  { es: 'Vuelta al mundo', hy: '«Շրջան աշխարհով» հնարք', id: 'vu' },
];
export function Freestyle({ level, add }: MgProps) {
  const [trick, setTrick] = useState(TRICKS[0]);
  const [combo, setCombo] = useState(0);
  const [beat, setBeat] = useState(0);
  const speed = [1800, 1400, 1000][level];
  const buttons = useMemo(() => TRICKS.slice(0, 4 + level), [level]);
  useEffect(() => {
    const iv = setInterval(() => {
      setBeat((b) => b + 1);
      setTrick(buttons[Math.floor(Math.random() * buttons.length)]);
    }, speed);
    return () => clearInterval(iv);
  }, [speed, buttons]);
  const [answered, setAnswered] = useState(-1);
  const hit = (id: string) => {
    if (answered === beat) return;
    setAnswered(beat);
    const ok = id === trick.id;
    setCombo((c) => (ok ? c + 1 : 0));
    add(ok ? 5 + Math.min(10, combo) : -3);
    recordAnswer(ok, { es: trick.es, hy: trick.hy, topic: 'deporte' });
  };
  return (
    <div style={{ textAlign: 'center', paddingTop: 20 }}>
      <svg viewBox="0 0 200 120" style={{ height: 140 }}>
        <circle cx="100" cy={trick.id === 'ca' ? 18 : trick.id === 'pe' ? 45 : trick.id === 'ro' ? 70 : 95} r="10" fill="#fff" />
        <circle cx="100" cy="30" r="10" fill="#e3b28e" />
        <rect x="88" y="40" width="24" height="34" rx="6" fill="#ff6a00" />
        <rect x="88" y="74" width="10" height="34" fill="#16181c" />
        <rect x="102" y="74" width="10" height="34" fill="#16181c" />
      </svg>
      <div style={{ fontSize: 34, fontWeight: 900, margin: '10px 0' }}>{trick.es}</div>
      <div className="pill orange">Combo ×{combo}</div>
      <div className="grid c3" style={{ maxWidth: 620, margin: '24px auto 0' }}>
        {buttons.map((b) => (
          <button key={b.id} className="btn block" style={{ justifyContent: 'center', padding: 18 }} onClick={() => hit(b.id)} lang="hy">
            {b.hy}
          </button>
        ))}
      </div>
      <p className="small muted">
        <T es="Lee el truco en español y pulsa el botón correcto en armenio antes del siguiente compás." hy="Կարդա հնարքը իսպաներեն և սեղմիր ճիշտ հայերեն կոճակը մինչև հաջորդ զարկը։" />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- Maze
const DIRS = [
  { dx: 0, dy: -1, es: 'Sigue recto hacia arriba.', hy: 'Շարունակիր ուղիղ դեպի վեր։' },
  { dx: 1, dy: 0, es: 'Gira a la derecha.', hy: 'Թեքվիր աջ։' },
  { dx: 0, dy: 1, es: 'Baja.', hy: 'Իջիր ներքև։' },
  { dx: -1, dy: 0, es: 'Gira a la izquierda.', hy: 'Թեքվիր ձախ։' },
];
export function Maze({ level, add, end }: MgProps) {
  const N = [9, 13, 17][level];
  const maze = useMemo(() => {
    // recursive backtracker on odd grid
    const W = N * 2 + 1;
    const g: number[][] = Array.from({ length: W }, () => Array(W).fill(1));
    const stack: [number, number][] = [[1, 1]];
    g[1][1] = 0;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nb = shuffle(DIRS).map((d) => [x + d.dx * 2, y + d.dy * 2, d] as const).filter(([nx, ny]) => nx > 0 && ny > 0 && nx < W - 1 && ny < W - 1 && g[ny][nx] === 1);
      if (!nb.length) stack.pop();
      else {
        const [nx, ny, d] = nb[0];
        g[y + d.dy][x + d.dx] = 0;
        g[ny][nx] = 0;
        stack.push([nx, ny]);
      }
    }
    return g;
  }, [N]);
  const W = N * 2 + 1;
  const exit: [number, number] = [W - 2, W - 2];
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  // BFS for the hint
  const hint = useMemo(() => {
    const prev = new Map<string, [number, number]>();
    const q: [number, number][] = [exit];
    prev.set(exit.join(), exit);
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const d of DIRS) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (maze[ny]?.[nx] === 0 && !prev.has(nx + ',' + ny)) {
          prev.set(nx + ',' + ny, [x, y]);
          q.push([nx, ny]);
        }
      }
    }
    const nxt = prev.get(pos.join());
    if (!nxt) return DIRS[0];
    return DIRS.find((d) => d.dx === nxt[0] - pos[0] && d.dy === nxt[1] - pos[1]) ?? DIRS[0];
  }, [pos, maze, exit]);
  const move = (d: (typeof DIRS)[number]) => {
    const nx = pos[0] + d.dx;
    const ny = pos[1] + d.dy;
    if (maze[ny]?.[nx] !== 0) return;
    if (d === hint) add(1);
    setPos([nx, ny]);
    if (nx === exit[0] && ny === exit[1]) {
      add(100);
      end();
    }
  };
  useEffect(() => {
    const map: Record<string, number> = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
    const h = (e: KeyboardEvent) => {
      if (map[e.code] !== undefined) {
        e.preventDefault();
        move(DIRS[map[e.code]]);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const view = 3 + (2 - level);
  return (
    <div className="row" style={{ gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${W}, 1fr)`, width: 'min(520px, 90vw)', aspectRatio: '1', background: '#111', borderRadius: 10, overflow: 'hidden' }}>
        {maze.flatMap((row, y) =>
          row.map((v, x) => {
            const vis = Math.abs(x - pos[0]) <= view && Math.abs(y - pos[1]) <= view;
            const me = x === pos[0] && y === pos[1];
            const ex = x === exit[0] && y === exit[1];
            return <div key={x + '_' + y} style={{ background: me ? '#ff6a00' : ex ? '#2ecc71' : !vis ? '#0a0a0a' : v ? '#3a3d44' : '#d9d4cc' }} />;
          }),
        )}
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div className="hint">
          <T es={hint.es} hy={hint.hy} />
        </div>
        <div className="grid c3" style={{ maxWidth: 220, marginTop: 14 }}>
          <span />
          <button className="btn" onClick={() => move(DIRS[0])}>↑</button>
          <span />
          <button className="btn" onClick={() => move(DIRS[3])}>←</button>
          <button className="btn" onClick={() => move(DIRS[2])}>↓</button>
          <button className="btn" onClick={() => move(DIRS[1])}>→</button>
        </div>
        <p className="small muted">
          <T es="Sigue las indicaciones en español para encontrar la salida verde." hy="Հետևիր իսպաներեն ցուցումներին՝ կանաչ ելքը գտնելու համար։" />
        </p>
      </div>
    </div>
  );
}
