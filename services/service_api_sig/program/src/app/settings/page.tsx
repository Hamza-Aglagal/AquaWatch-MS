'use client';

import React, { useState } from 'react';
import { Settings, Bell, Palette, Database, Globe, Shield, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Settings section component
function SettingsSection({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

// Toggle setting
function ToggleSetting({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// Select setting
function SelectSetting({ label, description, value, options, onChange }: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  // Notification settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  
  // Display settings
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('fr');
  const [mapStyle, setMapStyle] = useState('default');
  
  // Data settings
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [dataRetention, setDataRetention] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSave = () => {
    toast.success('Paramètres sauvegardés avec succès');
  };

  const handleReset = () => {
    setEmailAlerts(true);
    setPushAlerts(false);
    setCriticalOnly(false);
    setTheme('system');
    setLanguage('fr');
    setMapStyle('default');
    setRefreshInterval('30');
    setDataRetention('30');
    setAutoRefresh(true);
    toast.success('Paramètres réinitialisés');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configuration de l'application AquaWatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Gérez vos préférences de notification"
          icon={Bell}
        >
          <ToggleSetting
            label="Alertes par email"
            description="Recevoir les alertes par email"
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <ToggleSetting
            label="Notifications push"
            description="Recevoir les notifications dans le navigateur"
            checked={pushAlerts}
            onChange={setPushAlerts}
          />
          <ToggleSetting
            label="Alertes critiques uniquement"
            description="Ne recevoir que les alertes de niveau critique"
            checked={criticalOnly}
            onChange={setCriticalOnly}
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          title="Apparence"
          description="Personnalisez l'interface utilisateur"
          icon={Palette}
        >
          <SelectSetting
            label="Thème"
            description="Choisissez le thème de l'interface"
            value={theme}
            options={[
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
              { value: 'system', label: 'Système' },
            ]}
            onChange={setTheme}
          />
          <SelectSetting
            label="Style de carte"
            description="Style d'affichage de la carte"
            value={mapStyle}
            options={[
              { value: 'default', label: 'Standard' },
              { value: 'satellite', label: 'Satellite' },
              { value: 'terrain', label: 'Terrain' },
            ]}
            onChange={setMapStyle}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection
          title="Données"
          description="Configuration de la synchronisation des données"
          icon={Database}
        >
          <ToggleSetting
            label="Actualisation automatique"
            description="Actualiser automatiquement les données"
            checked={autoRefresh}
            onChange={setAutoRefresh}
          />
          <SelectSetting
            label="Intervalle de rafraîchissement"
            description="Fréquence d'actualisation des données"
            value={refreshInterval}
            options={[
              { value: '10', label: '10 secondes' },
              { value: '30', label: '30 secondes' },
              { value: '60', label: '1 minute' },
              { value: '300', label: '5 minutes' },
            ]}
            onChange={setRefreshInterval}
          />
          <SelectSetting
            label="Rétention des données"
            description="Durée de conservation des données locales"
            value={dataRetention}
            options={[
              { value: '7', label: '7 jours' },
              { value: '30', label: '30 jours' },
              { value: '90', label: '90 jours' },
              { value: '365', label: '1 an' },
            ]}
            onChange={setDataRetention}
          />
        </SettingsSection>

        {/* Language */}
        <SettingsSection
          title="Langue et région"
          description="Paramètres de localisation"
          icon={Globe}
        >
          <SelectSetting
            label="Langue"
            description="Langue de l'interface"
            value={language}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
            onChange={setLanguage}
          />
        </SettingsSection>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            État des connexions API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Capteurs', url: 'localhost:8001', status: 'connected' },
              { name: 'Satellite', url: 'localhost:8002', status: 'connected' },
              { name: 'STModel', url: 'localhost:8003', status: 'connected' },
              { name: 'Alertes', url: 'localhost:8004', status: 'disconnected' },
              { name: 'GeoServer', url: 'localhost:8080', status: 'connected' },
            ].map((api) => (
              <div 
                key={api.name}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{api.name}</span>
                  <Badge variant={api.status === 'connected' ? 'success' : 'danger'} size="sm">
                    {api.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 font-mono">{api.url}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Version:</span>
              <Badge>v1.0.0</Badge>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 AquaWatch-MS - Tous droits réservés
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
