import type { Tr } from '../../i18n/T';

export interface Product {
  id: string;
  name: Tr;
  price: number;
  color: string;
  shape: 'bottle' | 'box' | 'round' | 'carton' | 'bag' | 'long';
  shelf: Tr;
}

const sh = {
  fruit: { es: 'Frutas y verduras', hy: 'Մրգեր և բանջարեղեն' },
  dairy: { es: 'Lácteos', hy: 'Կաթնամթերք' },
  drinks: { es: 'Bebidas', hy: 'Ըմպելիքներ' },
  bakery: { es: 'Panadería', hy: 'Հացաբուլկեղեն' },
  pantry: { es: 'Despensa', hy: 'Մթերքներ' },
  meat: { es: 'Carne y pescado', hy: 'Միս և ձուկ' },
};

export const PRODUCTS: Product[] = [
  { id: 'agua', name: { es: 'una botella de agua', hy: 'մեկ շիշ ջուր' }, price: 0.6, color: '#7ec8f0', shape: 'bottle', shelf: sh.drinks },
  { id: 'zumo', name: { es: 'un zumo de naranja', hy: 'նարնջի հյութ' }, price: 1.5, color: '#ff9a1a', shape: 'carton', shelf: sh.drinks },
  { id: 'leche', name: { es: 'un litro de leche', hy: 'մեկ լիտր կաթ' }, price: 1.1, color: '#f4f4f4', shape: 'carton', shelf: sh.dairy },
  { id: 'yogur', name: { es: 'yogures naturales', hy: 'բնական յոգուրտներ' }, price: 1.8, color: '#e8eef5', shape: 'box', shelf: sh.dairy },
  { id: 'queso', name: { es: 'queso', hy: 'պանիր' }, price: 3.2, color: '#f2c94c', shape: 'round', shelf: sh.dairy },
  { id: 'huevos', name: { es: 'una docena de huevos', hy: 'մեկ տասնյակ ձու' }, price: 2.3, color: '#d9b38c', shape: 'box', shelf: sh.dairy },
  { id: 'pan', name: { es: 'una barra de pan', hy: 'մեկ բագետ հաց' }, price: 0.9, color: '#c8873f', shape: 'long', shelf: sh.bakery },
  { id: 'galletas', name: { es: 'un paquete de galletas', hy: 'մեկ տուփ թխվածքաբլիթ' }, price: 1.4, color: '#8d5a2b', shape: 'box', shelf: sh.bakery },
  { id: 'manzanas', name: { es: 'un kilo de manzanas', hy: 'մեկ կիլո խնձոր' }, price: 2.0, color: '#d64541', shape: 'round', shelf: sh.fruit },
  { id: 'platanos', name: { es: 'plátanos', hy: 'բանաններ' }, price: 1.6, color: '#f7d23e', shape: 'long', shelf: sh.fruit },
  { id: 'tomates', name: { es: 'tomates', hy: 'լոլիկներ' }, price: 1.9, color: '#e53935', shape: 'round', shelf: sh.fruit },
  { id: 'naranjas', name: { es: 'naranjas', hy: 'նարինջներ' }, price: 2.2, color: '#fb8c00', shape: 'round', shelf: sh.fruit },
  { id: 'arroz', name: { es: 'un paquete de arroz', hy: 'մեկ տուփ բրինձ' }, price: 1.3, color: '#f5f0e1', shape: 'bag', shelf: sh.pantry },
  { id: 'pasta', name: { es: 'pasta', hy: 'մակարոն' }, price: 1.0, color: '#f0c36d', shape: 'bag', shelf: sh.pantry },
  { id: 'aceite', name: { es: 'aceite de oliva', hy: 'ձիթապտղի յուղ' }, price: 5.5, color: '#9bb03a', shape: 'bottle', shelf: sh.pantry },
  { id: 'pollo', name: { es: 'pechuga de pollo', hy: 'հավի կրծքամիս' }, price: 4.5, color: '#f2b8a0', shape: 'box', shelf: sh.meat },
  { id: 'pescado', name: { es: 'pescado fresco', hy: 'թարմ ձուկ' }, price: 6.0, color: '#9fb8c8', shape: 'long', shelf: sh.meat },
  { id: 'isotonica', name: { es: 'una bebida isotónica', hy: 'իզոտոնիկ ըմպելիք' }, price: 1.7, color: '#38c172', shape: 'bottle', shelf: sh.drinks },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export const fmtEuro = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

/** Shop catalogue (clothes, vehicles, equipment, decoration) */
export interface ShopItem {
  id: string;
  cat: 'clothes' | 'vehicles' | 'equipment' | 'room';
  name: Tr;
  price: number;
  slot?: 'shirt' | 'shorts' | 'shoes' | 'accessory' | 'hair';
  value?: string;
  stat?: { k: 'speed' | 'stamina' | 'shooting' | 'technique' | 'teamwork'; v: number };
}

const it = (id: string, cat: ShopItem['cat'], es: string, hy: string, price: number, extra: Partial<ShopItem> = {}): ShopItem => ({ id, cat, name: { es, hy }, price, ...extra });

export const SHOP: ShopItem[] = [
  it('shirt_orange', 'clothes', 'Camiseta naranja número 7', 'Նարնջագույն մարզաշապիկ, համար 7', 0, { slot: 'shirt', value: '#ff6a00' }),
  it('shirt_white', 'clothes', 'Camiseta blanca', 'Սպիտակ մարզաշապիկ', 25, { slot: 'shirt', value: '#f2f2f2' }),
  it('shirt_graphite', 'clothes', 'Camiseta gris grafito', 'Գրաֆիտե մոխրագույն մարզաշապիկ', 30, { slot: 'shirt', value: '#3a3d44' }),
  it('shirt_blue', 'clothes', 'Camiseta azul', 'Կապույտ մարզաշապիկ', 30, { slot: 'shirt', value: '#1f5fbf' }),
  it('shirt_red', 'clothes', 'Camiseta roja', 'Կարմիր մարզաշապիկ', 30, { slot: 'shirt', value: '#c0392b' }),
  it('shirt_black', 'clothes', 'Camiseta negra', 'Սև մարզաշապիկ', 35, { slot: 'shirt', value: '#121212' }),
  it('shorts_black', 'clothes', 'Pantalón corto negro', 'Սև կարճ շալվար', 0, { slot: 'shorts', value: '#141414' }),
  it('shorts_white', 'clothes', 'Pantalón corto blanco', 'Սպիտակ կարճ շալվար', 20, { slot: 'shorts', value: '#ededed' }),
  it('shorts_orange', 'clothes', 'Pantalón corto naranja', 'Նարնջագույն կարճ շալվար', 22, { slot: 'shorts', value: '#ff6a00' }),
  it('shoes_white', 'clothes', 'Zapatillas blancas', 'Սպիտակ մարզակոշիկներ', 0, { slot: 'shoes', value: '#f2f2f2' }),
  it('shoes_orange', 'clothes', 'Botas de fútbol naranjas', 'Նարնջագույն ֆուտբոլային բութսեր', 60, { slot: 'shoes', value: '#ff7a1a', stat: { k: 'shooting', v: 0.5 } }),
  it('shoes_black', 'clothes', 'Botas de fútbol negras', 'Սև ֆուտբոլային բութսեր', 70, { slot: 'shoes', value: '#151515', stat: { k: 'technique', v: 0.5 } }),
  it('shoes_neon', 'clothes', 'Zapatillas de correr verdes', 'Կանաչ վազքի կոշիկներ', 80, { slot: 'shoes', value: '#39e75f', stat: { k: 'speed', v: 0.6 } }),
  it('acc_none', 'clothes', 'Sin accesorio', 'Առանց աքսեսուարի', 0, { slot: 'accessory', value: 'none' }),
  it('acc_cap', 'clothes', 'Gorra negra', 'Սև գլխարկ', 18, { slot: 'accessory', value: 'cap' }),
  it('acc_headband', 'clothes', 'Cinta para el pelo', 'Մազակապ', 10, { slot: 'accessory', value: 'headband' }),
  it('acc_headphones', 'clothes', 'Auriculares', 'Ականջակալներ', 45, { slot: 'accessory', value: 'headphones' }),
  it('acc_sunglasses', 'clothes', 'Gafas de sol', 'Արևային ակնոց', 25, { slot: 'accessory', value: 'sunglasses' }),
  it('hair_dark', 'clothes', 'Pelo castaño oscuro', 'Մուգ շագանակագույն մազեր', 0, { slot: 'hair', value: '#2a1a10' }),
  it('hair_blond', 'clothes', 'Pelo rubio', 'Շիկահեր', 15, { slot: 'hair', value: '#c9a45c' }),
  it('hair_black', 'clothes', 'Pelo negro', 'Սև մազեր', 15, { slot: 'hair', value: '#0e0e0e' }),
  it('bike_city', 'vehicles', 'Bicicleta de ciudad', 'Քաղաքային հեծանիվ', 0),
  it('bike_mtb', 'vehicles', 'Bicicleta de montaña', 'Լեռնային հեծանիվ', 120),
  it('scooter', 'vehicles', 'Patinete eléctrico', 'Էլեկտրական սքութեր', 150),
  it('car_compact', 'vehicles', 'Coche compacto', 'Կոմպակտ մեքենա', 400),
  it('car_sport', 'vehicles', 'Coche deportivo naranja', 'Նարնջագույն սպորտային մեքենա', 900),
  it('eq_ball', 'equipment', 'Balón profesional', 'Պրոֆեսիոնալ գնդակ', 35, { stat: { k: 'technique', v: 0.4 } }),
  it('eq_gloves', 'equipment', 'Guantes de portero', 'Դարպասապահի ձեռնոցներ', 30, { stat: { k: 'teamwork', v: 0.3 } }),
  it('eq_shin', 'equipment', 'Espinilleras', 'Սրունքապաշտպաններ', 15, { stat: { k: 'stamina', v: 0.3 } }),
  it('eq_rope', 'equipment', 'Comba para saltar', 'Ցատկապարան', 12, { stat: { k: 'stamina', v: 0.4 } }),
  it('eq_cones', 'equipment', 'Conos de entrenamiento', 'Մարզչական կոններ', 20, { stat: { k: 'technique', v: 0.4 } }),
  it('room_poster', 'room', 'Póster del estadio', 'Մարզադաշտի պաստառ', 15),
  it('room_lamp', 'room', 'Lámpara naranja', 'Նարնջագույն լամպ', 25),
  it('room_trophy', 'room', 'Estantería de trofeos', 'Գավաթների դարակ', 60),
  it('room_plant', 'room', 'Planta grande', 'Մեծ բույս', 18),
  it('room_rug', 'room', 'Alfombra con un balón', 'Գնդակի պատկերով գորգ', 30),
  it('room_tv', 'room', 'Televisor grande', 'Մեծ հեռուստացույց', 150),
];

/** Menus for ordering food in the cafeteria and the restaurant. */
export interface MenuItem {
  id: string;
  /** with article, as you say it when ordering: "un zumo de naranja" */
  es: string;
  hy: string;
  name: string;
  price: number;
  kind: 'drink' | 'food' | 'dessert';
}
const mi = (id: string, es: string, name: string, hy: string, price: number, kind: MenuItem['kind']): MenuItem => ({ id, es, name, hy, price, kind });
export const MENUS: Record<'cafe' | 'restaurant', MenuItem[]> = {
  cafe: [
    mi('cafe', 'un café con leche', 'Café con leche', 'կաթով սուրճ', 1.5, 'drink'),
    mi('zumo', 'un zumo de naranja', 'Zumo de naranja', 'նարնջի հյութ', 2, 'drink'),
    mi('agua', 'una botella de agua', 'Agua', 'մեկ շիշ ջուր', 1, 'drink'),
    mi('chocolate', 'un chocolate caliente', 'Chocolate caliente', 'տաք շոկոլադ', 2.2, 'drink'),
    mi('bocadillo', 'un bocadillo de pollo', 'Bocadillo de pollo', 'հավով սենդվիչ', 3.5, 'food'),
    mi('tostada', 'una tostada con tomate', 'Tostada con tomate', 'լոլիկով տոստ', 2.2, 'food'),
    mi('croissant', 'un cruasán', 'Cruasán', 'կրուասան', 1.8, 'food'),
    mi('churros', 'unos churros', 'Churros', 'չուռոս', 3, 'dessert'),
  ],
  restaurant: [
    mi('gazpacho', 'un gazpacho', 'Gazpacho', 'գասպաչո (սառը ապուր)', 4.5, 'food'),
    mi('ensalada', 'una ensalada mixta', 'Ensalada mixta', 'խառը աղցան', 5, 'food'),
    mi('paella', 'una paella valenciana', 'Paella valenciana', 'վալենսիական պաելյա', 12, 'food'),
    mi('tortilla', 'una tortilla de patatas', 'Tortilla de patatas', 'կարտոֆիլով ձվածեղ', 6.5, 'food'),
    mi('pescado', 'un pescado a la plancha', 'Pescado a la plancha', 'գրիլ արված ձուկ', 11, 'food'),
    mi('limonada', 'una limonada', 'Limonada', 'լիմոնադ', 2.5, 'drink'),
    mi('agua_r', 'una botella de agua', 'Agua', 'մեկ շիշ ջուր', 1.5, 'drink'),
    mi('flan', 'un flan casero', 'Flan casero', 'տնական ֆլան', 3.5, 'dessert'),
  ],
};
