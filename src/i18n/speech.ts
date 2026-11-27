// Spanish text-to-speech using the Web Speech API.
import { settings } from '../game/settings';

let voices: SpeechSynthesisVoice[] = [];
function loadVoices() {
  try {
    voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'));
  } catch {
    voices = [];
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export interface VoiceProfile {
  pitch?: number;
  rate?: number;
  /** 0 = female voice, 1 = male voice (higher numbers cycle through the pool) */
  voice?: number;
  gender?: 'f' | 'm';
}

// Known Spanish system voices (macOS, Windows, Chrome, Android, iOS)
const FEMALE = /m[oó]nica|paulina|marisol|luc[ií]a|elena|laura|helena|sabina|conchita|pen[eé]lope|elvira|dalia|paloma|soledad|ximena|isabela|camila|valentina|esperanza|flo\b|sandy|shelley|google espa/i;
const MALE = /jorge|juan|diego|pablo|carlos|enrique|[aá]lvaro|ra[uú]l|miguel|andr[eé]s|alonso|jos[eé]|jaime|gonzalo|tom[aá]s|eddy|reed|rocko/i;
// novelty voices that sound unclear
const NOVELTY = /grandma|grandpa|bad news|bubbles|bells|boing|cellos|jester|organ|superstar|trinoids|whisper|zarvox|wobble|albert|bahh/i;
// clearest voices first
const PRIORITY_F = ['mónica', 'monica', 'paulina', 'helena', 'laura', 'elvira', 'flo', 'sandy', 'shelley'];
const PRIORITY_M = ['jorge', 'pablo', 'álvaro', 'alvaro', 'eddy', 'reed', 'rocko'];

export function pickVoice(gender: 'f' | 'm', index: number) {
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith('es') && !NOVELTY.test(v.name));
  const spain = es.filter((v) => /es[-_]es/i.test(v.lang));
  const want = gender === 'f' ? FEMALE : MALE;
  const avoid = gender === 'f' ? MALE : FEMALE;
  // best: matching gender from Spain, prefer high quality ("premium", "enhanced", "natural")
  const prio = gender === 'f' ? PRIORITY_F : PRIORITY_M;
  const quality = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    const p = prio.findIndex((x) => n.startsWith(x));
    return (/premium|enhanced|natural|neural|mejorad/i.test(n) ? -10 : 0) + (p < 0 ? 50 : p);
  };
  const ranked = (list: SpeechSynthesisVoice[]) => [...list].sort((a, b) => quality(a) - quality(b));
  const candidates = [
    ranked(spain.filter((v) => want.test(v.name))),
    ranked(es.filter((v) => want.test(v.name))),
    ranked(spain.filter((v) => !avoid.test(v.name))),
    ranked(es.filter((v) => !avoid.test(v.name))),
    spain,
    es,
  ].find((l) => l.length);
  if (!candidates) return null;
  return candidates[index % candidates.length];
}

let unlocked = false;
let serial = 0;

/** Call from a user gesture (tap/click/key): browsers only allow speech after one. */
export function unlockSpeech() {
  if (unlocked || !('speechSynthesis' in window)) return;
  unlocked = true;
  try {
    loadVoices();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

function whenVoicesReady(): Promise<void> {
  if (voices.length || !('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((res) => {
    const t = setTimeout(res, 1200);
    window.speechSynthesis.addEventListener?.(
      'voiceschanged',
      () => {
        loadVoices();
        clearTimeout(t);
        res();
      },
      { once: true },
    );
  });
}

/** Speak Spanish text. Resolves when the sentence has finished (or failed). */
export function speak(text: string, opts: VoiceProfile & { slow?: boolean } = {}): Promise<void> {
  if (!('speechSynthesis' in window) || !text.trim()) return Promise.resolve();
  const id = ++serial;
  const synth = window.speechSynthesis;
  const wasBusy = synth.speaking || synth.pending;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
  return whenVoicesReady().then(
    () =>
      new Promise<void>((resolve) => {
        // Chrome drops an utterance queued right after cancel(): wait a moment
        setTimeout(
          () => {
            if (id !== serial) return resolve(); // a newer sentence replaced this one
            try {
              const u = new SpeechSynthesisUtterance(text);
              u.lang = 'es-ES';
              const gender = opts.gender ?? ((opts.voice ?? 0) % 2 === 0 ? 'f' : 'm');
              const v = pickVoice(gender, Math.floor((opts.voice ?? 0) / 2));
              if (v) {
                u.voice = v;
                u.lang = v.lang;
              }
              u.pitch = Math.min(1.12, Math.max(0.88, opts.pitch ?? 1));
              const base = Math.min(1.05, (opts.rate ?? 1) * settings.get().speechRate);
              u.rate = opts.slow ? base * 0.6 : base;
              u.volume = settings.get().voiceVolume;
              const done = () => resolve();
              u.onend = done;
              u.onerror = done;
              // safety: some browsers never fire onend
              setTimeout(done, 1500 + text.length * 110 * (opts.slow ? 1.7 : 1));
              synth.resume();
              synth.speak(u);
            } catch {
              resolve();
            }
          },
          wasBusy ? 80 : 0,
        );
      }),
  );
}

/** RAZ's own voice (male, natural). */
export const RAZ_VOICE: VoiceProfile = { voice: 1, pitch: 1.04, rate: 0.95 };

export function stopSpeaking() {
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
