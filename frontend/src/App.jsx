import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { BottomNav, Cargando } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Discover from './pages/Discover.jsx';
import Chats from './pages/Chats.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import Publish from './pages/Publish.jsx';
import { MiPerfil, PerfilPublico } from './pages/Profile.jsx';
import { Checkout, CheckoutResultado } from './pages/Checkout.jsx';

function Privado() {
  const { user, cargando } = useAuth();
  const loc = useLocation();
  if (cargando) return <Cargando texto="Abriendo SwapWear…" />;
  if (!user) return <Navigate to="/entrar" replace />;
  if (!user.onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function ConNav() {
  return (
    <>
      <div className="shell-main"><Outlet /></div>
      <BottomNav />
    </>
  );
}

function SinNav() {
  return <div className="shell-main"><Outlet /></div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="shell">
          <Routes>
            <Route element={<SinNav />}>
              <Route path="/entrar" element={<Login />} />
            </Route>
            <Route element={<Privado />}>
              <Route element={<SinNav />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/checkout/resultado" element={<CheckoutResultado />} />
                <Route path="/checkout/:chatId" element={<Checkout />} />
                <Route path="/chats/:id" element={<ChatRoom />} />
              </Route>
              <Route element={<ConNav />}>
                <Route path="/descubrir" element={<Discover />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/publicar" element={<Publish />} />
                <Route path="/perfil" element={<MiPerfil />} />
                <Route path="/usuarios/:id" element={<PerfilPublico />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/descubrir" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
