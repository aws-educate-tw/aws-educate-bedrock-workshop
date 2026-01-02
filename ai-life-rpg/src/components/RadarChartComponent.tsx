import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer 
} from 'recharts';

interface RadarChartComponentProps {
  data: {
    wisdom: number;
    wealth: number;
    relationship: number;
    career: number;
    health: number;
  };
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({ data }) => {
  // 轉換數據格式為 Recharts 需要的格式
  const chartData = [
    { subject: '智慧', value: data.wisdom },
    { subject: '財富', value: data.wealth },
    { subject: '人際關係', value: data.relationship },
    { subject: '職涯發展', value: data.career },
    { subject: '身心健康', value: data.health },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="#475569" 
            strokeWidth={1}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: '#94a3b8', 
              fontSize: 12,
              fontWeight: 500
            }} 
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ 
              fill: '#64748b', 
              fontSize: 10 
            }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="能力值"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ 
              fill: '#6366f1', 
              strokeWidth: 2, 
              stroke: '#ffffff',
              r: 4 
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};