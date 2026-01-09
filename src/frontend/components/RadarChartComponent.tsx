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
  hideScale?: boolean;
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({ data, hideScale = false }) => {
  // 轉換數據格式為 Recharts 需要的格式
  const chartData = [
    { subject: '智慧', value: data.wisdom },
    { subject: '財富', value: data.wealth },
    { subject: '人際關係', value: data.relationship },
    { subject: '職涯發展', value: data.career },
    { subject: '身心健康', value: data.health },
  ];

  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="#1a1a1a" 
            strokeWidth={1}
            strokeOpacity={0.4}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: '#1a1a1a', 
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Crimson Text, serif'
            }} 
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={hideScale ? false : { 
              fill: '#8b6914', 
              fontSize: 10,
              fontFamily: 'Crimson Text, serif'
            }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="能力值"
            dataKey="value"
            stroke="#1a1a1a"
            fill="#8b6914"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ 
              fill: '#1a1a1a', 
              strokeWidth: 2, 
              stroke: '#f8f6f0',
              r: 4 
            }}
          />
          {/* 輔助線條 */}
          <Radar
            name="輔助線"
            dataKey="value"
            stroke="#8b6914"
            fill="transparent"
            strokeWidth={1}
            strokeOpacity={0.6}
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};