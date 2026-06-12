import bcrypt from 'bcryptjs';
import { db } from './index.js';

const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (count > 0) {
  console.log('La base ya tiene datos, no se vuelve a sembrar.');
  process.exit(0);
}

const hash = bcrypt.hashSync('swapwear123', 10);
const img = (seed) => `https://picsum.photos/seed/${seed}/600/800`;
const av = (seed) => `https://i.pravatar.cc/150?u=${seed}`;

const insertUser = db.prepare(`
  INSERT INTO users (nombre, email, password_hash, avatar, bio, rol, intereses, onboarded)
  VALUES (@nombre, @email, @hash, @avatar, @bio, @rol, @intereses, 1)
`);

const users = [
  { nombre: 'Sofi Pereyra', email: 'sofi@demo.com', bio: 'Vintage lover. Vendo lo que ya no uso, todo impecable ✨', rol: 'ambas', intereses: '["Camperas","Remeras"]' },
  { nombre: 'Tomi Aguirre', email: 'tomi@demo.com', bio: 'Coleccionista de camisetas retro de fútbol. Cambio por buzos.', rol: 'ambas', intereses: '["Remeras","Buzos"]' },
  { nombre: 'Cami Roldán', email: 'cami@demo.com', bio: 'Feria americana ambulante 🌿 consumo circular siempre', rol: 'vendo', intereses: '["Vestidos","Accesorios"]' },
  { nombre: 'Fran Sosa', email: 'fran@demo.com', bio: 'Workwear y denim de los 90. Palermo.', rol: 'ambas', intereses: '["Pantalones","Camperas"]' },
  { nombre: 'Luz Medina', email: 'luz@demo.com', bio: 'Renuevo placard cada temporada. Intercambio > compra.', rol: 'busco', intereses: '["Vestidos","Buzos"]' },
  { nombre: 'Nico Funes', email: 'nico@demo.com', bio: 'Sneakers y streetwear. Todo original, con detalle de uso.', rol: 'vendo', intereses: '["Calzado","Buzos"]' },
];
const userIds = users.map((u) => insertUser.run({ ...u, hash, avatar: av(u.email) }).lastInsertRowid);

const insertItem = db.prepare(`
  INSERT INTO items (user_id, titulo, descripcion, tipo, precio, talle, marca, categoria, tags, imagenes)
  VALUES (@user_id, @titulo, @descripcion, @tipo, @precio, @talle, @marca, @categoria, @tags, @imagenes)
`);

const items = [
  [0, 'Campera de jean oversize 90s', 'Levi’s original, lavado clarito, cero detalles. Queda enorme y hermosa.', 'venta', 45000, 'L', "Levi's", 'Camperas', ['vintage','denim','90s']],
  [0, 'Remera Nirvana bootleg', 'Bootleg de los 2000, algodón finito, fit relajado.', 'intercambio', null, 'M', 'Sin marca', 'Remeras', ['band tee','grunge']],
  [1, 'Camiseta Boca 1998 réplica', 'Réplica de época, estampa entera. Joya para coleccionar.', 'venta', 60000, 'L', 'Olan', 'Remeras', ['retro','fútbol','boca']],
  [1, 'Buzo Champion bordado', 'Buzo gris clásico con logo bordado, abrigadísimo.', 'intercambio', null, 'XL', 'Champion', 'Buzos', ['streetwear','oversize']],
  [2, 'Vestido floreado midi', 'Vestido de feria americana, tela liviana ideal verano.', 'venta', 28000, 'S', 'Zara', 'Vestidos', ['floreado','verano']],
  [2, 'Pañuelo de seda estampado', 'Estampa geométrica setentosa, impecable.', 'venta', 12000, 'Único', 'Sin marca', 'Accesorios', ['seda','70s']],
  [2, 'Camisa cuadrillé flanelada', 'Flanela gruesa estilo grunge, unisex.', 'intercambio', null, 'M', 'Wrangler', 'Camisas', ['grunge','flanela']],
  [3, 'Jean carpintero ancho', 'Carpenter pant noventoso, tiro alto, caída recta.', 'venta', 38000, '32', 'Dickies', 'Pantalones', ['workwear','baggy']],
  [3, 'Campera rompeviento color block', 'Rompeviento 90s violeta y verde, plegable.', 'intercambio', null, 'L', 'Adidas', 'Camperas', ['90s','colorblock']],
  [4, 'Buzo hoodie tie dye', 'Teñido artesanal, usado dos veces.', 'venta', 25000, 'M', 'H&M', 'Buzos', ['tiedye','hoodie']],
  [4, 'Vestido negro slip dress', 'Slip dress satinado, corte sesgado, muy 90s.', 'intercambio', null, 'S', 'Forever 21', 'Vestidos', ['90s','satinado']],
  [5, 'Zapatillas Air Force 1 blancas', 'Talle 42, con uso pero muy cuidadas. Van con caja.', 'venta', 90000, '42', 'Nike', 'Calzado', ['sneakers','af1']],
  [5, 'Buzo crewneck Nike vintage', 'Crewneck bordado, gris topo, fit boxy.', 'venta', 42000, 'L', 'Nike', 'Buzos', ['vintage','crewneck']],
  [5, 'Gorra trucker NY', 'Gorra trucker clásica, ajustable.', 'intercambio', null, 'Único', 'New Era', 'Accesorios', ['gorra','trucker']],
  [3, 'Camisa hawaiana 80s', 'Estampa tropical original, botones de coco.', 'venta', 22000, 'L', 'Sin marca', 'Camisas', ['hawaiana','80s']],
  [0, 'Pollera de jean tiro alto', 'Mini de jean rígido, botones al frente.', 'intercambio', null, 'S', "Levi's", 'Polleras', ['denim','mini']],
  [1, 'Pantalón cargo verde militar', 'Cargo de gabardina pesada, bolsillos gigantes.', 'venta', 33000, '34', 'Sin marca', 'Pantalones', ['cargo','militar']],
  [4, 'Cinturón de cuero trenzado', 'Cuero genuino, hebilla dorada.', 'venta', 15000, 'Único', 'Sin marca', 'Accesorios', ['cuero']],
  [2, 'Sweater de lana escote V', 'Tejido a mano, abriga muchísimo, tonos tierra.', 'intercambio', null, 'M', 'Artesanal', 'Sweaters', ['lana','tejido']],
  [5, 'Campera puffer negra', 'Puffer corta, cierre impecable, ideal invierno.', 'venta', 55000, 'M', 'Uniqlo', 'Camperas', ['puffer','invierno']],
];

