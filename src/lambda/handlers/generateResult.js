const { createLLM, invokeWithSchema } = require("../services/llm");
const { getSession, parseSessionState, updateSessionWithResult } = require("../services/session");
const { resultPrompt } = require("../prompts/result");
const { resultSchema } = require("../schemas/result");
const { generateImage, setCharacterAppearance } = require("../services/imageGenerator");
const { setKnowledgeBaseId } = require("../services/knowledgeBase");

const generateResult = async (body) => {
    if (!body.session_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "session_id is required" }),
        };
    }

    let sessionItem;
    try {
        sessionItem = await getSession(body.session_id);
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to read session", error: error.message }),
        };
    }

    if (!sessionItem) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Session not found" }),
        };
    }

    const { knowledgeBaseId, currentSummary, lifeGoal, playerState, playerIdentity, history } = parseSessionState(sessionItem);

    // 設定此次請求使用的 Knowledge Base ID
    setKnowledgeBaseId(knowledgeBaseId);

    // 設定角色外觀資訊（供生圖使用）
    setCharacterAppearance(playerIdentity);

    // 整理所有抉擇記錄，格式化給 LLM 判斷關鍵抉擇
    const decisionsText = history.map((h, i) =>
        `第 ${i + 1} 回合：\n事件：${h.event_description}\n選擇：${h.selected_option}\n結果：${h.outcome_summary}`
    ).join("\n\n");

    let resultPayload;
    try {
        const llm = createLLM();
        resultPayload = await invokeWithSchema(llm, resultPrompt, resultSchema, {
            summary: currentSummary,
            goal: lifeGoal,
            state: JSON.stringify(playerState),
            decisions: decisionsText || "（無抉擇記錄）",
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    if (!resultPayload?.summary || !resultPayload?.final_scores || !resultPayload?.ending_type || !resultPayload?.achievements || !resultPayload?.key_decisions) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Invalid model response", raw: resultPayload }),
        };
    }

    const finalResult = {
        summary: resultPayload.summary,
        final_scores: resultPayload.final_scores,
        achievements: resultPayload.achievements,
        key_decisions: resultPayload.key_decisions,
        ending_type: resultPayload.ending_type,
        ending_title: resultPayload.ending_title,
    };

    try {
        await updateSessionWithResult(body.session_id, sessionItem, {
            finalResult,
            knowledgeBaseId,
            lifeGoal,
            playerState,
            history,
        });
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to update session", error: error.message }),
        };
    }

    // 生成結局圖片（使用 LLM 產生的英文 image_prompt）
    const image = await generateImage(resultPayload.image_prompt || `${finalResult.ending_title}. ${finalResult.summary}. A ${finalResult.ending_type} ending scene.`);

    return {
        statusCode: 200,
        body: JSON.stringify({
            ...finalResult,
            image: image || null,
        }),
    };
};

module.exports = { generateResult };
