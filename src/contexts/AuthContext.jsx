import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '@api/auth.api.js';
import { getApiError } from '@api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fitcore_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('fitcore_token'));

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('fitcore_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await authApi.getMe();
      const mapped = {
        id: me.id,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        role: me.role,
        trainerId: me.trainer?.id ?? null,
        memberId: me.member?.id ?? null,
      };
      setUser(mapped);
      localStorage.setItem('fitcore_user', JSON.stringify(mapped));
      return mapped;
    } catch {
      localStorage.removeItem('fitcore_token');
      localStorage.removeItem('fitcore_user');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('fitcore_token')) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    localStorage.setItem('fitcore_token', result.token);
    localStorage.setItem('fitcore_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fitcore_token');
    localStorage.removeItem('fitcore_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, getApiError }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
