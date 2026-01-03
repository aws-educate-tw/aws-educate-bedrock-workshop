import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Facebook, 
  Twitter, 
  Instagram, 
  Link, 
  Download, 
  RefreshCcw,
  Trophy,
  Clock,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { SharePoster } from '../components/SharePoster';
import { useToast } from '../components/Toast';
import html2canvas from 'html2canvas';

export const AchievementPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState, reset } = useAppStore();
  const posterRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // 頁面載入時滾動到頂部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!summaryState) {
    navigate('/summary');
    return null;
  }

  // 分享功能
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
    showToast('連結已複製，可貼到 Instagram！');
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('連結已複製到剪貼板！');
    } catch (err) {
      showToast('複製失敗，請手動複製', 'error');
    }
  };

  const handleDownloadJPG = async () => {
    if (!posterRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#f8f6f0',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `life-report-${summaryState.lifeScore}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('報告已下載成功！');
    } catch (error) {
      showToast('下載失敗，請重試', 'error');
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

  return (
    <div className="prophet-page" style={{ backgroundImage: 'url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <header className="text-center py-4 border-b-2 border-[var(--prophet-border)] relative">
        <button
          onClick={() => navigate('/summary')}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 prophet-button text-sm"
          style={{ transform: 'translateY(-50%)' }}
        >
          <ArrowLeft size={14} />
          返回總結
        </button>
        
        <h1 className="prophet-title text-2xl mb-2">
          {"THE DAILY PROPHET".split("").map((char, index) => (
            <span key={index} className={`${char === 'A' ? 'text-[var(--prophet-accent)] inline-block' : ''}`} style={{ animation: char === 'A' ? 'bounce-a 3s infinite' : 'none' }}>
              {char}
            </span>
          ))}
        </h1>
        <div className="prophet-dateline">
          ★ 人生成就報告特刊 ★
        </div>
        
        <button
          onClick={handleRestart}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 prophet-button text-sm"
          style={{ transform: 'translateY(-50%)' }}
        >
          <RefreshCcw size={14} />
          重新開始
        </button>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-6 min-h-[600px]">
          <div className="col-span-2">
            <div className="prophet-article h-full">
              <h2 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2 flex items-center gap-2">
                <Trophy size={16} className="text-[var(--prophet-accent)]" />
                解鎖成就
              </h2>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {summaryState.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {summaryState.achievements.map((achievement, index) => (
                      <div key={index} className="border border-[var(--prophet-border)] p-3 hover:border-[var(--prophet-dark)] transition-all">
                        <div className="flex gap-3 items-start">
                          {achievement.iconUrl ? (
                            <img src={achievement.iconUrl} alt={achievement.title} className="w-8 h-8 prophet-photo flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 border border-[var(--prophet-dark)] flex items-center justify-center text-sm flex-shrink-0">🏆</div>
                          )}
                          <div className="flex-1">
                            <h3 className="prophet-subtitle font-bold mb-1 text-sm">{achievement.title}</h3>
                            <p className="prophet-small-text leading-relaxed">{achievement.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--prophet-accent)]">
                    <Award size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="prophet-text">尚未解鎖成就</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="prophet-article h-full">
              <h2 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2 flex items-center gap-2">
                <Clock size={16} className="text-[var(--prophet-accent)]" />
                關鍵抉擇
              </h2>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4 relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--prophet-border)]"></div>
                  
                  {summaryState.keyChoices.map((choice, index) => (
                    <div key={index} className="flex gap-3 items-start relative">
                      <div className="bg-[var(--prophet-dark)] text-[var(--prophet-light)] w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1 border border-[var(--prophet-border)] p-3">
                        <p className="prophet-small-text leading-relaxed">{choice}</p>
                        <div className="mt-1 text-xs text-[var(--prophet-accent)]">第 {index + 1} 個重要決定</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="prophet-article h-full">
              <div className="flex justify-between items-center mb-4 border-b border-[var(--prophet-border)] pb-2">
                <h2 className="prophet-headline text-lg flex items-center gap-2">
                  <Share2 size={16} className="text-[var(--prophet-accent)]" />
                  我的人生海報
                </h2>
                
                <div className="flex items-center gap-2 -ml-20">
                  <div className="flex gap-1">
                    <button onClick={handleFacebookShare} className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all" title="Facebook">
                      <Facebook size={14} />
                    </button>
                    <button onClick={handleTwitterShare} className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all" title="X">
                      <Twitter size={14} />
                    </button>
                    <button onClick={handleInstagramShare} className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all" title="Instagram">
                      <Instagram size={14} />
                    </button>
                    <button onClick={handleCopyLink} className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all" title="複製連結">
                      <Link size={14} />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleDownloadJPG}
                    disabled={exporting}
                    className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all disabled:opacity-50"
                    title="下載 JPG"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
              
              <div ref={posterRef} className="w-full flex justify-center">
                <SharePoster
                  finalImageUrl={summaryState.finalImageUrl}
                  lifeScore={summaryState.lifeScore}
                  radar={summaryState.radar}
                  tagline="我的 AI 人生模擬結果"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {ToastComponent}
    </div>
  );
};