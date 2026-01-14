import React from "react";

interface MagicLoadingProps {
  text: string;
  variant?: "default" | "wand" | "stars";
}

export const MagicLoading: React.FC<MagicLoadingProps> = ({ text, variant = "default" }) => {
  if (variant === "wand") {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="relative">
          <div className="w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <span className="prophet-text" style={{ animation: 'strongPulse 2s ease-in-out infinite', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{text}</span>
        <span style={{ animation: 'runeFloat 4s ease-in-out infinite', fontSize: '1rem', color: 'var(--prophet-accent)' }}>🪄</span>
      </div>
    );
  }

  if (variant === "stars") {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="relative">
          <div className="w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <span className="prophet-text" style={{ animation: 'strongPulse 2s ease-in-out infinite' }}>{text}</span>
        <div className="flex gap-1 items-center ml-2">
          <span style={{ animation: 'runeFloat 4s ease-in-out infinite', fontSize: '0.75rem', color: 'var(--prophet-accent)' }}>✦</span>
          <span style={{ animation: 'runeFloat 4s ease-in-out infinite 0.5s', fontSize: '0.75rem', color: 'var(--prophet-accent)' }}>✧</span>
          <span style={{ animation: 'runeFloat 4s ease-in-out infinite 1s', fontSize: '0.75rem', color: 'var(--prophet-accent)' }}>✦</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        <div className="w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-6 h-6 border-2 border-[var(--prophet-accent)] border-t-transparent rounded-full animate-spin opacity-30" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      <span className="prophet-text" style={{ animation: 'strongPulse 2s ease-in-out infinite', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{text}</span>
    </div>
  );
};
