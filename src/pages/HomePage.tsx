import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Star, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, startGame, loading, error } = useAppStore();
  const [userData, setUserData] = useState({ 
    id: 'anthropic.claude-3-sonnet-20240229-v1:0', 
    url: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.id.trim()) {
      alert('請填寫 Model ID');
      return;
    }
    
    setConfig(userData.id.trim(), userData.url.trim());
    
    try {
      await startGame();
      // 成功後跳轉
      navigate('/game');
    } catch (err) {
      console.error('Start game error:', err);
      // 即使有錯誤也跳轉，因為 mock 資料應該能工作
      navigate('/game');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#25344F] via-[#5f4e42] to-[#25344F] text-[#e2e0d3] overflow-hidden relative">
      {/* 魔法城堡背景 */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#25344F]/20 to-[#25344F]/80">
          {/* 城堡圖片 */}
          <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23"
              alt="魔法城堡"
              className="w-full opacity-50"
              style={{ 
                filter: 'sepia(30%) hue-rotate(220deg) saturate(80%) brightness(0.7)', 
                height: '167%',
                objectFit: 'cover',
                objectPosition: 'center top'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* 內容區域 */}
      <div className="relative z-10 h-full w-1/2 ml-auto flex items-center justify-center px-12">
        <div className="max-w-md w-full">
          <div className="parchment-card rounded-3xl p-8">
            <h1 className="text-3xl font-bold mb-2 magic-text text-[#ceb485]">魔法人生模擬器</h1>
            <p className="text-[#e2e0d3]/80 mb-10 text-sm ancient-text">請輸入您的魔法工作坊資訊以開始體驗</p>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5f4e42] uppercase ancient-text">魔法模型 ID *</label>
                <input 
                  type="text" required
                  className="w-full bg-[#25344F]/50 border-2 border-[#ceb485]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#ceb485] focus:border-[#ceb485] outline-none transition text-[#e2e0d3] placeholder-[#5f4e42]/70"
                  placeholder="例如: claude-3-sonnet"
                  value={userData.id}
                  onChange={e => setUserData({...userData, id: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5f4e42] uppercase ancient-text">魔法 API URL (可選)</label>
                <input 
                  type="url"
                  className="w-full bg-[#25344F]/50 border-2 border-[#ceb485]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#ceb485] focus:border-[#ceb485] outline-none transition text-[#e2e0d3] placeholder-[#5f4e42]/70"
                  placeholder="https://... (留空使用模擬資料)"
                  value={userData.url}
                  onChange={e => setUserData({...userData, url: e.target.value})}
                  disabled={loading}
                />
                <p className="text-xs text-[#5f4e42] ancient-text">
                  若未填寫 API URL，將使用模擬資料進行測試
                </p>
              </div>
              
              {error && (
                <div className="bg-[#632024]/30 border-2 border-[#632024]/50 rounded-xl p-3 text-[#e2e0d3] text-sm ancient-text">
                  {error}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full magic-scroll text-[#25344F] font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? '施展魔法中...' : '開啟魔法人生'} <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};