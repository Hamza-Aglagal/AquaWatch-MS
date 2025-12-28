// ============================================
// AquaWatch Types - Complete Type Definitions
// ============================================

// Water Quality Status
export type QualityStatus = 'BONNE' | 'MOYENNE' | 'MAUVAISE' | 'INCONNU';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'sent' | 'failed' | 'acknowledged';

// Sensor Types
export interface Sensor {
  id: number;
  capteur_id: string;
  nom: string;
  latitude: number;
  longitude: number;
  type_capteur: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface SensorMeasurement {
  id: number;
  capteur_id: string;
  ph: number;
  temperature: number;
  turbidite: number;
  oxygene: number;
  conductivite: number;
  timestamp: string;
}

export interface SensorWithLatestData extends Sensor {
  latest_measurement?: SensorMeasurement;
}

// Zone Types
export interface Zone {
  zone_id: number;
  nom: string;
  type: 'ville' | 'region';
  centre_lat: number;
  centre_lon: number;
  qualite_actuelle: QualityStatus;
  derniere_mise_a_jour: string | null;
  actif: boolean;
}

export interface ZoneGeoJSON {
  type: 'Feature';
  properties: {
    zone_id: number;
    nom: string;
    qualite: QualityStatus;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

// Alert Types
export interface Alert {
  id: number;
  alert_id: string;
  alert_type_id: number;
  prediction_id: string | null;
  zone_latitude: number;
  zone_longitude: number;
  alert_data: Record<string, unknown>;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
}

export interface AlertType {
  id: number;
  type_code: string;
  type_name: string;
  severity: AlertSeverity;
  description: string;
  is_active: boolean;
}

export interface AlertWithType extends Alert {
  type?: AlertType;
}

// Prediction Types
export interface Prediction {
  id: number;
  prediction_id: string;
  model_id: number;
  zone_latitude: number;
  zone_longitude: number;
  input_data: Record<string, unknown>;
  prediction_results: {
    qualite_eau: QualityStatus;
    score_qualite: number;
    ph_prediction?: number;
    turbidite_prediction?: number;
  };
  confidence_score: number;
  prediction_horizon: number;
  created_at: string;
}

export interface PredictionRequest {
  latitude: number;
  longitude: number;
  measurements: SensorMeasurement[];
}

// Satellite Types
export interface SatelliteIndex {
  id: string;
  latitude: number;
  longitude: number;
  ndwi: number;
  chlorophyll: number;
  turbidity: number;
  timestamp: string;
  image_id: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalSensors: number;
  activeSensors: number;
  totalZones: number;
  activeAlerts: number;
  criticalAlerts: number;
  averageQuality: number;
  lastUpdate: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Map Types
export interface MapMarker {
  id: string;
  type: 'sensor' | 'zone' | 'alert' | 'prediction';
  latitude: number;
  longitude: number;
  label: string;
  status?: QualityStatus;
  data?: unknown;
}

// Health Check
export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// Chart Data Types
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartDataset {
  label: string;
  data: TimeSeriesData[];
  color?: string;
}
