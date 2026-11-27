// UI state: which panel/modal is open. The engine is paused while a modal is open.
import { createStore } from './store';
import type { Exchange } from './data/npcs';
import type { Tr } from '../i18n/T';

export type Modal =
  | null
  | { type: 'dialog'; npcId: string; title?: Tr; greet?: Tr; exchanges: Exchange[]; outro?: Tr; onDone?: (ok: number, total: number) => void; free?: boolean }
  | { type: 'shop'; cat: 'clothes' | 'vehicles' | 'equipment' | 'room' | 'all' }
  | { type: 'wardrobe' }
  | { type: 'map' }
  | { type: 'pause' }
  | { type: 'travel'; mode: 'train' | 'plane' | 'bus'; force?: string }
  | { type: 'minigame'; id: string }
  | { type: 'missions' }
  | { type: 'progress' }
  | { type: 'settings' }
  | { type: 'football' }
  | { type: 'checkout' }
  | { type: 'cinema' }
  | { type: 'train'; stat: 'speed' | 'stamina' | 'shooting' | 'technique' | 'teamwork' }
  | { type: 'minigames' }
  | { type: 'missionDone'; title: Tr; xp: number; money: number; next?: Tr }
  | { type: 'chapter'; title: Tr; brief: Tr }
  | { type: 'review' }
  | { type: 'freetalk' }
  | { type: 'order'; place: 'cafe' | 'restaurant' }
  | { type: 'pick'; id: string }
  | { type: 'gift'; from: string; item: Tr | null; money: number };

export interface UiState {
  screen: 'menu' | 'game';
  modal: Modal;
  /** where the menu was opened from (to return) */
  menuPanel: 'main' | 'missions' | 'progress' | 'settings' | 'minigames' | 'football';
  basket: string[];
  banner: { es: string; hy: string; kind: string } | null;
}
export const ui = createStore<UiState>({ screen: 'menu', modal: null, menuPanel: 'main', basket: [], banner: null });

export function openModal(m: Modal) {
  ui.set({ modal: m });
}
export function closeModal() {
  ui.set({ modal: null });
}
let bannerT: ReturnType<typeof setTimeout> | null = null;
export function banner(es: string, hy: string, kind = 'info', ms = 3500) {
  ui.set({ banner: { es, hy, kind } });
  if (bannerT) clearTimeout(bannerT);
  bannerT = setTimeout(() => ui.set({ banner: null }), ms);
}
