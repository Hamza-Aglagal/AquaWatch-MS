'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { 
  capteursService, 
  satelliteService, 
  stmodelService, 
  alertesService, 
  geoService,
  dashboardService 
} from '@/lib/api';
import { 
  Sensor, 
  SensorMeasurement, 
  Zone, 
  Alert, 
  Prediction, 
  SatelliteIndex,
  DashboardStats,
  ServiceHealth
} from '@/types';

// ============================================
// Capteurs Hooks
// ============================================

export function useSensors(options?: Omit<UseQueryOptions<Sensor[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['sensors'],
    queryFn: capteursService.getSensors,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

export function useSensorPositions() {
  return useQuery({
    queryKey: ['sensor-positions'],
    queryFn: capteursService.getPositions,
    staleTime: 60000, // 1 minute
  });
}

export function useLatestMeasurements(capteurId?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['latest-measurements', capteurId, limit],
    queryFn: () => capteursService.getLatestData(capteurId, limit),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSensorMeasurements(capteurId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sensor-measurements', capteurId, startDate, endDate],
    queryFn: () => capteursService.getMeasurements(capteurId, startDate, endDate),
    enabled: !!capteurId,
    staleTime: 60000,
  });
}

export function useAddMeasurement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: capteursService.addMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-measurements'] });
      queryClient.invalidateQueries({ queryKey: ['sensor-measurements'] });
    },
  });
}

// ============================================
// Satellite Hooks
// ============================================

export function useLatestSatelliteIndices(limit: number = 10, hours: number = 24) {
  return useQuery({
    queryKey: ['satellite-indices', limit, hours],
    queryFn: () => satelliteService.getLatestIndices(limit, hours),
    staleTime: 300000, // 5 minutes
  });
}

export function useSatelliteIndicesByLocation(lat: number, lon: number, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['satellite-indices-location', lat, lon, startDate, endDate],
    queryFn: () => satelliteService.getIndicesByLocation(lat, lon, startDate, endDate),
    enabled: !!lat && !!lon,
    staleTime: 300000,
  });
}

// ============================================
// STModel Hooks
// ============================================

export function useModelInfo() {
  return useQuery({
    queryKey: ['model-info'],
    queryFn: stmodelService.getModelInfo,
    staleTime: 600000, // 10 minutes
  });
}

export function usePredictions(limit: number = 10) {
  return useQuery({
    queryKey: ['predictions', limit],
    queryFn: () => stmodelService.getPredictions(limit),
    staleTime: 60000,
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

export function usePrediction(predictionId: string) {
  return useQuery({
    queryKey: ['prediction', predictionId],
    queryFn: () => stmodelService.getPredictionById(predictionId),
    enabled: !!predictionId,
    staleTime: 60000,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: stmodelService.createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
}

// ============================================
// Alertes Hooks
// ============================================

export function useAlerts(params?: { status?: string; severity?: string; limit?: number }) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertesService.getAlerts(params),
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useActiveAlerts() {
  return useQuery({
    queryKey: ['active-alerts'],
    queryFn: alertesService.getActiveAlerts,
    staleTime: 15000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: ['alert-stats'],
    queryFn: alertesService.getStats,
    staleTime: 60000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: alertesService.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================
// Geo/Zones Hooks
// ============================================

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: geoService.getZones,
    staleTime: 120000, // 2 minutes
  });
}

export function useZonesGeoJSON() {
  return useQuery({
    queryKey: ['zones-geojson'],
    queryFn: geoService.getZonesGeoJSON,
    staleTime: 120000,
  });
}

export function useZone(zoneId: number) {
  return useQuery({
    queryKey: ['zone', zoneId],
    queryFn: () => geoService.getZoneById(zoneId),
    enabled: !!zoneId,
    staleTime: 60000,
  });
}

export function useUpdateZoneQuality() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ zoneId, quality }: { zoneId: number; quality: string }) =>
      geoService.updateZoneQuality(zoneId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zones-geojson'] });
    },
  });
}

// ============================================
// Dashboard Hooks
// ============================================

export function useServicesHealth() {
  return useQuery({
    queryKey: ['services-health'],
    queryFn: dashboardService.getServicesHealth,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
