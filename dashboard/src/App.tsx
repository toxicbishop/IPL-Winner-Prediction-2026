import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, TrendingUp, ShieldAlert, Zap, Cpu, 
  ChevronRight, Calendar, User, Search, Settings 
} from 'lucide-react';
import './index.css';

interface TeamData {
  team: string;
  prob: number;
  color: string;
}

interface ModelStat {
  name: string;
  acc: string;
  auc: string;
}

interface ShapFeature {
  name: string;
  val: number;
}

const TEAM_COLORS: Record<string, string> = {
  "CSK": "#F9CD02", "MI": "#004BA0", "RCB": "#EC1C24", "KKR": "#3A225D",
  "DC": "#00008B", "PBKS": "#ED1B24", "RR": "#2D9CDB", "SRH": "#F7A721",
  "LSG": "#A2D9CE", "GT": "#1B2A4A",
  // International Men
  "India": "#004BA0", "Australia": "#FFCD00", "England": "#CE1126",
  "South Africa": "#007A4D", "Pakistan": "#115740", "New Zealand": "#000000",
  "West Indies": "#7B121C", "Sri Lanka": "#002F6C", "Afghanistan": "#0048E0",
  "Bangladesh": "#006A4E",
  // International Women
  "India Women": "#004BA0", "Australia Women": "#FFCD00", "England Women": "#CE1126",
  "South Africa Women": "#007A4D", "Pakistan Women": "#115740", "New Zealand Women": "#000000",
  "West Indies Women": "#7B121C", "Sri Lanka Women": "#002F6C",
};

const App: React.FC = () => {
  const [tournament, setTournament] = useState('ipl');
  const [activeTab, setActiveTab] = useState('overview');
  const [winnerData, setWinnerData] = useState<TeamData[]>([]);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [shapFeatures, setShapFeatures] = useState<ShapFeature[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const probRes = await fetch(`http://localhost:8000/api/winner-probabilities?tournament=${tournament}`);
        const probData = await probRes.json();
        if (probData.rankings) {
          setWinnerData(probData.rankings.map((r: any) => ({
            team: r.team_id,
            prob: r.win_probability,
            color: TEAM_COLORS[r.team_id] || "#888"
          })));
        }

        const statsRes = await fetch(`http://localhost:8000/api/model-performance?tournament=${tournament}`);
        const statsData = await statsRes.json();
        if (!statsData.error) {
          setModelStats(Object.entries(statsData).map(([name, s]: [string, any]) => ({
            name: name.toUpperCase(),
            acc: (s.test_accuracy * 100).toFixed(1),
            auc: s.test_roc_auc ? s.test_roc_auc.toFixed(2) : "N/A"
          })));
        } else {
          setModelStats([]);
        }

        const shapRes = await fetch(`http://localhost:8000/api/shap-importance/lightgbm?tournament=${tournament}`);
        const shapData = await shapRes.json();
        if (Array.isArray(shapData)) {
          setShapFeatures(shapData.map(s => ({
            name: s[0].replace(/_/g, ' '),
            val: s[1]
          })));
        }

        const fixtureRes = await fetch(`http://localhost:8000/api/match-fixtures?tournament=${tournament}`);
        const fixtureData = await fixtureRes.json();
        if (Array.isArray(fixtureData)) {
          setSchedule(fixtureData.slice(0, 5));
        } else {
          setSchedule([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Data ingestion failed:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [tournament]);

  const topTeam = winnerData.length > 0 ? winnerData[0] : null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-2xl)' }}>
      {/* Navigation Layer */}
      <nav style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Cpu size={24} color="var(--color-primary)" />
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{tournament.replace('_', ' ')} AI PLATFORM</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <select 
            value={tournament} 
            onChange={(e) => setTournament(e.target.value)}
            style={{ padding: '4px 12px', background: 'var(--color-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ipl">IPL 2026</option>
            <option value="icc_men">ICC Men's T20 WC</option>
            <option value="icc_women">ICC Women's T20 WC</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 var(--space-sm)' }} />
          <div style={{ display: 'flex', gap: 'var(--space-xl)', fontSize: '0.85rem' }}>
            {['Overview', 'Intelligence', 'Analytics'].map(t => (
              <button key={t} onClick={() => setActiveTab(t.toLowerCase())} style={{ background: 'none', border: 'none', color: activeTab === t.toLowerCase() ? 'var(--color-text-main)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600 }}>{t}</button>
            ))}
          </div>
        </div>
        <Settings size={20} color="var(--color-text-muted)" />
      </nav>

      <div className="dashboard-grid">
        {/* Intelligence Core */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="card"
        >
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-xs)' }}>Tournament Success Probability</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Calculated via Stacking Ensemble trained on 1,169 historical matches (2008-2025).</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[...Array(10)].map((_, i) => <div key={i} className="skeleton" style={{ height: '32px', width: '100%' }} />)}
            </div>
          ) : (
            <div style={{ height: '420px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winnerData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="team" type="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                  <Bar dataKey="prob" radius={[0, 2, 2, 0]} barSize={20}>
                    {winnerData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {topTeam && !loading && (
            <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
              <Trophy size={28} color="var(--color-primary)" />
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>Predicted Champion: {topTeam.team}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Statistical confidence: <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{topTeam.prob}%</span>. Driving factors include squad stability and historical playoff conversion rates.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Analytics Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <Zap size={16} color="var(--color-warning)" />
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Performance</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <div className="card" style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ensemble Accuracy</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{loading ? "..." : modelStats.find(m => m.name === 'ENSEMBLE')?.acc}%</div>
              </div>
              <div className="card" style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Models Polled</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{loading ? "..." : modelStats.length}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {modelStats.slice(0, 4).map(m => (
                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <span style={{ fontWeight: 700 }}>{m.acc}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <TrendingUp size={16} color="var(--color-primary)" />
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature Importance</h3>
            </div>
            {loading ? (
               <div className="skeleton" style={{ height: '180px', width: '100%' }} />
            ) : (
              <div style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={shapFeatures}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                    <Radar dataKey="val" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Prediction Schedule */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="card"
            style={{ gridColumn: 'span 2' }}
        >
           <h2 style={{ marginBottom: 'var(--space-lg)' }}>Match Forecast</h2>
           
           <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr' }}>
             <span>Timestamp</span>
             <span>Home Venue</span>
             <span>Away</span>
             <span>Predicted Win</span>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column' }}>
             {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '50px', margin: 'var(--space-sm) 0' }} />)
             ) : (
               schedule.map((match, i) => (
                 <div key={i} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr', fontSize: '0.875rem' }}>
                   <span style={{ color: 'var(--color-text-muted)' }}>{match.date || 'TBD'}</span>
                   <span style={{ fontWeight: 600 }}>{match.team1}</span>
                   <span style={{ fontWeight: 600 }}>{match.team2}</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} />
                     <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{match.predicted_winner}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default App;
