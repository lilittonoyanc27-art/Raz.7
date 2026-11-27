// Game logic: mission runner, interaction handling and UI <-> engine bridge.
import { Engine, hud } from './world/Engine';
import { MISSIONS, missionById, missionIndex, CHAPTERS, type Mission, type Step } from './data/missions';
import { PLACES, doorPoint, placeById, placeCenter, cityById, type InteriorKind } from './data/places';
import { npcById, SMALL_TALK, STREET_TALK, NPCS, type Exchange } from './data/npcs';
const NPCS_ALL = () => NPCS;
import { numberExchanges, randomName } from './data/numbers';
import { GRAMMAR, questionsFor, shuffle, TOPICS } from './data/grammar';
import { productById, fmtEuro, PRODUCTS, SHOP } from './data/products';
import { MINIGAMES } from './data/minigames';
import { COLLECTIBLES } from './data/collectibles';
import { addStat, levelFromXp, game, reward, toast, bumpDaily, checkAchievements, saveNow, type CityId } from './state';
import { ui, openModal, closeModal, banner } from './ui';
import { sfx } from './world/Audio';
import { Vehicle } from './world/Vehicles';
import type { Action } from './world/types';
import type { Tr } from '../i18n/T';
import { createStore } from './store';
import { speak } from '../i18n/speech';
import { settings } from './settings';

export const missionHud = createStore<{ title: Tr | null; step: Tr | null; progress: string; list: { name: Tr; done: boolean }[]; nav: Tr | null }>({ title: null, step: null, progress: '', list: [], nav: null });

const t = (es: string, hy: string): Tr => ({ es, hy });

// --------------------------------------------------------------------------
// availability
export function currentChapter() {
  const done = new Set(game.get().missionsDone);
  const open = MISSIONS.filter((m) => !m.side && !done.has(m.id));
  return open.length ? Math.min(...open.map((m) => m.chapter)) : 7;
}
export function isAvailable(m: Mission) {
  return !game.get().missionsDone.includes(m.id) && m.chapter <= currentChapter();
}
export function nextAvailable(): Mission | undefined {
  return MISSIONS.find((m) => isAvailable(m) && !m.side) ?? MISSIONS.find((m) => isAvailable(m));
}

export function startMission(id: string) {
  const m = missionById(id);
  if (!m) return;
  game.set({ activeMission: id, stepIndex: 0 });
  runner.setupStep();
  const ch = CHAPTERS[m.chapter - 1];
  openModal({ type: 'chapter', title: m.title, brief: m.brief });
  void ch;
}

// --------------------------------------------------------------------------
class Runner {
  private unsub: (() => void)[] = [];
  private eng: Engine | null = null;
  private footballRetry = 0;
  private travelPseudo = false;
  minigame3d: { id: string; start: number } | null = null;

  attach(e: Engine) {
    this.detach();
    this.eng = e;
    this.unsub.push(
      e.events.on('action', (a) => handleAction(a)),
      e.events.on('enter', (k) => this.onEnter(k)),
      e.events.on('exit', (k) => {
        if (k === 'supermarket' && this.freeShop) {
          this.freeShop = null;
          if (this.step()?.k !== 'item') missionHud.set({ list: [] });
        }
      }),
      e.events.on('mount', () => this.onMount()),
      e.events.on('routeDone', (ok) => this.onRouteDone(ok)),
      e.events.on('footballEnd', (r) => this.onFootballEnd(r.mode, r.success)),
      e.events.on('footballProgress', (r) => this.onFootballProgress(r.count)),
      e.events.on('goal', (us) => {
        if (us) {
          game.set((s) => ({ football: { ...s.football, goals: s.football.goals + 1 } }));
          bumpDaily('goals');
          reward(10, 2);
          checkAchievements();
        }
      }),
      e.events.on('redLight', () => {
        banner('¡Para! El semáforo está en rojo.', 'Կանգնի՛ր։ Լուսացույցը կարմիր է։', 'bad');
        sfx.bad();
        game.set((s) => ({ money: Math.max(0, s.money - 2) }));
      }),
      e.events.on('tick', (m) => bumpDaily('drive', m)),
      e.events.on('borrowed', (kind) => {
        const lines: Record<string, Tr[]> = {
          car: [
            t('¡Claro, Raz! Te dejo mi coche. Conduce con cuidado.', 'Իհարկե, Ռազ։ Մեքենաս քեզ եմ թողնում։ Զգույշ վարիր։'),
            t('Vale, Raz. ¡Pero respeta los semáforos!', 'Լավ, Ռազ։ Բայց պահպանիր լուսացույցները։'),
            t('¿Necesitas el coche, Raz? ¡Toma las llaves!', 'Մեքենան պե՞տք է, Ռազ։ Վերցրու բանալիները։'),
          ],
          bike: [
            t('¡Hola, Raz! Toma mi bici. ¡Disfruta del paseo!', 'Բարև, Ռազ։ Վերցրու իմ հեծանիվը։ Վայելիր զբոսանքը։'),
            t('Claro, Raz. Usa el carril bici, por favor.', 'Իհարկե, Ռազ։ Օգտագործիր հեծանվային գիծը, խնդրում եմ։'),
          ],
          bus: [t('Raz, puedes conducir el autobús, pero ve muy despacio.', 'Ռազ, կարող ես վարել ավտոբուսը, բայց շատ դանդաղ գնա։')],
        };
        const list = lines[kind];
        const l = list[Math.floor(Math.random() * list.length)];
        banner(l.es, l.hy, 'good', 4000);
        speak(l.es, { pitch: 0.9 + Math.random() * 0.4, voice: Math.floor(Math.random() * 3) });
      }),
      e.events.on('key', (code) => onKey(code)),
    );
    spawnActiveQuestItems(e);
    spawnCollectibles(e);
    const iv = setInterval(() => this.poll(), 250);
    this.unsub.push(() => clearInterval(iv));
    this.setupStep();
  }
  detach() {
    this.unsub.forEach((f) => f());
    this.unsub = [];
    this.eng = null;
  }

