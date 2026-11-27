// Story chapters and 60 missions. Steps are interpreted by MissionRunner.
import type { Tr } from '../../i18n/T';
import type { CityId } from '../state';
import type { InteriorKind } from './places';
import type { Exchange, Option } from './npcs';

export type FootballMode = 'free' | 'penalty' | 'freekick' | 'match' | 'dribble' | 'goalkeeper';

export type Step =
  | { k: 'reach'; place: string; text: Tr; door?: boolean; r?: number }
  | { k: 'point'; x: number; z: number; text: Tr; r?: number }
  | { k: 'enter'; interior: InteriorKind; text: Tr }
  | { k: 'item'; ids: string[]; text: Tr }
  | { k: 'talk'; npc: string; text: Tr; ex: Exchange[]; outro?: Tr }
  | { k: 'vehicle'; vtype: 'bike' | 'car' | 'any'; text: Tr }
  | { k: 'route'; points: [number, number][]; text: Tr; time?: number; vtype?: 'bike' | 'car' | 'foot' | 'any'; hints?: Tr[]; lights?: boolean }
  | { k: 'shop'; list: string[]; text: Tr }
  | { k: 'table'; place: 'cafe' | 'restaurant'; text: Tr }
  | { k: 'goals'; n: number; mode: FootballMode; text: Tr }
  | { k: 'quiz'; topic: string | null; n: number; npc: string; text: Tr }
  | { k: 'train'; text: Tr }
  | { k: 'cinema'; text: Tr }
  | { k: 'travel'; city: CityId; text: Tr }
  | { k: 'worlditem'; id: string; x: number; z: number; label: Tr; text: Tr };

export interface Mission {
  id: string;
  chapter: number;
  title: Tr;
  brief: Tr;
  city: CityId;
  xp: number;
  money: number;
  steps: Step[];
  /** side missions do not block chapter progression */
  side?: boolean;
}

export const CHAPTERS: Tr[] = [
  { es: 'Capítulo 1. Una nueva aventura', hy: 'Գլուխ 1. Նոր արկած' },
  { es: 'Capítulo 2. Mi primer entrenamiento', hy: 'Գլուխ 2. Իմ առաջին մարզումը' },
  { es: 'Capítulo 3. La vida en la ciudad', hy: 'Գլուխ 3. Կյանքը քաղաքում' },
  { es: 'Capítulo 4. Un partido importante', hy: 'Գլուխ 4. Կարևոր խաղ' },
  { es: 'Capítulo 5. El viaje a Madrid', hy: 'Գլուխ 5. Ճամփորդություն դեպի Մադրիդ' },
  { es: 'Capítulo 6. La gran competición', hy: 'Գլուխ 6. Մեծ մրցույթը' },
  { es: 'Capítulo 7. El sueño de RAZ', hy: 'Գլուխ 7. ՌԱԶ-ի երազանքը' },
];

const t = (es: string, hy: string): Tr => ({ es, hy });
const o = (es: string, hy: string, ok = false): Option => ({ es, hy, ok });
const choice = (npc: Tr, options: Option[], extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'choice', options, ...extra });
const listen = (npc: Tr, options: Option[], extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'listen', options, ...extra });
const build = (npc: Tr, answer: Tr, extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'build', answer, ...extra });
const order = (npc: Tr, lines: Tr[], extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'order', lines, ...extra });

// training base centre (block 5,1) = (200,-120); stadium (120,-120); home door (-40, 50.6); park (40,40)
const TRAIN: [number, number] = [200, -120];

const BIKE_RACE: [number, number][] = [
  [-28, 54],
  [0, 40],
  [0, 0],
  [80, 0],
  [80, -80],
  [160, -80],
  [160, 0],
  [240, 0],
  [240, 80],
  [160, 80],
];
const BIKE_HINTS: Tr[] = [
  t('Sigue recto por el carril bici.', 'Շարունակիր ուղիղ հեծանվային գծով։'),
  t('Gira a la izquierda.', 'Թեքվիր ձախ։'),
  t('Ten cuidado con los coches.', 'Զգույշ եղիր մեքենաներից։'),
  t('Gira a la derecha y reduce la velocidad.', 'Թեքվիր աջ և նվազեցրու արագությունը։'),
  t('Adelanta al ciclista.', 'Առաջ անցիր հեծանվորդից։'),
  t('Continúa hasta el puente.', 'Շարունակիր մինչև կամուրջը։'),
  t('No te salgas del camino.', 'Ճանապարհից դուրս մի՛ գնա։'),
  t('Gira a la izquierda en el cruce.', 'Խաչմերուկում թեքվիր ձախ։'),
  t('¡Ya casi llegas! Sigue recto.', 'Գրեթե հասար։ Շարունակիր ուղիղ։'),
  t('¡Meta! ¡Muy bien!', 'Վերջնագիծ։ Շատ լավ է։'),
];

const DRIVE_ROUTE: [number, number][] = [
  [-80, -74],
  [-80, 80],
  [80, 80],
  [80, 160],
  [-120, 160],
  [-120, -14],
];
const DRIVE_HINTS: Tr[] = [
  t('Sube al coche y sigue recto.', 'Նստիր մեքենան և շարունակիր ուղիղ։'),
  t('En el semáforo, gira a la izquierda.', 'Լուսացույցի մոտ թեքվիր ձախ։'),
  t('Para en el semáforo en rojo.', 'Կանգնիր կարմիր լույսի տակ։'),
  t('Gira a la derecha y cruza el puente.', 'Թեքվիր աջ և անցիր կամուրջը։'),
  t('Sigue recto y busca el aparcamiento.', 'Շարունակիր ուղիղ և փնտրիր կայանատեղին։'),
  t('Aparca en una plaza libre.', 'Կայանիր ազատ տեղում։'),
];

const interview = (city: string): Exchange[] => [
  listen(t('¿Cómo te sientes?', 'Ինչպե՞ս ես քեզ զգում։'), [o('Me siento muy feliz.', 'Ինձ շատ երջանիկ եմ զգում։', true), o('Me siento la portería.', '(անհեթեթ)'), o('Siento mañana.', '(սխալ)')], { topic: 'reflexivos' }),
  choice(t('¿Cómo ha sido el partido?', 'Ինչպիսի՞ն էր խաղը։'), [o('Ha sido un partido muy difícil, pero hemos ganado.', 'Շատ դժվար խաղ էր, բայց հաղթեցինք։', true), o('Será un partido difícil ayer.', '(սխալ ժամանակ)'), o('Es partido mucho difícil.', '(սխալ՝ mucho)')], { topic: 'perfecto', explain: t('Hoy → pretérito perfecto: ha sido, hemos ganado.', 'Այսօր → pretérito perfecto՝ ha sido, hemos ganado։') }),
  choice(t('¿Cuántos goles has marcado?', 'Քանի՞ գոլ ես խփել։'), [o('He marcado dos goles.', 'Երկու գոլ եմ խփել։', true), o('He marcado dos porteros.', '(անհեթեթ)'), o('Marco dos goles ayer.', '(սխալ)')], { topic: 'perfecto' }),
  build(t('¿Qué has aprendido?', 'Ի՞նչ ես սովորել։'), t('He aprendido a confiar en mis compañeros', 'Սովորել եմ վստահել թիմակիցներիս'), { topic: 'perfecto' }),
  choice(t(`¿Qué harás mañana en ${city}?`, `Ի՞նչ կանես վաղը ${city}-ում։`), [o('Mañana entrenaré otra vez.', 'Վաղը նորից կմարզվեմ։', true), o('Mañana entrené otra vez.', '(սխալ ժամանակ)'), o('Mañana entrenaba.', '(սխալ ժամանակ)')], { topic: 'futuro' }),
];

const cafeOrder: Exchange[] = [
  listen(t('¿Qué quieres tomar?', 'Ի՞նչ ես ուզում խմել/ուտել։'), [o('Quiero un zumo de naranja, por favor.', 'Մի նարնջի հյութ եմ ուզում, խնդրում եմ։', true), o('Quiero una mesa de naranja.', '(անհեթեթ)'), o('Soy un zumo, por favor.', '(սխալ)')]),
  build(t('¿Algo más?', 'Էլի ինչ-որ բա՞ն։'), t('Sí un bocadillo de pollo', 'Այո, մեկ հավով սենդվիչ')),
  choice(t('¿Para tomar aquí o para llevar?', 'Այստե՞ղ, թե՞ տանելու համար։'), [o('Para tomar aquí.', 'Այստեղ ուտելու համար։', true), o('Por tomar aquí.', '(սխալ՝ por)'), o('Para llevar ayer.', '(անհեթեթ)')], { topic: 'porpara', explain: t('Finalidad → para.', 'Նպատակ → para։') }),
  choice(t('Aquí tienes. ¡Que aproveche!', 'Խնդրեմ։ Բարի ախորժակ։'), [o('Gracias. ¿Me trae la cuenta, por favor?', 'Շնորհակալություն։ Հաշիվը կբերե՞ք, խնդրում եմ։', true), o('Gracias. ¿Me lleva la cuenta?', '(սխալ՝ llevar)'), o('Adiós, me voy sin pagar.', '(անքաղաքավարի)')], { topic: 'llevartraer', explain: t('La cuenta viene hacia mí → traer.', 'Հաշիվը գալիս է դեպի ինձ → traer։') }),
  order(t('Ordena cómo pagas:', 'Դասավորիր՝ ինչպես ես վճարում.'), [t('— Son cinco euros con cincuenta.', '— Հինգ եվրո հիսուն ցենտ։'), t('— ¿Puedo pagar con tarjeta?', '— Կարո՞ղ եմ քարտով վճարել։'), t('— Sí, claro.', '— Այո, իհարկե։'), t('— Muchas gracias. ¡Adiós!', '— Շատ շնորհակալություն։ Ցտեսություն։')]),
];

