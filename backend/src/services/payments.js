import { db } from '../db/index.js';
import { config } from '../config.js';

// Crea el checkout de una VENTA. Si hay MP_ACCESS_TOKEN usa la API real de
// MercadoPago (Checkout Pro); si no, devuelve un flujo mock para desarrollo.
export async function createCheckout(userId, chatId) {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  if (!chat) throw { status: 404, message: 'El chat no existe.' };
  if (chat.buyer_id !== userId) throw { status: 403, message: 'Solo quien quiere comprar puede iniciar el pago.' };
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(chat.item_id);
  if (item.tipo !== 'venta') throw { status: 400, message: 'Esta prenda es para intercambio, no tiene checkout.' };
  if (item.estado !== 'activa') throw { status: 400, message: 'Esta prenda ya fue vendida.' };

  const monto = item.precio;
  const comision = Math.round(monto * config.comision);

  const { lastInsertRowid: txId } = db.prepare(`
    INSERT INTO transactions (chat_id, item_id, seller_id, buyer_id, tipo, monto, comision, estado)
    VALUES (?,?,?,?,?,?,?,'pendiente')
  `).run(chatId, item.id, chat.owner_id, chat.buyer_id, 'venta', monto, comision);

  if (!config.mercadopago.accessToken) {
    return { mock: true, transactionId: txId, monto, comision, total: monto };
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mercadopago.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ title: item.titulo, quantity: 1, unit_price: monto, currency_id: 'ARS' }],
      marketplace_fee: comision,
      external_reference: String(txId),
      back_urls: {
        success: `${config.mercadopago.backUrl}?tx=${txId}&status=success`,
        failure: `${config.mercadopago.backUrl}?tx=${txId}&status=failure`,
        pending: `${config.mercadopago.backUrl}?tx=${txId}&status=pending`,
      },
      auto_return: 'approved',
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw { status: 502, message: `MercadoPago rechazó la preferencia: ${detail.slice(0, 200)}` };
  }
  const pref = await res.json();
  db.prepare('UPDATE transactions SET mp_preference_id = ? WHERE id = ?').run(pref.id, txId);
  return { mock: false, transactionId: txId, monto, comision, total: monto, initPoint: pref.init_point };
}

// Confirma el pago. En producción esto lo dispara el webhook de MercadoPago;
// acá lo expone el front al volver del checkout (o en modo mock).
export function confirmPayment(userId, txId) {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!tx) throw { status: 404, message: 'La transacción no existe.' };
  if (tx.buyer_id !== userId) throw { status: 403, message: 'Esta transacción no es tuya.' };
  if (tx.estado === 'completada') return tx;
  db.prepare("UPDATE transactions SET estado='completada' WHERE id = ?").run(txId);
  db.prepare("UPDATE items SET estado='vendida' WHERE id = ?").run(tx.item_id);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
}

export function createReview(userId, { transactionId, rating, comentario = '' }) {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId);
  if (!tx) throw { status: 404, message: 'La transacción no existe.' };
  if (tx.estado !== 'completada') throw { status: 400, message: 'Solo se puede reseñar una transacción concretada.' };
  if (tx.buyer_id !== userId && tx.seller_id !== userId) throw { status: 403, message: 'No participaste de esta transacción.' };
  if (!rating || rating < 1 || rating > 5) throw { status: 400, message: 'El rating va de 1 a 5 estrellas.' };
  const reviewee = tx.buyer_id === userId ? tx.seller_id : tx.buyer_id;
  try {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comentario)
      VALUES (?,?,?,?,?)
    `).run(transactionId, userId, reviewee, rating, comentario.trim());
    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(lastInsertRowid);
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw { status: 409, message: 'Ya dejaste tu reseña para esta transacción.' };
    throw e;
  }
}