  mission() {
    const id = game.get().activeMission;
    return id ? missionById(id) : undefined;
  }
  step(): Step | undefined {
    const m = this.mission();
    if (!m) return undefined;
    if (game.get().city !== m.city) return { k: 'travel', city: m.city, text: t(`Viaja a ${cityById(m.city).name.es}: ve a la estación o al aeropuerto.`, `Մեկնիր ${cityById(m.city).name.hy}՝ գնա կայարան կամ օդանավակայան։`) };
    return m.steps[game.get().stepIndex];
  }

  /** Configure world for the current step. */
  setupStep() {
    const e = this.eng ?? Engine.current;
    const m = this.mission();
    const st = this.step();
    if (!e) return;
    e.setHighlight([]);
    e.clearRoute();
    if (!m || !st) {
      e.setTarget(null);
      missionHud.set({ title: null, step: null, progress: '', list: [] });
      return;
    }
    this.travelPseudo = game.get().city !== m.city;
    this.sayToRaz(st.text);
    const total = m.steps.length;
    missionHud.set({ title: m.title, step: st.text, progress: `${Math.min(game.get().stepIndex + 1, total)}/${total}`, list: [] });
    const door = (kind: InteriorKind) => {
      const pl = PLACES.find((p) => p.interior === kind)!;
      return doorPoint(pl);
    };
    switch (st.k) {
      case 'reach': {
        const pl = placeById(st.place)!;
        e.setTarget(st.door && pl.interior ? doorPoint(pl) : placeCenter(pl));
        break;
      }
      case 'point': {
        const p = st.r === 0 ? e.city.bikeSpot : st;
        e.setTarget({ x: p.x, z: p.z });
        break;
      }
      case 'enter':
        e.setTarget(door(st.interior));
        if (e.interior === st.interior) this.advance();
        break;
      case 'item': {
        // reset the items so the mission can be replayed
        game.set((s) => ({ inventory: s.inventory.filter((i) => !st.ids.includes(i)) }));
        for (const it of e.interactables) if (it.action.type === 'item' && st.ids.includes(it.action.id) && it.mesh) it.mesh.visible = true;
        this.updateItemList(st.ids);
        e.setTarget(null);
        break;
      }
      case 'talk': {
        e.setHighlight([st.npc]);
        const def = npcById(st.npc);
        if (def?.place) {
          const pl = placeById(def.place)!;
          const c = placeCenter(pl);
          e.setTarget({ x: c.x + (def.offset?.[0] ?? 0), z: c.z + (def.offset?.[1] ?? 0) });
        } else if (def?.interior && e.interior !== def.interior) e.setTarget(door(def.interior));
        else e.setTarget(null);
        break;
      }
      case 'vehicle':
        if (e.vehicle && (st.vtype === 'any' || e.vehicle.spec.kind === st.vtype)) {
          this.advance();
          return;
        }
        if (st.vtype === 'car') e.setTarget(placeCenter(placeById('parking')!));
        else e.setTarget(st.vtype === 'bike' ? e.city.bikeSpot : null);
        break;
      case 'route':
        e.startRoute(st.points, { time: st.time, vtype: st.vtype, hints: st.hints, lights: st.lights });
        break;
      case 'shop':
        ui.set({ basket: [] });
        this.updateShopList(st.list);
        break;
      case 'table':
        e.setTarget(null);
        break;
      case 'goals':
        e.setTarget(placeCenter(placeById('stadium')!));
        this.footballRetry = 0;
        break;
      case 'quiz': {
        e.setHighlight([st.npc]);
        const def = npcById(st.npc);
        if (def?.place) {
          const c = placeCenter(placeById(def.place)!);
          e.setTarget({ x: c.x + (def.offset?.[0] ?? 0), z: c.z + (def.offset?.[1] ?? 0) });
        } else e.setTarget(null);
        break;
      }
      case 'train':
      case 'cinema':
        e.setTarget(null);
        break;
      case 'travel':
        if (game.get().city === st.city && !this.travelPseudo) {
          this.advance();
          return;
        }
        e.setTarget(door('station'));
        break;
      case 'worlditem':
        e.spawnWorldItem(st.id, st.x, st.z, st.label);
        e.setTarget({ x: st.x, z: st.z });
        break;
    }
  }

  private updateItemList(ids: string[]) {
    const names: Record<string, Tr> = {
      mochila: t('la mochila de deporte', 'մարզական պայուսակը'),
      agua: t('la botella de agua', 'ջրի շիշը'),
      botas: t('las botas de fútbol', 'ֆուտբոլային բութսերը'),
    };
    const inv = game.get().inventory;
    missionHud.set({ list: ids.map((id) => ({ name: names[id] ?? t(id, id), done: inv.includes(id) })) });
  }
  updateShopList(list: string[]) {
    const basket = ui.get().basket;
    missionHud.set({ list: list.map((id) => ({ name: productById(id).name, done: basket.includes(id) })) });
  }

  advance() {
    const m = this.mission();
    if (!m) return;
    sfx.ok();
    const i = game.get().stepIndex + 1;
    if (i >= m.steps.length) {
      this.complete(m);
      return;
    }
    game.set({ stepIndex: i });
    this.setupStep();
  }

  complete(m: Mission) {
    const s = game.get();
    const first = !s.missionsDone.includes(m.id);
    game.set({ missionsDone: first ? [...s.missionsDone, m.id] : s.missionsDone, activeMission: null, stepIndex: 0 });
    if (first) {
      reward(m.xp, m.money);
      bumpDaily('mission');
    }
    // unlock cities as the story advances
    const unlocked = new Set(game.get().unlockedCities);
    unlocked.add(m.city);
    for (const st of m.steps) if (st.k === 'travel') unlocked.add(st.city);
    game.set({ unlockedCities: [...unlocked] as CityId[] });
    checkAchievements();
    const next = nextAvailable();
    if (next) game.set({ activeMission: next.id, stepIndex: 0 });
    this.setupStep();
    saveNow();
    openModal({ type: 'missionDone', title: m.title, xp: first ? m.xp : 0, money: first ? m.money : 0, next: next?.title });
  }

