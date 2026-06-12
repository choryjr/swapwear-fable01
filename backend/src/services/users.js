import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

const PUBLIC_FIELDS = 'id, nombre, avatar, bio, rol, intereses, onboarded, created_at';

export function publicUser(row) {
  if (!row) return null;
  const { n, avg } = db
    .prepare('SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE reviewee_id = ?')
    .get(row.id);
  return {
    ...row,
    intereses: JSON.parse(row.intereses || '[]'),
    rating: avg ? Math.round(avg * 10) / 10 : null,
    cantReviews: n,
  };
}

export function createUser({ nombre, email, password }) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) throw { status: 409, message: 'Ya existe una cuenta con ese email.' };
  const hash = bcrypt.hashSync(password, 10);
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (nombre, email, password_hash, avatar) VALUES (?,?,?,?)')
    .run(nombre.trim(), email.toLowerCase(), hash, avatar);
  return getUser(lastInsertRowid);
}

export function verifyCredentials(email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    throw { status: 401, message: 'Email o contraseña incorrectos.' };
  }
  return getUser(row.id);
}

export function getUser(id) {
  const row = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(id);
  return publicUser(row);
}

export function updateProfile(id, { nombre, bio, avatar, rol, intereses, onboarded }) {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!current) throw { status: 404, message: 'Usuario no encontrado.' };
  db.prepare(`
    UPDATE users SET
      nombre = COALESCE(?, nombre),
      bio = COALESCE(?, bio),
      avatar = COALESCE(?, avatar),
      rol = COALESCE(?, rol),
      intereses = COALESCE(?, intereses),
      onboarded = COALESCE(?, onboarded)
    WHERE id = ?
  `).run(
    nombre ?? null, bio ?? null, avatar ?? null, rol ?? null,
    intereses ? JSON.stringify(intereses) : null,
    onboarded === undefined ? null : (onboarded ? 1 : 0),
    id
  );
  return getUser(id);
}

export function getReviewsFor(userId) {
  return db.prepare(`
    SELECT r.id, r.rating, r.comentario, r.created_at, u.id AS reviewer_id, u.nombre AS reviewer_nombre, u.avatar AS reviewer_avatar
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.reviewee_id = ? ORDER BY r.created_at DESC
  `).all(userId);
}
