import React from 'react';
import { RadarChartComponent } from './RadarChartComponent';
import { ImageWithFallback } from './ImageWithFallback';
import { Trophy, Star, Zap, Calendar } from 'lucide-react';

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
  return (
    <div className="w-[375px] h-[667px] border-4 border-[var(--prophet-border)] relative overflow-hidden mx-auto" style={{ backgroundImage: 'url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* 標題區 */}
      <div className="text-center py-4 border-b-2 border-[var(--prophet-border)]">
        <h1 className="prophet-title text-lg mb-1">
          {"THE DAILY PROPHET".split("").map((char, index) => (
            <span key={index} className={char === 'A' ? 'text-[var(--prophet-accent)]' : ''}>
              {char}
            </span>
          ))}
        </h1>
        <div className="prophet-small-text opacity-70 mb-1">{tagline}</div>
        <div className="prophet-small-text opacity-60 text-xs">AWS Educate - Bedrock Workshop</div>
      </div>

      {/* 上半部：角色圖片 */}
      <div className="p-4">
        <div className="prophet-photo mx-auto mb-4">
          <ImageWithFallback
            src={finalImageUrl}
            alt="人生角色"
            fallbackType="poster"
            aspectRatio="4:5"
            className="w-full h-[200px] object-cover"
          />
        </div>
        
        {/* 人生分數 */}
        <div className="text-center mb-4">
          <div className="text-4xl font-black text-[var(--prophet-dark)] mb-1 prophet-title">
            {lifeScore}
          </div>
          <div className="prophet-small-text font-medium">
            人生總分 / 100
          </div>
        </div>
      </div>

      {/* 下半部：雷達圖 */}
      <div className="px-4 pb-4 -mt-2">
        <div className="w-full h-[250px]">
          <RadarChartComponent data={radar} hideScale={true} />
        </div>
        
        {/* 底部品牌 */}
        <div className="text-center mt-4 pt-2 border-t border-[var(--prophet-border)]">
          <div className="prophet-small-text opacity-60">
            AI 人生模擬器 • 由 Claude AI 生成
          </div>
        </div>
      </div>
    </div>
  );
};