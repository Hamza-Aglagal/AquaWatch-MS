'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterData, ROLE_PERMISSIONS, RolePermissions } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  permissions: RolePermissions;
}

const defaultPermissions: RolePermissions = {
  canViewDashboard: false,
  canViewFullDashboard: false,
  canManageSensors: false,
  canViewAlerts: false,
  canCreateAlerts: false,
  canViewPredictions: false,
  canViewSatellite: false,
  canManageUsers: false,
  canAccessSettings: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }

      return { success: false, message: data.message || 'Erreur de connexion' };
    } catch {
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }

      return { success: false, message: result.message || 'Erreur d\'inscription' };
    } catch {
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const permissions = state.user 
    ? ROLE_PERMISSIONS[state.user.role] 
    : defaultPermissions;

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, permissions }}>
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

// Hook for checking specific permission
export function usePermission(permission: keyof RolePermissions): boolean {
  const { permissions } = useAuth();
  return permissions[permission];
}

// Hook for checking if user has any of the specified roles
export function useHasRole(roles: Array<'admin' | 'autorite' | 'citoyen'>): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.includes(user.role);
}
