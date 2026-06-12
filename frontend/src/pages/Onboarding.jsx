import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIAS = ['Camperas', 'Remeras', 'Buzos', 'Pantalones', 'Vestidos', 'Camisas', 'Polleras', 'Sweaters', 'Calzado', 'Accesorios'];

export default function Onboarding() {
  const { user, updateMe } = useAuth();
  const nav = useNavigate();
  const [paso, setPaso] = useState(0);
  const [rol, setRol] = useState(null);
  const [intereses, setIntereses] = useState([]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const toggleInteres = (c) =>
    setIntereses((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));

  const terminar = async () => {
    setError(null); setEnviando(true);
    try {
      await updateMe({ rol, intereses, bio, onboarded: true });
      nav('/descubrir', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const Rol = ({ valor, t, d }) => (
    <button className={`opcion-grande ${rol === valor ? 'elegida' : ''}`} onClick={() => setRol(valor)}>
      <span className="t">{t}</span>
      <span className="sub">{d}</span>
    </button>
  );

  return (
    <div className="pantalla-suelta">
      <div className="pasitos">
        {[0, 1, 2].map((i) => <i key={i} className={i <= paso ? 'hecho' : ''} />)}
      </div>

      {paso === 0 && (
        <>
          <h1>¿Qué sos?</h1>
          <p className="sub">Para acomodar SwapWear a tu manera de usarlo.</p>
          <Rol valor="vendo" t="Tengo ropa para soltar 👋" d="Quiero vender o intercambiar prendas que ya no uso." />
          <Rol valor="busco" t="Vengo a cazar joyitas 🔎" d="Busco prendas vintage y de segunda mano." />
          <Rol valor="ambas" t="Las dos cosas" d="Mi placard rota: entra y sale ropa todo el tiempo." />
          <button className="btn" disabled={!rol} onClick={() => setPaso(1)}>Seguir</button>
        </>
      )}

      {paso === 1 && (
        <>
          <h1>¿Qué buscás?</h1>
          <p className="sub">Elegí las categorías que más te interesan (podés cambiar después).</p>
          <div className="grupo-pills">
            {CATEGORIAS.map((c) => (
              <button key={c} className={`pill ${intereses.includes(c) ? 'activa' : ''}`} onClick={() => toggleInteres(c)}>
                {c}
              </button>
            ))}
          </div>
          <button className="btn" disabled={intereses.length === 0} onClick={() => setPaso(2)}>Seguir</button>
          <button className="btn btn-sec" onClick={() => setPaso(0)}>Volver</button>
        </>
      )}

      {paso === 2 && (
        <>
          <h1>Tu perfil</h1>
          <p className="sub">Contale al resto quién sos, {user?.nombre?.split(' ')[0]}. Genera confianza para concretar.</p>
          <div className="campo">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Ej: Vintage lover de Caballito. Todo lo que publico está impecable ✨" />
          </div>
          {error && <p className="error-texto">{error}</p>}
          <button className="btn" onClick={terminar} disabled={enviando}>
            {enviando ? 'Guardando…' : 'Listo, a deslizar 🧥'}
          </button>
          <button className="btn btn-sec" onClick={() => setPaso(1)}>Volver</button>
        </>
      )}
    </div>
  );
}
