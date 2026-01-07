import { useEffect, useRef } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AchievementPage } from "./pages/AchievementPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { SummaryPage } from "./pages/SummaryPage";

const router = createBrowserRouter(
  [
    { path: "/", element: <HomePage /> },
    { path: "/game", element: <GamePage /> },
    { path: "/summary", element: <SummaryPage /> },
    { path: "/achievement", element: <AchievementPage /> },
    { path: "/report", element: <ReportPage /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // 頁面載入時播放背景音樂
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.3;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise.catch(() => {
              // 自動播放失敗，忽略
            });
          }
        }
      } catch {
        // 音頻播放失敗，忽略
      }
    };

    playAudio();

    // 監聽用戶互動事件來啟動音樂（瀏覽器自動播放政策）
    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {
          // 播放失敗，忽略
        });
      }
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  return (
    <>
      {/* 全局背景音樂 */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/hedwigs-theme.mp3" type="audio/mpeg" />
      </audio>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