  // ---------------- events ----------------
  freeShop: string[] | null = null;
  private onEnter(kind: InteriorKind) {
    const st = this.step();
    // don't interrupt a mission that is about to happen in this place
    const m = this.mission();
    const rest = m && game.get().city === m.city ? m.steps.slice(game.get().stepIndex) : [];
    const missionHere = rest.some((x) => (x.k === 'table' && x.place === kind) || (x.k === 'talk' && npcById(x.npc)?.interior === kind) || (x.k === 'shop' && kind === 'supermarket'));
    if (kind === 'supermarket' && !missionHere) {
      this.freeShop = shuffle(PRODUCTS.map((p) => p.id)).slice(0, 3);
      ui.set({ basket: [] });
      const names = this.freeShop.map((id) => productById(id).name);
      const es = `Toma una cesta. Hoy tienes que comprar: ${names.map((n) => n.es).join(', ')}.`;
      const hy = `Վերցրու զամբյուղ։ Այսօր պետք է գնես՝ ${names.map((n) => n.hy).join(', ')}։`;
      banner(es, hy, 'level', 5000);
      missionHud.set({ list: this.freeShop.map((id) => ({ name: productById(id).name, done: false })) });
      if (settings.get().navVoice) setTimeout(() => speak(es), 400);
    }
    if (st?.k === 'enter' && st.interior === kind) this.advance();
    else if (st?.k === 'talk' || st?.k === 'quiz') this.eng?.setTarget(null);
  }
  private onMount() {
    const st = this.step();
    const v = this.eng?.vehicle;
    if (st?.k === 'vehicle' && v && (st.vtype === 'any' || v.spec.kind === st.vtype)) this.advance();
  }
  private onRouteDone(ok: boolean) {
    if (this.minigame3d) {
      const mg = this.minigame3d;
      this.minigame3d = null;
      const secs = (performance.now() - mg.start) / 1000;
      const score = ok ? Math.max(10, Math.round(1000 - secs * 5)) : 0;
      finishMinigame(mg.id, score);
      if (ok) banner(`¡Terminado en ${Math.round(secs)} segundos!`, `Ավարտվեց ${Math.round(secs)} վայրկյանում։`, 'good');
      else banner('Se acabó el tiempo.', 'Ժամանակն ավարտվեց։', 'bad');
      this.setupStep();
      return;
    }
    const st = this.step();
    if (st?.k !== 'route') return;
    if (ok) this.advance();
    else {
      banner('Se acabó el tiempo. ¡Inténtalo otra vez!', 'Ժամանակն ավարտվեց։ Կրկին փորձիր։', 'bad');
      setTimeout(() => this.setupStep(), 1500);
    }
  }
  private onFootballProgress(count: number) {
    const st = this.step();
    if (st?.k === 'goals') missionHud.set({ progress: `${Math.min(count, st.n)}/${st.n}` });
  }
  private onFootballEnd(mode: string, success: boolean) {
    const fh = game.get().football;
    if (mode === 'match') game.set({ football: { ...fh, matches: fh.matches + 1, wins: fh.wins + (success ? 1 : 0) } });
    if (mode === 'penalty') game.set((s) => ({ football: { ...s.football, penalties: s.football.penalties + (success ? 1 : 0) } }));
    if (mode === 'goalkeeper') game.set((s) => ({ football: { ...s.football, saves: s.football.saves + 1 } }));
    if (success) {
      game.set((s) => ({ stats: { ...s.stats, shooting: Math.min(10, s.stats.shooting + 0.15), technique: Math.min(10, s.stats.technique + 0.1) } }));
    }
    if (this.minigame3d && (this.minigame3d.id === 'penalty' || this.minigame3d.id === 'goalkeeper')) {
      const id = this.minigame3d.id;
      this.minigame3d = null;
      finishMinigame(id, success ? 100 : 30);
      return;
    }
    const st = this.step();
    if (st?.k === 'goals' && st.mode === mode) {
      if (success) this.advance();
      else {
        banner('No lo has conseguido. ¡Otra vez!', 'Չստացվեց։ Եվս մեկ անգամ։', 'bad');
        this.footballRetry = performance.now() + 2500;
      }
    }
  }

  // ---------------- voice navigation ("Raz, gira a la izquierda") ----------------
  private navKey = '';
  private navPending = '';
  private navPendingSince = 0;
  private navLastSpeak = 0;
  private lastStepSpoken = '';
  private firstLine = true;

  private sayToRaz(tr: Tr) {
    if (!settings.get().navVoice) return;
    if (this.lastStepSpoken === tr.es) return;
    this.lastStepSpoken = tr.es;
    // address him by name only at the start of a mission, not every time
    const useName = game.get().stepIndex === 0;
    const es = useName ? 'Raz, ' + tr.es.charAt(0).toLowerCase() + tr.es.slice(1) : tr.es;
    const hy = useName ? 'Ռազ, ' + tr.hy : tr.hy;
    missionHud.set({ nav: { es, hy } });
    this.navLastSpeak = performance.now();
    // the first line waits for RAZ's greeting at the start of the game
    const delay = this.firstLine ? 4200 : 700;
    this.firstLine = false;
    setTimeout(() => {
      if (!this.eng?.paused) speak(es);
    }, delay);
  }

