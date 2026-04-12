import React from 'react';
import { Trophy } from 'lucide-react';
import { TeamData } from '../constants/teams';

interface HeroChampionProps {
  topTeam: TeamData | null;
  loading: boolean;
}

const HeroChampion: React.FC<HeroChampionProps> = ({ topTeam, loading }) => {
  if (loading) {
    return (
      <div className="hero-champion">
        <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="skeleton" style={{ width: '240px', height: '28px' }} />
          <div className="skeleton" style={{ width: '360px', height: '16px' }} />
        </div>
      </div>
    );
  }

  if (!topTeam) return null;

  return (
    <div className="hero-champion" style={{ borderTop: `3px solid ${topTeam.color}` }}>
      <div className="hero-champion-icon">
        <Trophy size={28} />
      </div>
      <div className="hero-champion-info">
        <h2>Predicted Champion: {topTeam.team}</h2>
        <p>
          Driven by squad stability, historical playoff conversion, and ensemble model consensus across 1,169 historical matches.
        </p>
      </div>
      <div className="hero-prob-badge">
        {topTeam.prob}%
      </div>
    </div>
  );
};

export default HeroChampion;
