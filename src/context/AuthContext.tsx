import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authModalOpen: boolean;
  openAuthModal: (initialMode?: 'login' | 'register-student' | 'register-teacher' | 'forgot-password') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register-student' | 'register-teacher' | 'forgot-password';
  setAuthModalMode: (mode: 'login' | 'register-student' | 'register-teacher' | 'forgot-password') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register-student' | 'register-teacher' | 'forgot-password'>('login');

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Failed to restore session token:', err);
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const openAuthModal = (initialMode: 'login' | 'register-student' | 'register-teacher' | 'forgot-password' = 'login') => {
    setAuthModalMode(initialMode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