  private navigate() {
    const e = this.eng;
    if (!e) return;
    const h = hud.get();
    const now = performance.now();
    if (!h.target || h.route) {
      if (h.route) missionHud.set({ nav: null });
      return;
    }
    let key: string;
    let tr: Tr;
    if (e.interior) {
      key = 'inside';
      tr = t('Sal a la calle por la puerta.', 'Դռնով դուրս արի փողոց։');
    } else {
      const dx = h.target.x - h.px;
      const dz = h.target.z - h.pz;
      const dist = Math.hypot(dx, dz);
      const moving = e.vehicle ? Math.abs(e.vehicle.speed) > 1 : e.player.speed > 0.6;
      const yaw = moving ? h.yaw : h.camYaw + Math.PI;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const ang = (Math.atan2(fx * dz - fz * dx, fx * dx + fz * dz) * 180) / Math.PI; // <0 = left
      const m = Math.max(10, Math.round(dist / 10) * 10);
      if (dist < 25) {
        key = 'near';
        tr = t('Ya casi has llegado. ¡Está aquí mismo!', 'Գրեթե հասար։ Հենց այստեղ է։');
      } else if (Math.abs(ang) < 25) {
        key = 'recto';
        tr = t(`Sigue recto. Faltan ${m} metros.`, `Շարունակիր ուղիղ։ Մնաց ${m} մետր։`);
      } else if (Math.abs(ang) > 140) {
        key = 'vuelta';
        tr = t('Da la vuelta. Vas en la dirección contraria.', 'Շրջվիր։ Հակառակ ուղղությամբ ես գնում։');
      } else if (ang < 0) {
        key = 'izq';
        tr = t(`Gira a la izquierda. Faltan ${m} metros.`, `Թեքվիր ձախ։ Մնաց ${m} մետր։`);
      } else {
        key = 'der';
        tr = t(`Gira a la derecha. Faltan ${m} metros.`, `Թեքվիր աջ։ Մնաց ${m} մետր։`);
      }
    }
    if (key === this.navKey) missionHud.set({ nav: tr });
    // the instruction must be stable for a moment before it is spoken
    if (key !== this.navPending) {
      this.navPending = key;
      this.navPendingSince = now;
      return;
    }
    const stable = now - this.navPendingSince > 900;
    const changed = key.replace(/\d+$/, '') !== this.navKey.replace(/\d+$/, '') || key !== this.navKey;
    // speak only when the direction really changes, and not too often
    if (stable && changed && now - this.navLastSpeak > 8000) {
      this.navKey = key;
      this.navLastSpeak = now;
      missionHud.set({ nav: tr });
      if (settings.get().navVoice && !e.paused) speak(tr.es, { pitch: 1.05 });
    }
  }

  /** periodic checks (positions) */
  private poll() {
    const e = this.eng;
    if (!e || e.paused) return;
    this.navigate();
    const st = this.step();
    if (!st) return;
    const h = hud.get();
    const px = h.px;
    const pz = h.pz;
    if (st.k === 'reach' && !e.interior) {
      const pl = placeById(st.place)!;
      const p = st.door && pl.interior ? doorPoint(pl) : placeCenter(pl);
      if (Math.hypot(px - p.x, pz - p.z) < (st.r ?? (st.door ? 6 : 18))) this.advance();
    } else if (st.k === 'point' && !e.interior) {
      const p = st.r === 0 ? e.city.bikeSpot : st;
      if (Math.hypot(px - p.x, pz - p.z) < (st.r || 5)) this.advance();
    } else if (st.k === 'goals' && !e.interior && e.football.mode === null) {
      if (e.football.inStadium(e.player.pos, 1) && performance.now() > this.footballRetry && !e.vehicle) {
        e.startFootball(st.mode, st.n);
        missionHud.set({ progress: `0/${st.n}` });
      }
    } else if (st.k === 'item') {
      const inv = game.get().inventory;
      this.updateItemList(st.ids);
      if (st.ids.every((id) => inv.includes(id))) this.advance();
    } else if (st.k === 'worlditem') {
      if (game.get().inventory.includes(st.id)) this.advance();
    } else if (st.k === 'travel') {
      if (game.get().city === st.city && !this.travelPseudo) this.advance();
    }
  }

  // ---------------- interactions from UI ----------------
  dialogFor(npcId: string): { exchanges: Exchange[]; outro?: Tr; onDone?: (ok: number, total: number) => void } | null {
    const st = this.step();
    if (st?.k === 'talk' && st.npc === npcId) {
      return { exchanges: st.ex, outro: st.outro, onDone: () => this.advance() };
    }
    if (st?.k === 'quiz' && st.npc === npcId) {
      return { exchanges: quizExchanges(st.topic, st.n), onDone: () => this.advance() };
    }
    return null;
  }
  onTable(place: 'cafe' | 'restaurant') {
    const st = this.step();
    toast('Te sientas en una mesa libre.', 'Նստում ես ազատ սեղանի մոտ։');
    if (st?.k === 'table' && st.place === place) this.advance();
    else toast('Llama al camarero cuando quieras pedir.', 'Կանչիր մատուցողին, երբ ուզես պատվիրել։');
  }
  onTrained() {
    if (this.step()?.k === 'train') this.advance();
  }
  onCinema() {
    if (this.step()?.k === 'cinema') this.advance();
  }
  onCheckout() {
    const st = this.step();
    if (st?.k !== 'shop') {
      if (this.freeShop) {
        const basket = ui.get().basket;
        const missing = this.freeShop.filter((id) => !basket.includes(id));
        if (missing.length) {
          banner(`Te falta: ${missing.map((id) => productById(id).name.es).join(', ')}`, `Պակասում է՝ ${missing.map((id) => productById(id).name.hy).join(', ')}`, 'bad', 5000);
          return false;
        }
        reward(40, 5);
        Engine.current?.clearBasket();
        banner('¡Compra completada! Lo has comprado todo.', 'Գնումն ավարտված է։ Ամեն ինչ գնեցիր։', 'good', 4000);
        this.freeShop = null;
        missionHud.set({ list: [] });
      }
      Engine.current?.clearBasket();
      return true;
    }
    const basket = ui.get().basket;
    const missing = st.list.filter((id) => !basket.includes(id));
    if (missing.length) {
      banner(`Te falta: ${missing.map((id) => productById(id).name.es).join(', ')}`, `Պակասում է՝ ${missing.map((id) => productById(id).name.hy).join(', ')}`, 'bad', 5000);
      return false;
    }
    Engine.current?.clearBasket();
    this.advance();
    return true;
  }
  onTravelled() {
    this.travelPseudo = false;
    const m = this.mission();
    if (m && game.get().city === m.city) {
      const st = m.steps[game.get().stepIndex];
      if (st?.k === 'travel' && st.city === game.get().city) {
        this.advance();
        return;
      }
    }
    this.setupStep();
  }
}

