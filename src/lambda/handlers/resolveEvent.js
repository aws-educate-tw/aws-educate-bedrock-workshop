const { createLLM, invokeWithSchema, DEFAULT_MODEL_ID } = require("../services/llm");
const { getSession, parseSessionState, updateSessionAfterEvent } = require("../services/session");
const { resolveEventPrompt } = require("../prompts/resolveEvent");
const { resolveEventSchema } = require("../schemas/resolveEvent");

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

    const { modelId, currentSummary, lifeGoal, playerState } = parseSessionState(sessionItem);

    let resolvePayload;
    try {
        const llm = createLLM(modelId || DEFAULT_MODEL_ID);
        resolvePayload = await invokeWithSchema(llm, resolveEventPrompt, resolveEventSchema, {
            summary: currentSummary,
            goal: lifeGoal,
            state: JSON.stringify(playerState),
            event: JSON.stringify(body.event),
            selectedOption: body.selected_option,
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    if (!resolvePayload?.event_outcome || !resolvePayload?.updated_player_state || !resolvePayload?.current_summary) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Invalid model response", raw: resolvePayload }),
        };
    }

    const now = new Date();
    const historyItem = {
        event_id: body.event.event_id || `event_${Date.now()}`,
        event_description: body.event.event_description || "",
        selected_option: body.selected_option,
        outcome_summary: resolvePayload.event_outcome,
        timestamp: now.toISOString(),
    };

    try {
        await updateSessionAfterEvent(body.session_id, sessionItem, {
            historyItem,
            updatedPlayerState: resolvePayload.updated_player_state,
            updatedSummary: resolvePayload.current_summary,
            modelId: modelId || DEFAULT_MODEL_ID,
            lifeGoal,
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
            current_summary: resolvePayload.current_summary,
        }),
    };
};

module.exports = { resolveEvent };
