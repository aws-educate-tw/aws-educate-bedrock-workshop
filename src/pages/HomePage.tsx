import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Star, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, loading, error, setCurrentSession } = useAppStore();
  const [userData, setUserData] = useState({ 
    id: 'anthropic.claude-3-sonnet-20240229-v1:0', 
    url: '' 
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [titleAnimated, setTitleAnimated] = useState(false);

  useEffect(() => {
    // 頁面載入時滾動到頂部
    window.scrollTo(0, 0);
    
    // 播放哈利波特主題曲
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.3;
          // 需要用戶互動才能播放音頻
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        }
      } catch (error) {
        console.log('音頻播放失敗:', error);
        // 如果自動播放失敗，等待用戶點擊
        const handleUserInteraction = async () => {
          try {
            if (audioRef.current) {
              await audioRef.current.play();
              document.removeEventListener('click', handleUserInteraction);
            }
          } catch (e) {
            console.log('用戶互動後播放失敗:', e);
          }
        };
        document.addEventListener('click', handleUserInteraction, { once: true });
      }
    };
    
    playAudio();
    
    // 延遲啟動標題動畫
    const timer = setTimeout(() => {
      setTitleAnimated(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.id.trim()) {
      alert('請填寫 Model ID');
      return;
    }
    
    // 直接設置配置並跳轉到遊戲頁面
    setConfig(userData.id.trim(), userData.url.trim());
    
    // 創建預設的 session
    const defaultSession = {
      sessionId: 'default-session',
      modelId: userData.id.trim(),
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
    navigate('/game');
  };

  return (
    <div className="prophet-page min-h-screen flex flex-col" style={{ backgroundImage: 'url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* 背景音樂 */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/hedwigs-theme.mp3" type="audio/mpeg" />
      </audio>
      
      {/* 預言家日報頭版 */}
      <header className="text-center py-4 border-b-4 border-[var(--prophet-border)]">
        <div className="mb-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-xs prophet-text tracking-widest">Vol. CDXII</div>
            <div className="h-px bg-[var(--prophet-border)] flex-1 max-w-16"></div>
            <div className="text-xs prophet-text tracking-widest">No. 26,124</div>
          </div>
          
          {/* 動畫標題 */}
          <div className="prophet-masthead mb-2">
            {titleAnimated ? (
              "THE DAILY PROPHET".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  }}
                  className={`inline-block ${char === 'A' ? 'text-[var(--prophet-accent)]' : ''}`}
                  style={{ 
                    marginRight: char === " " ? "0.5em" : "0"
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))
            ) : (
              <span style={{ opacity: 0 }}>THE DAILY PROPHET</span>
            )}
          </div>
          
          <div className="prophet-dateline mb-4">
            ★ THE WIZARD WORLD'S BEGUILING BROADSHEET OF CHOICE ★
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <div className="h-px bg-[var(--prophet-accent)] flex-1 max-w-32"></div>
          <span className="prophet-subtitle text-lg">魔法人生模擬特刊</span>
          <div className="h-px bg-[var(--prophet-accent)] flex-1 max-w-32"></div>
        </div>
      </header>
      
      {/* 主要版面 - 三欄報紙布局 */}
      <div className="flex-1 p-4 flex items-stretch pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-h-[calc(100vh-280px)]">
          {/* 左欄：魔法照片 */}
          <div className="prophet-article flex flex-col">
            <h3 className="prophet-headline text-lg mb-2 border-b border-[var(--prophet-border)] pb-1">
              霍格華茲魔法學院
            </h3>
            <div className="prophet-photo group cursor-pointer flex-1">
              <motion.img 
                src="https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/home_nufsc7.png"
                alt="魔法城堡"
                className="w-full h-full max-h-[calc(100vh-300px)] object-cover transition-all duration-500"
                whileHover={{ 
                  rotateY: [-5, 5, -5, 5, 0],
                  transition: { duration: 0.6, ease: "easeInOut" }
                }}
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-yellow-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                whileHover={{ opacity: 0.3 }}
              />
            </div>
          </div>
          
          {/* 中欄：主要文章 */}
          <div className="prophet-article flex flex-col">
            <h2 className="prophet-headline text-2xl mb-2 border-b-2 border-[var(--prophet-border)] pb-1">
              開始您的魔法人生
            </h2>
            <div className="prophet-divider mb-2"></div>
            
            <form className="space-y-3 flex-1 flex flex-col justify-between" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="block prophet-text font-bold text-sm">
                  魔法模型識別碼
                </label>
                <input 
                  type="text" required
                  className="w-full prophet-input px-3 py-1.5 text-sm"
                  placeholder="例如: claude-3-sonnet"
                  value={userData.id}
                  onChange={e => setUserData({...userData, id: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="flex-1 min-h-[100px]"></div>
              
              {error && (
                <div className="border-2 border-red-800 bg-red-50 p-3">
                  <p className="prophet-text text-red-800 text-sm">{error}</p>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full prophet-button py-2 px-4 disabled:opacity-50"
              >
                {loading ? '正在準備您的魔法人生...' : '開始人生模擬'}
              </button>
            </form>
          </div>
          
          {/* 右欄：魔法部公告與資訊 */}
          <div className="flex flex-col">
            <div className="prophet-article mb-2">
              <h4 className="prophet-headline text-sm mb-2 border-b border-[var(--prophet-border)] pb-1">
                魔法部公告
              </h4>
              <div className="prophet-small-text">
                ⚡ 人生模擬魔法已通過魔法部安全認證<br/>
                🔮 使用最新 AWS Bedrock 魔法技術<br/>
                📜 完全符合巫師隱私保護法規
              </div>
            </div>
            
            <div className="prophet-article flex-1">
              <h4 className="prophet-headline text-sm mb-2 border-b border-[var(--prophet-border)] pb-1">
                使用說明
              </h4>
              <div className="prophet-small-text space-y-1">
                <p>1. 輸入您的魔法模型識別碼</p>
                <p>2. 可選擇性提供 API 連結</p>
                <p>3. 點擊開始按鈕啟動模擬</p>
                <p>4. 跟隨指引完成人生選擇</p>
                <p>5. 獲得完整的人生報告</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
};