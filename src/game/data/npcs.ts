// NPC definitions and conversation content.
import type { Tr } from '../../i18n/T';
import type { InteriorKind } from './places';

export type ExchangeMode = 'choice' | 'build' | 'listen' | 'order';

export interface Option extends Tr {
  ok: boolean;
}

export interface Exchange {
  npc: Tr;
  mode: ExchangeMode;
  options?: Option[];
  /** build mode: correct sentence (chips are generated from it) */
  answer?: Tr;
  /** order mode: lines in the correct order */
  lines?: Tr[];
  explain?: Tr;
  topic?: string;
  /** reply from NPC after a correct answer */
  reply?: Tr;
  /** extra distractor chips for build mode */
  chips?: string[];
  /** listening only: the text can't be revealed before answering */
  audioOnly?: boolean;
}

export interface Quest {
  id: string;
  item: { id: string; shape: 'ball' | 'wallet' | 'dog' | 'glasses' | 'passport' | 'suitcase' | 'box'; label: Tr; interior?: InteriorKind; place?: string; door?: boolean; x: number; z: number };
  remind: Tr;
  give: Exchange;
  thanks: Tr;
  reward: { money: number; xp: number };
}

export interface NpcDef {
  id: string;
  name: string;
  role: Tr;
  voice: { pitch: number; rate: number; voice: number };
  look: { shirt: string; shorts: string; skin?: string; hair?: string; longPants?: boolean; hairStyle?: 'short' | 'fade' | 'long' | 'bun'; height?: number };
  /** outdoor placement: place id + offset; interior NPCs are spawned by Interiors */
  place?: string;
  offset?: [number, number];
  interior?: InteriorKind;
  greeting: Tr;
  free: Exchange[];
  /** position inside an interior room (relative to the room centre) */
  spot?: [number, number];
  quest?: Quest;
}

const t = (es: string, hy: string): Tr => ({ es, hy });
const o = (es: string, hy: string, ok = false): Option => ({ es, hy, ok });

/** Generic small talk usable with anybody. */
export const SMALL_TALK: Exchange[] = [
  {
    npc: t('¡Hola! ¿Qué tal?', 'Բարև։ Ինչպե՞ս ես։'),
    mode: 'choice',
    options: [o('Muy bien, gracias. ¿Y tú?', 'Շատ լավ, շնորհակալություն։ Իսկ դո՞ւ։', true), o('Tengo doce bicicletas.', 'Տասներկու հեծանիվ ունեմ։'), o('Es el martes.', 'Երեքշաբթի է։')],
    reply: t('¡Muy bien también!', 'Ես էլ շատ լավ եմ։'),
    topic: 'presente',
  },
  {
    npc: t('¿Cómo te llamas?', 'Ինչպե՞ս է անունդ։'),
    mode: 'build',
    answer: t('Me llamo RAZ', 'Անունս ՌԱԶ է'),
    explain: t('Llamarse es reflexivo: me llamo.', 'Llamarse-ն անդրադարձ բայ է՝ me llamo։'),
    topic: 'reflexivos',
  },
  {
    npc: t('¿Cuántos años tienes?', 'Քանի՞ տարեկան ես։'),
    mode: 'listen',
    options: [o('Tengo casi trece años.', 'Գրեթե տասներեք տարեկան եմ։', true), o('Soy trece años.', '(սխալ) Ես տասներեք տարի եմ։'), o('Estoy en el parque.', 'Այգում եմ։')],
    explain: t('En español la edad se dice con «tener».', 'Իսպաներենում տարիքն արտահայտվում է «tener» բայով։'),
    topic: 'tenerhaber',
  },
  {
    npc: t('¿De dónde eres?', 'Որտեղի՞ց ես։'),
    mode: 'choice',
    options: [o('Soy de Armenia, pero vivo en España.', 'Հայաստանից եմ, բայց ապրում եմ Իսպանիայում։', true), o('Estoy de Armenia.', '(սխալ) Հայաստանից եմ (estar)։'), o('Voy al supermercado.', 'Գնում եմ սուպերմարկետ։')],
    explain: t('Origen → ser de.', 'Ծագում → ser de։'),
    topic: 'serestar',
  },
  {
    npc: t('¿Qué tiempo hace hoy?', 'Այսօր ինչպիսի՞ եղանակ է։'),
    mode: 'choice',
    options: [o('Hace sol y calor.', 'Արևոտ է և շոգ։', true), o('Es sol.', '(սխալ) Արև է։'), o('Tengo calor de sol.', '(սխալ)')],
    explain: t('El tiempo: hace sol, hace calor, hace frío, llueve.', 'Եղանակը՝ hace sol, hace calor, hace frío, llueve։'),
    topic: 'presente',
  },
  {
    npc: t('¿Qué te gusta hacer en tu tiempo libre?', 'Ի՞նչ ես սիրում անել ազատ ժամանակ։'),
    mode: 'build',
    answer: t('Me gusta jugar al fútbol', 'Սիրում եմ ֆուտբոլ խաղալ'),
    explain: t('Me gusta + infinitivo.', 'Me gusta + անորոշ ձև։'),
    topic: 'presente',
  },
  {
    npc: t('Ordena esta conversación, por favor.', 'Դասավորիր այս զրույցը, խնդրում եմ։'),
    mode: 'order',
    lines: [t('— Hola, ¿qué tal?', '— Բարև, ինչպե՞ս ես։'), t('— Bien, ¿y tú?', '— Լավ, իսկ դո՞ւ։'), t('— Muy bien. ¡Hasta luego!', '— Շատ լավ։ Առայժմ։'), t('— ¡Adiós!', '— Ցտեսություն։')],
    topic: 'presente',
  },
  {
    npc: t('¿Qué hiciste ayer?', 'Ի՞նչ արեցիր երեկ։'),
    mode: 'choice',
    options: [o('Ayer jugué un partido con mis amigos.', 'Երեկ ընկերներիս հետ խաղ խաղացի։', true), o('Ayer juego un partido.', '(սխալ ժամանակ)'), o('Ayer jugaré un partido.', '(սխալ ժամանակ)')],
    explain: t('Ayer → pretérito indefinido: jugué.', 'Ayer → pretérito indefinido՝ jugué։'),
    topic: 'indefinido',
  },
  {
    npc: t('¿Qué vas a hacer este fin de semana?', 'Ի՞նչ ես անելու այս հանգստյան օրերին։'),
    mode: 'listen',
    options: [o('Voy a ir a la playa.', 'Գնալու եմ լողափ։', true), o('Fui a la playa.', 'Գնացի լողափ։'), o('Iba a la playa.', 'Գնում էի լողափ։')],
    explain: t('Planes → ir a + infinitivo.', 'Ծրագրեր → ir a + անորոշ ձև։'),
    topic: 'futuro',
  },
];

const coachFree: Exchange[] = [
  {
    npc: t('¿Estás preparado para entrenar?', 'Պատրա՞ստ ես մարզվելու։'),
    mode: 'choice',
    options: [o('Sí, estoy preparado.', 'Այո, պատրաստ եմ։', true), o('No, tengo hambre.', 'Ոչ, քաղցած եմ։'), o('Estoy en el supermercado.', 'Սուպերմարկետում եմ։'), o('Quiero comprar una camiseta.', 'Ուզում եմ մարզաշապիկ գնել։')],
    reply: t('¡Perfecto! Vamos al campo.', 'Հիանալի է։ Գնանք դաշտ։'),
    topic: 'serestar',
  },
  {
    npc: t('¿Qué tienes que hacer cuando un compañero está libre?', 'Ի՞նչ պետք է անես, երբ թիմակիցդ ազատ է։'),
    mode: 'choice',
    options: [o('Tengo que pasar el balón.', 'Պետք է փոխանցեմ գնդակը։', true), o('Tengo que dormir.', 'Պետք է քնեմ։'), o('Tengo que comer pizza.', 'Պետք է պիցցա ուտեմ։')],
    topic: 'tenerque',
  },
  {
    npc: t('Repite la orden: «Defiende tu posición».', 'Կրկնիր հրամանը՝ «Պաշտպանիր դիրքդ»։'),
    mode: 'build',
    answer: t('Defiende tu posición', 'Պաշտպանիր դիրքդ'),
    topic: 'imperativo',
  },
  {
    npc: t('¿Cuánto tiempo llevas jugando al fútbol?', 'Որքա՞ն ժամանակ է՝ ֆուտբոլ ես խաղում։'),
    mode: 'choice',
    options: [o('Llevo cinco años jugando.', 'Արդեն հինգ տարի է՝ խաղում եմ։', true), o('Llevo jugar cinco años.', '(սխալ)'), o('Estoy cinco años.', '(սխալ)')],
    explain: t('Llevar + tiempo + gerundio.', 'Llevar + ժամանակ + դերբայ։'),
    topic: 'llevargerundio',
  },
];

