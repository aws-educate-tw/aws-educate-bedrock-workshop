import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Base64Image } from "./Base64Image";

interface CharacterCardProps {
  portrait: string | null;
  background: string | null;
  lifeGoal: string | null;
  currentSummary: string | null;
  playerIdentity: {
    name?: string;
    gender?: string;
    appearance?: string;
    age?: number;
    profession?: string;
  } | null;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  portrait,
  background,
  lifeGoal,
  currentSummary,
  playerIdentity,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 進入頁面後 1 秒自動展開角色卡
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 收合時露出的標籤 */}
      <motion.button
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center"
        onClick={() => setIsOpen(true)}
        initial={{ x: 0 }}
        animate={{ x: isOpen ? -100 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="bg-[var(--prophet-dark)] text-[var(--prophet-light)] py-4 px-2 rounded-r-lg shadow-lg flex flex-col items-center gap-2 border-2 border-l-0 border-[var(--prophet-accent)]">
          <User size={20} />
          <span
            className="writing-vertical text-xs font-bold tracking-wider"
            style={{ writingMode: "vertical-rl" }}
          >
            角色卡
          </span>
          <ChevronRight size={16} />
        </div>
      </motion.button>

      {/* 展開的資訊卡 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* 資訊卡本體 */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 w-[320px] max-w-[85vw] bg-[var(--prophet-bg)] border-r-4 border-[var(--prophet-border)] shadow-2xl overflow-hidden flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 標題列 */}
              <div className="flex items-center justify-between p-4 border-b-2 border-[var(--prophet-border)] bg-[var(--prophet-dark)] text-[var(--prophet-light)]">
                <h2 className="prophet-headline text-lg flex items-center gap-2">
                  <User size={20} />
                  角色檔案
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[var(--prophet-accent)] rounded transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>

              {/* 內容區域 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* 角色肖像 */}
                <div className="prophet-article p-3">
                  <h3 className="prophet-headline text-sm mb-2 text-center border-b border-[var(--prophet-border)] pb-1">
                    人物肖像
                  </h3>
                  <div className="prophet-photo mx-auto" style={{ maxWidth: "200px" }}>
                    {portrait ? (
                      <Base64Image
                        base64={portrait}
                        alt="角色肖像"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[var(--prophet-border)] flex items-center justify-center">
                        <User size={48} className="opacity-30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 基本資訊 */}
                {playerIdentity && (
                  <div className="prophet-article p-3">
                    <h3 className="prophet-headline text-sm mb-2 text-center border-b border-[var(--prophet-border)] pb-1">
                      基本資訊
                    </h3>
                    <div className="space-y-2 prophet-text text-sm">
                      {playerIdentity.name && (
                        <div className="flex justify-between border-b border-[var(--prophet-border)] pb-1">
                          <span className="opacity-70">姓名</span>
                          <span className="font-bold">{playerIdentity.name}</span>
                        </div>
                      )}
                      {playerIdentity.gender && (
                        <div className="flex justify-between border-b border-[var(--prophet-border)] pb-1">
                          <span className="opacity-70">性別</span>
                          <span className="font-bold">{playerIdentity.gender}</span>
                        </div>
                      )}
                      {playerIdentity.age && (
                        <div className="flex justify-between border-b border-[var(--prophet-border)] pb-1">
                          <span className="opacity-70">初始年齡</span>
                          <span className="font-bold">{playerIdentity.age} 歲</span>
                        </div>
                      )}
                      {playerIdentity.profession && (
                        <div className="flex justify-between border-b border-[var(--prophet-border)] pb-1">
                          <span className="opacity-70">身份</span>
                          <span className="font-bold">{playerIdentity.profession}</span>
                        </div>
                      )}
                      {playerIdentity.appearance && (
                        <div className="pt-1">
                          <span className="opacity-70">外貌特徵</span>
                          <p className="mt-1 text-xs leading-relaxed">
                            {playerIdentity.appearance}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 人生目標 */}
                {lifeGoal && (
                  <div className="prophet-article p-3">
                    <h3 className="prophet-headline text-sm mb-2 text-center border-b border-[var(--prophet-border)] pb-1">
                      人生目標
                    </h3>
                    <p className="prophet-text text-sm leading-relaxed">
                      {lifeGoal}
                    </p>
                  </div>
                )}

                {/* 角色背景 */}
                {background && (
                  <div className="prophet-article p-3">
                    <h3 className="prophet-headline text-sm mb-2 text-center border-b border-[var(--prophet-border)] pb-1">
                      角色背景
                    </h3>
                    <p className="prophet-text text-sm leading-relaxed">
                      {background}
                    </p>
                  </div>
                )}

                {/* 目前狀況 */}
                {currentSummary && (
                  <div className="prophet-article p-3">
                    <h3 className="prophet-headline text-sm mb-2 text-center border-b border-[var(--prophet-border)] pb-1">
                      目前狀況
                    </h3>
                    <p className="prophet-text text-sm leading-relaxed">
                      {currentSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* 底部裝飾 */}
              <div className="p-3 border-t border-[var(--prophet-border)] text-center">
                <span className="prophet-small-text opacity-60">
                  點擊卡片外或 ← 收起
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
