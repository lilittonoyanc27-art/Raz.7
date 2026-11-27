import { createStore, safeLoad, safeSave } from './store';

export type Quality = 'low' | 'medium' | 'high';
export interface Settings {
  quality: Quality;
  masterVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  speechRate: number;
  mouseSensitivity: number;
  invertY: boolean;
  autoSpeak: boolean;
  navVoice: boolean;
}
const defaults: Settings = {
  quality: (typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent)) ? 'low' : 'medium',
  masterVolume: 0.8,
  sfxVolume: 0.7,
  voiceVolume: 1,
  speechRate: 0.95,
  mouseSensitivity: 1,
  invertY: false,
  autoSpeak: true,
  navVoice: true,
};
export const settings = createStore<Settings>({ ...defaults, ...(safeLoad<Partial<Settings>>('raz7.settings') ?? {}) });
settings.subscribe(() => safeSave('raz7.settings', settings.get()));
