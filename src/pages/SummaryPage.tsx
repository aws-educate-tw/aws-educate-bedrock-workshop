import { ChevronRight } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RadarChartComponent } from "../components/RadarChartComponent";
import { SummaryState, useAppStore } from "../store";

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaryState, setSummaryState } = useAppStore();
  const headerRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    [headerRef.current, ...cardRefs.current].forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!summaryState) {
      // 如果沒有 summaryState，使用預設資料
      const defaultSummary: SummaryState = {
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
        keyChoices: [
          "童年時選擇幫助害羞的同學，培養了同理心",
          "學生時期專注學業，奠定了知識基礎",
          "成年後選擇穩定的工作，重視工作生活平衡",
        ],
      };
      setSummaryState(defaultSummary);
    }
  }, [summaryState, setSummaryState]);

  if (!summaryState) {
    return null;
  }

  // 計算整體表現等級
  const getPerformanceLevel = (score: number) => {
    if (score >= 90)
      return { level: "卓越", color: "text-[#ceb485]", bg: "bg-[#ceb485]/10" };
    if (score >= 75)
      return { level: "優秀", color: "text-[#5f4e42]", bg: "bg-[#5f4e42]/10" };
    if (score >= 60)
      return { level: "良好", color: "text-[#e2e0d3]", bg: "bg-[#e2e0d3]/10" };
    if (score >= 40)
      return { level: "普通", color: "text-[#5f4e42]", bg: "bg-[#5f4e42]/10" };
    return { level: "待改善", color: "text-[#632024]", bg: "bg-[#632024]/10" };
  };

  const performance = getPerformanceLevel(summaryState.lifeScore);

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
        <div className="prophet-dateline">★ 人生總結特刊 ★</div>
      </header>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="prophet-article">
            <h2 className="prophet-headline text-2xl mb-4 border-b-2 border-[var(--prophet-border)] pb-2">
              人生總結
            </h2>

            <div className="prophet-text leading-relaxed space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {summaryState.finalSummaryText.split("。").map(
                (sentence, index) =>
                  sentence.trim() && (
                    <p key={index} className="mb-4 text-justify">
                      {sentence.trim()}。
                    </p>
                  )
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--prophet-border)]">
              <button
                onClick={() => navigate("/achievement")}
                className="w-full prophet-button py-3 px-6 flex items-center justify-center gap-3"
              >
                <span>查看完整人生成就報告</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="prophet-article">
            <h2 className="prophet-headline text-2xl mb-4 border-b-2 border-[var(--prophet-border)] pb-2">
              人生五維分析
            </h2>

            <div className="mb-6">
              <RadarChartComponent data={summaryState.radar} hideScale={true} />
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl font-black text-[var(--prophet-dark)] mb-2 prophet-title">
                {summaryState.lifeScore}
              </div>
              <div className="prophet-text font-medium">人生分數 / 100</div>

              <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--prophet-border)]">
                <div className="w-2 h-2 bg-[var(--prophet-accent)]"></div>
                <span className="prophet-small-text font-semibold">
                  整體表現：{performance.level}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
