'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

interface Report {
  id: string;
  type: string;
  description: string;
  location: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

const problemTypes = [
  { value: 'taste', label: 'Goût anormal', icon: '👅' },
  { value: 'smell', label: 'Odeur suspecte', icon: '👃' },
  { value: 'color', label: 'Couleur inhabituelle', icon: '🎨' },
  { value: 'pressure', label: 'Pression faible', icon: '💧' },
  { value: 'interruption', label: 'Coupure d\'eau', icon: '🚫' },
  { value: 'other', label: 'Autre problème', icon: '❓' },
];

const statusLabels: Record<ReportStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'En attente', color: 'text-amber-600 bg-amber-50', icon: Clock },
  in_progress: { label: 'En cours de traitement', color: 'text-blue-600 bg-blue-50', icon: FileText },
  resolved: { label: 'Résolu', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'text-red-600 bg-red-50', icon: XCircle },
};

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: user?.zone || '',
    useCurrentLocation: false,
  });

  // Mock history data
  const reports: Report[] = [
    {
      id: 'REP-001',
      type: 'smell',
      description: 'Odeur de chlore très forte ce matin',
      location: 'Rabat-Agdal',
      status: 'resolved',
      createdAt: '2025-12-20T09:30:00Z',
      resolvedAt: '2025-12-21T14:00:00Z',
      response: 'Suite à une intervention de maintenance, le niveau de chlore a été ajusté. Merci pour votre signalement.',
    },
    {
      id: 'REP-002',
      type: 'color',
      description: 'Eau légèrement jaune depuis 2 jours',
      location: 'Rabat-Agdal',
      status: 'in_progress',
      createdAt: '2025-12-24T16:45:00Z',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ type: '', description: '', location: user?.zone || '', useCurrentLocation: false });
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Connexion requise</h2>
        <p className="text-gray-600 mt-2">Veuillez vous connecter pour accéder aux signalements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
        <p className="text-gray-600 mt-1">Signalez un problème avec l'eau dans votre zone</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'new'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Nouveau signalement
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Mes signalements ({reports.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Signaler un problème
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-700">
                  Votre signalement a été envoyé avec succès. Nous vous contacterons si nécessaire.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Problem Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de problème *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {problemTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description du problème *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Décrivez le problème en détail (depuis quand, fréquence, etc.)"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Adresse ou quartier"
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  onClick={() => {
                    // Simulate getting current location
                    setFormData({ ...formData, location: 'Position actuelle détectée', useCurrentLocation: true });
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  Utiliser ma position actuelle
                </button>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo (optionnel)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cliquez pour ajouter une photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG jusqu'à 5MB</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formData.type || !formData.description || isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer le signalement
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Vous n'avez pas encore de signalements</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => {
              const statusInfo = statusLabels[report.status];
              const StatusIcon = statusInfo.icon;
              const problemType = problemTypes.find(t => t.value === report.type);

              return (
                <Card key={report.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{problemType?.icon || '❓'}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {problemType?.label || 'Signalement'}
                          </h3>
                          <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                            statusInfo.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{report.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {report.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {report.response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Réponse:</strong> {report.response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
