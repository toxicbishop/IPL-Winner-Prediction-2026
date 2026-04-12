import React from 'react';
import { Cpu, BarChart3, Brain, LineChart, Settings, Sun, Moon } from 'lucide-react';
import { TOURNAMENTS } from '../constants/teams';

interface SidebarProps {
  tournament: string;
  onTournamentChange: (t: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsOpen: () => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
];

const Sidebar: React.FC<SidebarProps> = ({
  tournament, onTournamentChange, activeTab, onTabChange,
  onSettingsOpen, theme, onThemeToggle
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Cpu size={24} />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tournament" title="Switch Tournament">
          <select
            className="form-select"
            value={tournament}
            onChange={(e) => onTournamentChange(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '44px',
              height: '44px',
              cursor: 'pointer',
            }}
          >
            {TOURNAMENTS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Cpu size={16} style={{ color: 'var(--color-text-muted)' }} />
        </div>

        <button onClick={onThemeToggle} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button onClick={onSettingsOpen} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
