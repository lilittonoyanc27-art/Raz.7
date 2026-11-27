// Numbers 100–100 000 in Spanish and Armenian words + conversation generator
// for pedestrians who stop RAZ and ask about numbers.
import type { Tr } from '../../i18n/T';
import type { Exchange, Option } from './npcs';
import { shuffle } from './grammar';

const U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const TEEN = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const TWENTY = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUND = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function es99(n: number): string {
  if (n < 10) return U[n];
  if (n < 20) return TEEN[n - 10];
  if (n < 30) return TWENTY[n - 20];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${TENS[t]} y ${U[u]}` : TENS[t];
}
function es999(n: number): string {
  if (n === 100) return 'cien';
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [HUND[h], r ? es99(r) : ''].filter(Boolean).join(' ');
}
/** Spanish words for 0 < n ≤ 100 000 (masculine, e.g. euros). */
export function numEs(n: number): string {
  if (n === 100000) return 'cien mil';
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  let thWords = '';
  if (th === 1) thWords = 'mil';
  else if (th > 1)
    thWords =
      es999(th)
        .replace(/veintiuno$/, 'veintiún')
        .replace(/\buno$/, 'un') + ' mil';
  return [thWords, r ? es999(r) : ''].filter(Boolean).join(' ');
}

const HU = ['', 'մեկ', 'երկու', 'երեք', 'չորս', 'հինգ', 'վեց', 'յոթ', 'ութ', 'ինը'];
const HT = ['', 'տասը', 'քսան', 'երեսուն', 'քառասուն', 'հիսուն', 'վաթսուն', 'յոթանասուն', 'ութսուն', 'իննսուն'];
function hy99(n: number): string {
  if (n < 10) return HU[n];
  if (n === 10) return 'տասը';
  if (n < 20) return 'տասն' + HU[n - 10];
  const t = Math.floor(n / 10);
  return HT[t] + (n % 10 ? HU[n % 10] : '');
}
function hy999(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hw = h === 0 ? '' : h === 1 ? 'հարյուր' : `${HU[h]} հարյուր`;
  return [hw, r ? hy99(r) : ''].filter(Boolean).join(' ');
}
/** Armenian words for 0 < n ≤ 100 000. */
export function numHy(n: number): string {
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  const tw = th === 0 ? '' : th === 1 ? 'հազար' : `${hy999(th)} հազար`;
  return [tw, r ? hy999(r) : ''].filter(Boolean).join(' ');
}

/** Digits formatted the Spanish way (12.800; 4-digit numbers without a dot). */
export const numDigits = (n: number) => (n >= 10000 ? n.toLocaleString('es-ES') : String(n));

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
/** A "nice" random number in a tier: 0 = 100–999, 1 = 1 000–9 999, 2 = 10 000–100 000 */
export function randomNumber(tier: number) {
  if (tier === 0) return rnd(1, 9) * 100 + (Math.random() < 0.7 ? rnd(1, 99) : 0);
  if (tier === 1) return rnd(1, 9) * 1000 + rnd(0, 9) * 100 + (Math.random() < 0.5 ? rnd(1, 9) * 10 : 0);
  if (Math.random() < 0.1) return 100000;
  return rnd(10, 99) * 1000 + (Math.random() < 0.6 ? rnd(1, 9) * 100 : 0) + (Math.random() < 0.3 ? rnd(1, 9) * 10 : 0);
}

/** Plausible wrong answers: swapped digits, missing parts, wrong magnitude. */
function distractors(n: number): number[] {
  const out = new Set<number>();
  const s = String(n);
  if (s.length >= 3) {
    const sw = s.split('');
    const i = Math.max(0, s.length - 3);
    [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]];
    out.add(Number(sw.join('')));
  }
  out.add(n >= 1000 ? Math.floor(n / 1000) * 100 + (n % 100) : n * 10);
  out.add(n + (n >= 1000 ? 1000 : 100));
  out.add(n >= 2000 ? n - 1000 : n + 10);
  out.add(n < 10000 ? n * 10 : Math.round(n / 10));
  return [...out].filter((x) => x !== n && x >= 100 && x <= 100000).slice(0, 3);
}

const t = (es: string, hy: string): Tr => ({ es, hy });
const opt = (es: string, hy: string, ok: boolean): Option => ({ es, hy, ok });

/** Three listening-only number questions: the passer-by says a number aloud,
 * RAZ picks the right digits. */
export function numberExchanges(tier: number): Exchange[] {
  const explain = t(
    'Recuerda: 100 = cien, 101 = ciento uno, 1000 = mil, 21 000 = veintiún mil, 100 000 = cien mil.',
    'Հիշիր՝ 100 = cien, 101 = ciento uno, 1000 = mil, 21 000 = veintiún mil, 100 000 = cien mil։',
  );
  const contexts: ((n: number) => { q: Tr; unit: Tr })[] = [
    (n) => ({ q: t(`Este coche cuesta ${numEs(n)} euros. ¿Cuánto cuesta?`, `Այս մեքենան արժե ${numHy(n)} եվրո։ Որքա՞ն արժե։`), unit: t('euros', 'եվրո') }),
    (n) => ({ q: t(`El estadio tiene ${numEs(n)} asientos. ¿Cuántos asientos tiene?`, `Մարզադաշտն ունի ${numHy(n)} նստատեղ։ Քանի՞ նստատեղ ունի։`), unit: t('asientos', 'նստատեղ') }),
    (n) => ({ q: t(`Mi pueblo tiene ${numEs(n)} habitantes. ¿Cuántos habitantes tiene?`, `Իմ գյուղն ունի ${numHy(n)} բնակիչ։ Քանի՞ բնակիչ ունի։`), unit: t('habitantes', 'բնակիչ') }),
    (n) => ({ q: t(`La playa está a ${numEs(n)} metros de aquí. ¿A cuántos metros está?`, `Լողափը այստեղից ${numHy(n)} մետր է։ Քանի՞ մետր է։`), unit: t('metros', 'մետր') }),
    (n) => ({ q: t(`Mi bicicleta nueva cuesta ${numEs(n)} euros. ¿Cuánto cuesta?`, `Իմ նոր հեծանիվն արժե ${numHy(n)} եվրո։ Որքա՞ն արժե։`), unit: t('euros', 'եվրո') }),
    (n) => ({ q: t(`Hoy han venido ${numEs(n)} aficionados al partido. ¿Cuántos aficionados han venido?`, `Այսօր խաղին եկել է ${numHy(n)} երկրպագու։ Քանի՞ երկրպագու է եկել։`), unit: t('aficionados', 'երկրպագու') }),
    (n) => ({ q: t(`Mi número favorito es el ${numEs(n)}. ¿Cuál es?`, `Իմ սիրելի թիվը ${numHy(n)}-ն է։ Ո՞րն է։`), unit: t('', '') }),
  ];
  const picks = shuffle(contexts).slice(0, 3);
  const tiers = [tier, tier, Math.min(2, tier + 1)];
  return picks.map((ctx, i) => {
    const n = randomNumber(tiers[i]);
    const { q, unit } = ctx(n);
    const label = (x: number) => (unit.es ? `${numDigits(x)} ${unit.es}` : numDigits(x));
    const labelHy = (x: number) => (unit.hy ? `${numDigits(x)} ${unit.hy}` : numDigits(x));
    return {
      npc: q,
      mode: 'listen' as const,
      audioOnly: true,
      options: shuffle([opt(label(n), labelHy(n), true), ...distractors(n).map((d) => opt(label(d), labelHy(d), false))]),
      explain: t(`${numDigits(n)} = ${numEs(n)}. ${explain.es}`, `${numDigits(n)} = ${numHy(n)}։ ${explain.hy}`),
      topic: 'numeros',
    };
  });
}

const NAMES_F = ['Carmen', 'Lucía', 'María', 'Paula', 'Elena', 'Sara', 'Marta', 'Alba', 'Irene', 'Nuria'];
const NAMES_M = ['Javier', 'Daniel', 'Sergio', 'Pablo', 'Adrián', 'Álvaro', 'David', 'Manuel', 'Raúl', 'Iván'];
export const randomName = (female: boolean) => (female ? NAMES_F : NAMES_M)[Math.floor(Math.random() * 10)];
