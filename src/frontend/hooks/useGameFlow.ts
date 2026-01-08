import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateResult,
  generateStory,
  resolveEvent,
} from "../services/api/endpoints";
import {
  ApiError,
  GameProgressInfo,
  GenerateResultResponse,
  ResolveEventResponse,
  StoryResponse,
  UpdatedPlayerState,
} from "../services/api/types";
import { SessionService } from "../services/session";

export interface HistoryItem {
  event: StoryResponse;
  selectedOption: string;
  outcome: string;
}

export interface PlayerSnapshot {
  age: number | null;
  careerTitle: string | null;
  wisdom: number | null;
  wealth: number | null;
  relationships: number | null;
  careerDevelopment: number | null;
  wellbeing: number | null;
  traits: string[];
}

const toPlayerSnapshot = (state: UpdatedPlayerState): PlayerSnapshot => ({
  age: state.age ?? null,
  careerTitle: state.career ?? null,
  wisdom: state.wisdom ?? null,
  wealth: state.wealth ?? null,
  relationships: state.relationships ?? null,
  careerDevelopment: state.career_development ?? null,
  wellbeing: state.wellbeing ?? null,
  traits: state.traits ?? [],
});

const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;
  return new ApiError(null, "network", String(err));
};

export function useGameFlow(sessionId: string | null) {
  // 從 localStorage 讀取背景資料作為初始值
  // 當 sessionId 變化時重新讀取（確保從 HomePage 導航過來時能取得最新資料）
  const backgroundData = useMemo(() => SessionService.getBackgroundData(), [sessionId]);

  const [event, setEvent] = useState<StoryResponse | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState<GameProgressInfo | null>(null);
  const [playerState, setPlayerState] = useState<PlayerSnapshot | null>(() => {
    // 初始化時使用背景資料的玩家狀態
    if (backgroundData?.player_identity) {
      return {
        age: backgroundData.player_identity.age,
        careerTitle: backgroundData.player_identity.profession,
        wisdom: null,
        wealth: null,
        relationships: null,
        careerDevelopment: null,
        wellbeing: null,
        traits: backgroundData.player_identity.initial_traits ?? [],
      };
    }
    return null;
  });
  const [pendingResult, setPendingResult] =
    useState<GenerateResultResponse | null>(null);
  const [shouldFinish, setShouldFinish] = useState(false);
  // 目前狀況：初始顯示 background，之後顯示 event_outcome
  const [currentSummary, setCurrentSummary] = useState<string | null>(
    () => backgroundData?.background ?? null
  );
  // 最新的事件結果（用於顯示在「目前狀況」）
  const [latestEventOutcome, setLatestEventOutcome] = useState<string | null>(null);
  // 獨立的圖片狀態，初始使用背景圖片
  const [currentImage, setCurrentImage] = useState<string | null>(
    () => backgroundData?.image ?? null
  );
  // 人生目標
  const [lifeGoal, setLifeGoal] = useState<string | null>(
    () => backgroundData?.life_goal ?? null
  );

  const hasSession = useMemo(() => Boolean(sessionId), [sessionId]);

  // 用來防止重複呼叫 loadEvent
  const isLoadingRef = useRef(false);

  const loadEvent = useCallback(async () => {
    if (!hasSession) return;
    if (isLoadingRef.current) return; // 防止重複呼叫

    isLoadingRef.current = true;
    setLoadingEvent(true);
    setError(null);
    try {
      const response = await generateStory({ session_id: sessionId! });
      setEvent(response);
      setProgress(response.game_progress);
      setShouldFinish(Boolean(response.should_generate_result));
      // 更新圖片（如果 generate-story 有回傳圖片）
      if (response.image) {
        setCurrentImage(response.image);
      }
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoadingEvent(false);
      isLoadingRef.current = false;
    }
  }, [hasSession, sessionId]);

  const selectOption = useCallback(
    async (
      optionId: string
    ): Promise<{
      resolved: ResolveEventResponse | null;
      result: GenerateResultResponse | null;
    }> => {
      if (!hasSession) {
        const err = new ApiError(
          null,
          "4xx",
          "缺少 session_id，請返回首頁重新開始"
        );
        setError(err);
        throw err;
      }

      if (!event) {
        await loadEvent();
        const err = new ApiError(null, "4xx", "尚未取得事件，請重試");
        setError(err);
        throw err;
      }

      setSubmitting(true);
      setError(null);

      try {
        const eventData = {
          event_id: event.event_id,
          event_description: event.event_description,
        };
        const resolved = await resolveEvent({
          session_id: sessionId!,
          event: eventData,
          selected_option: optionId,
        });

        // 更新 current_summary（內部狀態保留）
        setCurrentSummary(resolved.current_summary ?? null);
        // 設定 event_outcome 作為「目前狀況」顯示
        setLatestEventOutcome(resolved.event_outcome ?? null);
        // 更新圖片（如果 resolve-event 有回傳圖片）
        if (resolved.image) {
          setCurrentImage(resolved.image);
        }

        setHistory((prev) => [
          ...prev,
          {
            event,
            selectedOption: optionId,
            outcome: resolved.event_outcome,
          },
        ]);

        setPlayerState(toPlayerSnapshot(resolved.updated_player_state));

        if (shouldFinish) {
          const result = await generateResult({ session_id: sessionId! });
          setPendingResult(result);
          setEvent(null);
          return { resolved, result };
        }

        setEvent(null);
        await loadEvent();

        return { resolved, result: null };
      } catch (err) {
        const apiError = toApiError(err);
        setError(apiError);
        throw apiError;
      } finally {
        setSubmitting(false);
      }
    },
    [event, hasSession, loadEvent, sessionId, shouldFinish]
  );

  const resetError = useCallback(() => setError(null), []);

  // 當 backgroundData 變化時，更新初始狀態（確保從 HomePage 導航過來時能顯示背景資料）
  useEffect(() => {
    if (backgroundData) {
      // 只在還沒有 playerState 時更新（避免覆蓋遊戲進行中的狀態）
      setPlayerState((prev) => {
        if (prev) return prev; // 已有狀態，不覆蓋
        return {
          age: backgroundData.player_identity.age,
          careerTitle: backgroundData.player_identity.profession,
          wisdom: null,
          wealth: null,
          relationships: null,
          careerDevelopment: null,
          wellbeing: null,
          traits: backgroundData.player_identity.initial_traits ?? [],
        };
      });
      setCurrentSummary((prev) => prev ?? backgroundData.background);
      setCurrentImage((prev) => prev ?? backgroundData.image);
      setLifeGoal((prev) => prev ?? backgroundData.life_goal);
    }
  }, [backgroundData]);

  useEffect(() => {
    if (!hasSession) return;
    if (!event && !loadingEvent) {
      void loadEvent();
    }
  }, [event, hasSession, loadEvent, loadingEvent]);

  // 「目前狀況」顯示邏輯：有 event_outcome 時顯示它，否則顯示初始 background
  const displaySummary = latestEventOutcome ?? currentSummary;

  return {
    event,
    loadingEvent,
    submitting,
    error,
    history,
    progress,
    playerState,
    pendingResult,
    shouldFinish,
    currentSummary: displaySummary,  // 對外統一為 currentSummary，內部邏輯已處理
    currentImage,
    lifeGoal,
    loadEvent,
    selectOption,
    resetError,
  };
}