export const runner = new Runner();

// --------------------------------------------------------------------------
export function quizExchanges(topic: string | null, n: number): Exchange[] {
  return questionsFor(topic, n).map((q) => ({
    npc: { es: q.q.replace('___', '…'), hy: q.full.hy },
    mode: 'choice' as const,
    options: shuffle(q.options.map((o, i) => ({ es: q.q.replace('___', o), hy: q.full.hy, ok: i === q.a }))),
    explain: q.explain,
    topic: q.topic,
  }));
}

export function freeTalkFor(npcId: string): Exchange[] {
  const def = npcById(npcId);
  const own = def?.free ?? [];
  const pool = shuffle(SMALL_TALK).slice(0, own.length ? 2 : 3);
  return [...own.slice(0, 2), ...pool];
}

function itemName(id: string): Tr {
  const n: Record<string, Tr> = {
    mochila: t('la mochila', 'պայուսակը'),
    agua: t('la botella de agua', 'ջրի շիշը'),
    botas: t('las botas', 'բութսերը'),
    mochila_perdida: t('tu mochila perdida', 'քո կորած պայուսակը'),
  };
  return n[id] ?? t(id, id);
}

export function handleAction(a: Action) {
  const e = Engine.current;
  if (!e) return;
  sfx.click();
  switch (a.type) {
    case 'exit':
      e.exitInterior();
      break;
    case 'enter': {
      const pl = placeById(a.place);
      if (pl?.interior) e.enterInterior(pl.interior);
      break;
    }
    case 'product': {
      if (!e.hasBasket) {
        banner('Primero toma una cesta a la entrada.', 'Նախ վերցրու զամբյուղ մուտքի մոտ։', 'bad', 3500);
        speak('Primero toma una cesta a la entrada.');
        break;
      }
      openModal({ type: 'pick', id: a.id });
      break;
    }
    case 'basket': {
      if (e.hasBasket) {
        banner('Ya tienes una cesta en la mano.', 'Զամբյուղն արդեն ձեռքիդ է։', 'info', 2500);
        break;
      }
      e.setBasket(true);
      banner('Has tomado una cesta. ¡A comprar!', 'Վերցրիր զամբյուղ։ Գնումների ժամանակն է։', 'good', 3000);
      speak('Has tomado una cesta. ¡A comprar!');
      break;
    }
    case 'checkout':
      if (!ui.get().basket.length) banner('Tu cesta está vacía.', 'Զամբյուղդ դատարկ է։', 'bad');
      else openModal({ type: 'checkout' });
      break;
    case 'shop':
      openModal({ type: 'shop', cat: a.cat });
      break;
    case 'npc': {
      const qdef = npcById(a.id);
      if (qdef?.quest && !runner.dialogFor(a.id) && game.get().quests[qdef.quest.id] !== 'done') {
        questTalk(a.id);
        break;
      }
      const d = runner.dialogFor(a.id);
      if (!d && (a.id === 'camarero' || a.id === 'camarera_rest')) {
        openModal({ type: 'order', place: a.id === 'camarero' ? 'cafe' : 'restaurant' });
        break;
      }
      if (d) openModal({ type: 'dialog', npcId: a.id, exchanges: d.exchanges, outro: d.outro, onDone: d.onDone });
      else if (a.id === 'profesora') openModal({ type: 'dialog', npcId: a.id, exchanges: quizExchanges(null, 3), free: true });
      else openModal({ type: 'dialog', npcId: a.id, exchanges: freeTalkFor(a.id), free: true });
      break;
    }
    case 'wardrobe':
      openModal({ type: 'wardrobe' });
      break;
    case 'minigame':
      startMinigame(a.id);
      break;
    case 'train':
      openModal({ type: 'train', stat: a.stat });
      break;
    case 'travel':
      openModal({ type: 'travel', mode: a.mode });
      break;
    case 'item': {
      if (a.id.startsWith('col_')) {
        foundCollectible(a.id.slice(4));
        e.removeWorldItem(a.id);
        break;
      }
      if (!game.get().inventory.includes(a.id)) game.set((s) => ({ inventory: [...s.inventory, a.id] }));
      const it = e.interactables.find((i) => i.action.type === 'item' && i.action.id === a.id);
      if (it?.mesh) it.mesh.visible = false;
      e.removeWorldItem(a.id);
      const n = itemName(a.id);
      toast(`Has tomado ${n.es}.`, `Վերցրիր ${n.hy}։`, 'good');
      break;
    }
    case 'table':
      runner.onTable(a.place);
      break;
    case 'cinema':
      openModal({ type: 'cinema' });
      break;
    case 'lesson': {
      const topics = Object.keys(TOPICS);
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const d = runner.dialogFor('profesora');
      if (d) openModal({ type: 'dialog', npcId: 'profesora', exchanges: d.exchanges, onDone: d.onDone });
      else openModal({ type: 'dialog', npcId: 'profesora', title: TOPICS[topic], exchanges: quizExchanges(topic, 3), free: true });
      break;
    }
    case 'football':
      openModal({ type: 'football' });
      break;
    case 'ped': {
      const ped = e.peds.peds[a.index];
      if (!ped) break;
      const look = ped.h.look;
      const female = look.hairStyle === 'long' || look.hairStyle === 'bun';
      const id = 'peaton_' + a.index;
      const oldIdx = NPCS.findIndex((n) => n.id === id);
      if (oldIdx >= 0) NPCS.splice(oldIdx, 1);
      {
        const def = {
          id,
          name: randomName(female),
          role: female ? { es: 'Peatona', hy: 'Անցորդուհի' } : { es: 'Peatón', hy: 'Անցորդ' },
          voice: { pitch: 1, rate: 0.92, voice: female ? 0 : 1 },
          look: { shirt: look.shirt, shorts: look.shorts },
          greeting: female
            ? { es: '¡Hola, Raz! ¿Tienes un momento? Quiero preguntarte unas cosas.', hy: 'Բարև, Ռազ։ Մի րոպե ունե՞ս։ Ուզում եմ քեզ մի քանի բան հարցնել։' }
            : { es: '¡Eh, Raz! Espera un momento. ¿Hablamos un poco?', hy: 'Հեյ, Ռազ։ Մի րոպե սպասիր։ Մի քիչ խոսե՞նք։' },
          free: [],
        };
        NPCS.push(def);
      }
      // turn the pedestrian towards RAZ
      const pp = e.player.pos;
      ped.h.root.rotation.y = Math.atan2(pp.x - ped.h.root.position.x, pp.z - ped.h.root.position.z);
      const lvl = levelFromXp(game.get().xp).level;
      const tier = lvl < 3 ? 0 : lvl < 6 ? 1 : 2;
      openModal({
        type: 'dialog',
        npcId: id,
        title: { es: 'Escucha los números (100–100 000) · ¡Si aciertas todo, hay regalo!', hy: 'Լսիր թվերը (100–100 000) · Եթե ամեն ինչ ճիշտ պատասխանես, նվեր կա։' },
        // three number questions and one everyday dialogue
        exchanges: [
          ...numberExchanges(Math.random() < 0.35 ? Math.min(2, tier + 1) : tier),
          shuffle([...STREET_TALK, ...SMALL_TALK])[0],
        ],
        outro: { es: '¡Gracias por hablar conmigo, Raz! ¡Hasta luego!', hy: 'Շնորհակալ եմ, որ զրուցեցիր ինձ հետ, Ռազ։ Առայժմ։' },
        onDone: (ok, total) => {
          e.peds.hold(a.index, 0);
          if (ok === total) setTimeout(() => giveGift(id), 250);
          else banner(`Has acertado ${ok} de ${total}. ¡La próxima vez, todo bien y tendrás un regalo!`, `Ճիշտ պատասխանեցիր ${ok}-ը ${total}-ից։ Հաջորդ անգամ ամեն ինչ ճիշտ պատասխանիր, և նվեր կստանաս։`, 'info', 4500);
        },
      });
      break;
    }
    case 'bed':
      e.env.setHour(8);
      game.set({ timeOfDay: 8 });
      toast('Has dormido bien. ¡Buenos días!', 'Լավ քնեցիր։ Բարի լույս։', 'good');
      saveNow();
      break;
  }
}