const restaurantOrder: Exchange[] = [
  choice(t('Buenas noches. ¿Qué vas a pedir de primero?', 'Բարի երեկո։ Ի՞նչ ես պատվիրելու որպես առաջին ուտեստ։'), [o('De primero, una ensalada mixta.', 'Առաջինի համար՝ խառը աղցան։', true), o('De primero, la cuenta.', '(անհեթեթ)'), o('Primero soy ensalada.', '(սխալ)')]),
  listen(t('¿Y de segundo?', 'Իսկ երկրորդի համա՞ր։'), [o('De segundo, paella valenciana.', 'Երկրորդի համար՝ վալենսիական պաելյա։', true), o('De segundo, un balón.', '(անհեթեթ)'), o('Segundo es paella ayer.', '(սխալ)')]),
  choice(t('¿Qué tal está la paella?', 'Ինչպե՞ս է պաելյան։'), [o('¡Está muy buena!', 'Շատ համեղ է։', true), o('¡Está muy bien la paella buena!', '(անբնական)'), o('¡Es mucho buena!', '(սխալ)')], { topic: 'bienbueno' }),
  build(t('¿Quieres postre?', 'Աղանդեր ուզո՞ւմ ես։'), t('Sí quiero un flan por favor', 'Այո, մի ֆլան եմ ուզում, խնդրում եմ')),
];

const tourist: Exchange[] = [
  choice(t('Perdona, ¿sabes dónde está el estadio?', 'Ներողություն, գիտե՞ս, թե որտեղ է մարզադաշտը։'), [o('Sí, claro. Está cerca de aquí.', 'Այո, իհարկե։ Մոտ է այստեղից։', true), o('Sí, es cerca de aquí.', '(սխալ՝ ser)'), o('No, tengo hambre.', 'Ոչ, քաղցած եմ։')], { topic: 'serestar', explain: t('Ubicación → estar.', 'Գտնվելու վայր → estar։') }),
  order(t('Explícale el camino. Ordena las instrucciones:', 'Բացատրիր ճանապարհը։ Դասավորիր հրահանգները.'), [t('Sigue recto por esta calle.', 'Շարունակիր ուղիղ այս փողոցով։'), t('En el semáforo, gira a la derecha.', 'Լուսացույցի մոտ թեքվիր աջ։'), t('Cruza la calle.', 'Անցիր փողոցը։'), t('El estadio está a la izquierda.', 'Մարզադաշտը ձախ կողմում է։')], { topic: 'imperativo' }),
  build(t('¿Está lejos?', 'Հեռո՞ւ է։'), t('No está a diez minutos andando', 'Ոչ, տասը րոպե ոտքով է')),
  choice(t('¡Muchas gracias por tu ayuda!', 'Շատ շնորհակալ եմ օգնությանդ համար։'), [o('¡De nada! ¡Buen viaje!', 'Չարժե։ Բարի ճանապարհ։', true), o('¡Por nada para ti!', '(անբնական)'), o('Gracias para tu ayuda.', '(սխալ՝ para)')]),
];

const airport: Exchange[] = [
  listen(t('Buenos días. ¿Me enseña su pasaporte y su billete, por favor?', 'Բարի լույս։ Ցույց կտա՞ք ձեր անձնագիրն ու տոմսը։'), [o('Sí, aquí tiene mi pasaporte y mi billete.', 'Այո, խնդրեմ՝ անձնագիրս ու տոմսս։', true), o('Sí, aquí tiene mi balón.', 'Այո, խնդրեմ՝ գնդակս։'), o('No, soy el billete.', '(անհեթեթ)')]),
  choice(t('¿Cuántas maletas lleva?', 'Քանի՞ ճամպրուկ ունեք։'), [o('Llevo una maleta y una mochila.', 'Մեկ ճամպրուկ և մեկ պայուսակ ունեմ։', true), o('Traigo una maleta a usted aquí allí.', '(անբնական)'), o('Llevo tres aviones.', '(անհեթեթ)')], { topic: 'llevartraer' }),
  choice(t('¿Prefiere ventanilla o pasillo?', 'Պատուհանի՞ մոտ եք նախընտրում, թե՞ միջանցքի։'), [o('Ventanilla, por favor.', 'Պատուհանի մոտ, խնդրում եմ։', true), o('Pasillo de naranja.', '(անհեթեթ)'), o('Prefiero la cocina.', 'Խոհանոցն եմ նախընտրում։')]),
  listen(t('Su vuelo sale por la puerta B12 a las diez y media.', 'Ձեր չվերթը մեկնում է B12 դարպասից ժամը տասն անց կեսին։'), [o('Puerta B12, a las diez y media.', 'B12 դարպաս, ժամը տասն անց կես։', true), o('Puerta A3, a las ocho.', 'A3 դարպաս, ժամը ութին։'), o('Puerta C7, a mediodía.', 'C7 դարպաս, կեսօրին։')]),
];
const security: Exchange[] = [
  choice(t('¿Lleva líquidos en la mochila?', 'Պայուսակում հեղուկներ ունե՞ք։'), [o('Solo llevo una botella de agua vacía.', 'Միայն դատարկ ջրի շիշ ունեմ։', true), o('Llevo el mar.', '(անհեթեթ)'), o('Sí, llevo ningún.', '(սխալ)')]),
  build(t('Muy bien. Pase, por favor.', 'Շատ լավ։ Անցեք, խնդրում եմ։'), t('Gracias que tenga un buen día', 'Շնորհակալություն, լավ օր եմ մաղթում')),
];
const plane: Exchange[] = [
  choice(t('(En el avión) ¿Qué desea tomar?', '(Ինքնաթիռում) Ի՞նչ կցանկանաք։'), [o('Un bocadillo y un zumo, por favor.', 'Մեկ սենդվիչ և հյութ, խնդրում եմ։', true), o('Un asiento de pollo.', '(անհեթեթ)'), o('Quiero bajar del avión ahora.', 'Ուզում եմ հիմա իջնել ինքնաթիռից։')]),
];

const trainTicket: Exchange[] = [
  choice(t('¿Adónde quieres viajar?', 'Ո՞ւր ես ուզում մեկնել։'), [o('Quiero un billete para Madrid, por favor.', 'Մեկ տոմս դեպի Մադրիդ, խնդրում եմ։', true), o('Quiero un billete por Madrid.', '(սխալ՝ por)'), o('Quiero un tren de comer.', '(անհեթեթ)')], { topic: 'porpara', explain: t('Destino → para.', 'Նպատակակետ → para։') }),
  choice(t('¿Solo ida o ida y vuelta?', 'Միայն գնալու՞, թե՞ գնալու և վերադառնալու։'), [o('Ida y vuelta, por favor.', 'Գնալ-վերադառնալ, խնդրում եմ։', true), o('Llegada y vuelta.', '(սխալ)'), o('Solo vuelta ayer.', '(անհեթեթ)')], { topic: 'llegarvolver' }),
  listen(t('El tren sale a las nueve y llega a las once.', 'Գնացքը մեկնում է ժամը ինին և հասնում տասնմեկին։'), [o('Sale a las nueve y llega a las once.', 'Մեկնում է ինին, հասնում՝ տասնմեկին։', true), o('Sale a las once y llega a las nueve.', 'Մեկնում է տասնմեկին, հասնում՝ ինին։'), o('Sale a las diez.', 'Մեկնում է տասին։')]),
];

const coachTactics: Exchange[] = [
  listen(t('Cuando el rival tiene el balón, ¿qué haces?', 'Երբ մրցակիցն է տիրապետում գնդակին, ի՞նչ ես անում։'), [o('Recupero el balón y defiendo mi posición.', 'Հետ եմ վերցնում գնդակը և պաշտպանում իմ դիրքը։', true), o('Me siento en el banquillo.', 'Նստում եմ պահեստայինների նստարանին։'), o('Compro una camiseta.', 'Մարզաշապիկ եմ գնում։')]),
  build(t('Y cuando ves un espacio libre…', 'Իսկ երբ ազատ տարածություն ես տեսնում…'), t('Busco el espacio y pido el balón', 'Գնում եմ այդ տարածություն և խնդրում գնդակը'), { topic: 'presente' }),
  choice(t('Completa: «¡No ___ la concentración!»', 'Լրացրու՝ «Մի՛ ___ կենտրոնացումը»։'), [o('pierdas', 'մի կորցրու', true), o('pierdes', '(սխալ)'), o('perder', '(սխալ)')], { topic: 'imperativo', explain: t('Imperativo negativo: no + pierdas.', 'Ժխտական հրամայական՝ no + pierdas։') }),
  order(t('Ordena las órdenes del entrenador para un contraataque:', 'Դասավորիր մարզչի հրամանները հակագրոհի համար.'), [t('Recupera el balón.', 'Հետ վերցրու գնդակը։'), t('Pasa el balón.', 'Փոխանցիր գնդակը։'), t('Corre más rápido.', 'Ավելի արագ վազիր։'), t('Tira a portería.', 'Հարվածիր դարպասին։')], { topic: 'imperativo' }),
];

