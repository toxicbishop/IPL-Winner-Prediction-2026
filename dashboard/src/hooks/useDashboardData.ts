import { useState, useEffect } from 'react';
import { TeamData, ModelStat, ShapFeature, MatchFixture, IntelligenceData, TEAM_COLORS } from '../constants/teams';

const API_BASE = 'http://localhost:8000';

export function useDashboardData(tournament: string) {
  const [winnerData, setWinnerData] = useState<TeamData[]>([]);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [shapFeatures, setShapFeatures] = useState<ShapFeature[]>([]);
  const [schedule, setSchedule] = useState<MatchFixture[]>([]);
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all endpoints in parallel
        const [probRes, statsRes, shapRes, fixtureRes, intRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/winner-probabilities?tournament=${tournament}`),
          fetch(`${API_BASE}/api/model-performance?tournament=${tournament}`),
          fetch(`${API_BASE}/api/shap-importance/lightgbm?tournament=${tournament}`),
          fetch(`${API_BASE}/api/match-fixtures?tournament=${tournament}`),
          fetch(`${API_BASE}/api/intelligence?tournament=${tournament}`),
        ]);

        // Winner probabilities
        if (probRes.status === 'fulfilled') {
          const data = await probRes.value.json();
          if (data.rankings) {
            setWinnerData(data.rankings.map((r: any) => ({
              team: r.team_id,
              prob: r.win_probability,
              color: TEAM_COLORS[r.team_id] || '#64748b',
            })));
          }
        }

        // Model performance
        if (statsRes.status === 'fulfilled') {
          const data = await statsRes.value.json();
          if (!data.error) {
            setModelStats(Object.entries(data).map(([name, s]: [string, any]) => ({
              name: name.toUpperCase(),
              acc: (s.test_accuracy * 100).toFixed(1),
              auc: s.test_roc_auc ? s.test_roc_auc.toFixed(2) : 'N/A',
            })));
          } else {
            setModelStats([]);
          }
        }

        // SHAP features
        if (shapRes.status === 'fulfilled') {
          const data = await shapRes.value.json();
          if (Array.isArray(data)) {
            setShapFeatures(data.map((s: any) => ({
              name: s[0].replace(/_/g, ' '),
              val: s[1],
            })));
          }
        }

        // Match fixtures
        if (fixtureRes.status === 'fulfilled') {
          const data = await fixtureRes.value.json();
          if (Array.isArray(data)) {
            setSchedule(data.slice(0, 5));
          } else {
            setSchedule([]);
          }
        }

        // Intelligence data
        if (intRes.status === 'fulfilled') {
          const data = await intRes.value.json();
          if (!data.error) {
            setIntelligenceData(data);
          }
        }
      } catch (err) {
        console.error('Data ingestion failed:', err);
        setError('Failed to connect to the backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournament]);

  const topTeam = winnerData.length > 0 ? winnerData[0] : null;

  return {
    winnerData,
    modelStats,
    shapFeatures,
    schedule,
    intelligenceData,
    loading,
    error,
    topTeam,
  };
}
