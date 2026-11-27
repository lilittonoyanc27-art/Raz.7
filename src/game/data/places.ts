// City layout: grid of roads and named places. Shared by every Spanish city;
// each city changes palette, heights, landmarks and missions.
import type { Tr } from '../../i18n/T';
import type { CityId } from '../state';

export const ROADS = [-240, -160, -80, 0, 80, 160, 240];
export const ROAD_W = 12;
export const BLOCK = 80;
export const blockCenter = (i: number) => -200 + i * BLOCK;

export type InteriorKind =
  | 'home'
  | 'supermarket'
  | 'cafe'
  | 'restaurant'
  | 'sportshop'
  | 'mall'
  | 'gym'
  | 'cinema'
  | 'school'
  | 'workshop'
  | 'gamecenter'
  | 'academy'
  | 'airport'
  | 'station';

export interface Place {
  id: string;
  name: Tr;
  bx: number;
  bz: number;
  w: number;
  d: number;
  h: number;
  color: string;
  interior?: InteriorKind;
  sign?: string;
  /** open-air areas (not a building) */
  area?: 'park' | 'stadium' | 'training' | 'parking' | 'beach' | 'plaza';
}

const p = (id: string, es: string, hy: string, bx: number, bz: number, o: Partial<Place> = {}): Place => ({
  id,
  name: { es, hy },
  bx,
  bz,
  w: 36,
  d: 28,
  h: 14,
  color: '#d9d4cc',
  ...o,
});

export const PLACES: Place[] = [
  p('home', 'Casa de RAZ', 'ՌԱԶ-ի տունը', 2, 3, { w: 22, d: 18, h: 10, color: '#efe4d2', interior: 'home', sign: 'RAZ' }),
  p('park', 'Parque', 'Այգի', 3, 3, { area: 'park' }),
  p('stadium', 'Estadio', 'Մարզադաշտ', 4, 1, { area: 'stadium' }),
  p('training', 'Ciudad deportiva', 'Մարզաբազա', 5, 1, { area: 'training' }),
  p('academy', 'Academia de fútbol', 'Ֆուտբոլի ակադեմիա', 4, 0, { w: 40, d: 26, h: 18, color: '#2b2e35', interior: 'academy', sign: 'ACADEMIA' }),
  p('sportshop', 'Tienda de deportes', 'Սպորտային խանութ', 2, 2, { w: 30, d: 22, h: 12, color: '#ff6a00', interior: 'sportshop', sign: 'DEPORTES 7' }),
  p('supermarket', 'Supermercado', 'Սուպերմարկետ', 3, 2, { w: 40, d: 26, h: 9, color: '#e8e8e8', interior: 'supermarket', sign: 'SUPERMERCADO' }),
  p('cafe', 'Cafetería', 'Սրճարան', 2, 4, { w: 22, d: 18, h: 8, color: '#c9a27e', interior: 'cafe', sign: 'CAFETERÍA' }),
  p('restaurant', 'Restaurante', 'Ռեստորան', 4, 3, { w: 28, d: 20, h: 9, color: '#8e3b2e', interior: 'restaurant', sign: 'RESTAURANTE' }),
  p('mall', 'Centro comercial', 'Առևտրի կենտրոն', 4, 2, { w: 50, d: 40, h: 22, color: '#9fb3c8', interior: 'mall', sign: 'CENTRO COMERCIAL' }),
  p('parking', 'Aparcamiento', 'Կայանատեղի', 1, 2, { area: 'parking' }),
  p('gym', 'Gimnasio', 'Մարզասրահ', 1, 1, { w: 30, d: 24, h: 10, color: '#3d4148', interior: 'gym', sign: 'GIMNASIO' }),
  p('cinema', 'Cine', 'Կինոթատրոն', 2, 1, { w: 34, d: 28, h: 16, color: '#5a1f2b', interior: 'cinema', sign: 'CINE' }),
  p('school', 'Escuela', 'Դպրոց', 1, 4, { w: 44, d: 26, h: 13, color: '#e3c58f', interior: 'school', sign: 'ESCUELA' }),
  p('workshop', 'Taller mecánico', 'Ավտոարհեստանոց', 0, 2, { w: 30, d: 22, h: 8, color: '#6c7a89', interior: 'workshop', sign: 'TALLER' }),
  p('gamecenter', 'Centro de juegos', 'Խաղային կենտրոն', 3, 4, { w: 36, d: 28, h: 14, color: '#1f2a44', interior: 'gamecenter', sign: 'GAME ZONE' }),
  p('airport', 'Aeropuerto', 'Օդանավակայան', 5, 4, { w: 56, d: 30, h: 16, color: '#cfd8dc', interior: 'airport', sign: 'AEROPUERTO' }),
  p('station', 'Estación de tren', 'Երկաթուղային կայարան', 0, 0, { w: 48, d: 24, h: 15, color: '#b7a58c', interior: 'station', sign: 'ESTACIÓN' }),
  p('beach', 'Playa', 'Լողափ', 3, 6, { area: 'beach' }),
  p('plaza', 'Plaza Mayor', 'Կենտրոնական հրապարակ', 2, 0, { area: 'plaza' }),
];

