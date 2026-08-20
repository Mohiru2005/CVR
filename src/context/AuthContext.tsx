'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  token?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  login: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore user in useEffect on client mount so SSR and initial client frame match identically
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cvr_auth_user');
      const token = localStorage.getItem('cvr_auth_token');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (token) parsed.token = token;
        setUser(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Invalid credentials.';
        setAuthError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      const authUser: User = {
        ...data.user,
        token: data.token,
      };

      setUser(authUser);
      localStorage.setItem('cvr_auth_user', JSON.stringify(authUser));
      if (data.token) {
        localStorage.setItem('cvr_auth_token', data.token);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error(err);
      const errorMsg = 'Network error. Please ensure server is running.';
      setAuthError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const signup = async (data: { name: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        const errorMsg = resData.error || 'Failed to create account.';
        setAuthError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      const authUser: User = {
        ...resData.user,
        token: resData.token,
      };

      setUser(authUser);
      localStorage.setItem('cvr_auth_user', JSON.stringify(authUser));
      if (resData.token) {
        localStorage.setItem('cvr_auth_token', resData.token);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error(err);
      const errorMsg = 'Network error. Please try again.';
      setAuthError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cvr_auth_user');
    localStorage.removeItem('cvr_auth_token');
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, login, signup, logout, clearError }}>
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