export const NPCS: NpcDef[] = [
  { id: 'entrenador', name: 'Míster Luis', role: t('Entrenador', 'Մարզիչ'), voice: { pitch: 0.8, rate: 1, voice: 1 }, look: { shirt: '#16181c', shorts: '#16181c', longPants: true, hair: '#777', height: 1.12 }, place: 'training', offset: [0, -6], greeting: t('¡Hola, RAZ! Hoy vamos a trabajar duro.', 'Բարև, ՌԱԶ։ Այսօր լավ կաշխատենք։'), free: coachFree },
  { id: 'mama', name: 'Mamá', role: t('Madre de RAZ', 'ՌԱԶ-ի մայրը'), voice: { pitch: 1.2, rate: 1, voice: 0 }, look: { shirt: '#b03a5b', shorts: '#34495e', longPants: true, hairStyle: 'long', height: 1.07 }, interior: 'home', greeting: t('¡Buenos días, cariño! ¿Has desayunado?', 'Բարի լույս, սիրելիս։ Նախաճաշե՞լ ես։'), free: [
    { npc: t('¿Has desayunado?', 'Նախաճաշե՞լ ես։'), mode: 'choice', options: [o('Sí, he desayunado cereales.', 'Այո, հացահատիկ եմ կերել։', true), o('Sí, desayuné mañana.', '(սխալ)'), o('Sí, desayunaré ayer.', '(սխալ)')], explain: t('Hoy/ya → pretérito perfecto: he desayunado.', 'Hoy/ya → pretérito perfecto՝ he desayunado։'), topic: 'perfecto' },
    { npc: t('¿Me traes un vaso de agua, por favor?', 'Մի բաժակ ջուր կբերե՞ս, խնդրում եմ։'), mode: 'choice', options: [o('¡Claro! Ahora te lo traigo.', 'Իհարկե։ Հիմա կբերեմ։', true), o('Ahora te lo llevo a ti aquí.', '(անբնական)'), o('Ahora vengo el agua.', '(սխալ)')], topic: 'llevartraer' },
  ] },
  { id: 'cajera', name: 'Carmen', role: t('Cajera del supermercado', 'Սուպերմարկետի գանձապահ'), voice: { pitch: 1.15, rate: 1.05, voice: 0 }, look: { shirt: '#2e8b57', shorts: '#2c3e50', longPants: true, hairStyle: 'bun', height: 1.06 }, interior: 'supermarket', greeting: t('¡Hola! ¿Lo tienes todo?', 'Բարև։ Ամեն ինչ վերցրե՞լ ես։'), free: [
    { npc: t('¿Quieres una bolsa?', 'Տոպրակ ուզո՞ւմ ես։'), mode: 'choice', options: [o('Sí, por favor. Una bolsa.', 'Այո, խնդրում եմ։ Մեկ տոպրակ։', true), o('Sí, estoy una bolsa.', '(սխալ)'), o('No, tengo trece años.', 'Ոչ, տասներեք տարեկան եմ։')], topic: 'presente' },
  ] },
  { id: 'camarero', name: 'Javier', role: t('Camarero de la cafetería', 'Սրճարանի մատուցող'), voice: { pitch: 1.0, rate: 1.05, voice: 1 }, look: { shirt: '#f4f4f4', shorts: '#16181c', longPants: true, height: 1.1 }, interior: 'cafe', greeting: t('¡Buenas! Siéntate donde quieras.', 'Բարև ձեզ։ Նստիր որտեղ ուզում ես։'), free: [] },
  { id: 'camarera_rest', name: 'Lucía', role: t('Camarera del restaurante', 'Ռեստորանի մատուցողուհի'), voice: { pitch: 1.2, rate: 1, voice: 0 }, look: { shirt: '#16181c', shorts: '#16181c', longPants: true, hairStyle: 'bun', height: 1.06 }, interior: 'restaurant', greeting: t('Buenas noches. ¿Mesa para uno?', 'Բարի երեկո։ Սեղան մեկ հոգու համա՞ր։'), free: [] },
  { id: 'vendedor', name: 'Pablo', role: t('Vendedor de la tienda de deportes', 'Սպորտային խանութի վաճառող'), voice: { pitch: 1.0, rate: 1.1, voice: 1 }, look: { shirt: '#ff6a00', shorts: '#16181c', longPants: true, height: 1.1 }, interior: 'sportshop', greeting: t('¡Hola! ¿Buscas algo en especial?', 'Բարև։ Ինչ-որ հատուկ բան ես փնտրո՞ւմ։'), free: [
    { npc: t('¿Qué número de zapatillas usas?', 'Կոշիկի ո՞ր չափսն ես կրում։'), mode: 'choice', options: [o('Uso el número cuarenta.', 'Կրում եմ քառասուներորդ չափսը։', true), o('Uso el número rojo.', '(սխալ)'), o('Estoy cuarenta.', '(սխալ)')], topic: 'presente' },
  ] },
  { id: 'mecanico', name: 'Antonio', role: t('Mecánico', 'Մեխանիկ'), voice: { pitch: 0.75, rate: 0.95, voice: 1 }, look: { shirt: '#34495e', shorts: '#34495e', longPants: true, hair: '#555', height: 1.12 }, interior: 'workshop', greeting: t('¿Qué le pasa a tu vehículo?', 'Ի՞նչ է պատահել քո տրանսպորտին։'), free: [
    { npc: t('¿Qué le pasa al coche?', 'Ի՞նչ է պատահել մեքենային։'), mode: 'choice', options: [o('El coche no arranca.', 'Մեքենան չի միանում։', true), o('El coche es muy feliz.', 'Մեքենան շատ երջանիկ է։'), o('El coche come pan.', 'Մեքենան հաց է ուտում։')], topic: 'presente' },
  ] },
  { id: 'profesora', name: 'Profesora Elena', role: t('Profesora de español', 'Իսպաներենի ուսուցչուհի'), voice: { pitch: 1.1, rate: 0.95, voice: 0 }, look: { shirt: '#7d3c98', shorts: '#2c3e50', longPants: true, hairStyle: 'long', height: 1.07 }, interior: 'school', greeting: t('¡Buenos días, RAZ! ¿Preparado para la clase?', 'Բարի լույս, ՌԱԶ։ Պատրա՞ստ ես դասին։'), free: [] },
  { id: 'companero', name: 'Hugo', role: t('Compañero de clase', 'Դասընկեր'), voice: { pitch: 1.3, rate: 1.1, voice: 1 }, look: { shirt: '#1abc9c', shorts: '#2c3e50', height: 0.98 }, interior: 'school', greeting: t('¡Eh, RAZ! ¿Hiciste los deberes?', 'Հեյ, ՌԱԶ։ Տնայինն արե՞լ ես։'), free: [] },
  { id: 'recepcion_gym', name: 'Marta', role: t('Recepcionista del gimnasio', 'Մարզասրահի ադմինիստրատոր'), voice: { pitch: 1.15, rate: 1.1, voice: 0 }, look: { shirt: '#ff6a00', shorts: '#16181c', hairStyle: 'bun', height: 1.07 }, interior: 'gym', greeting: t('¡Bienvenido al gimnasio! Cada ejercicio mejora tus estadísticas.', 'Բարի գալուստ մարզասրահ։ Յուրաքանչյուր վարժություն բարելավում է ցուցանիշներդ։'), free: [] },
  { id: 'taquillero', name: 'Diego', role: t('Taquillero del cine', 'Կինոթատրոնի տոմսավաճառ'), voice: { pitch: 1.0, rate: 1.1, voice: 1 }, look: { shirt: '#8e1b2b', shorts: '#16181c', longPants: true, height: 1.1 }, interior: 'cinema', greeting: t('Hoy ponemos una película de fútbol. ¡Siéntate!', 'Այսօր ֆուտբոլի մասին ֆիլմ ենք ցուցադրում։ Նստի՛ր։'), free: [] },
  { id: 'director', name: 'Don Ramón', role: t('Director de la academia', 'Ակադեմիայի տնօրեն'), voice: { pitch: 0.7, rate: 0.9, voice: 1 }, look: { shirt: '#2b2e35', shorts: '#2b2e35', longPants: true, hair: '#bbb', height: 1.12 }, interior: 'academy', greeting: t('Así que tú eres RAZ. He oído hablar de ti.', 'Ուրեմն դու ես ՌԱԶ-ը։ Քո մասին լսել եմ։'), free: [] },
  { id: 'azafata', name: 'Sofía', role: t('Empleada del aeropuerto', 'Օդանավակայանի աշխատակցուհի'), voice: { pitch: 1.2, rate: 1.05, voice: 0 }, look: { shirt: '#1f5fbf', shorts: '#16181c', longPants: true, hairStyle: 'bun', height: 1.07 }, interior: 'airport', greeting: t('Buenos días. Su pasaporte, por favor.', 'Բարի լույս։ Ձեր անձնագիրը, խնդրում եմ։'), free: [] },
  { id: 'seguridad', name: 'Raúl', role: t('Control de seguridad', 'Անվտանգության ստուգում'), voice: { pitch: 0.8, rate: 1, voice: 1 }, look: { shirt: '#34495e', shorts: '#16181c', longPants: true, height: 1.13 }, interior: 'airport', greeting: t('Ponga la mochila aquí, por favor.', 'Պայուսակը դրեք այստեղ, խնդրում եմ։'), free: [] },
  { id: 'taquilla_tren', name: 'Isabel', role: t('Vendedora de billetes', 'Տոմսավաճառուհի'), voice: { pitch: 1.1, rate: 1.05, voice: 0 }, look: { shirt: '#c0392b', shorts: '#16181c', longPants: true, hairStyle: 'long', height: 1.06 }, interior: 'station', greeting: t('¿Adónde quieres viajar hoy?', 'Ո՞ւր ես ուզում մեկնել այսօր։'), free: [] },
  { id: 'arcade', name: 'Nico', role: t('Encargado del centro de juegos', 'Խաղային կենտրոնի պատասխանատու'), voice: { pitch: 1.2, rate: 1.15, voice: 1 }, look: { shirt: '#ff6a00', shorts: '#16181c', hairStyle: 'fade', height: 1.05 }, interior: 'gamecenter', greeting: t('¡Bienvenido a la Game Zone! Elige una máquina y juega.', 'Բարի գալուստ Game Zone։ Ընտրիր ավտոմատ և խաղա։'), free: [] },
  { id: 'amiga', name: 'Laura', role: t('Amiga de RAZ', 'ՌԱԶ-ի ընկերուհին'), voice: { pitch: 1.35, rate: 1.1, voice: 0 }, look: { shirt: '#f4f4f4', shorts: '#283593', hairStyle: 'long', height: 1.0 }, interior: 'mall', greeting: t('¡RAZ! ¿Qué haces aquí?', 'ՌԱԶ։ Ի՞նչ ես անում այստեղ։'), free: [] },
  { id: 'amigo', name: 'Marco', role: t('Mejor amigo de RAZ', 'ՌԱԶ-ի լավագույն ընկերը'), voice: { pitch: 1.3, rate: 1.15, voice: 1 }, look: { shirt: '#1f5fbf', shorts: '#16181c', hairStyle: 'short', height: 1.0 }, place: 'park', offset: [-10, 6], greeting: t('¡Hola, RAZ! ¿Jugamos un rato?', 'Բարև, ՌԱԶ։ Մի քիչ խաղա՞նք։'), free: [] },
  { id: 'turista', name: 'Emma', role: t('Turista', 'Զբոսաշրջիկ'), voice: { pitch: 1.15, rate: 0.9, voice: 0 }, look: { shirt: '#d4a017', shorts: '#5d4037', hairStyle: 'long', height: 1.07 }, place: 'plaza', offset: [8, 16], greeting: t('Perdona, ¿hablas español? Estoy un poco perdida.', 'Ներողություն, իսպաներեն խոսո՞ւմ ես։ Մի քիչ մոլորվել եմ։'), free: [] },
  { id: 'periodista', name: 'Ana', role: t('Periodista deportiva', 'Սպորտային լրագրող'), voice: { pitch: 1.1, rate: 1.1, voice: 0 }, look: { shirt: '#c0392b', shorts: '#16181c', longPants: true, hairStyle: 'bun', height: 1.07 }, place: 'stadium', offset: [6, 24], greeting: t('¡RAZ! ¿Tienes un minuto para una entrevista?', 'ՌԱԶ։ Մեկ րոպե ունե՞ս հարցազրույցի համար։'), free: [] },
  { id: 'medico', name: 'Doctor Gómez', role: t('Médico del equipo', 'Թիմի բժիշկ'), voice: { pitch: 0.85, rate: 0.95, voice: 1 }, look: { shirt: '#f4f4f4', shorts: '#2c3e50', longPants: true, hair: '#888', height: 1.12 }, place: 'training', offset: [16, 10], greeting: t('Hola, RAZ. ¿Cómo te encuentras hoy?', 'Բարև, ՌԱԶ։ Ինչպե՞ս ես քեզ զգում այսօր։'), free: [
    { npc: t('¿Te duele algo?', 'Որևէ տեղդ ցավո՞ւմ է։'), mode: 'choice', options: [o('Me duele un poco la rodilla.', 'Ծունկս մի քիչ ցավում է։', true), o('Me duele el balón.', '(անհեթեթ)'), o('Duelo la rodilla.', '(սխալ)')], explain: t('Doler funciona como gustar: me duele + parte del cuerpo.', 'Doler-ը գործում է gustar-ի նման՝ me duele + մարմնի մաս։'), topic: 'presente' },
  ] },
  { id: 'taxista', name: 'Paco', role: t('Taxista', 'Տաքսու վարորդ'), voice: { pitch: 0.8, rate: 1.1, voice: 1 }, look: { shirt: '#f2f2f2', shorts: '#34495e', longPants: true, hair: '#444', height: 1.12 }, place: 'parking', offset: [0, 24], greeting: t('¡Buenas! ¿Adónde vamos?', 'Բարև ձեզ։ Ո՞ւր ենք գնում։'), free: [
    { npc: t('¿Adónde vamos?', 'Ո՞ւր ենք գնում։'), mode: 'build', answer: t('Al estadio por favor', 'Դեպի մարզադաշտ, խնդրում եմ'), topic: 'porpara' },
  ] },
  { id: 'portero', name: 'Iker', role: t('Portero y compañero de equipo', 'Դարպասապահ և թիմակից'), voice: { pitch: 1.1, rate: 1.1, voice: 1 }, look: { shirt: '#39e75f', shorts: '#16181c', hairStyle: 'fade', height: 1.04 }, place: 'stadium', offset: [-14, 24], greeting: t('¡RAZ! ¿Practicamos penaltis?', 'ՌԱԶ։ Պենալտի կպարապե՞նք։'), free: [] },
  { id: 'abuelo', name: 'Don Manuel', role: t('Vecino del barrio', 'Թաղի հարևան'), voice: { pitch: 0.65, rate: 0.85, voice: 1 }, look: { shirt: '#5d6d7e', shorts: '#3e2723', longPants: true, hair: '#ddd', height: 1.08 }, place: 'park', offset: [12, -12], greeting: t('Buenas tardes, joven. ¡Qué buen día hace!', 'Բարի օր, երիտասարդ։ Ինչ լավ օր է։'), free: [
    { npc: t('Cuando yo era joven, jugaba al fútbol en esta calle. ¿Y tú, dónde jugabas de pequeño?', 'Երբ ես երիտասարդ էի, ֆուտբոլ էի խաղում այս փողոցում։ Իսկ դու որտե՞ղ էիր խաղում փոքր ժամանակ։'), mode: 'choice', options: [o('De pequeño jugaba en el patio del colegio.', 'Փոքր ժամանակ դպրոցի բակում էի խաղում։', true), o('De pequeño jugaré en el patio.', '(սխալ ժամանակ)'), o('De pequeño he jugado mañana.', '(սխալ)')], explain: t('«De pequeño» (costumbre pasada) → imperfecto.', '«De pequeño» (անցյալի սովորություն) → imperfecto։'), topic: 'imperfecto' },
  ] },
  { id: 'socorrista', name: 'Álex', role: t('Socorrista de la playa', 'Լողափի փրկարար'), voice: { pitch: 1.0, rate: 1.1, voice: 1 }, look: { shirt: '#e53935', shorts: '#e53935', hairStyle: 'fade', height: 1.1 }, place: 'beach', offset: [10, -8], greeting: t('¡Hola! Hoy el mar está tranquilo.', 'Բարև։ Այսօր ծովը հանգիստ է։'), free: [
    { npc: t('¿Sabes nadar?', 'Լողալ գիտե՞ս։'), mode: 'choice', options: [o('Sí, sé nadar muy bien.', 'Այո, շատ լավ գիտեմ լողալ։', true), o('Sí, sé nadar muy bueno.', '(սխալ՝ bueno)'), o('Sí, conozco nadar.', '(սխալ բայ)')], explain: t('Saber + infinitivo (habilidad); bien con verbos.', 'Saber + անորոշ ձև (կարողություն). bien-ը՝ բայերի հետ։'), topic: 'bienbueno' },
  ] },
];


