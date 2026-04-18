import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { TeamData, getTeamLogo } from '../constants/teams';

interface HeroChampionProps {
  topTeam: TeamData | null;
  loading: boolean;
}

const HeroChampion: React.FC<HeroChampionProps> = ({ topTeam, loading }) => {
  if (loading) {
    return (
      <div className="hero-champion">
        <div className="skeleton h-24 w-24" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton h-3.5 w-44" />
          <div className="skeleton h-8 w-80" />
          <div className="skeleton h-3.5 w-[420px] max-w-full" />
        </div>
        <div className="skeleton h-14 w-36" />
      </div>
    );
  }

  if (!topTeam) return null;

  const logo = getTeamLogo(topTeam.team);

  return (
    <div
      className="hero-champion"
      style={{ borderTop: `2px solid ${topTeam.color}` }}
    >
      <div
        className="hero-champion-icon"
        style={{ color: topTeam.color, borderColor: topTeam.color }}
      >
        {logo ? (
          <img
            src={logo}
            alt={`${topTeam.team} logo`}
            className="max-h-[80%] max-w-[80%] object-contain"
            loading="eager"
          />
        ) : (
          <Trophy size={40} strokeWidth={1.25} />
        )}
      </div>

      <div className="hero-champion-info">
        <span className="eyebrow">
          <Star size={10} className="mr-1 inline -translate-y-px" />
          Predicted Champion
        </span>
        <h2>{topTeam.team}</h2>
        <p>
          Driven by squad stability, historical playoff conversion, and ensemble model consensus across 1,169 historical matches.
        </p>
      </div>

      <div className="flex flex-col items-end">
        <div className="hero-prob-badge">
          {topTeam.prob}
          <span className="ml-1 font-mono text-xl tracking-mono text-paper-muted">%</span>
        </div>
        <div className="hero-prob-badge-label">Ensemble Win Probability</div>
      </div>
    </div>
  );
};

export default HeroChampion;