const lostBagClues: Record<string, Exchange[]> = {
  abuelo: [listen(t('Sí, vi a un chico con una mochila naranja. Iba hacia la playa.', 'Այո, տեսա մի տղայի՝ նարնջագույն պայուսակով։ Գնում էր դեպի լողափ։'), [o('Iba hacia la playa.', 'Գնում էր դեպի լողափ։', true), o('Iba hacia el aeropuerto.', 'Գնում էր դեպի օդանավակայան։'), o('Estaba en el cine.', 'Կինոթատրոնում էր։')], { topic: 'imperfecto' })],
  socorrista: [choice(t('¿Una mochila? Alguien ha dejado una mochila cerca de las sombrillas.', 'Պայուսա՞կ։ Ինչ-որ մեկը պայուսակ է թողել հովանոցների մոտ։'), [o('¡Gracias! Voy a buscarla cerca de las sombrillas.', 'Շնորհակալություն։ Կգնամ փնտրելու հովանոցների մոտ։', true), o('¿Has visto ninguna mochila?', '(սխալ՝ ninguna)'), o('Gracias, voy al cine.', 'Շնորհակալություն, գնում եմ կինո։')], { topic: 'alguno' })],
};

const M: Mission[] = [];
let n = 0;
const add = (chapter: number, city: CityId, es: string, hy: string, briefEs: string, briefHy: string, steps: Step[], xp = 80, money = 20) =>
  M.push({ id: 'm' + String(++n).padStart(2, '0'), chapter, city, title: t(es, hy), brief: t(briefEs, briefHy), steps, xp, money });

