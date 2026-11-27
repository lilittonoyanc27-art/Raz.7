// Hidden objects scattered around every city. Finding them teaches the word.
import type { Tr } from '../../i18n/T';

export interface Collectible {
  id: string;
  /** with article: "el reloj" */
  name: Tr;
  shape: string;
  place: string;
  door?: boolean;
  dx: number;
  dz: number;
}

const c = (id: string, es: string, hy: string, shape: string, place: string, dx: number, dz: number, door = false): Collectible => ({ id, name: { es, hy }, shape, place, dx, dz, door });

export const COLLECTIBLES: Collectible[] = [
  c('reloj', 'el reloj', 'ժամացույցը', 'watch', 'park', 12, -4),
  c('llaves', 'las llaves', 'բանալիները', 'keys', 'cafe', 4, 2, true),
  c('movil', 'el móvil', 'բջջային հեռախոսը', 'phone', 'plaza', 10, -10),
  c('libro', 'el libro', 'գիրքը', 'book', 'school', 5, 2, true),
  c('gorra', 'la gorra', 'գլխարկը', 'cap', 'stadium', 8, 26),
  c('paraguas', 'el paraguas', 'անձրևանոցը', 'umbrella', 'station', 6, 2, true),
  c('camara', 'la cámara de fotos', 'լուսանկարչական խցիկը', 'camera', 'beach', 30, -2),
  c('guitarra', 'la guitarra', 'կիթառը', 'guitar', 'plaza', -18, -16),
  c('patines', 'los patines', 'չմուշկները', 'skates', 'parking', -20, 26),
  c('gafas_sol', 'las gafas de sol', 'արևային ակնոցը', 'glasses', 'beach', -40, 4),
  c('bufanda', 'la bufanda', 'շարֆը', 'scarf', 'mall', -6, 2, true),
  c('medalla', 'la medalla de oro', 'ոսկե մեդալը', 'medal', 'training', 18, 12),
  c('mapa', 'el mapa', 'քարտեզը', 'map', 'airport', 8, 3, true),
  c('pelota_tenis', 'la pelota de tenis', 'թենիսի գնդակը', 'tennis', 'park', -22, -20),
  c('tarjeta', 'la tarjeta de autobús', 'ավտոբուսի քարտը', 'card', 'gym', 5, 2, true),
];
