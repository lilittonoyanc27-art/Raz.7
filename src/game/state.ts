// Persistent game state (progress, money, outfit, language statistics).
import { createStore, safeLoad, safeSave } from './store';

export type StatKey = 'speed' | 'stamina' | 'shooting' | 'technique' | 'teamwork';
export type CityId = 'valencia' | 'madrid' | 'barcelona' | 'sevilla' | 'santander' | 'bilbao' | 'malaga';

export interface Mistake {
  es: string;
  hy: string;
  topic: string;
  count: number;
  explain?: string;
}

export interface DailyTask {
  id: string;
  progress: number;
  goal: number;
  done: boolean;
}

export interface GameState {
  version: number;
  started: boolean;
  city: CityId;
  unlockedCities: CityId[];
  money: number;
  xp: number;
  stats: Record<StatKey, number>;
  outfit: { shirt: string; shorts: string; shoes: string; accessory: string; hair: string };
  owned: string[];
  missionsDone: string[];
  activeMission: string | null;
  stepIndex: number;
  pos: { x: number; y: number; z: number; yaw: number } | null;
  inventory: string[];
  quests: Record<string, 'active' | 'done'>;
  /** found hidden objects, as "city:id" */
  found: string[];
  wordsSeen: Record<string, number>;
  wordsLearned: Record<string, number>;
  mistakes: Record<string, Mistake>;
  correct: number;
  wrong: number;
  dialogsDone: number;
  topics: Record<string, { c: number; w: number }>;
  football: { goals: number; assists: number; matches: number; wins: number; penalties: number; saves: number };
  minigames: Record<string, number>;
  achievements: string[];
  daily: { date: string; tasks: DailyTask[] };
  timeOfDay: number; // 0..24
  playSeconds: number;
}

export const VERSION = 1;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function makeDaily(): GameState['daily'] {
  const pool: DailyTask[] = [
    { id: 'goals', progress: 0, goal: 5, done: false },
    { id: 'correct', progress: 0, goal: 15, done: false },
    { id: 'mission', progress: 0, goal: 2, done: false },
    { id: 'minigame', progress: 0, goal: 2, done: false },
    { id: 'words', progress: 0, goal: 20, done: false },
    { id: 'drive', progress: 0, goal: 1000, done: false },
  ];
  // pick 4 deterministic by date
  const seed = Number(today().replace(/-/g, ''));
  const tasks = [...pool].sort((a, b) => ((seed * (a.id.length + 3)) % 7) - ((seed * (b.id.length + 3)) % 7)).slice(0, 4);
  return { date: today(), tasks };
}

export function newGame(): GameState {
  return {
    version: VERSION,
    started: true,
    city: 'valencia',
    unlockedCities: ['valencia'],
    money: 30,
    xp: 0,
    stats: { speed: 1, stamina: 1, shooting: 1, technique: 1, teamwork: 1 },
    outfit: { shirt: '#ff6a00', shorts: '#141414', shoes: '#f2f2f2', accessory: 'none', hair: '#2a1a10' },
    owned: ['shirt_orange', 'shorts_black', 'shoes_white', 'bike_city'],
    missionsDone: [],
    activeMission: 'm01',
    stepIndex: 0,
    pos: null,
    inventory: [],
    quests: {},
    found: [],
    wordsSeen: {},
    wordsLearned: {},
    mistakes: {},
    correct: 0,
    wrong: 0,
    dialogsDone: 0,
    topics: {},
    football: { goals: 0, assists: 0, matches: 0, wins: 0, penalties: 0, saves: 0 },
    minigames: {},
    achievements: [],
    daily: makeDaily(),
    timeOfDay: 9,
    playSeconds: 0,
  };
}

const KEY = 'raz7.save';
const loaded = safeLoad<GameState>(KEY);
export const hasSave = !!(loaded && loaded.started);

export const game = createStore<GameState>(loaded && loaded.version === VERSION ? { ...newGame(), ...loaded } : { ...newGame(), started: false });

if (game.get().daily.date !== today()) game.set({ daily: makeDaily() });

export function saveNow() {
  safeSave(KEY, game.get());
}

export function resetGame() {
  game.set(newGame());
  saveNow();
}

// ---------- progression helpers ----------
export function levelFromXp(xp: number) {
  let lvl = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    lvl++;
    need = Math.round(need * 1.25);
  }
  return { level: lvl, into: rest, need };
}

export const toasts = createStore<{ list: { id: number; es: string; hy: string; kind: string }[] }>({ list: [] });
let toastId = 1;
export function toast(es: string, hy: string, kind = 'info') {
  const id = toastId++;
  toasts.set((s) => ({ list: [...s.list, { id, es, hy, kind }].slice(-4) }));
  setTimeout(() => toasts.set((s) => ({ list: s.list.filter((t) => t.id !== id) })), 4200);
}

