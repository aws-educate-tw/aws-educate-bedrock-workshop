import React, { useState } from 'react';
import { User, Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: 'character' | 'scene' | 'poster';
  aspectRatio?: '16:9' | '4:5' | '1:1' | '3:4';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'character',
  aspectRatio = '4:5'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const aspectRatioClasses = {
    '16:9': 'aspect-video',
    '4:5': 'aspect-[4/5]',
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]'
  };

  const fallbackContent = {
    character: {
      icon: <User size={48} className="text-slate-400" />,
      text: '角色圖片',
      gradient: 'from-indigo-900/20 to-purple-900/20'
    },
    scene: {
      icon: <ImageIcon size={48} className="text-slate-400" />,
      text: '場景圖片',
      gradient: 'from-blue-900/20 to-cyan-900/20'
    },
    poster: {
      icon: <ImageIcon size={64} className="text-slate-400" />,
      text: '人生海報',
      gradient: 'from-slate-800 to-slate-900'
    }
  };

  const fallback = fallbackContent[fallbackType];

  // 如果沒有圖片或圖片載入失敗，顯示 placeholder
  if (!src || imageError) {
    return (
      <div className={`
        ${aspectRatioClasses[aspectRatio]} 
        ${className}
        bg-gradient-to-br ${fallback.gradient}
        flex flex-col items-center justify-center
        border border-slate-700/50
        rounded-lg overflow-hidden
        relative
      `}>
        <div className="absolute inset-0 bg-slate-800/30" />
        <div className="relative z-10 text-center">
          {fallback.icon}
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {fallback.text}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            預覽模式
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${aspectRatioClasses[aspectRatio]} ${className} relative overflow-hidden rounded-lg`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <div className="text-slate-400">載入中...</div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
};