import { db } from '../db/index.js';
import { publicUser } from './users.js';

function hydrate(row) {
  if (!row) return null;
  const owner = publicUser(db.prepare('SELECT id, nombre, avatar, bio, rol, intereses, onboarded, created_at FROM users WHERE id = ?').get(row.user_id));
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    imagenes: JSON.parse(row.imagenes || '[]'),
    owner: { id: owner.id, nombre: owner.nombre, avatar: owner.avatar, rating: owner.rating, cantReviews: owner.cantReviews },
  };
}

export function getFeed(userId, { talle, marca, categoria } = {}) {
  const conds = ["i.estado = 'activa'", 'i.user_id != ?', 'i.id NOT IN (SELECT item_id FROM swipes WHERE user_id = ?)'];
  const params = [userId, userId];
  if (talle) { conds.push('i.talle = ?'); params.push(talle); }
  if (marca) { conds.push('i.marca = ?'); params.push(marca); }
  if (categoria) { conds.push('i.categoria = ?'); params.push(categoria); }
  const rows = db.prepare(`
    SELECT i.* FROM items i WHERE ${conds.join(' AND ')} ORDER BY i.created_at DESC LIMIT 30
  `).all(...params);
  return rows.map(hydrate);
}

export function getItem(id) {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!row) throw { status: 404, message: 'La prenda no existe o fue eliminada.' };
  return hydrate(row);
}

export function getItemsByUser(userId) {
  return db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(hydrate);
}

export function createItem(userId, data) {
  const { titulo, descripcion = '', tipo, precio, talle, marca, categoria, tags = [], imagenes = [] } = data;
  if (!titulo?.trim()) throw { status: 400, message: 'Poné un título para la prenda.' };
  if (!['intercambio', 'venta'].includes(tipo)) throw { status: 400, message: 'Elegí intercambio o venta.' };
  if (tipo === 'venta' && (!precio || precio <= 0)) throw { status: 400, message: 'Las ventas necesitan un precio mayor a cero.' };
  if (!talle?.trim() || !marca?.trim() || !categoria?.trim()) throw { status: 400, message: 'Completá talle, marca y categoría.' };
  const imgs = imagenes.length ? imagenes : [`https://picsum.photos/seed/sw-${Date.now()}/600/800`];
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO items (user_id, titulo, descripcion, tipo, precio, talle, marca, categoria, tags, imagenes)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(userId, titulo.trim(), descripcion.trim(), tipo, tipo === 'venta' ? Math.round(precio) : null,
    talle.trim(), marca.trim(), categoria.trim(), JSON.stringify(tags), JSON.stringify(imgs));
  return getItem(lastInsertRowid);
}

export function getMeta() {
  const col = (c) => db.prepare(`SELECT DISTINCT ${c} AS v FROM items WHERE estado='activa' ORDER BY v`).all().map((r) => r.v);
  return { talles: col('talle'), marcas: col('marca'), categorias: col('categoria') };
}

export function recordSwipe(userId, itemId, liked) {
  const item = getItem(itemId);
  if (item.user_id === userId) throw { status: 400, message: 'No podés swipear tu propia prenda.' };
  db.prepare('INSERT OR REPLACE INTO swipes (user_id, item_id, liked) VALUES (?,?,?)').run(userId, itemId, liked ? 1 : 0);
  return item;
}
