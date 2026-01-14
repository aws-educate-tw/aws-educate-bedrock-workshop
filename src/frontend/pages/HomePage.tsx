import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagicLoading } from "../components/MagicLoading";
import { useSession } from "../hooks/useSession";
import {
  checkLambdaHealth,
  setApiBaseUrl,
} from "../services/api/endpoints";

/**
 * 首頁：保留原本的三欄報紙排版
 * 整合新的 /generate-background API 邏輯
 *
 * 流程：
 * 1. 用戶在中欄輸入「知識庫 ID」（原 API 連結欄位）
 * 2. 點擊「開始人生模擬」後呼叫 POST /generate-background
 * 3. 成功後自動導向 /game?sessionId=<sessionId>
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId, loading, error, initializeSession } = useSession();

  const [titleAnimated, setTitleAnimated] = useState(false);
  const [apiGatewayUrl, setApiGatewayUrl] = useState(() => {
    // 優先從 sessionStorage 讀取，否則用環境變數或預設值
    const stored = sessionStorage.getItem("__home_api_url__");
    return stored ?? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? `${window.location.origin}/api`;
  });
  const [knowledgeBaseId, setKnowledgeBaseId] = useState(() => {
    const stored = sessionStorage.getItem("__home_kb_id__");
    return stored ?? (import.meta.env.VITE_KNOWLEDGE_BASE_ID as string | undefined) ?? "";
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const enableEscNav =
    (import.meta.env.VITE_ENABLE_ESC_NAV as string | undefined) === "true";
  const hasWarmedLambda = useRef(false);

  // 使用 useCallback 穩定 navigate 函式引用，避免 useEffect 頻繁重新執行
  const handleEscNavigation = useCallback(() => {
    if (enableEscNav) {
      const target = sessionId ? `/game?sessionId=${sessionId}` : `/game`;
      // 使用 navigate 保持音樂連續播放
      navigate(target);
    }
  }, [sessionId, enableEscNav, navigate]);

  useEffect(() => {
    // 頁面載入時滾動到頂部
    window.scrollTo(0, 0);

    // 延遲啟動標題動畫
    const timer = setTimeout(() => {
      setTitleAnimated(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasWarmedLambda.current) {
      return;
    }
    hasWarmedLambda.current = true;

    const apiUrl =
      apiGatewayUrl.trim() ||
      (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
      `${window.location.origin}/api`;

    setApiBaseUrl(apiUrl);
    checkLambdaHealth().catch(() => {
      // Warm-up only; ignore errors to avoid blocking the UI.
    });
  }, [apiGatewayUrl]);

  /**
   * 成功初始化後自動導向 GamePage
   */
  useEffect(() => {
    if (shouldNavigate && sessionId && !loading && !error) {
      const timer = setTimeout(() => {
        navigate(`/game?sessionId=${sessionId}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, sessionId, loading, error, navigate]);

  /**
   * 允許以 ESC 快捷鍵導頁（可透過環境變數關閉按鈕顯示）
   */
  useEffect(() => {
    console.log("[ESC Nav] useEffect triggered, enableEscNav:", enableEscNav);
    // 若未啟用，直接跳過事件綁定
    if (!enableEscNav) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // 防止預設行為（避免某些環境下造成整頁刷新或關閉覆蓋層）
        e.preventDefault();
        e.stopPropagation();
        handleEscNavigation();
      }
    };
    document.addEventListener("keydown", onKeyDown, false);
    return () => {
      document.removeEventListener("keydown", onKeyDown, false);
    };
  }, [enableEscNav, handleEscNavigation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiUrl =
      apiGatewayUrl.trim() ||
      (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
      `${window.location.origin}/api`;

    const kbId =
      knowledgeBaseId.trim() ||
      (import.meta.env.VITE_KNOWLEDGE_BASE_ID as string | undefined) ||
      "default-kb";

    setStatusMessage(null);
    setShouldNavigate(false);

    try {
      await initializeSession(kbId, apiUrl);
      setStatusMessage("魔法背景生成完成，正在前往冒險...");
      setShouldNavigate(true);
    } catch (err) {
      console.error("Failed to initialize session:", err);
      // 錯誤已在 hook 中設定，UI 會顯示
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
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
      {/* 預言家日報頭版 */}
      <header className="text-center py-8 border-b-4 border-[var(--prophet-border)]">
        <div className="mb-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-xs prophet-text tracking-widest">
              Vol. CDXII
            </div>
            <div className="h-px bg-[var(--prophet-border)] flex-1 max-w-16"></div>
            <div className="text-xs prophet-text tracking-widest">
              No. 26,124
            </div>
          </div>

          {/* 動畫標題 */}
          <div className="prophet-masthead mb-2">
            {titleAnimated ? (
              "THE DAILY PROPHET".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  className={`inline-block ${
                    char === "A" ? "text-[var(--prophet-accent)]" : ""
                  }`}
                  style={{
                    marginRight: char === " " ? "0.5em" : "0",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))
            ) : (
              <span style={{ opacity: 0 }}>THE DAILY PROPHET</span>
            )}
          </div>

          <div className="prophet-dateline mb-4">
            ★ THE WIZARD WORLD'S BEGUILING BROADSHEET OF CHOICE ★
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px bg-[var(--prophet-accent)] flex-1 max-w-32"></div>
          <span className="prophet-subtitle text-lg">魔法人生模擬特刊</span>
          <div className="h-px bg-[var(--prophet-accent)] flex-1 max-w-32"></div>
        </div>
      </header>

      {/* 主要版面 - 三欄報紙布局 */}
      <div className="flex-1 p-4 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左欄：魔法照片 */}
          <div className="prophet-article">
            <h3 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2">
              AWS Educate 魔法學院
            </h3>
            <div className="prophet-photo mb-4 group cursor-pointer">
              <motion.img
                src="https://res.cloudinary.com/da3bvump4/image/upload/v1767353109/home_nufsc7.png"
                alt="魔法城堡"
                className="w-full h-64 object-cover transition-all duration-500"
                whileHover={{
                  rotateY: [-5, 5, -5, 5, 0],
                  transition: { duration: 0.6, ease: "easeInOut" },
                }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-yellow-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                whileHover={{ opacity: 0.3 }}
              />
            </div>
          </div>

          {/* 中欄：主要文章 */}
          <div className="prophet-article">
            <h2 className="prophet-headline text-2xl mb-4 border-b-2 border-[var(--prophet-border)] pb-2">
              開始您的魔法人生
            </h2>
            <div className="prophet-divider mb-4"></div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block prophet-text font-bold text-sm">
                  魔法 API 網址
                </label>
                <input
                  type="text"
                  className="w-full prophet-input px-3 py-2 text-sm"
                  placeholder="例：https://api.example.com/api 或 http://localhost:3000"
                  value={apiGatewayUrl}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => {
                    setApiGatewayUrl(e.target.value);
                    sessionStorage.setItem("__home_api_url__", e.target.value);
                  }}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="block prophet-text font-bold text-sm">
                  魔法知識庫 ID
                </label>
                <input
                  type="text"
                  className="w-full prophet-input px-3 py-2 text-sm"
                  placeholder="留空將使用預設值"
                  value={knowledgeBaseId}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => {
                    setKnowledgeBaseId(e.target.value);
                    sessionStorage.setItem("__home_kb_id__", e.target.value);
                  }}
                  disabled={loading}
                />
              </div>

              {statusMessage && (
                <div className="border border-[var(--prophet-border)] bg-emerald-50 p-3">
                  <p className="prophet-text text-emerald-800 text-sm">
                    {statusMessage}
                  </p>
                </div>
              )}

              {error && (
                <div className="border-2 border-red-800 bg-red-50 p-3">
                  <p className="prophet-text text-red-800 text-sm">
                    {error.errorType === "timeout" &&
                      "連線逾時，請檢查網路連線"}
                    {error.errorType === "4xx" && `請求錯誤：${error.message}`}
                    {error.errorType === "5xx" &&
                      "後端服務暫時故障，請稍後重試"}
                    {error.errorType === "network" &&
                      "網路連線失敗，請檢查您的網路設定"}
                    {error.errorType === "parse" &&
                      "服務回應格式錯誤，請稍後重試"}
                    {!["timeout", "4xx", "5xx", "network", "parse"].includes(
                      error.errorType
                    ) && error.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full prophet-button py-3 px-6 disabled:opacity-50"
              >
                {loading ? <MagicLoading text="正在準備您的魔法人生..." /> : "開始人生模擬"}
              </button>
            </form>
          </div>

          {/* 右欄：魔法部公告與資訊 */}
          <div className="space-y-4">
            <div className="prophet-article">
              <h4 className="prophet-headline text-sm mb-3 border-b border-[var(--prophet-border)] pb-2">
                魔法部公告
              </h4>
              <div className="prophet-small-text">
                ⚡ 人生模擬魔法已通過魔法部安全認證
                <br />
                🔮 使用最新 AWS Bedrock 魔法技術
                <br />
                📜 完全符合巫師隱私保護法規
              </div>
            </div>

            <div className="prophet-article">
              <h4 className="prophet-headline text-sm mb-3 border-b border-[var(--prophet-border)] pb-2">
                使用說明
              </h4>
              <div className="prophet-small-text space-y-2">
                <p>1. 填寫知識庫 ID</p>
                <p>2. 點擊開始按鈕啟動模擬</p>
                <p>3. 跟隨指引完成人生選擇</p>
                <p>4. 獲得完整的人生報告</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 報紙頁腳 */}
      <footer className="border-t-2 border-[var(--prophet-border)] py-4 text-center bg-transparent">
        <div className="prophet-small-text opacity-60">
          © 2026 AWS Educate - Bedrock Workshop | The Daily Prophet
        </div>
      </footer>
    </div>
  );
};
