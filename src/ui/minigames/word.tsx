import { useEffect, useMemo, useRef, useState } from 'react';
import { T, TBadge } from '../../i18n/T';
import { UI } from '../../i18n/ui';
import { speak } from '../../i18n/speech';
import { GRAMMAR, shuffle, TOPICS, type GQ } from '../../game/data/grammar';
import { recordAnswer } from '../../game/state';
import type { MgProps } from './index';

export const VOCAB: { es: string; hy: string; cat: string }[] = [
  ['balón', 'գնդակ', 'fútbol'], ['portería', 'դարպաս', 'fútbol'], ['portero', 'դարպասապահ', 'fútbol'], ['entrenador', 'մարզիչ', 'fútbol'], ['equipo', 'թիմ', 'fútbol'], ['partido', 'խաղ', 'fútbol'], ['estadio', 'մարզադաշտ', 'fútbol'], ['gol', 'գոլ', 'fútbol'], ['árbitro', 'մրցավար', 'fútbol'], ['botas', 'բութսեր', 'fútbol'], ['camiseta', 'մարզաշապիկ', 'ropa'],
  ['zapatillas', 'մարզակոշիկներ', 'ropa'], ['mochila', 'պայուսակ', 'cosas'], ['bicicleta', 'հեծանիվ', 'transporte'], ['coche', 'մեքենա', 'transporte'], ['tren', 'գնացք', 'transporte'], ['avión', 'ինքնաթիռ', 'transporte'], ['autobús', 'ավտոբուս', 'transporte'], ['calle', 'փողոց', 'ciudad'], ['parque', 'այգի', 'ciudad'], ['playa', 'լողափ', 'ciudad'],
  ['escuela', 'դպրոց', 'ciudad'], ['tienda', 'խանութ', 'ciudad'], ['puente', 'կամուրջ', 'ciudad'], ['semáforo', 'լուսացույց', 'ciudad'], ['agua', 'ջուր', 'comida'], ['leche', 'կաթ', 'comida'], ['pan', 'հաց', 'comida'], ['manzana', 'խնձոր', 'comida'], ['naranja', 'նարինջ', 'comida'], ['queso', 'պանիր', 'comida'], ['pollo', 'հավ', 'comida'],
  ['huevo', 'ձու', 'comida'], ['arroz', 'բրինձ', 'comida'], ['zumo', 'հյութ', 'comida'], ['casa', 'տուն', 'casa'], ['cama', 'մահճակալ', 'casa'], ['mesa', 'սեղան', 'casa'], ['silla', 'աթոռ', 'casa'], ['ventana', 'պատուհան', 'casa'], ['puerta', 'դուռ', 'casa'], ['amigo', 'ընկեր', 'gente'], ['madre', 'մայր', 'gente'],
  ['padre', 'հայր', 'gente'], ['profesora', 'ուսուցչուհի', 'gente'], ['médico', 'բժիշկ', 'gente'], ['sol', 'արև', 'tiempo'], ['lluvia', 'անձրև', 'tiempo'], ['frío', 'ցուրտ', 'tiempo'], ['calor', 'շոգ', 'tiempo'], ['rápido', 'արագ', 'adjetivos'], ['lento', 'դանդաղ', 'adjetivos'], ['grande', 'մեծ', 'adjetivos'], ['pequeño', 'փոքր', 'adjetivos'],
  ['feliz', 'երջանիկ', 'adjetivos'], ['cansado', 'հոգնած', 'adjetivos'], ['correr', 'վազել', 'verbos'], ['saltar', 'ցատկել', 'verbos'], ['comer', 'ուտել', 'verbos'], ['beber', 'խմել', 'verbos'], ['dormir', 'քնել', 'verbos'], ['hablar', 'խոսել', 'verbos'], ['comprar', 'գնել', 'verbos'], ['ganar', 'հաղթել', 'verbos'], ['perder', 'պարտվել / կորցնել', 'verbos'],
].map(([es, hy, cat]) => ({ es, hy, cat }));

