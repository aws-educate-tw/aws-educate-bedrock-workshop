import { gameApiService, handleApiError, mapRadarData } from './gameApi';
import { fallbackGameService } from '../mocks/gameData';
import {
  BackgroundRequest,
  BackgroundResponse,
  StoryRequest,
  StoryResponse,
  ResolveEventRequest,
  ResolveEventResponse,
  ResultRequest,
  ResultResponse,
  GameSession,
  FrontendRadarData
} from '../types/game';

// 整合的遊戲服務 - 自動處理 API 和 Fallback
class IntegratedGameService {
  private sessionData: Map<string, GameSession> = new Map();

  // 設定 API Base URL
  setApiBaseUrl(url: string) {
    gameApiService.setBaseURL(url);
  }

  // 檢查是否使用 API 或 Fallback
  private shouldUseFallback(): boolean {
    return !gameApiService.isConfigured();
  }

  // 儲存 session 到 localStorage
  private saveSession(session: GameSession) {
    this.sessionData.set(session.sessionId, session);
    localStorage.setItem(`game_session_${session.sessionId}`, JSON.stringify(session));
  }

  // 從 localStorage 載入 session
  private loadSession(sessionId: string): GameSession | null {
    if (this.sessionData.has(sessionId)) {
      return this.sessionData.get(sessionId)!;
    }

    const stored = localStorage.getItem(`game_session_${sessionId}`);
    if (stored) {
      try {
        const session = JSON.parse(stored) as GameSession;
        this.sessionData.set(sessionId, session);
        return session;
      } catch (error) {
        console.warn('Failed to parse stored session:', error);
      }
    }
    return null;
  }

  // 1. 開始遊戲 - 生成背景
  async startGame(modelId: string): Promise<{
    session: GameSession;
    background: BackgroundResponse;
  }> {
    try {
      let backgroundResponse: BackgroundResponse;

      if (this.shouldUseFallback()) {
        console.log('Using fallback service for background generation');
        backgroundResponse = await fallbackGameService.generateBackground(modelId);
      } else {
        backgroundResponse = await gameApiService.generateBackground({ model_id: modelId });
      }

      const session: GameSession = {
        sessionId: backgroundResponse.session_id,
        modelId,
        background: backgroundResponse.background,
        lifeGoal: backgroundResponse.life_goal,
        playerState: {
          age: backgroundResponse.player_identity.age,
          career: 50,
          finance: 50,
          health: 80,
          relationships: 60,
          traits: backgroundResponse.player_identity.initial_traits
        }
      };

      this.saveSession(session);

      return { session, background: backgroundResponse };
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      const backgroundResponse = await fallbackGameService.generateBackground(modelId);
      
      const session: GameSession = {
        sessionId: backgroundResponse.session_id,
        modelId,
        background: backgroundResponse.background,
        lifeGoal: backgroundResponse.life_goal,
        playerState: {
          age: backgroundResponse.player_identity.age,
          career: 50,
          finance: 50,
          health: 80,
          relationships: 60,
          traits: backgroundResponse.player_identity.initial_traits
        }
      };

      this.saveSession(session);
      return { session, background: backgroundResponse };
    }
  }

  // 2. 生成故事事件
  async generateStory(sessionId: string): Promise<StoryResponse> {
    try {
      if (this.shouldUseFallback()) {
        return await fallbackGameService.generateStory(sessionId);
      } else {
        return await gameApiService.generateStory({ session_id: sessionId });
      }
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      return await fallbackGameService.generateStory(sessionId);
    }
  }

  // 3. 解決事件
  async resolveEvent(
    sessionId: string, 
    event: StoryResponse, 
    selectedOptionId: string
  ): Promise<ResolveEventResponse> {
    try {
      let response: ResolveEventResponse;

      if (this.shouldUseFallback()) {
        response = await fallbackGameService.resolveEvent(sessionId, event, selectedOptionId);
      } else {
        response = await gameApiService.resolveEvent({
          session_id: sessionId,
          event,
          selected_option_id: selectedOptionId
        });
      }

      // 更新 session 資料
      const session = this.loadSession(sessionId);
      if (session) {
        session.playerState = response.updated_player_state;
        session.currentSummary = response.current_summary;
        this.saveSession(session);
      }

      return response;
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      const response = await fallbackGameService.resolveEvent(sessionId, event, selectedOptionId);
      
      // 更新 session 資料
      const session = this.loadSession(sessionId);
      if (session) {
        session.playerState = response.updated_player_state;
        session.currentSummary = response.current_summary;
        this.saveSession(session);
      }

      return response;
    }
  }

  // 4. 生成最終結果
  async generateResult(sessionId: string): Promise<{
    result: ResultResponse;
    frontendRadar: FrontendRadarData;
  }> {
    try {
      let resultResponse: ResultResponse;

      if (this.shouldUseFallback()) {
        resultResponse = await fallbackGameService.generateResult(sessionId);
      } else {
        resultResponse = await gameApiService.generateResult({ session_id: sessionId });
      }

      // 轉換雷達圖資料格式
      const frontendRadar = mapRadarData(resultResponse.radar_scores);

      return { result: resultResponse, frontendRadar };
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      const resultResponse = await fallbackGameService.generateResult(sessionId);
      const frontendRadar = mapRadarData(resultResponse.radar_scores);
      
      return { result: resultResponse, frontendRadar };
    }
  }

  // 獲取當前 session
  getCurrentSession(sessionId: string): GameSession | null {
    return this.loadSession(sessionId);
  }

  // 清除 session
  clearSession(sessionId: string) {
    this.sessionData.delete(sessionId);
    localStorage.removeItem(`game_session_${sessionId}`);
  }

  // 清除所有 sessions
  clearAllSessions() {
    this.sessionData.clear();
    // 清除所有遊戲相關的 localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('game_session_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// 單例服務
export const gameService = new IntegratedGameService();