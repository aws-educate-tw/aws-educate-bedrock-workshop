import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Base64Image } from "../components/Base64Image";
import { useGameFlow } from "../hooks/useGameFlow";
import {
  ApiError,
  FinalScores,
  GenerateResultResponse,
} from "../services/api/types";
import { SessionService } from "../services/session";
import { SummaryState, useAppStore } from "../store";

/**
 * 打字機效果：
 * - effect 只依賴 text/speed，不會因為 onComplete/onTick 的 function identity 改變而重跑
 * - onTick: 每吐一個字通知外部（外部決定要不要 autoscroll）
 */
const Typewriter: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
  onTick?: () => void;
}> = ({ text, speed = 40, onComplete, onTick }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    setDisplayedText("");
    if (!text) return;

    let i = 0;
    const timer = window.setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));

      // 每次吐字通知外部（外部可以做 autoscroll）
      onTickRef.current?.();

      i++;
      if (i >= text.length) {
        window.clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

const toRadar = (scores: FinalScores) => ({
  wisdom: scores.wisdom,
  wealth: scores.wealth,
  relationship: scores.relationships,
  career: scores.career_development,
  health: scores.wellbeing,
});

const toSummaryState = (
  result: GenerateResultResponse,
  history: ReturnType<typeof useGameFlow>["history"]
) => {
  const lifeScore = Math.round(
    (result.final_scores.wisdom +
      result.final_scores.wealth +
      result.final_scores.relationships +
      result.final_scores.career_development +
      result.final_scores.wellbeing) /
      5
  );

  const achievements = result.achievements.map((a) => ({
    title: a.title,
    desc: a.description,
    iconUrl: a.icon,
  }));

  const keyChoices = (result.key_decisions || []).length
    ? result.key_decisions.map(
        (k, index) =>
          `事件${index + 1}: ${k.event_description}｜選擇：${
            k.decision
          }｜影響：${k.impact}`
      )
    : history.map(
        (h, index) =>
          `事件${index + 1}: ${h.event.event_description}｜結果：${h.outcome}`
      );

  return {
    lifeScore,
    radar: toRadar(result.final_scores),
    finalSummaryText: result.summary,
    achievements,
    keyChoices,
    finalImageUrl: result.image || undefined,
  };
};

export const GamePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = useMemo(
    () => searchParams.get("sessionId") || SessionService.getSessionId(),
    [searchParams]
  );

  const {
    event,
    loadingEvent,
    submitting,
    error,
    history,
    progress,
    playerState,
    pendingResult,
    shouldFinish,
    currentSummary,
    currentImage,
    lifeGoal,
    selectOption,
    resetError,
  } = useGameFlow(sessionId);

  const { setSummaryState } = useAppStore();

  const eventTextRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  // 若啟用 ESC 測試模式，允許無 sessionId 進入 GamePage
  const escTestMode =
    (import.meta.env.VITE_ENABLE_ESC_NAV as string | undefined) === "true";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // 在 ESC 測試模式下，即使無 sessionId 也允許進入
    if (!sessionId && !escTestMode) {
      navigate("/");
    }
  }, [sessionId, navigate, escTestMode]);

  /**
   * ESC 快捷鍵導頁：進入下一頁（Summary）測試流程
   */
  const handleEscNavigation = useCallback(() => {
    console.log("[GamePage ESC Nav] Navigating to summary");
    navigate("/summary");
  }, [navigate]);

  useEffect(() => {
    if (!escTestMode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleEscNavigation();
      }
    };
    document.addEventListener("keydown", onKeyDown, false);
    return () => document.removeEventListener("keydown", onKeyDown, false);
  }, [escTestMode, handleEscNavigation]);

  useEffect(() => {
    if (pendingResult) {
      const summary = toSummaryState(pendingResult, history) as SummaryState;
      setSummaryState(summary);
      navigate("/summary");
    }
  }, [pendingResult, history, setSummaryState, navigate]);

  const handleEventScroll = () => {
    const el = eventTextRef.current;
    if (!el) return;
    const threshold = 16;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceToBottom <= threshold);
  };

  const scrollEventToBottomIfNeeded = () => {
    if (!stickToBottom) return;
    const el = eventTextRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });
  };

  const handleSelectOption = async (optionId: string) => {
    if (submitting || !event) return;
    try {
      await selectOption(optionId);
    } catch {
      // 錯誤已在 hook 中處理並回填
    }
  };

  const renderErrorMessage = (err: ApiError) => {
    switch (err.errorType) {
      case "timeout":
        return "連線逾時，請稍後重試";
      case "4xx":
        return err.message || "請求參數有誤";
      case "5xx":
        return "伺服器暫時不可用，請稍後再試";
      case "network":
        return "網路連線失敗，請檢查您的網路設定";
      case "parse":
        return "回應格式錯誤，請稍後再試";
      default:
        return err.message;
    }
  };

  return (
    <div
      className="prophet-page"
      style={{
        backgroundImage:
          "url(https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/background_cznh7q.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="text-center py-4 border-b-2 border-[var(--prophet-border)]">
        <h1 className="prophet-title text-2xl mb-2">
          {"THE DAILY PROPHET".split("").map((char, index) => (
            <span
              key={index}
              className={`${
                char === "A" ? "text-[var(--prophet-accent)] inline-block" : ""
              }`}
              style={{
                animation: char === "A" ? "bounce-a 3s infinite" : "none",
              }}
            >
              {char}
            </span>
          ))}
        </h1>
        <div className="prophet-dateline">★ 人生模擬進行中 ★</div>
      </header>

      <div className="p-6">
        {/* ✅ 三欄不等寬：12欄格 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ① 人物近影（中窄：跟圖片差不多高度） */}
          <div className="lg:col-span-3">
            <div className="prophet-article h-full">
              <h3 className="prophet-headline text-lg mb-3 border-b border-[var(--prophet-border)] pb-2">
                人物近影
              </h3>

              <div
                className="prophet-photo mx-auto"
                style={{ maxWidth: "240px" }}
              >
                <Base64Image
                  base64={currentImage}
                  alt="遊戲場景"
                  className="w-full h-full"
                />
              </div>

              <div className="text-center mt-3">
                <p className="prophet-text text-sm">
                  <span className="opacity-80">角色狀態：</span>
                  <span className="font-bold">
                    年齡 {playerState?.age ?? "—"} 歲
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ② 現況說明（窄） */}
          <div className="lg:col-span-3">
            <div className="prophet-article h-full">
              <h3 className="prophet-headline text-lg mb-3 border-b border-[var(--prophet-border)] pb-2">
                現況說明
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>年齡</span>
                  <span className="font-bold">
                    {playerState?.age ?? "—"} 歲
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>職業</span>
                  <span className="font-bold">
                    {playerState?.careerTitle ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>智慧</span>
                  <span className="font-bold">
                    {playerState?.wisdom ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>財富</span>
                  <span className="font-bold">
                    {playerState?.wealth ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>人際關係</span>
                  <span className="font-bold">
                    {playerState?.relationships ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>職涯發展</span>
                  <span className="font-bold">
                    {playerState?.careerDevelopment ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>健康</span>
                  <span className="font-bold">
                    {playerState?.wellbeing ?? "—"}
                  </span>
                </div>

                <div className="prophet-small-text leading-snug pt-1">
                  <strong>人生目標：</strong>
                  {lifeGoal ?? "尚未提供（請參考背景）"}
                </div>

                {currentSummary && (
                  <div className="prophet-small-text leading-snug border-t border-[var(--prophet-border)] pt-2 mt-2">
                    <strong>目前狀況：</strong>
                    <div className="mt-1 h-[60px] overflow-y-auto custom-scrollbar pr-1">
                      <p className="opacity-90">
                        <Typewriter text={currentSummary} speed={30} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ③ 人生轉折點（寬） */}
          <div className="lg:col-span-6">
            <div className="prophet-article h-full">
              <header className="text-center mb-4 border-b-2 border-[var(--prophet-border)] ">
                <h2 className="prophet-headline text-2xl mb-2">人生轉折點</h2>
              </header>

              <div
                ref={eventTextRef}
                onScroll={handleEventScroll}
                className="prophet-text text-base leading-relaxed mb-4 h-[120px] overflow-y-auto custom-scrollbar pr-2"
              >
                {event ? (
                  <Typewriter
                    text={event.event_description}
                    onTick={scrollEventToBottomIfNeeded}
                  />
                ) : loadingEvent ? (
                  "正在載入事件..."
                ) : (
                  "尚未取得事件，請稍後或返回首頁"
                )}
              </div>

              <div className="h-[180px]">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="prophet-divider mb-3"></div>
                  <h3 className="prophet-subtitle text-base mb-2">
                    您的選擇：
                  </h3>

                  <div className="space-y-2">
                    {(event?.options ?? []).map((option: any) => (
                      <button
                        key={option.option_id}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectOption(option.option_id);
                        }}
                        className="w-full text-left py-2 px-3 prophet-card border border-[var(--prophet-border)] hover:border-[var(--prophet-dark)] transition-all prophet-text group"
                        disabled={submitting || loadingEvent}
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            <strong>{option.option_id}:</strong>{" "}
                            {option.description}
                          </span>
                          <ChevronRight
                            size={16}
                            className="text-[var(--prophet-accent)] group-hover:text-[var(--prophet-dark)]"
                          />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--prophet-border)]">
                    <div className="text-center mb-2">
                      <span className="prophet-small-text">
                        {progress
                          ? `回合 ${progress.turn}/${progress.total_turns}｜階段：${progress.phase} (${progress.phase_progress})`
                          : "等待遊戲進度..."}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {(loadingEvent || submitting) && (
                <div className="text-center prophet-text opacity-70">
                  {submitting ? "正在處理您的選擇..." : "正在載入事件..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {shouldFinish && !pendingResult && (
        <div className="mx-6 mb-4 border border-amber-700 bg-amber-50 p-4">
          <p className="prophet-text text-amber-800 text-sm">
            已到最後回合，提交選擇後將自動生成結局。
          </p>
        </div>
      )}

      {error && (
        <div className="mx-6 mb-4 border-2 border-red-800 bg-red-50 p-4">
          <p className="prophet-text text-red-800 text-sm mb-2">
            {renderErrorMessage(error)}
          </p>
          <button
            onClick={resetError}
            className="prophet-text text-red-600 text-xs underline hover:no-underline"
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
};
