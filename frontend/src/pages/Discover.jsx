import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import SwipeDeck from '../components/SwipeDeck.jsx';
import { Cargando, ErrorEstado, Vacio, useToast } from '../components/ui.jsx';

export default function Discover() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ talles: [], marcas: [], categorias: [] });
  const [filtros, setFiltros] = useState({ talle: '', marca: '', categoria: '' });
  const [verFiltros, setVerFiltros] = useState(false);
  const [toast, avisar] = useToast();

  const cantFiltros = Object.values(filtros).filter(Boolean).length;

  const cargar = useCallback(async (f = filtros) => {
    setItems(null); setError(null);
    try {
      const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
      const [{ items }, m] = await Promise.all([api(`/items/feed${q ? `?${q}` : ''}`), api('/items/meta')]);
      setItems(items);
      setMeta(m);
    } catch (e) {
      setError(e.message);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSwipe = useCallback(async (item, liked) => {
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    try {
      const r = await api('/swipes', { method: 'POST', body: { itemId: item.id, liked } });
      if (liked && r.chatId) {
        avisar('Chat abierto con ' + item.owner.nombre + ' 💬');
      }
    } catch (e) {
      avisar(e.message);
    }
  }, [avisar]);

  const aplicar = (f) => { setFiltros(f); setVerFiltros(false); cargar(f); };

  const cuerpo = useMemo(() => {
    if (error) return <ErrorEstado mensaje={error} onRetry={() => cargar()} />;
    if (items === null) return <Cargando texto="Buscando prendas para vos…" />;
    if (items.length === 0) {
      return (
        <Vacio
          emoji="🧺"
          titulo="No quedan prendas por acá"
          detalle={cantFiltros ? 'Probá aflojar los filtros o volvé más tarde.' : 'Ya viste todo lo disponible. Volvé más tarde o publicá algo tuyo.'}
          accion={cantFiltros
            ? <button className="btn btn-sec btn-chico" onClick={() => aplicar({ talle: '', marca: '', categoria: '' })}>Limpiar filtros</button>
            : <button className="btn btn-sec btn-chico" onClick={() => nav('/publicar')}>Publicar una prenda</button>}
        />
      );
    }
    return <SwipeDeck items={items} onSwipe={onSwipe} />;
  }, [items, error, cantFiltros, onSwipe, cargar, nav]);

  return (
    <>
      <header className="pagehead">
        <div className="logo-sw" style={{ fontSize: 20 }}>Swap<span>Wear</span></div>
        <button className="pill" onClick={() => setVerFiltros(true)}>
          Filtros {cantFiltros > 0 && `· ${cantFiltros}`}
        </button>
      </header>
      {cuerpo}
      {verFiltros && (
        <Filtros meta={meta} valor={filtros} onCerrar={() => setVerFiltros(false)} onAplicar={aplicar} />
      )}
      {toast}
    </>
  );
}

function Filtros({ meta, valor, onCerrar, onAplicar }) {
  const [f, setF] = useState(valor);
  const toggle = (k, v) => setF({ ...f, [k]: f[k] === v ? '' : v });
  const Grupo = ({ titulo, k, opciones }) => (
    <div>
      <h2 style={{ marginBottom: 8 }}>{titulo}</h2>
      <div className="grupo-pills">
        {opciones.map((o) => (
          <button key={o} className={`pill ${f[k] === o ? 'activa' : ''}`} onClick={() => toggle(k, o)}>{o}</button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <div className="sheet-fondo" onClick={onCerrar} />
      <div className="sheet" role="dialog" aria-label="Filtros">
        <Grupo titulo="Categoría" k="categoria" opciones={meta.categorias} />
        <Grupo titulo="Talle" k="talle" opciones={meta.talles} />
        <Grupo titulo="Marca" k="marca" opciones={meta.marcas} />
        <button className="btn" onClick={() => onAplicar(f)}>Ver prendas</button>
        <button className="btn btn-sec" onClick={() => onAplicar({ talle: '', marca: '', categoria: '' })}>Limpiar todo</button>
      </div>
    </>
  );
}
