import React from 'react';
import { IntelligenceData, TEAM_COLORS } from '../constants/teams';

interface IntelligenceTabProps {
  data: IntelligenceData | null;
  loading: boolean;
}

const IntelligenceTab: React.FC<IntelligenceTabProps> = ({ data, loading }) => {
  const teamKeys = Object.keys(TEAM_COLORS).slice(0, 10);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
        {/* Bayesian Priors */}
        <div>
          <div className="card-header">
            <h3>Bayesian Squad Priors</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>
            Raw mathematical anchors reflecting 2026 auction strengths and historical playoff frequency.
          </p>

          {loading || !data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '32px' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {Object.entries(data.squad_strength)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([team, val]) => (
                  <div key={team}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: TEAM_COLORS[team] || 'var(--color-text-main)' }}>
                        {team}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {val}/10
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${(val / 10) * 100}%`,
                          background: TEAM_COLORS[team] || 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Head-to-Head Simulator */}
        <div style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
        }}>
          <div className="card-header">
            <h3>Head-to-Head Simulator</h3>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <select className="form-select" style={{ flex: 1 }}>
              {teamKeys.map(t => <option key={t}>{t}</option>)}
            </select>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.75rem' }}>
              VS
            </span>
            <select className="form-select" style={{ flex: 1 }} defaultValue="MI">
              {teamKeys.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
            <div style={{
              color: 'var(--color-success)',
              fontSize: '2.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}>
              58.2%
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
              Simulated Win Probability
            </div>
          </div>
        </div>
      </div>

      {/* Form / Playoff Rate */}
      {data && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
          <div>
            <div className="card-header">
              <h3>Playoff Conversion Rate (3-yr)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {Object.entries(data.playoff_rate)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([team, val]) => (
                  <div key={team} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600 }}>{team}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <div className="card-header">
              <h3>2025 Season Form Score</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {Object.entries(data.form_score)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([team, val]) => (
                  <div key={team} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600 }}>{team}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {val.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceTab;
