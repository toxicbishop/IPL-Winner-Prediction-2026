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
      <div className="card">
        <div className="card-terminal-bar">
          <span className="terminal-id">INTEL_ID: BAYES_H2H</span>
          <span className="terminal-id">DUAL_PANEL</span>
        </div>
        <div
          className="card-body"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: 0 }}
        >
          {/* Bayesian Priors */}
          <div style={{ padding: 'var(--space-lg)', borderRight: '1px solid var(--color-border)' }}>
            <div className="card-header">
              <h3>Bayesian Squad Priors</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
              Raw mathematical anchors reflecting 2026 auction strengths and historical playoff frequency.
            </p>

            {loading || !data ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '28px' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {Object.entries(data.squad_strength)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([team, val]) => (
                    <div key={team}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.75rem', marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        <span style={{ fontWeight: 600, color: TEAM_COLORS[team] || 'var(--color-text-main)' }}>
                          {team}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
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
          <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-alt)' }}>
            <div className="card-header">
              <h3>Head-to-Head Simulator</h3>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', alignItems: 'center' }}>
              <select className="form-select" style={{ flex: 1 }}>
                {teamKeys.map(t => <option key={t}>{t}</option>)}
              </select>
              <span
                className="mono-label"
                style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
              >
                VS
              </span>
              <select className="form-select" style={{ flex: 1 }} defaultValue="MI">
                {teamKeys.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl) 0',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
            }}>
              <div style={{
                color: 'var(--color-primary)',
                fontSize: '3rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
              }}>
                58.2<span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>%</span>
              </div>
              <div
                className="mono-label"
                style={{ color: 'var(--color-text-muted)', fontSize: '0.625rem', marginTop: 'var(--space-xs)' }}
              >
                Simulated Win Probability
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form / Playoff Rate */}
      {data && (
        <div className="card">
          <div className="card-terminal-bar">
            <span className="terminal-id">INTEL_ID: FORM_PLAYOFF</span>
            <span className="terminal-id">WINDOW_3Y</span>
          </div>
          <div
            className="card-body"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: 0 }}
          >
            <div style={{ padding: 'var(--space-lg)', borderRight: '1px solid var(--color-border)' }}>
              <div className="card-header">
                <h3>Playoff Conversion Rate (3-yr)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {Object.entries(data.playoff_rate)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([team, val]) => (
                    <div
                      key={team}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: 'var(--space-sm) 0',
                        borderBottom: '1px solid var(--color-surface-highest)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{team}</span>
                      <span style={{ color: 'var(--color-secondary)' }}>
                        {(val * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div style={{ padding: 'var(--space-lg)' }}>
              <div className="card-header">
                <h3>2025 Season Form Score</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {Object.entries(data.form_score)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([team, val]) => (
                    <div
                      key={team}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: 'var(--space-sm) 0',
                        borderBottom: '1px solid var(--color-surface-highest)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{team}</span>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {val.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceTab;
