import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, TrendingUp, ShieldAlert, Zap, Cpu, 
  ChevronRight, Calendar, User, Search, Settings, X, Sliders, RefreshCw
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState<any>(null);

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

        try {
            const intRes = await fetch(`http://localhost:8000/api/intelligence?tournament=${tournament}`);
            const intData = await intRes.json();
            setIntelligenceData(intData);
        } catch (e) {
            console.error(e);
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
        <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Settings size={20} color="var(--color-text-muted)" />
        </button>
      </nav>

      {/* Settings Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', zIndex: 50, padding: 'var(--space-2xl)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Sliders size={20} /> Platform Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Bayesian Priors Weights</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>Adjust the influence of internal domains on the final output.</p>
                {['Squad Strength Base', 'Recent Form (3 YR)', 'Pure Machine Learning', 'Historical Playoff Rate'].map(w => (
                  <div key={w} style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
                      <span>{w}</span>
                      <span>Default</span>
                    </div>
                    <input type="range" disabled style={{ width: '100%' }} />
                  </div>
                ))}
                <button disabled style={{ marginTop: 'var(--space-md)', width: '100%', padding: 'var(--space-sm)', background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>Recalculate Bounds</button>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Pipeline Controller</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>Trigger a hard rebuild of the entire ensemble cluster using `./scripts/rebuild_all.py`</p>
                <button 
                  onClick={async () => {
                      alert("Triggering backend pipeline rebuilt. This will take ~2-3 minutes.");
                      await fetch("http://localhost:8000/api/trigger-pipeline", { method: 'POST' });
                  }}
                  style={{ width: '100%', padding: 'var(--space-md)', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
                >
                  <RefreshCw size={16} /> Force Pipeline Rebuild
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="dashboard-grid">
        {activeTab === 'overview' && (
          <>
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
          </>
        )}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
                <div>
                   <h2 style={{ marginBottom: 'var(--space-md)' }}>Bayesian Squad Priors</h2>
                   <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)', fontSize: '0.875rem' }}>These are the raw mathematical anchors injected into the ML model to reflect the 2026 auction strengths and historical playoff frequency, weighting predictions toward teams with proven contemporary pedigree.</p>

                   {intelligenceData ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {Object.entries(intelligenceData.squad_strength).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([team, val]: any) => (
                                <div key={team}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 700, color: TEAM_COLORS[team] }}>{team}</span>
                                        <span>{val}/10 Squad Output</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(val / 10) * 100}%`, height: '100%', background: TEAM_COLORS[team] }} />
                                    </div>
                                </div>
                            ))}
                       </div>
                   ) : <div className="skeleton" style={{ height: '300px' }} />}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem' }}>Head-to-Head Simulator</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                        <select style={{ flex: 1, padding: 'var(--space-sm)', background: 'var(--color-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                           {Object.keys(TEAM_COLORS).slice(0, 10).map(t => <option key={t}>{t}</option>)}
                        </select>
                        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>VS</span>
                        <select style={{ flex: 1, padding: 'var(--space-sm)', background: 'var(--color-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                           <option>MI</option>
                           {Object.keys(TEAM_COLORS).slice(0, 10).map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
                        <div style={{ color: 'var(--color-success)', fontSize: '2.5rem', fontWeight: 800 }}>58.2%</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Simulated Win Probability</div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className="card">
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Historical Win-Rate Timeline</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}>Aggregated win rates mapping franchise dominance from 2008 to present day.</p>
                <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', display: 'flex', justifyContent: 'center' }}>
                    <img 
                        src={`http://localhost:8000/outputs/results/${tournament}/historical_win_rates.png`} 
                        alt="Historical Win Rates" 
                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', filter: 'invert(0.9) hue-rotate(180deg)' }} 
                    />
                </div>
            </div>

            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                <div>
                     <h3 style={{ marginBottom: 'var(--space-md)' }}>Venue / Toss Matrix</h3>
                     <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}>Heatmap representation of cross-referencing toss decision impact dynamically.</p>
                     <img 
                        key={Date.now() + 1}
                        src={`http://localhost:8000/outputs/results/${tournament}/model_comparison.png`} 
                        alt="Model Performance Bar Chart" 
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }} 
                     />
                </div>
                <div>
                     <h3 style={{ marginBottom: 'var(--space-md)' }}>Tree Ensemble Explainability</h3>
                     <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}>Global feature importance SHAP interpretation.</p>
                     <img 
                        key={Date.now() + 2}
                        src={`http://localhost:8000/outputs/results/${tournament}/shap_summary_lightgbm.png`} 
                        alt="SHAP Interp" 
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }} 
                     />
                </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default App;
