import type { ReactNode } from 'react';

const I = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ico">
    {children}
  </svg>
);
export const Icon = {
  play: (s?: number) => <I size={s}><path d="M6 4l14 8-14 8z" /></I>,
  plus: (s?: number) => <I size={s}><path d="M12 5v14M5 12h14" /></I>,
  globe: (s?: number) => <I size={s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></I>,
  flag: (s?: number) => <I size={s}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></I>,
  ball: (s?: number) => <I size={s}><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /></I>,
  game: (s?: number) => <I size={s}><rect x="2" y="7" width="20" height="10" rx="4" /><path d="M7 10v4M5 12h4M15.5 11h.01M18 13h.01" /></I>,
  chart: (s?: number) => <I size={s}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></I>,
  gear: (s?: number) => <I size={s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></I>,
  map: (s?: number) => <I size={s}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14M15 6v14" /></I>,
  pause: (s?: number) => <I size={s}><path d="M8 5v14M16 5v14" /></I>,
  bag: (s?: number) => <I size={s}><path d="M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0" /></I>,
  x: (s?: number) => <I size={s}><path d="M6 6l12 12M18 6L6 18" /></I>,
  check: (s?: number) => <I size={s}><path d="M5 12l5 5L20 7" /></I>,
  coin: (s?: number) => <I size={s}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" /></I>,
  star: (s?: number) => <I size={s}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></I>,
  shirt: (s?: number) => <I size={s}><path d="M8 3l4 2 4-2 5 4-3 3v11H6V10L3 7z" /></I>,
  train: (s?: number) => <I size={s}><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M8 21l2-4M16 21l-2-4" /></I>,
  plane: (s?: number) => <I size={s}><path d="M2 13l20-8-6 16-4-6z" /></I>,
  eye: (s?: number) => <I size={s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></I>,
  bus: (s?: number) => <I size={s}><rect x="4" y="3" width="16" height="15" rx="2" /><path d="M4 11h16M7 21v-3M17 21v-3" /></I>,
};
