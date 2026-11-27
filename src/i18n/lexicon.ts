// Word-level Spanish → Armenian glossary. Used for per-word breakdown in the
// translation popup and as a fallback when a full sentence has no entry.
export const LEXICON: Record<string, string> = {
  // articles, pronouns, small words
  el: 'որոշյալ հոդ (ար.)', la: 'որոշյալ հոդ (իգ.)', los: 'որոշյալ հոդ (հոգն.)', las: 'որոշյալ հոդ (իգ. հոգն.)',
  un: 'մի (ար.)', una: 'մի (իգ.)', unos: 'մի քանի', unas: 'մի քանի',
  y: 'և', o: 'կամ', pero: 'բայց', porque: 'որովհետև', que: 'որ', si: 'եթե', sí: 'այո', no: 'ոչ / չ-',
  yo: 'ես', tú: 'դու', tu: 'քո', él: 'նա (ար.)', ella: 'նա (իգ.)', nosotros: 'մենք', vosotros: 'դուք', ellos: 'նրանք',
  usted: 'Դուք (քաղաքավարի)', me: 'ինձ', te: 'քեզ', se: 'իրեն / -վել', nos: 'մեզ', le: 'նրան', lo: 'այն', les: 'նրանց',
  mi: 'իմ', mis: 'իմ (հոգն.)', tus: 'քո (հոգն.)', su: 'նրա / Ձեր', sus: 'նրանց', nuestro: 'մեր', nuestra: 'մեր',
  este: 'այս', esta: 'այս', ese: 'այդ', esa: 'այդ', esto: 'սա', eso: 'դա', aquí: 'այստեղ', allí: 'այնտեղ', ahí: 'այդտեղ',
  de: '-ի / -ից', del: '-ի (de+el)', a: 'դեպի / -ին', al: 'դեպի (a+el)', en: 'մեջ / վրա', con: 'հետ', sin: 'առանց',
  por: 'միջով / համար / պատճառով', para: 'համար / որպեսզի', hasta: 'մինչև', desde: '-ից սկսած', sobre: 'վրա / մասին',
  entre: 'միջև', cerca: 'մոտ', lejos: 'հեռու', delante: 'առջևում', detrás: 'հետևում', dentro: 'ներսում', fuera: 'դրսում',
  muy: 'շատ (որակ)', mucho: 'շատ (քանակ)', mucha: 'շատ', muchos: 'շատ (հոգն.)', poco: 'քիչ', más: 'ավելի', menos: 'պակաս',
  bien: 'լավ (ինչպես)', bueno: 'լավ (ինչպիսի)', buena: 'լավ', malo: 'վատ', mal: 'վատ', mejor: 'ավելի լավ', peor: 'ավելի վատ',
  también: 'նույնպես', tampoco: 'նույնպես ոչ', ya: 'արդեն', todavía: 'դեռ', siempre: 'միշտ', nunca: 'երբեք', ahora: 'հիմա',
  hoy: 'այսօր', mañana: 'վաղը / առավոտ', ayer: 'երեկ', luego: 'հետո', después: 'հետո', antes: 'նախքան', pronto: 'շուտով',
  alguno: 'որևէ մեկը', alguna: 'որևէ մեկը', algún: 'որևէ', ninguno: 'ոչ մեկը', ninguna: 'ոչ մեկը', ningún: 'ոչ մի', nada: 'ոչինչ',
  algo: 'ինչ-որ բան', todo: 'ամեն ինչ', todos: 'բոլորը', cada: 'յուրաքանչյուր', otro: 'ուրիշ', otra: 'ուրիշ',
  qué: 'ինչ', quién: 'ով', dónde: 'որտեղ', cuándo: 'երբ', cómo: 'ինչպես', cuánto: 'որքան', cuántos: 'քանի', cuál: 'որը', por_qué: 'ինչու',
  hola: 'բարև', adiós: 'ցտեսություն', gracias: 'շնորհակալություն', favor: 'բարեհաճություն', perdón: 'ներողություն',
  vale: 'լավ / համաձայն եմ', claro: 'իհարկե', genial: 'հիանալի', vamos: 'գնանք', venga: 'դե՛', bienvenido: 'բարի գալուստ',
  // verbs (infinitive + common forms)
  ser: 'լինել (էություն)', soy: 'ես եմ', eres: 'դու ես', es: 'նա է', somos: 'մենք ենք', son: 'նրանք են', era: 'էր',
  estar: 'լինել (վիճակ, տեղ)', estoy: 'ես եմ (վիճակ)', estás: 'դու ես (վիճակ)', está: 'նա է (վիճակ)', están: 'նրանք են', estaba: 'էր (վիճակ)',
  tener: 'ունենալ', tengo: 'ունեմ', tienes: 'ունես', tiene: 'ունի', tenemos: 'ունենք', tenía: 'ուներ', tuve: 'ունեցա',
  haber: 'լինել (օժանդակ)', hay: 'կա / կան', he: 'ես ... եմ (օժ.)', has: 'դու ... ես (օժ.)', ha: 'նա ... է (օժ.)', había: 'կար / ...էր',
  ir: 'գնալ', voy: 'գնում եմ', vas: 'գնում ես', va: 'գնում է', fui: 'գնացի / եղա', fue: 'գնաց / եղավ', iba: 'գնում էր', iré: 'կգնամ', ve: 'գնա՛',
  venir: 'գալ', vengo: 'գալիս եմ', viene: 'գալիս է', ven: 'արի՛', vino: 'եկավ',
  llevar: 'տանել / կրել', lleva: 'տանում է', llevo: 'տանում եմ / արդեն ... եմ', traer: 'բերել', trae: 'բեր՛', traigo: 'բերում եմ',
  llegar: 'հասնել', llego: 'հասնում եմ', llegué: 'հասա', volver: 'վերադառնալ', vuelvo: 'վերադառնում եմ', vuelve: 'վերադարձիր՛',
  hacer: 'անել', hago: 'անում եմ', haces: 'անում ես', hice: 'արեցի', hecho: 'արված', harás: 'կանես', haré: 'կանեմ',
  poder: 'կարողանալ', puedo: 'կարող եմ', puedes: 'կարող ես', puede: 'կարող է', querer: 'ուզել', quiero: 'ուզում եմ', quieres: 'ուզում ես',
  buscar: 'փնտրել', busca: 'փնտրի՛ր', encontrar: 'գտնել', encuentra: 'գտի՛ր', encontré: 'գտա', comprar: 'գնել', compra: 'գնի՛ր',
  hablar: 'խոսել', habla: 'խոսի՛ր', hablo: 'խոսում եմ', jugar: 'խաղալ', juego: 'խաղում եմ / խաղ', juega: 'խաղա՛', jugué: 'խաղացի',
  correr: 'վազել', corre: 'վազի՛ր', saltar: 'ցատկել', salta: 'ցատկի՛ր', pasar: 'փոխանցել / անցնել', pasa: 'փոխանցի՛ր',
  tirar: 'հարվածել / նետել', tira: 'հարվածի՛ր', marcar: 'գոլ խփել', marcado: 'խփած', marqué: 'խփեցի', defender: 'պաշտպանել', defiende: 'պաշտպանի՛ր',
  recuperar: 'հետ վերցնել', recupera: 'հետ վերցրո՛ւ', perder: 'կորցնել', pierdas: 'մի կորցրու', pierdes: 'կորցնում ես', perdí: 'կորցրի',
  confiar: 'վստահել', confía: 'վստահի՛ր', girar: 'թեքվել', gira: 'թեքվի՛ր', seguir: 'շարունակել / հետևել', sigue: 'շարունակի՛ր',
  cruzar: 'անցնել (փողոցը)', cruza: 'անցի՛ր', subir: 'բարձրանալ / նստել', sube: 'նստի՛ր / բարձրացի՛ր', bajar: 'իջնել', baja: 'իջի՛ր',
  salir: 'դուրս գալ', sal: 'դուրս արի՛', entrar: 'մտնել', entra: 'մտի՛ր', parar: 'կանգնել', para_v: 'կանգնի՛ր', aparcar: 'կայանել', aparca: 'կայանի՛ր',
  conducir: 'վարել', conduce: 'վարի՛ր', reducir: 'նվազեցնել', reduce: 'նվազեցրո՛ւ', adelantar: 'առաջ անցնել', adelanta: 'առաջ անցի՛ր',
  continuar: 'շարունակել', continúa: 'շարունակի՛ր', salgas: 'դուրս չգաս', ayudar: 'օգնել', ayuda: 'օգնի՛ր / օգնություն',
  tomar: 'վերցնել / խմել', comer: 'ուտել', como: 'ուտում եմ / ինչպես', beber: 'խմել', bebo: 'խմում եմ', pagar: 'վճարել', paga: 'վճարի՛ր',
  pedir: 'խնդրել / պատվիրել', pide: 'պատվիրի՛ր', sentir: 'զգալ', sientes: 'զգում ես', siento: 'զգում եմ', aprender: 'սովորել', aprendido: 'սովորած',
  entrenar: 'մարզվել', entreno: 'մարզվում եմ', estudiar: 'սովորել', vivir: 'ապրել', vivo: 'ապրում եմ', gustar: 'դուր գալ', gusta: 'դուր է գալիս',
  levantarse: 'արթնանալ / վեր կենալ', ducharse: 'լոգանք ընդունել', llamarse: 'կոչվել', llamo: 'կոչվում եմ', llama: 'կոչվում է',
  ganar: 'հաղթել', ganamos: 'հաղթեցինք', ganado: 'հաղթած', viajar: 'ճամփորդել', esperar: 'սպասել', espera: 'սպասի՛ր', mirar: 'նայել', mira: 'նայի՛ր',
  coger: 'վերցնել', coge: 'վերցրո՛ւ', tomo: 'վերցնում եմ', tomas: 'վերցնում ես', tomado: 'վերցրած', dar: 'տալ', da: 'տո՛ւր', decir: 'ասել', dime: 'ասա՛ ինձ', saber: 'իմանալ', sé: 'գիտեմ', sabes: 'գիտես',
  necesitar: 'կարիք ունենալ', necesito: 'կարիք ունեմ', preparado: 'պատրաստ', preparada: 'պատրաստ', cansado: 'հոգնած', listo: 'պատրաստ',
  // nouns: football
  fútbol: 'ֆուտբոլ', balón: 'գնդակ', pelota: 'գնդակ', portería: 'դարպաս', gol: 'գոլ', goles: 'գոլեր', portero: 'դարպասապահ',
  entrenador: 'մարզիչ', jugador: 'խաղացող', equipo: 'թիմ', partido: 'խաղ / հանդիպում', campo: 'դաշտ', estadio: 'մարզադաշտ',
  entrenamiento: 'մարզում', academia: 'ակադեմիա', compañeros: 'ընկերներ / թիմակիցներ', posición: 'դիրք', espacio: 'տարածություն',
  libre: 'ազատ', concentración: 'կենտրոնացում', penalti: 'պենալտի', falta: 'խախտում / տուգանային', pase: 'փոխանցում', tiro: 'հարված',
  botas: 'բութսեր', camiseta: 'մարզաշապիկ', zapatillas: 'մարզակոշիկներ', mochila: 'պայուսակ', bolsa: 'պայուսակ', competición: 'մրցույթ',
  torneo: 'մրցաշար', campeón: 'չեմպիոն', sueño: 'երազանք', carrera: 'մրցարշավ / կարիերա', árbitro: 'մրցավար', velocidad: 'արագություն',
  // nouns: city
  ciudad: 'քաղաք', calle: 'փողոց', casa: 'տուն', parque: 'այգի', playa: 'լողափ', escuela: 'դպրոց', tienda: 'խանութ', supermercado: 'սուպերմարկետ',
  cafetería: 'սրճարան', restaurante: 'ռեստորան', cine: 'կինոթատրոն', gimnasio: 'մարզասրահ', aeropuerto: 'օդանավակայան', estación: 'կայարան',
  tren: 'գնացք', autobús: 'ավտոբուս', taxi: 'տաքսի', coche: 'մեքենա', bicicleta: 'հեծանիվ', patinete: 'սքութեր', avión: 'ինքնաթիռ',
  puente: 'կամուրջ', camino: 'ճանապարհ', semáforo: 'լուսացույց', derecha: 'աջ', izquierda: 'ձախ', recto: 'ուղիղ', esquina: 'անկյուն',
  centro: 'կենտրոն', comercial: 'առևտրային', taller: 'արհեստանոց', mecánico: 'մեխանիկ', aparcamiento: 'կայանատեղի', mapa: 'քարտեզ',
  puerta: 'դուռ', embarque: 'նստեցում', billete: 'տոմս', pasaporte: 'անձնագիր', maleta: 'ճամպրուկ', vuelo: 'թռիչք', viaje: 'ճամփորդություն',
  turista: 'զբոսաշրջիկ', amigo: 'ընկեր', amiga: 'ընկերուհի', profesor: 'ուսուցիչ', profesora: 'ուսուցչուհի', médico: 'բժիշկ', camarero: 'մատուցող',
  cajero: 'գանձապահ', cajera: 'գանձապահ', periodista: 'լրագրող', taxista: 'տաքսու վարորդ', vendedor: 'վաճառող', madre: 'մայր', padre: 'հայր',
  // food
  agua: 'ջուր', botella: 'շիշ', zumo: 'հյութ', naranja: 'նարինջ', manzana: 'խնձոր', plátano: 'բանան', pan: 'հաց', leche: 'կաթ', huevos: 'ձու',
  queso: 'պանիր', pollo: 'հավ', bocadillo: 'սենդվիչ', pizza: 'պիցցա', ensalada: 'աղցան', arroz: 'բրինձ', pasta: 'մակարոն', tomate: 'լոլիկ',
  tomates: 'լոլիկներ', paella: 'պաելյա', tortilla: 'ձվածեղ', café: 'սուրճ', chocolate: 'շոկոլադ', yogur: 'յոգուրտ', galletas: 'թխվածքաբլիթ',
  menú: 'ճաշացանկ', cuenta: 'հաշիվ', mesa: 'սեղան', comida: 'ուտելիք', bebida: 'ըմպելիք', desayuno: 'նախաճաշ', cena: 'ընթրիք',
  euros: 'եվրո', euro: 'եվրո', precio: 'գին', dinero: 'փող', tarjeta: 'քարտ', efectivo: 'կանխիկ', cesta: 'զամբյուղ', caja: 'դրամարկղ', lista: 'ցուցակ',
  // other
  día: 'օր', noche: 'գիշեր', tiempo: 'ժամանակ / եղանակ', lluvia: 'անձրև', llueve: 'անձրև է գալիս', sol: 'արև', hace: 'անում է / ...է (եղանակ)', calor: 'շոգ',
  frío: 'ցուրտ', hora: 'ժամ', semana: 'շաբաթ', año: 'տարի', años: 'տարեկան / տարիներ', vez: 'անգամ', primera: 'առաջին', primer: 'առաջին',
  nueva: 'նոր', nuevo: 'նոր', gran: 'մեծ', grande: 'մեծ', pequeño: 'փոքր', importante: 'կարևոր', rápido: 'արագ', despacio: 'դանդաղ', cuidado: 'զգուշություն',
  aventura: 'արկած', capítulo: 'գլուխ', misión: 'առաքելություն', misiones: 'առաքելություններ', vida: 'կյանք', mundo: 'աշխարհ', abierto: 'բաց',
  hambre: 'քաղց', sed: 'ծարավ', feliz: 'երջանիկ', contento: 'գոհ', nervioso: 'նյարդային', fácil: 'հեշտ', difícil: 'դժվար', correcto: 'ճիշտ', incorrecto: 'սխալ',
  respuesta: 'պատասխան', pregunta: 'հարց', palabra: 'բառ', palabras: 'բառեր', nivel: 'մակարդակ', puntos: 'միավորներ', premio: 'մրցանակ',
  dos: 'երկու', tres: 'երեք', cuatro: 'չորս', cinco: 'հինգ', seis: 'վեց', siete: 'յոթ', ocho: 'ութ', nueve: 'ինը', diez: 'տասը', uno: 'մեկ',
  rojo: 'կարմիր', verde: 'կանաչ', azul: 'կապույտ', negro: 'սև', blanco: 'սպիտակ', naranja_c: 'նարնջագույն', amarillo: 'դեղին',
};

const norm = (w: string) =>
  w
    .toLowerCase()
    .replace(/[¿?¡!.,;:«»"()…—–-]/g, '')
    .trim();

export function glossWord(word: string): string | undefined {
  const n = norm(word);
  if (!n) return undefined;
  return LEXICON[n] ?? LEXICON[n.normalize('NFD').replace(/[̀-ͯ]/g, '')];
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}
