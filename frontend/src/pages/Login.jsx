import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async () => {
    setError(null); setEnviando(true);
    try {
      const user = modo === 'login'
        ? await login(form.email, form.password)
        : await register(form.nombre, form.email, form.password);
      nav(user.onboarded ? '/descubrir' : '/onboarding', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla-suelta" style={{ justifyContent: 'center' }}>
      <div>
        <div className="logo-sw">Swap<span>Wear</span></div>
        <p className="sub">Descubrí, intercambiá y vendé ropa con onda. Todo en un solo lugar.</p>
      </div>

      <div className="grupo-pills">
        <button className={`pill ${modo === 'login' ? 'activa' : ''}`} onClick={() => setModo('login')}>Ya tengo cuenta</button>
        <button className={`pill ${modo === 'registro' ? 'activa' : ''}`} onClick={() => setModo('registro')}>Crear cuenta</button>
      </div>

      {modo === 'registro' && (
        <div className="campo">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" value={form.nombre} onChange={set('nombre')} placeholder="¿Cómo te llamás?" />
        </div>
      )}
      <div className="campo">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="vos@mail.com" />
      </div>
      <div className="campo">
        <label htmlFor="pass">Contraseña</label>
        <input id="pass" type="password" value={form.password} onChange={set('password')}
          placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
          onKeyDown={(e) => e.key === 'Enter' && enviar()} />
      </div>

      {error && <p className="error-texto">{error}</p>}

      <button className="btn" onClick={enviar} disabled={enviando}>
        {enviando ? 'Un segundo…' : modo === 'login' ? 'Entrar' : 'Crear mi cuenta'}
      </button>

      <p className="sub" style={{ textAlign: 'center' }}>
        Demo: <b>sofi@demo.com</b> / <b>swapwear123</b>
      </p>
    </div>
  );
}
