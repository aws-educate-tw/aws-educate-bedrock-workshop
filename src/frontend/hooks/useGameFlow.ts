import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [event, setEvent] = useState<StoryResponse | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState<GameProgressInfo | null>(null);
  const [playerState, setPlayerState] = useState<PlayerSnapshot | null>(null);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [pendingResult, setPendingResult] =
    useState<GenerateResultResponse | null>(null);
  const [shouldFinish, setShouldFinish] = useState(false);

  const hasSession = useMemo(() => Boolean(sessionId), [sessionId]);

  const loadEvent = useCallback(async () => {
    if (!hasSession) return;
    setLoadingEvent(true);
    setError(null);
    try {
      const response = await generateStory({ session_id: sessionId! });
      setEvent(response);
      setProgress(response.game_progress);
      const shouldGenerateResult = Boolean(response.should_generate_result);
      setShouldFinish(shouldGenerateResult);

      if (
        shouldGenerateResult &&
        (!response.options || response.options.length === 0)
      ) {
        const result = await generateResult({ session_id: sessionId! });
        setPendingResult(result);
        setEvent(null);
      }
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoadingEvent(false);
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
        const { image: _omitImage, ...eventPayload } = event;
        const resolved = await resolveEvent({
          session_id: sessionId!,
          event: eventPayload,
          selected_option: optionId,
        });

        setHistory((prev) => [
          ...prev,
          {
            event,
            selectedOption: optionId,
            outcome: resolved.event_outcome,
          },
        ]);

        setPlayerState(toPlayerSnapshot(resolved.updated_player_state));
        setCurrentSummary(resolved.current_summary);

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

  useEffect(() => {
    if (!hasSession) return;
    if (!event && !loadingEvent) {
      void loadEvent();
    }
  }, [event, hasSession, loadEvent, loadingEvent]);

  return {
    event,
    loadingEvent,
    submitting,
    error,
    history,
    progress,
    playerState,
    currentSummary,
    pendingResult,
    shouldFinish,
    loadEvent,
    selectOption,
    resetError,
  };
}
