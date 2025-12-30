import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Target, Sparkles, Scroll, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { RadarChartComponent } from '../components/RadarChartComponent';

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState } = useAppStore();

  if (!summaryState) {
    // 如果沒有 summaryState，使用預設資料
    const { setSummaryState } = useAppStore();
    const defaultSummary: SummaryState = {
      lifeScore: 75,
      radar: {
        wisdom: 80,
        wealth: 65,
        relationship: 90,
        career: 70,
        health: 80
      },
      finalSummaryText: '你度過了充實而有意義的一生。從小就展現出的善良和智慧，讓你在人生的各個階段都能做出正確的選擇。你重視人際關係，也不忘記持續學習和成長。',
      achievements: [
        { title: '智慧者', desc: '在人生中展現出卓越的智慧' },
        { title: '人際達人', desc: '擁有良好的人際關係網絡' }
      ],
      keyChoices: [
        '童年時選擇幫助害羞的同學，培養了同理心',
        '學生時期專注學業，奠定了知識基礎',
        '成年後選擇穩定的工作，重視工作生活平衡'
      ]
    };
    setSummaryState(defaultSummary);
    return null;
  }

  // 計算整體表現等級
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: '卓越', color: 'text-[#ceb485]', bg: 'bg-[#ceb485]/10' };
    if (score >= 75) return { level: '優秀', color: 'text-[#5f4e42]', bg: 'bg-[#5f4e42]/10' };
    if (score >= 60) return { level: '良好', color: 'text-[#e2e0d3]', bg: 'bg-[#e2e0d3]/10' };
    if (score >= 40) return { level: '普通', color: 'text-[#5f4e42]', bg: 'bg-[#5f4e42]/10' };
    return { level: '待改善', color: 'text-[#632024]', bg: 'bg-[#632024]/10' };
  };

  const performance = getPerformanceLevel(summaryState.lifeScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25344F] via-[#5f4e42] to-[#25344F] relative">
      {/* 魔法背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ceb485]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5f4e42]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#632024]/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 頁首區域 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ceb485]/10 border border-[#ceb485]/20 rounded-full text-[#ceb485] text-sm font-medium mb-6">
              <Crown size={16} />
              <span className="ancient-text">魔法人生模擬完成</span>
            </div>
            
            <h1 className="text-5xl font-bold text-[#ceb485] mb-4 magic-text">
              人生總結
            </h1>
            
            <p className="text-xl text-[#e2e0d3]/80 max-w-2xl mx-auto leading-relaxed ancient-text">
              魔法 AI 根據你的一生選擇所生成的總體回顧
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
                <div className="parchment-card rounded-3xl shadow-2xl overflow-hidden">
                  {/* 卡片標題 */}
                  <div className="px-8 py-6 border-b border-[#ceb485]/20 bg-gradient-to-r from-[#25344F]/50 to-[#5f4e42]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ceb485]/20 rounded-xl flex items-center justify-center">
                        <Scroll size={20} className="text-[#ceb485]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#ceb485] magic-text">人生總結</h2>
                        <p className="text-[#e2e0d3]/70 text-sm ancient-text">你的人生故事回顧</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 總結內容 */}
                  <div className="p-8">
                    <div className="prose prose-lg prose-invert max-w-none">
                      <div className="text-[#e2e0d3] leading-relaxed text-lg space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-4 ancient-text">
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
                  <div className="px-8 py-6 border-t border-[#ceb485]/20 bg-[#25344F]/30">
                    <button
                      onClick={() => navigate('/achievement')}
                      className="w-full magic-scroll text-[#25344F] font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
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
                <div className="parchment-card rounded-3xl shadow-2xl overflow-hidden h-full">
                  {/* 卡片標題 */}
                  <div className="px-8 py-6 border-b border-[#ceb485]/20 bg-gradient-to-r from-[#25344F]/50 to-[#5f4e42]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#5f4e42]/20 rounded-xl flex items-center justify-center">
                        <Target size={20} className="text-[#5f4e42]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#ceb485] magic-text">人生五維分析</h2>
                        <p className="text-[#e2e0d3]/70 text-sm ancient-text">各項能力評估</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col justify-center flex-1">
                    {/* 雷達圖 */}
                    <div className="mb-8 magic-circle">
                      <RadarChartComponent data={summaryState.radar} />
                    </div>
                    
                    {/* 人生分數展示 */}
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="text-6xl font-black text-transparent bg-gradient-to-r from-[#ceb485] to-[#5f4e42] bg-clip-text mb-2 magic-text">
                          {summaryState.lifeScore}
                        </div>
                        <div className="text-[#e2e0d3] text-lg font-medium ancient-text">
                          人生分數 / 100
                        </div>
                      </div>
                      
                      {/* 表現等級 */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 ${performance.bg} border border-current/20 rounded-full`}>
                        <div className={`w-2 h-2 rounded-full ${performance.color.replace('text-', 'bg-')}`} />
                        <span className={`${performance.color} font-semibold text-sm ancient-text`}>
                          整體表現：{performance.level}
                        </span>
                      </div>
                      
                      {/* 補充說明 */}
                      <p className="text-[#e2e0d3]/70 text-sm leading-relaxed mt-4 ancient-text">
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