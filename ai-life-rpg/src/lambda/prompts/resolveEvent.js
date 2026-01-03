const { ChatPromptTemplate } = require("@langchain/core/prompts");

const resolveEventPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的事件解析器。
請根據玩家狀態與事件選擇，輸出事件結果與更新後狀態。
輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `玩家摘要：{summary}
玩家目標：{goal}
玩家狀態：{state}
事件內容：{event}
玩家選擇：{selectedOption}

請輸出事件結果，欄位必須包含：
- event_outcome（String，描述事件結果）
- updated_player_state（Object，更新後的玩家狀態，含 age, career, finance, health, relationships, traits）
- current_summary（String，更新後的故事摘要）`,
    ],
]);

module.exports = { resolveEventPrompt };
