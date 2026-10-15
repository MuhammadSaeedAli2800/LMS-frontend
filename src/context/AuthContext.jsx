import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authService from '../services/authService';
import { normalizeUser } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  const refreshUser = useCallback(async () => {
    const result = await authService.fetchCurrentUser();
    const nextUser = normalizeUser(result.data?.user);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await authService.fetchCurrentUser();
        if (active) setUser(normalizeUser(result.data?.user));
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const markMustChangePassword = useCallback(() => {
    setUser((current) => (current ? { ...current, mustChangePassword: true } : current));
  }, []);

  const login = useCallback(async (body) => {
    const result = await authService.login(body);
    const nextUser = normalizeUser(result.data?.user);
    setUser(nextUser);
    return nextUser;
  }, []);

  const adminLogin = useCallback(async (body) => {
    const result = await authService.adminLogin(body);
    const nextUser = normalizeUser(result.data?.user);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    setUser(null);
  }, []);

  const changePassword = useCallback(async (body) => {
    await authService.changePassword(body);
    try {
      const result = await authService.fetchCurrentUser();
      const nextUser = normalizeUser(result.data?.user);
      setUser(nextUser);
      return nextUser;
    } catch {
      const fallback = { ...(userRef.current || {}), mustChangePassword: false };
      setUser(fallback);
      return fallback;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      adminLogin,
      logout,
      changePassword,
      refreshUser,
      markMustChangePassword,
    }),
    [user, loading, login, adminLogin, logout, changePassword, refreshUser, markMustChangePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
