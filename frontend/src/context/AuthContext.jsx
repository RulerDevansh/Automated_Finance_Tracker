import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(localStorage.getItem('baseCurrency') || 'INR');

  useEffect(() => {
    if (!token) return;
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
        if (res.data?.base_currency) {
          setBaseCurrency(res.data.base_currency);
          localStorage.setItem('baseCurrency', res.data.base_currency);
        }
      } catch (err) {
        console.error(err);
        setToken(null);
        localStorage.removeItem('token');
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      if (res.data.user?.base_currency) {
        setBaseCurrency(res.data.user.base_currency);
        localStorage.setItem('baseCurrency', res.data.user.base_currency);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      if (res.data.user?.base_currency) {
        setBaseCurrency(res.data.user.base_currency);
        localStorage.setItem('baseCurrency', res.data.user.base_currency);
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async ({ idToken, baseCurrencyOverride }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { idToken, baseCurrency: baseCurrencyOverride || baseCurrency });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      if (res.data.user?.base_currency) {
        setBaseCurrency(res.data.user.base_currency);
        localStorage.setItem('baseCurrency', res.data.user.base_currency);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBaseCurrency = async (currency, { skipServer = false } = {}) => {
    const upper = currency.toUpperCase();
    setBaseCurrency(upper);
    localStorage.setItem('baseCurrency', upper);
    if (token && !skipServer) {
      try {
        const res = await api.patch('/users/me', { baseCurrency: upper });
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('baseCurrency');
  };

  const value = useMemo(
    () => ({ user, token, baseCurrency, updateBaseCurrency, login, register, googleLogin, logout, loading }),
    [user, token, baseCurrency, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
