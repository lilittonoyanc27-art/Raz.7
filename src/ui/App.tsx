import React, { useEffect, useRef, useState } from 'react';
import { T, TBadge, TranslationPopup } from '../i18n/T';
import { UI } from '../i18n/ui';
import { useStore } from '../game/store';
import { ui, closeModal, openModal } from '../game/ui';
import { game, hasSave, newGame, saveNow } from '../game/state';
import { Engine, hud } from '../game/world/Engine';
import { runner, startMission, nextAvailable } from '../game/controller';
import { sfx } from '../game/world/Audio';
import { Icon } from './icons';
import { Hud } from './Hud';
import { MobileControls } from './MobileControls';
import { ModalRouter } from './Modals';
import { MissionsPanel, ProgressPanel, SettingsPanel, MinigamesPanel, FootballMenuPanel } from './MenuPanels';

export default function App() {
  const screen = useStore(ui, (s) => s.screen);
  return (
    <>
      {screen === 'menu' ? <MainMenu /> : <GameView />}
      <TranslationPopup />
    </>
  );
}

function enterGame() {
  sfx.ensure();
  ui.set({ screen: 'game', modal: null });
}

function MainMenu() {
  const panel = useStore(ui, (s) => s.menuPanel);
  const modal = useStore(ui, (s) => s.modal);
  const started = useStore(game, (s) => s.started);
  const [confirm, setConfirm] = useState(false);
  const canContinue = hasSave || started;

  const newGameNow = () => {
    game.set(newGame());
    saveNow();
    setConfirm(false);
    enterGame();
    setTimeout(() => startMission('m01'), 600);
  };

  const items: { tr: typeof UI.continue; icon: React.ReactNode; on: () => void; disabled?: boolean }[] = [
    { tr: UI.continue, icon: Icon.play(), on: enterGame, disabled: !canContinue },
    { tr: UI.newGame, icon: Icon.plus(), on: () => (canContinue ? setConfirm(true) : newGameNow()) },
    {
      tr: UI.openWorld,
      icon: Icon.globe(),
      on: () => {
        if (!game.get().started) game.set({ ...newGame(), activeMission: null });
        enterGame();
      },
    },
    { tr: UI.missions, icon: Icon.flag(), on: () => ui.set({ menuPanel: 'missions' }) },
    { tr: UI.football, icon: Icon.ball(), on: () => ui.set({ menuPanel: 'football' }) },
    { tr: UI.minigames, icon: Icon.game(), on: () => ui.set({ menuPanel: 'minigames' }) },
    { tr: UI.progress, icon: Icon.chart(), on: () => ui.set({ menuPanel: 'progress' }) },
    { tr: UI.settings, icon: Icon.gear(), on: () => ui.set({ menuPanel: 'settings' }) },
  ];

  return (
    <div className="menu">
      <div className="menu-left">
        <h1 className="logo">
          RAZ <span>7</span>
        </h1>
        <div className="tagline">
          <T es={UI.tagline.es} hy={UI.tagline.hy} />
        </div>
        {items.map((it) => (
          <button key={it.tr.es} className="menu-btn" disabled={it.disabled} onClick={it.on}>
            <span className="row">
              {it.icon}
              {it.tr.es}
            </span>
            <TBadge es={it.tr.es} hy={it.tr.hy} />
          </button>
        ))}
        {confirm && (
          <div className="card" style={{ marginTop: 10 }}>
            <T es={UI.confirmNew.es} hy={UI.confirmNew.hy} as="p" />
            <div className="row">
              <button className="btn primary" onClick={newGameNow}>
                {UI.yes.es} <TBadge {...UI.yes} />
              </button>
              <button className="btn" onClick={() => setConfirm(false)}>
                {UI.no.es} <TBadge {...UI.no} />
              </button>
            </div>
          </div>
        )}
        <div className="menu-foot">
          <T es="Haz clic en cualquier texto en español para ver la traducción al armenio." hy="Սեղմիր իսպաներեն ցանկացած տեքստի վրա՝ հայերեն թարգմանությունը տեսնելու համար։" />
        </div>
      </div>
      <div className={'menu-right' + (panel !== 'main' ? ' show' : '')}>
        <MenuHero />
        {panel !== 'main' && (
          <div className="menu-panel">
            <div className="modal-head">
              <span />
              <button className="btn sm" onClick={() => ui.set({ menuPanel: 'main' })}>
                {UI.back.es} <TBadge {...UI.back} />
              </button>
            </div>
            {panel === 'missions' && <MissionsPanel onStart={(id) => { enterGame(); setTimeout(() => startMission(id), 600); }} />}
            {panel === 'progress' && <ProgressPanel />}
            {panel === 'settings' && <SettingsPanel />}
            {panel === 'minigames' && <MinigamesPanel inMenu />}
            {panel === 'football' && <FootballMenuPanel inMenu onGo={() => enterGame()} />}
          </div>
        )}
      </div>
      {modal?.type === 'minigame' && <ModalRouter />}
    </div>
  );
}

function MenuHero() {
  return (
    <div className="menu-hero">
      <svg viewBox="0 0 800 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g7" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8a33" />
            <stop offset="1" stopColor="#ff6a00" />
          </linearGradient>
        </defs>
        <g opacity="0.12" stroke="#fff" fill="none">
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M ${-100 + i * 70} 700 L ${200 + i * 70} 0`} />
          ))}
        </g>
        <text x="420" y="560" fontSize="620" fontWeight="900" fill="url(#g7)" opacity="0.95" fontFamily="Inter, sans-serif" textAnchor="middle">
          7
        </text>
        <text x="420" y="640" fontSize="40" fontWeight="900" fill="#fff" letterSpacing="18" textAnchor="middle" fontFamily="Inter, sans-serif">
          VALENCIA · MADRID · BARCELONA
        </text>
        <circle cx="610" cy="560" r="46" fill="#fff" />
        <path d="M610 528l22 16-8 26h-28l-8-26z" fill="#16181c" />
      </svg>
    </div>
  );
}

function GameView() {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useStore(hud, (s) => s.ready);
  const modal = useStore(ui, (s) => s.modal);

  useEffect(() => {
    const eng = new Engine();
    let alive = true;
    eng.start(ref.current!).then(() => {
      if (!alive) return;
      runner.attach(eng);
      if (!game.get().activeMission && !game.get().missionsDone.length && game.get().started) {
        const n = nextAvailable();
        if (n) startMission(n.id);
      }
    });
    return () => {
      alive = false;
      runner.detach();
      saveNow();
      eng.dispose();
    };
  }, []);

  useEffect(() => {
    Engine.current?.setPaused(!!modal);
  }, [modal]);

  return (
    <div className="game-root" ref={ref}>
      {!ready && (
        <div className="loading">
          <div>
            <div className="spinner" />
            <T es={UI.loading.es} hy={UI.loading.hy} />
          </div>
        </div>
      )}
      {ready && (
        <>
          <div className="vignette" />
          <Hud />
          <MobileControls />
          {modal && <ModalRouter />}
        </>
      )}
    </div>
  );
}

export function goToMenu() {
  saveNow();
  closeModal();
  ui.set({ screen: 'menu', menuPanel: 'main' });
}
export { openModal };
