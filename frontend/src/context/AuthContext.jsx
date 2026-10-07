import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('campus_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campus_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authService.me();
        setUser(data.user);
        localStorage.setItem('campus_user', JSON.stringify(data.user));
      } catch {
        setAuthToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const login = async (payload) => {
    const { data } = await authService.login(payload);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('campus_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authService.register(payload);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('campus_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user && token)
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