export const placeById = (id: string) => PLACES.find((x) => x.id === id);

export function placeCenter(pl: Place) {
  if (pl.area === 'beach') return { x: 40, z: 285 };
  return { x: blockCenter(pl.bx), z: blockCenter(pl.bz) };
}

/** Door point on the south (+z) face of a building, where the player stands to enter. */
export function doorPoint(pl: Place) {
  const c = placeCenter(pl);
  return { x: c.x, z: c.z + pl.d / 2 + 1.6 };
}

export interface CityConfig {
  id: CityId;
  name: Tr;
  seed: number;
  palette: string[];
  heights: [number, number];
  sky: string;
  landmark: 'cathedral' | 'tower' | 'arch' | 'giralda' | 'museum' | 'lighthouse' | 'arts';
  description: Tr;
  chapter: number;
  hasBeach: boolean;
}

export const CITIES: CityConfig[] = [
  {
    id: 'valencia', name: { es: 'Valencia', hy: 'Վալենսիա' }, seed: 7, chapter: 1, hasBeach: true,
    palette: ['#efe4d2', '#e7d3b5', '#f3efe8', '#d9c7a8', '#cfd6d9', '#f0d9c0'], heights: [10, 34], sky: '#8fc3ec', landmark: 'arts',
    description: { es: 'Ciudad del mar, de la paella y del deporte.', hy: 'Ծովի, պաելյայի և սպորտի քաղաք։' },
  },
  {
    id: 'madrid', name: { es: 'Madrid', hy: 'Մադրիդ' }, seed: 21, chapter: 5, hasBeach: false,
    palette: ['#d8c3a5', '#c9b18f', '#e8dccb', '#b9a083', '#d0c4b4', '#a99a86'], heights: [16, 50], sky: '#9ac4e8', landmark: 'arch',
    description: { es: 'La capital: grandes avenidas y estadios enormes.', hy: 'Մայրաքաղաքը՝ լայն պողոտաներ և հսկայական մարզադաշտեր։' },
  },
  {
    id: 'barcelona', name: { es: 'Barcelona', hy: 'Բարսելոնա' }, seed: 33, chapter: 6, hasBeach: true,
    palette: ['#e9d8c4', '#d7b899', '#f2e6d8', '#c6a888', '#e3cbb0', '#bfa58a'], heights: [14, 40], sky: '#86bfe8', landmark: 'cathedral',
    description: { es: 'Arquitectura modernista, playa y mucho fútbol.', hy: 'Մոդեռն ճարտարապետություն, լողափ և շատ ֆուտբոլ։' },
  },
  {
    id: 'sevilla', name: { es: 'Sevilla', hy: 'Սևիլյա' }, seed: 45, chapter: 6, hasBeach: false,
    palette: ['#f6e7c1', '#f2d59b', '#fff4dc', '#e9c27a', '#f4e1b5', '#ffffff'], heights: [8, 22], sky: '#a6cdf0', landmark: 'giralda',
    description: { es: 'Calles blancas y amarillas, naranjos y mucho calor.', hy: 'Սպիտակ և դեղին փողոցներ, նարնջենիներ և շատ շոգ։' },
  },
  {
    id: 'santander', name: { es: 'Santander', hy: 'Սանտանդեր' }, seed: 57, chapter: 6, hasBeach: true,
    palette: ['#dfe6e9', '#c8d6e0', '#f0f3f5', '#b2c2cc', '#e6e0d4', '#d0d8dc'], heights: [10, 26], sky: '#9db7cc', landmark: 'lighthouse',
    description: { es: 'Ciudad del norte, con faro, mar y lluvia.', hy: 'Հյուսիսային քաղաք՝ փարոսով, ծովով և անձրևով։' },
  },
  {
    id: 'bilbao', name: { es: 'Bilbao', hy: 'Բիլբաո' }, seed: 69, chapter: 6, hasBeach: false,
    palette: ['#b9c0c6', '#a3acb4', '#d4d8dc', '#8e989f', '#c8c2b8', '#9aa3a8'], heights: [14, 42], sky: '#a2b4c2', landmark: 'museum',
    description: { es: 'Puentes, museos modernos y verde por todas partes.', hy: 'Կամուրջներ, ժամանակակից թանգարաններ և ամենուր կանաչ։' },
  },
  {
    id: 'malaga', name: { es: 'Málaga', hy: 'Մալագա' }, seed: 81, chapter: 7, hasBeach: true,
    palette: ['#fbefe0', '#f6dcc0', '#ffffff', '#f2cfa6', '#fae6d0', '#efd9bf'], heights: [8, 28], sky: '#7fc0f0', landmark: 'tower',
    description: { es: 'Sol, playa y el gran final del sueño de RAZ.', hy: 'Արև, լողափ և ՌԱԶ-ի երազանքի մեծ եզրափակիչը։' },
  },
];

export const cityById = (id: CityId) => CITIES.find((c) => c.id === id)!;
