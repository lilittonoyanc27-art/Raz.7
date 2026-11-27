import type { Tr } from '../../i18n/T';

export interface MinigameDef {
  id: string;
  name: Tr;
  desc: Tr;
  color: string;
  /** '3d' games run inside the world (stadium / city), others open a full-screen panel */
  kind: 'panel' | '3d';
}

const m = (id: string, es: string, hy: string, des: string, dhy: string, color: string, kind: MinigameDef['kind'] = 'panel'): MinigameDef => ({
  id,
  name: { es, hy },
  desc: { es: des, hy: dhy },
  color,
  kind,
});

export const MINIGAMES: MinigameDef[] = [
  m('laser', 'Laser Arena', 'Լազերային արենա', 'Dispara a los robots que indica la orden en español.', 'Կրակիր այն ռոբոտներին, որոնց նշում է իսպաներեն հրամանը։', '#ff3b6b'),
  m('paintball', 'Paintball Challenge', 'Փեյնթբոլ', 'Acierta a las dianas del color que te piden.', 'Խոցիր պահանջված գույնի թիրախները։', '#2fb5ff'),
  m('wordshooter', 'Word Shooter', 'Բառերի հրաձիգ', 'Dispara a la palabra que significa lo correcto.', 'Կրակիր այն բառին, որը ճիշտ իմաստն ունի։', '#ff6a00'),
  m('memory', 'Memory Challenge', 'Հիշողության մարտահրավեր', 'Encuentra las parejas: palabra española y su significado.', 'Գտիր զույգերը՝ իսպաներեն բառ և դրա իմաստը։', '#8e44ad'),
  m('pasapalabra', 'Pasapalabra', 'Պասապալաբրա', 'Adivina una palabra por cada letra del abecedario.', 'Գուշակիր մեկ բառ այբուբենի յուրաքանչյուր տառի համար։', '#1f5fbf'),
  m('millonario', 'El Millonario', 'Միլիոնատերը', 'Preguntas cada vez más difíciles. ¿Llegarás al final?', 'Ավելի ու ավելի դժվար հարցեր։ Կհասնե՞ս վերջին։', '#d4a017'),
  m('grammar', 'Grammar Battle', 'Քերականական մարտ', 'Derrota a los robots respondiendo bien a la gramática.', 'Հաղթիր ռոբոտներին՝ ճիշտ պատասխանելով քերականությանը։', '#16a085'),
  m('reaction', 'Reaction Challenge', 'Արձագանքի մարտահրավեր', 'Ejecuta las órdenes en español lo más rápido posible.', 'Կատարիր իսպաներեն հրամանները որքան հնարավոր է արագ։', '#e74c3c'),
  m('cooking', 'Cooking Simulator', 'Խոհարարական սիմուլյատոր', 'Cocina siguiendo la receta en español.', 'Պատրաստիր ուտեստ՝ հետևելով իսպաներեն բաղադրատոմսին։', '#e67e22'),
  m('escape', 'Escape Room', 'Փախուստի սենյակ', 'Sal de la habitación con las pistas en español.', 'Դուրս արի սենյակից՝ իսպաներեն հուշումներով։', '#34495e'),
  m('detective', 'Detective RAZ', 'Դետեկտիվ ՌԱԶ', 'Investiga un misterio leyendo las declaraciones.', 'Բացահայտիր առեղծվածը՝ կարդալով ցուցմունքները։', '#5d4037'),
  m('supermarket', 'Supermarket Challenge', 'Սուպերմարկետի մարտահրավեր', 'Compra todo lo de la lista antes de que acabe el tiempo.', 'Գնիր ցուցակի ամեն ինչ, մինչև ժամանակը կավարտվի։', '#27ae60'),
  m('airport', 'Airport Challenge', 'Օդանավակայանի մարտահրավեր', 'Encuentra tu puerta de embarque a tiempo.', 'Գտիր նստեցման դարպասդ ժամանակին։', '#2980b9'),
  m('maze', 'Maze Adventure', 'Լաբիրինթոսի արկած', 'Sal del laberinto siguiendo las direcciones.', 'Դուրս արի լաբիրինթոսից՝ հետևելով ուղղություններին։', '#7f8c8d'),
  m('manager', 'Football Manager', 'Ֆուտբոլային մենեջեր', 'Elige la táctica y dirige a tu equipo.', 'Ընտրիր մարտավարությունը և ղեկավարիր թիմդ։', '#2c3e50'),
  m('freestyle', 'Football Freestyle', 'Ֆուտբոլային ֆրիսթայլ', 'Haz trucos con el balón siguiendo el ritmo.', 'Հնարքներ արա գնդակով՝ հետևելով ռիթմին։', '#ff8c42'),
  m('penalty', 'Penalty Challenge', 'Պենալտիների մարտահրավեր', 'Serie de penaltis contra el portero en el estadio.', 'Պենալտիների շարք դարպասապահի դեմ մարզադաշտում։', '#c0392b', '3d'),
  m('goalkeeper', 'Goalkeeper Challenge', 'Դարպասապահի մարտահրավեր', 'Para los tiros en el estadio.', 'Կասեցրու հարվածները մարզադաշտում։', '#27ae60', '3d'),
  m('carrace', 'Car Racing', 'Ավտոմրցարշավ', 'Carrera de coches por la ciudad contra el reloj.', 'Մեքենաների մրցարշավ քաղաքով՝ ժամանակի դեմ։', '#ff6a00', '3d'),
  m('bikerace', 'Bike Racing', 'Հեծանվային մրցարշավ', 'Carrera de bicicletas por los puntos de control.', 'Հեծանվային մրցարշավ ստուգակետերով։', '#16a085', '3d'),
  m('delivery', 'City Delivery', 'Առաքում քաղաքում', 'Entrega los pedidos en los lugares correctos.', 'Առաքիր պատվերները ճիշտ վայրեր։', '#8e44ad', '3d'),
  m('treasure', 'Treasure Hunt', 'Գանձի որոնում', 'Sigue las pistas en español y encuentra el tesoro.', 'Հետևիր իսպաներեն հուշումներին և գտիր գանձը։', '#d4a017', '3d'),
];
