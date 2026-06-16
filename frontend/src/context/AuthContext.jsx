import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiCall, registerAuthFailureHandler } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('user');
    } catch {
      return true;
    }
  });
  const fetchControllerRef = useRef(null);

  const clearAllAuthData = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
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
        const userData = data?.user || null;
        setUser(userData);
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          localStorage.removeItem('user');
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setUser(null);
        localStorage.removeItem('user');
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
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
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
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
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
