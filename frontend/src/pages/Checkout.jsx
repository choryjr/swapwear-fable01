import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Cargando, ErrorEstado, Precio, useToast } from '../components/ui.jsx';

export function Checkout() {
  const { chatId } = useParams();
  const nav = useNavigate();
  const [chat, setChat] = useState(null);
  const [pago, setPago] = useState(null);     // respuesta de /payments/checkout
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [toast, avisar] = useToast();

  useEffect(() => {
    api(`/chats/${chatId}`).then(({ chat }) => setChat(chat)).catch((e) => setError(e.message));
  }, [chatId]);

  const iniciarPago = async () => {
    setPagando(true); setError(null);
    try {
      const r = await api('/payments/checkout', { method: 'POST', body: { chatId: Number(chatId) } });
      if (!r.mock && r.initPoint) {
        window.location.href = r.initPoint; // Checkout Pro de MercadoPago
        return;
      }
      setPago(r); // modo mock: confirmamos acá mismo
    } catch (e) {
      setError(e.message);
    } finally {
      setPagando(false);
    }
  };

  const confirmarMock = async () => {
    setPagando(true);
    try {
      await api(`/payments/${pago.transactionId}/confirm`, { method: 'POST' });
      avisar('¡Pago aprobado! 🎉');
      setTimeout(() => nav(`/chats/${chatId}`), 1200);
    } catch (e) {
      setError(e.message);
      setPagando(false);
    }
  };

  if (error && !chat) return <ErrorEstado mensaje={error} />;
  if (!chat) return <Cargando texto="Preparando el checkout…" />;

  const comision = Math.round(chat.item.precio * 0.08);

  return (
    <>
      <header className="pagehead">
        <Link to={`/chats/${chatId}`} aria-label="Volver">←</Link>
        <h1 style={{ flex: 1, paddingLeft: 10 }}>Checkout</h1>
      </header>
      <div className="pantalla-suelta" style={{ paddingTop: 16 }}>
        <div className="fila" style={{ border: '1px solid var(--borde)', borderRadius: 'var(--radio)' }}>
          <img className="thumb" src={chat.item.imagen} alt="" />
          <div className="col">
            <span className="titulo">{chat.item.titulo}</span>
            <span className="detalle">Le comprás a {chat.otro.nombre}</span>
          </div>
        </div>

        <div className="tabla-pago">
          <div className="linea"><span>Prenda</span><Precio valor={chat.item.precio} /></div>
          <div className="linea"><span>Comisión SwapWear (8%) — la cubre quien vende</span><Precio valor={comision} /></div>
          <div className="linea"><span>Pagás</span><Precio valor={chat.item.precio} /></div>
        </div>
        <p className="sub">El pago se procesa con MercadoPago. La comisión se descuenta de lo que recibe quien vende; intercambiar es siempre gratis.</p>

        {error && <p className="error-texto">{error}</p>}

        {!pago ? (
          <button className="btn btn-verde" onClick={iniciarPago} disabled={pagando}>
            {pagando ? 'Conectando con MercadoPago…' : 'Pagar con MercadoPago'}
          </button>
        ) : (
          <>
            <p className="sub" style={{ textAlign: 'center' }}>
              Modo demo: no hay credenciales de MercadoPago cargadas, así que simulamos el pago aprobado.
            </p>
            <button className="btn btn-verde" onClick={confirmarMock} disabled={pagando}>
              {pagando ? 'Confirmando…' : 'Simular pago aprobado ✓'}
            </button>
          </>
        )}
      </div>
      {toast}
    </>
  );
}

// Pantalla a la que vuelve MercadoPago real (back_urls)
export function CheckoutResultado() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [estado, setEstado] = useState('procesando');
  const tx = params.get('tx');
  const status = params.get('status');

  useEffect(() => {
    if (status === 'success' && tx) {
      api(`/payments/${tx}/confirm`, { method: 'POST' })
        .then(() => setEstado('ok'))
        .catch(() => setEstado('error'));
    } else {
      setEstado(status === 'pending' ? 'pendiente' : 'error');
    }
  }, [tx, status]);

  const mapa = {
    procesando: ['⏳', 'Confirmando tu pago…', null],
    ok: ['🎉', '¡Pago aprobado!', 'La prenda ya es tuya. Coordiná la entrega por el chat.'],
    pendiente: ['🕐', 'Pago pendiente', 'MercadoPago todavía está procesando tu pago.'],
    error: ['😕', 'El pago no se completó', 'No se hizo ningún cargo. Podés intentar de nuevo desde el chat.'],
  };
  const [emoji, titulo, detalle] = mapa[estado];

  return (
    <div className="estado-centro">
      <div className="emoji">{emoji}</div>
      <h2 style={{ color: 'var(--tinta)' }}>{titulo}</h2>
      {detalle && <p>{detalle}</p>}
      <button className="btn btn-sec btn-chico" onClick={() => nav('/chats')}>Ir a mis chats</button>
    </div>
  );
}
