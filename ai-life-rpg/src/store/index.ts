import { create } from 'zustand';
import { GameSession, FrontendRadarData, mapRadarData, ResultResponse } from '../types/game';
import { GameApiService } from '../services/gameApi';

// 既有的型別定義保持不變
export interface GameState {
  sessionId?: string;
  stage: 'childhood' | 'student' | 'adult' | 'elder';
  imageUrl?: string;
  statusText: string;
  goalText: string;
  eventText: string;
  optionA: string;
  optionB: string;
  isEnd: boolean;
}

export interface SummaryState {
  lifeScore: number;
  radar: FrontendRadarData;
  finalSummaryText: string;
  achievements: Achievement[];
  keyChoices: string[];
  finalImageUrl?: string;
}

export interface Achievement {
  title: string;
  desc: string;
  iconUrl?: string;
}

// 新增遊戲 session 狀態
export interface AppState {
  // 既有狀態
  modelId: string;
  apiBaseUrl: string;
  gameState: GameState | null;
  summaryState: SummaryState | null;
  loading: boolean;
  error: string | null;
  
  // 新增遊戲 session 狀態
  currentSession: GameSession | null;
  gamePhase: 'setup' | 'playing' | 'summary' | 'report';
  apiService: GameApiService | null;
  
  // 既有方法
  setConfig: (modelId: string, apiBaseUrl: string) => void;
  setGameState: (state: GameState) => void;
  setSummaryState: (state: SummaryState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // 新增遊戲 session 方法
  setCurrentSession: (session: GameSession | null) => void;
  setGamePhase: (phase: 'setup' | 'playing' | 'summary' | 'report') => void;
  updateSessionData: (updates: Partial<GameSession>) => void;
  
  // 新增遊戲流程方法
  startGame: () => Promise<void>;
  makeChoice: (optionId: string) => Promise<void>;
  finishGame: () => Promise<void>;
}

// 從 localStorage 讀取 session
const loadSessionFromStorage = (): GameSession | null => {
  try {
    const stored = localStorage.getItem('game_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// 儲存 session 到 localStorage
const saveSessionToStorage = (session: GameSession | null) => {
  try {
    if (session) {
      localStorage.setItem('game_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('game_session');
    }
  } catch {
    // 忽略儲存錯誤
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // 既有狀態初始值
  modelId: '',
  apiBaseUrl: '',
  gameState: null,
  summaryState: null,
  loading: false,
  error: null,
  
  // 新增狀態初始值
  currentSession: loadSessionFromStorage(),
  gamePhase: 'setup',
  apiService: null,
  
  // 既有方法
  setConfig: (modelId: string, apiBaseUrl: string) => {
    const apiService = new GameApiService(apiBaseUrl);
    set({ modelId, apiBaseUrl, apiService });
  },
  
  setGameState: (gameState: GameState) => 
    set({ gameState }),
  
  setSummaryState: (summaryState: SummaryState) => 
    set({ summaryState }),
  
  setLoading: (loading: boolean) => 
    set({ loading }),
  
  setError: (error: string | null) => 
    set({ error }),
  
  reset: () => {
    saveSessionToStorage(null);
    set({ 
      modelId: '', 
      apiBaseUrl: '', 
      gameState: null, 
      summaryState: null, 
      loading: false, 
      error: null,
      currentSession: null,
      gamePhase: 'setup',
      apiService: null
    });
  },
    
  // 新增方法
  setCurrentSession: (currentSession: GameSession | null) => {
    saveSessionToStorage(currentSession);
    set({ currentSession });
  },
    
  setGamePhase: (gamePhase: 'setup' | 'playing' | 'summary' | 'report') =>
    set({ gamePhase }),
    
  updateSessionData: (updates: Partial<GameSession>) => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      saveSessionToStorage(updatedSession);
      set({ currentSession: updatedSession });
    }
  },
  
  // 新增遊戲流程方法
  startGame: async () => {
    const { modelId, apiService, setLoading, setError, setCurrentSession, setGamePhase } = get();
    
    if (!apiService) {
      setError('API 服務未初始化');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const backgroundResponse = await apiService.generateBackground({ model_id: modelId });
      
      const session: GameSession = {
        sessionId: backgroundResponse.session_id,
        modelId,
        background: backgroundResponse.background,
        lifeGoal: backgroundResponse.life_goal,
        playerState: {
          age: backgroundResponse.player_identity.age,
          career: 20,
          finance: 30,
          health: 90,
          relationships: 60,
          traits: backgroundResponse.player_identity.initial_traits
        },
        currentSummary: '你的人生故事即將開始...'
      };
      
      setCurrentSession(session);
      setGamePhase('playing');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '開始遊戲失敗');
    } finally {
      setLoading(false);
    }
  },
  
  makeChoice: async (optionId: string) => {
    const { currentSession, apiService, setLoading, setError, updateSessionData } = get();
    
    if (!currentSession || !apiService) {
      setError('遊戲狀態錯誤');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 如果沒有當前事件，先生成一個
      if (!currentSession.currentEvent) {
        const storyResponse = await apiService.generateStory({ session_id: currentSession.sessionId });
        updateSessionData({ currentEvent: storyResponse });
        return; // 這次只是載入事件，不做選擇
      }
      
      // 解決事件
      const resolveResponse = await apiService.resolveEvent({
        session_id: currentSession.sessionId,
        event: currentSession.currentEvent,
        selected_option_id: optionId
      });
      
      // 更新 session 資料
      updateSessionData({
        playerState: resolveResponse.updated_player_state,
        currentSummary: resolveResponse.current_summary,
        currentEvent: undefined, // 清除當前事件，下次會生成新的
        eventHistory: [
          ...(currentSession.eventHistory || []),
          {
            event: currentSession.currentEvent,
            selectedOption: optionId,
            outcome: resolveResponse.event_outcome
          }
        ]
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '處理選擇失敗');
    } finally {
      setLoading(false);
    }
  },
  
  finishGame: async () => {
    const { currentSession, apiService, setLoading, setError, setSummaryState, setGamePhase } = get();
    
    if (!currentSession || !apiService) {
      setError('遊戲狀態錯誤');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const resultResponse = await apiService.generateResult({ session_id: currentSession.sessionId });
      
      // 轉換雷達資料格式
      const frontendRadar = mapRadarData(resultResponse.radar_scores);
      
      // 計算人生分數
      const lifeScore = Math.round(
        (resultResponse.radar_scores.financial + 
         resultResponse.radar_scores.career + 
         resultResponse.radar_scores.health + 
         resultResponse.radar_scores.relationships + 
         resultResponse.radar_scores.self_fulfillment) / 5
      );
      
      // 生成成就與關鍵選擇
      const achievements = generateAchievements(resultResponse, currentSession);
      const keyChoices = generateKeyChoices(currentSession);
      
      const summaryState: SummaryState = {
        lifeScore,
        radar: frontendRadar,
        finalSummaryText: resultResponse.summary,
        achievements,
        keyChoices,
        finalImageUrl: undefined // 可以後續加入
      };
      
      setSummaryState(summaryState);
      setGamePhase('summary');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '結束遊戲失敗');
    } finally {
      setLoading(false);
    }
  }
}));

// 輔助函式：生成成就
function generateAchievements(result: ResultResponse, session: GameSession): Achievement[] {
  const achievements: Achievement[] = [];
  
  if (result.radar_scores.financial >= 80) {
    achievements.push({ title: '財富大師', desc: '在財務管理上表現卓越' });
  }
  
  if (result.radar_scores.career >= 80) {
    achievements.push({ title: '事業有成', desc: '在職業發展上取得顯著成就' });
  }
  
  if (result.radar_scores.relationships >= 80) {
    achievements.push({ title: '人際達人', desc: '擁有良好的人際關係網絡' });
  }
  
  if (result.radar_scores.health >= 80) {
    achievements.push({ title: '健康生活', desc: '保持良好的身心健康狀態' });
  }
  
  if (result.radar_scores.self_fulfillment >= 80) {
    achievements.push({ title: '自我實現', desc: '在個人成長上達到高度滿足' });
  }
  
  return achievements;
}

// 輔助函式：生成關鍵選擇
function generateKeyChoices(session: GameSession): string[] {
  return (session.eventHistory || []).map((history, index) => 
    `第${index + 1}個重要時刻：${history.outcome}`
  );
}