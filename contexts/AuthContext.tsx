'use client';

/**
 * Authentication Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, getRefreshToken, setAuthTokens, clearAuthTokens } from '@/lib/api-client';
import { User, Teacher, LoginResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  teacher: Teacher | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  updateAuthState: (data: { user: User; teacher?: Teacher | null }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedTeacher = localStorage.getItem('teacher');
      const token = getAuthToken();
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (storedTeacher) {
            try {
              const parsedTeacher = JSON.parse(storedTeacher);
              setTeacher(parsedTeacher);
            } catch (error) {
              console.error('Error parsing stored teacher:', error);
              localStorage.removeItem('teacher');
            }
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          clearAuthTokens();
        }
      } else if (!token) {
        // No token, clear user
        setUser(null);
        setTeacher(null);
        localStorage.removeItem('teacher');
      }
      setLoading(false);
    }
  }, []);

  // Watch for token changes and update auth state accordingly
  // Only rely on event listeners - don't do periodic checks that might clear user during refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Listen to storage events (when tokens are cleared in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      // Only clear user if accessToken is actually removed (not just updated)
      if ((e.key === 'accessToken' || e.key === 'access_token') && !e.newValue && user) {
        console.log('[AuthContext] Token removed from storage, clearing user');
        setUser(null);
        setTeacher(null);
        localStorage.removeItem('teacher');
      }
    };

    // Listen for custom event when tokens are cleared programmatically
    const handleTokenCleared = () => {
      // Immediately clear user state when tokens are cleared
      // Don't check if user exists - just clear it to ensure isAuthenticated becomes false
      console.log('[AuthContext] Token cleared event received, clearing user');
      setUser(null);
      setTeacher(null);
      localStorage.removeItem('teacher');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-token-cleared', handleTokenCleared);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-token-cleared', handleTokenCleared);
    };
  }, [user]);

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    if (response.success && response.data) {
      const loginData = response.data as LoginResponse;
      setUser(loginData.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }
      if (loginData.teacher) {
        setTeacher(loginData.teacher);
        if (typeof window !== 'undefined') {
          localStorage.setItem('teacher', JSON.stringify(loginData.teacher));
        }
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('teacher');
      }
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTeacher(null);
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('teacher');
      }
    }
  };

  const updateAuthState = (data: { user: User; teacher?: Teacher | null }) => {
    setUser(data.user);
    setTeacher(data.teacher ?? null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.teacher) {
        localStorage.setItem('teacher', JSON.stringify(data.teacher));
      } else {
        localStorage.removeItem('teacher');
      }
    }
  };

  // Check authentication: user exists AND token exists
  // Use a more reliable check that doesn't depend on async state updates
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const isAuthenticated = !!(user && token);
  const isAdmin = user?.role === 'admin' || user?.role === 'subAdmin';
  const isTeacher = user?.role === 'teacher';

  return (
    <AuthContext.Provider
      value={{
        user,
        teacher,
        loading,
        login,
        logout,
        updateAuthState,
        isAuthenticated,
        isAdmin,
        isTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

