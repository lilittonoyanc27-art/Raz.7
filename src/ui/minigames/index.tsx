// Minigame host: shared shell with difficulty, timer, score, end screen and replay.
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { T, TBadge, TButton } from '../../i18n/T';
import { UI } from '../../i18n/ui';
import { MINIGAMES } from '../../game/data/minigames';
import { closeModal, ui } from '../../game/ui';
import { finishMinigame } from '../../game/controller';
import { game } from '../../game/state';
import { sfx } from '../../game/world/Audio';
import { Memory, Pasapalabra, Millonario, GrammarBattle, WordShooter } from './word';
import { Laser, Reaction, Freestyle, Maze } from './action';
import { Cooking, Escape, Detective, SupermarketChallenge, AirportChallenge, Manager } from './life';

export type Level = 0 | 1 | 2;
export interface MgProps {
  level: Level;
  add: (n: number) => void;
  end: () => void;
  time: number;
  variant?: string;
}

const REG: Record<string, { C: ComponentType<MgProps>; time: [number, number, number] | null; variant?: string }> = {
  memory: { C: Memory, time: [120, 100, 80] },
  pasapalabra: { C: Pasapalabra, time: [200, 160, 120] },
  millonario: { C: Millonario, time: null },
  grammar: { C: GrammarBattle, time: [180, 150, 120] },
  wordshooter: { C: WordShooter, time: [75, 75, 75] },
  laser: { C: Laser, time: [70, 70, 70], variant: 'laser' },
  paintball: { C: Laser, time: [70, 70, 70], variant: 'paintball' },
  reaction: { C: Reaction, time: [45, 45, 45] },
  freestyle: { C: Freestyle, time: [50, 50, 50] },
  maze: { C: Maze, time: [150, 120, 100] },
  cooking: { C: Cooking, time: [120, 90, 70] },
  escape: { C: Escape, time: [300, 240, 180] },
  detective: { C: Detective, time: null },
  supermarket: { C: SupermarketChallenge, time: [90, 70, 50] },
  airport: { C: AirportChallenge, time: [90, 70, 50] },
  manager: { C: Manager, time: null },
};

/** Line icons for every minigame (24×24 viewBox). */
const ICONS: Record<string, string> = {
  laser: 'M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  paintball: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 11.5v1',
  wordshooter: 'M4 20L20 4M14 4h6v6M5 9h5M5 13h3',
  memory: 'M3 5h8v14H3zM13 5h8v14h-8zM7 10v4M17 10l-2 4h4',
  pasapalabra: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM9 15l3-7 3 7M10 13h4',
  millonario: 'M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z',
  grammar: 'M4 6h16v10H8l-4 4zM8 10h8M8 13h5',
  reaction: 'M13 2L4 14h7l-1 8 9-12h-7z',
  cooking: 'M4 11h16M6 11v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4',
  escape: 'M14 3H5v18h9M10 12h11M18 9l3 3-3 3',
  detective: 'M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM14.5 14.5L20 20',
  supermarket: 'M3 4h2l2.5 11h11L21 7H7M9 20h.01M17 20h.01',
  airport: 'M2 16l20-8-4 10-5-3-3 4-1-6z',
  maze: 'M3 3h18v18H3zM7 3v10M11 7v14M15 3v10M19 7v6',
  manager: 'M8 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM4 20c0-4 3-6 7-6s7 2 7 6',
  freestyle: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM7 21l2-6 3 2 3-2 2 6',
  penalty: 'M3 6h18v12M3 6v12M12 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  goalkeeper: 'M3 6h18v12M3 6v12M9 11l3-3 3 3M12 8v8',
  carrace: 'M5 15l2-6h10l2 6M3 15h18v3H3zM7 18v2M17 18v2',
  bikerace: 'M6 17a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM18 17a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM6 14l4-6h5l3 6M10 8l2 6',
  delivery: 'M3 7h11v10H3zM14 10h4l3 3v4h-7M7 20a2 2 0 1 0 0-.01M17 20a2 2 0 1 0 0-.01',
  treasure: 'M4 10h16v10H4zM4 10l2-5h12l2 5M12 13v3',
};
export function MgIcon({ id, size = 28 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[id] ?? ICONS.memory} />
    </svg>
  );
}

function TimerRing({ left, total }: { left: number; total: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, left / total));
  const low = left < 10;
  return (
    <div className={'mg-timer' + (low ? ' low' : '')}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="4" fill="none" />
        <circle cx="22" cy="22" r={r} stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - f)} strokeLinecap="round" transform="rotate(-90 22 22)" />
      </svg>
      <b>{Math.ceil(left)}</b>
    </div>
  );
}

