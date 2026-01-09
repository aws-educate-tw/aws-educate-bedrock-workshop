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
  // 從 localStorage 讀取背景資料作為初始值（只讀取一次，用 useRef 保存）
  const backgroundDataRef = useRef(SessionService.getBackgroundData());
  const backgroundData = backgroundDataRef.current;

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
  // 預載的遊戲結果（最後一回合在顯示結果時背景載入）
  const [preloadedResult, setPreloadedResult] =
    useState<GenerateResultResponse | null>(null);
  // 預載結果時是否正在載入
  const [preloadingResult, setPreloadingResult] = useState(false);
  // 角色背景：只在初始化時設定，之後不會變化
  const [currentSummary] = useState<string | null>(
    () => backgroundData?.background ?? null
  );
  // 最新的故事摘要（每次 resolveEvent 後更新）
  const [latestSummary, setLatestSummary] = useState<string | null>(null);
  // 最新的事件結果（用於顯示在「目前狀況」）
  const [latestEventOutcome, setLatestEventOutcome] = useState<string | null>(null);
  // 是否正在顯示事件結果（選擇後 -> 按下一步前）
  const [showingOutcome, setShowingOutcome] = useState(false);
  // 預載的下一個事件（在顯示結果時背景載入）
  const [preloadedEvent, setPreloadedEvent] = useState<StoryResponse | null>(null);
  // 預載時是否正在載入
  const [preloading, setPreloading] = useState(false);
  // 獨立的圖片狀態，初始使用背景圖片
  const [currentImage, setCurrentImage] = useState<string | null>(
    () => backgroundData?.image ?? null
  );
  // 人生目標：只在初始化時設定，之後不會變化
  const [lifeGoal] = useState<string | null>(
    () => backgroundData?.life_goal ?? null
  );
  // 初始角色肖像圖（generateBackground 產生的，永久保存）
  const [characterPortrait] = useState<string | null>(
    () => backgroundData?.image ?? null
  );
  // 初始角色身份資訊
  const [playerIdentity] = useState<{
    name?: string;
    gender?: string;
    appearance?: string;
    age?: number;
    profession?: string;
  } | null>(() => backgroundData?.player_identity ?? null);

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

        // 設定 event_outcome（用於事件結果畫面顯示）
        setLatestEventOutcome(resolved.event_outcome ?? null);
        // 更新最新故事摘要
        setLatestSummary(resolved.current_summary ?? null);
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

        // 進入「顯示結果」模式
        setShowingOutcome(true);
        setEvent(null);

        if (shouldFinish) {
          // 最後一回合：背景預載遊戲結果
          setPreloadingResult(true);
          generateResult({ session_id: sessionId! })
            .then((result) => {
              setPreloadedResult(result);
              setPreloadingResult(false);
            })
            .catch(() => {
              setPreloadingResult(false);
            });
        } else {
          // 非最後一回合：背景預載下一個事件
          setPreloading(true);
          generateStory({ session_id: sessionId! })
            .then((response) => {
              setPreloadedEvent(response);
              setPreloading(false);
            })
            .catch(() => {
              setPreloading(false);
            });
        }

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

  // 玩家按下「下一個故事」時，從預載的事件切換回事件顯示模式
  const proceedToNextEvent = useCallback(() => {
    if (preloadedEvent) {
      // 使用預載的事件
      setEvent(preloadedEvent);
      setProgress(preloadedEvent.game_progress);
      setShouldFinish(Boolean(preloadedEvent.should_generate_result));
      if (preloadedEvent.image) {
        setCurrentImage(preloadedEvent.image);
      }
      setPreloadedEvent(null);
    } else if (preloading) {
      // 還在載入中，設定 loadingEvent 狀態讓 UI 顯示載入中
      setLoadingEvent(true);
    }
    // 退出「顯示結果」模式
    setShowingOutcome(false);
  }, [preloadedEvent, preloading]);

  // 玩家按下「查看結果」時，從預載的結果設定 pendingResult 以觸發頁面跳轉
  const proceedToResult = useCallback(() => {
    if (preloadedResult) {
      // 使用預載的結果，觸發 GamePage 中的 useEffect 跳轉到 summary
      setPendingResult(preloadedResult);
      setPreloadedResult(null);
      setShowingOutcome(false);
    }
    // 如果還在載入中，按鈕應該是 disabled 狀態，不會進到這裡
  }, [preloadedResult]);

  // 背景資料只在元件首次掛載時從 localStorage 讀取一次，不需要監聽變化

  useEffect(() => {
    if (!hasSession) return;
    // 在「顯示結果」模式時不自動載入
    if (showingOutcome) return;
    if (!event && !loadingEvent) {
      void loadEvent();
    }
  }, [event, hasSession, loadEvent, loadingEvent, showingOutcome]);

  // 當預載完成且正在等待時，更新事件
  useEffect(() => {
    if (!showingOutcome && loadingEvent && preloadedEvent) {
      setEvent(preloadedEvent);
      setProgress(preloadedEvent.game_progress);
      setShouldFinish(Boolean(preloadedEvent.should_generate_result));
      if (preloadedEvent.image) {
        setCurrentImage(preloadedEvent.image);
      }
      setPreloadedEvent(null);
      setLoadingEvent(false);
    }
  }, [showingOutcome, loadingEvent, preloadedEvent]);

  // 「目前狀況」顯示邏輯：始終顯示初始 background
  const displaySummary = currentSummary;

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
    // 新增：顯示結果模式相關
    showingOutcome,
    latestEventOutcome,
    latestSummary,
    preloading,
    // 新增：最後一回合結果預載相關
    preloadingResult,
    // 新增：初始角色資訊（永久保存）
    characterPortrait,
    playerIdentity,
    loadEvent,
    selectOption,
    resetError,
    proceedToNextEvent,
    proceedToResult,
  };
}
