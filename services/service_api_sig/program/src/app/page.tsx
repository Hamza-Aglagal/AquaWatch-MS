'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  Droplets, 
  Thermometer, 
  Satellite, 
  Bell, 
  Brain, 
  Map,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Info,
  ShieldCheck,
  Waves
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, StatsCard, Badge, LoadingState, ErrorState } from '@/components/ui';
import { InteractiveMap } from '@/components/map';
import { useDashboardStats, useSensors, useActiveAlerts, useZones, useServicesHealth } from '@/hooks/useApi';
import { cn, formatRelativeTime, getQualityColor, getSeverityColor } from '@/lib/utils';

// Quality indicator component
function QualityIndicator({ quality, size = 'md' }: { quality: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colors: Record<string, string> = {
    BONNE: 'bg-emerald-500',
    MOYENNE: 'bg-amber-500',
    MAUVAISE: 'bg-red-500',
    INCONNU: 'bg-gray-400',
  };

  return (
    <div className={cn('rounded-full', sizes[size], colors[quality] || colors.INCONNU)} />
  );
}

// Service status component
function ServiceStatus({ name, status }: { name: string; status: 'healthy' | 'unhealthy' | 'degraded' }) {
  const statusColors = {
    healthy: 'text-emerald-500',
    degraded: 'text-amber-500',
    unhealthy: 'text-red-500',
  };

  const StatusIcon = status === 'healthy' ? CheckCircle : status === 'degraded' ? AlertTriangle : AlertTriangle;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
      <div className="flex items-center gap-2">
        <StatusIcon className={cn('w-4 h-4', statusColors[status])} />
        <span className={cn('text-sm font-medium', statusColors[status])}>
          {status === 'healthy' ? 'En ligne' : status === 'degraded' ? 'Dégradé' : 'Hors ligne'}
        </span>
      </div>
    </div>
  );
}

