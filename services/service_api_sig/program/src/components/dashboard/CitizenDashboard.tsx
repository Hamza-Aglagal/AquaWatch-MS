'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  Droplets, 
  Bell, 
  Map,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Waves,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { InteractiveMap } from '@/components/map';
import { cn, formatRelativeTime, getQualityColor } from '@/lib/utils';

// Simplified quality card for citizens
function QualityCard({ zone, quality, recommendation }: { 
  zone: string; 
  quality: 'BONNE' | 'MOYENNE' | 'MAUVAISE';
  recommendation: string;
}) {
  const getQualityInfo = () => {
    switch (quality) {
      case 'BONNE':
        return {
          icon: ThumbsUp,
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-emerald-700',
          label: 'Bonne qualité',
          description: 'L\'eau est de bonne qualité et peut être consommée en toute sécurité.',
        };
      case 'MOYENNE':
        return {
          icon: Minus,
          color: 'bg-amber-500',
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-700',
          label: 'Qualité moyenne',
          description: 'L\'eau est acceptable mais une surveillance est en cours.',
        };
      case 'MAUVAISE':
        return {
          icon: ThumbsDown,
          color: 'bg-red-500',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
          label: 'Qualité dégradée',
          description: 'Des mesures sont en cours. Évitez la consommation directe.',
        };
    }
  };

  const info = getQualityInfo();
  const Icon = info.icon;

  return (
    <div className={cn('rounded-2xl border-2 p-6', info.bgColor)}>
      <div className="flex items-start gap-4">
        <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', info.color)}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{zone}</span>
          </div>
          <h3 className={cn('text-xl font-bold', info.textColor)}>{info.label}</h3>
          <p className="text-gray-600 mt-2 text-sm">{info.description}</p>
          {recommendation && (
            <div className="mt-3 p-3 bg-white/60 rounded-lg">
              <p className="text-sm">
                <strong>Recommandation:</strong> {recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Recent alerts for citizen's zone
function CitizenAlertCard({ message, date, severity }: {
  message: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}) {
  const severityColors = {
    low: 'border-l-blue-400 bg-blue-50',
    medium: 'border-l-amber-400 bg-amber-50',
    high: 'border-l-orange-500 bg-orange-50',
    critical: 'border-l-red-500 bg-red-50',
  };

  return (
    <div className={cn('border-l-4 p-4 rounded-r-lg', severityColors[severity])}>
      <p className="text-gray-800 font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-1">{formatRelativeTime(date)}</p>
    </div>
  );
}

export function CitizenDashboard() {
  const { user } = useAuth();
  const userZone = user?.zone || 'Rabat';

  // Mock data for citizen view
  const zoneQuality = {
    zone: userZone,
    quality: 'BONNE' as const,
    recommendation: 'L\'eau du robinet peut être consommée normalement.',
  };

  const recentAlerts = [
    {
      id: 1,
      message: 'Qualité de l\'eau excellente dans votre zone',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      severity: 'low' as const,
    },
  ];

  const weeklyHistory = [
    { day: 'Lun', quality: 'BONNE' },
    { day: 'Mar', quality: 'BONNE' },
    { day: 'Mer', quality: 'MOYENNE' },
    { day: 'Jeu', quality: 'BONNE' },
    { day: 'Ven', quality: 'BONNE' },
    { day: 'Sam', quality: 'BONNE' },
    { day: 'Dim', quality: 'BONNE' },
  ];

  const mockZones = [
    { zone_id: 1, nom: 'Casablanca', type: 'ville' as const, centre_lat: 33.5731, centre_lon: -7.5898, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 2, nom: 'Rabat', type: 'ville' as const, centre_lat: 34.0209, centre_lon: -6.8416, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
    { zone_id: 3, nom: 'Tanger', type: 'ville' as const, centre_lat: 35.7595, centre_lon: -5.834, qualite_actuelle: 'BONNE' as const, derniere_mise_a_jour: null, actif: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Waves className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {user?.name?.split(' ')[0] || 'Citoyen'} 👋</h1>
            <p className="text-sky-100">
              Voici les informations sur la qualité de l'eau dans votre zone.
            </p>
          </div>
        </div>
      </div>

      {/* Main Quality Status */}
      <QualityCard 
        zone={zoneQuality.zone}
        quality={zoneQuality.quality}
        recommendation={zoneQuality.recommendation}
      />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly History */}
        <Card className="border-l-4 border-sky-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-500" />
              Historique des 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end gap-2">
              {weeklyHistory.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium',
                    day.quality === 'BONNE' ? 'bg-emerald-500' :
                    day.quality === 'MOYENNE' ? 'bg-amber-500' : 'bg-red-500'
                  )}>
                    {day.quality === 'BONNE' ? '✓' : day.quality === 'MOYENNE' ? '~' : '!'}
                  </div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span>Bonne</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>Moyenne</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Dégradée</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-l-4 border-sky-400">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-500" />
              Alertes récentes
            </CardTitle>
            <Link href="/alerts" className="text-sm text-sky-600 hover:text-sky-700">
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p>Aucune alerte dans votre zone</p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <CitizenAlertCard
                  key={alert.id}
                  message={alert.message}
                  date={alert.date}
                  severity={alert.severity}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="h-[400px] border-l-4 border-sky-400">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-sky-500" />
            Carte de votre région
          </CardTitle>
          <Link href="/map" className="text-sm text-sky-600 hover:text-sky-700">
            Voir en grand →
          </Link>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] p-0">
          <InteractiveMap
            zones={mockZones}
            sensors={[]}
            className="rounded-b-xl"
          />
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-sky-50 border-sky-200 border-l-4 border-l-sky-400">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sky-900 mb-2">Conseils pour une eau saine</h3>
              <ul className="text-sm text-sky-800 space-y-1">
                <li>• Laissez couler l'eau quelques secondes avant de la consommer</li>
                <li>• Conservez l'eau dans des récipients propres et fermés</li>
                <li>• En cas de doute, faites bouillir l'eau pendant 1 minute</li>
                <li>• Signalez tout problème de goût ou d'odeur aux autorités</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Issue Button */}
      <Link 
        href="/reports"
        className="block w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-center font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
      >
        <AlertTriangle className="w-5 h-5 inline mr-2" />
        Signaler un problème avec l'eau
      </Link>
    </div>
  );
}
