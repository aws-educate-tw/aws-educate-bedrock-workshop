import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* 左側裝飾區塊 */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-900 to-slate-900 items-center justify-center p-12 relative">
        <div className="absolute inset-0 opacity-20"></div>
        <div className="z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Sparkles size={120} className="text-indigo-400 mx-auto" />
          </motion.div>
          <h2 className="text-4xl font-black tracking-widest mb-4">LIFE SIMULATOR</h2>
          <p className="text-indigo-200/60 uppercase tracking-widest text-sm">Empowered by AWS Bedrock</p>
        </div>
      </div>
      
      {/* 右側登入表單 */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-12 bg-slate-800/30 backdrop-blur-xl">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">AI 人生模擬器</h1>
          <p className="text-slate-400 mb-10 text-sm">請輸入您的工作坊資訊以開始體驗</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Model ID *</label>
              <input 
                type="text" required
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="例如: claude-3-sonnet"
                value={userData.id}
                onChange={e => setUserData({...userData, id: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">API URL (可選)</label>
              <input 
                type="url"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="https://... (留空使用模擬資料)"
                value={userData.url}
                onChange={e => setUserData({...userData, url: e.target.value})}
              />
              <p className="text-xs text-slate-500">
                若未填寫 API URL，將使用模擬資料進行測試
              </p>
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
              進入人生 <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};