// Admin/Authority Dashboard Component
function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: sensors, isLoading: sensorsLoading } = useSensors();
  const { data: alerts, isLoading: alertsLoading } = useActiveAlerts();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: health, isLoading: healthLoading } = useServicesHealth();

  const isLoading = statsLoading || sensorsLoading || alertsLoading || zonesLoading;
  const cardVariant = user?.role === 'admin' ? 'admin' : 'autorite';

  // Mock data for demo when API is not available
  const mockStats = {
    totalSensors: 5,
    activeSensors: 3,
    totalZones: 10,
    activeAlerts: 2,
    criticalAlerts: 1,
    averageQuality: 7.2,
    lastUpdate: new Date().toISOString(),
  };

  const mockAlerts = [
    {
      id: 1,
      alert_id: 'ALT-001',
      severity: 'high' as const,
      zone_latitude: 33.5731,
      zone_longitude: -7.5898,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      status: 'pending' as const,
      alert_data: { message: 'Qualité eau dégradée - Casablanca' },
    },
    {
      id: 2,
      alert_id: 'ALT-002',
      severity: 'critical' as const,
      zone_latitude: 34.0209,
      zone_longitude: -6.8416,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending' as const,
      alert_data: { message: 'pH critique détecté - Rabat' },
    },
  ];

  const mockZones = [
    { zone_id: 1, nom: 'Casablanca', type: 'ville' as const, centre_lat: 33.5731, centre_lon: -7.5898, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 2, nom: 'Rabat', type: 'ville' as const, centre_lat: 34.0209, centre_lon: -6.8416, qualite_actuelle: 'MOYENNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 3, nom: 'Tanger', type: 'ville' as const, centre_lat: 35.7595, centre_lon: -5.834, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 4, nom: 'Agadir', type: 'ville' as const, centre_lat: 30.4278, centre_lon: -9.5981, qualite_actuelle: 'MAUVAISE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 5, nom: 'Essaouira', type: 'ville' as const, centre_lat: 31.5085, centre_lon: -9.7595, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 6, nom: 'El Jadida', type: 'ville' as const, centre_lat: 33.2316, centre_lon: -8.5007, qualite_actuelle: 'MOYENNE' as const, derniere_mise_a_jour: null, actif: true },
  ];

  const mockSensors = [
    { id: 1, capteur_id: 'CAP001', nom: 'Capteur Rabat Centre', latitude: 34.020882, longitude: -6.841650, type_capteur: 'multiparameter', status: 'active' as const, created_at: '', updated_at: '' },
    { id: 2, capteur_id: 'CAP002', nom: 'Capteur Casablanca Port', latitude: 33.606892, longitude: -7.639133, type_capteur: 'multiparameter', status: 'active' as const, created_at: '', updated_at: '' },
    { id: 3, capteur_id: 'CAP003', nom: 'Capteur Fès Ville', latitude: 34.037732, longitude: -4.999448, type_capteur: 'multiparameter', status: 'maintenance' as const, created_at: '', updated_at: '' },
  ];

  const displayStats = stats || mockStats;
  const displayAlerts = alerts || mockAlerts;
  const displayZones = zones || mockZones;
  const displaySensors = sensors || mockSensors;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de la qualité de l'eau au Maroc
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Dernière mise à jour: {formatRelativeTime(displayStats.lastUpdate)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Capteurs actifs"
          value={`${displayStats.activeSensors}/${displayStats.totalSensors}`}
          subtitle="En fonctionnement"
          icon={<Thermometer className="w-6 h-6" />}
          trend={{ value: 5, isPositive: true }}
          variant={cardVariant}
        />
        <StatsCard
          title="Zones surveillées"
          value={displayStats.totalZones}
          subtitle="Villes côtières"
          icon={<Map className="w-6 h-6" />}
          variant={cardVariant}
        />
        <StatsCard
          title="Alertes actives"
          value={displayStats.activeAlerts}
          subtitle={`${displayStats.criticalAlerts} critiques`}
          icon={<Bell className="w-6 h-6" />}
          trend={{ value: displayStats.criticalAlerts > 0 ? 12 : 0, isPositive: false }}
          variant={cardVariant}
        />
        <StatsCard
          title="Score qualité moyen"
          value={displayStats.averageQuality.toFixed(1)}
          subtitle="Sur 10"
          icon={<Droplets className="w-6 h-6" />}
          trend={{ value: 3, isPositive: true }}
          variant={cardVariant}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - Takes 2 columns */}
        <Card className="lg:col-span-2 h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              Carte interactive
            </CardTitle>
            <Link 
              href="/map" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir en plein écran →
            </Link>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)] p-0">
            <InteractiveMap 
              sensors={displaySensors}
              zones={displayZones}
              className="rounded-b-xl"
            />
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Active Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                Alertes récentes
              </CardTitle>
              <Link 
                href="/alerts" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune alerte active
                </p>
              ) : (
                displayAlerts.slice(0, 4).map((alert) => (
                  <div 
                    key={alert.alert_id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className={cn(
                      'w-2 h-2 mt-2 rounded-full flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-red-500' : 
                      alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {(alert.alert_data as { message?: string })?.message || 'Alerte détectée'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatRelativeTime(alert.created_at)}
                      </p>
                    </div>
                    <Badge 
                      variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                État des services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <ServiceStatus name="Capteurs IoT" status={health?.capteurs?.status || 'unhealthy'} />
              <ServiceStatus name="Satellite" status={health?.satellite?.status || 'unhealthy'} />
              <ServiceStatus name="ML Model" status={health?.stmodel?.status || 'unhealthy'} />
              <ServiceStatus name="Alertes" status={health?.alertes?.status || 'unhealthy'} />
              <ServiceStatus name="Géo/Carte" status={health?.geo?.status || 'unhealthy'} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zones Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-500" />
            Qualité par zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayZones.map((zone) => (
              <div 
                key={zone.zone_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <QualityIndicator quality={zone.qualite_actuelle} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {zone.nom}
                  </p>
                  <p className={cn('text-xs font-medium', getQualityColor(zone.qualite_actuelle))}>
                    {zone.qualite_actuelle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Page - switches based on user role
import { CitizenDashboard } from '@/components/dashboard';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show citizen dashboard for citizens, full dashboard for admin/authority
  if (user?.role === 'citoyen') {
    return <CitizenDashboard />;
  }

  return <AdminDashboard />;
}
