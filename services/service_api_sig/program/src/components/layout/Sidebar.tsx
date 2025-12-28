'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getTheme, getRoleDisplayName, getRoleIcon } from '@/lib/theme';
import { useAuth } from '@/components/auth/AuthContext';
import { ROLE_LABELS } from '@/types/auth';
import {
  LayoutDashboard,
  Map,
  Thermometer,
  Satellite,
  Bell,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Menu,
  X,
  LogOut,
  User,
  Users,
  FileText,
  Shield,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui';

// Navigation items with role-based visibility
const getNavigation = (role: string | undefined) => {
  const allItems = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, roles: ['admin', 'autorite', 'citoyen'] },
    { name: 'Carte interactive', href: '/map', icon: Map, roles: ['admin', 'autorite', 'citoyen'] },
    { name: 'Capteurs', href: '/sensors', icon: Thermometer, roles: ['admin', 'autorite'] },
    { name: 'Satellite', href: '/satellite', icon: Satellite, roles: ['admin', 'autorite'] },
    { name: 'Prédictions ML', href: '/predictions', icon: Brain, roles: ['admin', 'autorite'] },
    { name: 'Alertes', href: '/alerts', icon: Bell, roles: ['admin', 'autorite', 'citoyen'] },
    { name: 'Signalements', href: '/reports', icon: FileText, roles: ['citoyen'] },
    { name: 'Utilisateurs', href: '/users', icon: Users, roles: ['admin'] },
    { name: 'Paramètres', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  if (!role) return allItems.filter(item => item.roles.includes('citoyen'));
  return allItems.filter(item => item.roles.includes(role));
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navigation = getNavigation(user?.role);
  const theme = getTheme(user?.role);

  // Determine text colors based on role (citoyen has light sidebar)
  const isCitoyen = user?.role === 'citoyen';
  const textColor = isCitoyen ? 'text-gray-700' : 'text-gray-300';
  const textColorMuted = isCitoyen ? 'text-gray-500' : 'text-gray-400';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen',
          theme.sidebarBg,
          'border-r',
          theme.sidebarBorder,
          'flex flex-col transition-all duration-300 shadow-xl',
          isCollapsed ? 'w-20' : 'w-64',
          isMobile ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center justify-between h-16 px-4 border-b",
          theme.sidebarBorder
        )}>
          <Link href="/" className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
              theme.logoBg
            )}>
              <Waves className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={cn("text-lg font-bold", isCitoyen ? 'text-gray-900' : 'text-white')}>
                  AquaWatch
                </span>
                <span className={textColorMuted}>
                  {getRoleIcon(user?.role)} {getRoleDisplayName(user?.role)}
                </span>
              </div>
            )}
          </Link>
          
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose} className={textColor}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  theme.sidebarHover,
                  isActive && theme.sidebarActive,
                  isActive ? theme.sidebarActiveText : textColor,
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? theme.iconPrimary : ''
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role badge */}
        {!isCollapsed && user?.role && (
          <div className={cn("mx-4 mb-4 p-3 rounded-lg", theme.cardAccentLight)}>
            <div className="flex items-center gap-2">
              <Shield className={cn("w-5 h-5", theme.iconPrimary)} />
              <div>
                <p className={cn("text-sm font-medium", isCitoyen ? 'text-gray-900' : theme.badgeText)}>
                  {getRoleDisplayName(user.role)}
                </p>
                <p className={cn("text-xs", textColorMuted)}>
                  {user.zone || 'Maroc'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={cn("p-4 border-t", theme.sidebarBorder)}>
          <Button
            variant="ghost"
            className={cn('w-full', textColor, isCollapsed && 'px-0 justify-center')}
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-2">Réduire</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = React.useState(false);
  const theme = getTheme(user?.role);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getUserInitial = () => {
    if (!user?.name) return '?';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200",
      user?.role && theme.headerAccent
    )}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-6 h-6" />
        </Button>

        {/* Page title - dynamic */}
        <div className="flex-1 lg:ml-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRoleIcon(user?.role)}</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Bienvenue, {user?.name?.split(' ')[0] || 'Utilisateur'}
              </h1>
              <p className="text-xs text-gray-500">
                {getRoleDisplayName(user?.role)} • {user?.zone || 'Maroc'}
              </p>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" className="relative">
                <Bell className="w-5 h-5" />
                <span className={cn(
                  "absolute top-1 right-1 w-2 h-2 rounded-full",
                  user?.role === 'admin' ? 'bg-purple-500' :
                  user?.role === 'autorite' ? 'bg-teal-500' : 'bg-sky-500'
                )} />
              </Button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shadow-lg",
                    theme.gradient
                  )}>
                    {getUserInitial()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className={cn("text-xs font-medium", theme.badgeText)}>
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden">
                    <div className={cn("px-4 py-3 border-b border-gray-100", theme.cardAccentLight)}>
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className={cn("w-4 h-4", theme.iconPrimary)} />
                      Mon profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                "px-5 py-2.5 text-white rounded-lg transition-all text-sm font-medium shadow-lg",
                theme.buttonPrimary,
                theme.buttonPrimaryHover
              )}
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
