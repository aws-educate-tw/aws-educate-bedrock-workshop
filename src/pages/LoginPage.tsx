import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import { gameService } from '../services/gameService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, setCurrentSession, setGamePhase, setLoading, setError } = useAppStore();
  const [userData, setUserData] = useState({ id: '', url: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.id.trim()) {
      alert('請填寫 Model ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 設定 API 配置
      setConfig(userData.id.trim(), userData.url.trim());
      
      // 如果有 API URL，設定到遊戲服務
      if (userData.url.trim()) {
        gameService.setApiBaseUrl(userData.url.trim());
      }
      
      // 開始遊戲 - 生成背景
      const { session, background } = await gameService.startGame(userData.id.trim());
      
      // 儲存 session 到狀態
      setCurrentSession(session);
      setGamePhase('playing');
      
      // 導向遊戲頁面
      navigate('/game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('遊戲初始化失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#25344F] via-[#5f4e42] to-[#25344F] text-[#e2e0d3] overflow-hidden relative">
      {/* 魔法城堡背景 */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#25344F]/20 to-[#25344F]/80">
          {/* 城堡剪影 */}
          <div className="absolute left-0 bottom-0 w-1/2 h-full flex items-end">
            <svg viewBox="0 0 400 300" className="w-full h-3/4 opacity-60">
              <path d="M50 300 L50 200 L80 200 L80 180 L120 180 L120 160 L160 160 L160 140 L200 140 L200 120 L240 120 L240 140 L280 140 L280 160 L320 160 L320 180 L350 180 L350 200 L380 200 L380 300 Z" fill="#5f4e42" />
              <circle cx="90" cy="170" r="8" fill="#ceb485" opacity="0.8" />
              <circle cx="150" cy="130" r="6" fill="#ceb485" opacity="0.6" />
              <circle cx="250" cy="110" r="10" fill="#ceb485" opacity="1" />
              <circle cx="330" cy="150" r="7" fill="#ceb485" opacity="0.7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 內容區域 */}
      <div className="relative z-10 h-full flex items-center justify-end pr-12">
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
                />
                <p className="text-xs text-[#5f4e42] ancient-text">
                  若未填寫 API URL，將使用模擬資料進行測試
                </p>
              </div>
              <button 
                type="submit"
                className="w-full magic-scroll text-[#25344F] font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                開啟魔法人生 <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};