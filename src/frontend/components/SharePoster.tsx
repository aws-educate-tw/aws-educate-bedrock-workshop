import React from "react";
import { Base64Image } from "./Base64Image";
import { RadarChartComponent } from "./RadarChartComponent";

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
  tagline = "我的 AI 人生模擬結果",
}) => {
  return (
    <div
      className="w-[375px] h-[700px] border-4 border-[var(--prophet-border)] relative overflow-hidden mx-auto"
      style={{
        backgroundImage:
          "url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 標題區 */}
      <div className="text-center py-4 border-b-2 border-[var(--prophet-border)]">
        <h1 className="prophet-title text-lg mb-1">
          {"THE DAILY PROPHET".split("").map((char, index) => (
            <span
              key={index}
              className={char === "A" ? "text-[var(--prophet-accent)]" : ""}
            >
              {char}
            </span>
          ))}
        </h1>
        <div className="prophet-small-text opacity-70 mb-1">{tagline}</div>
        <div className="prophet-small-text opacity-60 text-xs">
          AWS Educate - Bedrock Workshop
        </div>
      </div>

      {/* 上半部：角色圖片 */}
      <div className="pt-4 px-4">
        <div className="prophet-photo mx-auto mb-4">
          <Base64Image
            base64={finalImageUrl}
            alt="人生角色"
            className="w-full h-[200px] object-cover"
          />
        </div>

        {/* 人生分數 */}
        <div className="text-center">
          <div className="inline-flex items-baseline gap-2 text-[var(--prophet-dark)] mb-1">
            <span className="text-4xl font-black prophet-title">
              {lifeScore}
            </span>
            <span className="prophet-small-text font-medium"> / 100</span>
          </div>
        </div>
      </div>

      {/* 下半部：雷達圖 */}
      <div className="px-4 pb-4 -mt-2">
        <div className="w-full h-[270px]">
          <RadarChartComponent data={radar} hideScale={true} />
        </div>

        {/* 底部品牌 */}
        <div className="text-center mt-4 pt-2 border-t border-[var(--prophet-border)]">
          <div className="prophet-small-text opacity-60">
            2026 Winter AWS Educate 證照陪跑計畫
          </div>
        </div>
      </div>
    </div>
  );
};
