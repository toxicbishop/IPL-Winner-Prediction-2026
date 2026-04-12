import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { ShapFeature } from '../constants/teams';

interface FeatureRadarProps {
  data: ShapFeature[];
  loading: boolean;
}

const FeatureRadar: React.FC<FeatureRadarProps> = ({ data, loading }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Feature Importance</h3>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: '280px', width: '100%' }} />
      ) : (
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              />
              <Radar
                dataKey="val"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FeatureRadar;
