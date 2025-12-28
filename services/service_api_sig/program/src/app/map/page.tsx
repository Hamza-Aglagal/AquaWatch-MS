'use client';

import React, { useState } from 'react';
import { Map, Layers, Filter, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingState } from '@/components/ui';
import { InteractiveMap } from '@/components/map';
import { useSensors, useZones } from '@/hooks/useApi';
import { cn, getQualityColor } from '@/lib/utils';
import { Sensor, Zone, QualityStatus } from '@/types';

export default function MapPage() {
  const { data: sensors, isLoading: sensorsLoading } = useSensors();
  const { data: zones, isLoading: zonesLoading } = useZones();
  
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [qualityFilter, setQualityFilter] = useState<QualityStatus | 'ALL'>('ALL');

  // Mock data
  const mockZones: Zone[] = [
    { zone_id: 1, nom: 'Casablanca', type: 'ville', centre_lat: 33.5731, centre_lon: -7.5898, qualite_actuelle: 'BONNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 2, nom: 'Rabat', type: 'ville', centre_lat: 34.0209, centre_lon: -6.8416, qualite_actuelle: 'MOYENNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 3, nom: 'Tanger', type: 'ville', centre_lat: 35.7595, centre_lon: -5.834, qualite_actuelle: 'BONNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 4, nom: 'Agadir', type: 'ville', centre_lat: 30.4278, centre_lon: -9.5981, qualite_actuelle: 'MAUVAISE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 5, nom: 'Essaouira', type: 'ville', centre_lat: 31.5085, centre_lon: -9.7595, qualite_actuelle: 'BONNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 6, nom: 'El Jadida', type: 'ville', centre_lat: 33.2316, centre_lon: -8.5007, qualite_actuelle: 'MOYENNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 7, nom: 'Safi', type: 'ville', centre_lat: 32.2994, centre_lon: -9.2372, qualite_actuelle: 'BONNE', derniere_mise_a_jour: null, actif: true },
    { zone_id: 8, nom: 'Mohammedia', type: 'ville', centre_lat: 33.6866, centre_lon: -7.383, qualite_actuelle: 'MOYENNE', derniere_mise_a_jour: null, actif: true },
  ];

  const mockSensors: Sensor[] = [
    { id: 1, capteur_id: 'CAP001', nom: 'Capteur Rabat Centre', latitude: 34.020882, longitude: -6.841650, type_capteur: 'multiparameter', status: 'active', created_at: '', updated_at: '' },
    { id: 2, capteur_id: 'CAP002', nom: 'Capteur Casablanca Port', latitude: 33.606892, longitude: -7.639133, type_capteur: 'multiparameter', status: 'active', created_at: '', updated_at: '' },
    { id: 3, capteur_id: 'CAP003', nom: 'Capteur Fès Ville', latitude: 34.037732, longitude: -4.999448, type_capteur: 'multiparameter', status: 'maintenance', created_at: '', updated_at: '' },
  ];

  const displayZones = zones || mockZones;
  const displaySensors = sensors || mockSensors;

  // Filter zones by quality
  const filteredZones = qualityFilter === 'ALL' 
    ? displayZones 
    : displayZones.filter(z => z.qualite_actuelle === qualityFilter);

  const handleSensorClick = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setSelectedZone(null);
  };

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
    setSelectedSensor(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Carte interactive</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualisation géographique de la qualité de l'eau
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map - Main Area */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-220px)] min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Map className="w-5 h-5 text-blue-600" />
                Carte du Maroc
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] p-0">
              <InteractiveMap
                sensors={showSensors ? displaySensors : []}
                zones={showZones ? filteredZones : []}
                onSensorClick={handleSensorClick}
                onZoneClick={handleZoneClick}
                className="rounded-b-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Filters & Details */}
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="w-4 h-4" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Layer toggles */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Couches</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSensors}
                    onChange={(e) => setShowSensors(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Capteurs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showZones}
                    onChange={(e) => setShowZones(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Zones</span>
                </label>
              </div>

              {/* Quality filter */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Qualité</p>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'BONNE', 'MOYENNE', 'MAUVAISE'].map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setQualityFilter(quality as QualityStatus | 'ALL')}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                        qualityFilter === quality
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      )}
                    >
                      {quality === 'ALL' ? 'Tout' : quality}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Item Details */}
          {(selectedSensor || selectedZone) && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">
                  {selectedSensor ? 'Détails capteur' : 'Détails zone'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedSensor && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedSensor.nom}
                      </p>
                      <p className="text-xs text-gray-500">{selectedSensor.capteur_id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium">{selectedSensor.type_capteur}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <Badge variant={selectedSensor.status === 'active' ? 'success' : 'warning'}>
                          {selectedSensor.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-500">Latitude</p>
                        <p className="font-medium">{selectedSensor.latitude.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Longitude</p>
                        <p className="font-medium">{selectedSensor.longitude.toFixed(4)}</p>
                      </div>
                    </div>
                  </>
                )}
                {selectedZone && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedZone.nom}
                      </p>
                      <p className="text-xs text-gray-500">{selectedZone.type}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Qualité</p>
                        <p className={cn('font-medium', getQualityColor(selectedZone.qualite_actuelle))}>
                          {selectedZone.qualite_actuelle}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Centre</p>
                        <p className="font-medium text-xs">
                          {selectedZone.centre_lat.toFixed(2)}, {selectedZone.centre_lon.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  setSelectedSensor(null);
                  setSelectedZone(null);
                }}>
                  Fermer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Zones List */}
          <Card className="max-h-[300px] overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Zones ({filteredZones.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[240px] overflow-y-auto">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredZones.map((zone) => (
                  <button
                    key={zone.zone_id}
                    onClick={() => handleZoneClick(zone)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      selectedZone?.zone_id === zone.zone_id && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full flex-shrink-0',
                      zone.qualite_actuelle === 'BONNE' ? 'bg-emerald-500' :
                      zone.qualite_actuelle === 'MOYENNE' ? 'bg-amber-500' :
                      zone.qualite_actuelle === 'MAUVAISE' ? 'bg-red-500' : 'bg-gray-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {zone.nom}
                      </p>
                      <p className={cn('text-xs', getQualityColor(zone.qualite_actuelle))}>
                        {zone.qualite_actuelle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
