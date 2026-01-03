const { createLLM, invokeWithSchema, DEFAULT_MODEL_ID } = require("../services/llm");
const { getSession, parseSessionState, updateSessionWithResult } = require("../services/session");
const { resultPrompt } = require("../prompts/result");
const { resultSchema } = require("../schemas/result");

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

    const { modelId, currentSummary, lifeGoal, playerState, history } = parseSessionState(sessionItem);

    let resultPayload;
    try {
        const llm = createLLM(modelId || DEFAULT_MODEL_ID);
        resultPayload = await invokeWithSchema(llm, resultPrompt, resultSchema, {
            summary: currentSummary,
            goal: lifeGoal,
            state: JSON.stringify(playerState),
            history: JSON.stringify(history),
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    if (!resultPayload?.summary || !resultPayload?.radar_scores || !resultPayload?.ending_type) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Invalid model response", raw: resultPayload }),
        };
    }

    const finalResult = {
        summary: resultPayload.summary,
        radar_scores: resultPayload.radar_scores,
        ending_type: resultPayload.ending_type,
    };

    try {
        await updateSessionWithResult(body.session_id, sessionItem, {
            finalResult,
            modelId: modelId || DEFAULT_MODEL_ID,
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

    return {
        statusCode: 200,
        body: JSON.stringify(finalResult),
    };
};

module.exports = { generateResult };
