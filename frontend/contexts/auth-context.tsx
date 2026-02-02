'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi, setAuthTokens, clearAuthTokens, isAuthenticated } from '@/lib/auth-api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; password_confirm: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const loadUser = async () => {
      if (isAuthenticated()) {
        const { data, error } = await authApi.getCurrentUser();
        if (data) {
          setUser(data);
        } else if (error) {
          clearAuthTokens();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await authApi.login({ email, password });
    
    if (data) {
      setAuthTokens(data.tokens);
      setUser(data.user);
      return { success: true };
    }

    if (error && 'message' in error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Login failed' };
  };

  const register = async (registerData: { email: string; password: string; password_confirm: string; phone?: string }) => {
    const { data, error } = await authApi.register({
      ...registerData,
      role: 'CITIZEN',
    });

    if (data) {
      // For email verification flow, we might not get tokens immediately
      if (data.tokens) {
        setAuthTokens(data.tokens);
        setUser(data.user);
      }
      return { success: true };
    }

    if (error && 'message' in error) {
      return { success: false, error: error.message };
    }

    // Handle validation errors
    if (error && typeof error === 'object') {
      const firstError = Object.values(error)[0];
      if (Array.isArray(firstError)) {
        return { success: false, error: firstError[0] };
      }
    }

    return { success: false, error: 'Registration failed' };
  };

  const logout = () => {
    authApi.logout();
    clearAuthTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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
