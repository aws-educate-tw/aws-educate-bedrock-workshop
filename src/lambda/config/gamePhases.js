/**
 * 人生階段配置
 * 每個階段有固定回合數，讓劇情有節奏地推進
 */

const LIFE_PHASES = [
    {
        id: "childhood",
        name: "童年",
        ageRange: "7-11歲",
        turnsPerPhase: 2,
        description: "發現魔法天賦，收到幻霧學園錄取通知",
        themes: ["魔法覺醒", "家庭", "入學準備", "初識魔法世界"],
    },
    {
        id: "academy_early",
        name: "學院初期",
        ageRange: "11-14歲",
        turnsPerPhase: 2,
        description: "進入幻霧學園，學習基礎魔法",
        themes: ["學院分配", "基礎魔法", "結交朋友", "適應新環境"],
    },
    {
        id: "academy_late",
        name: "學院後期",
        ageRange: "15-17歲",
        turnsPerPhase: 2,
        description: "精進魔法技藝，面對重要抉擇",
        themes: ["進階魔法", "學院競賽", "人際衝突", "未來方向"],
    },
    {
        id: "graduation",
        name: "畢業與成年",
        ageRange: "17-20歲",
        turnsPerPhase: 2,
        description: "踏入魔法社會，開啟人生新篇章",
        themes: ["畢業考驗", "職業選擇", "人生抉擇", "踏入社會"],
    },
];

const TOTAL_PHASES = LIFE_PHASES.length;
const TURNS_PER_PHASE = 2;
const TOTAL_TURNS = TOTAL_PHASES * TURNS_PER_PHASE; // 8 回合

/**
 * 根據回合數計算目前階段
 * @param {number} turn - 目前回合（從 0 開始）
 * @returns {object} 階段資訊
 */
const getPhaseInfo = (turn) => {
    const phaseIndex = Math.min(Math.floor(turn / TURNS_PER_PHASE), TOTAL_PHASES - 1);
    const currentPhase = LIFE_PHASES[phaseIndex];
    const turnInPhase = turn % TURNS_PER_PHASE;
    const turnsLeftInPhase = TURNS_PER_PHASE - turnInPhase - 1;
    const isLastTurnOfPhase = turnsLeftInPhase === 0;
    const isLastPhase = phaseIndex === TOTAL_PHASES - 1;
    const totalTurnsLeft = TOTAL_TURNS - turn - 1;
    // isGameEnding: 當 turn >= TOTAL_TURNS 時才結束（即所有回合都玩完了）
    // 例如 8 回合遊戲，turn 0-7 都可以玩，turn 8 時才結束
    const isGameEnding = turn >= TOTAL_TURNS;
    const isLastTurn = turn === TOTAL_TURNS - 1; // 最後一回合（但還沒結束）

    return {
        phaseIndex,
        currentPhase,
        turnInPhase,
        turnsLeftInPhase,
        isLastTurnOfPhase,
        isLastPhase,
        totalTurnsLeft,
        isGameEnding,
        isLastTurn,
        progressText: `第 ${turn + 1}/${TOTAL_TURNS} 回合`,
        phaseProgressText: `${currentPhase.name}（${turnInPhase + 1}/${TURNS_PER_PHASE}）`,
    };
};

/**
 * 生成給 LLM 的階段提示
 * @param {number} turn - 目前回合
 * @returns {string} 階段提示文字
 */
const getPhasePrompt = (turn) => {
    const info = getPhaseInfo(turn);
    const { currentPhase, turnsLeftInPhase, isLastTurnOfPhase, isLastPhase, totalTurnsLeft, isLastTurn } = info;

    let prompt = `【人生階段】${currentPhase.name}（${currentPhase.ageRange}）\n`;
    prompt += `【階段主題】${currentPhase.themes.join("、")}\n`;
    prompt += `【進度】${info.progressText}，${info.phaseProgressText}\n`;

    if (isLastTurn) {
        prompt += `\n⚠️ 這是遊戲的最後一回合！請生成一個具有總結性的重大事件，為這段人生畫下句點。`;
    } else if (isLastTurnOfPhase) {
        if (isLastPhase) {
            prompt += `\n⚠️ 這是畢業階段的最後一回合，下一回合將進入遊戲結局。請生成一個為人生做總結的重要事件。`;
        } else {
            const nextPhase = LIFE_PHASES[info.phaseIndex + 1];
            prompt += `\n⚠️ 這是${currentPhase.name}的最後一回合！下一回合將進入「${nextPhase.name}」階段。請生成一個具有轉折意義的重大事件，為這個階段畫下句點。`;
        }
    } else {
        prompt += `\n📍 ${currentPhase.name}還剩 ${turnsLeftInPhase} 回合，請根據階段主題生成適合的事件。`;
    }

    if (totalTurnsLeft <= 2 && totalTurnsLeft > 0) {
        prompt += `\n\n🎯 遊戲即將結束（剩餘 ${totalTurnsLeft} 回合），請加快劇情節奏，讓故事朝向結局發展。`;
    }

    return prompt;
};

module.exports = {
    LIFE_PHASES,
    TOTAL_PHASES,
    TURNS_PER_PHASE,
    TOTAL_TURNS,
    getPhaseInfo,
    getPhasePrompt,
};
