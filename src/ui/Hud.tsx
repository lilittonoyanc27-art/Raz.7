import { useEffect, useRef } from 'react';
import { T, TBadge, SpeakIcon } from '../i18n/T';
import { speak } from '../i18n/speech';
import { UI } from '../i18n/ui';
import { useStore } from '../game/store';
import { hud, Engine } from '../game/world/Engine';
import { game, levelFromXp, toasts } from '../game/state';
import { missionHud, collectibleCount, collectibleHint } from '../game/controller';
import { ui, openModal, banner } from '../game/ui';
import { footballHud } from '../game/world/Football';
import { weather } from '../game/world/Environment';
import { PLACES, ROADS, ROAD_W, placeCenter, cityById } from '../game/data/places';
import { Icon } from './icons';

export function Hud() {
  return (
    <div className="hud">
      <TopLeft />
      <TopRight />
      <Bottom />
      <Football />
      <Toasts />
      <Banner />
      <LockHint />
    </div>
  );
}

function TopLeft() {
  const xp = useStore(game, (s) => s.xp);
  const money = useStore(game, (s) => s.money);
  const city = useStore(game, (s) => s.city);
  const lv = levelFromXp(xp);
  const m = useStore(missionHud, (s) => s);
  return (
    <div className="hud-tl">
      <div className="hud-card hud-player">
        <div className="hud-num">7</div>
        <div>
          <div className="row small" style={{ fontWeight: 800 }}>
            RAZ · <T es={`${UI.level.es} ${lv.level}`} hy={`${UI.level.hy} ${lv.level}`} />
          </div>
          <div className="bar hud-xp" style={{ marginTop: 4 }}>
            <i style={{ width: `${(lv.into / lv.need) * 100}%` }} />
          </div>
        </div>
        <div className="hud-money">{money.toFixed(0)} €</div>
      </div>
      <div className="hud-card mission-card" onClick={() => openModal({ type: 'missions' })} style={{ cursor: 'pointer' }}>
        <div className="row between">
          <span className="kicker">
            <T es={UI.currentMission.es} hy={UI.currentMission.hy} />
          </span>
          <span className="pill">{m.progress}</span>
        </div>
        {m.title ? (
          <>
            <div className="title">
              <T es={m.title.es} hy={m.title.hy} />
            </div>
            {m.step && (
              <div className="step">
                <T es={m.step.es} hy={m.step.hy} />
              </div>
            )}
            {m.list.length > 0 && (
              <ul>
                {m.list.map((l) => (
                  <li key={l.name.es} className={l.done ? 'ok' : ''}>
                    <span className="check" />
                    <T es={l.name.es} hy={l.name.hy} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="step muted">
            <T es={UI.noMission.es} hy={UI.noMission.hy} />
          </div>
        )}
      </div>
      <div className="small muted row" style={{ fontWeight: 700 }}>
        <T es={cityById(city).name.es} hy={cityById(city).name.hy} />
        <WeatherTag />
      </div>
      <FoundPill />
    </div>
  );
}

function FoundPill() {
  const found = useStore(game, (s) => s.found.length);
  const city = useStore(game, (s) => s.city);
  void found;
  void city;
  const n = collectibleCount();
  return (
    <div className="row" style={{ gap: 6 }}>
      <span className="pill found-pill">
        <T es={`Objetos encontrados: ${n.found}/${n.total}`} hy={`Գտնված առարկաներ՝ ${n.found}/${n.total}`} />
      </span>
      <button
        className="btn sm"
        onClick={() => {
          const h = collectibleHint();
          banner(h.es, h.hy, 'info', 6000);
          speak(h.es);
        }}
      >
        Pista <TBadge es="Pista" hy="Հուշում" />
      </button>
    </div>
  );
}

function WeatherTag() {
  const w = useStore(weather, (s) => s);
  const night = w.hour < 6.5 || w.hour > 19.5;
  const h = Math.floor(w.hour);
  const min = Math.floor((w.hour - h) * 60);
  const lab = w.rain ? UI.rainy : night ? UI.night : UI.sunny;
  return (
    <span className="row">
      · {String(h).padStart(2, '0')}:{String(min).padStart(2, '0')} · <T es={lab.es} hy={lab.hy} />
    </span>
  );
}

function TopRight() {
  return (
    <div className="hud-tr">
      <Minimap />
      <div className="hud-buttons">
        <ViewButton />
        <button className="icon-btn" title="Mapa (M)" onClick={() => openModal({ type: 'map' })}>
          {Icon.map()}
        </button>
        <button className="icon-btn" title="Pausa (Esc)" onClick={() => openModal({ type: 'pause' })}>
          {Icon.pause()}
        </button>
      </div>
    </div>
  );
}

const VIEWS: { v: 1 | 2 | 3; es: string; hy: string }[] = [
  { v: 1, es: '1ª: vista en primera persona', hy: '1-ին՝ տեսք առաջին դեմքից (աչքերով)' },
  { v: 2, es: '2ª: cámara cerca, detrás de Raz', hy: '2-րդ՝ մոտ տեսախցիկ, Ռազի հետևում' },
  { v: 3, es: '3ª: cámara lejos, vista clásica', hy: '3-րդ՝ հեռու տեսախցիկ, դասական տեսք' },
];
function ViewButton() {
  const view = useStore(hud, (s) => s.view);
  return (
    <div className="view-switch" title="V">
      <span className="view-eye">{Icon.eye(16)}</span>
      {VIEWS.map((x) => (
        <button key={x.v} className={'view-btn' + (view === x.v ? ' on' : '')} onClick={() => Engine.current?.setView(x.v)} title={x.es}>
          {x.v}ª
        </button>
      ))}
      <TBadge es={VIEWS[view - 1].es} hy={VIEWS[view - 1].hy} />
    </div>
  );
}

/** Draw roads + places into a canvas (shared by minimap and full map). */
export function drawMap(g: CanvasRenderingContext2D, size: number, cx: number, cz: number, scale: number, rot: number, labels: boolean) {
  g.save();
  g.fillStyle = '#4b6b3c';
  g.fillRect(0, 0, size, size);
  g.translate(size / 2, size / 2);
  g.rotate(rot);
  g.scale(scale, scale);
  g.translate(-cx, -cz);
  // blocks
  g.fillStyle = '#c9c6c0';
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) g.fillRect(-200 + i * 80 - 34, -200 + j * 80 - 34, 68, 68);
  // beach & sea
  g.fillStyle = '#e9d5a8';
  g.fillRect(-350, 248, 700, 56);
  g.fillStyle = '#2f7fb0';
  g.fillRect(-700, 304, 1400, 400);
  // runway / rail
  g.fillStyle = '#555';
  g.fillRect(260, 103, 280, 34);
  g.fillStyle = '#7a6a5a';
  g.fillRect(-330, -224, 660, 3);
  // roads
  g.fillStyle = '#3a3d42';
  for (const r of ROADS) {
    g.fillRect(-246, r - ROAD_W / 2, 492, ROAD_W);
    g.fillRect(r - ROAD_W / 2, -246, ROAD_W, 492);
  }
  // places
  for (const p of PLACES) {
    const c = placeCenter(p);
    g.fillStyle = p.area === 'park' ? '#5f9f45' : p.area === 'stadium' || p.area === 'training' ? '#47a042' : p.area === 'beach' ? 'transparent' : p.area ? '#b0a58f' : '#ff6a00';
    if (p.area !== 'beach') {
      const w = p.area ? 64 : p.w;
      const d = p.area ? 64 : p.d;
      g.fillRect(c.x - w / 2, c.z - d / 2, w, d);
    }
    if (labels) {
      g.save();
      g.translate(c.x, c.z);
      g.rotate(-rot);
      g.scale(1 / scale, 1 / scale);
      g.fillStyle = '#fff';
      g.strokeStyle = 'rgba(0,0,0,0.75)';
      g.lineWidth = 3;
      g.font = '700 12px Inter, sans-serif';
      g.textAlign = 'center';
      g.strokeText(p.name.es, 0, 4);
      g.fillText(p.name.es, 0, 4);
      g.restore();
    }
  }
  g.restore();
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const draw = () => {
      const h = hud.get();
      const S = c.width;
      const scale = h.interior ? 1 : 0.9;
      const rot = h.camYaw - Math.PI; // map rotates with the camera
      drawMap(g, S, h.px, h.pz, scale, rot + Math.PI, false);
      // target
      if (h.target && !h.interior) {
        const dx = h.target.x - h.px;
        const dz = h.target.z - h.pz;
        const a = rot + Math.PI;
        let x = (dx * Math.cos(a) - dz * Math.sin(a)) * scale;
        let y = (dx * Math.sin(a) + dz * Math.cos(a)) * scale;
        const r = Math.hypot(x, y);
        const max = S / 2 - 12;
        if (r > max) {
          x = (x / r) * max;
          y = (y / r) * max;
        }
        g.fillStyle = '#ff6a00';
        g.strokeStyle = '#fff';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(S / 2 + x, S / 2 + y, 7, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // player arrow
      g.save();
      g.translate(S / 2, S / 2);
      g.rotate(-(h.yaw - h.camYaw) + Math.PI);
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(0, -9);
      g.lineTo(6, 7);
      g.lineTo(0, 3);
      g.lineTo(-6, 7);
      g.closePath();
      g.fill();
      g.restore();
      if (h.interior) {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.fillRect(0, 0, S, S);
      }
    };
    draw();
    return hud.subscribe(draw);
  }, []);
  return <canvas ref={ref} width={180} height={180} className="minimap" onClick={() => openModal({ type: 'map' })} />;
}

function Bottom() {
  const prompt = useStore(hud, (s) => s.prompt);
  const key = useStore(hud, (s) => s.promptKey);
  const inVehicle = useStore(hud, (s) => s.inVehicle);
  const kmh = useStore(hud, (s) => s.kmh);
  const stamina = useStore(hud, (s) => s.stamina);
  const sprint = useStore(hud, (s) => s.sprint);
  const hint = useStore(hud, (s) => s.hint);
  const nav = useStore(missionHud, (s) => s.nav);
  const fmode = useStore(footballHud, (s) => s.mode);
  const route = useStore(hud, (s) => s.route);
  const vehicle = useStore(hud, (s) => s.vehicle);
  return (
    <>
      {nav && !hint && !fmode && (
        <div className="prompt nav">
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => speak(nav.es)} title="Escuchar">
            <SpeakIcon />
          </button>
          <T es={nav.es} hy={nav.hy} />
        </div>
      )}
      <div className="hud-bottom">
        {hint && (
          <div className="hint">
            <T es={hint.es} hy={hint.hy} />
          </div>
        )}
        {route && (
          <div className="prompt">
            <span className="pill orange">
              {route.i}/{route.n}
            </span>
            {route.time !== null && <span className="pill">{Math.ceil(route.time)} s</span>}
          </div>
        )}
        {prompt && (
          <div className="prompt">
            <span className="key">{key}</span>
            <T es={prompt.es} hy={prompt.hy} />
          </div>
        )}
        {inVehicle && (
          <div className="prompt small">
            <span className="key">F</span>
            <T es={UI.getOut.es} hy={UI.getOut.hy} />
            <span className="key">H</span>
            <T es="Claxon" hy="Ազդանշան" />
          </div>
        )}
        {!inVehicle && sprint && (
          <div className="sprint-tag">
            <T es="¡Sprint!" hy="Արագ վազք։" />
          </div>
        )}
        {!inVehicle && stamina < 0.98 && (
          <div className="bar stamina">
            <i style={{ width: `${stamina * 100}%`, background: stamina < 0.25 ? '#ff4d4d' : sprint ? '#ff6a00' : '#ffd27a' }} />
          </div>
        )}
      </div>
      {inVehicle && (
        <div className="speedo">
          <span className="small muted">
            {vehicle && <T es={vehicle.es} hy={vehicle.hy} />}
          </span>
          <b>{kmh}</b>
          <span className="small muted">km/h</span>
        </div>
      )}
    </>
  );
}

function Football() {
  const f = useStore(footballHud, (s) => s);
  return (
    <>
      {f.mode && (
        <div className="scoreboard">
          {f.mode === 'match' ? (
            <>
              <span className="pill orange">RAZ 7</span>
              <span className="sc">
                {f.us} – {f.them}
              </span>
              <span className="pill">{Math.floor(f.time / 60)}:{String(Math.floor(f.time % 60)).padStart(2, '0')}</span>
            </>
          ) : f.mode === 'goalkeeper' ? (
            <>
              <T es="Paradas" hy="Փրկություններ" />
              <span className="sc">
                {f.us}/{f.target}
              </span>
              <T es="Goles recibidos" hy="Բաց թողած գոլեր" />
              <span className="sc">{f.them}</span>
            </>
          ) : f.mode === 'dribble' ? (
            <>
              <T es="Marcas" hy="Նշաններ" />
              <span className="sc">{f.attempts}/7</span>
              <span className="pill">{Math.ceil(f.time)} s</span>
            </>
          ) : (
            <>
              <T es={UI.goals.es} hy={UI.goals.hy} />
              <span className="sc">
                {f.us}/{f.target}
              </span>
              <span className="pill">
                <T es={`Intentos: ${f.attempts}`} hy={`Փորձեր՝ ${f.attempts}`} />
              </span>
            </>
          )}
        </div>
      )}
      {f.coach && (
        <div className="coach">
          <span className="pill orange">
            <T es="Entrenador" hy="Մարզիչ" />
          </span>
          <T es={f.coach.es} hy={f.coach.hy} />
        </div>
      )}
      {f.near && (
        <div style={{ position: 'absolute', left: '50%', bottom: 150, transform: 'translateX(-50%)', textAlign: 'center' }} className="small">
          <div className="bar charge" style={{ opacity: f.charge > 0 ? 1 : 0.35 }}>
            <i style={{ width: `${f.charge * 100}%` }} />
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            <T es={UI.ctrlKick.es} hy={UI.ctrlKick.hy} />
          </div>
        </div>
      )}
    </>
  );
}

function Toasts() {
  const list = useStore(toasts, (s) => s.list);
  return (
    <div className="toasts">
      {list.map((t) => (
        <div key={t.id} className={'toast ' + t.kind}>
          <T es={t.es} hy={t.hy} />
        </div>
      ))}
    </div>
  );
}

function Banner() {
  const b = useStore(ui, (s) => s.banner);
  if (!b) return null;
  return (
    <div className={'banner ' + b.kind}>
      <T es={b.es} hy={b.hy} />
    </div>
  );
}

function LockHint() {
  const locked = useStore(hud, (s) => s.locked);
  const fine = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;
  if (locked || !fine) return null;
  return (
    <div className="lockhint">
      <T es={UI.clickToLook.es} hy={UI.clickToLook.hy} />
      <TBadge {...UI.clickToLook} />
    </div>
  );
}
