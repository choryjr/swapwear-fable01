import { Router } from 'express';
import { requireAuth, signToken } from '../middleware/auth.js';
import * as Users from '../services/users.js';
import * as Items from '../services/items.js';
import * as Chats from '../services/chats.js';
import * as Payments from '../services/payments.js';

export const api = Router();
const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

// ---------- Auth ----------
api.post('/auth/register', wrap(async (req, res) => {
  const { nombre, email, password } = req.body || {};
  if (!nombre?.trim() || !email?.includes('@') || (password || '').length < 6) {
    throw { status: 400, message: 'Completá nombre, un email válido y una contraseña de al menos 6 caracteres.' };
  }
  const user = Users.createUser({ nombre, email, password });
  res.status(201).json({ user, token: signToken(user.id) });
}));

api.post('/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = Users.verifyCredentials(email, password);
  res.json({ user, token: signToken(user.id) });
}));

api.get('/auth/me', requireAuth, wrap(async (req, res) => {
  const user = Users.getUser(req.userId);
  if (!user) throw { status: 401, message: 'Sesión inválida.' };
  res.json({ user });
}));

// ---------- Usuarios ----------
api.patch('/users/me', requireAuth, wrap(async (req, res) => {
  res.json({ user: Users.updateProfile(req.userId, req.body || {}) });
}));

api.get('/users/:id', requireAuth, wrap(async (req, res) => {
  const user = Users.getUser(Number(req.params.id));
  if (!user) throw { status: 404, message: 'Usuario no encontrado.' };
  res.json({ user, items: Items.getItemsByUser(user.id), reviews: Users.getReviewsFor(user.id) });
}));

// ---------- Prendas ----------
api.get('/items/feed', requireAuth, wrap(async (req, res) => {
  const { talle, marca, categoria } = req.query;
  res.json({ items: Items.getFeed(req.userId, { talle, marca, categoria }) });
}));

api.get('/items/meta', requireAuth, wrap(async (_req, res) => res.json(Items.getMeta())));
api.get('/items/mine', requireAuth, wrap(async (req, res) => res.json({ items: Items.getItemsByUser(req.userId) })));
api.post('/items', requireAuth, wrap(async (req, res) => res.status(201).json({ item: Items.createItem(req.userId, req.body || {}) })));
api.get('/items/:id', requireAuth, wrap(async (req, res) => res.json({ item: Items.getItem(Number(req.params.id)) })));

// ---------- Swipes (interés unilateral → abre chat) ----------
api.post('/swipes', requireAuth, wrap(async (req, res) => {
  const { itemId, liked } = req.body || {};
  Items.recordSwipe(req.userId, Number(itemId), !!liked);
  if (!liked) return res.json({ ok: true });
  const chat = Chats.getOrCreateChat(req.userId, Number(itemId));
  res.json({ ok: true, chatId: chat.id });
}));

// ---------- Chats ----------
api.get('/chats', requireAuth, wrap(async (req, res) => res.json({ chats: Chats.listChats(req.userId) })));
api.get('/chats/:id', requireAuth, wrap(async (req, res) => res.json({ chat: Chats.getChatDetail(Number(req.params.id), req.userId) })));
api.post('/chats/:id/messages', requireAuth, wrap(async (req, res) => {
  res.status(201).json({ message: Chats.sendMessage(Number(req.params.id), req.userId, req.body?.texto) });
}));
api.post('/chats/:id/complete-swap', requireAuth, wrap(async (req, res) => {
  res.json({ transaction: Chats.completeSwap(Number(req.params.id), req.userId) });
}));

// ---------- Pagos y reviews ----------
api.post('/payments/checkout', requireAuth, wrap(async (req, res) => {
  res.json(await Payments.createCheckout(req.userId, Number(req.body?.chatId)));
}));
api.post('/payments/:txId/confirm', requireAuth, wrap(async (req, res) => {
  res.json({ transaction: Payments.confirmPayment(req.userId, Number(req.params.txId)) });
}));
api.post('/reviews', requireAuth, wrap(async (req, res) => {
  res.status(201).json({ review: Payments.createReview(req.userId, req.body || {}) });
}));
