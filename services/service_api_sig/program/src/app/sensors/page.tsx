'use client';

import React, { useState } from 'react';
import { Thermometer, Activity, Droplets, Clock, MapPin, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingState, EmptyState } from '@/components/ui';
import { useSensors, useLatestMeasurements } from '@/hooks/useApi';
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils';
import { Sensor, SensorMeasurement } from '@/types';

// Measurement card component
function MeasurementCard({ label, value, unit, status, icon: Icon }: {
  label: string;
  value: number | null;
  unit: string;
  status: 'good' | 'warning' | 'danger' | 'neutral';
  icon: React.ElementType;
}) {
  const statusColors = {
    good: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    danger: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    neutral: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
  };

  return (
    <div className={cn('p-4 rounded-lg', statusColors[status])}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {value !== null ? formatNumber(value, 2) : '--'}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}

// Sensor detail panel
function SensorDetail({ sensor, measurements }: { sensor: Sensor; measurements: SensorMeasurement[] }) {
  const latestMeasurement = measurements.find(m => m.capteur_id === sensor.capteur_id);

  const getPhStatus = (ph: number | null) => {
    if (ph === null) return 'neutral';
    if (ph >= 6.5 && ph <= 8.5) return 'good';
    if (ph >= 6 && ph <= 9) return 'warning';
    return 'danger';
  };

  const getTurbidityStatus = (turbidity: number | null) => {
    if (turbidity === null) return 'neutral';
    if (turbidity < 4) return 'good';
    if (turbidity < 10) return 'warning';
    return 'danger';
  };

  const getTempStatus = (temp: number | null) => {
    if (temp === null) return 'neutral';
    if (temp >= 15 && temp <= 25) return 'good';
    if (temp >= 10 && temp <= 30) return 'warning';
    return 'danger';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-blue-600" />
            {sensor.nom}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">{sensor.capteur_id}</p>
        </div>
        <Badge variant={sensor.status === 'active' ? 'success' : sensor.status === 'maintenance' ? 'warning' : 'default'}>
          {sensor.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>
            {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
          </span>
        </div>

        {/* Measurements Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MeasurementCard
            label="pH"
            value={latestMeasurement?.ph ?? null}
            unit=""
            status={getPhStatus(latestMeasurement?.ph ?? null)}
            icon={Droplets}
          />
          <MeasurementCard
            label="Température"
            value={latestMeasurement?.temperature ?? null}
            unit="°C"
            status={getTempStatus(latestMeasurement?.temperature ?? null)}
            icon={Thermometer}
          />
          <MeasurementCard
            label="Turbidité"
            value={latestMeasurement?.turbidite ?? null}
            unit="NTU"
            status={getTurbidityStatus(latestMeasurement?.turbidite ?? null)}
            icon={Activity}
          />
          <MeasurementCard
            label="Oxygène"
            value={latestMeasurement?.oxygene ?? null}
            unit="mg/L"
            status="neutral"
            icon={Activity}
          />
        </div>

        {/* Last update */}
        {latestMeasurement && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Dernière mesure: {formatRelativeTime(latestMeasurement.timestamp)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SensorsPage() {
  const { data: sensors, isLoading: sensorsLoading, refetch: refetchSensors } = useSensors();
  const { data: measurements, isLoading: measurementsLoading, refetch: refetchMeasurements } = useLatestMeasurements(undefined, 50);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  // Mock data
  const mockSensors: Sensor[] = [
    { id: 1, capteur_id: 'CAP001', nom: 'Capteur Rabat Centre', latitude: 34.020882, longitude: -6.841650, type_capteur: 'multiparameter', status: 'active', created_at: '', updated_at: '' },
    { id: 2, capteur_id: 'CAP002', nom: 'Capteur Casablanca Port', latitude: 33.606892, longitude: -7.639133, type_capteur: 'multiparameter', status: 'active', created_at: '', updated_at: '' },
    { id: 3, capteur_id: 'CAP003', nom: 'Capteur Fès Ville', latitude: 34.037732, longitude: -4.999448, type_capteur: 'multiparameter', status: 'maintenance', created_at: '', updated_at: '' },
    { id: 4, capteur_id: 'CAP004', nom: 'Capteur Tanger Port', latitude: 35.7595, longitude: -5.834, type_capteur: 'temperature', status: 'active', created_at: '', updated_at: '' },
    { id: 5, capteur_id: 'CAP005', nom: 'Capteur Agadir Plage', latitude: 30.4278, longitude: -9.5981, type_capteur: 'multiparameter', status: 'inactive', created_at: '', updated_at: '' },
  ];

  const mockMeasurements: SensorMeasurement[] = [
    { id: 1, capteur_id: 'CAP001', ph: 7.2, temperature: 22.5, turbidite: 3.2, oxygene: 8.5, conductivite: 450, timestamp: new Date().toISOString() },
    { id: 2, capteur_id: 'CAP002', ph: 7.8, temperature: 24.1, turbidite: 5.8, oxygene: 7.2, conductivite: 520, timestamp: new Date().toISOString() },
    { id: 3, capteur_id: 'CAP003', ph: 6.9, temperature: 21.0, turbidite: 2.1, oxygene: 9.0, conductivite: 380, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 4, capteur_id: 'CAP004', ph: 8.1, temperature: 23.5, turbidite: 4.5, oxygene: 7.8, conductivite: 490, timestamp: new Date().toISOString() },
  ];

  const displaySensors = sensors || mockSensors;
  const displayMeasurements = measurements || mockMeasurements;

  const handleRefresh = () => {
    refetchSensors();
    refetchMeasurements();
  };

  const activeSensors = displaySensors.filter(s => s.status === 'active').length;
  const maintenanceSensors = displaySensors.filter(s => s.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capteurs IoT</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion et surveillance des capteurs de qualité d'eau
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Thermometer className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total capteurs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{displaySensors.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-emerald-600">{activeSensors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-amber-600">{maintenanceSensors}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensors List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Liste des capteurs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
                {displaySensors.map((sensor) => (
                  <button
                    key={sensor.capteur_id}
                    onClick={() => setSelectedSensor(sensor)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      selectedSensor?.capteur_id === sensor.capteur_id && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className={cn(
                      'w-3 h-3 rounded-full flex-shrink-0',
                      sensor.status === 'active' ? 'bg-emerald-500' :
                      sensor.status === 'maintenance' ? 'bg-amber-500' : 'bg-gray-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {sensor.nom}
                      </p>
                      <p className="text-xs text-gray-500">{sensor.capteur_id}</p>
                    </div>
                    <Badge 
                      variant={sensor.status === 'active' ? 'success' : sensor.status === 'maintenance' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {sensor.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Details */}
        <div className="lg:col-span-2">
          {selectedSensor ? (
            <SensorDetail sensor={selectedSensor} measurements={displayMeasurements} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <EmptyState
                icon={<Thermometer className="w-12 h-12" />}
                title="Sélectionnez un capteur"
                description="Cliquez sur un capteur dans la liste pour voir ses détails et mesures"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
