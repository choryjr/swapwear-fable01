import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db/index.js';
import { api } from './routes/api.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // imágenes en base64 al publicar

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'SwapWear API' }));
app.use('/api', api);

// Manejo central de errores: los servicios lanzan { status, message }
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Algo salió mal. Probá de nuevo.' });
});

app.listen(config.port, () => {
  console.log(`SwapWear API escuchando en http://localhost:${config.port}`);
  if (!config.mercadopago.accessToken) {
    console.log('⚠️  Sin MP_ACCESS_TOKEN: los pagos corren en modo MOCK (se simulan aprobados).');
  }
});
