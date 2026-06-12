import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando, ErrorEstado, Vacio, Estrellas, TipoBadge, Precio } from '../components/ui.jsx';

export function MiPerfil() {
  const { user, logout } = useAuth();
  return <Perfil userId={user.id} propio onLogout={logout} />;
}

export function PerfilPublico() {
  const { id } = useParams();
  return <Perfil userId={Number(id)} />;
}

function Perfil({ userId, propio = false, onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('prendas');

  const cargar = () => {
    setError(null);
    api(`/users/${userId}`).then(setData).catch((e) => setError(e.message));
  };
  useEffect(cargar, [userId]);

  if (error) return <ErrorEstado mensaje={error} onRetry={cargar} />;
  if (!data) return <Cargando texto="Cargando perfil…" />;

  const { user, items, reviews } = data;

  return (
    <>
      <header className="pagehead">
        <h1>{propio ? 'Tu perfil' : 'Perfil'}</h1>
        {propio && <button className="pill" onClick={onLogout}>Cerrar sesión</button>}
      </header>
      <div className="scroll">
        <div className="perfil-head">
          <img src={user.avatar} alt="" />
          <div className="col" style={{ flex: 1 }}>
            <h2>{user.nombre}</h2>
            <Estrellas rating={user.rating} cant={user.cantReviews} />
            {user.bio && <p className="sub" style={{ marginTop: 4 }}>{user.bio}</p>}
            {user.intereses?.length > 0 && (
              <div className="grupo-pills" style={{ marginTop: 8 }}>
                {user.intereses.map((i) => <span key={i} className="pill">{i}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="grupo-pills" style={{ padding: '12px 16px 0' }}>
          <button className={`pill ${tab === 'prendas' ? 'activa' : ''}`} onClick={() => setTab('prendas')}>
            Prendas ({items.length})
          </button>
          <button className={`pill ${tab === 'reviews' ? 'activa' : ''}`} onClick={() => setTab('reviews')}>
            Reseñas ({reviews.length})
          </button>
        </div>

        {tab === 'prendas' && (
          items.length === 0 ? (
            <Vacio
              emoji="🧥"
              titulo={propio ? 'Todavía no publicaste nada' : 'No tiene prendas publicadas'}
              detalle={propio ? 'Esa ropa que no usás puede ser la joyita de otra persona.' : undefined}
              accion={propio && <Link className="btn btn-sec btn-chico" to="/publicar">Publicar mi primera prenda</Link>}
            />
          ) : (
            <div className="grid-prendas">
              {items.map((i) => (
                <article key={i.id} className={`mini-card ${i.estado !== 'activa' ? 'apagada' : ''}`}>
                  <img src={i.imagenes[0]} alt={i.titulo} />
                  <div className="cuerpo">
                    <span className="titulo">{i.titulo}</span>
                    {i.tipo === 'venta' ? <Precio valor={i.precio} /> : <TipoBadge tipo="intercambio" />}
                    {i.estado !== 'activa' && <span className="sub">Ya no disponible</span>}
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {tab === 'reviews' && (
          reviews.length === 0 ? (
            <Vacio emoji="⭐" titulo="Sin reseñas todavía" detalle="Las reseñas aparecen después de concretar una venta o intercambio." />
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="fila">
                <img className="thumb" src={r.reviewer_avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div className="col">
                  <span className="titulo" style={{ fontSize: 14 }}>{r.reviewer_nombre}</span>
                  <Estrellas rating={r.rating} />
                  {r.comentario && <span className="detalle" style={{ whiteSpace: 'normal' }}>{r.comentario}</span>}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </>
  );
}