function Confetti({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    c.width = c.clientWidth * devicePixelRatio;
    c.height = c.clientHeight * devicePixelRatio;
    const cols = [color, '#ffffff', '#ffd24a', '#ff6a00', '#2fb5ff', '#2ecc71'];
    const ps = Array.from({ length: 140 }, () => ({
      x: Math.random() * c.width,
      y: -Math.random() * c.height * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: (4 + Math.random() * 6) * devicePixelRatio,
      c: cols[Math.floor(Math.random() * cols.length)],
    }));
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      g.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.x += p.vx * devicePixelRatio;
        p.y += p.vy * devicePixelRatio;
        p.r += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.fillStyle = p.c;
        g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        g.restore();
      }
      if (performance.now() - t0 < 4500) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [color]);
  return <canvas ref={ref} className="mg-confetti" />;
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function MinigameHost({ id }: { id: string }) {
  const def = MINIGAMES.find((m) => m.id === id)!;
  const reg = REG[id];
  const [level, setLevel] = useState<Level>(0);
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro');
  const [score, setScore] = useState(0);
  const [bump, setBump] = useState(0);
  const [left, setLeft] = useState(0);
  const [run, setRun] = useState(0);
  const scoreRef = useRef(0);
  const best = game.get().minigames[id] ?? 0;
  const inMenu = ui.get().screen === 'menu';
  const final = Math.max(0, Math.round(score * (1 + level * 0.25)));
  const shown = useCountUp(phase === 'end' ? final : 0);
  const stars = final >= 180 ? 3 : final >= 80 ? 2 : final > 0 ? 1 : 0;

  const end = useCallback(() => {
    setPhase((p) => {
      if (p !== 'play') return p;
      const f = Math.max(0, Math.round(scoreRef.current * (1 + level * 0.25)));
      finishMinigame(id, f);
      sfx.whistle();
      return 'end';
    });
  }, [id, level]);
  const add = useCallback((n: number) => {
    scoreRef.current = Math.max(0, scoreRef.current + n);
    setScore(scoreRef.current);
    setBump((b) => b + 1);
    if (n > 0) sfx.ok();
    else if (n < 0) sfx.bad();
  }, []);

  useEffect(() => {
    if (phase !== 'play' || !reg.time) return;
    const total = reg.time[level];
    setLeft(total);
    const t0 = performance.now();
    const iv = setInterval(() => {
      const l = Math.max(0, total - (performance.now() - t0) / 1000);
      setLeft(l);
      if (l <= 0) end();
    }, 200);
    return () => clearInterval(iv);
  }, [phase, level, reg.time, end, run]);

  if (!reg) return null;
  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setRun((r) => r + 1);
    setPhase('play');
  };
  const levels = [
    { tr: UI.easy, stars: 1, hy: 'Հանգիստ տեմպ, ավելի շատ ժամանակ' },
    { tr: UI.normal, stars: 2, hy: 'Միջին արագություն' },
    { tr: UI.hard, stars: 3, hy: 'Արագ և ավելի շատ միավոր (+50%)' },
  ];
  const levelDesc = [
    { es: 'Ritmo tranquilo, más tiempo', hy: levels[0].hy },
    { es: 'Velocidad media', hy: levels[1].hy },
    { es: 'Rápido y con más puntos (+50%)', hy: levels[2].hy },
  ];
  return (
    <div className="modal full mg" style={{ ['--mg' as string]: def.color }} onClick={(e) => e.stopPropagation()}>
      <div className="mg-bg" />
      <div className="mg-head">
        <div className="row" style={{ gap: 12 }}>
          <div className="mg-icon">
            <MgIcon id={id} />
          </div>
          <div>
            <div className="mg-kicker">
              <T {...UI.minigames} />
            </div>
            <h2 className="mg-title">{def.name.es}</h2>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {phase === 'play' && (
            <>
              <div className="mg-score" key={bump}>
                <span className="small">
                  <T {...UI.score} />
                </span>
                <b>{score}</b>
              </div>
              {reg.time && <TimerRing left={left} total={reg.time[level]} />}
            </>
          )}
          <button className="mg-close" onClick={closeModal} title={UI.close.es}>
            ✕
          </button>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="mg-intro">
          <div className="mg-hero">
            <div className="mg-hero-icon">
              <MgIcon id={id} size={88} />
            </div>
            <p className="mg-desc">
              <T {...def.desc} />
            </p>
            <div className="mg-best">
              <span>
                <T {...UI.best} />
              </span>
              <b>{best}</b>
            </div>
          </div>
          <div className="mg-setup">
            <div className="mg-kicker">
              <T {...UI.difficulty} />
            </div>
            <div className="mg-levels">
              {levels.map((l, i) => (
                <button key={i} className={'mg-level' + (level === i ? ' on' : '')} onClick={() => setLevel(i as Level)}>
                  <span className="mg-stars">{'★'.repeat(l.stars)}<i>{'★'.repeat(3 - l.stars)}</i></span>
                  <b>{l.tr.es}</b>
                  <span className="small">{levelDesc[i].es}</span>
                  <TBadge es={`${l.tr.es}: ${levelDesc[i].es}`} hy={`${l.tr.hy}՝ ${levelDesc[i].hy}`} />
                </button>
              ))}
            </div>
            <button className="mg-play" onClick={start}>
              <span>▶</span> {UI.start.es} <TBadge {...UI.start} />
            </button>
            {inMenu && (
              <p className="small muted" style={{ marginTop: 12 }}>
                <T es="Las recompensas se guardan en tu partida." hy="Պարգևները պահպանվում են քո խաղում։" />
              </p>
            )}
          </div>
        </div>
      )}
      {phase === 'play' && (
        <div className="mg-stage">
          <reg.C key={run} level={level} add={add} end={end} time={left} variant={reg.variant} />
        </div>
      )}
      {phase === 'end' && (
        <div className="mg-end">
          {stars > 0 && <Confetti color={def.color} />}
          <div className="mg-kicker">
            <T {...UI.gameOver} />
          </div>
          <div className="mg-end-stars">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < stars ? 'on' : ''} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>
                ★
              </span>
            ))}
          </div>
          <div className="mg-final">{shown}</div>
          <div className="mg-best">
            <span>
              <T {...UI.best} />
            </span>
            <b>{Math.max(best, final)}</b>
            {final > best && best > 0 && (
              <span className="pill orange">
                <T es="¡Nuevo récord!" hy="Նոր ռեկորդ։" />
              </span>
            )}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 24, gap: 12 }}>
            <button className="mg-play" onClick={start}>
              ↻ {UI.replay.es} <TBadge {...UI.replay} />
            </button>
            <TButton {...UI.close} className="ghost" onClick={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
}
