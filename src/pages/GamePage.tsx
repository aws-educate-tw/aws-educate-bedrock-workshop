import { motion } from "framer-motion";
import { ChevronRight, Send } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { useAppStore } from "../store";
import { GameSession } from "../types/game";

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

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    loading,
    error,
    setError,
    setCurrentSession,
    setSummaryState,
  } = useAppStore();

  const [currentEvent, setCurrentEvent] = useState<any>(
    currentSession?.currentEvent
  );
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [freeInput, setFreeInput] = useState("");

  const eventTextRef = useRef<HTMLDivElement>(null);

  const [stickToBottom, setStickToBottom] = useState(true);

  const didInitRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );

    [cardRef.current, imageRef.current].forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const loadNextEvent = useCallback(async () => {
    if (!currentSession) return;

    // mock 事件資料
    const mockEvents = [
      {
        event_id: "event_1",
        event_description:
          "你在小學時期遇到了一個轉學生，他看起來很孤單。你會如何對待他？".repeat(
            12
          ),
        options: [
          { option_id: "A", description: "主動邀請他一起玩，成為朋友" },
          { option_id: "B", description: "保持距離，觀察一段時間再說" },
        ],
      },
      {
        event_id: "event_2",
        event_description:
          "高中時期，你面臨選擇科系的重要時刻。你的興趣與父母的期望不同。",
        options: [
          { option_id: "A", description: "堅持自己的興趣，選擇藝術相關科系" },
          { option_id: "B", description: "聽從父母建議，選擇商科或理工科" },
        ],
      },
      {
        event_id: "event_3",
        event_description:
          "剛出社會的你收到兩個工作機會：一個是大公司的穩定職位，另一個是新創公司的挑戰性工作。",
        options: [
          { option_id: "A", description: "選擇大公司，追求穩定與保障" },
          { option_id: "B", description: "加入新創公司，追求成長與挑戰" },
        ],
      },
    ];

    const eventIndex = eventHistory.length;

    if (eventIndex < mockEvents.length) {
      const selectedEvent = mockEvents[eventIndex];
      setCurrentEvent(selectedEvent);

      // ✅ 新事件開始：恢復貼底，並先捲到底（像聊天新訊息）
      setStickToBottom(true);
      requestAnimationFrame(() => {
        const el = eventTextRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });
    } else {
      const mockSummary = {
        lifeScore: 75,
        radar: {
          wisdom: 80,
          wealth: 65,
          relationship: 90,
          career: 70,
          health: 80,
        },
        finalSummaryText:
          "你度過了充實而有意義的一生。從小就展現出的善良和智慧，讓你在人生的各個階段都能做出正確的選擇。你重視人際關係，也不忘記持續學習和成長。",
        achievements: [
          { title: "智慧者", desc: "在人生中展現出卓越的智慧" },
          { title: "人際達人", desc: "擁有良好的人際關係網絡" },
        ],
        keyChoices:
          eventHistory.length > 0 ? eventHistory : ["進行了完整的人生模擬"],
      };
      setSummaryState(mockSummary);
      navigate("/summary");
    }
  }, [currentSession, eventHistory, navigate, setSummaryState]);

  // ✅ 初始化：只跑一次（避免 StrictMode / 重複觸發）
  useEffect(() => {
    if (didInitRef.current) return;
    if (currentSession && !currentEvent && !loading) {
      didInitRef.current = true;
      loadNextEvent();
    }
  }, [currentSession, currentEvent, loading, loadNextEvent]);

  const handleAction = async (
    actionType: "A" | "B" | "FREE",
    freeText?: string
  ) => {
    if (!currentEvent) return;

    const selectedOption =
      actionType === "FREE"
        ? { option_id: "FREE", description: freeText || "" }
        : currentEvent.options.find((opt: any) => opt.option_id === actionType);

    if (selectedOption) {
      setEventHistory((prev) => [...prev, selectedOption.description]);
    }

    setCurrentEvent(null);

    const newHistoryLength = eventHistory.length + 1;
    if (newHistoryLength >= 3) {
      const mockSummary = {
        lifeScore: 75,
        radar: {
          wisdom: 80,
          wealth: 65,
          relationship: 90,
          career: 70,
          health: 80,
        },
        finalSummaryText:
          "你度過了充實而有意義的一生。從小就展現出的善良和智慧，讓你在人生的各個階段都能做出正確的選擇。你重視人際關係，也不忘記持續學習和成長。",
        achievements: [
          { title: "智慧者", desc: "在人生中展現出卓越的智慧" },
          { title: "人際達人", desc: "擁有良好的人際關係網絡" },
        ],
        keyChoices: [...eventHistory, selectedOption.description],
      };
      setSummaryState(mockSummary);
      navigate("/summary");
    } else {
      setTimeout(loadNextEvent, 600);
    }
  };

  const handleFreeSubmit = () => {
    if (freeInput.trim().length === 0) return;
    if (freeInput.length > 30) {
      alert("輸入內容不能超過 30 字");
      return;
    }
    handleAction("FREE", freeInput.trim());
    setFreeInput("");
  };

  if (!currentSession) {
    const defaultSession: GameSession = {
      sessionId: "default-session",
      modelId: "mock-model",
      background: "你出生在一個普通的中產階級家庭，父母都是上班族。",
      lifeGoal: "成為一個對社會有貢獻的人，同時擁有幸福的家庭生活。",
      playerState: {
        age: 25,
        career: 50,
        finance: 40,
        health: 80,
        relationships: 70,
        traits: ["好奇心旺盛", "善良"],
      },
      currentSummary: "你的人生正在展開...",
    };
    setCurrentSession(defaultSession);
    return null;
  }

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
                <ImageWithFallback
                  base64={undefined}
                  alt="遊戲場景"
                  className="w-full h-full"
                />
              </div>

              <div className="text-center mt-3">
                <p className="prophet-text text-sm">
                  <span className="opacity-80">角色狀態：</span>
                  <span className="font-bold">
                    年齡 {currentSession.playerState?.age || 0} 歲
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

              <div className="space-y-3">
                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>年齡</span>
                  <span className="font-bold">
                    {currentSession.playerState?.age || 0} 歲
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>健康</span>
                  <span className="font-bold">
                    {currentSession.playerState?.health ?? 0}
                  </span>
                </div>

                <div className="flex justify-between items-center prophet-text border-b border-[var(--prophet-border)] pb-1">
                  <span>財務</span>
                  <span className="font-bold">
                    {currentSession.playerState?.finance ?? 0}
                  </span>
                </div>

                <div className="prophet-small-text leading-snug">
                  <strong>人生目標：</strong>
                  {currentSession.lifeGoal || "載入中..."}
                </div>

                {!!currentSession.playerState?.traits?.length && (
                  <div className="prophet-small-text">
                    <strong>特質：</strong>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {currentSession.playerState.traits
                        .slice(0, 4)
                        .map((t: string) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 border border-[var(--prophet-border)] prophet-small-text"
                          >
                            {t}
                          </span>
                        ))}
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
                {currentEvent ? (
                  <Typewriter
                    text={currentEvent.event_description}
                    onTick={scrollEventToBottomIfNeeded}
                  />
                ) : (
                  "正在載入事件..."
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
                    {(currentEvent?.options ?? []).map((option: any) => (
                      <button
                        key={option.option_id}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAction(option.option_id as "A" | "B");
                        }}
                        className="w-full text-left py-2 px-3 prophet-card border border-[var(--prophet-border)] hover:border-[var(--prophet-dark)] transition-all prophet-text group"
                        disabled={loading}
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
                        進度: {eventHistory.length}/3 個選擇
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {loading && (
                <div className="text-center prophet-text opacity-70">
                  正在處理您的選擇...
                </div>
              )}

              {/* 自由輸入框*/}
              <div className="mt-4 pt-3 border-t border-[var(--prophet-border)]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={30}
                    className="flex-1 prophet-input px-3 py-2 text-sm"
                    placeholder="或輸入自己的行動 (30字內)..."
                    value={freeInput}
                    onChange={(e) => setFreeInput(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFreeSubmit();
                    }}
                    disabled={!freeInput.trim() || loading}
                    className="prophet-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <div className="text-right">
                  <span className="prophet-small-text opacity-60">
                    {freeInput.length}/30
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 border-2 border-red-800 bg-red-50 p-4">
          <p className="prophet-text text-red-800 text-sm mb-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="prophet-text text-red-600 text-xs underline hover:no-underline"
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
};
