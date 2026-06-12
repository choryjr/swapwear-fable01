import { db } from '../db/index.js';

export function getOrCreateChat(buyerId, itemId) {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  if (!item) throw { status: 404, message: 'La prenda no existe.' };
  if (item.user_id === buyerId) throw { status: 400, message: 'No podés abrir un chat con vos.' };
  const existing = db.prepare('SELECT * FROM chats WHERE item_id = ? AND buyer_id = ?').get(itemId, buyerId);
  if (existing) return existing;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO chats (item_id, buyer_id, owner_id) VALUES (?,?,?)')
    .run(itemId, buyerId, item.user_id);
  return db.prepare('SELECT * FROM chats WHERE id = ?').get(lastInsertRowid);
}

function assertMember(chatId, userId) {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  if (!chat) throw { status: 404, message: 'El chat no existe.' };
  if (chat.buyer_id !== userId && chat.owner_id !== userId) throw { status: 403, message: 'No formás parte de este chat.' };
  return chat;
}

export function listChats(userId) {
  const rows = db.prepare(`
    SELECT c.*,
      i.titulo AS item_titulo, i.tipo AS item_tipo, i.precio AS item_precio, i.imagenes AS item_imagenes, i.estado AS item_estado,
      ub.nombre AS buyer_nombre, ub.avatar AS buyer_avatar,
      uo.nombre AS owner_nombre, uo.avatar AS owner_avatar,
      (SELECT texto FROM messages m WHERE m.chat_id = c.id ORDER BY m.id DESC LIMIT 1) AS ultimo_mensaje,
      (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.id DESC LIMIT 1) AS ultimo_mensaje_at
    FROM chats c
    JOIN items i ON i.id = c.item_id
    JOIN users ub ON ub.id = c.buyer_id
    JOIN users uo ON uo.id = c.owner_id
    WHERE c.buyer_id = ? OR c.owner_id = ?
    ORDER BY COALESCE(ultimo_mensaje_at, c.created_at) DESC
  `).all(userId, userId);
  return rows.map((r) => {
    const soyBuyer = r.buyer_id === userId;
    return {
      id: r.id,
      item: { id: r.item_id, titulo: r.item_titulo, tipo: r.item_tipo, precio: r.item_precio, estado: r.item_estado, imagen: JSON.parse(r.item_imagenes)[0] },
      otro: soyBuyer
        ? { id: r.owner_id, nombre: r.owner_nombre, avatar: r.owner_avatar }
        : { id: r.buyer_id, nombre: r.buyer_nombre, avatar: r.buyer_avatar },
      soyOwner: !soyBuyer,
      ultimoMensaje: r.ultimo_mensaje,
      ultimoMensajeAt: r.ultimo_mensaje_at,
    };
  });
}

export function getChatDetail(chatId, userId) {
  const chat = assertMember(chatId, userId);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(chat.item_id);
  const otroId = chat.buyer_id === userId ? chat.owner_id : chat.buyer_id;
  const otro = db.prepare('SELECT id, nombre, avatar FROM users WHERE id = ?').get(otroId);
  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC').all(chatId);
  const transaction = db.prepare('SELECT * FROM transactions WHERE chat_id = ? ORDER BY id DESC LIMIT 1').get(chatId) || null;
  const yaReseñe = transaction
    ? !!db.prepare('SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?').get(transaction.id, userId)
    : false;
  return {
    id: chat.id,
    item: { id: item.id, titulo: item.titulo, tipo: item.tipo, precio: item.precio, estado: item.estado, imagen: JSON.parse(item.imagenes)[0] },
    otro,
    soyOwner: chat.owner_id === userId,
    messages,
    transaction,
    yaReseñe,
  };
}

export function sendMessage(chatId, userId, texto) {
  assertMember(chatId, userId);
  if (!texto?.trim()) throw { status: 400, message: 'El mensaje no puede estar vacío.' };
  const { lastInsertRowid } = db
    .prepare('INSERT INTO messages (chat_id, sender_id, texto) VALUES (?,?,?)')
    .run(chatId, userId, texto.trim());
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(lastInsertRowid);
}

// Concretar un INTERCAMBIO (las ventas se concretan vía checkout/pago)
export function completeSwap(chatId, userId) {
  const chat = assertMember(chatId, userId);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(chat.item_id);
  if (item.tipo !== 'intercambio') throw { status: 400, message: 'Esta prenda es una venta: usá el checkout para pagarla.' };
  if (item.estado !== 'activa') throw { status: 400, message: 'Esta prenda ya no está disponible.' };
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO transactions (chat_id, item_id, seller_id, buyer_id, tipo, monto, comision, estado)
    VALUES (?,?,?,?,?,0,0,'completada')
  `).run(chatId, item.id, chat.owner_id, chat.buyer_id, 'intercambio');
  db.prepare("UPDATE items SET estado='vendida' WHERE id = ?").run(item.id);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(lastInsertRowid);
}