// ------------------------------------------------------------------ people inside buildings
const ex = (npc: Tr, options: Option[], extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'choice', options, ...extra });
const lx = (npc: Tr, options: Option[], extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'listen', options, ...extra });
const bx = (npc: Tr, answer: Tr, extra: Partial<Exchange> = {}): Exchange => ({ npc, mode: 'build', answer, ...extra });

export const EXTRAS: NpcDef[] = [
  {
    id: 'senora_pilar', name: 'Señora Pilar', role: t('Clienta del supermercado', 'Սուպերմարկետի հաճախորդուհի'), voice: { pitch: 1.15, rate: 0.9, voice: 0 },
    look: { shirt: '#7d3c98', shorts: '#34495e', longPants: true, hair: '#cfcfcf', hairStyle: 'bun', height: 1.0 }, interior: 'supermarket', spot: [-8, 8],
    greeting: t('Ay, hijo, ¿me puedes ayudar? ¡No veo nada sin mis gafas!', 'Ախ, տղաս, կօգնե՞ս ինձ։ Առանց ակնոցիս ոչինչ չեմ տեսնում։'),
    free: [
      lx(t('Creo que las dejé en la sección de frutas, cerca de las manzanas.', 'Կարծում եմ՝ թողել եմ մրգերի բաժնում, խնձորների մոտ։'), [o('Están en la sección de frutas.', 'Մրգերի բաժնում են։', true), o('Están en la caja.', 'Դրամարկղի մոտ են։'), o('Están en el coche.', 'Մեքենայում են։')]),
      ex(t('¿Las buscas tú, por favor?', 'Դու կփնտրե՞ս, խնդրում եմ։'), [o('¡Claro! Voy a buscarlas ahora mismo.', 'Իհարկե։ Հենց հիմա կգնամ փնտրելու։', true), o('No, gracias. Tengo hambre.', 'Ոչ, շնորհակալություն։ Քաղցած եմ։'), o('Las gafas es bonitas.', '(սխալ)')]),
    ],
    quest: {
      id: 'q_gafas', item: { id: 'gafas', shape: 'glasses', label: t('Tomar las gafas de la señora Pilar', 'Վերցնել տիկին Պիլարի ակնոցը'), interior: 'supermarket', x: -9, z: -6 },
      remind: t('¿Has encontrado mis gafas? Busca en la sección de frutas.', 'Գտա՞ր ակնոցս։ Փնտրիր մրգերի բաժնում։'),
      give: ex(t('¿Son esas mis gafas?', 'Դրանք իմ ակնո՞ցն են։'), [o('Sí, aquí tiene sus gafas.', 'Այո, ահա Ձեր ակնոցը։', true), o('Sí, aquí tienes tus zapatos.', 'Այո, ահա քո կոշիկները։'), o('No, son mías.', 'Ոչ, իմն են։')]),
      thanks: t('¡Muchísimas gracias, guapo! Toma, para un helado.', 'Շատ շնորհակալ եմ, սիրելիս։ Վերցրու, պաղպաղակի համար։'), reward: { money: 15, xp: 60 },
    },
  },
  {
    id: 'sergio_gym', name: 'Sergio', role: t('Entrenador personal', 'Անձնական մարզիչ'), voice: { pitch: 0.85, rate: 1.05, voice: 1 },
    look: { shirt: '#16181c', shorts: '#16181c', hairStyle: 'fade', height: 1.08 }, interior: 'gym', spot: [0, 2],
    greeting: t('¡Hola, campeón! ¿Vienes a entrenar fuerte hoy?', 'Բարև, չեմպիոն։ Այսօր լավ մարզվելո՞ւ ես եկել։'),
    free: [
      ex(t('¿Cuántas veces entrenas a la semana?', 'Շաբաթը քանի՞ անգամ ես մարզվում։'), [o('Entreno cuatro veces a la semana.', 'Շաբաթը չորս անգամ եմ մարզվում։', true), o('Entreno cuatro semanas a la vez.', '(անհեթեթ)'), o('Soy cuatro veces.', '(սխալ)')], { topic: 'presente' }),
      lx(t('Antes de correr, siempre tienes que calentar diez minutos.', 'Վազելուց առաջ միշտ պետք է տաս րոպե տաքանաս։'), [o('Tengo que calentar diez minutos.', 'Պետք է տաս րոպե տաքանամ։', true), o('Tengo que dormir diez minutos.', 'Պետք է տաս րոպե քնեմ։'), o('Tengo que comer diez pizzas.', 'Պետք է տաս պիցցա ուտեմ։')], { topic: 'tenerque' }),
      bx(t('Y después de entrenar, ¿qué haces?', 'Իսկ մարզվելուց հետո ի՞նչ ես անում։'), t('Me ducho y bebo mucha agua', 'Լոգանք եմ ընդունում և շատ ջուր եմ խմում'), { topic: 'reflexivos' }),
    ],
  },
  {
    id: 'clara_cine', name: 'Clara', role: t('Aficionada al cine', 'Կինոյի սիրահար'), voice: { pitch: 1.3, rate: 1.1, voice: 0 },
    look: { shirt: '#f4f4f4', shorts: '#283593', hairStyle: 'long', height: 0.98 }, interior: 'cinema', spot: [6, 9.5],
    greeting: t('¡Hola! ¿Vienes a ver la película de fútbol?', 'Բարև։ Եկել ես ֆուտբոլի մասին ֆիլմը դիտելո՞ւ։'),
    free: [
      ex(t('¿Qué tipo de películas te gustan más?', 'Ինչպիսի՞ ֆիլմեր ես ամենաշատը սիրում։'), [o('Me gustan más las películas de aventuras.', 'Ամենաշատը արկածային ֆիլմեր եմ սիրում։', true), o('Me gusta más las películas.', '(սխալ՝ gusta)'), o('Soy películas de aventuras.', '(սխալ)')], { topic: 'comparativos' }),
      ex(t('¿Has visto alguna película en español?', 'Որևէ ֆիլմ դիտե՞լ ես իսպաներեն։'), [o('Sí, he visto una el fin de semana.', 'Այո, հանգստյան օրերին մեկը դիտել եմ։', true), o('Sí, veré una ayer.', '(սխալ ժամանակ)'), o('No he visto ninguna nunca mañana.', '(անհեթեթ)')], { topic: 'perfecto' }),
    ],
  },
  {
    id: 'mr_thompson', name: 'Mr. Thompson', role: t('Turista inglés', 'Անգլիացի զբոսաշրջիկ'), voice: { pitch: 0.9, rate: 0.85, voice: 1 },
    look: { shirt: '#d4a017', shorts: '#5d4037', hair: '#c9a45c', height: 1.1 }, interior: 'airport', spot: [6, 8],
    greeting: t('Perdón… mi español es malo. ¡He perdido mi pasaporte!', 'Ներողություն… իսպաներենս վատն է։ Կորցրել եմ անձնագիրս։'),
    free: [
      lx(t('Estaba sentado en el banco, cerca de la puerta de embarque.', 'Նստած էի նստարանին, նստեցման դարպասի մոտ։'), [o('Estaba cerca de la puerta de embarque.', 'Նստեցման դարպասի մոտ էր։', true), o('Estaba en el avión.', 'Ինքնաթիռում էր։'), o('Estaba en la playa.', 'Լողափում էր։')], { topic: 'imperfecto' }),
      ex(t('¿Me ayudas a buscarlo, por favor?', 'Կօգնե՞ս փնտրել, խնդրում եմ։'), [o('Sí, no se preocupe. Voy a buscarlo.', 'Այո, մի անհանգստացեք։ Կգնամ փնտրելու։', true), o('No, mi vuelo sale ayer.', '(սխալ)'), o('Sí, es un pasaporte rojo grande perro.', '(անհեթեթ)')]),
    ],
    quest: {
      id: 'q_pasaporte', item: { id: 'pasaporte_t', shape: 'passport', label: t('Tomar el pasaporte del turista', 'Վերցնել զբոսաշրջիկի անձնագիրը'), interior: 'airport', x: -11, z: 10 },
      remind: t('¿Lo has encontrado? Yo estaba cerca de la puerta de embarque.', 'Գտա՞ր։ Ես նստեցման դարպասի մոտ էի։'),
      give: ex(t('Oh! ¿Es mi pasaporte?', 'Օ՜, իմ անձնագի՞րն է։'), [o('Sí, lo he encontrado cerca de la puerta.', 'Այո, գտա դարպասի մոտ։', true), o('Sí, lo encontraré mañana.', '(սխալ ժամանակ)'), o('No, es un billete de tren.', 'Ոչ, գնացքի տոմս է։')], { topic: 'perfecto' }),
      thanks: t('Thank you… ¡Muchas gracias, amigo! Eres un héroe.', 'Շնորհակալություն… Շատ շնորհակալ եմ, ընկեր։ Դու հերոս ես։'), reward: { money: 25, xp: 80 },
    },
  },
  {
    id: 'dona_rosa', name: 'Doña Rosa', role: t('Viajera', 'Ճամփորդուհի'), voice: { pitch: 1.05, rate: 0.85, voice: 0 },
    look: { shirt: '#b03a5b', shorts: '#3e2723', longPants: true, hair: '#dddddd', hairStyle: 'bun', height: 0.98 }, interior: 'station', spot: [2, 5],
    greeting: t('Buenos días, joven. No encuentro mi maleta azul…', 'Բարի լույս, երիտասարդ։ Չեմ գտնում իմ կապույտ ճամպրուկը…'),
    free: [
      lx(t('Creo que la dejé al lado de la máquina de café, a la izquierda.', 'Կարծում եմ՝ թողել եմ սուրճի ավտոմատի կողքին, ձախ կողմում։'), [o('Está a la izquierda, al lado del café.', 'Ձախ կողմում է, սուրճի կողքին։', true), o('Está a la derecha del tren.', 'Գնացքի աջ կողմում է։'), o('Está en Sevilla.', 'Սևիլյայում է։')]),
    ],
    quest: {
      id: 'q_maleta', item: { id: 'maleta_rosa', shape: 'suitcase', label: t('Tomar la maleta azul', 'Վերցնել կապույտ ճամպրուկը'), interior: 'station', x: -13, z: 6 },
      remind: t('¿Has visto mi maleta azul? Está a la izquierda.', 'Իմ կապույտ ճամպրուկը տեսե՞լ ես։ Ձախ կողմում է։'),
      give: ex(t('¡Mi maleta! ¿Dónde estaba?', 'Իմ ճամպրուկը։ Որտե՞ղ էր։'), [o('Estaba a la izquierda, al lado del café.', 'Ձախ կողմում էր, սուրճի կողքին։', true), o('Fue a la izquierda mañana.', '(սխալ)'), o('Es en el tren.', '(սխալ՝ es)')], { topic: 'imperfecto' }),
      thanks: t('¡Qué chico tan amable! Mi tren sale en diez minutos. ¡Gracias!', 'Ինչ բարի տղա է։ Գնացքս մեկնում է տաս րոպեից։ Շնորհակալություն։'), reward: { money: 20, xp: 70 },
    },
  },
  {
    id: 'sofia_estudiante', name: 'Sofía', role: t('Compañera de clase', 'Դասընկերուհի'), voice: { pitch: 1.35, rate: 1.1, voice: 0 },
    look: { shirt: '#1abc9c', shorts: '#2c3e50', hairStyle: 'long', height: 0.97 }, interior: 'school', spot: [-7, 5],
    greeting: t('¡RAZ! ¿Me ayudas con los deberes de español?', 'ՌԱԶ։ Կօգնե՞ս իսպաներենի տնայինով։'),
    free: [
      ex(t('¿Cómo se dice: «Երբ փոքր էի, ապրում էի Երևանում»?', 'Ինչպե՞ս ասել՝ «Երբ փոքր էի, ապրում էի Երևանում»։'), [o('Cuando era pequeño, vivía en Ereván.', 'Երբ փոքր էի, ապրում էի Երևանում։', true), o('Cuando fui pequeño, viví en Ereván.', '(ոչ այնքան բնական)'), o('Cuando soy pequeño, vivo en Ereván.', '(ներկա ժամանակ)')], { topic: 'imperfecto' }),
      bx(t('Y ahora una frase con «mañana».', 'Իսկ հիմա մի նախադասություն «mañana»-ով։'), t('Mañana jugaré al fútbol', 'Վաղը ֆուտբոլ կխաղամ'), { topic: 'futuro' }),
    ],
  },
  {
    id: 'senor_ruiz', name: 'Señor Ruiz', role: t('Cliente del taller', 'Արհեստանոցի հաճախորդ'), voice: { pitch: 0.75, rate: 0.95, voice: 1 },
    look: { shirt: '#5d6d7e', shorts: '#2c3e50', longPants: true, hair: '#777', height: 1.08 }, interior: 'workshop', spot: [-6, 5],
    greeting: t('Mi coche hace un ruido muy raro desde ayer…', 'Մեքենաս երեկվանից շատ տարօրինակ ձայն է հանում…'),
    free: [
      ex(t('¿Tú sabes algo de coches?', 'Դու մեքենաներից որևէ բան հասկանո՞ւմ ես։'), [o('Un poco. Pregunte al mecánico, Antonio.', 'Մի քիչ։ Հարցրեք մեխանիկ Անտոնիոյին։', true), o('Sí, soy un coche.', '(անհեթեթ)'), o('No sé ningún.', '(սխալ)')]),
      lx(t('Antonio dice que estará listo el viernes por la tarde.', 'Անտոնիոն ասում է, որ պատրաստ կլինի ուրբաթ երեկոյան։'), [o('Estará listo el viernes por la tarde.', 'Պատրաստ կլինի ուրբաթ երեկոյան։', true), o('Estará listo el lunes por la mañana.', 'Պատրաստ կլինի երկուշաբթի առավոտյան։'), o('Ya está listo.', 'Արդեն պատրաստ է։')], { topic: 'futuro' }),
    ],
  },
  {
    id: 'leo_gamer', name: 'Leo', role: t('Jugador del centro de juegos', 'Խաղային կենտրոնի խաղացող'), voice: { pitch: 1.25, rate: 1.2, voice: 1 },
    look: { shirt: '#2fb5ff', shorts: '#16181c', hairStyle: 'short', height: 0.99 }, interior: 'gamecenter', spot: [13, 0],
    greeting: t('¡Ey! ¿Juegas a Word Shooter? ¡Mi récord es de doscientos puntos!', 'Հեյ։ Word Shooter խաղո՞ւմ ես։ Իմ ռեկորդը երկու հարյուր միավոր է։'),
    free: [
      ex(t('¿Cuál es tu juego favorito aquí?', 'Ո՞րն է այստեղ քո սիրելի խաղը։'), [o('Mi juego favorito es Penalty Challenge.', 'Իմ սիրելի խաղը Penalty Challenge-ն է։', true), o('Mi juego favorito son el balón.', '(սխալ)'), o('Juego favorito mí.', '(սխալ)')]),
      ex(t('¿Crees que puedes ganarme?', 'Կարծում ես՝ կարո՞ղ ես հաղթել ինձ։'), [o('¡Claro! Soy más rápido que tú.', 'Իհարկե։ Ես քեզնից ավելի արագ եմ։', true), o('Soy más rápido de tú.', '(սխալ՝ de)'), o('Soy muy rápido que tú.', '(սխալ՝ muy)')], { topic: 'comparativos' }),
    ],
  },
  {
    id: 'ines_moda', name: 'Inés', role: t('Dependienta de moda', 'Հագուստի խանութի վաճառողուհի'), voice: { pitch: 1.2, rate: 1.1, voice: 0 },
    look: { shirt: '#16181c', shorts: '#16181c', longPants: true, hairStyle: 'long', height: 1.03 }, interior: 'mall', spot: [-18, -2],
    greeting: t('¡Hola! Hoy tenemos un descuento del veinte por ciento.', 'Բարև։ Այսօր քսան տոկոս զեղչ ունենք։'),
    free: [
      ex(t('¿Qué talla usas?', 'Ո՞ր չափսն ես կրում։'), [o('Uso la talla M.', 'M չափսն եմ կրում։', true), o('Uso la talla de pizza.', '(անհեթեթ)'), o('Estoy talla M.', '(սխալ)')]),
      lx(t('Esta camiseta cuesta treinta euros, pero hoy cuesta veinticuatro.', 'Այս մարզաշապիկն արժե երեսուն եվրո, բայց այսօր արժե քսանչորս։'), [o('Hoy cuesta veinticuatro euros.', 'Այսօր արժե քսանչորս եվրո։', true), o('Hoy cuesta treinta y cuatro euros.', 'Այսօր արժե երեսունչորս եվրո։'), o('Hoy es gratis.', 'Այսօր անվճար է։')]),
    ],
  },
  {
    id: 'pablo_junior', name: 'Pablo', role: t('Jugador de la academia', 'Ակադեմիայի խաղացող'), voice: { pitch: 1.15, rate: 1.1, voice: 1 },
    look: { shirt: '#ff6a00', shorts: '#16181c', hairStyle: 'fade', height: 1.02 }, interior: 'academy', spot: [-7, 4],
    greeting: t('¡Hola! Yo entreno aquí desde hace dos años.', 'Բարև։ Ես այստեղ մարզվում եմ արդեն երկու տարի։'),
    free: [
      ex(t('¿Desde cuándo juegas tú?', 'Իսկ դու երբվանի՞ց ես խաղում։'), [o('Llevo seis años jugando al fútbol.', 'Արդեն վեց տարի է՝ ֆուտբոլ եմ խաղում։', true), o('Llevo jugar seis años.', '(սխալ)'), o('Juego desde hace mañana.', '(անհեթեթ)')], { topic: 'llevargerundio' }),
      lx(t('El director es muy estricto, pero es muy buen entrenador.', 'Տնօրենը շատ խիստ է, բայց շատ լավ մարզիչ է։'), [o('Es estricto, pero es buen entrenador.', 'Խիստ է, բայց լավ մարզիչ է։', true), o('Es malo y no entrena.', 'Վատն է և չի մարզում։'), o('No hay director.', 'Տնօրեն չկա։')]),
    ],
  },
  {
    id: 'charla', name: 'Lucía', role: t('Compañera de conversación', 'Զրուցակից'), voice: { pitch: 1.0, rate: 0.88, voice: 0 },
    look: { shirt: '#ff6a00', shorts: '#16181c', hairStyle: 'long', height: 1.0 },
    greeting: t('¡Hola, Raz! Vamos a charlar un rato en español. Habla tranquilo.', 'Բարև, Ռազ։ Եկ մի քիչ զրուցենք իսպաներեն։ Խոսիր հանգիստ։'),
    free: [],
  },
  // seated customers in the cafeteria and the restaurant
  { id: 'cliente_cafe0', name: 'Marta y su café', role: t('Clienta de la cafetería', 'Սրճարանի հաճախորդուհի'), voice: { pitch: 1.2, rate: 1, voice: 0 }, look: { shirt: '#e67e22', shorts: '#34495e', longPants: true, hairStyle: 'long' }, interior: 'cafe',
    greeting: t('Aquí hacen el mejor café de la ciudad.', 'Այստեղ քաղաքի լավագույն սուրճն են պատրաստում։'),
    free: [ex(t('¿Tú qué vas a tomar?', 'Իսկ դու ի՞նչ ես խմելու։'), [o('Voy a tomar un zumo de naranja.', 'Նարնջի հյութ եմ խմելու։', true), o('Voy a tomar un autobús de naranja.', '(անհեթեթ)'), o('Tomé un zumo mañana.', '(սխալ)')], { topic: 'futuro' })] },
  { id: 'cliente_cafe2', name: 'Don Luis', role: t('Cliente que lee el periódico', 'Թերթ կարդացող հաճախորդ'), voice: { pitch: 0.75, rate: 0.9, voice: 1 }, look: { shirt: '#5d6d7e', shorts: '#2c3e50', longPants: true, hair: '#bbbbbb' }, interior: 'cafe',
    greeting: t('¿Has visto el periódico? ¡Habla del torneo de fútbol!', 'Թերթը տեսե՞լ ես։ Ֆուտբոլային մրցաշարի մասին է գրում։'),
    free: [lx(t('Dice que el partido de mañana empieza a las seis.', 'Գրում է, որ վաղվա խաղը սկսվում է ժամը վեցին։'), [o('Empieza a las seis.', 'Սկսվում է ժամը վեցին։', true), o('Empieza a las dos.', 'Սկսվում է ժամը երկուսին։'), o('Empezó ayer.', 'Սկսվեց երեկ։')])] },
  { id: 'cliente_cafe4', name: 'Nuria', role: t('Estudiante en la cafetería', 'Ուսանողուհի սրճարանում'), voice: { pitch: 1.3, rate: 1.1, voice: 0 }, look: { shirt: '#2e8b57', shorts: '#283593', hairStyle: 'bun' }, interior: 'cafe',
    greeting: t('Estoy estudiando para un examen muy difícil.', 'Պատրաստվում եմ շատ դժվար քննության։'),
    free: [ex(t('¿Qué estás haciendo tú?', 'Իսկ դու ի՞նչ ես անում։'), [o('Estoy descansando después del entrenamiento.', 'Հանգստանում եմ մարզումից հետո։', true), o('Estoy descansado después.', '(սխալ)'), o('Soy descansando.', '(սխալ)')], { topic: 'estargerundio' })] },
  { id: 'cliente_restaurant0', name: 'Familia García', role: t('Familia que cena', 'Ընթրող ընտանիք'), voice: { pitch: 0.9, rate: 1, voice: 1 }, look: { shirt: '#2f5fa7', shorts: '#2c3e50', longPants: true }, interior: 'restaurant',
    greeting: t('¡Hoy celebramos el cumpleaños de la abuela!', 'Այսօր տատիկի ծննդյան օրն ենք նշում։'),
    free: [ex(t('¿Cuándo es tu cumpleaños?', 'Իսկ քո ծննդյան օրը ե՞րբ է։'), [o('Mi cumpleaños es en verano.', 'Իմ ծննդյան օրն ամռանն է։', true), o('Mi cumpleaños está en verano.', '(սխալ՝ está)'), o('Tengo cumpleaños verano.', '(սխալ)')], { topic: 'serestar' })] },
  { id: 'cliente_restaurant2', name: 'Chef Paco', role: t('Cocinero del restaurante', 'Ռեստորանի խոհարար'), voice: { pitch: 0.8, rate: 1.05, voice: 1 }, look: { shirt: '#f4f4f4', shorts: '#16181c', longPants: true, hair: '#555' }, interior: 'restaurant',
    greeting: t('La paella de hoy está espectacular. ¡La he hecho yo!', 'Այսօրվա պաելյան հիանալի է։ Ես եմ պատրաստել։'),
    free: [lx(t('El secreto es cocinar el arroz veinte minutos sin removerlo.', 'Գաղտնիքն այն է, որ բրինձը եփես քսան րոպե՝ առանց խառնելու։'), [o('Sin remover el arroz.', 'Առանց բրինձը խառնելու։', true), o('Removiendo todo el tiempo.', 'Անընդհատ խառնելով։'), o('Con mucho chocolate.', 'Շատ շոկոլադով։')])] },
  { id: 'cliente_restaurant4', name: 'Turistas', role: t('Pareja de turistas', 'Զբոսաշրջիկ զույգ'), voice: { pitch: 1.1, rate: 0.9, voice: 0 }, look: { shirt: '#d4a017', shorts: '#5d4037', hairStyle: 'long' }, interior: 'restaurant',
    greeting: t('¡Nos encanta España! La comida es buenísima.', 'Մենք շատ ենք սիրում Իսպանիան։ Ուտելիքը հիանալի է։'),
    free: [ex(t('¿Qué plato español nos recomiendas?', 'Իսպանական ո՞ր ուտեստը կխորհուրդ տաս մեզ։'), [o('Les recomiendo la paella valenciana.', 'Խորհուրդ եմ տալիս վալենսիական պաելյան։', true), o('Les recomiendo el autobús.', '(անհեթեթ)'), o('Recomiendo nada ningún.', '(սխալ)')])] },

  // ---------------------------------------------------------------- street encounters
  {
    id: 'nino_dani', name: 'Dani', role: t('Niño del barrio', 'Թաղի տղա'), voice: { pitch: 1.5, rate: 1.15, voice: 1 },
    look: { shirt: '#c0392b', shorts: '#2c3e50', hairStyle: 'short', height: 0.82 }, place: 'park', offset: [18, 14],
    greeting: t('¡RAZ! ¡Eres RAZ, el futbolista! ¿Me ayudas?', 'ՌԱԶ։ Դու ՌԱԶ-ն ես, ֆուտբոլիստը։ Կօգնե՞ս։'),
    free: [
      lx(t('Mi balón ha rodado hasta la fuente del parque.', 'Գնդակս գլորվել է մինչև այգու շատրվանը։'), [o('Tu balón está en la fuente.', 'Գնդակդ շատրվանի մոտ է։', true), o('Tu balón está en la playa.', 'Գնդակդ լողափում է։'), o('Tu balón está en casa.', 'Գնդակդ տանն է։')]),
      ex(t('¿Me lo traes, por favor?', 'Կբերե՞ս ինձ, խնդրում եմ։'), [o('¡Claro! Ahora te lo traigo.', 'Իհարկե։ Հիմա կբերեմ։', true), o('Ahora te lo llevo a la luna.', '(անհեթեթ)'), o('No traigo ningún.', '(սխալ)')], { topic: 'llevartraer' }),
    ],
    quest: {
      id: 'q_balon', item: { id: 'balon_dani', shape: 'ball', label: t('Tomar el balón de Dani', 'Վերցնել Դանիի գնդակը'), place: 'park', x: 0, z: 4.4 },
      remind: t('¡Está en la fuente, en el centro del parque!', 'Շատրվանի մոտ է, այգու կենտրոնում։'),
      give: ex(t('¡Mi balón! ¿Me firmas un autógrafo también?', 'Իմ գնդակը։ Ինքնագիր էլ կտա՞ս։'), [o('¡Claro! Aquí tienes tu balón y mi autógrafo.', 'Իհարկե։ Ահա քո գնդակը և իմ ինքնագիրը։', true), o('No, el balón es mío.', 'Ոչ, գնդակը իմն է։'), o('Aquí tienes tus gafas.', 'Ահա քո ակնոցը։')]),
      thanks: t('¡Gracias, RAZ! ¡Cuando sea mayor quiero ser como tú!', 'Շնորհակալություն, ՌԱԶ։ Երբ մեծանամ, ուզում եմ քեզ նման լինել։'), reward: { money: 10, xp: 60 },
    },
  },
  {
    id: 'senor_martin', name: 'Señor Martín', role: t('Vecino preocupado', 'Մտահոգ հարևան'), voice: { pitch: 0.8, rate: 0.95, voice: 1 },
    look: { shirt: '#34495e', shorts: '#2c3e50', longPants: true, hair: '#888', height: 1.07 }, place: 'plaza', offset: [-14, 12],
    greeting: t('¡Qué desastre! He perdido mi cartera…', 'Ինչ աղետ է։ Դրամապանակս կորցրել եմ…'),
    free: [
      lx(t('Esta mañana fui al cine. Creo que se me cayó en la puerta.', 'Այսօր առավոտյան կինո գնացի։ Կարծում եմ՝ դռան մոտ է ընկել։'), [o('Se le cayó en la puerta del cine.', 'Կինոյի դռան մոտ է ընկել։', true), o('Se le cayó en el supermercado.', 'Սուպերմարկետում է ընկել։'), o('Se le cayó en el mar.', 'Ծովն է ընկել։')], { topic: 'indefinido' }),
      ex(t('¿Puedes ir a mirar?', 'Կարո՞ղ ես գնալ նայել։'), [o('Sí, voy al cine a buscarla.', 'Այո, գնում եմ կինոթատրոն այն փնտրելու։', true), o('Sí, vengo al cine ayer.', '(սխալ)'), o('Sí, la cartera es en el cine.', '(սխալ՝ es)')], { topic: 'irvenir' }),
    ],
    quest: {
      id: 'q_cartera', item: { id: 'cartera', shape: 'wallet', label: t('Tomar la cartera del señor Martín', 'Վերցնել պարոն Մարտինի դրամապանակը'), place: 'cinema', door: true, x: 3.5, z: 1 },
      remind: t('¿La has encontrado? Estaba en la puerta del cine.', 'Գտա՞ր։ Կինոթատրոնի դռան մոտ էր։'),
      give: ex(t('¿Es mi cartera? ¡Qué alegría!', 'Իմ դրամապանա՞կն է։ Ինչ ուրախություն։'), [o('Sí, la he encontrado en la puerta del cine.', 'Այո, գտա կինոթատրոնի դռան մոտ։', true), o('Sí, la encontraré mañana.', '(սխալ ժամանակ)'), o('No, es un balón.', 'Ոչ, գնդակ է։')], { topic: 'perfecto' }),
      thanks: t('¡Eres muy honrado, RAZ! Toma esta recompensa.', 'Դու շատ ազնիվ ես, ՌԱԶ։ Վերցրու այս պարգևը։'), reward: { money: 30, xp: 80 },
    },
  },
  {
    id: 'nerea_perro', name: 'Nerea', role: t('Chica que busca a su perro', 'Շանը փնտրող աղջիկ'), voice: { pitch: 1.35, rate: 1.1, voice: 0 },
    look: { shirt: '#f4f4f4', shorts: '#e67e22', hairStyle: 'long', height: 0.97 }, place: 'beach', offset: [-20, -6],
    greeting: t('¡Toby! ¡Toby! Ay… ¿has visto a mi perro?', 'Թոբի։ Թոբի։ Ախ… իմ շանը տեսե՞լ ես։'),
    free: [
      lx(t('Es pequeño, blanco y marrón. Corrió hacia el aparcamiento.', 'Փոքր է, սպիտակ ու շագանակագույն։ Վազեց դեպի կայանատեղի։'), [o('Corrió hacia el aparcamiento.', 'Վազեց դեպի կայանատեղի։', true), o('Corrió hacia el aeropuerto.', 'Վազեց դեպի օդանավակայան։'), o('Está durmiendo en casa.', 'Տանը քնած է։')], { topic: 'indefinido' }),
      ex(t('¿Cómo es mi perro?', 'Ինչպիսի՞ն է իմ շունը։'), [o('Es pequeño, blanco y marrón.', 'Փոքր է, սպիտակ ու շագանակագույն։', true), o('Está pequeño y blanco.', '(սխալ՝ está)'), o('Es grande y negro.', 'Մեծ է և սև։')], { topic: 'serestar' }),
    ],
    quest: {
      id: 'q_toby', item: { id: 'toby', shape: 'dog', label: t('Tomar a Toby, el perro', 'Վերցնել Թոբի շանը'), place: 'parking', x: 12, z: 22 },
      remind: t('Toby corrió hacia el aparcamiento. ¡Por favor, búscalo!', 'Թոբին վազեց դեպի կայանատեղի։ Խնդրում եմ, փնտրիր։'),
      give: ex(t('¡Toby! ¿Dónde estaba?', 'Թոբի։ Որտե՞ղ էր։'), [o('Estaba en el aparcamiento, debajo de un coche.', 'Կայանատեղիում էր, մի մեքենայի տակ։', true), o('Estuvo mañana en el coche.', '(սխալ)'), o('Era en el aparcamiento.', '(սխալ՝ era)')], { topic: 'imperfecto' }),
      thanks: t('¡Muchas gracias, RAZ! Toby, dale las gracias. ¡Guau!', 'Շատ շնորհակալություն, ՌԱԶ։ Թոբի, շնորհակալություն հայտնիր։ Հաֆ։'), reward: { money: 20, xp: 90 },
    },
  },
  {
    id: 'toni_repartidor', name: 'Toni', role: t('Repartidor', 'Առաքիչ'), voice: { pitch: 0.95, rate: 1.2, voice: 1 },
    look: { shirt: '#ff6a00', shorts: '#16181c', longPants: true, hairStyle: 'short', height: 1.05 }, place: 'mall', offset: [26, 26],
    greeting: t('¡Uf, qué día! Se me ha caído un paquete y no sé dónde.', 'Ուֆ, ինչ օր է։ Մի ծանրոց է ընկել, ու չգիտեմ՝ որտեղ։'),
    free: [
      lx(t('Pasé por la escuela con la bici y creo que se cayó allí.', 'Հեծանիվով անցա դպրոցի մոտով, և կարծում եմ՝ այնտեղ է ընկել։'), [o('Se cayó cerca de la escuela.', 'Դպրոցի մոտ է ընկել։', true), o('Se cayó en el estadio.', 'Մարզադաշտում է ընկել։'), o('No se cayó nada.', 'Ոչինչ չի ընկել։')], { topic: 'indefinido' }),
    ],
    quest: {
      id: 'q_paquete', item: { id: 'paquete', shape: 'box', label: t('Tomar el paquete de Toni', 'Վերցնել Տոնիի ծանրոցը'), place: 'school', door: true, x: -4, z: 1.5 },
      remind: t('El paquete tiene que estar cerca de la escuela.', 'Ծանրոցը պետք է որ դպրոցի մոտ լինի։'),
      give: ex(t('¿Es mi paquete?', 'Իմ ծանրո՞ցն է։'), [o('Sí, estaba delante de la escuela.', 'Այո, դպրոցի առջև էր։', true), o('Sí, estaba detrás del mar.', '(անհեթեթ)'), o('No, es una pizza.', 'Ոչ, պիցցա է։')]),
      thanks: t('¡Me has salvado el día! Toma, una propina.', 'Փրկեցիր իմ օրը։ Վերցրու, թեյավճար։'), reward: { money: 25, xp: 70 },
    },
  },
  {
    id: 'pintor', name: 'Hugo el pintor', role: t('Artista callejero', 'Փողոցային նկարիչ'), voice: { pitch: 1.0, rate: 0.95, voice: 1 },
    look: { shirt: '#7d3c98', shorts: '#16181c', longPants: true, hair: '#a87a3d', hairStyle: 'long', height: 1.06 }, place: 'sportshop', offset: [-12, 20],
    greeting: t('¡Hola! Estoy pintando un mural del estadio. ¿Te gusta?', 'Բարև։ Մարզադաշտի որմնանկար եմ նկարում։ Դուր է գալիս՞։'),
    free: [
      ex(t('¿De qué color pinto el cielo?', 'Երկինքը ի՞նչ գույնով նկարեմ։'), [o('Píntalo de azul claro.', 'Նկարիր բաց կապույտ։', true), o('Píntalo de azul clara.', '(սխալ սեռ)'), o('Lo pinto ayer azul.', '(սխալ)')], { topic: 'imperativo' }),
      bx(t('¿Y qué pongo en la camiseta del jugador?', 'Իսկ խաղացողի մարզաշապիկին ի՞նչ գրեմ։'), t('Pon el número siete', 'Գրիր յոթ համարը'), { topic: 'imperativo' }),
    ],
  },
];