const itemIds = items.map(([u, titulo, descripcion, tipo, precio, talle, marca, categoria, tags], i) =>
  insertItem.run({
    user_id: userIds[u], titulo, descripcion, tipo, precio, talle, marca, categoria,
    tags: JSON.stringify(tags),
    imagenes: JSON.stringify([img(`sw${i}a`), img(`sw${i}b`)]),
  }).lastInsertRowid
);

// Un chat de ejemplo entre Sofi (buyer) y Tomi (owner de la Boca 98)
const chatId = db.prepare('INSERT INTO chats (item_id, buyer_id, owner_id) VALUES (?,?,?)')
  .run(itemIds[2], userIds[0], userIds[1]).lastInsertRowid;
const msg = db.prepare('INSERT INTO messages (chat_id, sender_id, texto) VALUES (?,?,?)');
msg.run(chatId, userIds[0], 'Hola! Me encantó la camiseta de Boca, ¿sigue disponible?');
msg.run(chatId, userIds[1], 'Hola Sofi! Sí, está disponible. Está impecable, la tengo guardada hace años.');
msg.run(chatId, userIds[0], '¿Hacés envíos a Caballito o coordinamos punto de encuentro?');

// Transacción completada + reviews para que haya reputación visible
const tx = db.prepare(`
  INSERT INTO transactions (chat_id, item_id, seller_id, buyer_id, tipo, monto, comision, estado)
  VALUES (?,?,?,?,?,?,?,'completada')
`).run(null, itemIds[5], userIds[2], userIds[4], 'venta', 12000, 960).lastInsertRowid;
const rev = db.prepare('INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comentario) VALUES (?,?,?,?,?)');
rev.run(tx, userIds[4], userIds[2], 5, 'Todo perfecto, el pañuelo tal cual las fotos. Súper amable!');
rev.run(tx, userIds[2], userIds[4], 5, 'Compradora de diez, pago al instante.');

const tx2 = db.prepare(`
  INSERT INTO transactions (chat_id, item_id, seller_id, buyer_id, tipo, monto, comision, estado)
  VALUES (?,?,?,?,?,?,?,'completada')
`).run(null, itemIds[3], userIds[1], userIds[3], 'intercambio', 0, 0).lastInsertRowid;
rev.run(tx2, userIds[3], userIds[1], 4, 'Buen intercambio, el buzo tenía un mini detalle pero avisó antes.');

// Marcar el pañuelo y el buzo intercambiado como vendidos/no activos
db.prepare("UPDATE items SET estado='vendida' WHERE id IN (?,?)").run(itemIds[5], itemIds[3]);

console.log('Seed listo ✅ — 6 usuarios (pass: swapwear123), 20 prendas, chats y reviews de ejemplo.');
