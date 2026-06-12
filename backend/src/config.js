import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion',
  jwtExpiresIn: '30d',
  dbFile: process.env.DB_FILE || new URL('../data/swapwear.db', import.meta.url).pathname,
  // Comisión de plataforma sobre ventas (8%)
  comision: Number(process.env.PLATFORM_FEE ?? 0.08),
  mercadopago: {
    accessToken: process.env.MP_ACCESS_TOKEN || null,
    publicKey: process.env.MP_PUBLIC_KEY || null,
    backUrl: process.env.MP_BACK_URL || 'http://localhost:5173/checkout/resultado',
  },
};
