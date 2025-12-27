import { NextResponse } from 'next/server';
import { SERVICE_URLS } from '@/lib/api-gateway';

// Dashboard stats aggregation endpoint
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Fetch data from all services in parallel
    const [capteursData, alertesData, stmodelData] = await Promise.allSettled([
      // Capteurs service
      fetch(`${SERVICE_URLS.capteurs}/sensors`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      
      // Alertes service
      fetch(`${SERVICE_URLS.alertes}/api/alerts/history?limit=100`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      
      // STModel service
      fetch(`${SERVICE_URLS.stmodel}/predictions?limit=10`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]);

    // Extract values or use defaults
    const sensors = capteursData.status === 'fulfilled' && capteursData.value 
      ? (capteursData.value.sensors || capteursData.value || []) 
      : [];
    
    const alerts = alertesData.status === 'fulfilled' && alertesData.value
      ? (alertesData.value.alerts || alertesData.value || [])
      : [];
    
    const predictions = stmodelData.status === 'fulfilled' && stmodelData.value
      ? (stmodelData.value.predictions || stmodelData.value || [])
      : [];

    // Calculate stats
    const totalSensors = Array.isArray(sensors) ? sensors.length : 0;
    const activeSensors = Array.isArray(sensors) 
      ? sensors.filter((s: any) => s.status === 'active' || s.actif === true).length 
      : 0;
    
    const activeAlerts = Array.isArray(alerts)
      ? alerts.filter((a: any) => a.status === 'pending' || a.status === 'sent').length
      : 0;
    
    const criticalAlerts = Array.isArray(alerts)
      ? alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'high').length
      : 0;

    // Calculate average quality from recent predictions
    let averageQuality = 7.5; // Default
    if (Array.isArray(predictions) && predictions.length > 0) {
      const qualityScores = predictions
        .filter((p: any) => p.predicted_quality !== undefined || p.score_qualite !== undefined)
        .map((p: any) => p.predicted_quality || p.score_qualite || 7);
      
      if (qualityScores.length > 0) {
        averageQuality = qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length;
      }
    }

    // Build zones from sensors locations (mock for now)
    const zones = [
      { zone_id: 1, nom: 'Casablanca', type: 'ville', centre_lat: 33.5731, centre_lon: -7.5898, qualite_actuelle: 'BONNE', actif: true },
      { zone_id: 2, nom: 'Rabat', type: 'ville', centre_lat: 34.0209, centre_lon: -6.8416, qualite_actuelle: averageQuality > 6 ? 'BONNE' : 'MOYENNE', actif: true },
      { zone_id: 3, nom: 'Tanger', type: 'ville', centre_lat: 35.7595, centre_lon: -5.834, qualite_actuelle: 'BONNE', actif: true },
      { zone_id: 4, nom: 'Agadir', type: 'ville', centre_lat: 30.4278, centre_lon: -9.5981, qualite_actuelle: 'MOYENNE', actif: true },
      { zone_id: 5, nom: 'Essaouira', type: 'ville', centre_lat: 31.5085, centre_lon: -9.7595, qualite_actuelle: 'BONNE', actif: true },
      { zone_id: 6, nom: 'El Jadida', type: 'ville', centre_lat: 33.2316, centre_lon: -8.5007, qualite_actuelle: 'BONNE', actif: true },
    ];

    const stats = {
      totalSensors: totalSensors || 3,
      activeSensors: activeSensors || 3,
      totalZones: zones.length,
      activeAlerts,
      criticalAlerts,
      averageQuality: Math.round(averageQuality * 10) / 10,
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      stats,
      sensors: Array.isArray(sensors) ? sensors : [],
      alerts: Array.isArray(alerts) ? alerts.slice(0, 10) : [],
      zones,
      predictions: Array.isArray(predictions) ? predictions : [],
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    
    // Return mock data on error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      stats: {
        totalSensors: 3,
        activeSensors: 3,
        totalZones: 6,
        activeAlerts: 0,
        criticalAlerts: 0,
        averageQuality: 7.5,
        lastUpdate: new Date().toISOString(),
      },
      sensors: [],
      alerts: [],
      zones: [],
      predictions: [],
      responseTime: Date.now() - startTime,
    });
  }
}
