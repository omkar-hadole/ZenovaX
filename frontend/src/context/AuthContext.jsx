import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiCall('/auth/me');
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = (userData) => setUser(userData);
  
  const logout = async () => {
    try { await apiCall('/auth/logout', { method: 'POST' }); } catch {}
    setUser(null);
    localStorage.removeItem('user'); // cleanup legacy
  };

  const updateUser = (updates) => setUser(prev => prev ? { ...prev, ...updates } : null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
