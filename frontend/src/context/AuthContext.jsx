import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) { setCargando(false); return; }
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, token } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(token); setUser(user);
    return user;
  }, []);

  const register = useCallback(async (nombre, email, password) => {
    const { user, token } = await api('/auth/register', { method: 'POST', body: { nombre, email, password } });
    setToken(token); setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  const updateMe = useCallback(async (patch) => {
    const { user } = await api('/users/me', { method: 'PATCH', body: patch });
    setUser(user);
    return user;
  }, []);

  return (
    <AuthCtx.Provider value={{ user, cargando, login, register, logout, updateMe }}>
      {children}
    </AuthCtx.Provider>
  );
}
