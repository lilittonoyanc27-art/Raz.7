// Conversation panel with four modes: choice, build (compose answer from
// words), listen (audio first) and order (arrange dialogue lines).
import { useEffect, useMemo, useState } from 'react';
import { T, TBadge, SpeakIcon } from '../i18n/T';
import { UI } from '../i18n/ui';
import { speak, stopSpeaking } from '../i18n/speech';
import { npcById, type Exchange } from '../game/data/npcs';
import { shuffle } from '../game/data/grammar';
import { recordAnswer, game, reward, checkAchievements } from '../game/state';
import { settings } from '../game/settings';
import { sfx } from '../game/world/Audio';
import type { Tr } from '../i18n/T';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:«»"—–-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** hide translations that would reveal the answer ("(սխալ)") */
const optHy = (hy: string) => (hy.trim().startsWith('(') ? undefined : hy);

const DISTRACTORS = ['muy', 'mucho', 'es', 'está', 'por', 'para', 'el', 'la', 'un', 'una', 'ayer', 'mañana', 'tengo', 'hay', 'soy'];

export function DialogPanel({ npcId, title, greet: greetOverride, exchanges, outro, onDone, onClose }: { npcId: string; title?: Tr; greet?: Tr; exchanges: Exchange[]; outro?: Tr; onDone?: (ok: number, total: number) => void; onClose: () => void }) {
  const def = npcById(npcId);
  const [i, setI] = useState(-1); // -1 = greeting
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const voice = def?.voice ?? { pitch: 1, rate: 1, voice: 0 };
  const say = (text: string, slow = false) => speak(text, { ...voice, slow });
  const greet = greetOverride ?? def?.greeting ?? { es: '¡Hola!', hy: 'Բարև։' };

  useEffect(() => {
    if (settings.get().autoSpeak && i === -1) say(greet.es);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = (ok: boolean) => {
    if (ok) setScore((s) => s + 1);
    if (i + 1 >= exchanges.length) {
      setFinished(true);
      game.set((s) => ({ dialogsDone: s.dialogsDone + 1 }));
      reward(15, 3);
      checkAchievements();
      if (outro && settings.get().autoSpeak) say(outro.es);
    } else setI(i + 1);
  };

  const ex = i >= 0 ? exchanges[i] : null;
  const initials = (def?.name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <div className="modal dialog" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div className="speaker" style={{ margin: 0 }}>
          <div className="avatar" style={{ background: def?.look.shirt ?? '#ff6a00' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{def?.name ?? npcId}</div>
            {def && <T es={def.role.es} hy={def.role.hy} className="small muted" />}
            {title && (
              <div className="small">
                <T es={title.es} hy={title.hy} />
              </div>
            )}
          </div>
        </div>
        <div className="row">
          {exchanges.length > 0 && !finished && i >= 0 && (
            <span className="pill">
              {i + 1}/{exchanges.length}
            </span>
          )}
          <button className="btn sm ghost" onClick={onClose}>
            {UI.close.es} <TBadge {...UI.close} />
          </button>
        </div>
      </div>

      {i === -1 && (
        <>
          <Bubble tr={greet} onSpeak={(s) => say(greet.es, s)} />
          <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
            {exchanges.length ? (
              <button className="btn primary" onClick={() => { setI(0); if (settings.get().autoSpeak && exchanges[0].mode !== 'listen') say(exchanges[0].npc.es); }}>
                {UI.continueBtn.es} <TBadge {...UI.continueBtn} />
              </button>
            ) : (
              <button className="btn primary" onClick={onClose}>
                {UI.close.es} <TBadge {...UI.close} />
              </button>
            )}
          </div>
        </>
      )}

      {ex && !finished && <ExchangeView key={i} ex={ex} say={say} onNext={next} />}

      {finished && (
        <>
          {outro && <Bubble tr={outro} onSpeak={(s) => say(outro.es, s)} />}
          <div className="feedback ok">
            <T es={`¡Conversación terminada! Respuestas correctas: ${score}/${exchanges.length}`} hy={`Զրույցն ավարտվեց։ Ճիշտ պատասխաններ՝ ${score}/${exchanges.length}`} />
          </div>
          <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
            <button
              className="btn primary"
              onClick={() => {
                onDone?.(score, exchanges.length);
                onClose();
              }}
            >
              {UI.continueBtn.es} <TBadge {...UI.continueBtn} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Bubble({ tr, hidden, onSpeak }: { tr: Tr; hidden?: boolean; onSpeak: (slow: boolean) => void }) {
  return (
    <div className="speaker" style={{ alignItems: 'flex-start' }}>
      <div className="bubble" style={{ flex: 1 }}>
        {hidden ? <span style={{ letterSpacing: 4, color: '#999' }}>• • • • • • •</span> : <T es={tr.es} hy={tr.hy} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="icon-btn" title="Escuchar" onClick={() => onSpeak(false)}>
          <SpeakIcon />
        </button>
        <button className="icon-btn" title="Despacio" onClick={() => onSpeak(true)} style={{ fontSize: 10, fontWeight: 900 }}>
          0.6×
        </button>
      </div>
    </div>
  );
}

function ExchangeView({ ex, say, onNext }: { ex: Exchange; say: (t: string, slow?: boolean) => void; onNext: (ok: boolean) => void }) {
  const [reveal, setReveal] = useState(ex.mode !== 'listen');
  // listening questions are read aloud automatically
  useEffect(() => {
    if (ex.mode !== 'listen') return;
    const id = setTimeout(() => say(ex.npc.es), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex]);
  const [result, setResult] = useState<null | { ok: boolean; correct: string; correctHy?: string }>(null);
  const topic = ex.topic ?? 'conversación';

  const finish = (ok: boolean, correct: Tr) => {
    setResult({ ok, correct: correct.es, correctHy: correct.hy });
    setReveal(true);
    recordAnswer(ok, { es: correct.es, hy: correct.hy, topic, explain: ex.explain?.es });
    if (ok) {
      sfx.ok();
      if (ex.reply && settings.get().autoSpeak) setTimeout(() => say(ex.reply!.es), 300);
    } else sfx.bad();
  };

  return (
    <>
      <Bubble tr={ex.npc} hidden={!reveal} onSpeak={(s) => say(ex.npc.es, s)} />
      {ex.mode === 'listen' && !reveal && (
        <div className="row small muted wrap" style={{ marginTop: 6, gap: 8 }}>
          <T es={UI.listenQuestion.es} hy={UI.listenQuestion.hy} />
          <button className="btn sm primary" onClick={() => say(ex.npc.es)}>
            <SpeakIcon /> {UI.listenAgain.es} <TBadge {...UI.listenAgain} />
          </button>
          <button className="btn sm" onClick={() => say(ex.npc.es, true)}>
            <SpeakIcon slow /> {UI.listenSlow.es} <TBadge {...UI.listenSlow} />
          </button>
          {!ex.audioOnly && (
            <button className="btn sm ghost" onClick={() => setReveal(true)}>
              {UI.showText.es} <TBadge {...UI.showText} />
            </button>
          )}
        </div>
      )}
      {(ex.mode === 'choice' || ex.mode === 'listen') && <Choice ex={ex} disabled={!!result} onPick={(ok, correct) => finish(ok, correct)} />}
      {ex.mode === 'build' && <Build ex={ex} disabled={!!result} onCheck={(ok) => finish(ok, ex.answer!)} />}
      {ex.mode === 'order' && <Order ex={ex} disabled={!!result} onCheck={(ok) => finish(ok, { es: ex.lines!.map((l) => l.es).join(' '), hy: ex.lines!.map((l) => l.hy).join(' ') })} />}
      {result && (
        <div className={'feedback ' + (result.ok ? 'ok' : 'no')}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>{result.ok ? <T {...UI.correct} /> : <T {...UI.wrong} />}</div>
          {!result.ok && (
            <>
              <div className="small muted">
                <T {...UI.rightAnswer} />
              </div>
              <div style={{ fontWeight: 700 }}>
                <T es={result.correct} hy={result.correctHy} />
              </div>
              {result.correctHy && (
                <div className="hy" style={{ color: '#ffb36b', marginTop: 2 }}>
                  {result.correctHy}
                </div>
              )}
            </>
          )}
          {ex.explain && (
            <div style={{ marginTop: 8 }} className="small">
              <T es={ex.explain.es} hy={ex.explain.hy} />
              {!result.ok && (
                <div className="hy muted" style={{ marginTop: 2 }}>
                  {ex.explain.hy}
                </div>
              )}
            </div>
          )}
          {result.ok && ex.reply && (
            <div style={{ marginTop: 6 }}>
              <T es={ex.reply.es} hy={ex.reply.hy} />
            </div>
          )}
          <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={() => onNext(result.ok)}>
              {UI.continueBtn.es} <TBadge {...UI.continueBtn} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Choice({ ex, disabled, onPick }: { ex: Exchange; disabled: boolean; onPick: (ok: boolean, correct: Tr) => void }) {
  const opts = useMemo(() => shuffle(ex.options ?? []), [ex]);
  const [picked, setPicked] = useState<number | null>(null);
  const correct = opts.find((o) => o.ok)!;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!disabled && n >= 1 && n <= opts.length) {
        setPicked(n - 1);
        onPick(opts[n - 1].ok, correct);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [opts, disabled, correct, onPick]);
  return (
    <div className="answers">
      <div className="small muted">
        <T {...UI.chooseAnswer} />
      </div>
      {opts.map((o, k) => (
        <button
          key={k}
          className={'answer' + (picked !== null ? (o.ok ? ' ok' : picked === k ? ' no' : '') : '')}
          disabled={disabled}
          onClick={() => {
            setPicked(k);
            onPick(o.ok, correct);
          }}
        >
          <span className="row">
            <span className="key" style={{ boxShadow: 'none' }}>
              {k + 1}
            </span>
            {o.es}
          </span>
          <TBadge es={o.es} hy={optHy(o.hy) ?? ''} />
        </button>
      ))}
    </div>
  );
}

function Build({ ex, disabled, onCheck }: { ex: Exchange; disabled: boolean; onCheck: (ok: boolean) => void }) {
  const words = useMemo(() => ex.answer!.es.replace(/[¿?¡!.,]/g, '').split(/\s+/).filter(Boolean), [ex]);
  const pool = useMemo(() => {
    const extra = shuffle((ex.chips ?? DISTRACTORS).filter((d) => !words.map((w) => w.toLowerCase()).includes(d))).slice(0, ex.chips ? 3 : 2);
    return shuffle([...words, ...extra]).map((w, i) => ({ w, i }));
  }, [words, ex.chips]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const sentence = placed.map((i) => pool[i].w).join(' ');
  const check = () => {
    const attempt = typed.trim() ? typed : sentence;
    onCheck(norm(attempt) === norm(ex.answer!.es));
  };
  return (
    <div className="answers">
      <div className="small muted">
        <T {...UI.buildAnswer} />
      </div>
      <div className="chips">
        {placed.map((pi, k) => (
          <button key={k} className="chip placed" disabled={disabled} onClick={() => setPlaced(placed.filter((_, j) => j !== k))}>
            {pool[pi].w}
          </button>
        ))}
      </div>
      <div className="chips" style={{ borderStyle: 'solid' }}>
        {pool.map((p, k) =>
          placed.includes(k) ? null : (
            <button key={k} className="chip" disabled={disabled} onClick={() => setPlaced([...placed, k])}>
              {p.w}
            </button>
          ),
        )}
      </div>
      <input
        className="text-in"
        placeholder="… o escribe tu respuesta aquí"
        value={typed}
        disabled={disabled}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') check();
        }}
      />
      <div className="row">
        <button className="btn primary" disabled={disabled || (!placed.length && !typed.trim())} onClick={check}>
          {UI.check.es} <TBadge {...UI.check} />
        </button>
        <button className="btn ghost" disabled={disabled} onClick={() => { setPlaced([]); setTyped(''); }}>
          {UI.clear.es} <TBadge {...UI.clear} />
        </button>
      </div>
    </div>
  );
}

function Order({ ex, disabled, onCheck }: { ex: Exchange; disabled: boolean; onCheck: (ok: boolean) => void }) {
  const lines = ex.lines!;
  const shuffled = useMemo(() => {
    let s = shuffle(lines.map((l, i) => ({ ...l, i })));
    if (s.every((x, k) => x.i === k)) s = [...s.slice(1), s[0]];
    return s;
  }, [lines]);
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <div className="answers">
      <div className="small muted">
        <T {...UI.orderDialog} />
      </div>
      {picked.map((k, n) => (
        <div key={k} className="order-line">
          <span className="num">{n + 1}</span>
          <T es={shuffled[k].es} hy={shuffled[k].hy} />
        </div>
      ))}
      {shuffled.map((l, k) =>
        picked.includes(k) ? null : (
          <button key={k} className="answer" disabled={disabled} onClick={() => setPicked([...picked, k])}>
            {l.es}
            <TBadge es={l.es} hy={l.hy} />
          </button>
        ),
      )}
      <div className="row">
        <button className="btn primary" disabled={disabled || picked.length < lines.length} onClick={() => onCheck(picked.every((k, n) => shuffled[k].i === n))}>
          {UI.check.es} <TBadge {...UI.check} />
        </button>
        <button className="btn ghost" disabled={disabled} onClick={() => setPicked([])}>
          {UI.clear.es} <TBadge {...UI.clear} />
        </button>
      </div>
    </div>
  );
}
