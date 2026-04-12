import React from 'react';

interface AnalyticsTabProps {
  tournament: string;
}

const API_BASE = 'http://localhost:8000';

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ tournament }) => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Historical Win-Rate Timeline */}
      <div className="card">
        <div className="card-header">
          <h3>Historical Win-Rate Timeline</h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
          Aggregated win rates mapping franchise dominance from 2008 to present day.
        </p>
        <div style={{
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          display: 'flex',
          justifyContent: 'center',
          background: 'var(--color-surface-alt)',
        }}>
          <img
            src={`${API_BASE}/outputs/results/${tournament}/historical_win_rates.png`}
            alt="Historical Win Rates"
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '500px',
              filter: 'var(--img-invert)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>
      </div>

      {/* Model Comparison + SHAP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="card">
          <div className="card-header">
            <h3>Venue / Toss Matrix</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            Cross-referencing toss decision impact across tournament venues.
          </p>
          <img
            src={`${API_BASE}/outputs/results/${tournament}/model_comparison.png`}
            alt="Model Comparison"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 'var(--radius-sm)',
              filter: 'var(--img-invert)',
            }}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Tree Ensemble Explainability</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            Global feature importance via SHAP interpretation.
          </p>
          <img
            src={`${API_BASE}/outputs/results/${tournament}/shap_summary_lightgbm.png`}
            alt="SHAP Summary"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 'var(--radius-sm)',
              filter: 'var(--img-invert)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
