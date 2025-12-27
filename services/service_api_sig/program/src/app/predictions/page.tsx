'use client';

import React, { useState } from 'react';
import { Brain, TrendingUp, Clock, MapPin, RefreshCw, Zap, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingState, EmptyState } from '@/components/ui';
import { usePredictions, useModelInfo } from '@/hooks/useApi';
import { cn, formatRelativeTime, formatDate, getQualityColor, scoreToQuality } from '@/lib/utils';
import { Prediction, QualityStatus } from '@/types';

// Prediction card component
function PredictionCard({ prediction, onClick }: { prediction: Prediction; onClick: () => void }) {
  const quality = prediction.prediction_results.qualite_eau || scoreToQuality(prediction.prediction_results.score_qualite);
  const score = prediction.prediction_results.score_qualite;
  const confidence = prediction.confidence_score * 100;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              quality === 'BONNE' ? 'bg-emerald-500' :
              quality === 'MOYENNE' ? 'bg-amber-500' :
              quality === 'MAUVAISE' ? 'bg-red-500' : 'bg-gray-400'
            )} />
            <span className={cn('font-medium', getQualityColor(quality))}>{quality}</span>
          </div>
          <Badge variant="info" size="sm">{prediction.prediction_horizon}h</Badge>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {score.toFixed(1)}<span className="text-sm font-normal text-gray-500">/10</span>
            </p>
            <p className="text-xs text-gray-500">Score qualité prédit</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Confiance</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full',
                    confidence >= 80 ? 'bg-emerald-500' :
                    confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="font-medium">{confidence.toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {prediction.zone_latitude.toFixed(2)}, {prediction.zone_longitude.toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(prediction.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Prediction detail panel
function PredictionDetail({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  const quality = prediction.prediction_results.qualite_eau || scoreToQuality(prediction.prediction_results.score_qualite);
  const score = prediction.prediction_results.score_qualite;
  const confidence = prediction.confidence_score * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Détails de la prédiction
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p className="text-sm text-gray-500">Qualité prédite</p>
            <p className={cn('text-2xl font-bold', getQualityColor(quality))}>{quality}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{score.toFixed(1)}/10</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-gray-500">Horizon</p>
            <p className="text-lg font-semibold text-purple-600">{prediction.prediction_horizon}h</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-gray-500">Confiance</p>
            <p className="text-lg font-semibold text-blue-600">{confidence.toFixed(0)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Localisation</p>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                Lat: {prediction.zone_latitude.toFixed(4)}, Lon: {prediction.zone_longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prédictions détaillées</p>
          <div className="grid grid-cols-2 gap-3">
            {prediction.prediction_results.ph_prediction !== undefined && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500">pH prédit</p>
                <p className="text-lg font-semibold">{prediction.prediction_results.ph_prediction.toFixed(1)}</p>
              </div>
            )}
            {prediction.prediction_results.turbidite_prediction !== undefined && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500">Turbidité prédite</p>
                <p className="text-lg font-semibold">{prediction.prediction_results.turbidite_prediction.toFixed(1)} NTU</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Informations</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID Prédiction</span>
              <span className="font-mono text-xs">{prediction.prediction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Créée le</span>
              <span>{formatDate(prediction.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PredictionsPage() {
  const { data: predictions, isLoading, refetch } = usePredictions(20);
  const { data: modelInfo } = useModelInfo();
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [horizonFilter, setHorizonFilter] = useState<number | 'ALL'>('ALL');

  // Mock data
  const mockPredictions: Prediction[] = [
    {
      id: 1,
      prediction_id: 'PRED-2024-001',
      model_id: 1,
      zone_latitude: 33.5731,
      zone_longitude: -7.5898,
      input_data: {},
      prediction_results: { qualite_eau: 'BONNE', score_qualite: 7.8, ph_prediction: 7.2, turbidite_prediction: 3.5 },
      confidence_score: 0.92,
      prediction_horizon: 24,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      prediction_id: 'PRED-2024-002',
      model_id: 1,
      zone_latitude: 34.0209,
      zone_longitude: -6.8416,
      input_data: {},
      prediction_results: { qualite_eau: 'MOYENNE', score_qualite: 5.5, ph_prediction: 6.8, turbidite_prediction: 6.2 },
      confidence_score: 0.85,
      prediction_horizon: 24,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      prediction_id: 'PRED-2024-003',
      model_id: 1,
      zone_latitude: 30.4278,
      zone_longitude: -9.5981,
      input_data: {},
      prediction_results: { qualite_eau: 'MAUVAISE', score_qualite: 3.2, ph_prediction: 5.5, turbidite_prediction: 15.0 },
      confidence_score: 0.78,
      prediction_horizon: 72,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 4,
      prediction_id: 'PRED-2024-004',
      model_id: 1,
      zone_latitude: 35.7595,
      zone_longitude: -5.834,
      input_data: {},
      prediction_results: { qualite_eau: 'BONNE', score_qualite: 8.2, ph_prediction: 7.5, turbidite_prediction: 2.1 },
      confidence_score: 0.95,
      prediction_horizon: 24,
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 5,
      prediction_id: 'PRED-2024-005',
      model_id: 1,
      zone_latitude: 31.5085,
      zone_longitude: -9.7595,
      input_data: {},
      prediction_results: { qualite_eau: 'BONNE', score_qualite: 7.5, ph_prediction: 7.3, turbidite_prediction: 3.8 },
      confidence_score: 0.88,
      prediction_horizon: 72,
      created_at: new Date(Date.now() - 21600000).toISOString(),
    },
  ];

  const displayPredictions = predictions || mockPredictions;

  // Filter by horizon
  const filteredPredictions = horizonFilter === 'ALL'
    ? displayPredictions
    : displayPredictions.filter(p => p.prediction_horizon === horizonFilter);

  // Stats
  const avgScore = displayPredictions.reduce((acc, p) => acc + p.prediction_results.score_qualite, 0) / displayPredictions.length;
  const avgConfidence = displayPredictions.reduce((acc, p) => acc + p.confidence_score, 0) / displayPredictions.length * 100;
  const bonneCount = displayPredictions.filter(p => p.prediction_results.qualite_eau === 'BONNE' || p.prediction_results.score_qualite >= 7).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prédictions ML</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Prévisions de qualité d'eau par modèle spatio-temporel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Nouvelle prédiction
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prédictions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayPredictions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Score moyen</p>
              <p className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}/10</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Confiance moy.</p>
              <p className="text-2xl font-bold text-emerald-600">{avgConfidence.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Qualité bonne</p>
              <p className="text-2xl font-bold text-cyan-600">{bonneCount}/{displayPredictions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Model Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Modèle actif:</span>
              <Badge variant="info">WaterQualityLSTM v1.0</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Architecture: 2-layer LSTM (64 units)</span>
              <span>•</span>
              <span>Précision: 85%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horizon:</span>
        {['ALL', 24, 72].map((horizon) => (
          <button
            key={horizon}
            onClick={() => setHorizonFilter(horizon as number | 'ALL')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              horizonFilter === horizon
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            )}
          >
            {horizon === 'ALL' ? 'Toutes' : `${horizon}h`}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictions Grid */}
        <div className={cn(selectedPrediction ? 'lg:col-span-2' : 'lg:col-span-3')}>
          {filteredPredictions.length === 0 ? (
            <Card className="py-12">
              <EmptyState
                icon={<Brain className="w-12 h-12" />}
                title="Aucune prédiction"
                description="Aucune prédiction disponible pour ce filtre"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPredictions.map((prediction) => (
                <PredictionCard
                  key={prediction.prediction_id}
                  prediction={prediction}
                  onClick={() => setSelectedPrediction(prediction)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedPrediction && (
          <div className="lg:col-span-1">
            <PredictionDetail 
              prediction={selectedPrediction} 
              onClose={() => setSelectedPrediction(null)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
