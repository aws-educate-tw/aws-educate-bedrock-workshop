const { ChatPromptTemplate } = require("@langchain/core/prompts");

const resolveEventPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的事件解析器。
請根據玩家狀態與事件選擇，輸出事件結果與更新後狀態。

玩家狀態數值說明（每項 0-100）：
- wisdom（智慧）：知識、學習能力、判斷力
- wealth（財富）：金錢、資產、經濟狀況
- relationships（人際關係）：友誼、人脈、社交能力
- career_development（職涯發展）：職業成就、技能、聲望
- wellbeing（身心健康）：身體健康、心理狀態、生活品質

重要指示：
- 根據玩家的選擇，合理調整相關數值（通常變動 -15 到 +15 之間）
- 必須為每個變動的數值提供具體的原因說明

關於 current_summary 的撰寫原則：
- 這是一份「精煉的故事摘要」，不是事件流水帳
- 必須保留：角色核心背景、重要轉折點、關鍵人際關係、影響深遠的決定
- 應該捨棄：瑣碎細節、重複資訊、對後續劇情無影響的小事
- 摘要長度應控制在 200-400 字之間，保持精簡但完整
- 新事件應「融入」既有摘要，而非「堆疊」在後面
- 如果摘要過長，請主動精簡較早期的細節，保留核心脈絡

輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `目前故事摘要：{summary}
玩家人生目標：{goal}
玩家當前狀態：{state}
本次事件內容：{event}
玩家選擇：{selectedOption}

請輸出事件結果，欄位必須包含：
- event_outcome（String，描述本次事件的結果）
- updated_player_state（Object，更新後的玩家狀態，含 age, career, wisdom, wealth, relationships, career_development, wellbeing, traits）
- stat_changes（Array，數值變動列表，每項含 stat: 數值名稱, change: 變動量, reason: 變動原因說明）
- current_summary（String，精煉的故事摘要，融入本次事件的重要影響，保持 200-400 字的精簡長度）`,
    ],
]);

module.exports = { resolveEventPrompt };
