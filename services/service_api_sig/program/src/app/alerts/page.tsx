'use client';

import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Filter, MapPin, RefreshCw, Eye, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingState, EmptyState } from '@/components/ui';
import { useAlerts, useActiveAlerts, useAcknowledgeAlert } from '@/hooks/useApi';
import { cn, formatRelativeTime, formatDate, getSeverityColor, getSeverityBgColor } from '@/lib/utils';
import { Alert, AlertSeverity, AlertStatus } from '@/types';
import toast from 'react-hot-toast';

// Alert row component
function AlertRow({ alert, onAcknowledge, onView }: { 
  alert: Alert; 
  onAcknowledge: (id: string) => void;
  onView: (alert: Alert) => void;
}) {
  const severityColors: Record<AlertSeverity, string> = {
    low: 'bg-blue-500',
    medium: 'bg-amber-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const statusBadge: Record<AlertStatus, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
    pending: { variant: 'warning', label: 'En attente' },
    sent: { variant: 'success', label: 'Envoyée' },
    failed: { variant: 'danger', label: 'Échouée' },
    acknowledged: { variant: 'default', label: 'Acquittée' },
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className={cn('w-2 h-2 mt-2 rounded-full flex-shrink-0', severityColors[alert.severity])} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {(alert.alert_data as { message?: string })?.message || `Alerte ${alert.severity}`}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {alert.zone_latitude.toFixed(2)}, {alert.zone_longitude.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(alert.created_at)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge[alert.status].variant} size="sm">
              {statusBadge[alert.status].label}
            </Badge>
            <Badge 
              variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'} 
              size="sm"
            >
              {alert.severity}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={() => onView(alert)}>
            <Eye className="w-4 h-4 mr-1" />
            Détails
          </Button>
          {alert.status === 'pending' && (
            <Button variant="outline" size="sm" onClick={() => onAcknowledge(alert.alert_id)}>
              <Check className="w-4 h-4 mr-1" />
              Acquitter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Alert detail modal
function AlertDetailModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Détails de l'alerte</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">ID Alerte</p>
            <p className="font-mono text-sm">{alert.alert_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Message</p>
            <p className="font-medium">{(alert.alert_data as { message?: string })?.message || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sévérité</p>
              <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>{alert.severity}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge>{alert.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Latitude</p>
              <p className="font-medium">{alert.zone_latitude}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Longitude</p>
              <p className="font-medium">{alert.zone_longitude}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Créée le</p>
            <p className="font-medium">{formatDate(alert.created_at)}</p>
          </div>
          {alert.prediction_id && (
            <div>
              <p className="text-sm text-gray-500">Prédiction associée</p>
              <p className="font-mono text-sm">{alert.prediction_id}</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { data: allAlerts, isLoading, refetch } = useAlerts({ limit: 50 });
  const { data: activeAlerts } = useActiveAlerts();
  const acknowledgeMutation = useAcknowledgeAlert();
  
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');

  // Mock data
  const mockAlerts: Alert[] = [
    {
      id: 1,
      alert_id: 'ALT-2024-001',
      alert_type_id: 1,
      prediction_id: 'PRED-001',
      zone_latitude: 33.5731,
      zone_longitude: -7.5898,
      alert_data: { message: 'Qualité eau dégradée détectée à Casablanca' },
      severity: 'high',
      status: 'pending',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      sent_at: null,
      acknowledged_at: null,
    },
    {
      id: 2,
      alert_id: 'ALT-2024-002',
      alert_type_id: 2,
      prediction_id: 'PRED-002',
      zone_latitude: 34.0209,
      zone_longitude: -6.8416,
      alert_data: { message: 'pH critique détecté à Rabat - Valeur: 5.2' },
      severity: 'critical',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sent_at: null,
      acknowledged_at: null,
    },
    {
      id: 3,
      alert_id: 'ALT-2024-003',
      alert_type_id: 3,
      prediction_id: null,
      zone_latitude: 30.4278,
      zone_longitude: -9.5981,
      alert_data: { message: 'Turbidité élevée à Agadir - Valeur: 12.5 NTU' },
      severity: 'medium',
      status: 'sent',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sent_at: new Date(Date.now() - 7000000).toISOString(),
      acknowledged_at: null,
    },
    {
      id: 4,
      alert_id: 'ALT-2024-004',
      alert_type_id: 4,
      prediction_id: null,
      zone_latitude: 35.7595,
      zone_longitude: -5.834,
      alert_data: { message: 'Capteur CAP004 hors ligne depuis 2 heures' },
      severity: 'low',
      status: 'acknowledged',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sent_at: new Date(Date.now() - 86000000).toISOString(),
      acknowledged_at: new Date(Date.now() - 80000000).toISOString(),
    },
  ];

  const displayAlerts = allAlerts || mockAlerts;

  // Filter alerts
  const filteredAlerts = displayAlerts.filter(alert => {
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
    return true;
  });

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      toast.success('Alerte acquittée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'acquittement');
    }
  };

  // Stats
  const criticalCount = displayAlerts.filter(a => a.severity === 'critical' && a.status === 'pending').length;
  const pendingCount = displayAlerts.filter(a => a.status === 'pending').length;
  const todayCount = displayAlerts.filter(a => {
    const today = new Date();
    const alertDate = new Date(a.created_at);
    return alertDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion des alertes qualité eau
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critiques</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayAlerts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Sévérité:</span>
              {['ALL', 'critical', 'high', 'medium', 'low'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity as AlertSeverity | 'ALL')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    severityFilter === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {severity === 'ALL' ? 'Tout' : severity}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              {['ALL', 'pending', 'sent', 'acknowledged'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as AlertStatus | 'ALL')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {status === 'ALL' ? 'Tout' : status}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertes ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12" />}
              title="Aucune alerte"
              description="Aucune alerte ne correspond aux filtres sélectionnés"
              className="py-12"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAlerts.map((alert) => (
                <AlertRow
                  key={alert.alert_id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onView={setSelectedAlert}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
