const { ChatPromptTemplate } = require("@langchain/core/prompts");

const resultPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的結局生成器。
請根據玩家最終狀態與歷史，產生結局摘要與雷達圖評分。
輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `玩家摘要：{summary}
玩家目標：{goal}
玩家狀態：{state}
歷史事件：{history}

請產生結局，欄位必須包含：
- summary（String，結局摘要）
- radar_scores（Object，含 financial, career, health, relationships, self_fulfillment，各項評分 0-100）
- ending_type（String，結局類型）`,
    ],
]);

module.exports = { resultPrompt };