// ---------------- Chapter 1 ----------------
add(1, 'valencia', 'Encuentra tu bicicleta', 'Գտիր քո հեծանիվը', 'Sal de casa, gira a la izquierda y busca una bicicleta cerca del parque.', 'Դուրս արի տնից, թեքվիր ձախ և փնտրիր հեծանիվ այգու մոտ։', [
  { k: 'point', x: 0, z: 0, r: 0, text: t('Busca tu bicicleta cerca del parque.', 'Փնտրիր հեծանիվդ այգու մոտ։') },
  { k: 'vehicle', vtype: 'bike', text: t('Sube a la bicicleta (tecla F).', 'Նստիր հեծանիվը (F ստեղն)։') },
  { k: 'reach', place: 'training', r: 26, text: t('Ve en bicicleta a la ciudad deportiva.', 'Հեծանիվով գնա մարզաբազա։') },
], 60, 15);
add(1, 'valencia', 'Ve al entrenamiento', 'Գնա մարզման', 'Prepara tu mochila: toma la botella de agua y las botas. Después ve a la ciudad deportiva.', 'Պատրաստիր պայուսակդ՝ վերցրու ջրի շիշը և բութսերը։ Հետո գնա մարզաբազա։', [
  { k: 'enter', interior: 'home', text: t('Entra en tu casa.', 'Մտիր տուն։') },
  { k: 'item', ids: ['mochila', 'agua', 'botas'], text: t('Toma la mochila, la botella de agua y las botas de fútbol.', 'Վերցրու պայուսակը, ջրի շիշը և ֆուտբոլային բութսերը։') },
  { k: 'reach', place: 'training', r: 26, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
  { k: 'talk', npc: 'entrenador', text: t('Habla con el entrenador.', 'Խոսիր մարզչի հետ։'), ex: [
    choice(t('¿Estás preparado para entrenar?', 'Պատրա՞ստ ես մարզվելու։'), [o('Sí, estoy preparado.', 'Այո, պատրաստ եմ։', true), o('No, tengo hambre.', 'Ոչ, քաղցած եմ։'), o('Estoy en el supermercado.', 'Սուպերմարկետում եմ։'), o('Quiero comprar una camiseta.', 'Ուզում եմ մարզաշապիկ գնել։')], { topic: 'serestar', explain: t('Estado → estar: estoy preparado.', 'Վիճակ → estar՝ estoy preparado։') }),
    choice(t('¿Has traído el agua y las botas?', 'Ջուրն ու բութսերը բերե՞լ ես։'), [o('Sí, lo he traído todo.', 'Այո, ամեն ինչ բերել եմ։', true), o('Sí, lo he llevado todo aquí ayer.', '(սխալ)'), o('No, he traído un coche.', 'Ոչ, մեքենա եմ բերել։')], { topic: 'llevartraer' }),
  ], outro: t('¡Bien! Mañana empezamos de verdad.', 'Լավ է։ Վաղը իսկապես կսկսենք։') },
], 90, 20);
add(1, 'valencia', 'Compra en el supermercado', 'Գնումներ սուպերմարկետում', 'Mamá necesita algunas cosas. Ve al supermercado, busca los productos y paga en la caja.', 'Մայրիկին ինչ-որ բաներ են պետք։ Գնա սուպերմարկետ, գտիր ապրանքները և վճարիր դրամարկղում։', [
  { k: 'enter', interior: 'supermarket', text: t('Entra en el supermercado.', 'Մտիր սուպերմարկետ։') },
  { k: 'shop', list: ['leche', 'pan', 'manzanas', 'agua'], text: t('Busca los productos de la lista y ve a la caja.', 'Գտիր ցուցակի ապրանքները և գնա դրամարկղ։') },
], 100, 10);
add(1, 'valencia', 'En la cafetería', 'Սրճարանում', 'Busca una mesa libre en la cafetería, pide algo de comer y pide la cuenta.', 'Սրճարանում գտիր ազատ սեղան, պատվիրիր ուտելիք և խնդրիր հաշիվը։', [
  { k: 'enter', interior: 'cafe', text: t('Entra en la cafetería.', 'Մտիր սրճարան։') },
  { k: 'table', place: 'cafe', text: t('Busca una mesa libre y siéntate.', 'Գտիր ազատ սեղան և նստիր։') },
  { k: 'talk', npc: 'camarero', text: t('Habla con el camarero.', 'Խոսիր մատուցողի հետ։'), ex: cafeOrder, outro: t('¡Gracias a ti! ¡Hasta pronto!', 'Քեզ շնորհակալություն։ Առայժմ։') },
], 100, 10);
add(1, 'valencia', 'Un vecino simpático', 'Բարեհամբույր հարևանը', 'Don Manuel está en el parque. Habla con él sobre el pasado.', 'Դոն Մանուելը այգում է։ Խոսիր նրա հետ անցյալի մասին։', [
  { k: 'talk', npc: 'abuelo', text: t('Habla con Don Manuel en el parque.', 'Խոսիր Դոն Մանուելի հետ այգում։'), ex: [
    choice(t('Cuando yo tenía tu edad, no había móviles. ¿Qué hacías tú de pequeño?', 'Երբ ես քո տարիքին էի, բջջայիններ չկային։ Իսկ դու ի՞նչ էիր անում փոքր ժամանակ։'), [o('Jugaba al fútbol con mis amigos.', 'Ընկերներիս հետ ֆուտբոլ էի խաղում։', true), o('Jugaré al fútbol de pequeño.', '(սխալ ժամանակ)'), o('He jugado de pequeño mañana.', '(սխալ)')], { topic: 'imperfecto', explain: t('Costumbre pasada → imperfecto.', 'Անցյալի սովորություն → imperfecto։') }),
    build(t('¿Y dónde vivías?', 'Իսկ որտե՞ղ էիր ապրում։'), t('Vivía en Armenia con mi familia', 'Ընտանիքիս հետ ապրում էի Հայաստանում'), { topic: 'imperfecto' }),
    listen(t('¡Qué interesante! Antes este parque era más pequeño.', 'Ինչ հետաքրքիր է։ Առաջ այս այգին ավելի փոքր էր։'), [o('Antes el parque era más pequeño.', 'Առաջ այգին ավելի փոքր էր։', true), o('Antes el parque era más grande.', 'Առաջ այգին ավելի մեծ էր։'), o('El parque será pequeño.', 'Այգին փոքր կլինի։')], { topic: 'comparativos' }),
  ] },
], 70, 10);
add(1, 'valencia', 'Mi mejor amigo', 'Իմ լավագույն ընկերը', 'Marco te espera en el parque. Después id juntos a la playa.', 'Մարկոն քեզ սպասում է այգում։ Հետո միասին գնացեք լողափ։', [
  { k: 'talk', npc: 'amigo', text: t('Habla con Marco en el parque.', 'Խոսիր Մարկոյի հետ այգում։'), ex: [
    choice(t('¡Hola, RAZ! ¿Qué estás haciendo?', 'Բարև, ՌԱԶ։ Ի՞նչ ես անում։'), [o('Estoy paseando por el parque.', 'Զբոսնում եմ այգում։', true), o('Estoy paseado por el parque.', '(սխալ)'), o('Soy paseando.', '(սխալ)')], { topic: 'estargerundio', explain: t('Estar + gerundio: paseando.', 'Estar + դերբայ՝ paseando։') }),
    build(t('¿Vamos a la playa?', 'Գնա՞նք լողափ։'), t('Sí vamos a la playa', 'Այո, գնանք լողափ')),
  ] },
  { k: 'reach', place: 'beach', r: 30, text: t('Ve a la playa.', 'Գնա լողափ։') },
], 70, 15);

// ---------------- Chapter 2 ----------------
add(2, 'valencia', 'Calentamiento', 'Մարմնամարզություն', 'El entrenador quiere ver tu velocidad. Corre por todos los conos.', 'Մարզիչն ուզում է տեսնել արագությունդ։ Վազիր բոլոր կոների միջով։', [
  { k: 'reach', place: 'training', r: 24, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
  { k: 'route', vtype: 'foot', time: 40, points: [[TRAIN[0] - 14, TRAIN[1] - 3], [TRAIN[0] - 6, TRAIN[1] + 3], [TRAIN[0] + 2, TRAIN[1] - 3], [TRAIN[0] + 10, TRAIN[1] + 3], [TRAIN[0] + 18, TRAIN[1] - 3], [TRAIN[0], TRAIN[1] + 12]], hints: [t('¡Corre más rápido!', 'Ավելի արագ վազիր։'), t('¡Muy bien, sigue!', 'Շատ լավ, շարունակիր։'), t('¡No te pares!', 'Մի՛ կանգնիր։'), t('¡Más rápido, RAZ!', 'Ավելի արագ, ՌԱԶ։'), t('¡Último cono!', 'Վերջին կոնը։'), t('¡Excelente!', 'Գերազանց է։')], text: t('Corre por los conos (Shift para correr).', 'Վազիր կոների միջով (Shift՝ վազելու համար)։') },
], 80, 15);
add(2, 'valencia', 'Primeros goles', 'Առաջին գոլերը', 'Ve al estadio y marca tres goles. Tira a portería.', 'Գնա մարզադաշտ և խփիր երեք գոլ։ Հարվածիր դարպասին։', [
  { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio.', 'Գնա մարզադաշտ։') },
  { k: 'goals', n: 3, mode: 'free', text: t('Marca 3 goles. Clic izquierdo o K para chutar.', 'Խփիր 3 գոլ։ Ձախ սեղմում կամ K՝ հարվածելու համար։') },
], 100, 20);
add(2, 'valencia', 'Penaltis con Iker', 'Պենալտիներ Իկերի հետ', 'Iker, el portero, quiere practicar penaltis contigo.', 'Դարպասապահ Իկերը ուզում է քեզ հետ պենալտի պարապել։', [
  { k: 'talk', npc: 'portero', text: t('Habla con Iker en el estadio.', 'Խոսիր Իկերի հետ մարզադաշտում։'), ex: [
    choice(t('¿Quieres tirar unos penaltis?', 'Ուզո՞ւմ ես մի քանի պենալտի խփել։'), [o('¡Sí! Quiero tirar unos penaltis.', 'Այո։ Ուզում եմ պենալտի խփել։', true), o('Sí, quiero tirar unas pizzas.', '(անհեթեթ)'), o('No sé tirar ningún.', '(սխալ)')]),
  ] },
  { k: 'goals', n: 3, mode: 'penalty', text: t('Marca 3 penaltis a Iker.', 'Խփիր 3 պենալտի Իկերին։') },
], 120, 25);
add(2, 'valencia', 'El médico del equipo', 'Թիմի բժիշկը', 'Antes de entrenar más, habla con el médico del equipo.', 'Նախքան շարունակելը, խոսիր թիմի բժշկի հետ։', [
  { k: 'talk', npc: 'medico', text: t('Habla con el doctor Gómez.', 'Խոսիր դոկտոր Գոմեսի հետ։'), ex: [
    choice(t('¿Cómo te encuentras hoy?', 'Ինչպե՞ս ես քեզ զգում այսօր։'), [o('Me encuentro bien, pero estoy un poco cansado.', 'Լավ եմ զգում, բայց մի քիչ հոգնած եմ։', true), o('Soy un poco cansado.', '(սխալ՝ ser)'), o('Me encuentro un balón.', '(անհեթեթ)')], { topic: 'serestar' }),
    listen(t('Tienes que beber mucha agua y dormir ocho horas.', 'Պետք է շատ ջուր խմես և ութ ժամ քնես։'), [o('Tengo que beber agua y dormir ocho horas.', 'Պետք է ջուր խմեմ և ութ ժամ քնեմ։', true), o('Tengo que comer pizza toda la noche.', 'Պետք է ամբողջ գիշեր պիցցա ուտեմ։'), o('Tengo que correr ocho horas.', 'Պետք է ութ ժամ վազեմ։')], { topic: 'tenerque' }),
    build(t('¿Qué vas a hacer esta noche?', 'Ի՞նչ ես անելու այս գիշեր։'), t('Voy a dormir ocho horas', 'Ութ ժամ եմ քնելու')),
  ] },
], 80, 10);
add(2, 'valencia', 'Carrera en bicicleta', 'Հեծանվային մրցարշավ', 'Carrera por la ciudad: pasa por todos los puntos de control antes de que se acabe el tiempo.', 'Մրցարշավ քաղաքով՝ անցիր բոլոր ստուգակետերով, մինչև ժամանակը կավարտվի։', [
  { k: 'vehicle', vtype: 'bike', text: t('Sube a tu bicicleta.', 'Նստիր հեծանիվդ։') },
  { k: 'route', vtype: 'bike', time: 150, points: BIKE_RACE, hints: BIKE_HINTS, text: t('¡Carrera! Sigue los puntos de control.', 'Մրցարշավ։ Հետևիր ստուգակետերին։') },
], 140, 30);
add(2, 'valencia', 'En el gimnasio', 'Մարզասրահում', 'Ve al gimnasio y haz un ejercicio para mejorar tus estadísticas.', 'Գնա մարզասրահ և արա վարժություն՝ ցուցանիշներդ բարելավելու համար։', [
  { k: 'enter', interior: 'gym', text: t('Entra en el gimnasio.', 'Մտիր մարզասրահ։') },
  { k: 'train', text: t('Usa una máquina del gimnasio.', 'Օգտագործիր մարզասրահի որևէ սարք։') },
], 80, 10);
add(2, 'valencia', 'Clase de español', 'Իսպաներենի դաս', 'En la escuela, la profesora Elena explica el pretérito indefinido.', 'Դպրոցում ուսուցչուհի Էլենան բացատրում է pretérito indefinido-ն։', [
  { k: 'enter', interior: 'school', text: t('Ve a la escuela.', 'Գնա դպրոց։') },
  { k: 'quiz', topic: 'indefinido', n: 3, npc: 'profesora', text: t('Responde a las preguntas de la profesora.', 'Պատասխանիր ուսուցչուհու հարցերին։') },
], 90, 10);

// ---------------- Chapter 3 ----------------
add(3, 'valencia', 'Conduce por la ciudad', 'Վարիր քաղաքով', 'Simulador de conducción: sigue la ruta, respeta los semáforos y aparca.', 'Վարման սիմուլյատոր՝ հետևիր երթուղուն, պահպանիր լուսացույցները և կայանիր։', [
  { k: 'vehicle', vtype: 'car', text: t('Sube a un coche (hay coches en el aparcamiento).', 'Նստիր մեքենա (կայանատեղիում մեքենաներ կան)։') },
  { k: 'route', vtype: 'car', lights: true, points: DRIVE_ROUTE, hints: DRIVE_HINTS, text: t('Sigue la ruta y para en los semáforos en rojo.', 'Հետևիր երթուղուն և կանգնիր կարմիր լույսի տակ։') },
], 140, 30);
add(3, 'valencia', 'Ayuda a un turista', 'Օգնիր զբոսաշրջիկին', 'Una turista está perdida en la Plaza Mayor. Explícale cómo llegar al estadio.', 'Մի զբոսաշրջիկ մոլորվել է Կենտրոնական հրապարակում։ Բացատրիր նրան, թե ինչպես հասնել մարզադաշտ։', [
  { k: 'talk', npc: 'turista', text: t('Habla con la turista en la Plaza Mayor.', 'Խոսիր զբոսաշրջիկի հետ Կենտրոնական հրապարակում։'), ex: tourist },
], 110, 20);
add(3, 'valencia', 'Pierdes tu mochila', 'Կորցնում ես պայուսակդ', '¡Has perdido tu mochila! Pregunta a la gente y sigue las pistas.', 'Կորցրել ես պայուսակդ։ Հարցրու մարդկանց և հետևիր հուշումներին։', [
  { k: 'talk', npc: 'abuelo', text: t('Pregunta a Don Manuel en el parque.', 'Հարցրու Դոն Մանուելին այգում։'), ex: [
    choice(t('¿Qué te pasa, joven?', 'Ի՞նչ է պատահել, երիտասարդ։'), [o('He perdido mi mochila. ¿La ha visto?', 'Պայուսակս կորցրել եմ։ Չե՞ք տեսել։', true), o('Perdo mi mochila.', '(սխալ)'), o('He perdido mi casa en la mochila.', '(անհեթեթ)')], { topic: 'perfecto' }),
    ...lostBagClues.abuelo,
  ] },
  { k: 'talk', npc: 'socorrista', text: t('Pregunta al socorrista de la playa.', 'Հարցրու լողափի փրկարարին։'), ex: [
    choice(t('¡Hola! ¿Necesitas ayuda?', 'Բարև։ Օգնություն պե՞տք է։'), [o('Sí. ¿Has visto alguna mochila naranja?', 'Այո։ Որևէ նարնջագույն պայուսակ չե՞ս տեսել։', true), o('Sí. ¿Has visto ninguna mochila?', '(սխալ՝ ninguna)'), o('No, gracias, estoy nadando.', 'Ոչ, շնորհակալություն, լողում եմ։')], { topic: 'alguno', explain: t('En preguntas usamos «alguna».', 'Հարցերում օգտագործում ենք «alguna»։') }),
    ...lostBagClues.socorrista,
  ] },
  { k: 'worlditem', id: 'mochila_perdida', x: 70, z: 282, label: t('Tomar tu mochila', 'Վերցնել պայուսակդ'), text: t('Busca la mochila cerca de las sombrillas.', 'Փնտրիր պայուսակը հովանոցների մոտ։') },
], 130, 30);
add(3, 'valencia', 'Cena en el restaurante', 'Ընթրիք ռեստորանում', 'Hoy cenas en el restaurante. Pide primero, segundo y postre.', 'Այսօր ընթրում ես ռեստորանում։ Պատվիրիր առաջին, երկրորդ ուտեստ և աղանդեր։', [
  { k: 'enter', interior: 'restaurant', text: t('Entra en el restaurante.', 'Մտիր ռեստորան։') },
  { k: 'table', place: 'restaurant', text: t('Siéntate en una mesa libre.', 'Նստիր ազատ սեղանի մոտ։') },
  { k: 'talk', npc: 'camarera_rest', text: t('Habla con la camarera.', 'Խոսիր մատուցողուհու հետ։'), ex: restaurantOrder },
], 110, 10);
add(3, 'valencia', 'Botas nuevas', 'Նոր բութսեր', 'Ve a la tienda de deportes y pregunta por unas botas.', 'Գնա սպորտային խանութ և հարցրու բութսերի մասին։', [
  { k: 'enter', interior: 'sportshop', text: t('Entra en la tienda de deportes.', 'Մտիր սպորտային խանութ։') },
  { k: 'talk', npc: 'vendedor', text: t('Habla con el vendedor.', 'Խոսիր վաճառողի հետ։'), ex: [
    choice(t('¡Hola! ¿En qué te puedo ayudar?', 'Բարև։ Ինչո՞վ կարող եմ օգնել։'), [o('Busco unas botas de fútbol.', 'Ֆուտբոլային բութսեր եմ փնտրում։', true), o('Busco unos botas.', '(սխալ սեռ)'), o('Busco el estadio aquí.', '(անտեղի)')]),
    choice(t('Tenemos estas negras y estas naranjas. ¿Cuáles te gustan más?', 'Ունենք այս սևերը և այս նարնջագույնները։ Որո՞նք են քեզ ավելի շատ դուր գալիս։'), [o('Me gustan más las naranjas.', 'Նարնջագույններն ինձ ավելի շատ են դուր գալիս։', true), o('Me gusta más mucho las naranjas.', '(սխալ)'), o('Me gustan más que.', '(անավարտ)')], { topic: 'comparativos' }),
    listen(t('Cuestan sesenta euros. Son las mejores para tirar a portería.', 'Արժեն վաթսուն եվրո։ Լավագույնն են դարպասին հարվածելու համար։'), [o('Cuestan sesenta euros.', 'Արժեն վաթսուն եվրո։', true), o('Cuestan dieciséis euros.', 'Արժեն տասնվեց եվրո։'), o('Cuestan seis euros.', 'Արժեն վեց եվրո։')]),
  ], outro: t('Puedes comprarlas en el mostrador cuando quieras.', 'Կարող ես գնել դրանք վաճառասեղանի մոտ, երբ ուզես։') },
], 90, 15);
add(3, 'valencia', 'En el taller', 'Ավտոարհեստանոցում', 'Tu bici hace un ruido raro. Explica el problema al mecánico.', 'Հեծանիվդ տարօրինակ ձայն է հանում։ Բացատրիր խնդիրը մեխանիկին։', [
  { k: 'enter', interior: 'workshop', text: t('Entra en el taller mecánico.', 'Մտիր ավտոարհեստանոց։') },
  { k: 'talk', npc: 'mecanico', text: t('Habla con Antonio, el mecánico.', 'Խոսիր մեխանիկ Անտոնիոյի հետ։'), ex: [
    build(t('Hola, ¿qué le pasa a tu bici?', 'Բարև, ի՞նչ է պատահել հեծանիվիդ։'), t('Mi bici hace un ruido raro', 'Հեծանիվս տարօրինակ ձայն է հանում')),
    choice(t('¿Desde cuándo hace ese ruido?', 'Երբվանի՞ց է այդ ձայնը։'), [o('Desde ayer.', 'Երեկվանից։', true), o('Desde mañana.', '(սխալ)'), o('Hasta ayer mañana.', '(անհեթեթ)')], { topic: 'marcadores' }),
    listen(t('Vale. Vuelve mañana a las cinco y estará lista.', 'Լավ։ Վաղը ժամը հինգին վերադարձիր, պատրաստ կլինի։'), [o('Vuelvo mañana a las cinco.', 'Վաղը ժամը հինգին կվերադառնամ։', true), o('Llego hoy a las tres.', 'Այսօր ժամը երեքին կհասնեմ։'), o('Vuelvo el lunes a las diez.', 'Երկուշաբթի ժամը տասին կվերադառնամ։')], { topic: 'llegarvolver' }),
  ] },
], 90, 15);
add(3, 'valencia', 'Una tarde de cine', 'Կինոյի երեկո', 'Ve al cine, mira la película y responde a las preguntas.', 'Գնա կինոթատրոն, դիտիր ֆիլմը և պատասխանիր հարցերին։', [
  { k: 'enter', interior: 'cinema', text: t('Entra en el cine.', 'Մտիր կինոթատրոն։') },
  { k: 'cinema', text: t('Siéntate y mira la película.', 'Նստիր և դիտիր ֆիլմը։') },
], 100, 10);
add(3, 'valencia', 'El taxista', 'Տաքսու վարորդը', 'Paco, el taxista, te pregunta adónde vas.', 'Տաքսու վարորդ Պակոն հարցնում է՝ ուր ես գնում։', [
  { k: 'talk', npc: 'taxista', text: t('Habla con Paco en el aparcamiento.', 'Խոսիր Պակոյի հետ կայանատեղիում։'), ex: [
    build(t('¡Buenas! ¿Adónde vamos?', 'Բարև ձեզ։ Ո՞ւր ենք գնում։'), t('Al estadio por favor', 'Դեպի մարզադաշտ, խնդրում եմ'), { topic: 'porpara' }),
    choice(t('¿Vamos por el centro o por la playa?', 'Կենտրոնո՞վ գնանք, թե՞ լողափով։'), [o('Por el centro, es más rápido.', 'Կենտրոնով, ավելի արագ է։', true), o('Para el centro, es más rápido.', '(սխալ՝ para)'), o('Por el centro, es más rápida.', '(սխալ սեռ)')], { topic: 'porpara' }),
    listen(t('Son ocho euros con veinte.', 'Ութ եվրո քսան ցենտ է։'), [o('Ocho euros con veinte.', 'Ութ եվրո քսան։', true), o('Dieciocho euros.', 'Տասնութ եվրո։'), o('Ochenta euros.', 'Ութսուն եվրո։')]),
  ] },
], 80, 10);
add(3, 'valencia', 'Día de playa', 'Լողափի օր', 'Hace mucho calor. Ve a la playa y habla con el socorrista.', 'Շատ շոգ է։ Գնա լողափ և խոսիր փրկարարի հետ։', [
  { k: 'reach', place: 'beach', r: 30, text: t('Ve a la playa.', 'Գնա լողափ։') },
  { k: 'talk', npc: 'socorrista', text: t('Habla con Álex, el socorrista.', 'Խոսիր փրկարար Ալեքսի հետ։'), ex: [
    choice(t('Hoy hace mucho sol. ¿Llevas crema?', 'Այսօր շատ արևոտ է։ Կրեմ ունե՞ս։'), [o('Sí, siempre llevo crema a la playa.', 'Այո, միշտ կրեմ եմ տանում լողափ։', true), o('Sí, siempre traigo crema al estadio de la playa.', '(անբնական)'), o('No, llevo ninguna.', '(սխալ)')], { topic: 'llevartraer' }),
    listen(t('La bandera está verde: puedes bañarte.', 'Դրոշը կանաչ է՝ կարող ես լողալ։'), [o('La bandera está verde.', 'Դրոշը կանաչ է։', true), o('La bandera está roja.', 'Դրոշը կարմիր է։'), o('No hay bandera.', 'Դրոշ չկա։')]),
  ] },
], 80, 15);
add(3, 'valencia', 'Ingredientes para la paella', 'Պաելյայի բաղադրիչները', 'Mamá quiere cocinar paella. Compra los ingredientes.', 'Մայրիկը ուզում է պաելյա պատրաստել։ Գնիր բաղադրիչները։', [
  { k: 'enter', interior: 'supermarket', text: t('Ve al supermercado.', 'Գնա սուպերմարկետ։') },
  { k: 'shop', list: ['arroz', 'pollo', 'tomates', 'aceite'], text: t('Compra arroz, pollo, tomates y aceite.', 'Գնիր բրինձ, հավ, լոլիկ և յուղ։') },
  { k: 'enter', interior: 'home', text: t('Lleva la compra a casa.', 'Գնումները տար տուն։') },
  { k: 'talk', npc: 'mama', text: t('Dale la compra a mamá.', 'Գնումները տուր մայրիկին։'), ex: [
    choice(t('¡Gracias! ¿Lo has traído todo?', 'Շնորհակալություն։ Ամեն ինչ բերե՞լ ես։'), [o('Sí, he traído arroz, pollo, tomates y aceite.', 'Այո, բերել եմ բրինձ, հավ, լոլիկ և յուղ։', true), o('Sí, he llevado todo a la tienda.', '(անտրամաբանական)'), o('Sí, traeré ayer.', '(սխալ)')], { topic: 'llevartraer' }),
  ] },
], 120, 15);

// ---------------- Chapter 4 ----------------
add(4, 'valencia', 'La táctica del entrenador', 'Մարզչի մարտավարությունը', 'El sábado hay un partido importante. Escucha la táctica del entrenador.', 'Շաբաթ օրը կարևոր խաղ է։ Լսիր մարզչի մարտավարությունը։', [
  { k: 'reach', place: 'training', r: 24, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
  { k: 'talk', npc: 'entrenador', text: t('Habla con el entrenador.', 'Խոսիր մարզչի հետ։'), ex: coachTactics },
], 120, 20);
add(4, 'valencia', 'Circuito de regate', 'Դրիբլինգի շրջան', 'Lleva el balón pegado al pie y pasa por todas las marcas.', 'Գնդակը պահիր ոտքիդ մոտ և անցիր բոլոր նշաններով։', [
  { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio.', 'Գնա մարզադաշտ։') },
  { k: 'goals', n: 1, mode: 'dribble', text: t('Regatea con el balón por las marcas naranjas.', 'Դրիբլինգ արա գնդակով նարնջագույն նշանների միջով։') },
], 120, 20);
add(4, 'valencia', 'Tiros libres', 'Տուգանային հարվածներ', 'Practica tiros libres: el balón tiene que pasar por encima de la barrera.', 'Պարապիր տուգանայիններ՝ գնդակը պետք է անցնի պատնեշի վրայով։', [
  { k: 'goals', n: 2, mode: 'freekick', text: t('Marca 2 goles de tiro libre. Mantén pulsado para más fuerza.', 'Խփիր 2 գոլ տուգանայինից։ Պահիր սեղմած՝ ավելի ուժեղ հարվածի համար։') },
], 140, 25);
add(4, 'valencia', 'Un partido importante', 'Կարևոր խաղ', 'Partido contra el Atlético del Puerto. Gana marcando 3 goles.', 'Խաղ «Ատլետիկո դել Պուերտո»-ի դեմ։ Հաղթիր՝ խփելով 3 գոլ։', [
  { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio para el partido.', 'Գնա մարզադաշտ խաղի համար։') },
  { k: 'goals', n: 3, mode: 'match', text: t('Marca 3 goles antes de que termine el partido.', 'Խփիր 3 գոլ, մինչև խաղի ավարտը։') },
], 200, 50);
add(4, 'valencia', 'Una entrevista deportiva', 'Սպորտային հարցազրույց', 'Después del partido, una periodista quiere entrevistarte.', 'Խաղից հետո լրագրողը ուզում է քեզնից հարցազրույց վերցնել։', [
  { k: 'talk', npc: 'periodista', text: t('Habla con la periodista en el estadio.', 'Խոսիր լրագրողի հետ մարզադաշտում։'), ex: interview('Valencia') },
], 140, 30);
add(4, 'valencia', 'La academia', 'Ակադեմիան', 'El director de la academia ha visto el partido. Quiere hablar contigo.', 'Ակադեմիայի տնօրենը տեսել է խաղը։ Ուզում է խոսել քեզ հետ։', [
  { k: 'enter', interior: 'academy', text: t('Ve a la academia de fútbol.', 'Գնա ֆուտբոլի ակադեմիա։') },
  { k: 'talk', npc: 'director', text: t('Habla con Don Ramón.', 'Խոսիր Դոն Ռամոնի հետ։'), ex: [
    choice(t('Juegas muy bien. ¿Cuánto tiempo llevas jugando?', 'Շատ լավ ես խաղում։ Որքա՞ն ժամանակ է՝ խաղում ես։'), [o('Llevo seis años jugando al fútbol.', 'Արդեն վեց տարի է՝ ֆուտբոլ եմ խաղում։', true), o('Llevo seis años jugar.', '(սխալ)'), o('Sigo seis años.', '(սխալ)')], { topic: 'llevargerundio' }),
    listen(t('Hay un torneo nacional en Madrid. Si juegas bien, podrás entrar en la academia.', 'Մադրիդում ազգային մրցաշար կա։ Եթե լավ խաղաս, կկարողանաս ընդունվել ակադեմիա։'), [o('Hay un torneo en Madrid.', 'Մադրիդում մրցաշար կա։', true), o('Hay un torneo en Sevilla.', 'Սևիլյայում մրցաշար կա։'), o('No hay ningún torneo.', 'Ոչ մի մրցաշար չկա։')]),
    build(t('¿Qué harás para prepararte?', 'Ի՞նչ կանես պատրաստվելու համար։'), t('Entrenaré todos los días', 'Ամեն օր կմարզվեմ'), { topic: 'futuro' }),
  ], outro: t('Muy bien. ¡Nos vemos en Madrid!', 'Շատ լավ։ Կհանդիպենք Մադրիդում։') },
], 160, 40);

// ---------------- Chapter 5 ----------------
add(5, 'valencia', 'Prepara el viaje', 'Պատրաստվիր ճամփորդությանը', 'Habla con mamá antes de viajar a Madrid.', 'Խոսիր մայրիկի հետ՝ նախքան Մադրիդ մեկնելը։', [
  { k: 'enter', interior: 'home', text: t('Ve a casa.', 'Գնա տուն։') },
  { k: 'talk', npc: 'mama', text: t('Habla con mamá.', 'Խոսիր մայրիկի հետ։'), ex: [
    choice(t('¿Qué vas a llevar a Madrid?', 'Ի՞նչ ես տանելու Մադրիդ։'), [o('Voy a llevar las botas y dos camisetas.', 'Տանելու եմ բութսերը և երկու մարզաշապիկ։', true), o('Voy a traer las botas a Madrid.', '(սխալ՝ traer)'), o('Voy a venir las botas.', '(սխալ)')], { topic: 'llevartraer', explain: t('Hacia otro lugar → llevar.', 'Դեպի այլ վայր → llevar։') }),
    listen(t('Cuando llegues a Madrid, llámame.', 'Երբ հասնես Մադրիդ, զանգիր ինձ։'), [o('Te llamo cuando llegue a Madrid.', 'Կզանգեմ, երբ հասնեմ Մադրիդ։', true), o('Te llamo cuando vuelva de la playa.', 'Կզանգեմ, երբ վերադառնամ լողափից։'), o('No te llamo nunca.', 'Երբեք չեմ զանգի։')], { topic: 'llegarvolver' }),
  ] },
], 90, 15);
add(5, 'valencia', 'Billete de tren', 'Գնացքի տոմս', 'Ve a la estación y compra un billete.', 'Գնա կայարան և տոմս գնիր։', [
  { k: 'enter', interior: 'station', text: t('Ve a la estación de tren.', 'Գնա երկաթուղային կայարան։') },
  { k: 'talk', npc: 'taquilla_tren', text: t('Habla con la vendedora de billetes.', 'Խոսիր տոմսավաճառուհու հետ։'), ex: trainTicket },
], 110, 10);
add(5, 'valencia', 'Viaje en avión', 'Ճամփորդություն ինքնաթիռով', 'El club paga el avión a Madrid. Factura, pasa el control y busca tu puerta.', 'Ակումբը վճարում է Մադրիդի ինքնաթիռի համար։ Գրանցվիր, անցիր ստուգումը և գտիր դարպասդ։', [
  { k: 'enter', interior: 'airport', text: t('Ve al aeropuerto.', 'Գնա օդանավակայան։') },
  { k: 'talk', npc: 'azafata', text: t('Factura en el mostrador.', 'Գրանցվիր վաճառասեղանի մոտ։'), ex: airport },
  { k: 'talk', npc: 'seguridad', text: t('Pasa el control de seguridad.', 'Անցիր անվտանգության ստուգումը։'), ex: [...security, ...plane] },
  { k: 'travel', city: 'madrid', text: t('Ve a la puerta de embarque B12 y viaja a Madrid.', 'Գնա B12 նստեցման դարպաս և մեկնիր Մադրիդ։') },
], 200, 30);

const cityBlock = (city: CityId, cityEs: string, cityHy: string, chapter: number, extra: { landmark: Tr; local: Exchange[] }) => {
  add(chapter, city, `Llegada a ${cityEs}`, `Ժամանում ${cityHy}`, `Ya estás en ${cityEs}. Visita la Plaza Mayor.`, `Արդեն ${cityHy}-ում ես։ Այցելիր Կենտրոնական հրապարակ։`, [
    { k: 'reach', place: 'plaza', r: 30, text: extra.landmark },
    { k: 'talk', npc: 'turista', text: t('Habla con la chica de la plaza.', 'Խոսիր հրապարակում գտնվող աղջկա հետ։'), ex: extra.local },
  ], 100, 20);
  add(chapter, city, `Entrenamiento en ${cityEs}`, `Մարզում ${cityHy}-ում`, 'Entrena en la ciudad deportiva y escucha al entrenador.', 'Մարզվիր մարզաբազայում և լսիր մարզչին։', [
    { k: 'reach', place: 'training', r: 24, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
    { k: 'quiz', topic: null, n: 3, npc: 'entrenador', text: t('Responde al entrenador.', 'Պատասխանիր մարզչին։') },
  ], 110, 20);
  add(chapter, city, `Partido en ${cityEs}`, `Խաղ ${cityHy}-ում`, `Partido del torneo en el estadio de ${cityEs}.`, `Մրցաշարի խաղ ${cityHy}-ի մարզադաշտում։`, [
    { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio.', 'Գնա մարզադաշտ։') },
    { k: 'goals', n: 3, mode: 'match', text: t('Gana el partido: marca 3 goles.', 'Հաղթիր խաղում՝ խփիր 3 գոլ։') },
  ], 220, 60);
  add(chapter, city, `Entrevista en ${cityEs}`, `Հարցազրույց ${cityHy}-ում`, 'La prensa local quiere hablar contigo.', 'Տեղական մամուլը ուզում է խոսել քեզ հետ։', [
    { k: 'talk', npc: 'periodista', text: t('Habla con la periodista.', 'Խոսիր լրագրողի հետ։'), ex: interview(cityEs) },
  ], 130, 25);
};

cityBlock('madrid', 'Madrid', 'Մադրիդ', 5, {
  landmark: t('Ve a la Plaza Mayor y mira la gran puerta.', 'Գնա Կենտրոնական հրապարակ և նայիր մեծ դարպասին։'),
  local: [
    choice(t('¿Es tu primera vez en Madrid?', 'Առաջին անգա՞մն ես Մադրիդում։'), [o('Sí, nunca había estado en Madrid.', 'Այո, երբեք չէի եղել Մադրիդում։', true), o('Sí, nunca estaré en Madrid ayer.', '(սխալ)'), o('Sí, he estado mañana.', '(սխալ)')], { topic: 'pluscuam' }),
    build(t('¿Qué te parece la ciudad?', 'Ինչպե՞ս է քեզ թվում քաղաքը։'), t('Es más grande que Valencia', 'Ավելի մեծ է, քան Վալենսիան'), { topic: 'comparativos' }),
  ],
});
add(5, 'madrid', 'Compras en Madrid', 'Գնումներ Մադրիդում', 'Compra la cena para el equipo en el supermercado.', 'Սուպերմարկետից գնիր ընթրիք թիմի համար։', [
  { k: 'enter', interior: 'supermarket', text: t('Ve al supermercado.', 'Գնա սուպերմարկետ։') },
  { k: 'shop', list: ['pasta', 'tomates', 'queso', 'isotonica'], text: t('Compra pasta, tomates, queso y una bebida isotónica.', 'Գնիր մակարոն, լոլիկ, պանիր և իզոտոնիկ ըմպելիք։') },
], 120, 10);
add(5, 'madrid', 'Café en Madrid', 'Սուրճ Մադրիդում', 'Desayuna en una cafetería de Madrid.', 'Նախաճաշիր Մադրիդի սրճարաններից մեկում։', [
  { k: 'enter', interior: 'cafe', text: t('Entra en la cafetería.', 'Մտիր սրճարան։') },
  { k: 'table', place: 'cafe', text: t('Busca una mesa libre.', 'Գտիր ազատ սեղան։') },
  { k: 'talk', npc: 'camarero', text: t('Pide el desayuno.', 'Պատվիրիր նախաճաշը։'), ex: cafeOrder },
], 110, 10);

// ---------------- Chapter 6 ----------------
add(6, 'madrid', 'Rumbo a Barcelona', 'Ուղևորություն դեպի Բարսելոնա', 'El torneo sigue en Barcelona. Viaja en tren.', 'Մրցաշարը շարունակվում է Բարսելոնայում։ Մեկնիր գնացքով։', [
  { k: 'enter', interior: 'station', text: t('Ve a la estación.', 'Գնա կայարան։') },
  { k: 'travel', city: 'barcelona', text: t('Sube al tren a Barcelona.', 'Նստիր Բարսելոնայի գնացքը։') },
], 100, 20);
cityBlock('barcelona', 'Barcelona', 'Բարսելոնա', 6, {
  landmark: t('Ve a la plaza y mira las torres.', 'Գնա հրապարակ և նայիր աշտարակներին։'),
  local: [
    choice(t('¿Sabías que aquí también se habla catalán?', 'Գիտեի՞ր, որ այստեղ նաև կատալաներեն են խոսում։'), [o('No lo sabía. ¡Qué interesante!', 'Չգիտեի։ Ինչ հետաքրքիր է։', true), o('No lo sabré ayer.', '(սխալ)'), o('Sí, lo sabía mañana.', '(սխալ)')], { topic: 'imperfecto' }),
    listen(t('La playa está a quince minutos en bici.', 'Լողափը հեծանիվով տասնհինգ րոպե է։'), [o('A quince minutos en bici.', 'Հեծանիվով տասնհինգ րոպե։', true), o('A cincuenta minutos a pie.', 'Ոտքով հիսուն րոպե։'), o('A cinco horas en tren.', 'Գնացքով հինգ ժամ։')]),
  ],
});
add(6, 'barcelona', 'Rumbo a Sevilla', 'Ուղևորություն դեպի Սևիլյա', 'El siguiente partido es en Sevilla. Viaja en avión.', 'Հաջորդ խաղը Սևիլյայում է։ Մեկնիր ինքնաթիռով։', [
  { k: 'enter', interior: 'airport', text: t('Ve al aeropuerto.', 'Գնա օդանավակայան։') },
  { k: 'travel', city: 'sevilla', text: t('Viaja a Sevilla.', 'Մեկնիր Սևիլյա։') },
], 100, 20);
cityBlock('sevilla', 'Sevilla', 'Սևիլյա', 6, {
  landmark: t('Ve a la plaza y mira la torre.', 'Գնա հրապարակ և նայիր աշտարակին։'),
  local: [
    choice(t('¡Hace muchísimo calor! ¿Tienes agua?', 'Շատ շոգ է։ Ջուր ունե՞ս։'), [o('Sí, tengo una botella de agua.', 'Այո, մի շիշ ջուր ունեմ։', true), o('Sí, hay una botella mí.', '(սխալ)'), o('Sí, soy agua.', '(անհեթեթ)')], { topic: 'tenerhaber' }),
    build(t('¿Qué tiempo hace en Valencia?', 'Ինչպիսի՞ եղանակ է Վալենսիայում։'), t('Hace sol pero menos calor', 'Արևոտ է, բայց ավելի քիչ շոգ'), { topic: 'comparativos' }),
  ],
});
add(6, 'sevilla', 'Rumbo a Santander', 'Ուղևորություն դեպի Սանտանդեր', 'Viaja al norte, a Santander, en autobús.', 'Մեկնիր հյուսիս՝ Սանտանդեր, ավտոբուսով։', [
  { k: 'enter', interior: 'station', text: t('Ve a la estación de autobuses y trenes.', 'Գնա ավտոբուսների և գնացքների կայան։') },
  { k: 'travel', city: 'santander', text: t('Toma el autobús a Santander.', 'Նստիր Սանտանդերի ավտոբուսը։') },
], 100, 20);
cityBlock('santander', 'Santander', 'Սանտանդեր', 6, {
  landmark: t('Ve a la plaza y mira el faro.', 'Գնա հրապարակ և նայիր փարոսին։'),
  local: [
    listen(t('Aquí llueve mucho. ¿Has traído paraguas?', 'Այստեղ շատ է անձրև գալիս։ Անձրևանոց բերե՞լ ես։'), [o('No, no he traído ningún paraguas.', 'Ոչ, ոչ մի անձրևանոց չեմ բերել։', true), o('No, no he traído algún paraguas.', '(սխալ՝ algún)'), o('Sí, he traído la playa.', '(անհեթեթ)')], { topic: 'alguno' }),
    choice(t('¿Qué estabas haciendo cuando empezó a llover?', 'Ի՞նչ էիր անում, երբ սկսեց անձրև գալ։'), [o('Estaba paseando por la playa.', 'Զբոսնում էի լողափով։', true), o('Estoy paseado.', '(սխալ)'), o('Paseé mañana.', '(սխալ)')], { topic: 'imperfecto' }),
  ],
});
add(6, 'santander', 'Rumbo a Bilbao', 'Ուղևորություն դեպի Բիլբաո', 'Viaja a Bilbao en tren para la semifinal.', 'Մեկնիր Բիլբաո գնացքով՝ կիսաեզրափակչի համար։', [
  { k: 'enter', interior: 'station', text: t('Ve a la estación.', 'Գնա կայարան։') },
  { k: 'travel', city: 'bilbao', text: t('Viaja a Bilbao.', 'Մեկնիր Բիլբաո։') },
], 100, 20);
cityBlock('bilbao', 'Bilbao', 'Բիլբաո', 6, {
  landmark: t('Ve a la plaza y mira el museo moderno.', 'Գնա հրապարակ և նայիր ժամանակակից թանգարանին։'),
  local: [
    choice(t('¿Seguís ganando en el torneo?', 'Դեռ շարունակո՞ւմ եք հաղթել մրցաշարում։'), [o('Sí, seguimos ganando todos los partidos.', 'Այո, շարունակում ենք հաղթել բոլոր խաղերում։', true), o('Sí, seguimos ganar.', '(սխալ)'), o('Sí, seguimos ganado.', '(սխալ)')], { topic: 'seguirgerundio' }),
    build(t('¿Qué tenéis que hacer para llegar a la final?', 'Ի՞նչ պետք է անեք եզրափակիչ դուրս գալու համար։'), t('Tenemos que ganar la semifinal', 'Պետք է հաղթենք կիսաեզրափակչում'), { topic: 'tenerque' }),
  ],
});

// ---------------- Chapter 7 ----------------
add(7, 'bilbao', 'Rumbo a la final', 'Դեպի եզրափակիչ', '¡Estáis en la final! Se juega en Málaga. Viaja en avión.', 'Դուք եզրափակչում եք։ Այն անցկացվում է Մալագայում։ Մեկնիր ինքնաթիռով։', [
  { k: 'enter', interior: 'airport', text: t('Ve al aeropuerto.', 'Գնա օդանավակայան։') },
  { k: 'talk', npc: 'azafata', text: t('Factura tu maleta.', 'Գրանցիր ճամպրուկդ։'), ex: airport },
  { k: 'travel', city: 'malaga', text: t('Viaja a Málaga.', 'Մեկնիր Մալագա։') },
], 150, 30);
add(7, 'malaga', 'Málaga', 'Մալագա', 'Explora Málaga y relájate en la playa antes de la final.', 'Ուսումնասիրիր Մալագան և հանգստացիր լողափում եզրափակչից առաջ։', [
  { k: 'reach', place: 'plaza', r: 30, text: t('Visita la Plaza Mayor.', 'Այցելիր Կենտրոնական հրապարակ։') },
  { k: 'reach', place: 'beach', r: 30, text: t('Ve a la playa.', 'Գնա լողափ։') },
  { k: 'talk', npc: 'amigo', text: t('Marco ha venido a verte. Habla con él en el parque.', 'Մարկոն եկել է քեզ տեսնելու։ Խոսիր նրա հետ այգում։'), ex: [
    choice(t('¡Sorpresa! ¿Estás nervioso?', 'Անակնկալ։ Նյարդայնանո՞ւմ ես։'), [o('Un poco, pero estoy muy contento.', 'Մի քիչ, բայց շատ ուրախ եմ։', true), o('Soy un poco nervioso hoy.', '(սխալ՝ ser)'), o('Estoy muy contentos.', '(սխալ թիվ)')], { topic: 'serestar' }),
    build(t('¿Qué harás si ganas?', 'Ի՞նչ կանես, եթե հաղթես։'), t('Celebraré con mi familia', 'Կտոնեմ ընտանիքիս հետ'), { topic: 'futuro' }),
  ] },
], 140, 20);
add(7, 'malaga', 'Preparación final', 'Վերջնական պատրաստություն', 'Último entrenamiento antes de la gran final.', 'Վերջին մարզումը մեծ եզրափակչից առաջ։', [
  { k: 'reach', place: 'training', r: 24, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
  { k: 'talk', npc: 'entrenador', text: t('Escucha al entrenador.', 'Լսիր մարզչին։'), ex: [
    listen(t('Mañana a esta hora ya habremos jugado la final.', 'Վաղը այս ժամին մենք արդեն խաղացած կլինենք եզրափակիչը։'), [o('Mañana ya habremos jugado la final.', 'Վաղն արդեն խաղացած կլինենք եզրափակիչը։', true), o('Ayer jugamos la final.', 'Երեկ խաղացինք եզրափակիչը։'), o('Nunca jugaremos la final.', 'Երբեք չենք խաղա եզրափակիչը։')], { topic: 'futuroperf' }),
    ...coachTactics.slice(2),
  ] },
  { k: 'goals', n: 2, mode: 'penalty', text: t('Practica penaltis: marca 2.', 'Պարապիր պենալտիներ՝ խփիր 2։') },
], 180, 30);
add(7, 'malaga', 'La gran final', 'Մեծ եզրափակիչը', '¡Es la final del torneo nacional! Marca 4 goles para ganar.', 'Ազգային մրցաշարի եզրափակիչն է։ Խփիր 4 գոլ՝ հաղթելու համար։', [
  { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio.', 'Գնա մարզադաշտ։') },
  { k: 'goals', n: 4, mode: 'match', text: t('¡La final! Marca 4 goles.', 'Եզրափակիչ։ Խփիր 4 գոլ։') },
], 400, 150);
add(7, 'malaga', 'Campeón', 'Չեմպիոն', 'Después de la final, la prensa quiere hablar con el nuevo campeón.', 'Եզրափակչից հետո մամուլը ուզում է խոսել նոր չեմպիոնի հետ։', [
  { k: 'talk', npc: 'periodista', text: t('Habla con la periodista.', 'Խոսիր լրագրողի հետ։'), ex: [
    ...interview('Málaga'),
    choice(t('¿Qué le dirías a otros chicos que tienen un sueño?', 'Ի՞նչ կասեիր այլ երեխաների, ովքեր երազանք ունեն։'), [o('Que entrenen mucho y que nunca dejen de aprender.', 'Որ շատ մարզվեն և երբեք չդադարեն սովորել։', true), o('Que duerman en el estadio.', 'Որ քնեն մարզադաշտում։'), o('Que no hablen con nadie.', 'Որ ոչ ոքի հետ չխոսեն։')]),
  ] },
], 200, 50);
add(7, 'malaga', 'El sueño de RAZ', 'ՌԱԶ-ի երազանքը', 'Don Ramón te espera en la academia con una noticia muy importante.', 'Դոն Ռամոնը քեզ սպասում է ակադեմիայում՝ շատ կարևոր լուրով։', [
  { k: 'enter', interior: 'academy', text: t('Ve a la academia.', 'Գնա ակադեմիա։') },
  { k: 'talk', npc: 'director', text: t('Habla con Don Ramón.', 'Խոսիր Դոն Ռամոնի հետ։'), ex: [
    listen(t('RAZ, te ofrecemos una plaza en nuestra academia. ¿Aceptas?', 'ՌԱԶ, քեզ առաջարկում ենք տեղ մեր ակադեմիայում։ Ընդունո՞ւմ ես։'), [o('¡Sí, acepto! Es mi sueño.', 'Այո, ընդունում եմ։ Դա իմ երազանքն է։', true), o('No, prefiero el supermercado.', 'Ոչ, սուպերմարկետն եմ նախընտրում։'), o('Acepto ayer.', '(սխալ)')]),
    order(t('Ordena tu historia:', 'Դասավորիր քո պատմությունը.'), [t('Llegué a Valencia y encontré mi bicicleta.', 'Եկա Վալենսիա և գտա իմ հեծանիվը։'), t('Entrené cada día con el equipo.', 'Ամեն օր մարզվեցի թիմի հետ։'), t('Viajé por toda España.', 'Ճամփորդեցի ամբողջ Իսպանիայով։'), t('Ganamos la gran final.', 'Հաղթեցինք մեծ եզրափակչում։')], { topic: 'indefinido' }),
  ], outro: t('¡Bienvenido a la academia, RAZ! Tu aventura acaba de empezar.', 'Բարի գալուստ ակադեմիա, ՌԱԶ։ Քո արկածը նոր է սկսվում։') },
], 500, 200);

// ---------------- Side missions (city life) to reach 60 ----------------
add(3, 'valencia', 'Repaso con la profesora', 'Կրկնություն ուսուցչուհու հետ', 'La profesora te pone un examen de ser y estar.', 'Ուսուցչուհին քեզ ser և estar-ի քննություն է տալիս։', [
  { k: 'enter', interior: 'school', text: t('Ve a la escuela.', 'Գնա դպրոց։') },
  { k: 'quiz', topic: 'serestar', n: 4, npc: 'profesora', text: t('Responde a la profesora.', 'Պատասխանիր ուսուցչուհուն։') },
], 90, 10);
add(3, 'valencia', 'Repaso: por y para', 'Կրկնություն՝ por և para', 'Hugo no entiende «por» y «para». ¡Ayúdale!', 'Ուգոն չի հասկանում «por»-ը և «para»-ն։ Օգնիր նրան։', [
  { k: 'enter', interior: 'school', text: t('Ve a la escuela.', 'Գնա դպրոց։') },
  { k: 'quiz', topic: 'porpara', n: 4, npc: 'companero', text: t('Explica a Hugo.', 'Բացատրիր Ուգոյին։') },
], 90, 10);
add(3, 'valencia', 'Ropa para el partido', 'Հագուստ խաղի համար', 'Laura está en el centro comercial. Pregúntale qué ropa llevar.', 'Լաուրան առևտրի կենտրոնում է։ Հարցրու՝ ինչ հագնել։', [
  { k: 'enter', interior: 'mall', text: t('Ve al centro comercial.', 'Գնա առևտրի կենտրոն։') },
  { k: 'talk', npc: 'amiga', text: t('Habla con Laura.', 'Խոսիր Լաուրայի հետ։'), ex: [
    choice(t('¡Hola, RAZ! ¿Qué estás buscando?', 'Բարև, ՌԱԶ։ Ի՞նչ ես փնտրում։'), [o('Estoy buscando una camiseta nueva.', 'Նոր մարզաշապիկ եմ փնտրում։', true), o('Estoy buscar una camiseta.', '(սխալ)'), o('Soy buscando.', '(սխալ)')], { topic: 'estargerundio' }),
    choice(t('¿Cuál te gusta más: la blanca o la negra?', 'Որն է քեզ ավելի շատ դուր գալիս՝ սպիտա՞կը, թե՞ սևը։'), [o('La negra es más bonita que la blanca.', 'Սևն ավելի գեղեցիկ է, քան սպիտակը։', true), o('La negra es más bonita de la blanca.', '(սխալ՝ de)'), o('La negra es mucho bonita.', '(սխալ)')], { topic: 'comparativos' }),
    build(t('¿Y para el partido?', 'Իսկ խաղի համա՞ր։'), t('Para el partido llevo la naranja', 'Խաղի համար հագնում եմ նարնջագույնը'), { topic: 'porpara' }),
  ] },
], 90, 15);
add(2, 'valencia', 'Repaso de vocabulario', 'Բառապաշարի կրկնություն', 'El entrenador quiere saber si conoces las palabras del fútbol.', 'Մարզիչը ուզում է իմանալ՝ գիտե՞ս արդյոք ֆուտբոլային բառերը։', [
  { k: 'reach', place: 'training', r: 24, text: t('Ve a la ciudad deportiva.', 'Գնա մարզաբազա։') },
  { k: 'quiz', topic: 'deporte', n: 4, npc: 'entrenador', text: t('Responde al entrenador.', 'Պատասխանիր մարզչին։') },
], 90, 15);
add(4, 'valencia', 'Paseo nocturno', 'Գիշերային զբոսանք', 'Por la noche, da un paseo en patinete o bicicleta hasta el centro de juegos.', 'Գիշերը զբոսնիր սքութերով կամ հեծանիվով մինչև խաղային կենտրոն։', [
  { k: 'vehicle', vtype: 'bike', text: t('Sube a una bicicleta o a un patinete.', 'Նստիր հեծանիվ կամ սքութեր։') },
  { k: 'reach', place: 'gamecenter', door: true, text: t('Ve al centro de juegos.', 'Գնա խաղային կենտրոն։') },
  { k: 'enter', interior: 'gamecenter', text: t('Entra y juega a un minijuego.', 'Մտիր և խաղա որևէ մինի-խաղ։') },
], 90, 15);
add(4, 'valencia', 'El portero', 'Դարպասապահը', 'Hoy te toca ser portero. Para los tiros de Iker.', 'Այսօր դու ես դարպասապահը։ Կասեցրու Իկերի հարվածները։', [
  { k: 'reach', place: 'stadium', r: 30, text: t('Ve al estadio.', 'Գնա մարզադաշտ։') },
  { k: 'goals', n: 3, mode: 'goalkeeper', text: t('Para 3 tiros moviéndote con A y D.', 'Կասեցրու 3 հարված՝ շարժվելով A և D ստեղներով։') },
], 130, 25);

M.slice(64).forEach((m) => (m.side = true));
export const MISSIONS: Mission[] = M;
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
export const missionIndex = (id: string) => MISSIONS.findIndex((m) => m.id === id);
