import React from 'react';
import { Zap, Layers, Database, TrendingUp } from 'lucide-react';
import { ModelStat, ShapFeature } from '../constants/teams';

interface StatCardsProps {
  modelStats: ModelStat[];
  shapFeatures: ShapFeature[];
  loading: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ modelStats, shapFeatures, loading }) => {
  const ensembleAcc = modelStats.find(m => m.name === 'ENSEMBLE')?.acc || '--';
  const topFeature = shapFeatures.length > 0 ? shapFeatures[0].name : '--';

  const cards = [
    {
      icon: Zap,
      value: loading ? '...' : `${ensembleAcc}%`,
      label: 'Ensemble Accuracy',
      bgColor: 'var(--color-warning-muted)',
      iconColor: 'var(--color-warning)',
    },
    {
      icon: Layers,
      value: loading ? '...' : `${modelStats.length}`,
      label: 'Models Polled',
      bgColor: 'var(--color-primary-muted)',
      iconColor: 'var(--color-primary)',
    },
    {
      icon: Database,
      value: '1,169',
      label: 'Matches Analyzed',
      bgColor: 'var(--color-success-muted)',
      iconColor: 'var(--color-success)',
    },
    {
      icon: TrendingUp,
      value: loading ? '...' : topFeature,
      label: 'Top Feature',
      bgColor: 'var(--color-primary-muted)',
      iconColor: 'var(--color-primary)',
    },
  ];

  return (
    <div className="stat-cards-row">
      {cards.map(card => (
        <div key={card.label} className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: card.bgColor, color: card.iconColor }}
          >
            <card.icon size={16} />
          </div>
          {loading ? (
            <div className="skeleton" style={{ width: '80px', height: '28px', marginBottom: 'var(--space-xs)' }} />
          ) : (
            <div className="stat-card-value">{card.value}</div>
          )}
          <div className="stat-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
