import { useRef, useState, useCallback } from 'react';
import { TipoBadge, Precio, Estrellas } from './ui.jsx';

const UMBRAL = 90; // px de arrastre para confirmar

export default function SwipeDeck({ items, onSwipe }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, activo: false });
  const [saliendo, setSaliendo] = useState(null); // 'like' | 'nope'
  const origen = useRef(null);
  const top = items[0];

  const soltar = useCallback(() => {
    if (Math.abs(drag.x) > UMBRAL) {
      const liked = drag.x > 0;
      setSaliendo(liked ? 'like' : 'nope');
      setTimeout(() => { setSaliendo(null); setDrag({ x: 0, y: 0, activo: false }); onSwipe(top, liked); }, 180);
    } else {
      setDrag({ x: 0, y: 0, activo: false });
    }
    origen.current = null;
  }, [drag.x, onSwipe, top]);

  const onPointerDown = (e) => {
    origen.current = { x: e.clientX, y: e.clientY };
    setDrag((d) => ({ ...d, activo: true }));
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!origen.current) return;
    setDrag({ x: e.clientX - origen.current.x, y: e.clientY - origen.current.y, activo: true });
  };

  const botonSwipe = (liked) => {
    setSaliendo(liked ? 'like' : 'nope');
    setDrag({ x: liked ? 260 : -260, y: -20, activo: false });
    setTimeout(() => { setSaliendo(null); setDrag({ x: 0, y: 0, activo: false }); onSwipe(top, liked); }, 200);
  };

  const estiloTop = {
    transform: `translate(${drag.x}px, ${drag.y * 0.4}px) rotate(${drag.x * 0.06}deg)`,
    transition: drag.activo ? 'none' : 'transform 0.18s ease',
    zIndex: 3,
  };
  const opLike = Math.min(Math.max(drag.x / UMBRAL, 0), 1);
  const opNope = Math.min(Math.max(-drag.x / UMBRAL, 0), 1);

  return (
    <>
      <div className="deck-zona">
        {items[1] && <Card item={items[1]} estilo={{ zIndex: 1, transform: 'scale(0.97)' }} />}
        {top && (
          <Card
            item={top}
            estilo={estiloTop}
            handlers={{ onPointerDown, onPointerMove, onPointerUp: soltar, onPointerCancel: soltar }}
          >
            <div className="stamp me-gusta" style={{ opacity: saliendo === 'like' ? 1 : opLike }}>ME INTERESA</div>
            <div className="stamp paso" style={{ opacity: saliendo === 'nope' ? 1 : opNope }}>PASO</div>
          </Card>
        )}
      </div>
      <div className="acciones">
        <button className="accion no" aria-label="Descartar" onClick={() => top && botonSwipe(false)}>✗</button>
        <button className="accion si" aria-label="Me interesa" onClick={() => top && botonSwipe(true)}>❤️</button>
      </div>
    </>
  );
}

function Card({ item, estilo, handlers = {}, children }) {
  return (
    <article className="swipe-card" style={estilo} {...handlers}>
      <img className="foto" src={item.imagenes[0]} alt={item.titulo} draggable={false} />
      <div className="swipe-grad" />
      <div className="swipe-top">
        <TipoBadge tipo={item.tipo} />
        {item.tipo === 'venta' && (
          <span className="badge badge-venta"><Precio valor={item.precio} /></span>
        )}
      </div>
      {children}
      <div className="swipe-info">
        <h2>{item.titulo}</h2>
        <div className="swipe-owner">
          <img src={item.owner.avatar} alt="" />
          <span>{item.owner.nombre}</span>
          <Estrellas rating={item.owner.rating} cant={item.owner.cantReviews} />
        </div>
        <div className="swipe-tags">
          <span className="pill">{item.talle}</span>
          <span className="pill">{item.marca}</span>
          <span className="pill">{item.categoria}</span>
          {item.tags.map((t) => <span key={t} className="pill">#{t}</span>)}
        </div>
      </div>
    </article>
  );
}
