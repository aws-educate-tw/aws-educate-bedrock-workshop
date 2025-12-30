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
    <div className="w-full h-64 relative">
      {/* 魔法陣外圈裝飾 */}
      <div className="absolute inset-0 rounded-full border border-[#ceb485]/20 animate-pulse" />
      <div className="absolute inset-2 rounded-full border border-[#ceb485]/10" />
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="#ceb485" 
            strokeWidth={1}
            strokeOpacity={0.3}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: '#ceb485', 
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Crimson Text, serif'
            }} 
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ 
              fill: '#5f4e42', 
              fontSize: 10,
              fontFamily: 'Crimson Text, serif'
            }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="能力值"
            dataKey="value"
            stroke="#ceb485"
            fill="#ceb485"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ 
              fill: '#ceb485', 
              strokeWidth: 2, 
              stroke: '#5f4e42',
              r: 4 
            }}
          />
          {/* 魔法光暈效果 */}
          <Radar
            name="光暈"
            dataKey="value"
            stroke="#5f4e42"
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