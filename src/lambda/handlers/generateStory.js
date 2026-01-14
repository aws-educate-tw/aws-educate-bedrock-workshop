const { createLLM, invokeWithRAG } = require("../services/llm");
const { getSession, parseSessionState, updateSessionWithLastEvent } = require("../services/session");
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

    const {
        knowledgeBaseId,
        storyContext,
        turn,
        phaseInfo,
        playerIdentity,
        lastEventTurn,
        lastEvent,
    } = parseSessionState(sessionItem);

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

    if (lastEventTurn === turn && lastEvent) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                event_id: lastEvent.event_id,
                event_description: lastEvent.event_description,
                options: lastEvent.options,
                image: null,
                should_generate_result: lastEvent.should_generate_result,
                game_progress: lastEvent.game_progress,
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

    const eventId = `${turn}-${storyPayload.event_id}`;
    const shouldGenerateResult = phaseInfo.isLastTurn;

    // 生成事件圖片（使用 LLM 產生的英文 image_prompt）
    const image = await generateImage(
        storyPayload.image_prompt || storyPayload.event_description
    );

    const eventResponse = {
        event_id: eventId,
        event_description: storyPayload.event_description,
        options: storyPayload.options,
        image: image || null,
        should_generate_result: shouldGenerateResult,
        game_progress: {
            turn: turn + 1,
            total_turns: TOTAL_TURNS,
            phase: phaseInfo.currentPhase.name,
            phase_progress: phaseInfo.phaseProgressText,
            turns_left: phaseInfo.totalTurnsLeft,
        },
    };

    const eventCache = {
        event_id: eventId,
        event_description: storyPayload.event_description,
        options: storyPayload.options,
        should_generate_result: shouldGenerateResult,
        game_progress: eventResponse.game_progress,
    };

    try {
        await updateSessionWithLastEvent(body.session_id, sessionItem, {
            lastEventTurn: turn,
            lastEvent: eventCache,
        });
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to cache story event",
                error: error.message,
            }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(eventResponse),
    };
};

module.exports = { generateStory };
