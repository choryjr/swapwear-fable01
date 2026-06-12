import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Cargando, ErrorEstado, Vacio, TipoBadge } from '../components/ui.jsx';

export default function Chats() {
  const [chats, setChats] = useState(null);
  const [error, setError] = useState(null);

  const cargar = () => {
    setError(null);
    api('/chats').then(({ chats }) => setChats(chats)).catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  return (
    <>
      <header className="pagehead"><h1>Chats</h1></header>
      {error ? (
        <ErrorEstado mensaje={error} onRetry={cargar} />
      ) : chats === null ? (
        <Cargando texto="Trayendo tus conversaciones…" />
      ) : chats.length === 0 ? (
        <Vacio
          emoji="💬"
          titulo="Todavía no tenés chats"
          detalle="Cuando des ❤️ a una prenda se abre un chat directo con quien la publicó."
          accion={<Link className="btn btn-sec btn-chico" to="/descubrir">Ir a descubrir</Link>}
        />
      ) : (
        <div className="scroll">
          {chats.map((c) => (
            <Link key={c.id} to={`/chats/${c.id}`} className="fila">
              <img className="thumb" src={c.item.imagen} alt="" />
              <div className="col">
                <span className="titulo">{c.otro.nombre} · {c.item.titulo}</span>
                <span className="detalle">
                  {c.ultimoMensaje || (c.soyOwner ? 'Le interesó tu prenda — saludalo 👋' : 'Decile hola para coordinar')}
                </span>
              </div>
              <TipoBadge tipo={c.item.tipo} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
