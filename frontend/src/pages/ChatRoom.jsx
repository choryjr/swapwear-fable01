import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando, ErrorEstado, TipoBadge, Precio, EstrellasInput, useToast } from '../components/ui.jsx';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verReseña, setVerReseña] = useState(false);
  const [toast, avisar] = useToast();
  const fin = useRef(null);

  const cargar = useCallback(async (scroll = false) => {
    try {
      const { chat } = await api(`/chats/${id}`);
      setChat(chat); setError(null);
      if (scroll) setTimeout(() => fin.current?.scrollIntoView({ block: 'end' }), 50);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    cargar(true);
    const t = setInterval(() => cargar(false), 3000); // polling simple
    return () => clearInterval(t);
  }, [cargar]);

  const enviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await api(`/chats/${id}/messages`, { method: 'POST', body: { texto } });
      setTexto('');
      await cargar(true);
    } catch (e) {
      avisar(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const concretarSwap = async () => {
    try {
      await api(`/chats/${id}/complete-swap`, { method: 'POST' });
      avisar('¡Intercambio concretado! 🎉 Ahora pueden reseñarse.');
      await cargar(false);
    } catch (e) {
      avisar(e.message);
    }
  };

  if (error && !chat) return <ErrorEstado mensaje={error} onRetry={() => cargar(true)} />;
  if (!chat) return <Cargando texto="Abriendo el chat…" />;

  const concretada = chat.transaction?.estado === 'completada';
  const puedePagar = !chat.soyOwner && chat.item.tipo === 'venta' && chat.item.estado === 'activa';
  const puedeSwap = chat.item.tipo === 'intercambio' && chat.item.estado === 'activa';

  return (
    <>
      <header className="pagehead">
        <Link to="/chats" aria-label="Volver">←</Link>
        <div className="col" style={{ flex: 1, minWidth: 0, padding: '0 10px' }}>
          <Link to={`/usuarios/${chat.otro.id}`} className="titulo" style={{ fontWeight: 700 }}>{chat.otro.nombre}</Link>
        </div>
        <img src={chat.otro.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--borde)' }} />
      </header>

      <div className="chat-itembar">
        <img src={chat.item.imagen} alt="" />
        <div className="col" style={{ flex: 1, minWidth: 0 }}>
          <span className="titulo" style={{ fontSize: 14, fontWeight: 700 }}>{chat.item.titulo}</span>
          <span className="detalle">
            {chat.item.tipo === 'venta' ? <Precio valor={chat.item.precio} /> : 'Se intercambia'}
            {chat.item.estado !== 'activa' && ' · ya no disponible'}
          </span>
        </div>
        <TipoBadge tipo={chat.item.tipo} />
      </div>

      <div className="chat-mensajes">
        {chat.messages.length === 0 && (
          <p className="sub" style={{ textAlign: 'center', padding: '20px 0' }}>
            Rompé el hielo: preguntá por estado, medidas o punto de encuentro.
          </p>
        )}
        {chat.messages.map((m) => (
          <div key={m.id} className={`burbuja ${m.sender_id === user.id ? 'mia' : 'otra'}`}>{m.texto}</div>
        ))}
        {concretada && !chat.yaReseñe && (
          <button className="btn btn-sec btn-chico" style={{ alignSelf: 'center' }} onClick={() => setVerReseña(true)}>
            ⭐ Dejar reseña a {chat.otro.nombre.split(' ')[0]}
          </button>
        )}
        {concretada && chat.yaReseñe && (
          <p className="sub" style={{ textAlign: 'center' }}>Transacción concretada · reseña enviada ✓</p>
        )}
        <div ref={fin} />
      </div>

      {(puedePagar || puedeSwap) && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--borde)' }}>
          {puedePagar && (
            <button className="btn btn-verde" onClick={() => nav(`/checkout/${chat.id}`)}>
              Comprar por <Precio valor={chat.item.precio} />
            </button>
          )}
          {puedeSwap && (
            <button className="btn btn-verde" onClick={concretarSwap}>
              Marcar intercambio como concretado 🤝
            </button>
          )}
        </div>
      )}

      <div className="chat-input">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
          placeholder="Escribí un mensaje…"
          aria-label="Mensaje"
          style={{ minHeight: 44, padding: '10px 14px', border: '1px solid var(--borde)', borderRadius: 'var(--radio)' }}
        />
        <button className="btn btn-chico" onClick={enviar} disabled={enviando || !texto.trim()}>Enviar</button>
      </div>

      {verReseña && (
        <Reseña
          transactionId={chat.transaction.id}
          nombre={chat.otro.nombre}
          onCerrar={() => setVerReseña(false)}
          onListo={() => { setVerReseña(false); avisar('¡Gracias por tu reseña! ⭐'); cargar(false); }}
          avisar={avisar}
        />
      )}
      {toast}
    </>
  );
}

function Reseña({ transactionId, nombre, onCerrar, onListo, avisar }) {
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      await api('/reviews', { method: 'POST', body: { transactionId, rating, comentario } });
      onListo();
    } catch (e) {
      avisar(e.message);
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="sheet-fondo" onClick={onCerrar} />
      <div className="sheet" role="dialog" aria-label="Dejar reseña">
        <h2>¿Cómo fue tratar con {nombre.split(' ')[0]}?</h2>
        <EstrellasInput valor={rating} onChange={setRating} />
        <div className="campo">
          <label htmlFor="coment">Comentario (opcional)</label>
          <textarea id="coment" value={comentario} onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej: La prenda llegó tal cual las fotos, súper amable." />
        </div>
        <button className="btn" onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Publicar reseña'}
        </button>
      </div>
    </>
  );
}
