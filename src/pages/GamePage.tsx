import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronRight, Target, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { GameSession } from '../types/game';
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
    setError,
    setCurrentSession,
    setSummaryState
  } = useAppStore();
  
  const [typingComplete, setTypingComplete] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(currentSession?.currentEvent);
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [freeInput, setFreeInput] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 頁面載入時滾動到頂部
    window.scrollTo(0, 0);
    
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    [cardRef.current, imageRef.current].forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // 初始化時自動載入第一個事件
  useEffect(() => {
    if (currentSession && !currentEvent && !loading) {
      console.log('Loading first event...');
      loadNextEvent();
    }
  }, [currentSession, currentEvent, loading]);

  const loadNextEvent = useCallback(async () => {
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
      const mockSummary = {
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
        keyChoices: eventHistory.length > 0 ? eventHistory : ['進行了完整的人生模擬']
      };
      setSummaryState(mockSummary);
      navigate('/summary');
    }
  }, [currentSession, eventHistory, navigate, setSummaryState]);

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
      // 直接設置模擬的summaryState並跳轉
      const mockSummary = {
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
        keyChoices: [...eventHistory, selectedOption.description]
      };
      setSummaryState(mockSummary);
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
    // 直接設置模擬的summaryState並跳轉
    const mockSummary = {
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
      keyChoices: eventHistory.length > 0 ? eventHistory : [
        '童年時選擇幫助害羞的同學，培養了同理心',
        '學生時期專注學業，奠定了知識基礎',
        '成年後選擇穩定的工作，重視工作生活平衡'
      ]
    };
    setSummaryState(mockSummary);
    navigate('/summary');
  };

  if (!currentSession) {
    // 如果沒有 session，創建一個預設的
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
    <div className="prophet-page" style={{ backgroundImage: 'url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <header className="text-center py-4 border-b-2 border-[var(--prophet-border)]">
        <h1 className="prophet-title text-2xl mb-2">
          {"THE DAILY PROPHET".split("").map((char, index) => (
            <span key={index} className={`${char === 'A' ? 'text-[var(--prophet-accent)] inline-block' : ''}`} style={{ animation: char === 'A' ? 'bounce-a 3s infinite' : 'none' }}>
              {char}
            </span>
          ))}
        </h1>
        <div className="prophet-dateline">
          ★ 人生模擬進行中 ★
        </div>
      </header>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左欄：人物資訊 */}
          <div className="space-y-4">
            <div className="prophet-article">
              <h3 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2">
                人物近影
              </h3>
              <div className="prophet-photo mx-auto mb-4" style={{ maxWidth: '300px' }}>
                <ImageWithFallback
                  src={undefined}
                  alt="遊戲場景"
                  className="w-full h-full"
                  aspectRatio="4:5"
                  fallbackType="scene"
                />
              </div>
              <div className="text-center">
                <p className="prophet-text text-sm">
                  年齡：<span className="font-bold">{currentSession.playerState?.age || 0} 歲</span>
                </p>
              </div>
            </div>
            
            <div className="prophet-article">
              <h4 className="prophet-headline text-base mb-3 flex items-center gap-2">
                <Target size={16} /> 現狀說明
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>狀態</span>
                  <span className="font-bold">年齡 {currentSession.playerState?.age || 0} 歲</span>
                </div>
                <div className="prophet-small-text">
                  <strong>人生目標：</strong>{currentSession.lifeGoal || '載入中...'}
                </div>
              </div>
            </div>
          </div>
          {/* 右欄：主要事件 */}
          <div className="prophet-article">
            <header className="text-center mb-6 border-b-2 border-[var(--prophet-border)] pb-4">
              <h2 className="prophet-headline text-2xl mb-2">人生轉折點</h2>
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} />
                <span className="prophet-small-text uppercase tracking-wide">重要決定時刻</span>
              </div>
            </header>
            
            <div className="prophet-text text-base leading-relaxed mb-6 min-h-[200px] overflow-y-auto custom-scrollbar">
              {currentEvent ? (
                <Typewriter 
                  text={currentEvent.event_description} 
                  onComplete={() => setTypingComplete(true)} 
                />
              ) : (
                '正在載入事件...'
              )}
            </div>

            {typingComplete && currentEvent && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-4"
              >
                <div className="prophet-divider mb-4"></div>
                <h3 className="prophet-subtitle text-base mb-4">您的選擇：</h3>
                
                <div className="space-y-3">
                  {currentEvent.options.map((option) => (
                    <button 
                      key={option.option_id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAction(option.option_id as 'A' | 'B');
                      }}
                      className="w-full text-left p-3 prophet-card border border-[var(--prophet-border)] hover:border-[var(--prophet-dark)] transition-all prophet-text group"
                      disabled={loading}
                    >
                      <div className="flex justify-between items-center">
                        <span><strong>{option.option_id}:</strong> {option.description}</span>
                        <ChevronRight size={16} className="text-[var(--prophet-accent)] group-hover:text-[var(--prophet-dark)]" />
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-[var(--prophet-border)]">
                  <div className="text-center mb-3">
                    <span className="prophet-small-text">進度: {eventHistory.length}/3 個選擇</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuickFinish();
                    }}
                    className="w-full prophet-button py-2 px-4 text-sm"
                    disabled={loading}
                  >
                    快速結束遊戲（測試用）
                  </button>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="text-center prophet-text opacity-70">
                正在處理您的選擇...
              </div>
            )}
            
            {/* 自由輸入框 */}
            <div className="mt-6 pt-4 border-t border-[var(--prophet-border)]">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  maxLength={30}
                  className="flex-1 prophet-input px-3 py-2 text-sm"
                  placeholder="或輸入自己的行動 (30字內)..."
                  value={freeInput}
                  onChange={e => setFreeInput(e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFreeSubmit();
                  }}
                  disabled={!freeInput.trim() || loading}
                  className="prophet-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 text-right">
                <span className="prophet-small-text opacity-60">{freeInput.length}/30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="mx-6 mb-4 border-2 border-red-800 bg-red-50 p-4">
          <p className="prophet-text text-red-800 text-sm mb-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="prophet-text text-red-600 text-xs underline hover:no-underline"
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
};