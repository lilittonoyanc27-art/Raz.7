import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { T, TBadge, TButton, SpeakIcon } from '../i18n/T';
import { UI } from '../i18n/ui';
import { speak } from '../i18n/speech';
import { useStore } from '../game/store';
import { ui, closeModal, openModal } from '../game/ui';
import { game, toast, addStat, reward, saveNow, recordAnswer, type StatKey, type CityId } from '../game/state';
import { Engine, hud } from '../game/world/Engine';
import { runner, travelTo, startMission, addToBasket } from '../game/controller';
import { SHOP, productById, fmtEuro, MENUS, PRODUCTS, type ShopItem, type MenuItem } from '../game/data/products';
import { numEs, numHy } from '../game/data/numbers';
import { npcById } from '../game/data/npcs';
import { CITIES, PLACES, placeCenter } from '../game/data/places';
import { SMALL_TALK, type Exchange } from '../game/data/npcs';
import { sfx } from '../game/world/Audio';
import { DialogPanel } from './Dialog';
import { drawMap } from './Hud';
import { Icon } from './icons';
import { MissionsPanel, ProgressPanel, SettingsPanel, MinigamesPanel, FootballMenuPanel } from './MenuPanels';
import { MinigameHost } from './minigames';
import { goToMenu } from './App';
import { shuffle } from '../game/data/grammar';

export function ModalRouter() {
  const m = useStore(ui, (s) => s.modal);
  if (!m) return null;
  const backdropClose = m.type !== 'dialog' && m.type !== 'minigame' && m.type !== 'checkout' && m.type !== 'train' && m.type !== 'cinema' && m.type !== 'order';
  let body: ReactNode = null;
  switch (m.type) {
    case 'dialog':
      body = <DialogPanel key={m.npcId + (m.greet?.es ?? '')} npcId={m.npcId} title={m.title} greet={m.greet} exchanges={m.exchanges} outro={m.outro} onDone={m.onDone} onClose={closeModal} />;
      break;
    case 'map':
      body = <MapModal />;
      break;
    case 'pause':
      body = <PauseModal />;
      break;
    case 'shop':
      body = <ShopModal cat={m.cat} />;
      break;
    case 'wardrobe':
      body = <ShopModal cat="clothes" wardrobe />;
      break;
    case 'checkout':
      body = <CheckoutModal />;
      break;
    case 'travel':
      body = <TravelModal mode={m.mode} />;
      break;
    case 'train':
      body = <TrainModal stat={m.stat} />;
      break;
    case 'cinema':
      body = <CinemaModal />;
      break;
    case 'football':
      body = (
        <Wrap title={UI.footballHub}>
          <FootballMenuPanel />
        </Wrap>
      );
      break;
    case 'missions':
      body = (
        <Wrap title={UI.missions} wide>
          <MissionsPanel onStart={(id) => { closeModal(); startMission(id); }} />
        </Wrap>
      );
      break;
    case 'progress':
      body = (
        <Wrap title={UI.progress} wide>
          <ProgressPanel />
        </Wrap>
      );
      break;
    case 'settings':
      body = (
        <Wrap title={UI.settings}>
          <SettingsPanel />
        </Wrap>
      );
      break;
    case 'minigames':
      body = (
        <Wrap title={UI.minigames} wide>
          <MinigamesPanel />
        </Wrap>
      );
      break;
    case 'minigame':
      body = <MinigameHost id={m.id} />;
      break;
    case 'missionDone':
      body = (
        <div className="modal" style={{ textAlign: 'center', width: 'min(520px,100%)' }}>
          <div className="kicker">
            <T {...UI.missionDone} />
          </div>
          <h2 style={{ fontSize: 30, margin: '10px 0' }}>
            <T es={m.title.es} hy={m.title.hy} />
          </h2>
          <div className="row" style={{ justifyContent: 'center', gap: 16, margin: '14px 0' }}>
            <span className="pill orange">+{m.xp} XP</span>
            <span className="pill" style={{ color: '#ffd27a' }}>
              +{m.money} €
            </span>
          </div>
          {m.next && (
            <p>
              <T {...UI.newMission} />: <b><T es={m.next.es} hy={m.next.hy} /></b>
            </p>
          )}
          <TButton {...UI.continueBtn} className="primary" onClick={() => closeModal()} />
        </div>
      );
      break;
    case 'chapter':
      body = (
        <div className="modal" style={{ width: 'min(560px,100%)' }}>
          <div className="kicker">
            <T {...UI.newMission} />
          </div>
          <h2 style={{ fontSize: 28, margin: '8px 0' }}>
            <T es={m.title.es} hy={m.title.hy} />
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.45 }}>
            <T es={m.brief.es} hy={m.brief.hy} />
          </p>
          <div className="row">
            <TButton {...UI.start} className="primary" onClick={() => closeModal()} />
            <button className="btn ghost" onClick={() => speak(m.brief.es)}>
              {UI.listenAgain.es} <TBadge {...UI.listenAgain} />
            </button>
          </div>
        </div>
      );
      break;
    case 'review':
      body = <ReviewModal />;
      break;
    case 'freetalk':
      body = <FreeTalkModal />;
      break;
    case 'order':
      body = <OrderModal place={m.place} />;
      break;
    case 'pick':
      body = <PickModal key={m.id} id={m.id} />;
      break;
    case 'gift':
      body = (
        <div className="modal gift" style={{ width: 'min(480px,100%)', textAlign: 'center' }}>
          <div className="gift-box">
            <svg viewBox="0 0 64 64" width="110" height="110">
              <rect x="8" y="26" width="48" height="32" rx="4" fill="#ff6a00" />
              <rect x="4" y="18" width="56" height="12" rx="3" fill="#ff8a33" />
              <rect x="28" y="18" width="8" height="40" fill="#fff" />
              <path d="M32 18 C22 4 10 10 18 18 Z M32 18 C42 4 54 10 46 18 Z" fill="#fff" />
            </svg>
          </div>
          <div className="kicker">
            <T es="¡Todo correcto!" hy="Ամեն ինչ ճիշտ է։" />
          </div>
          <h2 style={{ margin: '8px 0' }}>
            <T es={`¡${m.from} te da un regalo!`} hy={`${m.from}-ը քեզ նվեր է տալիս։`} />
          </h2>
          {m.item && (
            <p style={{ fontSize: 20, fontWeight: 800 }}>
              <T {...m.item} />
            </p>
          )}
          <div className="row" style={{ justifyContent: 'center', gap: 10, margin: '10px 0 16px' }}>
            <span className="pill" style={{ color: '#ffd27a' }}>
              +{m.money} €
            </span>
            <span className="pill orange">+40 XP</span>
          </div>
          {m.item && (
            <p className="small muted">
              <T es="Lo tienes en el armario o en la tienda (ya comprado)." hy="Այն կգտնես զգեստապահարանում կամ խանութում (արդեն գնված)։" />
            </p>
          )}
          <TButton es="¡Muchas gracias!" hy="Շատ շնորհակալություն։" className="primary" onClick={closeModal} />
        </div>
      );
      break;
  }
  return (
    <div className="modal-back" onClick={() => backdropClose && closeModal()}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'contents' }}>
        {body}
      </div>
    </div>
  );
}

