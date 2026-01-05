import { useCallback, useState } from "react";
import { generateBackground } from "../services/api/endpoints";
import { ApiError, GenerateBackgroundResponse } from "../services/api/types";
import { SessionService } from "../services/session";

export interface UseSessionState {
  data: GenerateBackgroundResponse | null;
  sessionId: string | null;
  loading: boolean;
  error: ApiError | null;
}

export function useSession() {
  const [state, setState] = useState<UseSessionState>({
    data: null,
    sessionId: SessionService.getSessionId(),
    loading: false,
    error: null,
  });

  /**
   * 初始化新遊戲 session
   */
  const initializeSession = useCallback(async (knowledgeBaseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await generateBackground({
        knowledge_base_id: knowledgeBaseId,
      });

      // 保存 session_id
      SessionService.saveSessionId(response.session_id);

      setState((prev) => ({
        ...prev,
        data: response,
        sessionId: response.session_id,
        loading: false,
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
  }, []);

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
    });
  }, []);

  return {
    ...state,
    initializeSession,
    clearSession,
  };
}
