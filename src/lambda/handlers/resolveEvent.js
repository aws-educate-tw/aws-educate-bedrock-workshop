const { createLLM, invokeWithSchema } = require("../services/llm");
const { getSession, parseSessionState, updateSessionAfterEvent } = require("../services/session");
const { resolveEventPrompt } = require("../prompts/resolveEvent");
const { resolveEventSchema } = require("../schemas/resolveEvent");
const { generateImage, setCharacterAppearance } = require("../services/imageGenerator");
const { setKnowledgeBaseId } = require("../services/knowledgeBase");
const { getMinimumAge } = require("../config/gamePhases");

const resolveEvent = async (body) => {
    if (!body.session_id || !body.event || !body.selected_option) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "session_id, event, and selected_option are required" }),
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
        currentSummary,
        lifeGoal,
        playerState,
        playerIdentity,
        turn,
        history,
    } = parseSessionState(sessionItem);

    // 設定此次請求使用的 Knowledge Base ID
    setKnowledgeBaseId(knowledgeBaseId);

    // 設定角色外觀資訊（供生圖使用）
    setCharacterAppearance(playerIdentity);

    // 計算此回合角色的最低年齡
    const minimumAge = getMinimumAge(turn);

    const existingHistoryItem = (history || []).find(
        (item) => item?.event_id === body.event.event_id
    );

    const isRetryWithDifferentSelection =
        Boolean(existingHistoryItem) &&
        existingHistoryItem.selected_option !== body.selected_option;

    if (existingHistoryItem && !isRetryWithDifferentSelection) {
        const resolvedOutcome =
            existingHistoryItem.event_outcome || existingHistoryItem.outcome_summary || "";
        const resolvedState =
            existingHistoryItem.updated_player_state || playerState || {};
        const resolvedStatChanges = existingHistoryItem.stat_changes || [];
        const resolvedSummary =
            existingHistoryItem.current_summary || currentSummary || "";
        const resolvedImage = null;

        return {
            statusCode: 200,
            body: JSON.stringify({
                event_outcome: resolvedOutcome,
                updated_player_state: resolvedState,
                stat_changes: resolvedStatChanges,
                current_summary: resolvedSummary,
                image: resolvedImage,
            }),
        };
    }

    let resolvePayload;
    try {
        const llm = createLLM();
        resolvePayload = await invokeWithSchema(llm, resolveEventPrompt, resolveEventSchema, {
            summary: currentSummary,
            goal: lifeGoal,
            state: JSON.stringify(playerState),
            event: JSON.stringify(body.event),
            selectedOption: body.selected_option,
            minimumAge: minimumAge,
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    if (!resolvePayload?.event_outcome || !resolvePayload?.updated_player_state || !resolvePayload?.current_summary || !resolvePayload?.stat_changes) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Invalid model response", raw: resolvePayload }),
        };
    }

    // 生成結果圖片（使用 LLM 產生的英文 image_prompt）
    const image = await generateImage(resolvePayload.image_prompt || resolvePayload.event_outcome);

    const now = new Date();
    const historyItem = {
        event_id: body.event.event_id || `event_${Date.now()}`,
        event_description: body.event.event_description || "",
        selected_option: body.selected_option,
        event_outcome: resolvePayload.event_outcome,
        outcome_summary: resolvePayload.event_outcome,
        updated_player_state: resolvePayload.updated_player_state,
        stat_changes: resolvePayload.stat_changes,
        current_summary: resolvePayload.current_summary,
        image: null,
        timestamp: now.toISOString(),
    };

    try {
        await updateSessionAfterEvent(body.session_id, sessionItem, {
            historyItem,
            updatedPlayerState: resolvePayload.updated_player_state,
            updatedSummary: resolvePayload.current_summary,
            knowledgeBaseId,
            lifeGoal,
            preserveTurn: isRetryWithDifferentSelection,
            replaceEventId: isRetryWithDifferentSelection
                ? existingHistoryItem.event_id
                : null,
        });
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to update session", error: error.message }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            event_outcome: resolvePayload.event_outcome,
            updated_player_state: resolvePayload.updated_player_state,
            stat_changes: resolvePayload.stat_changes,
            current_summary: resolvePayload.current_summary,
            image: image || null,
        }),
    };
};

module.exports = { resolveEvent };
