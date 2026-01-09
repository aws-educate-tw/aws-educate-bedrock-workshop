const { createLLM, invokeWithSchema } = require("../services/llm");
const { createSession } = require("../services/session");
const { backgroundPrompt } = require("../prompts/background");
const { backgroundSchema } = require("../schemas/background");
const { tableName } = require("../utils/dynamodb");
const { setCharacterAppearance, generateCharacterPortrait } = require("../services/imageGenerator");

const generateBackground = async (body) => {
    if (!body.knowledge_base_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "knowledge_base_id is required" }),
        };
    }

    const sessionId = `session_${Date.now()}`;

    let backgroundPayload;
    try {
        const llm = createLLM();
        // generateBackground 不使用 RAG，世界觀已經寫在 prompt 裡面
        backgroundPayload = await invokeWithSchema(llm, backgroundPrompt, backgroundSchema, {});
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
                knowledgeBaseId: body.knowledge_base_id,
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

    // 設定角色外觀資訊（供後續生圖使用，包含年齡以確保圖片準確）
    setCharacterAppearance({
        gender: playerIdentity.gender || "",
        appearance: playerIdentity.appearance || "",
        age: playerIdentity.age || null,
    });

    // 生成角色肖像圖（只有人物）
    const image = await generateCharacterPortrait();

    return {
        statusCode: 200,
        body: JSON.stringify({
            session_id: sessionId,
            background,
            player_identity: playerIdentity,
            life_goal: lifeGoal,
            image: image || null,
        }),
    };
};

module.exports = { generateBackground };
