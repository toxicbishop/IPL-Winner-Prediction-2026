import React from 'react';
import { MatchFixture } from '../constants/teams';

interface MatchForecastProps {
  schedule: MatchFixture[];
  loading: boolean;
}

const MatchForecast: React.FC<MatchForecastProps> = ({ schedule, loading }) => {
  return (
    <div className="card">
      <div className="card-terminal-bar">
        <span className="terminal-id">SCHED_ID: FIXT_UPCOMING</span>
        <span className="terminal-id" style={{ color: 'var(--color-secondary)' }}>
          {schedule.length} SLOTS
        </span>
      </div>
      <div className="card-body">
        <div className="card-header">
          <h3>Match Forecast</h3>
        </div>

        <div className="data-table">
          <div
            className="table-header"
            style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr' }}
          >
            <span>Date</span>
            <span>Home</span>
            <span>Away</span>
            <span>Predicted Winner</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', paddingTop: 'var(--space-md)' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '40px' }} />
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
                  <span
                    className="mono-label"
                    style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}
                  >
                    {match.date || 'TBD'}
                  </span>
                  <span
                    className="mono-label"
                    style={{ fontSize: '0.75rem', color: 'var(--color-text-main)' }}
                  >
                    {match.team1}
                  </span>
                  <span
                    className="mono-label"
                    style={{ fontSize: '0.75rem', color: 'var(--color-text-main)' }}
                  >
                    {match.team2}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        background: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="mono-label"
                      style={{
                        color: 'var(--color-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {match.predicted_winner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchForecast;
