import { useRef, useState } from 'react';
import { Engine } from '../game/world/Engine';
import { openModal } from '../game/ui';
import { TBadge } from '../i18n/T';

const HY: Record<string, string> = { Saltar: 'Ցատկել', Correr: 'Վազել', Chutar: 'Հարվածել', Pase: 'Փոխանցում', Mapa: 'Քարտեզ', Freno: 'Արգելակ', Pausa: 'Դադար', Vista: 'Տեսք', E: 'Փոխազդել', F: 'Նստել / իջնել' };

const isTouch = () => typeof window !== 'undefined' && ('ontouchstart' in window || matchMedia('(pointer: coarse)').matches);

export function MobileControls() {
  const [show] = useState(isTouch);
  const [run, setRun] = useState(false);
  const lastTap = useRef(0);
  const knob = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);
  const joyCenter = useRef({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });
  if (!show) return null;
  const input = () => Engine.current?.input;

  const joyMove = (x: number, y: number) => {
    const dx = x - joyCenter.current.x;
    const dy = y - joyCenter.current.y;
    const max = 50;
    const l = Math.min(max, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    const kx = Math.cos(a) * l;
    const ky = Math.sin(a) * l;
    if (knob.current) knob.current.style.transform = `translate(${kx}px, ${ky}px)`;
    const inp = input();
    if (inp) inp.joy = { x: kx / max, y: -ky / max };
  };
  const joyEnd = () => {
    joyId.current = null;
    if (knob.current) knob.current.style.transform = '';
    const inp = input();
    if (inp) inp.joy = { x: 0, y: 0 };
  };

  const btn = (label: string, code: string, opts: { hold?: boolean; onTap?: () => void } = {}) => (
    <button
      className="tbtn"
      onPointerDown={(e) => {
        e.preventDefault();
        const inp = input();
        if (!inp) return;
        if (opts.onTap) opts.onTap();
        else if (opts.hold) inp.hold(code, true);
        else inp.press(code);
      }}
      onPointerUp={() => opts.hold && input()?.hold(code, false)}
      onPointerCancel={() => opts.hold && input()?.hold(code, false)}
      onPointerLeave={() => opts.hold && input()?.hold(code, false)}
    >
      {label}
      <TBadge es={label} hy={HY[label] ?? label} />
    </button>
  );

  return (
    <div className="touch">
      <div
        className="look-zone"
        onPointerDown={(e) => {
          lookId.current = e.pointerId;
          lookLast.current = { x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookId.current !== e.pointerId) return;
          input()?.look((e.clientX - lookLast.current.x) * 2.2, (e.clientY - lookLast.current.y) * 2.2);
          lookLast.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (lookId.current = null)}
        onPointerCancel={() => (lookId.current = null)}
      />
      <div
        className="joy"
        onPointerDown={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          joyCenter.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          joyId.current = e.pointerId;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          joyMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => joyId.current === e.pointerId && joyMove(e.clientX, e.clientY)}
        onPointerUp={joyEnd}
        onPointerCancel={joyEnd}
      >
        <div className="joy-knob" ref={knob} />
      </div>
      <div className="tbtns">
        {btn('Saltar', 'Space')}
        {btn('E', 'KeyE')}
        {btn('F', 'KeyF')}
        <button
          className={'tbtn' + (run ? ' on' : '')}
          onPointerDown={(e) => {
            e.preventDefault();
            const inp = input();
            if (!inp) return;
            const now = performance.now();
            if (now - lastTap.current < 350) {
              // double tap: sprint
              inp.touchRun = true;
              inp.touchSprint = true;
              setRun(true);
            } else {
              inp.touchSprint = false;
              inp.touchRun = !run;
              setRun(!run);
            }
            lastTap.current = now;
          }}
        >
          Correr
          <TBadge es="Correr" hy={HY.Correr} />
        </button>
        {btn('Chutar', 'KeyK', { hold: true })}
        {btn('Pase', 'KeyQ')}
        {btn('Mapa', 'KeyM', { onTap: () => openModal({ type: 'map' }) })}
        {btn('Freno', 'Space', { hold: true })}
        {btn('Pausa', 'KeyP', { onTap: () => openModal({ type: 'pause' }) })}
        {btn('Vista', 'KeyV', { onTap: () => Engine.current?.toggleView() })}
      </div>
    </div>
  );
}
