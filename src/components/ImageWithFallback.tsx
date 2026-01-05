import { Image as ImageIcon } from "lucide-react";
import React, { useState } from "react";

export interface Base64ImageProps {
  base64: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * 統一處理 Base64 PNG 圖像顯示
 * - 若無圖像或載入失敗，顯示 placeholder
 * - base64 可直接傳入，無需手動加 data: 前綴
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

// 向後相容：舊名稱別名
export const ImageWithFallback = Base64Image;
