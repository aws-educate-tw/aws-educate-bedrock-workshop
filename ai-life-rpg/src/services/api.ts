import { PlayRequest, PlayResponse, SummaryState } from '../types';
import { mockSummaryState, getStageEvent } from './mock';

// 設置為 true 使用 mock 數據，false 使用真實 API
const USE_MOCK = true;

// 追蹤遊戲進度
let gameProgress = {
  clickCount: 0,
  currentStage: 'childhood' as 'childhood' | 'student' | 'adult' | 'elder'
};

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async play(request: PlayRequest): Promise<PlayResponse> {
    if (USE_MOCK) {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 增加點擊次數
      gameProgress.clickCount++;
      
      // 定義階段順序
      const stages: Array<'childhood' | 'student' | 'adult' | 'elder'> = ['childhood', 'student', 'adult', 'elder'];
      
      // 每3次點擊進入下一階段（讓用戶有更多時間體驗）
      const stageIndex = Math.min(Math.floor((gameProgress.clickCount - 1) / 3), stages.length - 1);
      gameProgress.currentStage = stages[stageIndex];
      
      // 獲取當前階段的事件數據
      const stageData = getStageEvent(gameProgress.currentStage);
      
      // 如果已經點擊9次（3個問題 x 3個階段），結束遊戲
      const isEnd = gameProgress.clickCount >= 9;
      
      return {
        sessionId: request.sessionId || 'mock-session-123',
        stage: gameProgress.currentStage,
        imageUrl: stageData.imageUrl,
        statusText: stageData.statusText,
        goalText: stageData.goalText,
        eventText: `${stageData.eventText} (第${gameProgress.clickCount}個選擇)`,
        optionA: stageData.optionA,
        optionB: stageData.optionB,
        isEnd
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`網路錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  async getSummary(sessionId: string): Promise<SummaryState> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockSummaryState;
    }

    try {
      const response = await fetch(`${this.baseUrl}/summary?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`網路錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  // 重置遊戲進度
  resetGame() {
    gameProgress = {
      clickCount: 0,
      currentStage: 'childhood'
    };
  }
}