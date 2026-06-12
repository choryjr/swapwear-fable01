# SwapWear 🧥🔄

Marketplace mobile-first de ropa vintage y de segunda mano con descubrimiento por swipe.
Intercambiá gratis o vendé con pagos vía MercadoPago. Hecho con React + Vite y Node/Express + SQLite.

## Cómo correrla localmente

Requisitos: **Node 22.5 o superior** (usa el SQLite nativo de Node, sin dependencias que compilar).

```bash
# 1. Backend
cd backend
npm install
npm run seed          # crea la DB con 6 usuarios, 20 prendas, chats y reviews
npm run dev           # API en http://localhost:4000

# 2. Frontend (en otra terminal)
cd frontend
npm install
npm run dev           # app en http://localhost:5173 (proxy /api → 4000)
```

Abrí http://localhost:5173 en el celu o con el modo responsive del navegador (390px).

**Usuarios demo** (contraseña de todos: `swapwear123`):
`sofi@demo.com` · `tomi@demo.com` · `cami@demo.com` · `fran@demo.com` · `luz@demo.com` · `nico@demo.com`

Tip para probar los chats de las dos puntas: abrí una ventana normal con Sofi y una de incógnito con Tomi.

## Variables de entorno (backend/.env)

Copiá `backend/.env.example` a `backend/.env`:

| Variable | Qué hace | Default |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `JWT_SECRET` | Secreto para firmar sesiones | dev (cambiar en prod) |
| `PLATFORM_FEE` | Comisión sobre ventas | `0.08` (8%) |
| `MP_ACCESS_TOKEN` | Access token de MercadoPago (Checkout Pro) | vacío → **modo mock** |
| `MP_PUBLIC_KEY` | Public key de MercadoPago | vacío |
| `MP_BACK_URL` | URL a la que vuelve el comprador tras pagar | `http://localhost:5173/checkout/resultado` |
| `DB_FILE` | Ruta del archivo SQLite | `backend/data/swapwear.db` |

### MercadoPago
- **Sin credenciales**: el checkout corre en modo mock — calcula la comisión, crea la transacción y te deja "simular pago aprobado". Ideal para desarrollo y demos.
- **Con `MP_ACCESS_TOKEN`**: el backend crea una *preference* real de Checkout Pro (con `marketplace_fee` = comisión) y redirige al `init_point` de MercadoPago. Al volver, `/checkout/resultado` confirma la transacción.

## Arquitectura

```
backend/
  src/
    config.js          # env vars centralizadas
    db/index.js        # esquema SQLite (node:sqlite)
    db/seed.js         # datos de ejemplo realistas
    middleware/auth.js # JWT
    services/          # lógica de negocio (users, items, chats, payments)
    routes/api.js      # capa HTTP
    server.js
frontend/
  src/
    api/client.js      # fetch con token
    context/           # AuthContext (sesión persistente)
    components/        # ui.jsx (nav, badges, estados), SwipeDeck.jsx
    pages/             # Login, Onboarding, Discover, Chats, ChatRoom,
                       # Publish, Profile, Checkout
    styles.css         # design system (flat, bordes #E6EBF1, radios 8/9999)
```

Decisiones clave:
- **Interés unilateral**: dar ❤️ registra el swipe y abre (o reutiliza) un chat con quien publicó. No hay match mutuo.
- **Viewport**: el shell usa `height: 100dvh` con `flex-direction: column`; el contenido scrollea con `min-height: 0` y la bottom nav es un hijo fijo del flex — las cards y los botones ✗/❤️ nunca quedan tapados, a cualquier alto de pantalla.
- **Concretar**: los intercambios se marcan concretados desde el chat; las ventas se concretan al confirmar el pago. Ambos habilitan reseñas mutuas (rating 1–5 + comentario) que alimentan la reputación.

## Qué quedó mock o pendiente para producción

- **Pagos**: sin token de MP el pago se simula. Con token usa Checkout Pro real, pero la confirmación la dispara el front al volver del pago; en producción hay que **agregar el webhook de MercadoPago** (`/api/payments/webhook`) y verificar el estado contra la API antes de marcar vendida la prenda. El split real del dinero al vendedor requiere MercadoPago Marketplace (OAuth de vendedores).
- **Imágenes**: se suben como base64 a la DB (límite 8 MB por request). Para producción: storage de objetos (S3/Cloudinary) + URLs.
- **Tiempo real**: los chats usan polling cada 3 s. Para producción: WebSockets (Socket.IO) o SSE.
- **DB**: SQLite vía `node:sqlite` (módulo aún marcado experimental por Node, estable en la práctica). Para producción: Postgres — los servicios están aislados de Express, así que la migración es acotada.
- **Seguridad/infra**: falta rate limiting, validación más estricta (zod), recuperación de contraseña, verificación de email, y HTTPS/secrets reales.
- **Avatares demo**: se generan con pravatar.cc; las fotos seed con picsum.photos (requieren internet).
