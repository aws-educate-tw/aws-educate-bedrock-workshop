import { Image as ImageIcon } from "lucide-react";
import React, { useState } from "react";

export interface Base64ImageProps {
  base64: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Base64 圖像顯示元件
 *
 * 職責：
 * - 將 API 回應的 Base64 PNG 字串轉換為可顯示的 data: URL
 * - 處理圖像載入失敗的情況（顯示 placeholder）
 * - 支援 null/undefined，安全降級到 placeholder
 *
 * API 對齊：
 * - /generate-background, /generate-story, /resolve-event, /generate-result 均可包含 image: string|null
 * - 前端接收 Base64 PNG 字串，透過本元件安全渲染
 *
 * 使用方式：
 * <Base64Image base64={data.image} alt="遊戲背景" className="w-full h-auto" />
 *
 * Fallback：
 * - 若 base64 為 null/undefined 或載入失敗，顯示灰色 placeholder + 圖示
 */
export const Base64Image: React.FC<Base64ImageProps> = ({
  base64,
  alt,
  className = "w-full h-auto",
  fallbackClassName = "w-full h-64 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center rounded-lg",
}) => {
  const [error, setError] = useState(false);

  if (!base64 || error) {
    return (
      <div className={fallbackClassName}>
        <div className="text-center">
          <ImageIcon size={64} className="text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">圖像無法載入</p>
        </div>
      </div>
    );
  }

  // 自動加上 data: 前綴（若未包含）
  const dataSrc = base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;

  return (
    <img
      src={dataSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

/**
 * 向後相容別名（舊代碼可以繼續使用 ImageWithFallback）
 */
export const ImageWithFallback = Base64Image;
