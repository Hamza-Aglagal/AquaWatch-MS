'use client';

import React, { useState } from 'react';
import { Satellite, Layers, Calendar, MapPin, RefreshCw, Download, Image, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingState, EmptyState } from '@/components/ui';
import { useLatestSatelliteIndices } from '@/hooks/useApi';
import { cn, formatRelativeTime, formatDate, formatNumber } from '@/lib/utils';
import { SatelliteIndex } from '@/types';

// Index indicator component
function IndexIndicator({ label, value, unit, description, status }: {
  label: string;
  value: number;
  unit: string;
  description: string;
  status: 'good' | 'warning' | 'danger' | 'neutral';
}) {
  const statusColors = {
    good: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    danger: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    neutral: 'border-gray-300 bg-gray-50 dark:bg-gray-800',
  };

  const textColors = {
    good: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className={cn('p-4 rounded-lg border-l-4', statusColors[status])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
          <p className={cn('text-2xl font-bold mt-1', textColors[status])}>
            {formatNumber(value, 3)}
            <span className="text-sm font-normal ml-1">{unit}</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );
}

// Satellite data card
function SatelliteDataCard({ data, onClick }: { data: SatelliteIndex; onClick: () => void }) {
  const getNdwiStatus = (ndwi: number) => {
    if (ndwi > 0.3) return 'good';
    if (ndwi > 0) return 'warning';
    return 'danger';
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Données satellite</span>
          </div>
          <Badge variant="info" size="sm">Sentinel-2</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-800">
            <p className="text-lg font-bold text-blue-600">{formatNumber(data.ndwi, 2)}</p>
            <p className="text-xs text-gray-500">NDWI</p>
          </div>
          <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-800">
            <p className="text-lg font-bold text-emerald-600">{formatNumber(data.chlorophyll, 1)}</p>
            <p className="text-xs text-gray-500">Chloro</p>
          </div>
          <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-800">
            <p className="text-lg font-bold text-amber-600">{formatNumber(data.turbidity, 1)}</p>
            <p className="text-xs text-gray-500">Turb.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {data.latitude.toFixed(2)}, {data.longitude.toFixed(2)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatRelativeTime(data.timestamp)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Detail panel
function SatelliteDetail({ data, onClose }: { data: SatelliteIndex; onClose: () => void }) {
  const getNdwiStatus = (ndwi: number) => {
    if (ndwi > 0.3) return 'good';
    if (ndwi > 0) return 'warning';
    return 'danger';
  };

  const getChlorophyllStatus = (chloro: number) => {
    if (chloro < 10) return 'good';
    if (chloro < 25) return 'warning';
    return 'danger';
  };

  const getTurbidityStatus = (turb: number) => {
    if (turb < 4) return 'good';
    if (turb < 10) return 'warning';
    return 'danger';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-blue-600" />
          Analyse détaillée
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Position:</span>
            <span>{data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Indices */}
        <div className="space-y-3">
          <IndexIndicator
            label="NDWI (Normalized Difference Water Index)"
            value={data.ndwi}
            unit=""
            description="Indice de détection de l'eau. Valeur > 0.3 = eau claire"
            status={getNdwiStatus(data.ndwi)}
          />
          <IndexIndicator
            label="Chlorophylle-a"
            value={data.chlorophyll}
            unit="mg/m³"
            description="Concentration d'algues. Valeur < 10 = eau propre"
            status={getChlorophyllStatus(data.chlorophyll)}
          />
          <IndexIndicator
            label="Turbidité"
            value={data.turbidity}
            unit="NTU"
            description="Clarté de l'eau. Valeur < 4 NTU recommandée (OMS)"
            status={getTurbidityStatus(data.turbidity)}
          />
        </div>

        {/* Metadata */}
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Métadonnées</p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Image ID</span>
              <span className="font-mono text-xs">{data.image_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date acquisition</span>
              <span>{formatDate(data.timestamp)}</span>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Télécharger les données
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SatellitePage() {
  const { data: indices, isLoading, refetch } = useLatestSatelliteIndices(20, 168); // Last week
  const [selectedData, setSelectedData] = useState<SatelliteIndex | null>(null);
  const [timeFilter, setTimeFilter] = useState<number>(24);

  // Mock data
  const mockIndices: SatelliteIndex[] = [
    {
      id: 'SAT-001',
      latitude: 33.5731,
      longitude: -7.5898,
      ndwi: 0.45,
      chlorophyll: 8.2,
      turbidity: 3.5,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      image_id: 'S2A_MSIL2A_20241226_R056',
    },
    {
      id: 'SAT-002',
      latitude: 34.0209,
      longitude: -6.8416,
      ndwi: 0.38,
      chlorophyll: 12.5,
      turbidity: 5.8,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      image_id: 'S2A_MSIL2A_20241226_R057',
    },
    {
      id: 'SAT-003',
      latitude: 30.4278,
      longitude: -9.5981,
      ndwi: 0.22,
      chlorophyll: 28.0,
      turbidity: 12.5,
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      image_id: 'S2A_MSIL2A_20241226_R058',
    },
    {
      id: 'SAT-004',
      latitude: 35.7595,
      longitude: -5.834,
      ndwi: 0.52,
      chlorophyll: 5.5,
      turbidity: 2.1,
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      image_id: 'S2A_MSIL2A_20241226_R059',
    },
    {
      id: 'SAT-005',
      latitude: 31.5085,
      longitude: -9.7595,
      ndwi: 0.41,
      chlorophyll: 9.8,
      turbidity: 4.2,
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      image_id: 'S2A_MSIL2A_20241225_R060',
    },
  ];

  const displayIndices = indices || mockIndices;

  // Filter by time
  const filteredIndices = displayIndices.filter(d => {
    const hours = (Date.now() - new Date(d.timestamp).getTime()) / 3600000;
    return hours <= timeFilter;
  });

  // Stats
  const avgNdwi = displayIndices.reduce((acc, d) => acc + d.ndwi, 0) / displayIndices.length;
  const avgChlorophyll = displayIndices.reduce((acc, d) => acc + d.chlorophyll, 0) / displayIndices.length;
  const avgTurbidity = displayIndices.reduce((acc, d) => acc + d.turbidity, 0) / displayIndices.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Données Satellite</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyse d'images Sentinel-2 pour la qualité de l'eau
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Satellite className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Images traitées</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayIndices.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
              <Layers className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">NDWI moyen</p>
              <p className="text-2xl font-bold text-cyan-600">{formatNumber(avgNdwi, 2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Image className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chlorophylle</p>
              <p className="text-2xl font-bold text-emerald-600">{formatNumber(avgChlorophyll, 1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Eye className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Turbidité moy.</p>
              <p className="text-2xl font-bold text-amber-600">{formatNumber(avgTurbidity, 1)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Période:</span>
            {[24, 48, 72, 168].map((hours) => (
              <button
                key={hours}
                onClick={() => setTimeFilter(hours)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  timeFilter === hours
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {hours === 168 ? '7 jours' : `${hours}h`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Grid */}
        <div className={cn(selectedData ? 'lg:col-span-2' : 'lg:col-span-3')}>
          {filteredIndices.length === 0 ? (
            <Card className="py-12">
              <EmptyState
                icon={<Satellite className="w-12 h-12" />}
                title="Aucune donnée"
                description="Aucune donnée satellite disponible pour cette période"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIndices.map((data) => (
                <SatelliteDataCard
                  key={data.id}
                  data={data}
                  onClick={() => setSelectedData(data)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedData && (
          <div className="lg:col-span-1">
            <SatelliteDetail 
              data={selectedData} 
              onClose={() => setSelectedData(null)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
