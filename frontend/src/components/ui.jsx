import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function BottomNav() {
  const item = (to, ico, label) => (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'activa' : '')}>
      <span className="ico">{ico}</span>
      {label}
    </NavLink>
  );
  return (
    <nav className="bottomnav">
      {item('/descubrir', '🧥', 'Descubrir')}
      {item('/chats', '💬', 'Chats')}
      {item('/publicar', '＋', 'Publicar')}
      {item('/perfil', '👤', 'Perfil')}
    </nav>
  );
}

export const TipoBadge = ({ tipo }) =>
  tipo === 'intercambio'
    ? <span className="badge badge-intercambio">Intercambio</span>
    : <span className="badge badge-venta">Venta</span>;

export const Precio = ({ valor }) =>
  <span className="precio">${Number(valor).toLocaleString('es-AR')}</span>;

export function Estrellas({ rating, cant }) {
  if (rating == null) return <span className="sub">Sin reseñas aún</span>;
  const llenas = Math.round(rating);
  return (
    <span className="estrellas" aria-label={`${rating} de 5`}>
      {'★'.repeat(llenas)}{'☆'.repeat(5 - llenas)}
      <span className="sub" style={{ marginLeft: 6 }}>{rating} {cant != null && `(${cant})`}</span>
    </span>
  );
}

export function EstrellasInput({ valor, onChange }) {
  return (
    <div className="estrellas grandes" role="radiogroup" aria-label="Tu puntuación">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} role="radio" aria-checked={valor === n} onClick={() => onChange(n)}>
          {n <= valor ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export const Cargando = ({ texto = 'Cargando…' }) => (
  <div className="estado-centro"><div className="spinner" /><p>{texto}</p></div>
);

export const Vacio = ({ emoji = '🪺', titulo, detalle, accion }) => (
  <div className="estado-centro">
    <div className="emoji">{emoji}</div>
    <h2 style={{ color: 'var(--tinta)' }}>{titulo}</h2>
    {detalle && <p>{detalle}</p>}
    {accion}
  </div>
);

export const ErrorEstado = ({ mensaje, onRetry }) => (
  <div className="estado-centro">
    <div className="emoji">😵‍💫</div>
    <h2 style={{ color: 'var(--tinta)' }}>Hubo un problema</h2>
    <p>{mensaje}</p>
    {onRetry && <button className="btn btn-sec btn-chico" onClick={onRetry}>Reintentar</button>}
  </div>
);

export function Toast({ texto, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{texto}</div>;
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const nodo = toast ? <Toast texto={toast} onDone={() => setToast(null)} /> : null;
  return [nodo, setToast];
}