// --------------------------------------------------------------------------
// quests ("encargos"): talk -> find the item -> bring it back -> reward
function questItemPos(q: NonNullable<NonNullable<ReturnType<typeof npcById>>['quest']>, e: Engine) {
  const it = q.item;
  if (it.interior) {
    const room = e.interiors.rooms.get(it.interior)!;
    return { x: room.origin.x + it.x, z: room.origin.z + it.z, interior: it.interior };
  }
  const pl = placeById(it.place!)!;
  const base = it.door && pl.interior ? doorPoint(pl) : placeCenter(pl);
  return { x: base.x + it.x, z: base.z + it.z, interior: null };
}

export function spawnActiveQuestItems(e: Engine) {
  const s = game.get();
  for (const [qid, st] of Object.entries(s.quests)) {
    if (st !== 'active') continue;
    const def = NPCS_ALL().find((n) => n.quest?.id === qid);
    if (!def?.quest || s.inventory.includes(def.quest.item.id)) continue;
    const p = questItemPos(def.quest, e);
    e.spawnWorldItem(def.quest.item.id, p.x, p.z, def.quest.item.label, p.interior, def.quest.item.shape);
  }
}

function questTalk(npcId: string) {
  const e = Engine.current;
  const def = npcById(npcId);
  if (!e || !def?.quest) return;
  const q = def.quest;
  const st = game.get().quests[q.id];
  if (!st) {
    openModal({
      type: 'dialog',
      npcId,
      exchanges: def.free,
      onDone: () => {
        game.set((s) => ({ quests: { ...s.quests, [q.id]: 'active' } }));
        const p = questItemPos(q, e);
        e.spawnWorldItem(q.item.id, p.x, p.z, q.item.label, p.interior, q.item.shape);
        banner(`Nuevo encargo: ${q.item.label.es}`, `Նոր հանձնարարություն՝ ${q.item.label.hy}`, 'level', 4500);
        saveNow();
      },
    });
    return;
  }
  if (game.get().inventory.includes(q.item.id)) {
    openModal({
      type: 'dialog',
      npcId,
      greet: q.remind,
      exchanges: [q.give],
      outro: q.thanks,
      onDone: () => {
        game.set((s) => ({ quests: { ...s.quests, [q.id]: 'done' }, inventory: s.inventory.filter((i) => i !== q.item.id) }));
        reward(q.reward.xp, q.reward.money);
        sfx.coin();
        banner('¡Encargo completado!', 'Հանձնարարությունը կատարված է։', 'good', 3500);
        checkAchievements();
        saveNow();
      },
    });
  } else openModal({ type: 'dialog', npcId, greet: q.remind, exchanges: [] });
}

// --------------------------------------------------------------------------
// gifts from passers-by when every answer is correct
const GIFT_POOL = ['acc_cap', 'acc_headband', 'acc_sunglasses', 'acc_headphones', 'eq_ball', 'eq_cones', 'eq_rope', 'eq_shin', 'shoes_orange', 'shirt_white', 'room_poster', 'room_plant', 'room_lamp', 'room_rug'];
function giveGift(npcId: string) {
  const owned = game.get().owned;
  const options = GIFT_POOL.filter((id) => !owned.includes(id));
  const money = 15 + Math.floor(Math.random() * 4) * 5;
  const item = options.length ? SHOP.find((x) => x.id === options[Math.floor(Math.random() * options.length)]) : undefined;
  game.set((s) => ({ money: s.money + money, owned: item ? [...s.owned, item.id] : s.owned }));
  if (item?.stat) addStat(item.stat.k, item.stat.v);
  if (item?.cat === 'room') Engine.current?.applyRoomDecor();
  reward(40, 0);
  sfx.coin();
  checkAchievements();
  saveNow();
  const def = npcById(npcId);
  speak('¡Muy bien, Raz! Todo correcto. Toma, un regalo para ti.', { voice: def?.voice.voice ?? 0 });
  openModal({ type: 'gift', from: def?.name ?? '', item: item?.name ?? null, money });
}

