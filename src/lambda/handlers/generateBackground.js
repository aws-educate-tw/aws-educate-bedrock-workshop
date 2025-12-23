const { createLLM, invokeWithRAG, DEFAULT_MODEL_ID } = require("../services/llm");
const { createSession } = require("../services/session");
const { backgroundPrompt } = require("../prompts/background");
const { backgroundSchema } = require("../schemas/background");
const { tableName } = require("../utils/dynamodb");

const generateBackground = async (body) => {
    if (!body.model_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "model_id is required" }),
        };
    }

    const sessionId = `session_${Date.now()}`;
    const modelId = body.model_id || DEFAULT_MODEL_ID;

    let backgroundPayload;
    try {
        const llm = createLLM(modelId);
        backgroundPayload = await invokeWithRAG(llm, backgroundPrompt, backgroundSchema, {}, {
            query: "人生模擬遊戲 背景設定 世界觀",
            numberOfResults: 3,
        });
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ message: "Bedrock generation failed", error: error.message }),
        };
    }

    const background = backgroundPayload.background || "";
    const playerIdentity = backgroundPayload.player_identity || {};
    const lifeGoal = backgroundPayload.life_goal || "";

    if (tableName) {
        try {
            await createSession(sessionId, {
                modelId,
                background: backgroundPayload,
                playerIdentity,
                lifeGoal,
            });
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to create session", error: error.message }),
            };
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            session_id: sessionId,
            background,
            player_identity: playerIdentity,
            life_goal: lifeGoal,
        }),
    };
};

module.exports = { generateBackground };