NPCS.push(...EXTRAS);
export const npcById = (id: string) => NPCS.find((n) => n.id === id);

/** Things passers-by ask in the street. */
export const STREET_TALK: Exchange[] = [
  {
    npc: t('Perdona, ¿sabes dónde está la estación de tren?', 'Ներողություն, գիտե՞ս՝ որտեղ է երկաթուղային կայարանը։'),
    mode: 'choice',
    options: [o('Sí, está al norte, cerca de la Plaza Mayor.', 'Այո, հյուսիսում է, Կենտրոնական հրապարակի մոտ։', true), o('Sí, es al norte.', '(սխալ՝ es)'), o('No, tengo hambre.', 'Ոչ, քաղցած եմ։')],
    explain: t('Ubicación → estar: está al norte.', 'Գտնվելու վայր → estar՝ está al norte։'),
    topic: 'serestar',
  },
  {
    npc: t('¿Qué hora es, por favor?', 'Ժամը քանի՞սն է, խնդրում եմ։'),
    mode: 'choice',
    options: [o('Son las cinco y media.', 'Հինգն անց կես է։', true), o('Es las cinco y media.', '(սխալ՝ es)'), o('Tengo las cinco.', '(սխալ)')],
    explain: t('Las horas: «Es la una», pero «Son las dos, las tres…».', 'Ժամերը՝ «Es la una», բայց «Son las dos, las tres…»։'),
    topic: 'serestar',
  },
  {
    npc: t('¿Vas al partido del sábado?', 'Գնալո՞ւ ես շաբաթվա խաղին։'),
    mode: 'build',
    answer: t('Sí voy a jugar en el partido', 'Այո, ես խաղալու եմ այդ խաղում'),
    topic: 'futuro',
  },
  {
    npc: t('¡Qué calor hace hoy! ¿Te gusta el verano?', 'Ինչ շոգ է այսօր։ Ամառը սիրո՞ւմ ես։'),
    mode: 'listen',
    options: [o('Sí, me gusta mucho el verano.', 'Այո, ամառը շատ եմ սիրում։', true), o('Sí, me gustan mucho el verano.', '(սխալ՝ gustan)'), o('Sí, soy el verano.', '(անհեթեթ)')],
    explain: t('Gustar + singular → gusta: me gusta el verano.', 'Gustar + եզակի → gusta՝ me gusta el verano։'),
    topic: 'presente',
  },
  {
    npc: t('¿Me haces una foto con el estadio detrás?', 'Ինձ մի նկար կանե՞ս մարզադաշտի ֆոնին։'),
    mode: 'choice',
    options: [o('¡Claro! Sonríe… ¡Ya está!', 'Իհարկե։ Ժպտա… Պատրաստ է։', true), o('Claro, sonríes ayer.', '(սխալ)'), o('No, la cámara está cansada.', '(անհեթեթ)')],
    topic: 'imperativo',
  },
  {
    npc: t('¿Dónde compraste esas zapatillas?', 'Որտեղի՞ց ես գնել այդ մարզակոշիկները։'),
    mode: 'choice',
    options: [o('Las compré en la tienda de deportes.', 'Գնել եմ սպորտային խանութից։', true), o('Las compro ayer en la tienda.', '(սխալ ժամանակ)'), o('Los compré en la playa.', '(սխալ սեռ)')],
    explain: t('Pasado terminado → indefinido: compré. «Las zapatillas» → las.', 'Ավարտված անցյալ → indefinido՝ compré։ «Las zapatillas» → las։'),
    topic: 'indefinido',
  },
  {
    npc: t('Oye, ¿cuánto tiempo llevas viviendo aquí?', 'Լսիր, որքա՞ն ժամանակ է՝ ապրում ես այստեղ։'),
    mode: 'build',
    answer: t('Llevo un año viviendo aquí', 'Արդեն մեկ տարի է՝ ապրում եմ այստեղ'),
    topic: 'llevargerundio',
  },
];

/** Background customers (seated, non-interactive look variety) */
export const isBackgroundNpc = (id: string) => id.startsWith('cliente_');
