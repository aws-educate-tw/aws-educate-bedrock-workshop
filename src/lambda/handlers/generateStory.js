const { createLLM, invokeWithRAG } = require("../services/llm");
const { getSession, parseSessionState } = require("../services/session");
const { storyPrompt } = require("../prompts/story");
const { storySchema } = require("../schemas/story");
const { generateImage, setCharacterAppearance } = require("../services/imageGenerator");
const { getPhasePrompt, TOTAL_TURNS } = require("../config/gamePhases");
const { setKnowledgeBaseId } = require("../services/knowledgeBase");

const generateStory = async (body) => {
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

    const { knowledgeBaseId, storyContext, turn, phaseInfo, playerIdentity } = parseSessionState(sessionItem);

    // 設定此次請求使用的 Knowledge Base ID
    setKnowledgeBaseId(knowledgeBaseId);

    // 設定角色外觀資訊（供生圖使用）
    setCharacterAppearance(playerIdentity);

    // 檢查遊戲是否已結束
    if (phaseInfo.isGameEnding || turn >= TOTAL_TURNS) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Game has ended",
                should_generate_result: true,
                turn,
                total_turns: TOTAL_TURNS,
            }),
        };
    }

    // 生成階段提示
    const phasePrompt = getPhasePrompt(turn);

    let storyPayload;
    try {
        const llm = createLLM();
        storyPayload = await invokeWithRAG(llm, storyPrompt, storySchema, {
            summary: storyContext.summary,
            goal: storyContext.goal,
            state: JSON.stringify(storyContext.state),
            phasePrompt,
        }, {
            query: `${storyContext.summary} ${storyContext.goal} ${phaseInfo.currentPhase.name}`,
            numberOfResults: 10,  // 多搜尋一些結果
            turn,                 // 傳入回合數用於滑動窗口
            windowSize: 3,        // 每回合使用 3 個結果
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    if (!storyPayload?.event_id || !storyPayload?.event_description || !storyPayload?.options) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Invalid model response", raw: storyPayload }),
        };
    }

    // 生成事件圖片
    const image = await generateImage(storyPayload.event_description);

    return {
        statusCode: 200,
        body: JSON.stringify({
            event_id: storyPayload.event_id,
            event_description: storyPayload.event_description,
            options: storyPayload.options,
            image: image || null,
            // 回傳遊戲進度資訊
            game_progress: {
                turn: turn + 1,
                total_turns: TOTAL_TURNS,
                phase: phaseInfo.currentPhase.name,
                phase_progress: phaseInfo.phaseProgressText,
                turns_left: phaseInfo.totalTurnsLeft,
            },
        }),
    };
};

module.exports = { generateStory };
