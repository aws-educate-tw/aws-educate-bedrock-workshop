const { createLLM, invokeWithRAG, DEFAULT_MODEL_ID } = require("../services/llm");
const { getSession, parseSessionState } = require("../services/session");
const { storyPrompt } = require("../prompts/story");
const { storySchema } = require("../schemas/story");

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

    const { modelId, storyContext } = parseSessionState(sessionItem);

    let storyPayload;
    try {
        const llm = createLLM(modelId || DEFAULT_MODEL_ID);
        storyPayload = await invokeWithRAG(llm, storyPrompt, storySchema, {
            summary: storyContext.summary,
            goal: storyContext.goal,
            state: JSON.stringify(storyContext.state),
        }, {
            query: `${storyContext.summary} ${storyContext.goal}`,
            numberOfResults: 3,
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

    return {
        statusCode: 200,
        body: JSON.stringify({
            event_id: storyPayload.event_id,
            event_description: storyPayload.event_description,
            options: storyPayload.options,
        }),
    };
};

module.exports = { generateStory };
