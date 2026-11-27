// Grammar question bank (A1–B1). Each item: sentence with a gap, options,
// the full correct sentence with Armenian translation and a rule explanation.
import type { Tr } from '../../i18n/T';

export interface GQ {
  topic: string;
  q: string;
  options: string[];
  a: number;
  full: Tr;
  explain: Tr;
  level: 1 | 2 | 3;
}

export const TOPICS: Record<string, Tr> = {
  presente: { es: 'Presente de indicativo', hy: 'Ներկա ժամանակ' },
  perfecto: { es: 'Pretérito perfecto', hy: 'Անցյալ կատարյալ (he hecho)' },
  indefinido: { es: 'Pretérito indefinido', hy: 'Անցյալ անորոշ (hice)' },
  imperfecto: { es: 'Pretérito imperfecto', hy: 'Անցյալ անկատար (hacía)' },
  pluscuam: { es: 'Pretérito pluscuamperfecto', hy: 'Վաղակատար անցյալ (había hecho)' },
  futuro: { es: 'Futuro simple', hy: 'Ապառնի ժամանակ' },
  futuroperf: { es: 'Futuro perfecto', hy: 'Ապառնի կատարյալ (habré hecho)' },
  marcadores: { es: 'Marcadores temporales', hy: 'Ժամանակային ցուցիչներ' },
  serestar: { es: 'Ser / Estar', hy: 'Ser / Estar' },
  tenerhaber: { es: 'Tener / Haber', hy: 'Tener / Haber' },
  muymucho: { es: 'Muy / Mucho', hy: 'Muy / Mucho' },
  bienbueno: { es: 'Bien / Bueno', hy: 'Bien / Bueno' },
  irvenir: { es: 'Ir / Venir', hy: 'Ir / Venir' },
  llevartraer: { es: 'Llevar / Traer', hy: 'Llevar / Traer' },
  llegarvolver: { es: 'Llegar / Volver', hy: 'Llegar / Volver' },
  alguno: { es: 'Alguno / Ninguno', hy: 'Alguno / Ninguno' },
  comparativos: { es: 'Comparativos y superlativos', hy: 'Համեմատական և գերադրական աստիճաններ' },
  reflexivos: { es: 'Verbos reflexivos', hy: 'Անդրադարձ բայեր' },
  estargerundio: { es: 'Estar + gerundio', hy: 'Estar + դերբայ (հիմա կատարվող)' },
  seguirgerundio: { es: 'Seguir + gerundio', hy: 'Seguir + դերբայ (շարունակել)' },
  llevargerundio: { es: 'Llevar + gerundio', hy: 'Llevar + դերբայ (արդեն որքան ժամանակ)' },
  tenerque: { es: 'Tener que + infinitivo', hy: 'Tener que + անորոշ դերբայ (պետք է)' },
  imperativo: { es: 'Imperativo', hy: 'Հրամայական եղանակ' },
  porpara: { es: 'Por / Para', hy: 'Por / Para' },
  deporte: { es: 'Vocabulario deportivo', hy: 'Սպորտային բառապաշար' },
  numeros: { es: 'Los números (100–100 000)', hy: 'Թվեր (100–100 000)' },
};

const g = (topic: string, level: 1 | 2 | 3, q: string, options: string[], a: number, fes: string, fhy: string, ees: string, ehy: string): GQ => ({
  topic,
  level,
  q,
  options,
  a,
  full: { es: fes, hy: fhy },
  explain: { es: ees, hy: ehy },
});