function Wrap({ title, children, wide }: { title: { es: string; hy: string }; children: ReactNode; wide?: boolean }) {
  return (
    <div className={'modal' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...title} />
        </h2>
        <button className="btn sm ghost" onClick={closeModal}>
          {UI.close.es} <TBadge {...UI.close} />
        </button>
      </div>
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------
function MapModal() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const h = hud.get();
    const S = c.width;
    const scale = (S / 720) * zoom;
    const cx = zoom > 1 ? h.px : 40;
    const cz = zoom > 1 ? h.pz : 20;
    drawMap(g, S, cx, cz, scale, 0, true);
    const toScreen = (x: number, z: number) => [S / 2 + (x - cx) * scale, S / 2 + (z - cz) * scale];
    if (h.target) {
      const [x, y] = toScreen(h.target.x, h.target.z);
      g.fillStyle = '#ff6a00';
      g.strokeStyle = '#fff';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 10, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    if (!h.interior) {
      const [x, y] = toScreen(h.px, h.pz);
      g.save();
      g.translate(x, y);
      g.rotate(Math.PI - h.yaw);
      g.fillStyle = '#fff';
      g.strokeStyle = '#ff6a00';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, -12);
      g.lineTo(8, 9);
      g.lineTo(0, 4);
      g.lineTo(-8, 9);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
  }, [zoom]);
  return (
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...UI.map} />
        </h2>
        <div className="row">
          <button className="btn sm" onClick={() => setZoom(zoom > 1 ? 1 : 2.2)}>
            {zoom > 1 ? <T es="Ver toda la ciudad" hy="Տեսնել ամբողջ քաղաքը" /> : <T es="Acercar a RAZ" hy="Մոտեցնել ՌԱԶ-ին" />}
          </button>
          <button className="btn sm ghost" onClick={closeModal}>
            {UI.close.es} <TBadge {...UI.close} />
          </button>
        </div>
      </div>
      <canvas ref={ref} width={900} height={900} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 14 }} />
      <div className="row wrap small" style={{ marginTop: 10, gap: 6 }}>
        {PLACES.map((p) => (
          <span key={p.id} className="pill">
            <T es={p.name.es} hy={p.name.hy} />
          </span>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
function PauseModal() {
  return (
    <div className="modal" style={{ width: 'min(520px,100%)' }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...UI.pause} />
        </h2>
      </div>
      <div className="grid">
        <TButton {...UI.resume} className="primary block" onClick={closeModal} />
        <TButton {...UI.missions} className="block" onClick={() => openModal({ type: 'missions' })} />
        <TButton {...UI.progress} className="block" onClick={() => openModal({ type: 'progress' })} />
        <TButton {...UI.minigames} className="block" onClick={() => openModal({ type: 'minigames' })} />
        <TButton {...UI.freeTalk} className="block" onClick={() => openModal({ type: 'freetalk' })} />
        <TButton {...UI.wardrobe} className="block" onClick={() => openModal({ type: 'wardrobe' })} />
        <TButton {...UI.settings} className="block" onClick={() => openModal({ type: 'settings' })} />
        <TButton {...UI.mainMenu} className="block ghost" onClick={goToMenu} />
      </div>
      <hr className="sep" />
      <div className="kicker" style={{ marginBottom: 6 }}>
        <T {...UI.controls} />
      </div>
      <div className="grid c2 small">
        {[UI.ctrlMove, UI.ctrlRun, UI.ctrlJump, UI.ctrlE, UI.ctrlF, UI.ctrlM, UI.ctrlV, UI.ctrlKick, UI.ctrlZoom, UI.ctrlEsc].map((c) => (
          <T key={c.es} {...c} />
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
function ShopModal({ cat, wardrobe }: { cat: ShopItem['cat'] | 'all'; wardrobe?: boolean }) {
  const [tab, setTab] = useState<ShopItem['cat']>(cat === 'all' ? 'clothes' : cat);
  const money = useStore(game, (s) => s.money);
  const owned = useStore(game, (s) => s.owned);
  const outfit = useStore(game, (s) => s.outfit);
  const items = SHOP.filter((i) => i.cat === tab && (!wardrobe || owned.includes(i.id)));
  const tabs: { k: ShopItem['cat']; tr: { es: string; hy: string } }[] = [
    { k: 'clothes', tr: UI.clothes },
    { k: 'equipment', tr: UI.equipment },
    { k: 'vehicles', tr: UI.vehicles },
    { k: 'room', tr: UI.room },
  ];
  const buy = (it: ShopItem) => {
    if (money < it.price) {
      sfx.bad();
      toast(UI.notEnough.es, UI.notEnough.hy, 'bad');
      return;
    }
    sfx.coin();
    game.set((s) => ({ money: s.money - it.price, owned: [...s.owned, it.id] }));
    if (it.stat) addStat(it.stat.k, it.stat.v);
    toast(`Has comprado: ${it.name.es}`, `Գնեցիր՝ ${it.name.hy}`, 'good');
    if (it.cat === 'vehicles') Engine.current?.spawnVehicles();
    if (it.cat === 'room') Engine.current?.applyRoomDecor();
    if (it.slot) equip(it);
    saveNow();
  };
  const equip = (it: ShopItem) => {
    if (!it.slot || !it.value) return;
    game.set((s) => ({ outfit: { ...s.outfit, [it.slot!]: it.value! } }));
    Engine.current?.applyOutfit();
  };
  return (
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...(wardrobe ? UI.wardrobe : UI.shop)} />
        </h2>
        <div className="row">
          <span className="hud-money">{money.toFixed(0)} €</span>
          <button className="btn sm ghost" onClick={closeModal}>
            {UI.close.es} <TBadge {...UI.close} />
          </button>
        </div>
      </div>
      <div className="tabs">
        {tabs
          .filter((t) => !wardrobe || t.k === 'clothes')
          .map((t) => (
            <button key={t.k} className={'tab' + (tab === t.k ? ' on' : '')} onClick={() => setTab(t.k)}>
              {t.tr.es} <TBadge {...t.tr} />
            </button>
          ))}
      </div>
      <div className="grid c3">
        {items.map((it) => {
          const has = owned.includes(it.id);
          const on = it.slot && it.value && outfit[it.slot] === it.value;
          return (
            <div key={it.id} className={'card' + (on ? ' active' : '')}>
              <div className="row">
                {it.value && it.value.startsWith('#') ? <span className="swatch" style={{ background: it.value }} /> : <span className="swatch" style={{ display: 'grid', placeItems: 'center' }}>{it.cat === 'vehicles' ? Icon.bus(16) : it.cat === 'room' ? Icon.star(16) : Icon.shirt(16)}</span>}
                <T es={it.name.es} hy={it.name.hy} style={{ fontWeight: 700 }} />
              </div>
              {it.stat && (
                <div className="small muted" style={{ marginTop: 4 }}>
                  +{it.stat.v} <T {...UI[it.stat.k as StatKey]} />
                </div>
              )}
              <div className="row between" style={{ marginTop: 10 }}>
                <b>{it.price ? fmtEuro(it.price) : '—'}</b>
                {!has ? (
                  <TButton {...UI.buy} className="sm primary" onClick={() => buy(it)} disabled={money < it.price} />
                ) : it.slot ? (
                  on ? <span className="pill good"><T {...UI.equipped} /></span> : <TButton {...UI.equip} className="sm" onClick={() => equip(it)} />
                ) : (
                  <span className="pill good">
                    <T {...UI.owned} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
function CheckoutModal() {
  const basket = useStore(ui, (s) => s.basket);
  const total = basket.reduce((a, id) => a + productById(id).price, 0);
  const totalStr = fmtEuro(total);
  const exchanges: Exchange[] = useMemo(
    () => [
      {
        npc: { es: '¡Hola! ¿Lo tienes todo?', hy: 'Բարև։ Ամեն ինչ վերցրե՞լ ես։' },
        mode: 'choice',
        options: [
          { es: 'Sí, ya lo tengo todo, gracias.', hy: 'Այո, ամեն ինչ արդեն ունեմ, շնորհակալություն։', ok: true },
          { es: 'Sí, ya lo soy todo.', hy: '(սխալ)', ok: false },
          { es: 'No, tengo trece años.', hy: 'Ոչ, տասներեք տարեկան եմ։', ok: false },
        ],
        topic: 'tenerhaber',
      },
      {
        npc: { es: `Son ${totalStr.replace(' €', '')} euros. ¿Cuánto es?`, hy: `${totalStr} է։ Որքա՞ն է։` },
        mode: 'listen',
        options: shuffle([
          { es: `Son ${totalStr}.`, hy: `${totalStr} է։`, ok: true },
          { es: `Son ${fmtEuro(total + 3)}.`, hy: `${fmtEuro(total + 3)} է։`, ok: false },
          { es: `Son ${fmtEuro(Math.max(0.5, total - 2))}.`, hy: `${fmtEuro(Math.max(0.5, total - 2))} է։`, ok: false },
        ]),
      },
      {
        npc: { es: '¿Vas a pagar con tarjeta o en efectivo?', hy: 'Քարտո՞վ ես վճարելու, թե՞ կանխիկ։' },
        mode: 'build',
        answer: { es: 'Voy a pagar en efectivo', hy: 'Կանխիկ եմ վճարելու' },
        topic: 'futuro',
      },
    ],
    [totalStr, total],
  );
  const pay = () => {
    const money = game.get().money;
    if (money < total) {
      toast(UI.notEnough.es, UI.notEnough.hy, 'bad');
      sfx.bad();
      return;
    }
    game.set((s) => ({ money: +(s.money - total).toFixed(2) }));
    sfx.coin();
    const ok = runner.onCheckout();
    if (ok) ui.set({ basket: [] });
    closeModal();
  };
  const [talked, setTalked] = useState(false);
  if (!talked) return <DialogPanel npcId="cajera" exchanges={exchanges} onDone={() => setTalked(true)} onClose={() => setTalked(true)} />;
  return (
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...UI.basket} />
        </h2>
        <button className="btn sm ghost" onClick={closeModal}>
          {UI.close.es} <TBadge {...UI.close} />
        </button>
      </div>
      {basket.map((id, i) => (
        <div key={i} className="row between card" style={{ marginBottom: 6, padding: 10 }}>
          <T {...productById(id).name} />
          <span className="row">
            <b>{fmtEuro(productById(id).price)}</b>
            <button className="btn sm ghost" onClick={() => ui.set((s) => ({ basket: s.basket.filter((_, j) => j !== i) }))}>
              {Icon.x(14)}
            </button>
          </span>
        </div>
      ))}
      <div className="row between" style={{ marginTop: 12 }}>
        <span className="big">{totalStr}</span>
        <TButton {...UI.pay} className="primary" onClick={pay} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
function TravelModal({ mode }: { mode: 'train' | 'plane' | 'bus' }) {
  const unlocked = useStore(game, (s) => s.unlockedCities);
  const current = useStore(game, (s) => s.city);
  const st = runner.step();
  const allowed = new Set<CityId>(unlocked);
  if (st?.k === 'travel') allowed.add(st.city);
  const m = runner.mission();
  if (m) allowed.add(m.city);
  const label = mode === 'train' ? UI.byTrain : mode === 'plane' ? UI.byPlane : UI.byBus;
  return (
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div>
          <div className="kicker">
            <T {...label} />
          </div>
          <h2>
            <T {...UI.travelTo} />
          </h2>
        </div>
        <button className="btn sm ghost" onClick={closeModal}>
          {UI.close.es} <TBadge {...UI.close} />
        </button>
      </div>
      <div className="grid c3">
        {CITIES.map((c) => {
          const open = allowed.has(c.id) && c.id !== current;
          const target = st?.k === 'travel' && st.city === c.id;
          return (
            <div key={c.id} className={'card' + (target ? ' active' : '') + (!allowed.has(c.id) ? ' locked' : '')}>
              <div className="row between">
                <b style={{ fontSize: 18 }}>
                  <T {...c.name} />
                </b>
                {c.id === current && <span className="pill good"><T es="Estás aquí" hy="Դու այստեղ ես" /></span>}
              </div>
              <p className="small">
                <T {...c.description} />
              </p>
              {open ? (
                <TButton {...UI.travel} className={target ? 'primary sm' : 'sm'} onClick={() => travelTo(c.id)}>
                  {mode === 'plane' ? Icon.plane(16) : mode === 'train' ? Icon.train(16) : Icon.bus(16)}
                </TButton>
              ) : !allowed.has(c.id) ? (
                <span className="pill">
                  <T es={`${UI.locked.es} · ${UI.chapter.es} ${c.chapter}`} hy={`${UI.locked.hy} · ${UI.chapter.hy} ${c.chapter}`} />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
const COUNT = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
const COUNT_HY = ['մեկ', 'երկու', 'երեք', 'չորս', 'հինգ', 'վեց'];
function TrainModal({ stat }: { stat: StatKey }) {
  const [rep, setRep] = useState(0);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState(0);
  const [msg, setMsg] = useState<{ es: string; hy: string } | null>({ es: 'Pulsa ESPACIO o el botón cuando la barra esté en la zona naranja.', hy: 'Սեղմիր ԲԱՑԱՏ կամ կոճակը, երբ գիծը նարնջագույն գոտում է։' });
  const done = rep >= 6;
  const zone = [0.42, 0.62];
  useEffect(() => {
    if (done) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      setPos((Math.sin((t - t0) / (380 - rep * 25)) + 1) / 2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [rep, done]);
  const press = () => {
    if (done) return;
    const ok = pos > zone[0] && pos < zone[1];
    speak(COUNT[rep]);
    setMsg(ok ? { es: `¡${COUNT[rep]}! ¡Bien!`, hy: `${COUNT_HY[rep]}։ Լավ է։` } : { es: `${COUNT[rep]}… ¡Más concentración!`, hy: `${COUNT_HY[rep]}… Ավելի կենտրոնացած։` });
    if (ok) {
      setHits((h) => h + 1);
      sfx.ok();
    } else sfx.bad();
    setRep((r) => r + 1);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const finish = () => {
    const gain = +(hits * 0.08).toFixed(2);
    addStat(stat, gain);
    if (stat === 'stamina') addStat('speed', gain / 3);
    reward(10 + hits * 4, 0);
    toast(`+${gain} ${UI[stat].es}`, `+${gain} ${UI[stat].hy}`, 'good');
    runner.onTrained();
    closeModal();
  };
  return (
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>
          <T {...UI[stat]} />
        </h2>
        <span className="pill">{Math.min(rep, 6)}/6</span>
      </div>
      <div style={{ position: 'relative', height: 34, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `${zone[0] * 100}%`, width: `${(zone[1] - zone[0]) * 100}%`, top: 0, bottom: 0, background: 'rgba(255,106,0,0.6)' }} />
        <div style={{ position: 'absolute', left: `calc(${pos * 100}% - 3px)`, width: 6, top: 0, bottom: 0, background: '#fff' }} />
      </div>
      {msg && (
        <p style={{ fontSize: 18, fontWeight: 700 }}>
          <T {...msg} />
        </p>
      )}
      {!done ? (
        <button className="btn primary" onClick={press}>
          <T es="¡Ahora!" hy="Հիմա։" />
        </button>
      ) : (
        <>
          <p>
            <T es={`Repeticiones buenas: ${hits} de 6`} hy={`Լավ կրկնություններ՝ ${hits}-ը 6-ից`} />
          </p>
          <TButton {...UI.continueBtn} className="primary" onClick={finish} />
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
const FILM: { es: string; hy: string; who: string }[] = [
  { who: 'Narrador', es: 'Lucas tiene doce años y vive en un pueblo pequeño.', hy: 'Լուկասը տասներկու տարեկան է և ապրում է մի փոքրիկ գյուղում։' },
  { who: 'Lucas', es: 'Mi sueño es jugar en un gran estadio.', hy: 'Իմ երազանքն է խաղալ մեծ մարզադաշտում։' },
  { who: 'Abuela', es: 'Si quieres ser futbolista, tienes que entrenar cada día.', hy: 'Եթե ուզում ես ֆուտբոլիստ դառնալ, պետք է ամեն օր մարզվես։' },
  { who: 'Narrador', es: 'Cada mañana, Lucas se levantaba a las seis y corría por la playa.', hy: 'Ամեն առավոտ Լուկասը արթնանում էր ժամը վեցին և վազում լողափով։' },
  { who: 'Entrenador', es: 'Lucas, has mejorado mucho. ¡Vas a jugar la final!', hy: 'Լուկաս, դու շատ ես առաջադիմել։ Եզրափակիչում ես խաղալու։' },
  { who: 'Narrador', es: 'En la final, Lucas marcó el gol de la victoria.', hy: 'Եզրափակչում Լուկասը խփեց հաղթական գոլը։' },
];
const FILM_Q: Exchange[] = [
  { npc: { es: '¿Cuántos años tiene Lucas?', hy: 'Քանի՞ տարեկան է Լուկասը։' }, mode: 'choice', options: [{ es: 'Tiene doce años.', hy: 'Տասներկու տարեկան է։', ok: true }, { es: 'Tiene trece años.', hy: 'Տասներեք տարեկան է։', ok: false }, { es: 'Tiene seis años.', hy: 'Վեց տարեկան է։', ok: false }] },
  { npc: { es: '¿Qué hacía Lucas cada mañana?', hy: 'Ի՞նչ էր անում Լուկասը ամեն առավոտ։' }, mode: 'choice', options: [{ es: 'Corría por la playa.', hy: 'Վազում էր լողափով։', ok: true }, { es: 'Dormía hasta las diez.', hy: 'Քնում էր մինչև տասը։', ok: false }, { es: 'Iba al cine.', hy: 'Գնում էր կինո։', ok: false }], topic: 'imperfecto', explain: { es: 'Costumbre en el pasado → imperfecto: corría.', hy: 'Անցյալի սովորություն → imperfecto՝ corría։' } },
  { npc: { es: '¿Qué pasó en la final?', hy: 'Ի՞նչ եղավ եզրափակչում։' }, mode: 'build', answer: { es: 'Lucas marcó el gol de la victoria', hy: 'Լուկասը խփեց հաղթական գոլը' }, topic: 'indefinido' },
];
function CinemaModal() {
  const [i, setI] = useState(0);
  const [quiz, setQuiz] = useState(false);
  const screen = Engine.current?.interiors.cinemaScreen;
  useEffect(() => {
    if (quiz) return;
    const line = FILM[i];
    speak(line.es, { voice: line.who === 'Abuela' ? 0 : 1, pitch: line.who === 'Lucas' ? 1.3 : line.who === 'Abuela' ? 1.1 : 0.9 });
    if (screen) screen.emissive.setHSL((i * 0.13) % 1, 0.5, 0.4);
  }, [i, quiz, screen]);
  if (quiz)
    return (
      <DialogPanel
        npcId="taquillero"
        title={{ es: '¿Has entendido la película?', hy: 'Հասկացա՞ր ֆիլմը։' }}
        exchanges={FILM_Q}
        onDone={() => {
          runner.onCinema();
          reward(20, 0);
        }}
        onClose={closeModal}
      />
    );
  const line = FILM[i];
  return (
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div style={{ aspectRatio: '16/7', borderRadius: 14, background: `linear-gradient(135deg, hsl(${i * 47},45%,22%), #0b0c0f)`, display: 'grid', placeItems: 'end center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 400 160" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
          <circle cx={80 + i * 50} cy="60" r="26" fill="#ffcf7a" />
          <rect x="0" y="120" width="400" height="40" fill="#2f5f2a" />
          <circle cx={200 + Math.sin(i) * 60} cy="112" r="8" fill="#fff" />
        </svg>
        <div style={{ position: 'relative', background: 'rgba(0,0,0,0.65)', padding: '10px 16px', borderRadius: 10, fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
          <div className="small" style={{ color: '#ffb36b' }}>
            {line.who}
          </div>
          <T es={line.es} hy={line.hy} />
        </div>
      </div>
      <div className="row between" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => speak(line.es, { slow: true })}>
          {UI.listenSlow.es} <TBadge {...UI.listenSlow} />
        </button>
        <span className="pill">
          {i + 1}/{FILM.length}
        </span>
        <TButton {...UI.continueBtn} className="primary" onClick={() => (i + 1 < FILM.length ? setI(i + 1) : setQuiz(true))} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
function ReviewModal() {
  const mistakes = Object.values(game.get().mistakes)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const exchanges: Exchange[] = mistakes.map((m) => ({
    npc: { es: `Escribe o forma la frase correcta: «${m.hy}»`, hy: `Գրիր կամ կազմիր ճիշտ նախադասությունը՝ «${m.hy}»` },
    mode: 'build',
    answer: { es: m.es.replace(/[—–]/g, '').trim(), hy: m.hy },
    topic: m.topic,
    explain: m.explain ? { es: m.explain, hy: m.explain } : undefined,
  }));
  if (!exchanges.length)
    return (
      <Wrap title={UI.review}>
        <p>
          <T {...UI.noMistakes} />
        </p>
      </Wrap>
    );
  return <DialogPanel npcId="profesora" title={UI.review} exchanges={exchanges} onClose={closeModal} />;
}

function FreeTalkModal() {
  const ex = useMemo(() => shuffle(SMALL_TALK).slice(0, 5), []);
  return <DialogPanel npcId="charla" title={UI.freeTalk} exchanges={ex} onClose={closeModal} />;
}

export { placeCenter, recordAnswer };

// --------------------------------------------------------------------------
// Ordering food in the cafeteria / restaurant
const euroWords = (v: number) => {
  const e = Math.floor(v + 1e-6);
  const c = Math.round((v - e) * 100);
  const es = `${e === 1 ? 'un euro' : numEs(e) + ' euros'}${c ? ' con ' + numEs(c) : ''}`;
  const hy = `${numHy(e)} եվրո${c ? ' ' + numHy(c) + ' ցենտ' : ''}`;
  return { es, hy };
};
function OrderModal({ place }: { place: 'cafe' | 'restaurant' }) {
  const menu = MENUS[place];
  const waiterId = place === 'cafe' ? 'camarero' : 'camarera_rest';
  const waiter = npcById(waiterId);
  const [sel, setSel] = useState<MenuItem[]>([]);
  const [phase, setPhase] = useState<'menu' | 'talk' | 'served'>('menu');
  const total = +sel.reduce((a, it) => a + it.price, 0).toFixed(2);
  useEffect(() => {
    speak(place === 'cafe' ? '¡Hola! Aquí tienes la carta. ¿Qué vas a tomar?' : 'Buenas. Aquí tiene la carta. ¿Qué desea comer?', { voice: waiter?.voice.voice ?? 1 });
  }, [place, waiter]);
  const toggle = (it: MenuItem) => {
    sfx.click();
    setSel((s) => (s.includes(it) ? s.filter((x) => x !== it) : s.length >= 3 ? s : [...s, it]));
  };
  const joinEs = (l: MenuItem[]) => (l.length === 1 ? l[0].es : l.slice(0, -1).map((x) => x.es).join(', ') + ' y ' + l[l.length - 1].es);
  const joinHy = (l: MenuItem[]) => l.map((x) => x.hy).join(', ');
  const exchanges: Exchange[] = useMemo(() => {
    if (!sel.length) return [];
    const ew = euroWords(total);
    const wrong1 = euroWords(+(total + (total > 5 ? 2 : 1)).toFixed(2));
    const wrong2 = euroWords(Math.max(0.5, +(total - 1.5).toFixed(2)));
    const other = menu.filter((m) => !sel.includes(m));
    return [
      {
        npc: place === 'cafe' ? { es: '¿Qué vas a tomar?', hy: 'Ի՞նչ ես պատվիրելու։' } : { es: '¿Qué desea comer?', hy: 'Ի՞նչ կցանկանաք ուտել։' },
        mode: 'build',
        answer: { es: `Quiero ${joinEs(sel)} por favor`, hy: `Ուզում եմ ${joinHy(sel)}, խնդրում եմ` },
        chips: shuffle(other.flatMap((o) => o.es.split(' ')).filter((w) => w.length > 2)).slice(0, 3),
        explain: { es: 'Para pedir: «Quiero + un/una + comida, por favor».', hy: 'Պատվիրելու համար՝ «Quiero + un/una + ուտեստ, por favor»։' },
        topic: 'presente',
      },
      place === 'cafe'
        ? {
            npc: { es: '¿Para tomar aquí o para llevar?', hy: 'Այստե՞ղ, թե՞ տանելու համար։' },
            mode: 'choice',
            options: shuffle([
              { es: 'Para tomar aquí, por favor.', hy: 'Այստեղ, խնդրում եմ։', ok: true },
              { es: 'Por tomar aquí.', hy: '(սխալ՝ por)', ok: false },
              { es: 'Para llevar mañana ayer.', hy: '(անհեթեթ)', ok: false },
            ]),
            explain: { es: 'Finalidad → para: para tomar aquí, para llevar.', hy: 'Նպատակ → para՝ para tomar aquí, para llevar։' },
            topic: 'porpara',
          }
        : {
            npc: { es: '¿Desea algo más?', hy: 'Էլի ինչ-որ բան կցանկանա՞ք։' },
            mode: 'choice',
            options: shuffle([
              { es: 'No, gracias. Eso es todo.', hy: 'Ոչ, շնորհակալություն։ Այսքանը։', ok: true },
              { es: 'No, gracias. Es todos.', hy: '(սխալ)', ok: false },
              { es: 'Sí, quiero la mesa de postre.', hy: '(անհեթեթ)', ok: false },
            ]),
          },
      {
        npc: { es: `Muy bien. Son ${ew.es}.`, hy: `Շատ լավ։ ${ew.hy} է։` },
        mode: 'listen',
        options: shuffle([
          { es: `${fmtEuro(total)}`, hy: ew.hy, ok: true },
          { es: `${fmtEuro(+(total + (total > 5 ? 2 : 1)).toFixed(2))}`, hy: wrong1.hy, ok: false },
          { es: `${fmtEuro(Math.max(0.5, +(total - 1.5).toFixed(2)))}`, hy: wrong2.hy, ok: false },
        ]),
        topic: 'numeros',
      },
      {
        npc: { es: '¿Cómo quieres pagar?', hy: 'Ինչպե՞ս ես ուզում վճարել։' },
        mode: 'choice',
        options: shuffle([
          { es: 'Con tarjeta, por favor.', hy: 'Քարտով, խնդրում եմ։', ok: true },
          { es: 'Con tarjeta de fútbol.', hy: '(անհեթեթ)', ok: false },
          { es: 'Pago ayer en efectivo mañana.', hy: '(անհեթեթ)', ok: false },
        ]),
      },
    ];
  }, [sel, total, place, menu]);

  const servedRef = useRef(false);
  const serve = () => {
    if (servedRef.current) return;
    servedRef.current = true;
    const money = game.get().money;
    if (money >= total) game.set((s) => ({ money: +(s.money - total).toFixed(2) }));
    sfx.coin();
    reward(25, 0);
    const e = Engine.current;
    if (e) e.player.stamina = 1;
    setPhase('served');
    speak('¡Aquí tienes! ¡Que aproveche!', { voice: waiter?.voice.voice ?? 1 });
  };

  if (phase === 'talk')
    return <DialogPanel npcId={waiterId} title={{ es: 'Pedir la comida', hy: 'Պատվիրել ուտելիքը' }} greet={{ es: 'Muy bien, dime.', hy: 'Շատ լավ, ասա։' }} exchanges={exchanges} onDone={serve} onClose={() => !servedRef.current && closeModal()} />;
  if (phase === 'served')
    return (
      <div className="modal" style={{ width: 'min(520px,100%)', textAlign: 'center' }}>
        <div className="kicker">
          <T es="¡Que aproveche!" hy="Բարի ախորժակ։" />
        </div>
        <h2 style={{ margin: '10px 0' }}>
          <T es={`Has pedido ${joinEs(sel)}.`} hy={`Պատվիրեցիր՝ ${joinHy(sel)}։`} />
        </h2>
        <p className="muted">
          <T es="Raz ha comido y tiene la energía al máximo." hy="Ռազը կերավ, և նրա էներգիան լիքն է։" />
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 10, margin: '12px 0' }}>
          <span className="pill">−{fmtEuro(total)}</span>
          <span className="pill orange">+25 XP</span>
        </div>
        <TButton {...UI.continueBtn} className="primary" onClick={closeModal} />
      </div>
    );
  return (
    <div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div className="speaker" style={{ margin: 0 }}>
          <div className="avatar" style={{ background: waiter?.look.shirt ?? '#ff6a00', color: '#16181c' }}>
            {(waiter?.name ?? 'C')[0]}
          </div>
          <div>
            <div className="kicker">{place === 'cafe' ? <T es="Cafetería · La carta" hy="Սրճարան · Ճաշացանկ" /> : <T es="Restaurante · La carta" hy="Ռեստորան · Ճաշացանկ" />}</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>
              {place === 'cafe' ? <T es="¡Hola! Aquí tienes la carta. ¿Qué vas a tomar?" hy="Բարև։ Ահա ճաշացանկը։ Ի՞նչ ես պատվիրելու։" /> : <T es="Buenas. Aquí tiene la carta. ¿Qué desea comer?" hy="Բարև ձեզ։ Ահա ճաշացանկը։ Ի՞նչ կցանկանաք ուտել։" />}
            </div>
          </div>
        </div>
        <button className="btn sm ghost" onClick={closeModal}>
          {UI.close.es} <TBadge {...UI.close} />
        </button>
      </div>
      <p className="small muted">
        <T es="Elige de una a tres cosas. Después tendrás que pedirlas en español." hy="Ընտրիր մեկից երեք բան։ Հետո պետք է պատվիրես իսպաներեն։" />
      </p>
      <div className="grid c4">
        {menu.map((it) => {
          const on = sel.includes(it);
          return (
            <button key={it.id} className={'card menu-item' + (on ? ' active' : '')} onClick={() => toggle(it)}>
              <span className="pill" style={{ alignSelf: 'flex-start' }}>
                {it.kind === 'drink' ? <T es="Bebida" hy="Ըմպելիք" /> : it.kind === 'food' ? <T es="Comida" hy="Ուտելիք" /> : <T es="Postre" hy="Աղանդեր" />}
              </span>
              <b style={{ fontSize: 16, margin: '8px 0 4px' }}>{it.name}</b>
              <span className="row between" style={{ width: '100%' }}>
                <span className="hud-money" style={{ fontSize: 16 }}>
                  {fmtEuro(it.price)}
                </span>
                <TBadge es={it.name} hy={it.hy} />
              </span>
              {on && <span className="menu-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="row between" style={{ marginTop: 16 }}>
        <span>
          <T es="Total:" hy="Ընդամենը՝" /> <b className="hud-money">{fmtEuro(total)}</b>
        </span>
        <TButton es="Pedir al camarero" hy="Պատվիրել մատուցողից" className="primary" disabled={!sel.length} onClick={() => setPhase('talk')} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Supermarket: pick a product and say it in Spanish
function ProductIcon({ shape, color }: { shape: string; color: string }) {
  return (
    <svg viewBox="0 0 80 80" width="96" height="96">
      <ellipse cx="40" cy="72" rx="24" ry="4" fill="rgba(0,0,0,0.25)" />
      {shape === 'bottle' && (
        <>
          <rect x="31" y="22" width="18" height="48" rx="7" fill={color} />
          <rect x="35" y="10" width="10" height="14" rx="3" fill={color} />
          <rect x="31" y="38" width="18" height="14" fill="rgba(255,255,255,0.55)" />
        </>
      )}
      {shape === 'carton' && (
        <>
          <rect x="24" y="24" width="32" height="46" rx="3" fill={color} />
          <path d="M24 24 L40 10 L56 24 Z" fill={color} opacity="0.85" />
          <rect x="24" y="40" width="32" height="12" fill="rgba(0,0,0,0.12)" />
        </>
      )}
      {shape === 'round' && (
        <>
          <circle cx="40" cy="46" r="22" fill={color} />
          <circle cx="32" cy="38" r="6" fill="rgba(255,255,255,0.35)" />
          <path d="M40 24 q4 -10 10 -10" stroke="#3f6f2a" strokeWidth="4" fill="none" />
        </>
      )}
      {shape === 'long' && <path d="M14 56 Q40 20 66 30 Q44 52 14 56 Z" fill={color} />}
      {(shape === 'box' || shape === 'bag') && (
        <>
          <rect x="18" y="24" width="44" height="44" rx={shape === 'bag' ? 10 : 4} fill={color} />
          <rect x="18" y="38" width="44" height="12" fill="rgba(255,255,255,0.4)" />
        </>
      )}
    </svg>
  );
}
function PickModal({ id }: { id: string }) {
  const p = productById(id);
  const opts = useMemo(() => {
    const others = shuffle(PRODUCTS.filter((x) => x.id !== id)).slice(0, 2);
    return shuffle([
      { es: `Tomo ${p.name.es}.`, hy: `Վերցնում եմ ${p.name.hy}։`, ok: true },
      ...others.map((o) => ({ es: `Tomo ${o.name.es}.`, hy: `Վերցնում եմ ${o.name.hy}։`, ok: false })),
    ]);
  }, [id, p]);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    speak('¿Qué tomas?');
  }, []);
  const choose = (k: number) => {
    if (done) return;
    setPicked(k);
    const o = opts[k];
    recordAnswer(o.ok, { es: `Tomo ${p.name.es}.`, hy: `Վերցնում եմ ${p.name.hy}։`, topic: 'presente' });
    if (o.ok) {
      setDone(true);
      sfx.ok();
      speak(o.es, { voice: 1 });
      addToBasket(id);
      setTimeout(() => closeModal(), 1300);
    } else sfx.bad();
  };
  const correct = opts.find((o) => o.ok)!;
  return (
    <div className="modal" style={{ width: 'min(560px,100%)' }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div>
          <div className="kicker">
            <T {...p.shelf} />
          </div>
          <h2>
            <T es="¿Qué tomas?" hy="Ի՞նչ ես վերցնում։" />
          </h2>
        </div>
        <button className="btn sm ghost" onClick={closeModal}>
          {UI.close.es} <TBadge {...UI.close} />
        </button>
      </div>
      <div className="row" style={{ gap: 18, alignItems: 'center', marginBottom: 12 }}>
        <div className="pick-img">
          <ProductIcon shape={p.shape} color={p.color} />
        </div>
        <div>
          <div className="hy" style={{ fontSize: 20, fontWeight: 700 }}>
            {p.name.hy}
          </div>
          <div className="hud-money" style={{ fontSize: 20 }}>
            {fmtEuro(p.price)}
          </div>
          <div className="small muted">
            <T es="Di en español lo que tomas:" hy="Իսպաներեն ասա, թե ինչ ես վերցնում՝" />
          </div>
        </div>
      </div>
      <div className="answers">
        {opts.map((o, k) => (
          <button key={k} className={'answer' + (picked === k ? (o.ok ? ' ok' : ' no') : done && o.ok ? ' ok' : '')} disabled={done} onClick={() => choose(k)}>
            <span className="row">
              <SpeakIcon /> {o.es}
            </span>
            <TBadge es={o.es} hy={o.hy} />
          </button>
        ))}
      </div>
      {picked !== null && !opts[picked].ok && (
        <div className="feedback no small">
          <T {...UI.wrong} /> <T {...UI.rightAnswer} /> <b>{correct.es}</b> — <span className="hy">{correct.hy}</span>
        </div>
      )}
      {done && (
        <div className="feedback ok">
          <T es={`¡Muy bien! ${p.name.es} está en tu cesta.`} hy={`Շատ լավ։ ${p.name.hy} քո զամբյուղում է։`} />
        </div>
      )}
    </div>
  );
}
