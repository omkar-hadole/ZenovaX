import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiCall, registerAuthFailureHandler } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchControllerRef = useRef(null);

  const clearAllAuthData = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const fetchUser = useCallback(async (signal) => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = signal || new AbortController();
    fetchControllerRef.current = controller;

    try {
      const data = await apiCall('/profile/me', { signal: controller.signal });
      if (!controller.signal.aborted) {
        setUser(data?.user || null);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setUser(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [fetchUser]);

  useEffect(() => {
    registerAuthFailureHandler(() => {
      clearAllAuthData();
    });
  }, [clearAllAuthData]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with local cleanup even if server call fails
    }
    clearAllAuthData();
  };

  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const refetchUser = useCallback(() => {
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUser,
      refetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
