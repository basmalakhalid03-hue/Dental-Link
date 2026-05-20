import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Profile page dispatches 'user-updated' after saving so the sidebar/context refreshes
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    };
    window.addEventListener('user-updated', sync);
    return () => window.removeEventListener('user-updated', sync);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const role           = user?.role ?? null;
  const isAdmin        = role === 'ADMIN';
  const isTechnician   = role === 'TECHNICIAN';
  const isDeliveryAgent = role === 'DELIVERY_AGENT';
  const isDoctor       = role === 'DOCTOR';

  // Coarse capability flags used across the UI
  const canDo = {
    createCase:   isAdmin || isTechnician || isDoctor,
    deleteCase:   isAdmin || isDoctor,
    manageUsers:  isAdmin,
    viewDelivery: isAdmin || isDeliveryAgent,
    updateDelivery: isDeliveryAgent,
    completeSteps:  isAdmin || isTechnician,
    editCase:     isAdmin || isDoctor,
  };

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, loading,
      role, isAdmin, isTechnician, isDeliveryAgent, isDoctor, canDo,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
