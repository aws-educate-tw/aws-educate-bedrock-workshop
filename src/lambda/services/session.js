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
const { getPhaseInfo } = require("../config/gamePhases");

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

    const { knowledgeBaseId, background, playerIdentity, lifeGoal } = data;
    const initialTraits = Array.isArray(playerIdentity.initial_traits)
        ? playerIdentity.initial_traits
        : [];

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: "active" },
                knowledge_base_id: { S: knowledgeBaseId },
                world_context: {
                    M: {
                        era: { S: background.world_context?.era || "aetheria" },
                        theme: { S: background.world_context?.theme || "magic-academy" },
                    },
                },
                player_identity: {
                    M: {
                        age: { N: String(playerIdentity.age || 0) },
                        gender: { S: playerIdentity.gender || "" },
                        appearance: { S: playerIdentity.appearance || "" },
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
                        career: { S: "魔法學徒" },
                        wisdom: { N: "50" },
                        wealth: { N: "50" },
                        relationships: { N: "50" },
                        career_development: { N: "50" },
                        wellbeing: { N: "80" },
                        traits: {
                            L: initialTraits.map((t) => ({ S: t })),
                        },
                    },
                },
                current_summary: { S: "你剛發現自己擁有魔法天賦，即將踏入艾瑟里亞魔法世界的旅程。" },
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
    const {
        historyItem,
        updatedPlayerState,
        updatedSummary,
        knowledgeBaseId,
        lifeGoal,
        preserveTurn = false,
        replaceEventId = null,
    } = data;

    const history = fromAttr(sessionItem.history) || [];
    const updatedHistory = replaceEventId
        ? history.map((item) =>
            item?.event_id === replaceEventId ? historyItem : item
        )
        : history.concat(historyItem);
    const updatedTurn = preserveTurn
        ? getAttrNumber(sessionItem.turn)
        : getAttrNumber(sessionItem.turn) + 1;

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: getAttrString(sessionItem.status) || "active" },
                knowledge_base_id: { S: knowledgeBaseId },
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
    const { finalResult, knowledgeBaseId, lifeGoal, playerState, history } = data;

    await dynamoClient.send(
        new PutItemCommand({
            TableName: tableName,
            Item: {
                session_id: { S: sessionId },
                status: { S: "ended" },
                knowledge_base_id: { S: knowledgeBaseId },
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
    const playerIdentity = getAttrMap(sessionItem.player_identity);
    const turn = getAttrNumber(sessionItem.turn);
    const phaseInfo = getPhaseInfo(turn);

    return {
        knowledgeBaseId: getAttrString(sessionItem.knowledge_base_id),
        currentSummary: getAttrString(sessionItem.current_summary),
        lifeGoal: getAttrString(sessionItem.life_goal),
        playerState: fromAttr(sessionItem.player_state) || {},
        playerIdentity: {
            gender: getAttrString(playerIdentity.gender),
            appearance: getAttrString(playerIdentity.appearance),
            age: getAttrNumber(playerState.age),  // 使用 playerState 的當前年齡（會隨遊戲進行而變化）
        },
        history: fromAttr(sessionItem.history) || [],
        turn,
        phaseInfo,
        storyContext: {
            summary: getAttrString(sessionItem.current_summary),
            goal: getAttrString(sessionItem.life_goal),
            state: {
                age: getAttrNumber(playerState.age),
                career: getAttrString(playerState.career),
                wisdom: getAttrNumber(playerState.wisdom),
                wealth: getAttrNumber(playerState.wealth),
                relationships: getAttrNumber(playerState.relationships),
                career_development: getAttrNumber(playerState.career_development),
                wellbeing: getAttrNumber(playerState.wellbeing),
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
