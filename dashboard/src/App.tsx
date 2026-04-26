import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { useTheme } from './hooks/useTheme';
import { TOURNAMENTS } from './constants/teams';
import Sidebar from './components/Sidebar';
import HeroChampion from './components/HeroChampion';
import StatCards from './components/StatCards';
import WinProbabilityChart from './components/WinProbabilityChart';
import FeatureRadar from './components/FeatureRadar';
import MatchForecast from './components/MatchForecast';
import IntelligenceTab from './components/IntelligenceTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsDrawer from './components/SettingsDrawer';
import VisualInsights from './components/VisualInsights';
import './index.css';

import TeamInsights from './components/TeamInsights';

const App: React.FC = () => {
  const [tournament, setTournament] = useState('ipl');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const {
    winnerData, modelStats, shapFeatures, schedule,
    intelligenceData, metadata, loading, topTeam,
  } = useDashboardData(tournament);

  const tournamentLabel = TOURNAMENTS.find(t => t.value === tournament)?.label || tournament;

  return (
    <div className="app-layout">
      <Sidebar
        tournament={tournament}
        onTournamentChange={setTournament}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="main-content">
        <div className="main-content-header">
          <div className="header-meta">
            <span className="eyebrow">
              KINETIC MONOLITH v1.0 · AI PLATFORM 
              {metadata && ` · UPDATED: ${metadata.last_updated} · COVERAGE: ${metadata.coverage}`}
            </span>
            <h1>{tournamentLabel}</h1>
          </div>
          <select
            className="form-select"
            value={tournament}
            onChange={(e) => setTournament(e.target.value)}
          >
            {TOURNAMENTS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {activeTab === 'overview' && (
          <div className="fade-in">
            <HeroChampion topTeam={topTeam} loading={loading} />
            <StatCards modelStats={modelStats} shapFeatures={shapFeatures} loading={loading} />
            <div className="two-col-grid">
              <WinProbabilityChart data={winnerData} loading={loading} />
              <FeatureRadar data={shapFeatures} loading={loading} />
            </div>
            <TeamInsights teams={winnerData} loading={loading} />
            <MatchForecast schedule={schedule} loading={loading} />
          </div>
        )}

        {activeTab === 'intelligence' && (
          <IntelligenceTab data={intelligenceData} loading={loading} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab tournament={tournament} />
        )}

        {activeTab === 'visual_insights' && (
          <VisualInsights />
        )}
      </main>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