// --------------------------------------------------------------------------
// hidden objects
function collectiblePos(c: (typeof COLLECTIBLES)[number]) {
  const pl = placeById(c.place)!;
  const base = c.door && pl.interior ? doorPoint(pl) : placeCenter(pl);
  return { x: base.x + c.dx, z: base.z + c.dz };
}
export function spawnCollectibles(e: Engine) {
  const city = game.get().city;
  const found = new Set(game.get().found);
  for (const c of COLLECTIBLES) {
    if (found.has(city + ':' + c.id)) continue;
    const p = collectiblePos(c);
    e.spawnWorldItem('col_' + c.id, p.x, p.z, { es: `Tomar ${c.name.es}`, hy: `Վերցնել ${c.name.hy}` }, null, c.shape);
  }
}
export function collectibleCount() {
  const city = game.get().city;
  return { found: game.get().found.filter((f) => f.startsWith(city + ':')).length, total: COLLECTIBLES.length };
}
function foundCollectible(id: string) {
  const c = COLLECTIBLES.find((x) => x.id === id);
  if (!c) return;
  const key = game.get().city + ':' + id;
  if (game.get().found.includes(key)) return;
  game.set((s) => ({ found: [...s.found, key] }));
  const word = c.name.es.split(' ').slice(1).join(' ');
  game.set((s) => ({ wordsLearned: { ...s.wordsLearned, [word]: (s.wordsLearned[word] ?? 0) + 1 } }));
  reward(20, 3);
  sfx.coin();
  const n = collectibleCount();
  banner(`¡Has encontrado ${c.name.es}! (${n.found}/${n.total})`, `Գտար ${c.name.hy}։ (${n.found}/${n.total})`, 'good', 4000);
  speak(`¡Has encontrado ${c.name.es}!`);
  if (n.found === n.total) {
    setTimeout(() => banner('¡Increíble! Has encontrado todos los objetos de la ciudad.', 'Անհավանական է։ Գտար քաղաքի բոլոր առարկաները։', 'level', 5000), 4200);
    reward(150, 60);
  }
  checkAchievements();
  saveNow();
}
/** Spanish hint for the next object that has not been found yet. */
export function collectibleHint() {
  const city = game.get().city;
  const left = COLLECTIBLES.filter((c) => !game.get().found.includes(city + ':' + c.id));
  if (!left.length) return { es: '¡Ya lo has encontrado todo en esta ciudad!', hy: 'Այս քաղաքում արդեն ամեն ինչ գտել ես։' };
  const c = left[Math.floor(Math.random() * left.length)];
  const pl = placeById(c.place)!;
  return c.door
    ? { es: `Pista: busca ${c.name.es} delante de la puerta de «${pl.name.es}».`, hy: `Հուշում՝ փնտրիր ${c.name.hy} «${pl.name.hy}»-ի դռան առջև։` }
    : { es: `Pista: ${c.name.es} está en algún lugar de «${pl.name.es}».`, hy: `Հուշում՝ ${c.name.hy} գտնվում է «${pl.name.hy}»-ում, ինչ-որ տեղ։` };
}

function onKey(code: string) {
  const s = ui.get();
  if (s.screen !== 'game') return;
  if (code === 'KeyM') {
    if (s.modal?.type === 'map') closeModal();
    else if (!s.modal) openModal({ type: 'map' });
  } else if (code === 'Escape' || code === 'KeyP') {
    if (s.modal?.type === 'pause') closeModal();
    else if (!s.modal) openModal({ type: 'pause' });
  }
}

// --------------------------------------------------------------------------
// minigames
/** A 3D minigame chosen in the main menu waits here until the world is loaded. */
let pendingMinigame: string | null = null;
export function queueMinigame(id: string) {
  pendingMinigame = id;
}
export function takePendingMinigame() {
  const id = pendingMinigame;
  pendingMinigame = null;
  return id;
}

