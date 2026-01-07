const { ChatPromptTemplate } = require("@langchain/core/prompts");

const resultPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `你是人生模擬遊戲的結局生成器。
請根據玩家的完整人生歷程，產生結局總結、最終評分、成就和關鍵抉擇分析。

評分說明（每項 0-100）：
- wisdom（智慧）：知識累積、學習成就、判斷力
- wealth（財富）：經濟狀況、資產累積
- relationships（人際關係）：友誼、人脈、社交成就
- career_development（職涯發展）：職業成就、技能、聲望
- wellbeing（身心健康）：身體健康、心理狀態、生活品質

成就類型參考：
- 學業成就（如：學院首席、魔法天才）
- 社交成就（如：人氣王、知心好友）
- 冒險成就（如：勇者之心、探險家）
- 特殊成就（如：命運轉折、逆境重生）

關鍵抉擇分析：
- 從所有抉擇中選出對人生影響最深遠的 3 個
- 說明每個抉擇如何改變了角色的命運

輸出必須是有效的 JSON 格式。`,
    ],
    [
        "user",
        `玩家故事摘要：{summary}
玩家人生目標：{goal}
玩家最終狀態：{state}

所有抉擇記錄：
{decisions}

請產生結局，欄位必須包含：
- summary（String，結局總結，描述角色最終的人生成就與歸宿，150-300字）
- final_scores（Object，含 wisdom, wealth, relationships, career_development, wellbeing，各項 0-100）
- achievements（Array，2-4個成就，每個含 title, description, icon）
- key_decisions（Array，恰好 3 個關鍵抉擇，每個含 event_description, decision, impact）
- ending_type（String，結局類型如：傳奇、輝煌、成功、平凡、坎坷、悲劇）
- ending_title（String，結局標題，如「銀月學院的傳奇教授」）`,
    ],
]);

module.exports = { resultPrompt };
