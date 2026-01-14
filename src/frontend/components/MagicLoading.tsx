import React from "react";

interface MagicLoadingProps {
  text: string;
}

export const MagicLoading: React.FC<MagicLoadingProps> = ({ text }) => {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        <div className="w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      <span className="prophet-text animate-pulse">{text}</span>
    </div>
  );
};
