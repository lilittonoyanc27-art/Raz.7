import { useMemo, useState } from 'react';
import { T, TBadge, SpeakIcon } from '../../i18n/T';
import { UI } from '../../i18n/ui';
import { speak } from '../../i18n/speech';
import { shuffle } from '../../game/data/grammar';
import { PRODUCTS } from '../../game/data/products';
import { recordAnswer } from '../../game/state';
import type { MgProps } from './index';
import type { Tr } from '../../i18n/T';

const t = (es: string, hy: string): Tr => ({ es, hy });

// ---------------------------------------------------------------- Cooking
const RECIPES: { name: Tr; steps: { tr: Tr; a: string }[] }[] = [
  {
    name: t('Tortilla de patatas', 'Կարտոֆիլով ձվածեղ'),
    steps: [
      { tr: t('Pela y corta las patatas.', 'Մաքրիր և կտրատիր կարտոֆիլը։'), a: 'cuchillo' },
      { tr: t('Pon aceite en la sartén.', 'Յուղ լցրու տապակի մեջ։'), a: 'aceite' },
      { tr: t('Fríe las patatas a fuego medio.', 'Տապակիր կարտոֆիլը միջին կրակի վրա։'), a: 'fuego' },
      { tr: t('Bate los huevos en un bol.', 'Հարիր ձվերը ամանի մեջ։'), a: 'huevos' },
      { tr: t('Mezcla las patatas con los huevos.', 'Խառնիր կարտոֆիլը ձվերի հետ։'), a: 'cuchara' },
      { tr: t('Dale la vuelta con un plato.', 'Շուռ տուր ափսեի օգնությամբ։'), a: 'plato' },
    ],
  },
  {
    name: t('Paella valenciana', 'Վալենսիական պաելյա'),
    steps: [
      { tr: t('Calienta el aceite en la paellera.', 'Տաքացրու յուղը պաելյայի տապակում։'), a: 'aceite' },
      { tr: t('Añade el pollo y fríelo.', 'Ավելացրու հավը և տապակիր։'), a: 'pollo' },
      { tr: t('Corta los tomates y échalos.', 'Կտրատիր լոլիկները և ավելացրու։'), a: 'cuchillo' },
      { tr: t('Añade el agua.', 'Ավելացրու ջուրը։'), a: 'agua' },
      { tr: t('Echa el arroz.', 'Լցրու բրինձը։'), a: 'arroz' },
      { tr: t('Espera veinte minutos sin remover.', 'Սպասիր քսան րոպե՝ առանց խառնելու։'), a: 'reloj' },
    ],
  },
  {
    name: t('Batido de plátano', 'Բանանով կոկտեյլ'),
    steps: [
      { tr: t('Pela el plátano.', 'Մաքրիր բանանը։'), a: 'plátano' },
      { tr: t('Pon la leche en la batidora.', 'Կաթը լցրու հարիչի մեջ։'), a: 'leche' },
      { tr: t('Añade una cucharada de miel.', 'Ավելացրու մեկ գդալ մեղր։'), a: 'cuchara' },
      { tr: t('Bate todo durante un minuto.', 'Հարիր ամեն ինչ մեկ րոպե։'), a: 'batidora' },
      { tr: t('Sírvelo en un vaso.', 'Մատուցիր բաժակով։'), a: 'vaso' },
    ],
  },
];
const TOOLS: { id: string; hy: string; es: string }[] = [
  { id: 'cuchillo', es: 'cuchillo', hy: 'դանակ' },
  { id: 'aceite', es: 'aceite', hy: 'յուղ' },
  { id: 'fuego', es: 'fuego', hy: 'կրակ' },
  { id: 'huevos', es: 'huevos', hy: 'ձվեր' },
  { id: 'cuchara', es: 'cuchara', hy: 'գդալ' },
  { id: 'plato', es: 'plato', hy: 'ափսե' },
  { id: 'pollo', es: 'pollo', hy: 'հավ' },
  { id: 'agua', es: 'agua', hy: 'ջուր' },
  { id: 'arroz', es: 'arroz', hy: 'բրինձ' },
  { id: 'reloj', es: 'reloj', hy: 'ժամացույց' },
  { id: 'plátano', es: 'plátano', hy: 'բանան' },
  { id: 'leche', es: 'leche', hy: 'կաթ' },
  { id: 'batidora', es: 'batidora', hy: 'հարիչ' },
  { id: 'vaso', es: 'vaso', hy: 'բաժակ' },
];
export function Cooking({ level, add, end }: MgProps) {
  const [r, setR] = useState(() => Math.floor(Math.random() * RECIPES.length));
  const [i, setI] = useState(0);
  const [fb, setFb] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const rec = RECIPES[r];
  const st = rec.steps[i];
  const tools = useMemo(() => shuffle(TOOLS), [r, i]);
  const pick = (id: string) => {
    const ok = id === st.a;
    recordAnswer(ok, { es: st.tr.es, hy: st.tr.hy, topic: 'imperativo' });
    add(ok ? 10 : -4);
    setFb(ok ? '✓' : '✗');
    if (!ok) return;
    if (i + 1 >= rec.steps.length) {
      add(30);
      const d = done + 1;
      setDone(d);
      if (d >= 1 + level) return end();
      setR((r + 1) % RECIPES.length);
      setI(0);
    } else setI(i + 1);
  };
  return (
    <div>
      <div className="kicker">
        <T es="Receta" hy="Բաղադրատոմս" />: <T {...rec.name} />
      </div>
      <div className="bubble" style={{ margin: '10px 0' }}>
        <span className="pill orange" style={{ marginRight: 8 }}>
          {i + 1}/{rec.steps.length}
        </span>
        <T {...st.tr} />
        <button className="btn sm" style={{ marginLeft: 10 }} onClick={() => speak(st.tr.es)}>
<SpeakIcon />
        </button>
      </div>
      <p className="small muted">
        <T es="Elige lo que necesitas para este paso:" hy="Ընտրիր այն, ինչ պետք է այս քայլի համար՝" /> {fb}
      </p>
      <div className="cards-grid">
        {tools.map((x) => (
          <button key={x.id} className="mcard" onClick={() => pick(x.id)}>
            <span>
              {level === 2 ? x.hy : x.es}
              {level < 2 && <TBadge es={x.es} hy={x.hy} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Escape room
const ROOM_OBJ = [
  { id: 'cuadro', es: 'el cuadro', hy: 'նկարը' },
  { id: 'alfombra', es: 'la alfombra', hy: 'գորգը' },
  { id: 'cajon', es: 'el cajón', hy: 'դարակը' },
  { id: 'libro', es: 'el libro rojo', hy: 'կարմիր գիրքը' },
  { id: 'planta', es: 'la planta', hy: 'բույսը' },
  { id: 'lampara', es: 'la lámpara', hy: 'լամպը' },
  { id: 'reloj', es: 'el reloj', hy: 'ժամացույցը' },
  { id: 'balon', es: 'el balón', hy: 'գնդակը' },
];
const STAGES = [
  { clue: t('La primera pista está debajo de la alfombra.', 'Առաջին հուշումը գորգի տակ է։'), a: 'alfombra', found: t('Has encontrado una nota: «Mira detrás del cuadro».', 'Գտար գրություն՝ «Նայիր նկարի հետևում»։') },
  { clue: t('Mira detrás del cuadro.', 'Նայիր նկարի հետևում։'), a: 'cuadro', found: t('Hay un número: el número de jugadores de un equipo de fútbol.', 'Այնտեղ թիվ կա՝ ֆուտբոլային թիմի խաղացողների քանակը։') },
  { clue: t('Escribe el código: ¿cuántos jugadores hay en un equipo de fútbol?', 'Գրիր ծածկագիրը՝ քանի՞ խաղացող կա ֆուտբոլային թիմում։'), a: 'code:11', found: t('¡El cajón se abre! Dentro hay un mapa.', 'Դարակը բացվում է։ Ներսում քարտեզ կա։') },
  { clue: t('El mapa dice: «La llave está dentro del libro rojo».', 'Քարտեզում գրված է՝ «Բանալին կարմիր գրքի մեջ է»։'), a: 'libro', found: t('¡Tienes la llave! Ahora abre la puerta.', 'Բանալին քոնն է։ Հիմա բացիր դուռը։') },
  { clue: t('Usa la llave en la puerta para salir.', 'Օգտագործիր բանալին դռան վրա՝ դուրս գալու համար։'), a: 'puerta', found: t('¡Has salido de la habitación!', 'Դուրս եկար սենյակից։') },
];
export function Escape({ add, end }: MgProps) {
  const [s, setS] = useState(0);
  const [msg, setMsg] = useState<Tr | null>(null);
  const [code, setCode] = useState('');
  const st = STAGES[s];
  const tryObj = (id: string) => {
    if (st.a === id) {
      add(25);
      setMsg(st.found);
      speak(st.found.es);
      if (s + 1 >= STAGES.length) setTimeout(end, 1500);
      else setS(s + 1);
    } else {
      add(-2);
      setMsg(t('Aquí no hay nada.', 'Այստեղ ոչինչ չկա։'));
    }
  };
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div className="hint">
          <T {...st.clue} />
        </div>
        {msg && (
          <div className="feedback ok">
            <T {...msg} />
          </div>
        )}
        {st.a.startsWith('code:') && (
          <div className="row" style={{ marginTop: 10 }}>
            <input className="text-in" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Código" />
            <button className="btn primary" onClick={() => (plainNum(code) === st.a.slice(5) ? tryObj(st.a) : (add(-3), setMsg(t('El código no es correcto.', 'Ծածկագիրը ճիշտ չէ։'))))}>
              {UI.check.es} <TBadge {...UI.check} />
            </button>
          </div>
        )}
      </div>
      <div className="cards-grid" style={{ flex: 1.2, minWidth: 300 }}>
        {[...ROOM_OBJ, { id: 'puerta', es: 'la puerta', hy: 'դուռը' }].map((o) => (
          <button key={o.id} className="mcard" onClick={() => tryObj(o.id)}>
            <span>
              {o.es} <TBadge es={o.es} hy={o.hy} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
const plainNum = (s: string) => {
  const w: Record<string, string> = { once: '11', 'once.': '11' };
  return w[s.trim().toLowerCase()] ?? s.trim();
};

// ---------------------------------------------------------------- Detective
const CASES: { title: Tr; intro: Tr; suspects: { name: string; said: Tr }[]; clue: Tr; culprit: number; why: Tr }[] = [
  {
    title: t('El balón desaparecido', 'Անհետացած գնդակը'),
    intro: t('Ayer por la tarde alguien se llevó el balón de la final del vestuario.', 'Երեկ երեկոյան ինչ-որ մեկը հանդերձարանից տարավ եզրափակչի գնդակը։'),
    suspects: [
      { name: 'Hugo', said: t('Yo estaba en el cine con mi madre toda la tarde.', 'Ես ամբողջ երեկո մայրիկիս հետ կինոյում էի։') },
      { name: 'Marta', said: t('Fui al gimnasio a las cinco y volví a las ocho.', 'Ժամը հինգին գնացի մարզասրահ և վերադարձա ութին։') },
      { name: 'Iker', said: t('Estaba entrenando solo en el vestuario.', 'Մենակ մարզվում էի հանդերձարանում։') },
    ],
    clue: t('Pista: el gimnasio estaba cerrado ayer.', 'Հուշում՝ մարզասրահը երեկ փակ էր։'),
    culprit: 1,
    why: t('Marta mintió: dijo que fue al gimnasio, pero estaba cerrado.', 'Մարտան ստեց՝ ասաց, որ գնացել է մարզասրահ, բայց այն փակ էր։'),
  },
  {
    title: t('La tarta de cumpleaños', 'Ծննդյան տորթը'),
    intro: t('Alguien se ha comido la tarta de cumpleaños de RAZ antes de la fiesta.', 'Ինչ-որ մեկը կերել է ՌԱԶ-ի ծննդյան տորթը տոնից առաջ։'),
    suspects: [
      { name: 'Marco', said: t('No he comido nada. ¡No me gusta el chocolate!', 'Ոչինչ չեմ կերել։ Շոկոլադ չեմ սիրում։') },
      { name: 'Laura', said: t('He estado en la playa toda la mañana.', 'Ամբողջ առավոտ լողափում եմ եղել։') },
      { name: 'Paco', said: t('Estaba durmiendo en el sofá.', 'Քնած էի բազմոցին։') },
    ],
    clue: t('Pista: hay chocolate en la camiseta de Marco.', 'Հուշում՝ Մարկոյի մարզաշապիկի վրա շոկոլադ կա։'),
    culprit: 0,
    why: t('Marco dijo que no le gusta el chocolate, pero tenía chocolate en la camiseta.', 'Մարկոն ասաց, որ շոկոլադ չի սիրում, բայց նրա մարզաշապիկին շոկոլադ կար։'),
  },
  {
    title: t('La bicicleta en el parque', 'Հեծանիվը այգում'),
    intro: t('La bicicleta de Don Manuel apareció en el parque, pero él la había dejado en casa.', 'Դոն Մանուելի հեծանիվը հայտնվեց այգում, բայց նա այն թողել էր տանը։'),
    suspects: [
      { name: 'Álex', said: t('Yo nunca voy en bicicleta, siempre voy andando.', 'Ես երբեք հեծանիվ չեմ քշում, միշտ ոտքով եմ գնում։') },
      { name: 'Ana', said: t('Por la mañana trabajé en el estadio.', 'Առավոտյան աշխատեցի մարզադաշտում։') },
      { name: 'Hugo', said: t('Fui al parque en autobús.', 'Այգի գնացի ավտոբուսով։') },
    ],
    clue: t('Pista: hoy no hay autobuses porque hay huelga.', 'Հուշում՝ այսօր ավտոբուսներ չկան, քանի որ գործադուլ է։'),
    culprit: 2,
    why: t('Hugo dijo que fue en autobús, pero hoy no hay autobuses.', 'Ուգոն ասաց, որ գնացել է ավտոբուսով, բայց այսօր ավտոբուսներ չկան։'),
  },
];
export function Detective({ add, end }: MgProps) {
  const order = useMemo(() => shuffle(CASES.map((_, i) => i)), []);
  const [k, setK] = useState(0);
  const [showClue, setShowClue] = useState(false);
  const [res, setRes] = useState<null | boolean>(null);
  const c = CASES[order[k]];
  const accuse = (i: number) => {
    const ok = i === c.culprit;
    setRes(ok);
    add(ok ? (showClue ? 30 : 50) : -10);
    recordAnswer(ok, { es: c.why.es, hy: c.why.hy, topic: 'indefinido' });
  };
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <h3>
        <T {...c.title} />
      </h3>
      <p>
        <T {...c.intro} />
      </p>
      <div className="grid c3">
        {c.suspects.map((s, i) => (
          <div key={s.name} className="card">
            <b>{s.name}</b>
            <p className="small">
              «<T {...s.said} />»
            </p>
            <button className="btn sm" onClick={() => speak(s.said.es)}>
<SpeakIcon />
            </button>{' '}
            <button className="btn sm primary" disabled={res !== null} onClick={() => accuse(i)}>
              <T es="¡Es culpable!" hy="Նա է մեղավորը։" />
            </button>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {!showClue ? (
          <button className="btn" onClick={() => setShowClue(true)}>
            <T es="Ver una pista (menos puntos)" hy="Տեսնել հուշում (ավելի քիչ միավոր)" />
          </button>
        ) : (
          <div className="hint">
            <T {...c.clue} />
          </div>
        )}
      </div>
      {res !== null && (
        <div className={'feedback ' + (res ? 'ok' : 'no')}>
          <T {...(res ? UI.correct : UI.wrong)} /> <T {...c.why} />
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="btn primary sm"
              onClick={() => {
                if (k + 1 >= CASES.length) end();
                else {
                  setK(k + 1);
                  setRes(null);
                  setShowClue(false);
                }
              }}
            >
              {UI.continueBtn.es} <TBadge {...UI.continueBtn} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Supermarket challenge
export function SupermarketChallenge({ level, add, end }: MgProps) {
  const [list, setList] = useState(() => shuffle(PRODUCTS).slice(0, 4 + level));
  const [got, setGot] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const tiles = useMemo(() => shuffle(PRODUCTS).slice(0, 12).concat(list).filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i), [list]);
  const shuffled = useMemo(() => shuffle(tiles), [tiles]);
  const pick = (id: string) => {
    if (got.includes(id)) return;
    const ok = list.some((p) => p.id === id);
    add(ok ? 10 : -5);
    const p = PRODUCTS.find((x) => x.id === id)!;
    recordAnswer(ok, { es: p.name.es, hy: p.name.hy, topic: 'deporte' });
    if (!ok) return;
    const ng = [...got, id];
    setGot(ng);
    if (list.every((x) => ng.includes(x.id))) {
      add(25);
      if (round >= 2) return end();
      setRound(round + 1);
      setGot([]);
      setList(shuffle(PRODUCTS).slice(0, 4 + level));
    }
  };
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
      <div className="card" style={{ minWidth: 240 }}>
        <div className="kicker">
          <T es="Lista de la compra" hy="Գնումների ցուցակ" /> · {round + 1}/3
        </div>
        <ul style={{ paddingLeft: 18 }}>
          {list.map((p) => (
            <li key={p.id} style={{ textDecoration: got.includes(p.id) ? 'line-through' : undefined, margin: '6px 0' }}>
              <T es={p.name.es} hy={p.name.hy} />
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
        <p className="small muted">
          <T es="Los productos están en armenio. Elige los de la lista." hy="Ապրանքները հայերեն են։ Ընտրիր ցուցակում եղածները։" />
        </p>
        <div className="cards-grid">
          {shuffled.map((p) => (
            <button key={p.id} className={'mcard' + (got.includes(p.id) ? ' matched' : '')} onClick={() => pick(p.id)} lang="hy" style={{ borderBottom: `4px solid ${p.color}` }}>
              {p.name.hy}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Airport challenge
const DEST = [
  { es: 'Madrid', hy: 'Մադրիդ' },
  { es: 'Barcelona', hy: 'Բարսելոնա' },
  { es: 'Sevilla', hy: 'Սևիլյա' },
  { es: 'Bilbao', hy: 'Բիլբաո' },
  { es: 'Málaga', hy: 'Մալագա' },
  { es: 'Santander', hy: 'Սանտանդեր' },
  { es: 'Valencia', hy: 'Վալենսիա' },
];
const HOURS = [
  ['las ocho', '08:00', 'ութին'],
  ['las nueve y media', '09:30', 'ինն անց կեսին'],
  ['las diez y cuarto', '10:15', 'տասն անց տասնհինգին'],
  ['las once menos cuarto', '10:45', 'տասնմեկից տասնհինգ պակասին'],
  ['las doce', '12:00', 'տասներկուսին'],
  ['la una y veinte', '13:20', 'մեկն անց քսանին'],
  ['las tres', '15:00', 'երեքին'],
];
export function AirportChallenge({ level, add }: MgProps) {
  const make = () => {
    const flights = shuffle(DEST)
      .slice(0, 5)
      .map((d, i) => ({ d, h: HOURS[(i * 3 + Math.floor(Math.random() * 7)) % HOURS.length], gate: String.fromCharCode(65 + Math.floor(Math.random() * 3)) + (1 + Math.floor(Math.random() * 15)), code: 'RZ' + (700 + Math.floor(Math.random() * 99)) }));
    const target = flights[Math.floor(Math.random() * flights.length)];
    return { flights, target };
  };
  const [st, setSt] = useState(make);
  const [fb, setFb] = useState('');
  const tr = level === 0 ? t(`Tu vuelo va a ${st.target.d.es}.`, `Քո չվերթը դեպի ${st.target.d.hy} է։`) : t(`Tu vuelo a ${st.target.d.es} sale a ${st.target.h[0]}. ¿Cuál es tu puerta?`, `Քո չվերթը դեպի ${st.target.d.hy} մեկնում է ժամը ${st.target.h[2]}։ Ո՞րն է քո դարպասը։`);
  const pick = (gate: string) => {
    const ok = gate === st.target.gate;
    add(ok ? 15 : -5);
    setFb(ok ? '✓' : '✗');
    recordAnswer(ok, { es: tr.es, hy: tr.hy, topic: 'deporte' });
    if (ok) {
      const n = make();
      setSt(n);
    }
  };
  return (
    <div>
      <div className="row">
        <div className="hint">
          {level === 2 ? <span>…</span> : <T {...tr} />}
        </div>
        <button className="btn sm" onClick={() => speak(tr.es)}>
          {UI.listenAgain.es} <TBadge {...UI.listenAgain} />
        </button>
        <span>{fb}</span>
      </div>
      <div className="card" style={{ marginTop: 14, background: '#0b1020', fontFamily: 'monospace' }}>
        <div className="row between" style={{ color: '#ffd24a', fontWeight: 900 }}>
          <span>VUELO</span>
          <span>DESTINO</span>
          <span>HORA</span>
          <span>PUERTA</span>
        </div>
        {st.flights.map((f) => (
          <button key={f.code} className="row between answer" style={{ width: '100%', color: '#ffd24a', fontFamily: 'monospace' }} onClick={() => pick(f.gate)}>
            <span>{f.code}</span>
            <span>{f.d.es.toUpperCase()}</span>
            <span>{f.h[1]}</span>
            <span>{f.gate}</span>
          </button>
        ))}
      </div>
      <p className="small muted">
        <T es="Haz clic en el vuelo correcto para ir a su puerta." hy="Սեղմիր ճիշտ չվերթի վրա՝ նրա դարպասին գնալու համար։" />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- Football manager
const MOMENTS: { q: Tr; opts: { tr: Tr; good: number }[] }[] = [
  { q: t('Minuto 10. El rival presiona mucho. ¿Qué haces?', '10-րդ րոպե։ Մրցակիցը շատ է ճնշում։ Ի՞նչ ես անում։'), opts: [{ tr: t('Pedir pases cortos y tener el balón.', 'Խնդրել կարճ փոխանցումներ և պահել գնդակը։'), good: 1 }, { tr: t('Atacar con todos los jugadores.', 'Գրոհել բոլոր խաղացողներով։'), good: -1 }, { tr: t('Cambiar al portero.', 'Փոխել դարպասապահին։'), good: 0 }] },
  { q: t('Minuto 35. Tu delantero está muy cansado.', '35-րդ րոպե։ Քո հարձակվողը շատ հոգնած է։'), opts: [{ tr: t('Hacer un cambio: sale el delantero cansado.', 'Փոխարինում անել՝ հոգնած հարձակվողը դուրս է գալիս։'), good: 1 }, { tr: t('No hacer nada.', 'Ոչինչ չանել։'), good: -1 }, { tr: t('Gritar al árbitro.', 'Գոռալ մրցավարի վրա։'), good: -1 }] },
  { q: t('Descanso. Vais empatando. ¿Qué dices al equipo?', 'Ընդմիջում։ Ոչ-ոքի եք։ Ի՞նչ ես ասում թիմին։'), opts: [{ tr: t('¡Confiad en vuestros compañeros y buscad espacios libres!', 'Վստահեք թիմակիցներին և փնտրեք ազատ տարածություններ։'), good: 1 }, { tr: t('¡Jugad cada uno solo!', 'Ամեն մեկդ մենակ խաղացեք։'), good: -1 }, { tr: t('Vamos a dormir.', 'Գնանք քնելու։'), good: -1 }] },
  { q: t('Minuto 70. Tenéis un córner a favor.', '70-րդ րոպե։ Ձեր օգտին անկյունային է։'), opts: [{ tr: t('Los defensas altos suben a rematar.', 'Բարձրահասակ պաշտպանները բարձրանում են հարվածելու։'), good: 1 }, { tr: t('Todos se quedan atrás.', 'Բոլորը մնում են հետևում։'), good: 0 }, { tr: t('El portero chuta el córner.', 'Դարպասապահը խփում է անկյունայինը։'), good: -1 }] },
  { q: t('Minuto 88. Vais ganando por un gol.', '88-րդ րոպե։ Մեկ գոլով առաջ եք։'), opts: [{ tr: t('Defender la posición y no perder la concentración.', 'Պաշտպանել դիրքը և չկորցնել կենտրոնացումը։'), good: 1 }, { tr: t('Atacar sin defensa.', 'Գրոհել առանց պաշտպանության։'), good: -1 }, { tr: t('Celebrar antes de tiempo.', 'Տոնել ժամանակից շուտ։'), good: -1 }] },
];
export function Manager({ add, end }: MgProps) {
  const [i, setI] = useState(0);
  const [us, setUs] = useState(0);
  const [them, setThem] = useState(0);
  const [log, setLog] = useState<Tr[]>([]);
  const m = MOMENTS[i];
  const opts = useMemo(() => shuffle(m?.opts ?? []), [m]);
  const choose = (good: number, tr: Tr) => {
    const r = Math.random();
    let ev: Tr;
    if (good > 0 && r < 0.6) {
      setUs((x) => x + 1);
      ev = t('¡Gol de tu equipo! La táctica ha funcionado.', 'Գոլ քո թիմից։ Մարտավարությունն աշխատեց։');
      add(25);
    } else if (good < 0 && r < 0.6) {
      setThem((x) => x + 1);
      ev = t('¡Gol del rival! Esa decisión no fue buena.', 'Մրցակցի գոլը։ Այդ որոշումը լավը չէր։');
      add(-5);
    } else {
      ev = t('El partido sigue sin goles en esta jugada.', 'Խաղը շարունակվում է առանց գոլի այս դրվագում։');
      add(good > 0 ? 10 : 0);
    }
    recordAnswer(good > 0, { es: tr.es, hy: tr.hy, topic: 'deporte' });
    setLog((l) => [ev, ...l]);
    speak(ev.es);
    if (i + 1 >= MOMENTS.length) setTimeout(end, 1800);
    else setI(i + 1);
  };
  return (
    <div className="row" style={{ gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <div className="scoreboard" style={{ position: 'static', transform: 'none', display: 'inline-flex' }}>
          <span className="pill orange">RAZ 7 FC</span>
          <span className="sc">
            {us} – {them}
          </span>
          <span className="pill">Rival</span>
        </div>
        {m && (
          <>
            <div className="bubble" style={{ margin: '14px 0' }}>
              <T {...m.q} />
            </div>
            <div className="answers">
              {opts.map((o) => (
                <button key={o.tr.es} className="answer" onClick={() => choose(o.good, o.tr)}>
                  {o.tr.es} <TBadge {...o.tr} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="card" style={{ minWidth: 260, flex: 0.8 }}>
        <div className="kicker">
          <T es="Comentarios del partido" hy="Խաղի մեկնաբանություններ" />
        </div>
        {log.map((l, k) => (
          <p key={k} className="small">
            <T {...l} />
          </p>
        ))}
      </div>
    </div>
  );
}