// ---------------------------------------------------------------- Memory
export function Memory({ level, add, end }: MgProps) {
  const pairs = [6, 8, 10][level];
  const cards = useMemo(() => {
    const words = shuffle(VOCAB).slice(0, pairs);
    return shuffle(words.flatMap((w, i) => [{ id: i, text: w.es, lang: 'es' }, { id: i, text: w.hy, lang: 'hy' }]));
  }, [pairs]);
  const [up, setUp] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  useEffect(() => {
    if (up.length !== 2) return;
    const [a, b] = up;
    const t = setTimeout(() => {
      if (cards[a].id === cards[b].id) {
        setMatched((m) => [...m, cards[a].id]);
        add(20);
        const es = cards[a].lang === 'es' ? cards[a].text : cards[b].text;
        speak(es);
      } else add(-2);
      setUp([]);
    }, 650);
    return () => clearTimeout(t);
  }, [up, cards, add]);
  useEffect(() => {
    if (matched.length === pairs) setTimeout(end, 600);
  }, [matched, pairs, end]);
  return (
    <div className="cards-grid">
      {cards.map((c, i) => {
        const isUp = up.includes(i) || matched.includes(c.id);
        return (
          <button key={i} className={'mcard flip' + (matched.includes(c.id) ? ' matched' : isUp ? ' up' : '')} onClick={() => !isUp && up.length < 2 && setUp([...up, i])}>
            <span className="face front">7</span>
            <span className="face back" lang={c.lang}>
              {c.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Pasapalabra
const PASA: { l: string; es: string; hy: string; a: string }[] = [
  { l: 'A', es: 'Empieza por A: líquido que bebemos cuando tenemos sed.', hy: 'Սկսվում է A-ով՝ հեղուկ, որ խմում ենք ծարավ ժամանակ։', a: 'agua' },
  { l: 'B', es: 'Empieza por B: objeto redondo para jugar al fútbol.', hy: 'Սկսվում է B-ով՝ կլոր առարկա ֆուտբոլ խաղալու համար։', a: 'balón' },
  { l: 'C', es: 'Empieza por C: vehículo con cuatro ruedas.', hy: 'Սկսվում է C-ով՝ չորս անիվով տրանսպորտ։', a: 'coche' },
  { l: 'D', es: 'Empieza por D: lo usamos para pagar en las tiendas.', hy: 'Սկսվում է D-ով՝ օգտագործում ենք խանութներում վճարելու համար։', a: 'dinero' },
  { l: 'E', es: 'Empieza por E: lugar donde se juegan los partidos.', hy: 'Սկսվում է E-ով՝ վայր, որտեղ խաղեր են անցկացվում։', a: 'estadio' },
  { l: 'F', es: 'Empieza por F: el deporte favorito de RAZ.', hy: 'Սկսվում է F-ով՝ ՌԱԶ-ի սիրելի սպորտը։', a: 'fútbol' },
  { l: 'G', es: 'Empieza por G: cuando el balón entra en la portería.', hy: 'Սկսվում է G-ով՝ երբ գնդակը մտնում է դարպաս։', a: 'gol' },
  { l: 'H', es: 'Empieza por H: lo que sentimos cuando queremos comer.', hy: 'Սկսվում է H-ով՝ ինչ զգում ենք, երբ ուզում ենք ուտել։', a: 'hambre' },
  { l: 'I', es: 'Empieza por I: tierra rodeada de agua.', hy: 'Սկսվում է I-ով՝ ջրով շրջապատված ցամաք։', a: 'isla' },
  { l: 'J', es: 'Empieza por J: persona que juega en un equipo.', hy: 'Սկսվում է J-ով՝ մարդ, որ խաղում է թիմում։', a: 'jugador' },
  { l: 'L', es: 'Empieza por L: bebida blanca que nos da la vaca.', hy: 'Սկսվում է L-ով՝ սպիտակ ըմպելիք, որ տալիս է կովը։', a: 'leche' },
  { l: 'M', es: 'Empieza por M: fruta roja o verde.', hy: 'Սկսվում է M-ով՝ կարմիր կամ կանաչ միրգ։', a: 'manzana' },
  { l: 'N', es: 'Empieza por N: fruta y también color.', hy: 'Սկսվում է N-ով՝ միրգ և նաև գույն։', a: 'naranja' },
  { l: 'O', es: 'Empieza por O: parte de la cara con la que vemos.', hy: 'Սկսվում է O-ով՝ դեմքի մաս, որով տեսնում ենք։', a: 'ojo' },
  { l: 'P', es: 'Empieza por P: jugador que defiende la portería.', hy: 'Սկսվում է P-ով՝ խաղացող, որ պաշտպանում է դարպասը։', a: 'portero' },
  { l: 'Q', es: 'Empieza por Q: alimento amarillo hecho con leche.', hy: 'Սկսվում է Q-ով՝ կաթից պատրաստված դեղին սնունդ։', a: 'queso' },
  { l: 'R', es: 'Empieza por R: lo contrario de lento.', hy: 'Սկսվում է R-ով՝ դանդաղի հակառակը։', a: 'rápido' },
  { l: 'S', es: 'Empieza por S: estrella que nos da luz y calor.', hy: 'Սկսվում է S-ով՝ աստղ, որ մեզ լույս ու ջերմություն է տալիս։', a: 'sol' },
  { l: 'T', es: 'Empieza por T: transporte que va por las vías.', hy: 'Սկսվում է T-ով՝ տրանսպորտ, որ գնում է ռելսերով։', a: 'tren' },
  { l: 'U', es: 'Empieza por U: el primer número.', hy: 'Սկսվում է U-ով՝ առաջին թիվը։', a: 'uno' },
  { l: 'V', es: 'Empieza por V: estación del año con mucho calor.', hy: 'Սկսվում է V-ով՝ տարվա եղանակ, երբ շատ շոգ է։', a: 'verano' },
  { l: 'Z', es: 'Empieza por Z: bebida de fruta, por ejemplo de naranja.', hy: 'Սկսվում է Z-ով՝ մրգային ըմպելիք, օրինակ՝ նարնջի։', a: 'zumo' },
];
const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function Pasapalabra({ level, add, end }: MgProps) {
  const list = useMemo(() => (level === 0 ? PASA.filter((_, i) => i % 2 === 0) : level === 1 ? PASA.slice(0, 18) : PASA), [level]);
  const [state, setState] = useState<Record<string, 'ok' | 'no' | 'skip'>>({});
  const [cur, setCur] = useState(0);
  const [val, setVal] = useState('');
  const [fb, setFb] = useState<string | null>(null);
  const pending = list.map((_, i) => i).filter((i) => state[list[i].l] !== 'ok' && state[list[i].l] !== 'no');
  useEffect(() => {
    if (!pending.length) setTimeout(end, 800);
  }, [pending.length, end]);
  const q = list[cur];
  const go = (res: 'ok' | 'no' | 'skip') => {
    const ns = { ...state, [q.l]: res };
    setState(ns);
    setVal('');
    const rest = list.map((_, i) => i).filter((i) => ns[list[i].l] !== 'ok' && ns[list[i].l] !== 'no');
    if (!rest.length) return;
    const after = rest.find((i) => i > cur) ?? rest[0];
    setCur(after);
  };
  const submit = () => {
    const ok = plain(val) === plain(q.a);
    recordAnswer(ok, { es: q.a, hy: q.hy, topic: 'deporte' });
    setFb(ok ? `✓ ${q.a}` : `✗ ${q.a}`);
    add(ok ? 15 : -3);
    speak(q.a);
    go(ok ? 'ok' : 'no');
  };
  if (!q) return null;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div className="row" style={{ gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="rosco">
          {list.map((x, i) => {
            const a = (i / list.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <span
                key={x.l}
                className={'letter' + (i === cur ? ' cur' : '') + (state[x.l] === 'ok' ? ' ok' : state[x.l] === 'no' ? ' no' : '')}
                style={{ left: `${50 + Math.cos(a) * 44}%`, top: `${50 + Math.sin(a) * 44}%` }}
              >
                {x.l}
              </span>
            );
          })}
          <div className="rosco-center">
            <span className="mg-kicker">
              <T es="Letra" hy="Տառ" />
            </span>
            <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{q.l}</span>
            <span className="small muted">
              {Object.values(state).filter((v) => v === 'ok').length} ✓ · {Object.values(state).filter((v) => v === 'no').length} ✗
            </span>
          </div>
        </div>
        <div className="bubble" style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
          <T es={q.es} hy={q.hy} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <input className="text-in" autoFocus value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && val.trim()) submit(); }} placeholder="Escribe la palabra…" />
        <button className="btn primary" disabled={!val.trim()} onClick={submit}>
          {UI.check.es} <TBadge {...UI.check} />
        </button>
        <button className="btn" onClick={() => go('skip')}>
          Pasapalabra <TBadge es="Pasapalabra" hy="Անցնել բառը" />
        </button>
      </div>
      {fb && <div className="feedback ok small">{fb}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Millonario
const PRIZES = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 125000, 1000000];
export function Millonario({ level, add, end }: MgProps) {
  const qs = useMemo(() => {
    const byLevel = (l: number) => shuffle(GRAMMAR.filter((g) => g.level === l));
    return [...byLevel(1).slice(0, 4), ...byLevel(2).slice(0, 4 + level), ...byLevel(3).slice(0, 4 - level)].slice(0, 12);
  }, [level]);
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState<number[]>([]);
  const [used5050, setUsed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const q = qs[i];
  const opts = useMemo(() => (q ? shuffle(q.options.map((o, k) => ({ o, ok: k === q.a }))) : []), [q]);
  if (!q) return null;
  const choose = (k: number) => {
    setPicked(k);
    const ok = opts[k].ok;
    recordAnswer(ok, { es: q.full.es, hy: q.full.hy, topic: q.topic, explain: q.explain.es });
    setTimeout(() => {
      if (ok) {
        add(PRIZES[i] >= 1000 ? Math.round(PRIZES[i] / 1000) * 10 + 20 : 15);
        if (i + 1 >= qs.length) end();
        else {
          setI(i + 1);
          setPicked(null);
          setHidden([]);
        }
      } else end();
    }, 1200);
  };
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div className="kicker">
          <T {...TOPICS[q.topic]} />
        </div>
        <div className="bubble" style={{ margin: '10px 0' }}>
          <T es={q.q} hy={q.full.hy} />
        </div>
        <div className="answers">
          {opts.map((x, k) =>
            hidden.includes(k) ? <div key={k} className="answer" style={{ opacity: 0.2 }} /> : (
              <button key={k} className={'answer' + (picked !== null ? (x.ok ? ' ok' : picked === k ? ' no' : '') : '')} disabled={picked !== null} onClick={() => choose(k)}>
                {String.fromCharCode(65 + k)}. {x.o}
              </button>
            ),
          )}
        </div>
        {picked !== null && (
          <div className="feedback small">
            <T es={q.full.es} hy={q.full.hy} /> — <T es={q.explain.es} hy={q.explain.hy} />
          </div>
        )}
        <button className="btn sm" style={{ marginTop: 10 }} disabled={used5050 || picked !== null} onClick={() => { setUsed(true); setHidden(opts.map((x, k) => (x.ok ? -1 : k)).filter((k) => k >= 0).slice(0, 1)); }}>
          50:50 <TBadge es="Comodín del 50 por ciento" hy="50% օգնություն" />
        </button>
      </div>
      <div className="ladder card" style={{ minWidth: 150 }}>
        {PRIZES.map((p, k) => (
          <div key={p} className={k === i ? 'cur' : k < i ? 'past' : ''}>
            {k + 1}. {p.toLocaleString('es-ES')} €
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Grammar Battle
export function GrammarBattle({ level, add, end }: MgProps) {
  const [robot, setRobot] = useState(0);
  const [hp, setHp] = useState(100);
  const [me, setMe] = useState(100);
  const [q, setQ] = useState<GQ>(() => shuffle(GRAMMAR)[0]);
  const [fb, setFb] = useState<null | boolean>(null);
  const opts = useMemo(() => shuffle(q.options.map((o, k) => ({ o, ok: k === q.a }))), [q]);
  const dmg = [34, 26, 20][level];
  const names = ['Robot Tiempo', 'Robot Ser-Estar', 'Robot Por-Para'];
  const answer = (ok: boolean) => {
    setFb(ok);
    recordAnswer(ok, { es: q.full.es, hy: q.full.hy, topic: q.topic, explain: q.explain.es });
    if (ok) {
      add(10);
      const nh = hp - dmg;
      if (nh <= 0) {
        add(40);
        if (robot >= 2) return setTimeout(end, 900);
        setRobot(robot + 1);
        setHp(100);
      } else setHp(nh);
    } else {
      const nm = me - 25;
      setMe(nm);
      if (nm <= 0) return setTimeout(end, 900);
    }
    setTimeout(() => {
      setFb(null);
      setQ(shuffle(GRAMMAR)[0]);
    }, 1100);
  };
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', width: '100%' }}>
      <div className="grid c2">
        <div className="card">
          <b>RAZ</b>
          <div className="bar" style={{ marginTop: 6 }}>
            <i style={{ width: `${me}%`, background: '#2ecc71' }} />
          </div>
        </div>
        <div className="card">
          <b>{names[robot]}</b> <span className="pill">{robot + 1}/3</span>
          <div className="bar" style={{ marginTop: 6 }}>
            <i style={{ width: `${hp}%`, background: '#ff4d4d' }} />
          </div>
        </div>
      </div>
      <svg viewBox="0 0 400 110" style={{ width: '100%', height: 120, marginTop: 10 }}>
        <rect x="270" y="20" width="70" height="70" rx="12" fill={['#16a085', '#8e44ad', '#c0392b'][robot]} />
        <rect x="285" y="38" width="14" height="10" fill="#fff" /><rect x="311" y="38" width="14" height="10" fill="#fff" />
        <rect x="290" y="64" width="30" height="6" fill="#111" />
        <circle cx="80" cy="55" r="34" fill="#ff6a00" /><text x="80" y="66" textAnchor="middle" fontSize="32" fontWeight="900" fill="#fff">7</text>
        {fb === true && <line x1="115" y1="55" x2="268" y2="55" stroke="#ffd27a" strokeWidth="6" />}
        {fb === false && <line x1="268" y1="55" x2="115" y2="55" stroke="#ff4d4d" strokeWidth="6" />}
      </svg>
      <div className="kicker">
        <T {...TOPICS[q.topic]} />
      </div>
      <div className="bubble" style={{ margin: '8px 0' }}>
        <T es={q.q} hy={q.full.hy} />
      </div>
      <div className="answers">
        {opts.map((x, k) => (
          <button key={k} className={'answer' + (fb !== null && x.ok ? ' ok' : '')} disabled={fb !== null} onClick={() => answer(x.ok)}>
            {x.o}
          </button>
        ))}
      </div>
      {fb === false && (
        <div className="feedback no small">
          <T es={q.full.es} hy={q.full.hy} /> — <T es={q.explain.es} hy={q.explain.hy} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Word Shooter
export function WordShooter({ level, add }: MgProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [target, setTarget] = useState(() => shuffle(VOCAB)[0]);
  const targetRef = useRef(target);
  targetRef.current = target;
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const words: { w: (typeof VOCAB)[number]; x: number; y: number; vx: number; vy: number }[] = [];
    let raf = 0;
    let last = performance.now();
    const spawn = () => {
      const t = targetRef.current;
      const pool = shuffle(VOCAB.filter((v) => v.es !== t.es)).slice(0, 3 + level);
      const set = shuffle([t, ...pool]);
      words.length = 0;
      set.forEach((w) => words.push({ w, x: 120 * devicePixelRatio + Math.random() * (c.width - 240 * devicePixelRatio), y: 50 * devicePixelRatio + Math.random() * (c.height - 100 * devicePixelRatio), vx: (Math.random() - 0.5) * (40 + level * 30), vy: (Math.random() - 0.5) * (40 + level * 30) }));
    };
    const resize = () => {
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
    };
    resize();
    spawn();
    let shots: { x: number; y: number; t: number }[] = [];
    const parts: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
    const stars = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.3, p: Math.random() * 6 }));
    const burst = (x: number, y: number, c: string) => {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (1 + Math.random() * 4) * devicePixelRatio;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c });
      }
    };
    (c as unknown as { __burst: typeof burst }).__burst = burst;
    const pill = (x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    };
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = devicePixelRatio;
      const bg = g.createLinearGradient(0, 0, 0, c.height);
      bg.addColorStop(0, '#0b0e1d');
      bg.addColorStop(1, '#1a0e12');
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      for (const st of stars) {
        g.globalAlpha = 0.35 + 0.35 * Math.sin(now * 0.002 + st.p);
        g.fillStyle = '#fff';
        g.fillRect(st.x * c.width, st.y * c.height, st.s * dpr, st.s * dpr);
      }
      g.globalAlpha = 1;
      g.font = `800 ${22 * dpr}px Inter, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const w of words) {
        w.x += w.vx * dt * dpr;
        w.y += w.vy * dt * dpr;
        if (w.x < 90 * dpr || w.x > c.width - 90 * dpr) w.vx *= -1;
        if (w.y < 30 * dpr || w.y > c.height - 60 * dpr) w.vy *= -1;
        const tw = g.measureText(w.w.es).width + 34 * dpr;
        const th = 42 * dpr;
        g.save();
        g.shadowColor = 'rgba(255,106,0,0.8)';
        g.shadowBlur = 18 * dpr;
        const gr = g.createLinearGradient(w.x - tw / 2, w.y - th / 2, w.x + tw / 2, w.y + th / 2);
        gr.addColorStop(0, 'rgba(255,106,0,0.35)');
        gr.addColorStop(1, 'rgba(255,60,120,0.25)');
        g.fillStyle = gr;
        pill(w.x - tw / 2, w.y - th / 2, tw, th, th / 2);
        g.fill();
        g.restore();
        g.strokeStyle = 'rgba(255,180,120,0.9)';
        g.lineWidth = 1.5 * dpr;
        pill(w.x - tw / 2, w.y - th / 2, tw, th, th / 2);
        g.stroke();
        g.fillStyle = '#fff';
        g.fillText(w.w.es, w.x, w.y + 1 * dpr);
      }
      // turret
      const tx = c.width / 2;
      const ty = c.height;
      g.fillStyle = '#ff6a00';
      g.beginPath();
      g.arc(tx, ty, 34 * dpr, Math.PI, 0);
      g.fill();
      shots = shots.filter((sh) => now - sh.t < 220);
      for (const sh of shots) {
        const k = 1 - (now - sh.t) / 220;
        g.save();
        g.shadowColor = '#ffd27a';
        g.shadowBlur = 20 * dpr;
        g.strokeStyle = `rgba(255,220,140,${k})`;
        g.lineWidth = 5 * dpr * k;
        g.beginPath();
        g.moveTo(tx, ty - 30 * dpr);
        g.lineTo(sh.x, sh.y);
        g.stroke();
        g.restore();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08 * dpr;
        p.life -= dt * 1.6;
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
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const click = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) * devicePixelRatio;
      const y = (e.clientY - r.top) * devicePixelRatio;
      shots.push({ x, y, t: performance.now() });
      g.font = `800 ${22 * devicePixelRatio}px Inter, sans-serif`;
      const hit = words.find((w) => Math.abs(x - w.x) < g.measureText(w.w.es).width / 2 + 18 * devicePixelRatio && Math.abs(y - w.y) < 24 * devicePixelRatio);
      if (!hit) return;
      const ok = hit.w.es === targetRef.current.es;
      burst(hit.x, hit.y, ok ? '#ffd24a' : '#ff4d4d');
      add(ok ? 10 : -4);
      speak(hit.w.es);
      recordAnswer(ok, { es: targetRef.current.es, hy: targetRef.current.hy, topic: 'deporte' });
      if (ok) {
        const n = shuffle(VOCAB)[0];
        setTarget(n);
        targetRef.current = n;
        spawn();
      }
    };
    c.addEventListener('pointerdown', click);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener('pointerdown', click);
      window.removeEventListener('resize', resize);
    };
  }, [level, add]);
  return (
    <>
      <div className="mg-top">
        <T es="Dispara a la palabra que significa:" hy="Կրակիր այն բառին, որը նշանակում է՝" />
        <span className="pill orange" style={{ fontSize: 18 }} lang="hy">
          {target.hy}
        </span>
      </div>
      <canvas ref={ref} className="mg-canvas" />
    </>
  );
}
