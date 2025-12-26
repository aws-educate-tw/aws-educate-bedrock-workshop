import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { ImageWithFallback } from '../components/ImageWithFallback';

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
  const { 
    currentSession, 
    loading, 
    error, 
    makeChoice, 
    finishGame,
    setError,
    apiService
  } = useAppStore();
  
  const [typingComplete, setTypingComplete] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(currentSession?.currentEvent);
  const [eventHistory, setEventHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!currentSession || !apiService) {
      navigate('/');
      return;
    }

    // 如果沒有當前事件，載入一個
    if (!currentEvent && !loading) {
      loadNextEvent();
    }
  }, [currentSession, apiService, navigate]);

  const loadNextEvent = async () => {
    if (!currentSession || !apiService) return;
    
    try {
      const storyResponse = await apiService.generateStory({ 
        session_id: currentSession.sessionId 
      });
      setCurrentEvent(storyResponse);
      setTypingComplete(false);
    } catch (err) {
      // 如果沒有更多事件，結束遊戲
      if (err instanceof Error && err.message.includes('No more events')) {
        await finishGame();
        navigate('/summary');
      } else {
        setError(err instanceof Error ? err.message : '載入事件失敗');
      }
    }
  };

  const handleChoice = async (optionId: string) => {
    if (!currentEvent) return;
    
    await makeChoice(optionId);
    
    // 記錄選擇歷史
    const selectedOption = currentEvent.options.find(opt => opt.option_id === optionId);
    if (selectedOption) {
      setEventHistory(prev => [...prev, selectedOption.description]);
    }
    
    // 清除當前事件，載入下一個
    setCurrentEvent(null);
    
    // 檢查是否達到結束條件（例如 5 個選擇）
    if (eventHistory.length >= 4) { // +1 因為還沒更新 eventHistory
      await finishGame();
      navigate('/summary');
    } else {
      // 載入下一個事件
      setTimeout(loadNextEvent, 1000);
    }
  };

  const handleQuickFinish = async () => {
    await finishGame();
    navigate('/summary');
  };

  if (!currentSession) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">遊戲未初始化</div>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
          >
            返回首頁
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
          <ImageWithFallback
            src={undefined} // 目前使用 placeholder
            alt="遊戲場景"
            className="w-full h-full"
            aspectRatio="16:9"
            fallbackType="scene"
          />
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 border border-white/10 uppercase tracking-widest">
            年齡：{currentSession.playerState?.age || 0} 歲
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
            <Target size={14} /> 現在狀態
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-500">事業</span>
              <span className="font-medium">{currentSession.playerState?.career || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-500">財務</span>
              <span className="font-medium">{currentSession.playerState?.finance || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-500">健康</span>
              <span className="font-medium">{currentSession.playerState?.health || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-500">人際</span>
              <span className="font-medium">{currentSession.playerState?.relationships || 0}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4">
            目標：{currentSession.lifeGoal}
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
            {currentEvent ? (
              <Typewriter 
                text={currentEvent.event_description} 
                onComplete={() => setTypingComplete(true)} 
              />
            ) : (
              <div className="text-slate-400">載入事件中...</div>
            )}
          </div>

          {typingComplete && currentEvent && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-8 space-y-3"
            >
              <div className="grid grid-cols-1 gap-2">
                {currentEvent.options.map((option) => (
                  <button 
                    key={option.option_id}
                    onClick={() => handleChoice(option.option_id)}
                    className="text-left px-5 py-4 bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all text-sm group flex justify-between items-center"
                  >
                    {option.option_id}: {option.description}
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
              
              {/* 測試按鈕 */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-2 text-center">
                  進度: {eventHistory.length}/5 個選擇
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