export function reward(xp: number, money: number) {
  const before = levelFromXp(game.get().xp).level;
  game.set((s) => ({ xp: s.xp + xp, money: s.money + money }));
  const after = levelFromXp(game.get().xp).level;
  if (after > before) toast(`¡Nivel ${after}!`, `Մակարդակ ${after}։`, 'level');
}

export function bumpDaily(id: string, amount = 1) {
  const d = game.get().daily;
  let completed = false;
  const tasks = d.tasks.map((t) => {
    if (t.id !== id || t.done) return t;
    const progress = Math.min(t.goal, t.progress + amount);
    const done = progress >= t.goal;
    if (done) completed = true;
    return { ...t, progress, done };
  });
  game.set({ daily: { ...d, tasks } });
  if (completed) {
    reward(60, 25);
    toast('¡Tarea diaria completada!', 'Օրվա առաջադրանքը կատարված է։', 'good');
  }
}

export function recordAnswer(ok: boolean, item: { es: string; hy: string; topic: string; explain?: string }) {
  game.set((s) => {
    const topics = { ...s.topics };
    const t = topics[item.topic] ?? { c: 0, w: 0 };
    topics[item.topic] = ok ? { c: t.c + 1, w: t.w } : { c: t.c, w: t.w + 1 };
    const mistakes = { ...s.mistakes };
    if (!ok) {
      const m = mistakes[item.es];
      mistakes[item.es] = { ...item, count: (m?.count ?? 0) + 1 };
    } else if (mistakes[item.es]) {
      const m = mistakes[item.es];
      if (m.count <= 1) delete mistakes[item.es];
      else mistakes[item.es] = { ...m, count: m.count - 1 };
    }
    const learned = { ...s.wordsLearned };
    if (ok) for (const w of item.es.toLowerCase().replace(/[¿?¡!.,]/g, '').split(/\s+/)) if (w.length > 2) learned[w] = (learned[w] ?? 0) + 1;
    return { topics, mistakes, wordsLearned: learned, correct: s.correct + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) };
  });
  if (ok) {
    bumpDaily('correct');
    reward(5, 1);
  }
  checkAchievements();
}

export function addStat(k: StatKey, v: number) {
  game.set((s) => ({ stats: { ...s.stats, [k]: Math.min(10, +(s.stats[k] + v).toFixed(2)) } }));
}

export const ACHIEVEMENTS: { id: string; es: string; hy: string; test: (s: GameState) => boolean }[] = [
  { id: 'first_mission', es: 'Primera misión', hy: 'Առաջին առաքելությունը', test: (s) => s.missionsDone.length >= 1 },
  { id: 'ten_missions', es: 'Diez misiones', hy: 'Տասը առաքելություն', test: (s) => s.missionsDone.length >= 10 },
  { id: 'thirty_missions', es: 'Treinta misiones', hy: 'Երեսուն առաքելություն', test: (s) => s.missionsDone.length >= 30 },
  { id: 'first_goal', es: 'Primer gol', hy: 'Առաջին գոլը', test: (s) => s.football.goals >= 1 },
  { id: 'goleador', es: 'Goleador: 25 goles', hy: 'Ռմբարկու՝ 25 գոլ', test: (s) => s.football.goals >= 25 },
  { id: 'words50', es: '50 palabras aprendidas', hy: '50 սովորած բառ', test: (s) => Object.keys(s.wordsLearned).length >= 50 },
  { id: 'words200', es: '200 palabras aprendidas', hy: '200 սովորած բառ', test: (s) => Object.keys(s.wordsLearned).length >= 200 },
  { id: 'correct100', es: '100 respuestas correctas', hy: '100 ճիշտ պատասխան', test: (s) => s.correct >= 100 },
  { id: 'rich', es: 'Ahorrador: 500 euros', hy: 'Խնայող՝ 500 եվրո', test: (s) => s.money >= 500 },
  { id: 'traveler', es: 'Viajero: 3 ciudades', hy: 'Ճամփորդ՝ 3 քաղաք', test: (s) => s.unlockedCities.length >= 3 },
  { id: 'gamer', es: 'Jugador: 5 minijuegos', hy: 'Խաղացող՝ 5 մինի-խաղ', test: (s) => Object.keys(s.minigames).length >= 5 },
];

export function checkAchievements() {
  const s = game.get();
  const fresh = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.test(s));
  if (!fresh.length) return;
  game.set({ achievements: [...s.achievements, ...fresh.map((a) => a.id)] });
  for (const a of fresh) {
    toast(`Logro: ${a.es}`, `Նվաճում՝ ${a.hy}`, 'level');
    reward(50, 20);
  }
}

// autosave
setInterval(() => {
  if (game.get().started) saveNow();
}, 5000);
if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => game.get().started && saveNow());
