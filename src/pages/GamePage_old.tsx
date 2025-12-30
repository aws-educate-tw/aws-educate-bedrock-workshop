import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronRight, Target, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { ApiService } from '../services/api';

// 打字機效果組件
const Typewriter: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 40, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    if (!text) return;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { modelId, apiBaseUrl, gameState, loading, error, setGameState, setLoading, setError, setSummaryState } = useAppStore();
  const [typingComplete, setTypingComplete] = useState(false);
  const [freeInput, setFreeInput] = useState('');
  const [apiService] = useState(() => new ApiService(apiBaseUrl));
  const [initialized, setInitialized] = useState(false);
  const [gameProgress, setGameProgress] = useState({ clickCount: 0 });

  useEffect(() => {
    if (!modelId || !apiBaseUrl) {
      navigate('/');
      return;
    }

    // 初始化遊戲（只執行一次）
    if (!gameState && !initialized && !loading) {
      setInitialized(true);
      handleAction('A');
    }
  }, [modelId, apiBaseUrl, gameState, initialized, loading, navigate]);

  const handleAction = async (actionType: 'A' | 'B' | 'FREE', freeText?: string) => {
    setLoading(true);
    setError(null);
    setTypingComplete(false);

    try {
      const response = await apiService.play({
        modelId,
        sessionId: gameState?.sessionId,
        actionType,
        freeText
      });

      setGameState({
        sessionId: response.sessionId,
        stage: response.stage,
        imageUrl: response.imageUrl,
        statusText: response.statusText,
        goalText: response.goalText,
        eventText: response.eventText,
        optionA: response.optionA,
        optionB: response.optionB,
        isEnd: response.isEnd
      });

      // 更新進度
      setGameProgress(prev => ({ clickCount: prev.clickCount + 1 }));

      if (response.isEnd) {
        // 獲取總結數據
        const summaryData = await apiService.getSummary(response.sessionId);
        setSummaryState(summaryData);
        navigate('/summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeSubmit = () => {
    if (freeInput.trim().length === 0) return;
    if (freeInput.length > 30) {
      alert('輸入內容不能超過 30 字');
      return;
    }
    
    handleAction('FREE', freeInput.trim());
    setFreeInput('');
  };

  // 加入一個快速結束按鈕用於測試
  const handleQuickFinish = async () => {
    setLoading(true);
    try {
      const summaryData = await apiService.getSummary('test-session');
      setSummaryState(summaryData);
      navigate('/summary');
    } catch (err) {
      setError('無法跳轉到總結頁面');
    } finally {
      setLoading(false);
    }
  };

  if (!gameState && !loading) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">載入中...</div>
          <button 
            onClick={handleQuickFinish}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm"
          >
            快速跳轉到總結頁（測試用）
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
      {/* 左側：圖像與狀態 */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group">
          {gameState?.imageUrl ? (
            <img 
              src={gameState.imageUrl} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]"
              alt="Scene"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
              載入圖片中...
            </div>
          )}
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 border border-white/10 uppercase tracking-widest">
            人生階段：{gameState?.stage || '載入中'}
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
            <Target size={14} /> 現在狀況說明
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-500">狀態</span>
              <span className="font-medium">{gameState?.statusText || '載入中...'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">目標</span>
              <span className="font-medium text-indigo-400">{gameState?.goalText || '載入中...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：故事描述與抉擇 */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="flex-1 bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">事件描述</span>
          </div>
          
          <div className="text-xl leading-relaxed font-serif text-slate-100 flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {gameState?.eventText ? (
              <Typewriter 
                text={gameState.eventText} 
                onComplete={() => setTypingComplete(true)} 
              />
            ) : (
              '載入事件中...'
            )}
          </div>

          {typingComplete && gameState && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-8 space-y-3"
            >
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleAction('A')}
                  className="text-left px-5 py-4 bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all text-sm group flex justify-between items-center"
                >
                  A: {gameState.optionA}
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400" />
                </button>
                <button 
                  onClick={() => handleAction('B')}
                  className="text-left px-5 py-4 bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all text-sm group flex justify-between items-center"
                >
                  B: {gameState.optionB}
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400" />
                </button>
              </div>
              
              {/* 測試按鈕 */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-2 text-center">
                  進度: {gameProgress?.clickCount || 0}/9 個選擇
                </div>
                <button 
                  onClick={handleQuickFinish}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-4 py-2 rounded-xl text-red-300 text-sm transition"
                >
                  快速結束遊戲（測試用）
                </button>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="mt-8 text-center text-slate-500">
              處理中...
            </div>
          )}
        </div>

        {/* 自由輸入框 */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex gap-3">
            <input 
              type="text" 
              maxLength={30}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="或輸入自己的行動 (30字內)..."
              value={freeInput}
              onChange={e => setFreeInput(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleFreeSubmit}
              disabled={!freeInput.trim() || loading}
              className="bg-indigo-600 px-6 rounded-xl hover:bg-indigo-500 transition shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-right">
            {freeInput.length}/30
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-300">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded transition"
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};