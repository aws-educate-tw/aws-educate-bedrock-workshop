import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { RadarChartComponent } from '../components/RadarChartComponent';

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState } = useAppStore();

  if (!summaryState) {
    navigate('/');
    return null;
  }

  // 計算整體表現等級
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: '卓越', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 75) return { level: '優秀', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (score >= 60) return { level: '良好', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (score >= 40) return { level: '普通', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    return { level: '待改善', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const performance = getPerformanceLevel(summaryState.lifeScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 頁首區域 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>AI 人生模擬完成</span>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-4">
              人生總結
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              AI 根據你的一生選擇所生成的總體回顧
            </p>
          </div>
        </motion.div>

        {/* 主要內容區 */}
        <div className="flex-1 px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* 左側總結卡片 (60%) */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-3"
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                  {/* 卡片標題 */}
                  <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">人生總結</h2>
                        <p className="text-slate-400 text-sm">你的人生故事回顧</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 總結內容 */}
                  <div className="p-8">
                    <div className="prose prose-lg prose-invert max-w-none">
                      <div className="text-slate-200 leading-relaxed text-lg space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-4">
                        {summaryState.finalSummaryText.split('。').map((sentence, index) => (
                          sentence.trim() && (
                            <motion.p 
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="mb-4"
                            >
                              {sentence.trim()}。
                            </motion.p>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA 按鈕 */}
                  <div className="px-8 py-6 border-t border-white/10 bg-slate-800/30">
                    <button
                      onClick={() => navigate('/achievement')}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <span className="text-lg">查看完整人生成就報告</span>
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* 右側五維分析卡片 (40%) */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden h-full">
                  {/* 卡片標題 */}
                  <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Target size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">人生五維分析</h2>
                        <p className="text-slate-400 text-sm">各項能力評估</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col justify-center flex-1">
                    {/* 雷達圖 */}
                    <div className="mb-8">
                      <RadarChartComponent data={summaryState.radar} />
                    </div>
                    
                    {/* 人生分數展示 */}
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="text-6xl font-black text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-2">
                          {summaryState.lifeScore}
                        </div>
                        <div className="text-slate-400 text-lg font-medium">
                          人生分數 / 100
                        </div>
                      </div>
                      
                      {/* 表現等級 */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 ${performance.bg} border border-current/20 rounded-full`}>
                        <div className={`w-2 h-2 rounded-full ${performance.color.replace('text-', 'bg-')}`} />
                        <span className={`${performance.color} font-semibold text-sm`}>
                          整體表現：{performance.level}
                        </span>
                      </div>
                      
                      {/* 補充說明 */}
                      <p className="text-slate-400 text-sm leading-relaxed mt-4">
                        與理想人生目標的整體達成度評估
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};