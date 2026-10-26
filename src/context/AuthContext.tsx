'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { fullName: string; phone: string; email?: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { fullName?: string; email?: string }) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  changePassword: (data: { oldPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncClientCookie = (token: string) => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = `azota_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax;`;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('azota_token', token);
      }
    } catch (e) {
      console.warn('Cookie sync warning:', e);
    }
  };

  const clearClientCookie = () => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'azota_token=; path=/; max-age=0; SameSite=Lax;';
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('azota_token');
      }
    } catch (e) {
      console.warn('Cookie clear warning:', e);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) {
          syncClientCookie(data.token);
        }
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Đăng nhập thất bại' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng khi đăng nhập' };
    }
  };

  const register = async (input: { fullName: string; phone: string; email?: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) {
          syncClientCookie(data.token);
        }
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Đăng ký thất bại' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng khi đăng ký' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearClientCookie();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const updateProfile = async (data: { fullName?: string; email?: string }) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Cập nhật hồ sơ thất bại' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng khi cập nhật' };
    }
  };

  const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Đổi mật khẩu thất bại' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng khi đổi mật khẩu' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, changePassword }}>
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
