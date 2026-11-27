import { useState } from 'react';
import { T, TBadge, TButton } from '../i18n/T';
import { UI, DAILY_LABELS, STAT_LABELS } from '../i18n/ui';
import { useStore } from '../game/store';
import { game, levelFromXp, ACHIEVEMENTS, resetGame, newGame } from '../game/state';
import { settings, type Quality } from '../game/settings';
import { MISSIONS, CHAPTERS } from '../game/data/missions';
import { MINIGAMES } from '../game/data/minigames';
import { TOPICS } from '../game/data/grammar';
import { cityById } from '../game/data/places';
import { isAvailable, startMinigame, queueMinigame } from '../game/controller';
import { sfx } from '../game/world/Audio';
import { MgIcon } from './minigames';
import { openModal, closeModal, ui } from '../game/ui';
import { Engine } from '../game/world/Engine';
import type { FootballMode } from '../game/data/missions';

export function MissionsPanel({ onStart }: { onStart: (id: string) => void }) {
  const done = useStore(game, (s) => s.missionsDone);
  const active = useStore(game, (s) => s.activeMission);
  const [ch, setCh] = useState(() => {
    const a = MISSIONS.find((m) => m.id === active);
    return a ? a.chapter : 1;
  });
  const list = MISSIONS.filter((m) => m.chapter === ch);
  return (
    <div>
      <div className="row between wrap">
        <h2 style={{ margin: 0 }}>
          <T {...UI.missions} />
        </h2>
        <span className="pill orange">
          {done.length}/{MISSIONS.length}
        </span>
      </div>
      <div className="tabs" style={{ marginTop: 12 }}>
        {CHAPTERS.map((c, i) => (
          <button key={i} className={'tab' + (ch === i + 1 ? ' on' : '')} onClick={() => setCh(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
      <h3 style={{ marginTop: 0 }}>
        <T {...CHAPTERS[ch - 1]} />
      </h3>
      <div className="grid c2">
        {list.map((m) => {
          const isDone = done.includes(m.id);
          const avail = isAvailable(m);
          const isActive = active === m.id;
          return (
            <div key={m.id} className={'card' + (isActive ? ' active' : isDone ? ' done' : !avail ? ' locked' : '')}>
              <div className="row between">
                <span className="kicker">
                  {m.id.toUpperCase()} · <T {...cityById(m.city).name} />
                  {m.side ? ' · extra' : ''}
                </span>
                {isDone ? (
                  <span className="pill good">
                    <T {...UI.completed} />
                  </span>
                ) : isActive ? (
                  <span className="pill orange">
                    <T {...UI.active} />
                  </span>
                ) : !avail ? (
                  <span className="pill">
                    <T {...UI.locked} />
                  </span>
                ) : null}
              </div>
              <div style={{ fontWeight: 900, fontSize: 16, margin: '6px 0' }}>
                <T {...m.title} />
              </div>
              <div className="small" style={{ lineHeight: 1.4 }}>
                <T {...m.brief} />
              </div>
              <div className="row between" style={{ marginTop: 10 }}>
                <span className="small muted">
                  +{m.xp} XP · +{m.money} €
                </span>
                {(avail || isDone) && <TButton {...UI.startMission} className={isActive ? 'sm primary' : 'sm'} onClick={() => onStart(m.id)} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressPanel() {
  const s = useStore(game, (x) => x);
  const lv = levelFromXp(s.xp);
  const learned = Object.keys(s.wordsLearned).length;
  const seen = Object.keys(s.wordsSeen).length;
  const topicsTouched = Object.keys(s.topics).filter((k) => TOPICS[k]);
  const mistakes = Object.values(s.mistakes).sort((a, b) => b.count - a.count);
  const inGame = useStore(ui, (u) => u.screen === 'game');
  return (
    <div>
      <div className="grid c4">
        <Stat label={UI.level} value={`${lv.level}`} sub={`${lv.into}/${lv.need} XP`} />
        <Stat label={UI.money} value={`${s.money.toFixed(0)} €`} />
        <Stat label={UI.missionsDone} value={`${s.missionsDone.length}/${MISSIONS.length}`} />
        <Stat label={UI.goals} value={`${s.football.goals}`} sub={`${UI.wins.es}: ${s.football.wins}/${s.football.matches}`} />
      </div>
      <hr className="sep" />
      <div className="grid c2">
        <div className="card">
          <div className="kicker">
            <T {...UI.player} />
          </div>
          {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((k) => (
            <div key={k} style={{ margin: '8px 0' }}>
              <div className="row between small">
                <T {...STAT_LABELS[k]} />
                <b>{s.stats[k].toFixed(1)}/10</b>
              </div>
              <div className="bar">
                <i style={{ width: `${s.stats[k] * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="kicker">
            <T {...UI.spanishStats} />
          </div>
          <div className="grid c2" style={{ marginTop: 8 }}>
            <Stat label={UI.wordsLearned} value={`${learned}`} />
            <Stat label={UI.wordsSeen} value={`${seen}`} />
            <Stat label={UI.correctAnswers} value={`${s.correct}`} />
            <Stat label={UI.mistakes} value={`${s.wrong}`} />
            <Stat label={UI.dialogsDone} value={`${s.dialogsDone}`} />
            <Stat label={UI.topicsDone} value={`${topicsTouched.length}/${Object.keys(TOPICS).length}`} />
          </div>
        </div>
      </div>
      <hr className="sep" />
      <div className="grid c2">
        <div className="card">
          <div className="kicker">
            <T {...UI.topicsDone} />
          </div>
          {Object.entries(TOPICS).map(([k, tr]) => {
            const t = s.topics[k];
            const pct = t ? Math.round((t.c / Math.max(1, t.c + t.w)) * 100) : 0;
            return (
              <div key={k} className="row between small" style={{ padding: '3px 0' }}>
                <T {...tr} />
                <span className={'pill' + (t && pct >= 70 ? ' good' : '')}>{t ? `${pct}% · ${t.c + t.w}` : '—'}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="kicker">
            <T {...UI.toReview} />
          </div>
          {mistakes.length === 0 && (
            <p className="small">
              <T {...UI.noMistakes} />
            </p>
          )}
          {mistakes.slice(0, 10).map((m) => (
            <div key={m.es} className="small" style={{ padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
              <T es={m.es} hy={m.hy} /> <span className="pill">×{m.count}</span>
            </div>
          ))}
          {inGame && mistakes.length > 0 && <TButton {...UI.review} className="primary sm" onClick={() => openModal({ type: 'review' })} />}
          {!inGame && mistakes.length > 0 && (
            <p className="small muted">
              <T es="Entra en el juego para repasar tus errores." hy="Մտիր խաղ՝ սխալներդ կրկնելու համար։" />
            </p>
          )}
          <div className="kicker" style={{ marginTop: 14 }}>
            <T es="Palabras para repasar" hy="Կրկնելու բառեր" />
          </div>
          <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
            {Object.entries(s.wordsSeen)
              .filter(([w]) => !s.wordsLearned[w])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 24)
              .map(([w]) => (
                <span key={w} className="pill">
                  <T es={w} />
                </span>
              ))}
          </div>
        </div>
      </div>
      <hr className="sep" />
      <div className="grid c2">
        <div className="card">
          <div className="kicker">
            <T {...UI.daily} />
          </div>
          {s.daily.tasks.map((t) => (
            <div key={t.id} style={{ margin: '8px 0' }}>
              <div className="row between small">
                <T {...DAILY_LABELS[t.id]} />
                <b>
                  {Math.floor(t.progress)}/{t.goal}
                </b>
              </div>
              <div className="bar">
                <i style={{ width: `${(t.progress / t.goal) * 100}%`, background: t.done ? '#2ecc71' : undefined }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="kicker">
            <T {...UI.achievements} />
          </div>
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className="row between small" style={{ padding: '3px 0', opacity: s.achievements.includes(a.id) ? 1 : 0.4 }}>
              <T es={a.es} hy={a.hy} />
              {s.achievements.includes(a.id) && <span className="pill good">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: { es: string; hy: string }; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="small muted">
        <T {...label} />
      </div>
      <div className="big">{value}</div>
      {sub && <div className="small muted">{sub}</div>}
    </div>
  );
}

export function SettingsPanel() {
  const s = useStore(settings, (x) => x);
  const [confirm, setConfirm] = useState(false);
  const q: { k: Quality; tr: { es: string; hy: string } }[] = [
    { k: 'low', tr: UI.low },
    { k: 'medium', tr: UI.medium },
    { k: 'high', tr: UI.high },
  ];
  const slider = (label: { es: string; hy: string }, key: 'masterVolume' | 'sfxVolume' | 'voiceVolume' | 'speechRate' | 'mouseSensitivity', min: number, max: number) => (
    <div style={{ margin: '12px 0' }}>
      <div className="row between small">
        <T {...label} />
        <b>{s[key].toFixed(2)}</b>
      </div>
      <input type="range" min={min} max={max} step={0.05} value={s[key]} onChange={(e) => settings.set({ [key]: Number(e.target.value) } as never)} />
    </div>
  );
  return (
    <div>
      <div className="kicker">
        <T {...UI.quality} />
      </div>
      <div className="tabs" style={{ marginTop: 8 }}>
        {q.map((x) => (
          <button key={x.k} className={'tab' + (s.quality === x.k ? ' on' : '')} onClick={() => settings.set({ quality: x.k })}>
            {x.tr.es} <TBadge {...x.tr} />
          </button>
        ))}
      </div>
      <p className="small muted">
        <T es="La calidad se aplica al volver a entrar en el juego." hy="Որակը կկիրառվի խաղ վերադառնալուց հետո։" />
      </p>
      {slider(UI.volume, 'masterVolume', 0, 1)}
      {slider(UI.sfx, 'sfxVolume', 0, 1)}
      {slider(UI.voice, 'voiceVolume', 0, 1)}
      {slider(UI.rate, 'speechRate', 0.5, 1.4)}
      {slider(UI.sens, 'mouseSensitivity', 0.3, 2.5)}
      <label className="row" style={{ margin: '10px 0' }}>
        <input type="checkbox" checked={s.invertY} onChange={(e) => settings.set({ invertY: e.target.checked })} />
        <T {...UI.invert} />
      </label>
      <label className="row" style={{ margin: '10px 0' }}>
        <input type="checkbox" checked={s.autoSpeak} onChange={(e) => settings.set({ autoSpeak: e.target.checked })} />
        <T {...UI.autoSpeak} />
      </label>
      <label className="row" style={{ margin: '10px 0' }}>
        <input type="checkbox" checked={s.navVoice} onChange={(e) => settings.set({ navVoice: e.target.checked })} />
        <T es="Indicaciones de voz para Raz mientras juegas" hy="Ձայնային ցուցումներ Ռազին խաղի ընթացքում" />
      </label>
      <hr className="sep" />
      {!confirm ? (
        <button className="btn bad sm" onClick={() => setConfirm(true)}>
          <T es="Borrar todo el progreso" hy="Ջնջել ամբողջ առաջընթացը" />
        </button>
      ) : (
        <div className="row">
          <T {...UI.confirmNew} />
          <button
            className="btn bad sm"
            onClick={() => {
              resetGame();
              setConfirm(false);
            }}
          >
            {UI.yes.es}
          </button>
          <button className="btn sm" onClick={() => setConfirm(false)}>
            {UI.no.es}
          </button>
        </div>
      )}
    </div>
  );
}

export function MinigamesPanel({ inMenu }: { inMenu?: boolean }) {
  const best = useStore(game, (s) => s.minigames);
  const play = (m: (typeof MINIGAMES)[number]) => {
    if (inMenu && m.kind === '3d') {
      // load the 3D world first, then start the game there
      if (!game.get().started) game.set({ ...newGame(), activeMission: null });
      queueMinigame(m.id);
      sfx.ensure();
      ui.set({ screen: 'game', modal: null });
    } else if (inMenu) openModal({ type: 'minigame', id: m.id });
    else startMinigame(m.id);
  };
  return (
    <div>
      {inMenu && (
        <h2 style={{ marginTop: 0 }}>
          <T {...UI.minigames} />
        </h2>
      )}
      <p className="small muted">
        <T es="Los juegos 3D se juegan en el estadio o en la ciudad. También puedes ir al Centro de juegos." hy="3D խաղերը խաղացվում են մարզադաշտում կամ քաղաքում։ Կարող ես նաև գնալ Խաղային կենտրոն։" />
      </p>
      <div className="grid c3">
        {MINIGAMES.map((m) => (
          <div
            key={m.id}
            className="card mg-card"
            role="button"
            tabIndex={0}
            style={{ ['--mg' as string]: m.color, cursor: 'pointer' }}
            onClick={() => play(m)}
            onKeyDown={(ev) => ev.key === 'Enter' && play(m)}
          >
            <div className="row between">
              <div className="row" style={{ gap: 10 }}>
                <span className="mg-icon sm">
                  <MgIcon id={m.id} size={20} />
                </span>
                <b>{m.name.es}</b>
              </div>
              {m.kind === '3d' && <span className="pill">3D</span>}
            </div>
            <div className="small" style={{ margin: '6px 0', minHeight: 34 }}>
              {m.desc.es} <TBadge {...m.desc} />
            </div>
            <div className="row between">
              <span className="small muted">
                {UI.best.es}: {best[m.id] ?? 0}
              </span>
              {/* the whole card starts the game; this button is just the visible target */}
              <TButton {...UI.play} className="sm primary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FootballMenuPanel({ inMenu, onGo }: { inMenu?: boolean; onGo?: () => void }) {
  const f = useStore(game, (s) => s.football);
  const stats = useStore(game, (s) => s.stats);
  const modes: { m: FootballMode; tr: { es: string; hy: string }; n: number }[] = [
    { m: 'free', tr: UI.freeTraining, n: 5 },
    { m: 'penalty', tr: UI.penaltyMode, n: 5 },
    { m: 'freekick', tr: UI.freeKickMode, n: 3 },
    { m: 'dribble', tr: UI.dribbleMode, n: 1 },
    { m: 'match', tr: UI.matchMode, n: 3 },
    { m: 'goalkeeper', tr: { es: 'Reto de portero', hy: 'Դարպասապահի մարտահրավեր' }, n: 5 },
  ];
  const teams = ['RAZ 7 FC', 'Atlético del Puerto', 'Unión Naranja', 'Deportivo Sol', 'Real Brisa', 'CD Montaña'];
  const table = teams
    .map((name, i) => {
      const pj = i === 0 ? f.matches : Math.max(f.matches, 1) + ((i * 3) % 2);
      const g = i === 0 ? f.wins : Math.round(pj * (0.65 - i * 0.08));
      return { name, pj, g, pts: g * 3 + Math.max(0, pj - g) * (i === 0 ? 0 : 0.5) };
    })
    .sort((a, b) => b.pts - a.pts);
  return (
    <div>
      {inMenu && (
        <h2 style={{ marginTop: 0 }}>
          <T {...UI.football} />
        </h2>
      )}
      <div className="grid c3">
        {modes.map((x) => (
          <div key={x.m} className="card">
            <b>
              <T {...x.tr} />
            </b>
            <div style={{ marginTop: 10 }}>
              <TButton
                {...(inMenu ? UI.goToStadium : UI.start)}
                className="sm primary"
                onClick={() => {
                  if (inMenu) {
                    onGo?.();
                    setTimeout(() => Engine.current?.startFootball(x.m, x.n), 900);
                  } else {
                    closeModal();
                    Engine.current?.startFootball(x.m, x.n);
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <hr className="sep" />
      <div className="grid c2">
        <div className="card">
          <div className="kicker">
            <T {...UI.stats} />
          </div>
          <div className="row between small"><T {...UI.goals} /><b>{f.goals}</b></div>
          <div className="row between small"><T {...UI.assists} /><b>{f.assists}</b></div>
          <div className="row between small"><T {...UI.matches} /><b>{f.matches}</b></div>
          <div className="row between small"><T {...UI.wins} /><b>{f.wins}</b></div>
          <div className="row between small"><T es="Penaltis ganados" hy="Շահած պենալտիներ" /><b>{f.penalties}</b></div>
          <div className="row between small"><T es="Retos de portero" hy="Դարպասապահի մարտահրավերներ" /><b>{f.saves}</b></div>
          <div className="row between small"><T {...UI.shooting} /><b>{stats.shooting.toFixed(1)}</b></div>
        </div>
        <div className="card">
          <div className="kicker">
            <T {...UI.table} /> · <T {...UI.tournament} />
          </div>
          {table.map((r, i) => (
            <div key={r.name} className="row between small" style={{ padding: '3px 0', fontWeight: r.name === 'RAZ 7 FC' ? 900 : 400, color: r.name === 'RAZ 7 FC' ? '#ff8a33' : undefined }}>
              <span>
                {i + 1}. {r.name}
              </span>
              <span>
                {r.pj} PJ · {Math.round(r.pts)} pts
              </span>
            </div>
          ))}
          <div className="small muted" style={{ marginTop: 6 }}>
            <T es="PJ = partidos jugados · pts = puntos" hy="PJ = խաղացած խաղեր · pts = միավորներ" />
          </div>
        </div>
      </div>
    </div>
  );
}
