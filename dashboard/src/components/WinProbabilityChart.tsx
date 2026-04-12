import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TeamData } from '../constants/teams';

interface WinProbabilityChartProps {
  data: TeamData[];
  loading: boolean;
}

const WinProbabilityChart: React.FC<WinProbabilityChartProps> = ({ data, loading }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Win Probability</h3>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '24px', width: '100%' }} />
          ))}
        </div>
      ) : (
        <div style={{ height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="team" type="category"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }}
                axisLine={false} tickLine={false} width={48}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                }}
                formatter={(value: number) => [`${value}%`, 'Probability']}
              />
              <Bar dataKey="prob" radius={[0, 3, 3, 0]} barSize={18}>
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WinProbabilityChart;
