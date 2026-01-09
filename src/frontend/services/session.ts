/**
 * 本機 session 管理邏輯
 * 不依賴 Zustand，純粹 localStorage 操作
 *
 * localStorage 策略：
 * - __game_session_id__: 當前進行中的 session_id
 * - __game_session_timestamp__: session 建立時間戳（可選，便於清理過期 session）
 */

const SESSION_ID_KEY = "__game_session_id__";
const SESSION_TIMESTAMP_KEY = "__game_session_timestamp__";
const SESSION_BACKGROUND_KEY = "__game_session_background__";

export const SessionService = {
  /**
   * 儲存 session_id 與時間戳
   */
  saveSessionId(sessionId: string): void {
    try {
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.warn("Failed to save session to localStorage:", err);
    }
  },

  /**
   * 讀取當前 session_id
   */
  getSessionId(): string | null {
    try {
      return localStorage.getItem(SESSION_ID_KEY);
    } catch {
      return null;
    }
  },

  /**
   * 清除當前 session
   */
  clearSessionId(): void {
    try {
      localStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      localStorage.removeItem(SESSION_BACKGROUND_KEY);
    } catch (err) {
      console.warn("Failed to clear session:", err);
    }
  },

  /**
   * 儲存 generate-background 回應資料
   */
  saveBackgroundData(data: {
    background: string;
    player_identity: {
      age: number;
      gender: string;
      appearance: string;
      profession: string;
      initial_traits: string[];
    };
    life_goal: string;
    image: string | null;
  }): void {
    try {
      localStorage.setItem(SESSION_BACKGROUND_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("Failed to save background data:", err);
    }
  },

  /**
   * 讀取 generate-background 回應資料
   */
  getBackgroundData(): {
    background: string;
    player_identity: {
      age: number;
      gender: string;
      appearance: string;
      profession: string;
      initial_traits: string[];
    };
    life_goal: string;
    image: string | null;
  } | null {
    try {
      const data = localStorage.getItem(SESSION_BACKGROUND_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * 檢查 session 是否存在
   */
  hasActiveSession(): boolean {
    return this.getSessionId() !== null;
  },
};