export function startMinigame(id: string) {
  const mg = MINIGAMES.find((m) => m.id === id);
  const e = Engine.current;
  if (!mg) return;
  if (mg.kind === 'panel' || !e) {
    openModal({ type: 'minigame', id });
    return;
  }
  closeModal();
  runner.minigame3d = { id, start: performance.now() };
  // clear start screen so it's obvious the 3D game has begun
  const how: Record<string, Tr> = {
    penalty: t('Chuta con clic izquierdo o K. ¡Marca 5 penaltis!', 'Հարվածիր ձախ սեղմումով կամ K-ով։ Խփիր 5 պենալտի։'),
    goalkeeper: t('Muévete con A y D y para los tiros. ¡Para 5!', 'Շարժվիր A-ով և D-ով և կասեցրու հարվածները։ Կասեցրու 5-ը։'),
    carrace: t('Pasa por todos los aros naranjas antes de que acabe el tiempo.', 'Անցիր բոլոր նարնջագույն օղակներով, մինչև ժամանակը կավարտվի։'),
    bikerace: t('Pedalea y pasa por todos los aros naranjas.', 'Ոտնակիր և անցիր բոլոր նարնջագույն օղակներով։'),
    delivery: t('Lee adónde llevar el pedido y búscalo en el mapa (M).', 'Կարդա՝ ուր տանել պատվերը, և գտիր քարտեզում (M)։'),
    treasure: t('Lee la pista y busca el lugar en el mapa (M).', 'Կարդա հուշումը և գտիր վայրը քարտեզում (M)։'),
  };
  const h = how[id];
  if (h) {
    banner(`${mg.name.es}: ¡empieza! ${h.es}`, `${mg.name.hy}՝ սկսվում է։ ${h.hy}`, 'level', 6000);
    speak(`¡Empieza ${mg.name.es}! ${h.es}`);
  }
  if (id === 'penalty') e.startFootball('penalty', 5);
  else if (id === 'goalkeeper') e.startFootball('goalkeeper', 5);
  else {
    if (e.interior) e.exitInterior();
    const routes: Record<string, { pts: [number, number][]; time: number; v: 'car' | 'bike' | 'foot' | 'any'; hints: Tr[]; spawn?: 'car_sport' | 'bike_mtb' }> = {
      carrace: {
        pts: [
          [0, 74],
          [0, -160],
          [160, -160],
          [160, 160],
          [-160, 160],
          [-160, 0],
          [-40, 74],
        ],
        time: 150,
        v: 'car',
        spawn: 'car_sport',
        hints: [t('¡Sal rápido! Sigue recto.', 'Արագ դուրս արի։ Շարունակիր ուղիղ։'), t('Gira a la derecha.', 'Թեքվիր աջ։'), t('Gira a la derecha otra vez.', 'Կրկին թեքվիր աջ։'), t('Sigue recto muchos metros.', 'Շատ մետր շարունակիր ուղիղ։'), t('Gira a la derecha.', 'Թեքվիր աջ։'), t('¡Última curva!', 'Վերջին շրջադարձը։'), t('¡Meta!', 'Վերջնագիծ։')],
      },
      bikerace: {
        pts: [
          [-28, 54],
          [0, 40],
          [0, 0],
          [80, 0],
          [80, -80],
          [160, -80],
          [160, 0],
          [240, 0],
        ],
        time: 140,
        v: 'bike',
        spawn: 'bike_mtb',
        hints: [t('Sigue recto.', 'Շարունակիր ուղիղ։'), t('Gira a la izquierda.', 'Թեքվիր ձախ։'), t('Ten cuidado.', 'Զգույշ եղիր։'), t('Reduce la velocidad.', 'Նվազեցրու արագությունը։'), t('Adelanta al ciclista.', 'Առաջ անցիր հեծանվորդից։'), t('Continúa hasta el puente.', 'Շարունակիր մինչև կամուրջը։'), t('No te salgas del camino.', 'Ճանապարհից դուրս մի՛ գնա։'), t('¡Meta!', 'Վերջնագիծ։')],
      },
    };
    if (id === 'delivery' || id === 'treasure') {
      const pool = PLACES.filter((p) => p.interior && p.id !== 'home');
      const picks = shuffle(pool).slice(0, id === 'delivery' ? 4 : 5);
      const pts = picks.map((p) => {
        const d = doorPoint(p);
        return [d.x, d.z] as [number, number];
      });
      const food = shuffle([t('la pizza', 'պիցցան'), t('el paquete', 'ծանրոցը'), t('las flores', 'ծաղիկները'), t('el balón nuevo', 'նոր գնդակը'), t('la tarta', 'տորթը')]);
      const hints = picks.map((p, i) =>
        id === 'delivery'
          ? t(`Lleva ${food[i % food.length].es} a: ${p.name.es}.`, `Տար ${food[i % food.length].hy}՝ ${p.name.hy}։`)
          : t(`Pista ${i + 1}: el tesoro está cerca de la puerta de «${p.name.es}».`, `Հուշում ${i + 1}՝ գանձը «${p.name.hy}»-ի դռան մոտ է։`),
      );
      e.startRoute(pts, { time: id === 'delivery' ? 240 : 300, vtype: 'any', hints });
      e.setTarget(null); // no marker: read the Spanish instruction and use the map
      return;
    }
    const r = routes[id];
    if (!r) return;
    if (r.spawn && (!e.vehicle || e.vehicle.spec.kind !== r.v)) {
      const sx = r.pts[0][0];
      const sz = r.pts[0][1] - 6;
      e.teleportTo(sx + 3, sz, 0);
      const v = e.vehicles.find((x) => x.type === r.spawn && !x.owned && x.id.startsWith('race'));
      const veh = v ?? (() => {
        const nv = new Vehicle(e.phys, e.scene, r.spawn!, sx, sz, Math.PI);
        nv.id = 'race_' + r.spawn;
        e.vehicles.push(nv);
        return nv;
      })();
      veh.teleport(sx, sz, Math.PI);
      e.mount(veh);
    }
    e.startRoute(r.pts, { time: r.time, vtype: r.v, hints: r.hints });
  }
}

export function finishMinigame(id: string, score: number) {
  const best = game.get().minigames[id] ?? 0;
  game.set((s) => ({ minigames: { ...s.minigames, [id]: Math.max(best, score) } }));
  bumpDaily('minigame');
  reward(Math.min(80, 15 + Math.round(score / 20)), Math.min(30, 3 + Math.round(score / 50)));
  checkAchievements();
  if (score > best && best > 0) toast('¡Nuevo récord!', 'Նոր ռեկորդ։', 'level');
}

// --------------------------------------------------------------------------
export function travelTo(city: CityId) {
  const e = Engine.current;
  if (!e) return;
  closeModal();
  ui.set({ basket: [] });
  e.travel(city);
  runner.attach(e);
  runner.onTravelled();
  const c = cityById(city);
  game.set((s) => ({ unlockedCities: s.unlockedCities.includes(city) ? s.unlockedCities : [...s.unlockedCities, city] }));
  checkAchievements();
  banner(`Bienvenido a ${c.name.es}`, `Բարի գալուստ ${c.name.hy}`, 'level', 4500);
  saveNow();
}

export { GRAMMAR, missionIndex };

/** A product was chosen correctly: put it in the basket (data + 3D). */
export function addToBasket(id: string) {
  const p = productById(id);
  ui.set((s) => ({ basket: [...s.basket, id] }));
  Engine.current?.addBasketItem(p.color, p.shape);
  toast(`Has puesto ${p.name.es} en la cesta (${fmtEuro(p.price)}).`, `Զամբյուղի մեջ դրեցիր ${p.name.hy} (${fmtEuro(p.price)})։`, 'good');
  const st = runner.step();
  if (st?.k === 'shop') runner.updateShopList(st.list);
  else if (runner.freeShop) runner.updateShopList(runner.freeShop);
}
