import React from 'react';

interface RadarChartProps {
  data: {
    wisdom: number;
    wealth: number;
    relationship: number;
    career: number;
    health: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 200 }) => {
  const center = size / 2;
  const radius = size / 2 - 20;
  
  const labels = [
    { key: 'wisdom', label: '智慧', angle: 0 },
    { key: 'wealth', label: '財富', angle: 72 },
    { key: 'relationship', label: '人際關係', angle: 144 },
    { key: 'career', label: '職涯發展', angle: 216 },
    { key: 'health', label: '身心健康', angle: 288 }
  ];

  const getPoint = (angle: number, value: number) => {
    const radian = (angle - 90) * Math.PI / 180;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(radian),
      y: center + r * Math.sin(radian)
    };
  };

  const getLabelPoint = (angle: number) => {
    const radian = (angle - 90) * Math.PI / 180;
    const r = radius + 15;
    return {
      x: center + r * Math.cos(radian),
      y: center + r * Math.sin(radian)
    };
  };

  const dataPoints = labels.map(label => 
    getPoint(label.angle, data[label.key as keyof typeof data])
  );

  const pathData = dataPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <div className="radar-chart">
      <svg width={size} height={size}>
        {/* 背景網格 */}
        {[20, 40, 60, 80, 100].map(percent => (
          <polygon
            key={percent}
            points={labels.map(label => {
              const point = getPoint(label.angle, percent);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}
        
        {/* 軸線 */}
        {labels.map(label => {
          const point = getPoint(label.angle, 100);
          return (
            <line
              key={label.key}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}
        
        {/* 數據區域 */}
        <path
          d={pathData}
          fill="rgba(74, 144, 226, 0.3)"
          stroke="#4a90e2"
          strokeWidth="2"
        />
        
        {/* 數據點 */}
        {dataPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#4a90e2"
          />
        ))}
        
        {/* 標籤 */}
        {labels.map(label => {
          const point = getLabelPoint(label.angle);
          return (
            <text
              key={label.key}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="#666"
            >
              {label.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};