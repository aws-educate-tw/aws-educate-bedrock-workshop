import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCcw, Facebook, Twitter, Instagram, Link, Calendar, Award, Clock, Trophy } from 'lucide-react';
import { useAppStore } from '../store';
import { exportToJPG } from '../services/export';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState, reset } = useAppStore();
  const [exporting, setExporting] = useState(false);

  if (!summaryState) {
    navigate('/');
    return null;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToJPG('export-area', 'my-life-report');
      alert('匯出成功！');
    } catch (error) {
      alert(`匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleRestart = () => {
    if (confirm('確定要重新開始嗎？')) {
      reset();
      navigate('/');
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleTwitterShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`我的 AI 人生模擬結果：${summaryState.lifeScore}/100 分！`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('連結已複製，可貼到 Instagram！');
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼板！');
    } catch (err) {
      alert('複製失敗，請手動複製');
    }
  };

  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[var(--parchment-bg)] relative magical-aged">
      <div className="absolute inset-0 opacity-5 magical-print">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(201, 184, 150, 0.1) 25%, rgba(201, 184, 150, 0.1) 26%, transparent 27%, transparent 74%, rgba(201, 184, 150, 0.1) 75%, rgba(201, 184, 150, 0.1) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(201, 184, 150, 0.1) 25%, rgba(201, 184, 150, 0.1) 26%, transparent 27%, transparent 74%, rgba(201, 184, 150, 0.1) 75%, rgba(201, 184, 150, 0.1) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10">
        <header className="border-b-4 border-[var(--ink-dark)] bg-[var(--parchment-light)]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="text-center mb-4">
              <h1 className="magical-title text-5xl mb-2">THE DAILY PROPHET</h1>
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="h-px bg-[var(--magical-gold)] flex-1 max-w-32"></div>
                <span className="vintage-magical text-lg">人生成就特刊</span>
                <div className="h-px bg-[var(--magical-gold)] flex-1 max-w-32"></div>
              </div>
              <div className="magical-dateline">
                <Calendar size={14} className="inline mr-2" />
                {currentDate} • 第 {Math.floor(Math.random() * 1000) + 1} 期
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-[var(--parchment-border)]">
              <button
                onClick={() => navigate('/summary')}
                className="flex items-center gap-2 px-4 py-2 magical-button"
              >
                <ArrowLeft size={16} />
                返回總結
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border-2 border-[var(--parchment-border)] p-1">
                  <button onClick={handleFacebookShare} className="p-2 hover:bg-[var(--parchment-border)] transition-all" title="Facebook">
                    <Facebook size={16} className="text-[var(--ink-brown)]" />
                  </button>
                  <button onClick={handleTwitterShare} className="p-2 hover:bg-[var(--parchment-border)] transition-all" title="X (Twitter)">
                    <Twitter size={16} className="text-[var(--ink-brown)]" />
                  </button>
                  <button onClick={handleInstagramShare} className="p-2 hover:bg-[var(--parchment-border)] transition-all" title="Instagram">
                    <Instagram size={16} className="text-[var(--ink-brown)]" />
                  </button>
                  <button onClick={handleCopyLink} className="p-2 hover:bg-[var(--parchment-border)] transition-all" title="複製連結">
                    <Link size={16} className="text-[var(--ink-brown)]" />
                  </button>
                </div>
                
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 magical-button disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting ? '匯出中...' : '下載 JPG'}
                </button>
                
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-red-800 bg-red-50 hover:bg-red-100 transition-all text-red-800"
                >
                  <RefreshCcw size={16} />
                  重新開始
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="magical-article magical-worn">
              <div className="text-center mb-6 border-b-2 border-[var(--parchment-border)] pb-4">
                <h2 className="magical-headline text-2xl mb-2">人生成就錄</h2>
                <div className="flex items-center justify-center gap-2">
                  <Award size={16} className="text-[var(--bronze-accent)]" />
                  <span className="magical-subtitle">解鎖的人生里程碑</span>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto magical-scrollbar">
                {summaryState.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {summaryState.achievements.map((achievement, index) => (
                      <div key={index} className="border-2 border-[var(--parchment-border)] p-4 bg-[var(--parchment-light)]">
                        <div className="flex gap-3 items-start">
                          {achievement.iconUrl ? (
                            <img
                              src={achievement.iconUrl}
                              alt={achievement.title}
                              className="w-10 h-10 magical-photo flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 border-2 border-[var(--ink-dark)] flex items-center justify-center text-sm flex-shrink-0 bg-[var(--parchment-light)]">
                              🏆
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="vintage-magical font-bold mb-1 text-sm">
                              {achievement.title}
                            </h3>
                            <p className="magical-text text-xs leading-relaxed">
                              {achievement.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--bronze-accent)]">
                    <Award size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="magical-text">尚未解鎖成就</p>
                  </div>
                )}
              </div>
            </div>

            <div className="magical-article magical-fold">
              <div className="text-center mb-6 border-b-2 border-[var(--parchment-border)] pb-4">
                <h2 className="magical-headline text-2xl mb-2">人生轉折點</h2>
                <div className="flex items-center justify-center gap-2">
                  <Clock size={16} className="text-[var(--bronze-accent)]" />
                  <span className="magical-subtitle">影響命運的重要抉擇</span>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto magical-scrollbar">
                <div className="space-y-6 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--parchment-border)]"></div>
                  
                  {summaryState.keyChoices.map((choice, index) => (
                    <div key={index} className="flex gap-4 items-start relative">
                      <div className="bg-[var(--ink-dark)] text-[var(--parchment-light)] w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1 border-2 border-[var(--parchment-border)] p-4 bg-[var(--parchment-light)]">
                        <p className="magical-text text-sm leading-relaxed">
                          {choice}
                        </p>
                        <div className="mt-2 text-xs text-[var(--bronze-accent)] italic">
                          第 {index + 1} 個重要決定
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              id="export-area"
              className="magical-card p-6 flex flex-col items-center"
            >
              <div className="text-center mb-6 border-b-2 border-[var(--parchment-border)] pb-4 w-full">
                <h2 className="magical-headline text-2xl mb-2">人生成就海報</h2>
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={16} className="text-[var(--bronze-accent)]" />
                  <span className="magical-subtitle">值得紀念的人生旅程</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl font-black text-[var(--ink-dark)] mb-2 vintage-magical">
                  {summaryState.lifeScore}
                </div>
                <div className="magical-text text-lg font-medium">
                  人生總分 / 100
                </div>
              </div>

              {summaryState.finalImageUrl && (
                <div className="magical-photo mb-6" style={{ maxWidth: '300px' }}>
                  <img
                    src={summaryState.finalImageUrl}
                    alt="人生終章"
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div className="text-center mt-auto pt-6 border-t border-[var(--parchment-border)] w-full">
                <p className="magical-text text-sm opacity-70">
                  THE DAILY PROPHET
                </p>
                <p className="magical-text text-xs opacity-50 mt-1">
                  魔法人生模擬特刊 • 感謝您的參與
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};