import React from 'react';
import { MatchFixture } from '../constants/teams';

interface MatchForecastProps {
  schedule: MatchFixture[];
  loading: boolean;
}

const MatchForecast: React.FC<MatchForecastProps> = ({ schedule, loading }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Match Forecast</h3>
      </div>

      <div className="data-table">
        <div className="table-header" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr' }}>
          <span>Date</span>
          <span>Home</span>
          <span>Away</span>
          <span>Predicted Winner</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '48px', margin: 'var(--space-sm) 0' }} />
            ))}
          </div>
        ) : (
          <div>
            {schedule.map((match, i) => (
              <div
                key={i}
                className="table-row"
                style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr' }}
              >
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  {match.date || 'TBD'}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{match.team1}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{match.team2}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--color-success)', flexShrink: 0
                  }} />
                  <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.875rem' }}>
                    {match.predicted_winner}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchForecast;
