const { ChatPromptTemplate } = require("@langchain/core/prompts");

const backgroundPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的背景生成器。
請生成一個獨特的遊戲基礎背景設定，世界觀請以參考資料為主。

參考資料：
{ragContext}

請使用以上資料的世界觀以及角色設定來生成更豐富的背景設定。
請注意你生成的角色是一個人生故事的起點，因此主角必須在童年時期。
輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `請生成遊戲背景，欄位必須包含：
- background（世界觀與時代背景描述，String）
- player_identity（含 age, profession, initial_traits）
- life_goal（本局人生目標，String）`,
    ],
]);

module.exports = { backgroundPrompt };
