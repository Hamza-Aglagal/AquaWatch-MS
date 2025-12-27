// User roles
export type UserRole = 'admin' | 'autorite' | 'citoyen';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  zone?: string; // Zone géographique pour les citoyens
  createdAt: string;
  lastLogin?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register data
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  zone?: string;
}

// Auth response
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Role permissions
export interface RolePermissions {
  canViewDashboard: boolean;
  canViewFullDashboard: boolean;
  canManageSensors: boolean;
  canViewAlerts: boolean;
  canCreateAlerts: boolean;
  canViewPredictions: boolean;
  canViewSatellite: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
}

// Permission map by role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewDashboard: true,
    canViewFullDashboard: true,
    canManageSensors: true,
    canViewAlerts: true,
    canCreateAlerts: true,
    canViewPredictions: true,
    canViewSatellite: true,
    canManageUsers: true,
    canAccessSettings: true,
  },
  autorite: {
    canViewDashboard: true,
    canViewFullDashboard: true,
    canManageSensors: true,
    canViewAlerts: true,
    canCreateAlerts: true,
    canViewPredictions: true,
    canViewSatellite: true,
    canManageUsers: false,
    canAccessSettings: false,
  },
  citoyen: {
    canViewDashboard: true,
    canViewFullDashboard: false,
    canManageSensors: false,
    canViewAlerts: true,
    canCreateAlerts: false,
    canViewPredictions: false,
    canViewSatellite: false,
    canManageUsers: false,
    canAccessSettings: false,
  },
};

// Role labels in French
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  autorite: 'Autorité',
  citoyen: 'Citoyen',
};
