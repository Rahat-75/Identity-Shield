/**
 * Authentication API
 */

import { apiClient } from './api-client';

export interface User {
  id: number;
  email: string;
  phone?: string;
  role: 'CITIZEN' | 'ORG_USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  password_confirm: string;
  role?: 'CITIZEN' | 'ORG_USER' | 'ADMIN';
}

export interface RegisterResponse {
  user: User;
  tokens?: AuthTokens;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  getCurrentUser: () =>
    apiClient.get<User>('/auth/me'),

  refreshToken: (data: RefreshRequest) =>
    apiClient.post<RefreshResponse>('/auth/refresh', data),

  logout: () =>
    apiClient.post('/auth/logout'),
};

// Auth utilities
export const setAuthTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

export const clearAuthTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
