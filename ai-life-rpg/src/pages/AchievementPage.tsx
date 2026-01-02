import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  History, 
  ArrowLeft, 
  Facebook, 
  Twitter, 
  Instagram, 
  Link, 
  Download, 
  RefreshCcw,
  Trophy,
  Clock,
  Share2,
  Sparkles
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

  if (!summaryState) {
    navigate('/');
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
        backgroundColor: '#1e293b',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* 頁首操作列 */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* 左側：返回按鈕 */}
              <button
                onClick={() => navigate('/summary')}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 border border-white/10"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">返回總結</span>
              </button>

              {/* 中間：標題 */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles size={24} className="text-yellow-400" />
                  人生成就報告
                </h1>
                <p className="text-slate-400 text-sm mt-1">您的完整人生旅程回顧</p>
              </div>

              {/* 右側：操作按鈕 */}
              <div className="flex items-center gap-3">
                {/* 社交分享按鈕 */}
                <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
                  <button
                    onClick={handleFacebookShare}
                    className="p-2 hover:bg-blue-600/20 rounded-xl transition-all duration-200 group"
                    title="分享到 Facebook"
                  >
                    <Facebook size={16} className="text-slate-400 group-hover:text-blue-400" />
                  </button>
                  <button
                    onClick={handleTwitterShare}
                    className="p-2 hover:bg-sky-500/20 rounded-xl transition-all duration-200 group"
                    title="分享到 X (Twitter)"
                  >
                    <Twitter size={16} className="text-slate-400 group-hover:text-sky-400" />
                  </button>
                  <button
                    onClick={handleInstagramShare}
                    className="p-2 hover:bg-pink-600/20 rounded-xl transition-all duration-200 group"
                    title="分享到 Instagram"
                  >
                    <Instagram size={16} className="text-slate-400 group-hover:text-pink-400" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-indigo-600/20 rounded-xl transition-all duration-200 group"
                    title="複製連結"
                  >
                    <Link size={16} className="text-slate-400 group-hover:text-indigo-400" />
                  </button>
                </div>

                {/* 功能按鈕 */}
                <button
                  onClick={handleDownloadJPG}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg"
                >
                  <Download size={16} />
                  <span className="font-medium">{exporting ? '匯出中...' : '下載 JPG'}</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl transition-all duration-300 text-red-300 hover:text-red-200"
                >
                  <RefreshCcw size={16} />
                  <span className="font-medium">重新開始</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 左欄：成就 (28%) */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-yellow-900/20 to-orange-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <Trophy size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">解鎖成就</h2>
                      <p className="text-yellow-200/70 text-sm">你的人生成就</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {summaryState.achievements.length > 0 ? (
                    <div className="space-y-4">
                      {summaryState.achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 hover:border-yellow-400/30 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex gap-4 items-start">
                            {achievement.iconUrl ? (
                              <img
                                src={achievement.iconUrl}
                                alt={achievement.title}
                                className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-lg">
                                🏆
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-yellow-200 mb-2 group-hover:text-yellow-100 transition-colors">
                                {achievement.title}
                              </h3>
                              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                {achievement.desc}
                              </p>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                已解鎖
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Award size={48} className="mb-4 opacity-50" />
                      <p className="text-center font-medium">尚未解鎖成就</p>
                      <p className="text-center text-sm mt-2 opacity-70">繼續努力，解鎖更多成就！</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 中欄：關鍵抉擇 (28%) */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Clock size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">關鍵抉擇</h2>
                      <p className="text-blue-200/70 text-sm">影響人生的重要時刻</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-6 relative">
                    {/* 時間軸線 */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-blue-500/30 to-transparent"></div>
                    
                    {summaryState.keyChoices.map((choice, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex gap-4 items-start relative"
                      >
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10 shadow-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1 bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 hover:border-blue-400/30 transition-all duration-300 group">
                          <p className="text-sm text-slate-200 leading-relaxed group-hover:text-white transition-colors">
                            {choice}
                          </p>
                          <div className="mt-2 text-xs text-slate-400">
                            第 {index + 1} 個重要決定
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 右欄：分享海報 (44%) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Share2 size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">我的人生海報</h2>
                        <p className="text-purple-200/70 text-sm">可分享的成果卡片</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full">
                      可匯出 JPG
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div ref={posterRef} className="w-full aspect-[4/5]">
                    <SharePoster
                      finalImageUrl={summaryState.finalImageUrl}
                      lifeScore={summaryState.lifeScore}
                      radar={summaryState.radar}
                      tagline="我的 AI 人生模擬結果"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Toast 通知 */}
      {ToastComponent}
    </div>
  );
};