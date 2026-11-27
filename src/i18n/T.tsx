// Unified clickable-Spanish component. Every Spanish string in the game is
// rendered through <T>. Clicking it opens the Armenian translation popup with
// pronunciation (normal and slow) and a word-by-word breakdown.
import React from 'react';
import { createStore, useStore } from '../game/store';
import { game, bumpDaily } from '../game/state';
import { glossWord, splitWords } from './lexicon';
import { speak } from './speech';

const PHRASES = new Map<string, string>();
const key = (s: string) => s.trim().toLowerCase();

export function registerPhrase(es: string, hy: string) {
  if (es && hy) PHRASES.set(key(es), hy);
}
export function lookup(es: string): string | undefined {
  return PHRASES.get(key(es));
}

export interface Tr {
  es: string;
  hy: string;
}

interface PopupState {
  open: boolean;
  es: string;
  hy: string;
  x: number;
  y: number;
}
export const popup = createStore<PopupState>({ open: false, es: '', hy: '', x: 0, y: 0 });

export function openTranslation(es: string, hy: string | undefined, x: number, y: number) {
  const translated = hy || lookup(es) || fallback(es);
  popup.set({ open: true, es, hy: translated, x, y });
  bumpDaily('words');
  // statistics: words seen
  game.set((s) => {
    const seen = { ...s.wordsSeen };
    for (const w of splitWords(es)) {
      const n = w.toLowerCase().replace(/[¿?¡!.,;:]/g, '');
      if (n.length > 1) seen[n] = (seen[n] ?? 0) + 1;
    }
    return { wordsSeen: seen };
  });
}

function fallback(es: string) {
  const parts = splitWords(es)
    .map((w) => glossWord(w))
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

interface TProps {
  es: string;
  hy?: string;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
  style?: React.CSSProperties;
  /** when true the click is not propagated (for use inside buttons) */
  stop?: boolean;
}

/** Clickable Spanish text. */
export function T({ es, hy, className, as = 'span', style, stop = true }: TProps) {
  if (hy) registerPhrase(es, hy);
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={'tr ' + (className ?? '')}
      style={style}
      title="Haz clic para traducir"
      onClick={(e: React.MouseEvent) => {
        if (stop) {
          e.stopPropagation();
          e.preventDefault();
        }
        openTranslation(es, hy, e.clientX, e.clientY);
      }}
    >
      {es}
    </Tag>
  );
}

/** Small "i" translate affordance to put next to a button label: the button
 * itself keeps its action, the badge opens the translation. */
export function TBadge({ es, hy }: Tr) {
  registerPhrase(es, hy);
  return (
    <span
      className="tr-badge"
      role="button"
      aria-label="Traducir"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        openTranslation(es, hy, e.clientX, e.clientY);
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      HY
    </span>
  );
}

/** A button whose label is Spanish: the button acts, the HY badge translates. */
export function TButton({
  es,
  hy,
  onClick,
  className,
  disabled,
  children,
}: Tr & { onClick?: () => void; className?: string; disabled?: boolean; children?: React.ReactNode }) {
  registerPhrase(es, hy);
  return (
    <button className={'btn ' + (className ?? '')} onClick={onClick} disabled={disabled}>
      {children}
      <span>{es}</span>
      <TBadge es={es} hy={hy} />
    </button>
  );
}

export function SpeakIcon({ slow }: { slow?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      {slow ? <path d="M15.5 8.5a5 5 0 0 1 0 7" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </svg>
  );
}

export function TranslationPopup() {
  const p = useStore(popup, (s) => s);
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const [word, setWord] = React.useState<{ w: string; g: string } | null>(null);

  React.useLayoutEffect(() => {
    if (!p.open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = p.x - r.width / 2;
    let top = p.y + 16;
    if (top + r.height > vh - 8) top = p.y - r.height - 16;
    left = Math.max(8, Math.min(vw - r.width - 8, left));
    top = Math.max(8, top);
    setPos({ left, top });
    setWord(null);
  }, [p.open, p.es, p.x, p.y]);

  React.useEffect(() => {
    if (!p.open) return;
    const close = () => popup.set({ open: false });
    const t = setTimeout(() => window.addEventListener('pointerdown', close), 0);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [p.open]);

  if (!p.open) return null;
  const words = splitWords(p.es);
  return (
    <div className="tr-popup" ref={ref} style={pos} onPointerDown={(e) => e.stopPropagation()}>
      <div className="tr-es">{p.es}</div>
      <div className="tr-hy" lang="hy">
        {p.hy}
      </div>
      <div className="tr-words">
        {words.map((w, i) => {
          const g = glossWord(w);
          return (
            <button key={i} className={'tr-word' + (g ? '' : ' dim')} onClick={() => g && setWord({ w, g })}>
              {w.replace(/[¿?¡!.,;:]/g, '')}
            </button>
          );
        })}
      </div>
      {word && (
        <div className="tr-gloss">
          <b>{word.w.replace(/[¿?¡!.,;:]/g, '')}</b> — <span lang="hy">{word.g}</span>
        </div>
      )}
      <div className="tr-actions">
        <button className="btn sm" onClick={() => speak(p.es)}>
          <SpeakIcon /> Escuchar <TBadge es="Escuchar" hy="Լսել" />
        </button>
        <button className="btn sm ghost" onClick={() => speak(p.es, { slow: true })}>
          <SpeakIcon slow /> Despacio <TBadge es="Despacio" hy="Դանդաղ" />
        </button>
      </div>
    </div>
  );
}
