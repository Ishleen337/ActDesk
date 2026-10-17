import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, setRefreshToken, removeTokens, getAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('actdesk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token && !user) {
      api.getMe()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('actdesk_user', JSON.stringify(userData));
        })
        .catch(() => {
          removeTokens();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setAuthToken(res.access_token);
    setRefreshToken(res.refresh_token);
    const userData = {
      username: res.username,
      role: res.role,
      full_name: res.full_name
    };
    setUser(userData);
    localStorage.setItem('actdesk_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    removeTokens();
    setUser(null);
  };

  const isAdmin = user?.role === 'store_admin';
  const isAgent = user?.role === 'support_agent' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isAgent, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
