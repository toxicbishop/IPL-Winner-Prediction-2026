import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { TeamData } from '../constants/teams';

interface HeroChampionProps {
  topTeam: TeamData | null;
  loading: boolean;
}

const HeroChampion: React.FC<HeroChampionProps> = ({ topTeam, loading }) => {
  if (loading) {
    return (
      <div className="hero-champion">
        <div className="skeleton" style={{ width: '96px', height: '96px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="skeleton" style={{ width: '180px', height: '14px' }} />
          <div className="skeleton" style={{ width: '320px', height: '32px' }} />
          <div className="skeleton" style={{ width: '420px', height: '14px' }} />
        </div>
        <div className="skeleton" style={{ width: '140px', height: '56px' }} />
      </div>
    );
  }

  if (!topTeam) return null;

  return (
    <div
      className="hero-champion"
      style={{ borderTop: `2px solid ${topTeam.color}` }}
    >
      <div className="hero-champion-icon" style={{ color: topTeam.color }}>
        <Trophy size={40} strokeWidth={1.25} />
      </div>

      <div className="hero-champion-info">
        <span className="eyebrow">
          <Star size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
          Predicted Champion
        </span>
        <h2>{topTeam.team}</h2>
        <p>
          Driven by squad stability, historical playoff conversion, and ensemble model consensus across 1,169 historical matches.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div className="hero-prob-badge">
          {topTeam.prob}
          <span style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>%</span>
        </div>
        <div className="hero-prob-badge-label">Ensemble Win Probability</div>
      </div>
    </div>
  );
};

export default HeroChampion;
