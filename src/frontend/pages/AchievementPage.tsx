import html2canvas from "html2canvas";
import {
  ArrowLeft,
  Award,
  Clock,
  Download,
  Facebook,
  Instagram,
  Link,
  RefreshCcw,
  Share2,
  Trophy,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SharePoster } from "../components/SharePoster";
import { useToast } from "../components/Toast";
import { getApiBaseUrl } from "../services/api/endpoints";
import { useAppStore } from "../store";

export const AchievementPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState, reset } = useAppStore();
  const posterRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterShareUrl, setPosterShareUrl] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // 若啟用 ESC 測試模式，允許無 summaryState 進入 AchievementPage
  const escTestMode =
    (import.meta.env.VITE_ENABLE_ESC_NAV as string | undefined) === "true";

  // 頁面載入時滾動到頂部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // 在 ESC 測試模式下，即使無 summaryState 也允許進入
    if (!summaryState && !escTestMode) {
      navigate("/summary", { replace: true });
    }
  }, [summaryState, navigate, escTestMode]);

  /**
   * ESC 快捷鍵導頁：進入下一頁（Report）測試流程
   */
  const handleEscNavigation = useCallback(() => {
    console.log("[AchievementPage ESC Nav] Navigating to home");
    navigate("/");
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

  // 在 ESC 測試模式下，提供預設範例資料以顯示頁面
  const displayState =
    summaryState ||
    (escTestMode
      ? {
          lifeScore: 85,
          radar: {
            wisdom: 85,
            wealth: 75,
            relationship: 90,
            career: 80,
            health: 88,
          },
          finalSummaryText: "你的人生充滿精彩故事和成就。",
          achievements: [
            { title: "成就者", desc: "展現卓越成就", iconUrl: "🏆" },
            { title: "領導者", desc: "具有領導力", iconUrl: "👑" },
          ],
          keyChoices: ["選擇1", "選擇2", "選擇3"],
        }
      : null);

  if (!displayState) return null;

  const buildPosterCanvas = async () => {
    if (!posterRef.current) return null;
    return html2canvas(posterRef.current, {
      backgroundColor: "#f8f6f0",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
  };

  const uploadPoster = async () => {
    if (uploadingPoster || posterShareUrl) return;
    setUploadingPoster(true);
    try {
      const canvas = await buildPosterCanvas();
      if (!canvas) {
        throw new Error("海報尚未完成");
      }
      const dataUrl = canvas.toDataURL("image/png");
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/upload-poster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataUrl }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload failed: ${response.status}`);
      }
      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error("Missing upload URL");
      }
      setPosterShareUrl(payload.url);
      showToast("海報已上傳完成，可直接分享", "success");
    } catch (error) {
      console.error("Failed to upload poster:", error);
      showToast("上傳海報失敗，請稍後重試", "error");
    } finally {
      setUploadingPoster(false);
    }
  };

  useEffect(() => {
    void uploadPoster();
  }, []);

  // 分享功能
  const handleFacebookShare = () => {
    if (!posterShareUrl) {
      showToast("海報尚未上傳完成", "error");
      return;
    }
    const url = encodeURIComponent(posterShareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  const handleTwitterShare = () => {
    if (!posterShareUrl) {
      showToast("海報尚未上傳完成", "error");
      return;
    }
    const url = encodeURIComponent(posterShareUrl);
    const text = encodeURIComponent(
      `📰 預言家日報獨家！我的 AI 人生模擬獲得 ${displayState.lifeScore}/100 分！AWS Bedrock 比水晶球還準？快來看看吧！ #AWSEducate #BedrockWorkshop`
    );
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank"
    );
  };

  const handleInstagramShare = () => {
    if (!posterShareUrl) {
      showToast("海報尚未上傳完成", "error");
      return;
    }
    navigator.clipboard.writeText(posterShareUrl);
    showToast("連結已複製，可貼到 Instagram！");
    setTimeout(() => {
      window.open("https://www.instagram.com/", "_blank");
    }, 1000);
  };

  const handleCopyLink = async () => {
    if (!posterShareUrl) {
      showToast("海報尚未上傳完成", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(posterShareUrl);
      showToast("連結已複製到剪貼板！");
    } catch (err) {
      showToast("複製失敗，請手動複製", "error");
    }
  };

  const handleDownloadJPG = async () => {
    if (!posterRef.current) return;

    setExporting(true);
    try {
      const canvas = await buildPosterCanvas();
      if (!canvas) {
        throw new Error("海報尚未完成");
      }

      const dataURL = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.download = `life-report-${displayState.lifeScore}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("報告已下載成功！");
    } catch (error) {
      showToast("下載失敗，請重試", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleRestart = () => {
    if (confirm("確定要重新開始嗎？")) {
      reset();
      navigate("/");
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
      <header className="text-center py-4 border-b-2 border-[var(--prophet-border)] relative">
        <button
          onClick={() => navigate("/summary")}
          className="absolute left-4 top-3 flex items-center gap-2 px-4 py-2 prophet-button text-sm"
        >
          <ArrowLeft size={14} />
          返回總結
        </button>

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
        <div className="prophet-dateline">★ 人生成就報告特刊 ★</div>

        <button
          onClick={handleRestart}
          className="absolute right-4 top-3 flex items-center gap-2 px-4 py-2 prophet-button text-sm"
        >
          <RefreshCcw size={14} />
          重新開始
        </button>
      </header>

      <div className="p-6 flex-1 min-h-0">
        <div className="grid grid-cols-7 gap-6 h-full min-h-0">
          <div className="col-span-2 min-h-0">
            <div className="prophet-article h-full min-h-0 flex flex-col">
              <h2 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2 flex items-center gap-2">
                <Trophy size={16} className="text-[var(--prophet-accent)]" />
                解鎖成就
              </h2>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                {displayState.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {displayState.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="border border-[var(--prophet-border)] p-3 hover:border-[var(--prophet-dark)] transition-all mr-2"
                      >
                        <div className="flex gap-3 items-start">
                          {achievement.iconUrl ? (
                            achievement.iconUrl.startsWith("http") ? (
                              <img
                                src={achievement.iconUrl}
                                alt={achievement.title}
                                className="w-8 h-8 prophet-photo flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center text-2xl flex-shrink-0">
                                {achievement.iconUrl}
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8 border border-[var(--prophet-dark)] flex items-center justify-center text-2xl flex-shrink-0">
                              🏆
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="prophet-subtitle font-bold mb-1 text-sm">
                              {achievement.title}
                            </h3>
                            <p className="prophet-small-text leading-relaxed">
                              {achievement.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--prophet-accent)]">
                    <Award size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="prophet-text">尚未解鎖成就</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 min-h-0">
            <div className="prophet-article h-full min-h-0 flex flex-col">
              <h2 className="prophet-headline text-lg mb-4 border-b border-[var(--prophet-border)] pb-2 flex items-center gap-2">
                <Clock size={16} className="text-[var(--prophet-accent)]" />
                關鍵抉擇
              </h2>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-4 relative mr-2">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--prophet-border)]"></div>

                  {displayState.keyChoices.map((choice, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-start relative"
                    >
                      <div className="bg-[var(--prophet-dark)] text-[var(--prophet-light)] w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1 border border-[var(--prophet-border)] p-3">
                        <p className="prophet-small-text leading-relaxed">
                          {choice}
                        </p>
                        <div className="mt-1 text-xs text-[var(--prophet-accent)]">
                          第 {index + 1} 個重要決定
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-3 min-h-0">
            <div className="prophet-article h-full flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4 border-b border-[var(--prophet-border)] pb-2">
                <h2 className="prophet-headline text-lg flex items-center gap-2">
                  <Share2 size={16} className="text-[var(--prophet-accent)]" />
                  我的人生海報
                </h2>

                <div className="flex items-center gap-2 -ml-20">
                  <div className="flex gap-1">
                    <button
                      onClick={handleFacebookShare}
                      className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all"
                      title="Facebook"
                    >
                      <Facebook size={14} />
                    </button>
                    <button
                      onClick={handleTwitterShare}
                      className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all"
                      title="X"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleInstagramShare}
                      className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all"
                      title="Instagram"
                    >
                      <Instagram size={14} />
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all"
                      title="複製連結"
                    >
                      <Link size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadJPG}
                    disabled={exporting}
                    className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-all disabled:opacity-50"
                    title="下載 JPG"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div
                  ref={posterRef}
                  className="w-full flex justify-center px-2"
                >
                  <SharePoster
                    finalImageUrl={displayState.finalImageUrl}
                    lifeScore={displayState.lifeScore}
                    radar={displayState.radar}
                    tagline="我的 AI 人生模擬結果"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};
