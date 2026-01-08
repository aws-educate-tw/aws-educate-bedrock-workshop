import { useCallback, useState } from "react";
import { generateBackground, setApiBaseUrl } from "../services/api/endpoints";
import { ApiError, GenerateBackgroundResponse } from "../services/api/types";
import { SessionService } from "../services/session";

export interface UseSessionState {
  data: GenerateBackgroundResponse | null;
  sessionId: string | null;
  loading: boolean;
  error: ApiError | null;
  hasStoredSession: boolean;
}

export function useSession() {
  const storedSessionId = SessionService.getSessionId();

  const [state, setState] = useState<UseSessionState>({
    data: null,
    sessionId: storedSessionId,
    loading: false,
    error: null,
    hasStoredSession: Boolean(storedSessionId),
  });

  /**
   * 初始化新遊戲 session
   */
  const initializeSession = useCallback(
    async (knowledgeBaseId: string, apiUrl?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 若提供了 API URL，設定它
        if (apiUrl) {
          setApiBaseUrl(apiUrl);
        }

        const response = await generateBackground({
          knowledge_base_id: knowledgeBaseId,
        });

        // 保存 session_id 和背景資料
        SessionService.saveSessionId(response.session_id);
        SessionService.saveBackgroundData({
          background: response.background,
          player_identity: response.player_identity,
          life_goal: response.life_goal,
          image: response.image,
        });

        setState((prev) => ({
          ...prev,
          data: response,
          sessionId: response.session_id,
          loading: false,
          hasStoredSession: true,
        }));

        return response;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(null, "network", String(err));

        setState((prev) => ({
          ...prev,
          loading: false,
          error: apiError,
        }));

        throw apiError;
      }
    },
    []
  );

  /**
   * 清除 session（重新開始）
   */
  const clearSession = useCallback(() => {
    SessionService.clearSessionId();
    setState({
      data: null,
      sessionId: null,
      loading: false,
      error: null,
      hasStoredSession: false,
    });
  }, []);

  /**
   * 重新讀取 localStorage 中的 session_id（用於回到首頁時的續玩按鈕）
   */
  const restoreSession = useCallback(() => {
    const restored = SessionService.getSessionId();
    setState((prev) => ({
      ...prev,
      sessionId: restored,
      hasStoredSession: Boolean(restored),
    }));
    return restored;
  }, []);

  return {
    ...state,
    initializeSession,
    clearSession,
    restoreSession,
  };
}
