import React from 'react';
import { RadarChartComponent } from './RadarChartComponent';
import { ImageWithFallback } from './ImageWithFallback';
import { Trophy, Star, Zap } from 'lucide-react';

interface SharePosterProps {
  finalImageUrl?: string;
  lifeScore: number;
  radar: {
    wisdom: number;
    wealth: number;
    relationship: number;
    career: number;
    health: number;
  };
  tagline?: string;
}

export const SharePoster: React.FC<SharePosterProps> = ({ 
  finalImageUrl, 
  lifeScore, 
  radar, 
  tagline = "我的 AI 人生模擬結果" 
}) => {
  // 計算最高的三個維度
  const topSkills = Object.entries(radar)
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        wisdom: '智慧',
        wealth: '財富', 
        relationship: '人際',
        career: '職業',
        health: '健康'
      };
      return { name: labels[key], value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#ceb485]';
    if (score >= 75) return 'text-[#e2e0d3]';
    if (score >= 60) return 'text-[#5f4e42]';
    return 'text-[#632024]';
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#25344F] via-[#5f4e42] to-[#25344F] rounded-3xl overflow-hidden relative shadow-2xl">
      {/* 背景裝飾 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ceb485]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5f4e42]/10 rounded-full blur-3xl" />
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 h-full flex flex-col">
        {/* 頂部標題區 */}
        <div className="p-6 text-center border-b border-[#ceb485]/20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5f4e42]/30 backdrop-blur-sm rounded-full mb-3">
            <Star size={16} className="text-[#ceb485]" />
            <span className="text-[#e2e0d3] text-sm font-medium">{tagline}</span>
          </div>
        </div>

        {/* 中間內容區 */}
        <div className="flex-1 p-6 grid grid-cols-2 gap-6">
          {/* 左側：角色圖片 */}
          <div className="space-y-4">
            <ImageWithFallback
              src={finalImageUrl}
              alt="人生角色"
              fallbackType="poster"
              aspectRatio="4:5"
              className="w-full shadow-xl"
            />
            
            {/* 優勢技能 */}
            <div className="space-y-2">
              <h4 className="text-[#e2e0d3] text-sm font-semibold flex items-center gap-2">
                <Zap size={14} className="text-[#ceb485]" />
                優勢領域
              </h4>
              <div className="space-y-1">
                {topSkills.map((skill, index) => (
                  <div key={skill.name} className="flex items-center justify-between text-xs">
                    <span className="text-[#e2e0d3]/80">{skill.name}</span>
                    <span className={`font-bold ${getScoreColor(skill.value)}`}>
                      {skill.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右側：雷達圖和分數 */}
          <div className="flex flex-col justify-center">
            {/* 人生分數 */}
            <div className="text-center mb-6">
              <div className="relative">
                <div className={`text-5xl font-black ${getScoreColor(lifeScore)} mb-2`}>
                  {lifeScore}
                </div>
                <div className="text-[#e2e0d3]/70 text-sm font-medium">
                  人生總分
                </div>
                <div className="absolute -top-2 -right-2">
                  <Trophy size={20} className="text-[#ceb485]" />
                </div>
              </div>
            </div>
            
            {/* 小型雷達圖 */}
            <div className="w-full max-w-[200px] mx-auto">
              <RadarChartComponent data={radar} />
            </div>
          </div>
        </div>

        {/* 底部品牌區 */}
        <div className="p-4 border-t border-[#ceb485]/20 bg-[#25344F]/50">
          <div className="flex items-center justify-between">
            <div className="text-[#5f4e42] text-xs">
              AI 人生模擬器
            </div>
            <div className="text-[#5f4e42]/70 text-xs">
              由 Claude AI 生成
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};