export const GRAMMAR: GQ[] = [
  // presente
  g('presente', 1, 'Yo ___ al fútbol todos los días.', ['juego', 'juegas', 'jugamos'], 0, 'Yo juego al fútbol todos los días.', 'Ես ամեն օր ֆուտբոլ եմ խաղում։', 'Con «yo» el verbo jugar es «juego».', '«yo»-ի հետ jugar բայը դառնում է «juego»։'),
  g('presente', 1, 'Nosotros ___ en Valencia.', ['vivo', 'vivimos', 'viven'], 1, 'Nosotros vivimos en Valencia.', 'Մենք ապրում ենք Վալենսիայում։', '«Nosotros» → terminación -imos.', '«Nosotros»-ի հետ վերջավորությունը -imos է։'),
  g('presente', 1, '¿Tú ___ agua o zumo?', ['bebes', 'bebe', 'bebo'], 0, '¿Tú bebes agua o zumo?', 'Դու ջո՞ւր ես խմում, թե՞ հյութ։', '«Tú» → terminación -es en los verbos en -er.', '-er բայերում «tú»-ի վերջավորությունը -es է։'),
  // perfecto
  g('perfecto', 2, 'Hoy ___ dos goles.', ['he marcado', 'marqué', 'marcaba'], 0, 'Hoy he marcado dos goles.', 'Այսօր ես երկու գոլ եմ խփել։', 'Con «hoy» usamos el pretérito perfecto: haber + participio.', '«hoy»-ի հետ օգտագործում ենք pretérito perfecto՝ haber + դերբայ։'),
  g('perfecto', 2, 'Esta semana ___ mucho.', ['hemos entrenado', 'entrenamos ayer', 'entrenaremos'], 0, 'Esta semana hemos entrenado mucho.', 'Այս շաբաթ մենք շատ ենք մարզվել։', '«Esta semana» es un periodo no terminado → pretérito perfecto.', '«Esta semana»-ն չավարտված ժամանակահատված է → pretérito perfecto։'),
  g('perfecto', 2, '¿___ alguna vez en Madrid?', ['Has estado', 'Estuviste ayer', 'Estarás'], 0, '¿Has estado alguna vez en Madrid?', 'Երբևէ եղե՞լ ես Մադրիդում։', '«Alguna vez» (experiencia) → pretérito perfecto.', '«Alguna vez» (փորձառություն) → pretérito perfecto։'),
  // indefinido
  g('indefinido', 2, 'Ayer ___ al estadio con mi padre.', ['fui', 'voy', 'iba'], 0, 'Ayer fui al estadio con mi padre.', 'Երեկ հայրիկիս հետ գնացի մարզադաշտ։', '«Ayer» → acción terminada: pretérito indefinido (fui).', '«Ayer» → ավարտված գործողություն՝ pretérito indefinido (fui)։'),
  g('indefinido', 2, 'El sábado pasado nuestro equipo ___ 3 a 1.', ['ganó', 'gana', 'ganaba'], 0, 'El sábado pasado nuestro equipo ganó 3 a 1.', 'Անցյալ շաբաթ մեր թիմը հաղթեց 3–1։', '«El sábado pasado» → pretérito indefinido.', '«El sábado pasado» → pretérito indefinido։'),
  g('indefinido', 2, 'En 2020 RAZ ___ a jugar al fútbol.', ['empezó', 'empieza', 'ha empezado'], 0, 'En 2020 RAZ empezó a jugar al fútbol.', '2020-ին ՌԱԶ-ը սկսեց ֆուտբոլ խաղալ։', 'Fecha concreta del pasado → indefinido.', 'Անցյալի կոնկրետ տարեթիվ → indefinido։'),
  // imperfecto
  g('imperfecto', 2, 'Cuando era pequeño, ___ en el parque cada tarde.', ['jugaba', 'jugué', 'juego'], 0, 'Cuando era pequeño, jugaba en el parque cada tarde.', 'Երբ փոքր էի, ամեն երեկո այգում էի խաղում։', 'Costumbres del pasado → pretérito imperfecto.', 'Անցյալի սովորություններ → pretérito imperfecto։'),
  g('imperfecto', 2, 'Mientras ___, empezó a llover.', ['entrenábamos', 'entrenamos', 'entrenaremos'], 0, 'Mientras entrenábamos, empezó a llover.', 'Մինչ մարզվում էինք, սկսեց անձրև գալ։', 'Acción en desarrollo en el pasado → imperfecto.', 'Անցյալում ընթացող գործողություն → imperfecto։'),
  g('imperfecto', 2, 'El estadio ___ muy grande y bonito.', ['era', 'fue', 'es mañana'], 0, 'El estadio era muy grande y bonito.', 'Մարզադաշտը շատ մեծ ու գեղեցիկ էր։', 'Descripciones en el pasado → imperfecto.', 'Անցյալի նկարագրություններ → imperfecto։'),
  // pluscuamperfecto
  g('pluscuam', 3, 'Cuando llegué, el partido ya ___.', ['había empezado', 'empieza', 'empezará'], 0, 'Cuando llegué, el partido ya había empezado.', 'Երբ հասա, խաղն արդեն սկսվել էր։', 'Acción anterior a otra pasada → había + participio.', 'Անցյալի մեկ այլ գործողությունից առաջ → había + դերբայ։'),
  g('pluscuam', 3, 'Nunca ___ un estadio tan grande antes.', ['había visto', 'veo', 'veré'], 0, 'Nunca había visto un estadio tan grande antes.', 'Նախկինում երբեք այդքան մեծ մարզադաշտ չէի տեսել։', 'Experiencia anterior a un momento pasado → pluscuamperfecto.', 'Անցյալի պահից առաջ փորձառություն → pluscuamperfecto։'),
  // futuro
  g('futuro', 2, 'Mañana ___ a Madrid en tren.', ['viajaré', 'viajé', 'viajaba'], 0, 'Mañana viajaré a Madrid en tren.', 'Վաղը գնացքով կմեկնեմ Մադրիդ։', '«Mañana» → futuro simple: infinitivo + -é.', '«Mañana» → ապառնի՝ անորոշ ձև + -é։'),
  g('futuro', 2, 'El próximo año ___ en la academia.', ['estaré', 'estuve', 'estaba'], 0, 'El próximo año estaré en la academia.', 'Հաջորդ տարի ես ակադեմիայում կլինեմ։', '«El próximo año» → futuro.', '«El próximo año» → ապառնի ժամանակ։'),
  g('futuro', 2, '¿Qué ___ mañana después del partido?', ['harás', 'hiciste', 'haces ayer'], 0, '¿Qué harás mañana después del partido?', 'Ի՞նչ կանես վաղը խաղից հետո։', 'Hacer es irregular en futuro: haré, harás, hará.', 'Hacer-ը ապառնիում անկանոն է՝ haré, harás, hará։'),
  // futuro perfecto
  g('futuroperf', 3, 'A las ocho ya ___ el entrenamiento.', ['habré terminado', 'terminé', 'terminaba'], 0, 'A las ocho ya habré terminado el entrenamiento.', 'Ժամը ութին ես արդեն ավարտած կլինեմ մարզումը։', 'Acción terminada antes de un momento futuro → habré + participio.', 'Ապագայի պահից առաջ ավարտված գործողություն → habré + դերբայ։'),
  g('futuroperf', 3, 'Para junio ___ veinte goles.', ['habrá marcado', 'marcó', 'marcaba'], 0, 'Para junio habrá marcado veinte goles.', 'Մինչև հունիս նա քսան գոլ խփած կլինի։', '«Para junio» + acción completada → futuro perfecto.', '«Para junio» + ավարտված գործողություն → futuro perfecto։'),
  // marcadores
  g('marcadores', 2, '___ fui al cine con mis amigos.', ['Ayer', 'Mañana', 'Ahora mismo'], 0, 'Ayer fui al cine con mis amigos.', 'Երեկ ընկերներիս հետ կինո գնացի։', '«Fui» es pasado → marcador de pasado: ayer.', '«Fui»-ն անցյալ է → անցյալի ցուցիչ՝ ayer։'),
  g('marcadores', 2, '___ he desayunado cereales.', ['Esta mañana', 'El año pasado', 'Mañana'], 0, 'Esta mañana he desayunado cereales.', 'Այս առավոտ նախաճաշին հացահատիկ եմ կերել։', '«Esta mañana» va con pretérito perfecto.', '«Esta mañana»-ն գործածվում է pretérito perfecto-ի հետ։'),
  g('marcadores', 2, 'Jugaremos la final ___.', ['la semana que viene', 'anteayer', 'el mes pasado'], 0, 'Jugaremos la final la semana que viene.', 'Եզրափակիչը կխաղանք հաջորդ շաբաթ։', 'Futuro → marcador de futuro.', 'Ապառնի → ապագայի ցուցիչ։'),
  // ser / estar
  g('serestar', 1, 'RAZ ___ futbolista.', ['es', 'está', 'hay'], 0, 'RAZ es futbolista.', 'ՌԱԶ-ը ֆուտբոլիստ է։', 'Profesión → ser.', 'Մասնագիտություն → ser։'),
  g('serestar', 1, 'Hoy ___ muy cansado.', ['estoy', 'soy', 'tengo'], 0, 'Hoy estoy muy cansado.', 'Այսօր շատ հոգնած եմ։', 'Estado temporal → estar.', 'Ժամանակավոր վիճակ → estar։'),
  g('serestar', 1, 'El estadio ___ cerca del parque.', ['está', 'es', 'hay'], 0, 'El estadio está cerca del parque.', 'Մարզադաշտը այգու մոտ է։', 'Ubicación → estar.', 'Գտնվելու վայր → estar։'),
  g('serestar', 2, 'La final ___ en el estadio nuevo.', ['es', 'está', 'tiene'], 0, 'La final es en el estadio nuevo.', 'Եզրափակիչը նոր մարզադաշտում է (տեղի ունենում)։', 'Eventos (dónde tienen lugar) → ser.', 'Իրադարձություններ (որտեղ են տեղի ունենում) → ser։'),
  // tener / haber
  g('tenerhaber', 1, '___ un supermercado al lado de mi casa.', ['Hay', 'Tengo', 'Está'], 0, 'Hay un supermercado al lado de mi casa.', 'Իմ տան կողքին սուպերմարկետ կա։', 'Existencia → hay (haber).', 'Գոյություն → hay (haber)։'),
  g('tenerhaber', 1, 'Yo ___ trece años.', ['tengo', 'soy', 'hay'], 0, 'Yo tengo trece años.', 'Ես տասներեք տարեկան եմ։', 'La edad en español → tener.', 'Տարիքը իսպաներենում → tener։'),
  g('tenerhaber', 2, 'En el equipo ___ once jugadores.', ['hay', 'tienen', 'están'], 0, 'En el equipo hay once jugadores.', 'Թիմում տասնմեկ խաղացող կա։', 'Cantidad de cosas que existen → hay.', 'Գոյություն ունեցող բաների քանակ → hay։'),
  // muy / mucho
  g('muymucho', 1, 'El partido fue ___ difícil.', ['muy', 'mucho', 'mucha'], 0, 'El partido fue muy difícil.', 'Խաղը շատ դժվար էր։', 'Muy + adjetivo.', 'Muy + ածական։'),
  g('muymucho', 1, 'Hoy hay ___ gente en el estadio.', ['mucha', 'muy', 'mucho'], 0, 'Hoy hay mucha gente en el estadio.', 'Այսօր մարզադաշտում շատ մարդ կա։', 'Mucho/mucha + sustantivo (concuerda: la gente → mucha).', 'Mucho/mucha + գոյական (համաձայնեցվում է՝ la gente → mucha)։'),
  g('muymucho', 1, 'Entreno ___.', ['mucho', 'muy', 'mucha'], 0, 'Entreno mucho.', 'Ես շատ եմ մարզվում։', 'Verbo + mucho.', 'Բայ + mucho։'),
  // bien / bueno
  g('bienbueno', 1, 'Juegas muy ___.', ['bien', 'bueno', 'buena'], 0, 'Juegas muy bien.', 'Դու շատ լավ ես խաղում։', 'Bien modifica a un verbo (cómo).', 'Bien-ը բնութագրում է բայը (ինչպես)։'),
  g('bienbueno', 1, 'Es un ___ entrenador.', ['buen', 'bien', 'buena'], 0, 'Es un buen entrenador.', 'Նա լավ մարզիչ է։', 'Bueno → buen delante de un sustantivo masculino.', 'Bueno → buen արական գոյականից առաջ։'),
  g('bienbueno', 1, 'La paella está muy ___.', ['buena', 'bien', 'bueno'], 0, 'La paella está muy buena.', 'Պաելյան շատ համեղ է։', 'Adjetivo que concuerda con «la paella» → buena.', '«la paella»-ի հետ համաձայնեցված ածական → buena։'),
  // ir / venir
  g('irvenir', 2, '(Por teléfono) — ¿Vienes a mi casa? — Sí, ahora ___.', ['voy', 'vengo', 'vas'], 0, '— ¿Vienes a mi casa? — Sí, ahora voy.', '— Կգա՞ս ինձ մոտ։ — Այո, հիմա գալիս եմ։', 'Desde mi punto de vista me muevo hacia allí → ir.', 'Իմ տեսանկյունից դեպի այնտեղ եմ շարժվում → ir։'),
  g('irvenir', 2, 'El entrenador dice: «___ aquí, RAZ».', ['Ven', 'Ve', 'Vas'], 0, '«Ven aquí, RAZ».', '«Արի այստեղ, ՌԱԶ»։', 'Hacia el hablante → venir (ven).', 'Դեպի խոսողը → venir (ven)։'),
  // llevar / traer
  g('llevartraer', 2, 'Mamá, ¿me ___ la mochila al entrenamiento? (yo estoy en el entrenamiento)', ['traes', 'llevas', 'vas'], 0, 'Mamá, ¿me traes la mochila al entrenamiento?', 'Մամ, պայուսակս կբերե՞ս մարզման։', 'Hacia donde está el hablante → traer.', 'Դեպի խոսողի գտնվելու վայրը → traer։'),
  g('llevartraer', 2, 'Voy a ___ esta botella a la cocina.', ['llevar', 'traer', 'venir'], 0, 'Voy a llevar esta botella a la cocina.', 'Այս շիշը կտանեմ խոհանոց։', 'Lejos del hablante → llevar.', 'Խոսողից հեռու → llevar։'),
  // llegar / volver
  g('llegarvolver', 2, 'El tren ___ a Madrid a las diez.', ['llega', 'vuelve', 'va'], 0, 'El tren llega a Madrid a las diez.', 'Գնացքը Մադրիդ է հասնում ժամը տասին։', 'Llegar = alcanzar el destino.', 'Llegar = հասնել նպատակակետին։'),
  g('llegarvolver', 2, 'Después del torneo ___ a Valencia.', ['volveré', 'llegaré primero', 'iré'], 0, 'Después del torneo volveré a Valencia.', 'Մրցաշարից հետո կվերադառնամ Վալենսիա։', 'Volver = regresar al lugar de origen.', 'Volver = վերադառնալ սկզբնական վայր։'),
  // alguno / ninguno
  g('alguno', 2, '¿Tienes ___ balón? — No, no tengo ninguno.', ['algún', 'ningún', 'alguno'], 0, '¿Tienes algún balón? — No, no tengo ninguno.', 'Գնդակ ունե՞ս։ — Ոչ, ոչ մեկը չունեմ։', 'Alguno → algún delante de sustantivo masculino.', 'Alguno → algún արական գոյականից առաջ։'),
  g('alguno', 2, 'No hay ___ jugador en el campo.', ['ningún', 'algún', 'alguno'], 0, 'No hay ningún jugador en el campo.', 'Դաշտում ոչ մի խաղացող չկա։', 'En frases negativas → ningún (no + verbo + ningún).', 'Ժխտական նախադասություններում → ningún։'),
  // comparativos
  g('comparativos', 2, 'RAZ corre ___ rápido que su amigo.', ['más', 'mucho', 'tan'], 0, 'RAZ corre más rápido que su amigo.', 'ՌԱԶ-ը ավելի արագ է վազում, քան իր ընկերը։', 'más + adjetivo/adverbio + que.', 'más + ածական/մակբայ + que։'),
  g('comparativos', 2, 'Este es el estadio ___ grande de España.', ['más', 'muy', 'tan'], 0, 'Este es el estadio más grande de España.', 'Սա Իսպանիայի ամենամեծ մարզադաշտն է։', 'Superlativo: el/la + más + adjetivo + de.', 'Գերադրական՝ el/la + más + ածական + de։'),
  g('comparativos', 2, 'Mi bici es ___ que la tuya.', ['mejor', 'más buena', 'bueno'], 0, 'Mi bici es mejor que la tuya.', 'Իմ հեծանիվն ավելի լավն է, քան քոնը։', 'Bueno → mejor (comparativo irregular).', 'Bueno → mejor (անկանոն համեմատական)։'),
  // reflexivos
  g('reflexivos', 2, 'Todos los días ___ a las siete.', ['me levanto', 'levanto', 'se levanto'], 0, 'Todos los días me levanto a las siete.', 'Ամեն օր արթնանում եմ ժամը յոթին։', 'Levantarse es reflexivo: me levanto, te levantas, se levanta.', 'Levantarse-ն անդրադարձ է՝ me levanto, te levantas, se levanta։'),
  g('reflexivos', 2, 'Después del partido, los jugadores ___.', ['se duchan', 'duchan', 'me ducho'], 0, 'Después del partido, los jugadores se duchan.', 'Խաղից հետո խաղացողները լոգանք են ընդունում։', 'Ellos → se + verbo.', 'Ellos → se + բայ։'),
  g('reflexivos', 1, '¿Cómo ___? — Me llamo RAZ.', ['te llamas', 'llamas', 'se llamo'], 0, '¿Cómo te llamas? — Me llamo RAZ.', 'Ինչպե՞ս է անունդ։ — Անունս ՌԱԶ է։', 'Llamarse: me llamo, te llamas.', 'Llamarse՝ me llamo, te llamas։'),
  // estar + gerundio
  g('estargerundio', 2, 'Ahora mismo ___ con el balón.', ['estoy entrenando', 'entrené', 'entrenaba'], 0, 'Ahora mismo estoy entrenando con el balón.', 'Հենց հիմա գնդակով մարզվում եմ։', 'Acción en este momento → estar + gerundio (-ando/-iendo).', 'Այս պահին կատարվող գործողություն → estar + դերբայ (-ando/-iendo)։'),
  g('estargerundio', 2, 'Los aficionados ___ el himno.', ['están cantando', 'cantaron mañana', 'cantan ayer'], 0, 'Los aficionados están cantando el himno.', 'Երկրպագուները օրհներգ են երգում։', 'Estar + gerundio.', 'Estar + դերբայ։'),
  // seguir + gerundio
  g('seguirgerundio', 3, 'A pesar de la lluvia, ___ jugando.', ['seguimos', 'llevamos', 'estamos a'], 0, 'A pesar de la lluvia, seguimos jugando.', 'Չնայած անձրևին, շարունակում ենք խաղալ։', 'Seguir + gerundio = continuar una acción.', 'Seguir + դերբայ = շարունակել գործողությունը։'),
  g('seguirgerundio', 3, 'RAZ sigue ___ todos los días.', ['entrenando', 'entrenar', 'entrenado'], 0, 'RAZ sigue entrenando todos los días.', 'ՌԱԶ-ը շարունակում է ամեն օր մարզվել։', 'Después de seguir va el gerundio.', 'Seguir-ից հետո գալիս է դերբայը (gerundio)։'),
  // llevar + gerundio
  g('llevargerundio', 3, '___ tres años jugando al fútbol.', ['Llevo', 'Sigo', 'Estoy'], 0, 'Llevo tres años jugando al fútbol.', 'Արդեն երեք տարի է՝ ֆուտբոլ եմ խաղում։', 'Llevar + tiempo + gerundio = duración hasta ahora.', 'Llevar + ժամանակ + դերբայ = տևողություն մինչև հիմա։'),
  g('llevargerundio', 3, '¿Cuánto tiempo llevas ___ español?', ['estudiando', 'estudiar', 'estudias'], 0, '¿Cuánto tiempo llevas estudiando español?', 'Որքա՞ն ժամանակ է՝ իսպաներեն ես սովորում։', 'Llevar + gerundio.', 'Llevar + դերբայ։'),
  // tener que
  g('tenerque', 1, 'Para ganar, ___ entrenar más.', ['tienes que', 'tienes', 'hay'], 0, 'Para ganar, tienes que entrenar más.', 'Հաղթելու համար պետք է ավելի շատ մարզվես։', 'Obligación → tener que + infinitivo.', 'Պարտականություն → tener que + անորոշ ձև։'),
  g('tenerque', 1, 'Mañana ___ levantarme temprano.', ['tengo que', 'tengo de', 'hay que yo'], 0, 'Mañana tengo que levantarme temprano.', 'Վաղը պետք է շուտ արթնանամ։', 'Tener que + infinitivo.', 'Tener que + անորոշ ձև։'),
  // imperativo
  g('imperativo', 1, '¡RAZ, ___ el balón!', ['pasa', 'pasas', 'pasar'], 0, '¡RAZ, pasa el balón!', 'ՌԱԶ, փոխանցի՛ր գնդակը։', 'Imperativo de tú: pasar → pasa.', 'Հրամայական՝ tú. pasar → pasa։'),
  g('imperativo', 1, '___ a la derecha en el semáforo.', ['Gira', 'Giras', 'Girar'], 0, 'Gira a la derecha en el semáforo.', 'Լուսացույցի մոտ թեքվիր աջ։', 'Imperativo: girar → gira.', 'Հրամայական՝ girar → gira։'),
  g('imperativo', 2, '¡No ___ la concentración!', ['pierdas', 'pierdes', 'pierde'], 0, '¡No pierdas la concentración!', 'Մի՛ կորցրու կենտրոնացումը։', 'Imperativo negativo → no + subjuntivo (pierdas).', 'Ժխտական հրամայական → no + ստորադասական (pierdas)։'),
  // por / para
  g('porpara', 2, 'Este regalo es ___ ti.', ['para', 'por', 'de por'], 0, 'Este regalo es para ti.', 'Այս նվերը քեզ համար է։', 'Destinatario → para.', 'Հասցեատեր → para։'),
  g('porpara', 2, 'Paseamos ___ el parque.', ['por', 'para', 'a'], 0, 'Paseamos por el parque.', 'Մենք զբոսնում ենք այգով։', 'Movimiento a través de un lugar → por.', 'Վայրի միջով շարժում → por։'),
  g('porpara', 2, 'Entreno ___ ser profesional.', ['para', 'por', 'de'], 0, 'Entreno para ser profesional.', 'Մարզվում եմ, որպեսզի պրոֆեսիոնալ դառնամ։', 'Finalidad → para + infinitivo.', 'Նպատակ → para + անորոշ ձև։'),
  g('porpara', 2, 'Gracias ___ tu ayuda.', ['por', 'para', 'con'], 0, 'Gracias por tu ayuda.', 'Շնորհակալություն օգնությանդ համար։', 'Causa / agradecimiento → por.', 'Պատճառ / շնորհակալություն → por։'),
  // vocabulario deportivo
  g('deporte', 1, 'El jugador que para los tiros es el ___.', ['portero', 'árbitro', 'entrenador'], 0, 'El jugador que para los tiros es el portero.', 'Հարվածները կասեցնող խաղացողը դարպասապահն է։', 'Portero = el que defiende la portería.', 'Portero = դարպասը պաշտպանողը։'),
  g('deporte', 1, 'La persona que dirige el partido es el ___.', ['árbitro', 'portero', 'aficionado'], 0, 'La persona que dirige el partido es el árbitro.', 'Խաղը վարող մարդը մրցավարն է։', 'Árbitro = juez del partido.', 'Árbitro = խաղի մրցավար։'),
  g('deporte', 1, 'Cuando el balón entra en la portería es un ___.', ['gol', 'pase', 'córner'], 0, 'Cuando el balón entra en la portería es un gol.', 'Երբ գնդակը մտնում է դարպաս, դա գոլ է։', 'Gol = el balón entra en la portería.', 'Gol = գնդակը մտնում է դարպաս։'),
  g('deporte', 1, 'Los zapatos para jugar al fútbol son las ___.', ['botas', 'gafas', 'camisetas'], 0, 'Los zapatos para jugar al fútbol son las botas.', 'Ֆուտբոլ խաղալու կոշիկները բութսերն են։', 'Botas de fútbol.', 'Botas de fútbol = ֆուտբոլային բութսեր։'),
];

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function questionsFor(topic: string | null, n: number, maxLevel = 3): GQ[] {
  const pool = GRAMMAR.filter((q) => (!topic || q.topic === topic) && q.level <= maxLevel);
  return shuffle(pool).slice(0, n);
}
