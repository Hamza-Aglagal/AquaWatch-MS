'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn, getQualityBgColor } from '@/lib/utils';
import { Sensor, Zone, QualityStatus } from '@/types';

// Fix Leaflet default marker icon issue
const fixLeafletIcons = () => {
  // @ts-expect-error - Leaflet icon fix
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// Custom marker icons by quality
const createQualityIcon = (quality: QualityStatus) => {
  const colors: Record<QualityStatus, string> = {
    BONNE: '#10b981',
    MOYENNE: '#f59e0b',
    MAUVAISE: '#ef4444',
    INCONNU: '#9ca3af',
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${colors[quality]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Sensor marker icon
const createSensorIcon = (status: 'active' | 'inactive' | 'maintenance') => {
  const colors: Record<string, string> = {
    active: '#3b82f6',
    inactive: '#9ca3af',
    maintenance: '#f59e0b',
  };

  return L.divIcon({
    className: 'sensor-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[status] || colors.inactive};
        border: 3px solid white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface MapProps {
  sensors?: Sensor[];
  zones?: Zone[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onSensorClick?: (sensor: Sensor) => void;
  onZoneClick?: (zone: Zone) => void;
  showLegend?: boolean;
}

export function InteractiveMap({
  sensors = [],
  zones = [],
  center = [31.7917, -7.0926], // Morocco center
  zoom = 6,
  className,
  onSensorClick,
  onZoneClick,
  showLegend = true,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    fixLeafletIcons();

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create markers layer group
    markersRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add zone markers
    zones.forEach((zone) => {
      const marker = L.marker([zone.centre_lat, zone.centre_lon], {
        icon: createQualityIcon(zone.qualite_actuelle),
      });

      marker.bindPopup(`
        <div class="p-2 min-w-[150px]">
          <h3 class="font-semibold text-gray-900">${zone.nom}</h3>
          <p class="text-sm text-gray-600">Type: ${zone.type}</p>
          <p class="text-sm font-medium" style="color: ${zone.qualite_actuelle === 'BONNE' ? '#10b981' : zone.qualite_actuelle === 'MOYENNE' ? '#f59e0b' : zone.qualite_actuelle === 'MAUVAISE' ? '#ef4444' : '#9ca3af'}">
            Qualité: ${zone.qualite_actuelle}
          </p>
        </div>
      `);

      if (onZoneClick) {
        marker.on('click', () => onZoneClick(zone));
      }

      marker.addTo(markersRef.current!);
    });

    // Add sensor markers
    sensors.forEach((sensor) => {
      const marker = L.marker([sensor.latitude, sensor.longitude], {
        icon: createSensorIcon(sensor.status),
      });

      marker.bindPopup(`
        <div class="p-2 min-w-[180px]">
          <h3 class="font-semibold text-gray-900">${sensor.nom}</h3>
          <p class="text-sm text-gray-600">ID: ${sensor.capteur_id}</p>
          <p class="text-sm text-gray-600">Type: ${sensor.type_capteur}</p>
          <p class="text-sm font-medium" style="color: ${sensor.status === 'active' ? '#10b981' : sensor.status === 'maintenance' ? '#f59e0b' : '#9ca3af'}">
            Status: ${sensor.status}
          </p>
        </div>
      `);

      if (onSensorClick) {
        marker.on('click', () => onSensorClick(sensor));
      }

      marker.addTo(markersRef.current!);
    });
  }, [sensors, zones, onSensorClick, onZoneClick]);

  return (
    <div className={cn('relative w-full h-full min-h-[400px] rounded-xl overflow-hidden', className)}>
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 z-[1000]">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Légende</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Bonne qualité</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Qualité moyenne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Mauvaise qualité</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Capteur actif</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
