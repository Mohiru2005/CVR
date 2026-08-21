'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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
  signup: (data: { name: string; password: string }) => Promise<{ success: boolean; pending?: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 1 Hour Inactivity Timeout in milliseconds (60 minutes * 60 seconds * 1000 ms)
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'cvr_last_activity_timestamp';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cvr_auth_user');
    localStorage.removeItem('cvr_auth_token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  // Update activity timestamp and reset foreground inactivity timer
  const recordActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log('Session expired due to 1 hour of inactivity.');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Restore user on client mount and check if 1-hour inactivity expired while app was closed
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cvr_auth_user');
      const token = localStorage.getItem('cvr_auth_token');
      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);

      if (savedUser) {
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
        const now = Date.now();

        // If inactive for more than 1 hour while away, log out immediately
        if (lastActivity && now - lastActivity > INACTIVITY_TIMEOUT_MS) {
          console.log('User was inactive for > 1 hour. Logging out.');
          logout();
        } else {
          const parsed = JSON.parse(savedUser);
          if (token) parsed.token = token;
          setUser(parsed);
          recordActivity();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [logout, recordActivity]);

  // Attach global activity event listeners when a user is logged in
  useEffect(() => {
    if (!user) return;

    recordActivity();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleUserActivity = () => {
      // Throttle activity recording to once every 10 seconds to save battery on mobile
      const lastTime = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      if (Date.now() - lastTime > 10000) {
        recordActivity();
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
        if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
          logout();
        } else {
          recordActivity();
        }
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, recordActivity, logout]);

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
      recordActivity();

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

  const signup = async (data: { name: string; password: string }): Promise<{ success: boolean; pending?: boolean; error?: string }> => {
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

      // Registration pending — no token issued, user must wait for Admin approval
      if (resData.pending) {
        setIsLoading(false);
        return { success: true, pending: true };
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
