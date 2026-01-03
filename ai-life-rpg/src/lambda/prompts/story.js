const { ChatPromptTemplate } = require("@langchain/core/prompts");

const storyPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的事件生成器。
請根據玩家狀態與摘要，產生一個人生事件與選項。

參考資料：
{ragContext}

請參考以上資料來生成更有深度的事件。
輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `遊戲狀態：
目前摘要：{summary}
人生目標：{goal}
玩家狀態：{state}

請產生一個人生事件，欄位必須包含：
- event_id（String）
- event_description（String）
- options（陣列，每個選項含 option_id 和 description）`,
    ],
]);

module.exports = { storyPrompt };
