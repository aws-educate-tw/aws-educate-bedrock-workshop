import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronRight, Target, FileText } from 'lucide-react';
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
  const [freeInput, setFreeInput] = useState('');

  // 初始化時自動載入第一個事件
  useEffect(() => {
    if (currentSession && !currentEvent && !loading) {
      console.log('Loading first event...');
      loadNextEvent();
    }
  }, [currentSession, currentEvent, loading]);

  const loadNextEvent = async () => {
    if (!currentSession) return;
    
    console.log('loadNextEvent called, eventHistory.length:', eventHistory.length);
    
    // 使用 mock 事件資料
    const mockEvents = [
      {
        event_id: 'event_1',
        event_description: '你在小學時期遇到了一個轉學生，他看起來很孤單。你會如何對待他？',
        options: [
          { option_id: 'A', description: '主動邀請他一起玩，成為朋友' },
          { option_id: 'B', description: '保持距離，觀察一段時間再說' }
        ]
      },
      {
        event_id: 'event_2',
        event_description: '高中時期，你面臨選擇科系的重要時刻。你的興趣與父母的期望不同。',
        options: [
          { option_id: 'A', description: '堅持自己的興趣，選擇藝術相關科系' },
          { option_id: 'B', description: '聽從父母建議，選擇商科或理工科' }
        ]
      },
      {
        event_id: 'event_3',
        event_description: '剛出社會的你收到兩個工作機會：一個是大公司的穩定職位，另一個是新創公司的挑戰性工作。',
        options: [
          { option_id: 'A', description: '選擇大公司，追求穩定與保障' },
          { option_id: 'B', description: '加入新創公司，追求成長與挑戰' }
        ]
      }
    ];
    
    const eventIndex = eventHistory.length;
    console.log('Event index:', eventIndex, 'Total events:', mockEvents.length);
    
    if (eventIndex < mockEvents.length) {
      const selectedEvent = mockEvents[eventIndex];
      console.log('Setting event:', selectedEvent);
      setCurrentEvent(selectedEvent);
      setTypingComplete(false);
    } else {
      // 沒有更多事件，結束遊戲
      console.log('No more events, finishing game');
      try {
        await finishGame();
      } catch (err) {
        console.error('Finish game error:', err);
      }
      navigate('/summary');
    }
  };

  const handleAction = async (actionType: 'A' | 'B' | 'FREE', freeText?: string) => {
    if (!currentEvent) return;
    
    // 記錄選擇歷史
    const selectedOption = actionType === 'FREE' 
      ? { option_id: 'FREE', description: freeText || '' }
      : currentEvent.options.find(opt => opt.option_id === actionType);
    
    if (selectedOption) {
      setEventHistory(prev => [...prev, selectedOption.description]);
    }
    
    // 清除當前事件，載入下一個
    setCurrentEvent(null);
    
    // 檢查是否達到結束條件（例如 3 個選擇）
    const newHistoryLength = eventHistory.length + 1;
    if (newHistoryLength >= 3) {
      try {
        await finishGame();
      } catch (err) {
        console.error('Finish game error:', err);
      }
      navigate('/summary');
    } else {
      // 載入下一個事件
      setTimeout(loadNextEvent, 1000);
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

  const handleQuickFinish = async () => {
    try {
      await finishGame();
    } catch (err) {
      console.error('Finish game error:', err);
    }
    // 無論是否成功都跳轉
    navigate('/summary');
  };

  if (!currentSession) {
    // 如果沒有 session，創建一個預設的
    const { setCurrentSession } = useAppStore();
    const defaultSession: GameSession = {
      sessionId: 'default-session',
      modelId: 'mock-model',
      background: '你出生在一個普通的中產階級家庭，父母都是上班族。',
      lifeGoal: '成為一個對社會有貢獻的人，同時擁有幸福的家庭生活。',
      playerState: {
        age: 25,
        career: 50,
        finance: 40,
        health: 80,
        relationships: 70,
        traits: ['好奇心旺盛', '善良']
      },
      currentSummary: '你的人生正在展開...'
    };
    setCurrentSession(defaultSession);
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#25344F] via-[#5f4e42] to-[#25344F] text-[#e2e0d3] flex flex-col md:flex-row p-6 gap-6 overflow-hidden relative">
      {/* 魔法粒子背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ceb485]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5f4e42]/10 rounded-full blur-3xl animate-pulse" />
      </div>
      {/* 左側：圖像與狀態 */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="parchment-card rounded-2xl overflow-hidden shadow-2xl group relative z-10">
          <ImageWithFallback
            src={undefined} // 目前使用 placeholder
            alt="遊戲場景"
            className="w-full h-full"
            aspectRatio="16:9"
            fallbackType="scene"
          />
          <div className="absolute top-6 left-6 bg-[#5f4e42]/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-[#ceb485] border border-[#ceb485]/30 uppercase tracking-widest ancient-text">
            年齡：{currentSession.playerState?.age || 0} 歲
          </div>
        </div>
        
        <div className="bg-[#25344F]/80 p-6 rounded-2xl border border-[#ceb485]/30 space-y-4">
          <h4 className="text-xs font-black text-[#5f4e42] uppercase flex items-center gap-2">
            <Target size={14} /> 現在狀況說明
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center text-sm border-b border-[#ceb485]/20 pb-2">
              <span className="text-[#5f4e42]">狀態</span>
              <span className="font-medium text-[#e2e0d3]">年齡 {currentSession.playerState?.age || 0} 歲</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#5f4e42]">目標</span>
              <span className="font-medium text-[#ceb485]">{currentSession.lifeGoal || '載入中...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：故事描述與抉擇 */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="flex-1 bg-[#25344F]/80 p-8 rounded-2xl border border-[#ceb485]/30 flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-[#ceb485]">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">事件描述</span>
          </div>
          
          <div className="text-xl leading-relaxed font-serif text-[#e2e0d3] flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {currentEvent ? (
              <Typewriter 
                text={currentEvent.event_description} 
                onComplete={() => setTypingComplete(true)} 
              />
            ) : (
              '載入事件中...'
            )}
          </div>

          {typingComplete && currentEvent && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-8 space-y-3 relative z-20"
            >
              <div className="grid grid-cols-1 gap-2">
                {currentEvent.options.map((option) => (
                  <button 
                    key={option.option_id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked:', option.option_id);
                      handleAction(option.option_id as 'A' | 'B');
                    }}
                    className="text-left px-5 py-4 bg-[#5f4e42]/50 hover:bg-[#ceb485]/20 border border-[#ceb485]/30 hover:border-[#ceb485]/50 rounded-xl transition-all text-sm group flex justify-between items-center cursor-pointer relative z-30"
                    disabled={loading}
                  >
                    <span className="text-[#e2e0d3]">{option.option_id}: {option.description}</span>
                    <ChevronRight size={16} className="text-[#5f4e42] group-hover:text-[#ceb485]" />
                  </button>
                ))}
              </div>
              
              {/* 測試按鈕 */}
              <div className="mt-4 pt-4 border-t border-[#ceb485]/20">
                <div className="text-xs text-[#5f4e42] mb-2 text-center">
                  進度: {eventHistory.length}/3 個選擇
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Quick finish clicked');
                    handleQuickFinish();
                  }}
                  className="w-full bg-[#632024]/30 hover:bg-[#632024]/50 border border-[#632024]/50 px-4 py-2 rounded-xl text-[#e2e0d3] text-sm transition cursor-pointer relative z-30"
                  disabled={loading}
                >
                  快速結束遊戲（測試用）
                </button>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="mt-8 text-center text-[#5f4e42]">
              處理中...
            </div>
          )}
        </div>

        {/* 自由輸入框 */}
        <div className="bg-[#25344F]/80 p-4 rounded-2xl border border-[#ceb485]/30 shadow-lg relative z-10">
          <div className="flex gap-3">
            <input 
              type="text" 
              maxLength={30}
              className="flex-1 bg-[#5f4e42]/50 border border-[#ceb485]/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ceb485] outline-none transition text-[#e2e0d3] placeholder-[#5f4e42]/70"
              placeholder="或輸入自己的行動 (30字內)..."
              value={freeInput}
              onChange={e => setFreeInput(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Free input submit clicked');
                handleFreeSubmit();
              }}
              disabled={!freeInput.trim() || loading}
              className="bg-[#ceb485] px-6 rounded-xl hover:bg-[#5f4e42] transition shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-30 text-[#25344F]"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-2 text-xs text-[#5f4e42] text-right">
            {freeInput.length}/30
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-[#632024]/20 border border-[#632024]/30 rounded-xl p-4 text-[#e2e0d3]">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs bg-[#632024] hover:bg-[#632024]/80 px-3 py-1 rounded transition text-[#e2e0d3]"
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};