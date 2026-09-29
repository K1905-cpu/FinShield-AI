import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/shared';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('finshield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('finshield_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('finshield_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.getMe();
        setUser(data.user);
        localStorage.setItem('finshield_user', JSON.stringify(data.user));
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('finshield_token', res.token);
      localStorage.setItem('finshield_user', JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.auth.register({ name, email, password, confirmPassword });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('finshield_token', res.token);
      localStorage.setItem('finshield_user', JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('finshield_token');
    localStorage.removeItem('finshield_user');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
