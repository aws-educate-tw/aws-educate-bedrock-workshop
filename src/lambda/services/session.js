const {
    dynamoClient,
    tableName,
    PutItemCommand,
    GetItemCommand,
    getAttrString,
    getAttrNumber,
    getAttrList,
    getAttrMap,
    fromAttr,
    toAttr,
} = require("../utils/dynamodb");

const getSession = async (sessionId) => {
    if (!tableName) {
        throw new Error("Missing DDB_TABLE_NAME");
    }

    const result = await dynamoClient.send(
        new GetItemCommand({
            TableName: tableName,
            Key: { session_id: { S: sessionId } },
        })
    );

    return result.Item || null;
};

const createSession = async (sessionId, data) => {
    if (!tableName) {
        throw new Error("Missing DDB_TABLE_NAME");
    }

    const now = new Date();
    const ttl = Math.floor(now.getTime() / 1000) + 24 * 60 * 60;

    const { modelId, background, playerIdentity, lifeGoal } = data;
    const initialTraits = Array.isArray(playerIdentity.initial_traits)
        ? playerIdentity.initial_traits
        : [];

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: "active" },
                model_id: { S: modelId },
                world_context: {
                    M: {
                        era: { S: background.world_context?.era || "modern" },
                        theme: { S: background.world_context?.theme || "career-focused" },
                    },
                },
                player_identity: {
                    M: {
                        age: { N: String(playerIdentity.age || 0) },
                        profession: { S: playerIdentity.profession || "" },
                        initial_traits: {
                            L: initialTraits.map((t) => ({ S: t })),
                        },
                    },
                },
                life_goal: { S: lifeGoal },
                player_state: {
                    M: {
                        age: { N: String(playerIdentity.age || 0) },
                        career: { S: "學生" },
                        finance: { N: "50" },
                        health: { N: "80" },
                        relationships: { N: "60" },
                        traits: {
                            L: initialTraits.map((t) => ({ S: t })),
                        },
                    },
                },
                current_summary: { S: "你剛踏入人生的起點，對未來充滿期待。" },
                turn: { N: "0" },
                history: { L: [] },
                final_result: { NULL: true },
                created_at: { S: now.toISOString() },
                updated_at: { S: now.toISOString() },
                ttl: { N: String(ttl) },
            },
        })
    );
};

const updateSessionAfterEvent = async (sessionId, sessionItem, data) => {
    if (!tableName) {
        throw new Error("Missing DDB_TABLE_NAME");
    }

    const now = new Date();
    const { historyItem, updatedPlayerState, updatedSummary, modelId, lifeGoal } = data;

    const history = fromAttr(sessionItem.history) || [];
    const updatedHistory = history.concat(historyItem);
    const updatedTurn = getAttrNumber(sessionItem.turn) + 1;

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: getAttrString(sessionItem.status) || "active" },
                model_id: { S: modelId },
                world_context: toAttr(fromAttr(sessionItem.world_context) || {}),
                player_identity: toAttr(fromAttr(sessionItem.player_identity) || {}),
                life_goal: { S: lifeGoal },
                player_state: toAttr(updatedPlayerState),
                current_summary: { S: updatedSummary },
                turn: { N: String(updatedTurn) },
                history: toAttr(updatedHistory),
                final_result: toAttr(fromAttr(sessionItem.final_result)),
                created_at: { S: getAttrString(sessionItem.created_at) || now.toISOString() },
                updated_at: { S: now.toISOString() },
                ttl: { N: String(getAttrNumber(sessionItem.ttl) || Math.floor(now.getTime() / 1000) + 24 * 60 * 60) },
            },
        })
    );
};

const updateSessionWithResult = async (sessionId, sessionItem, data) => {
    if (!tableName) {
        throw new Error("Missing DDB_TABLE_NAME");
    }

    const now = new Date();
    const { finalResult, modelId, lifeGoal, playerState, history } = data;

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: "ended" },
                model_id: { S: modelId },
                world_context: toAttr(fromAttr(sessionItem.world_context) || {}),
                player_identity: toAttr(fromAttr(sessionItem.player_identity) || {}),
                life_goal: { S: lifeGoal },
                player_state: toAttr(playerState),
                current_summary: { S: finalResult.summary },
                turn: toAttr(fromAttr(sessionItem.turn)),
                history: toAttr(history),
                final_result: toAttr(finalResult),
                created_at: { S: getAttrString(sessionItem.created_at) || now.toISOString() },
                updated_at: { S: now.toISOString() },
                ttl: { N: String(getAttrNumber(sessionItem.ttl) || Math.floor(now.getTime() / 1000) + 24 * 60 * 60) },
            },
        })
    );
};

const parseSessionState = (sessionItem) => {
    const playerState = getAttrMap(sessionItem.player_state);
    return {
        modelId: getAttrString(sessionItem.model_id),
        currentSummary: getAttrString(sessionItem.current_summary),
        lifeGoal: getAttrString(sessionItem.life_goal),
        playerState: fromAttr(sessionItem.player_state) || {},
        history: fromAttr(sessionItem.history) || [],
        storyContext: {
            summary: getAttrString(sessionItem.current_summary),
            goal: getAttrString(sessionItem.life_goal),
            state: {
                age: getAttrNumber(playerState.age),
                career: getAttrString(playerState.career),
                finance: getAttrNumber(playerState.finance),
                health: getAttrNumber(playerState.health),
                relationships: getAttrNumber(playerState.relationships),
                traits: getAttrList(playerState.traits).map((t) => getAttrString(t)),
            },
        },
    };
};

module.exports = {
    getSession,
    createSession,
    updateSessionAfterEvent,
    updateSessionWithResult,
    parseSessionState,
};
