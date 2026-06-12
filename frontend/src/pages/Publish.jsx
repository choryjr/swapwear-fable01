import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../components/ui.jsx';

const CATEGORIAS = ['Camperas', 'Remeras', 'Buzos', 'Pantalones', 'Vestidos', 'Camisas', 'Polleras', 'Sweaters', 'Calzado', 'Accesorios'];
const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único', '30', '32', '34', '36', '38', '40', '42', '44'];

export default function Publish() {
  const nav = useNavigate();
  const [f, setF] = useState({
    titulo: '', descripcion: '', tipo: 'intercambio', precio: '',
    talle: '', marca: '', categoria: '', tags: '',
  });
  const [imagenes, setImagenes] = useState([]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, avisar] = useToast();

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const subirFotos = (e) => {
    const files = [...e.target.files].slice(0, 3 - imagenes.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setImagenes((xs) => [...xs, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const publicar = async () => {
    setError(null); setEnviando(true);
    try {
      await api('/items', {
        method: 'POST',
        body: {
          ...f,
          precio: f.tipo === 'venta' ? Number(f.precio) : null,
          tags: f.tags.split(/[#,\s]+/).map((t) => t.trim()).filter(Boolean),
          imagenes,
        },
      });
      avisar('¡Prenda publicada! 🎉 Ya aparece en Descubrir.');
      setTimeout(() => nav('/perfil'), 1200);
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <>
      <header className="pagehead"><h1>Publicar prenda</h1></header>
      <div className="pantalla-suelta" style={{ paddingTop: 16 }}>
        <div className="campo">
          <label>Fotos (hasta 3)</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {imagenes.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={src} alt={`Foto ${i + 1}`} style={{ width: 84, height: 112, objectFit: 'cover', borderRadius: 'var(--radio)', border: '1px solid var(--borde)' }} />
                <button onClick={() => setImagenes((xs) => xs.filter((_, j) => j !== i))} aria-label="Quitar foto"
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--borde)', background: 'var(--blanco)', fontSize: 12 }}>✗</button>
              </div>
            ))}
            {imagenes.length < 3 && (
              <label style={{ width: 84, height: 112, border: '1px dashed var(--borde)', borderRadius: 'var(--radio)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'var(--gris)', cursor: 'pointer' }}>
                ＋
                <input type="file" accept="image/*" multiple onChange={subirFotos} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <span className="sub">Si no subís fotos usamos una imagen de muestra.</span>
        </div>

        <div className="campo">
          <label htmlFor="titulo">Título</label>
          <input id="titulo" value={f.titulo} onChange={set('titulo')} placeholder="Ej: Campera de jean oversize 90s" />
        </div>

        <div className="campo">
          <label htmlFor="desc">Descripción</label>
          <textarea id="desc" value={f.descripcion} onChange={set('descripcion')} placeholder="Estado, medidas, detalles. Cuanto más completa, más rápido se mueve." />
        </div>

        <div className="campo">
          <label>¿Qué querés hacer con esta prenda?</label>
          <div className="grupo-pills">
            <button className={`pill ${f.tipo === 'intercambio' ? 'activa' : ''}`} onClick={() => setF({ ...f, tipo: 'intercambio' })}>🔄 Intercambio</button>
            <button className={`pill ${f.tipo === 'venta' ? 'activa' : ''}`} onClick={() => setF({ ...f, tipo: 'venta' })}>💸 Venta</button>
          </div>
        </div>

        {f.tipo === 'venta' && (
          <div className="campo">
            <label htmlFor="precio">Precio (ARS)</label>
            <input id="precio" type="number" min="1" value={f.precio} onChange={set('precio')} placeholder="Ej: 35000" />
            <span className="sub">Intercambiar es gratis. Sobre las ventas SwapWear cobra una comisión chica del 8%.</span>
          </div>
        )}

        <div className="campo">
          <label htmlFor="talle">Talle</label>
          <select id="talle" value={f.talle} onChange={set('talle')}>
            <option value="">Elegí un talle</option>
            {TALLES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="marca">Marca</label>
          <input id="marca" value={f.marca} onChange={set('marca')} placeholder="Ej: Levi's, Sin marca…" />
        </div>

        <div className="campo">
          <label htmlFor="cat">Categoría</label>
          <select id="cat" value={f.categoria} onChange={set('categoria')}>
            <option value="">Elegí una categoría</option>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="tags">Tags y hashtags</label>
          <input id="tags" value={f.tags} onChange={set('tags')} placeholder="#vintage #90s #denim" />
        </div>

        {error && <p className="error-texto">{error}</p>}
        <button className="btn" onClick={publicar} disabled={enviando}>
          {enviando ? 'Publicando…' : 'Publicar prenda'}
        </button>
      </div>
      {toast}
    </>
  );
}
