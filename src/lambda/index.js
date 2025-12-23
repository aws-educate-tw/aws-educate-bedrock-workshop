const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const tableName = process.env.DDB_TABLE_NAME;
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || "us-east-1" });
const defaultModelId = "us.amazon.nova-lite-v1:0";

const parseJsonFromModel = (text) => {
    const cleanedText = text
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
    return JSON.parse(cleanedText);
};

const getAttrString = (attr) => attr?.S ?? "";
const getAttrNumber = (attr) => (attr?.N ? Number(attr.N) : 0);
const getAttrList = (attr) => (Array.isArray(attr?.L) ? attr.L : []);
const getAttrMap = (attr) => (attr?.M ? attr.M : {});
const fromAttr = (attr) => {
    if (!attr) return null;
    if (attr.S !== undefined) return attr.S;
    if (attr.N !== undefined) return Number(attr.N);
    if (attr.BOOL !== undefined) return attr.BOOL;
    if (attr.NULL) return null;
    if (attr.L) return attr.L.map(fromAttr);
    if (attr.M) {
        const obj = {};
        for (const [key, value] of Object.entries(attr.M)) {
            obj[key] = fromAttr(value);
        }
        return obj;
    }
    return null;
};
const toAttr = (value) => {
    if (value === null || value === undefined) return { NULL: true };
    if (typeof value === "string") return { S: value };
    if (typeof value === "number") return { N: String(value) };
    if (typeof value === "boolean") return { BOOL: value };
    if (Array.isArray(value)) return { L: value.map(toAttr) };
    if (typeof value === "object") {
        const M = {};
        for (const [key, entry] of Object.entries(value)) {
            M[key] = toAttr(entry);
        }
        return { M };
    }
    return { S: String(value) };
};

exports.handler = async (event) => {
  const rawPath = event.path || "";
  const path = rawPath.replace(/\/+$/, ""); 

  const method = (event.httpMethod || "").toUpperCase();
  const body = JSON.parse(event.body || "{}");

  switch (path) {
    case "/generate-background": {
        if (method !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!body.model_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "model_id is required" })
            };
        }

        const sessionId = `session_${Date.now()}`;
        const modelId = body.model_id || defaultModelId;
        const prompt = [
            "你是人生模擬遊戲的背景生成器。",
            "請以 JSON 物件輸出，欄位必須包含：",
            "background（世界觀與時代背景描述，String）",
            "player_identity（含 age, profession, initial_traits），",
            "life_goal（本局人生目標，String）。",
            "只輸出 JSON，不要額外文字。"
        ].join("\n");

        let backgroundPayload;
        try {
            const requestBody = {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    max_new_tokens: 800,
                    temperature: 0.7
                }
            };

            const response = await bedrockClient.send(
                new InvokeModelCommand({
                    modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(requestBody)
                })
            );

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const modelText =
                responseBody?.output?.message?.content?.[0]?.text ??
                responseBody?.content?.[0]?.text ??
                "";
            backgroundPayload = parseJsonFromModel(modelText);
        } catch (error) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Bedrock generation failed", error: error.message })
            };
        }

        const background = backgroundPayload.background || "";
        const playerIdentity = backgroundPayload.player_identity || {};
        const lifeGoal = backgroundPayload.life_goal || "";
        const initialTraits = Array.isArray(playerIdentity.initial_traits)
            ? playerIdentity.initial_traits
            : [];

        if (tableName) {
            const now = new Date();
            const ttl = Math.floor(now.getTime() / 1000) + 24 * 60 * 60;

            await dynamoClient.send(
                new PutItemCommand({
                    TableName: tableName,
                    Item: {
                        session_id: { S: sessionId },
                        status: { S: "active" },
                        model_id: { S: body.model_id },
                        world_context: {
                            M: {
                                era: { S: backgroundPayload.world_context?.era || "modern" },
                                theme: { S: backgroundPayload.world_context?.theme || "career-focused" }
                            }
                        },
                        player_identity: {
                            M: {
                                age: { N: String(playerIdentity.age || 0) },
                                profession: { S: playerIdentity.profession || "" },
                                initial_traits: {
                                    L: initialTraits.map((t) => ({ S: t }))
                                }
                            }
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
                                    L: initialTraits.map((t) => ({ S: t }))
                                }
                            }
                        },
                        current_summary: {
                            S: "你剛踏入人生的起點，對未來充滿期待。"
                        },
                        turn: { N: "0" },
                        history: { L: [] },
                        final_result: { NULL: true },
                        created_at: { S: now.toISOString() },
                        updated_at: { S: now.toISOString() },
                        ttl: { N: String(ttl) }
                    }
                })
            );
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                session_id: sessionId,
                background,
                player_identity: playerIdentity,
                life_goal: lifeGoal
            })
        };
    }

    case "/generate-story": {
        if (method !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!body.session_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "session_id is required" })
            };
        }

        if (!tableName) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" })
            };
        }

        let sessionItem;
        try {
            const read = await dynamoClient.send(
                new GetItemCommand({
                    TableName: tableName,
                    Key: {
                        session_id: { S: body.session_id }
                    }
                })
            );
            sessionItem = read.Item;
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to read session", error: error.message })
            };
        }

        if (!sessionItem) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Session not found" })
            };
        }

        const modelId = getAttrString(sessionItem.model_id) || defaultModelId;
        const currentSummary = getAttrString(sessionItem.current_summary);
        const lifeGoal = getAttrString(sessionItem.life_goal);
        const playerState = getAttrMap(sessionItem.player_state);
        const storyContext = {
            summary: currentSummary,
            goal: lifeGoal,
            state: {
                age: getAttrNumber(playerState.age),
                career: getAttrString(playerState.career),
                finance: getAttrNumber(playerState.finance),
                health: getAttrNumber(playerState.health),
                relationships: getAttrNumber(playerState.relationships),
                traits: getAttrList(playerState.traits).map((t) => getAttrString(t))
            }
        };

        const prompt = [
            "你是人生模擬遊戲的事件生成器。",
            "請根據玩家狀態與摘要，產生一個人生事件與選項。",
            "輸出 JSON，欄位必須包含：",
            "event_id（String）, event_description（String）, options（陣列，含 option_id, description）。",
            "只輸出 JSON，不要額外文字。",
            "",
            "遊戲狀態：",
            JSON.stringify(storyContext)
        ].join("\n");

        let storyPayload;
        try {
            const requestBody = {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    max_new_tokens: 800,
                    temperature: 0.7
                }
            };

            const response = await bedrockClient.send(
                new InvokeModelCommand({
                    modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(requestBody)
                })
            );

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const modelText =
                responseBody?.output?.message?.content?.[0]?.text ??
                responseBody?.content?.[0]?.text ??
                "";
            storyPayload = parseJsonFromModel(modelText);
        } catch (error) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Bedrock generation failed", error: error.message })
            };
        }

        if (!storyPayload?.event_id || !storyPayload?.event_description || !storyPayload?.options) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Invalid model response", raw: storyPayload })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                event_id: storyPayload.event_id,
                event_description: storyPayload.event_description,
                options: storyPayload.options
            })
        };
    }
    case "/resolve-event": {
        if (method !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!body.session_id || !body.event || !body.selected_option) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "session_id, event, and selected_option are required" })
            };
        }

        if (!tableName) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" })
            };
        }

        let sessionItem;
        try {
            const read = await dynamoClient.send(
                new GetItemCommand({
                    TableName: tableName,
                    Key: {
                        session_id: { S: body.session_id }
                    }
                })
            );
            sessionItem = read.Item;
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to read session", error: error.message })
            };
        }

        if (!sessionItem) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Session not found" })
            };
        }

        const modelId = getAttrString(sessionItem.model_id) || defaultModelId;
        const currentSummary = getAttrString(sessionItem.current_summary);
        const lifeGoal = getAttrString(sessionItem.life_goal);
        const playerState = fromAttr(sessionItem.player_state) || {};
        const history = fromAttr(sessionItem.history) || [];

        const prompt = [
            "你是人生模擬遊戲的事件解析器。",
            "請根據玩家狀態與事件選擇，輸出事件結果與更新後狀態。",
            "輸出 JSON，欄位必須包含：",
            "event_outcome（String）, updated_player_state（Object）, current_summary（String）。",
            "只輸出 JSON，不要額外文字。",
            "",
            "玩家摘要：",
            currentSummary,
            "玩家目標：",
            lifeGoal,
            "玩家狀態：",
            JSON.stringify(playerState),
            "事件內容：",
            JSON.stringify(body.event),
            "玩家選擇：",
            body.selected_option
        ].join("\n");

        let resolvePayload;
        try {
            const requestBody = {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    max_new_tokens: 800,
                    temperature: 0.7
                }
            };

            const response = await bedrockClient.send(
                new InvokeModelCommand({
                    modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(requestBody)
                })
            );

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const modelText =
                responseBody?.output?.message?.content?.[0]?.text ??
                responseBody?.content?.[0]?.text ??
                "";
            resolvePayload = parseJsonFromModel(modelText);
        } catch (error) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Bedrock generation failed", error: error.message })
            };
        }

        if (!resolvePayload?.event_outcome || !resolvePayload?.updated_player_state || !resolvePayload?.current_summary) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Invalid model response", raw: resolvePayload })
            };
        }

        const now = new Date();
        const historyItem = {
            event_id: body.event.event_id || `event_${Date.now()}`,
            event_description: body.event.event_description || "",
            selected_option: body.selected_option,
            outcome_summary: resolvePayload.event_outcome,
            timestamp: now.toISOString()
        };

        const updatedHistory = history.concat(historyItem);
        const updatedPlayerState = resolvePayload.updated_player_state || playerState;
        const updatedSummary = resolvePayload.current_summary;
        const updatedTurn = getAttrNumber(sessionItem.turn) + 1;

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: {
                    session_id: { S: body.session_id },
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
                    ttl: { N: String(getAttrNumber(sessionItem.ttl) || Math.floor(now.getTime() / 1000) + 24 * 60 * 60) }
                }
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                event_outcome: resolvePayload.event_outcome,
                updated_player_state: updatedPlayerState,
                current_summary: updatedSummary
            })
        };
    }


    case "/generate-result": {
        if (method !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!body.session_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "session_id is required" })
            };
        }

        if (!tableName) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" })
            };
        }

        let sessionItem;
        try {
            const read = await dynamoClient.send(
                new GetItemCommand({
                    TableName: tableName,
                    Key: {
                        session_id: { S: body.session_id }
                    }
                })
            );
            sessionItem = read.Item;
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to read session", error: error.message })
            };
        }

        if (!sessionItem) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Session not found" })
            };
        }

        const modelId = getAttrString(sessionItem.model_id) || defaultModelId;
        const currentSummary = getAttrString(sessionItem.current_summary);
        const lifeGoal = getAttrString(sessionItem.life_goal);
        const playerState = fromAttr(sessionItem.player_state) || {};
        const history = fromAttr(sessionItem.history) || [];

        const prompt = [
            "你是人生模擬遊戲的結局生成器。",
            "請根據玩家最終狀態與歷史，產生結局摘要與雷達圖評分。",
            "輸出 JSON，欄位必須包含：",
            "summary（String）, radar_scores（Object，含 financial, career, health, relationships, self_fulfillment，0-100）, ending_type（String）。",
            "只輸出 JSON，不要額外文字。",
            "",
            "玩家摘要：",
            currentSummary,
            "玩家目標：",
            lifeGoal,
            "玩家狀態：",
            JSON.stringify(playerState),
            "歷史事件：",
            JSON.stringify(history)
        ].join("\n");

        let resultPayload;
        try {
            const requestBody = {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    max_new_tokens: 800,
                    temperature: 0.7
                }
            };

            const response = await bedrockClient.send(
                new InvokeModelCommand({
                    modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(requestBody)
                })
            );

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const modelText =
                responseBody?.output?.message?.content?.[0]?.text ??
                responseBody?.content?.[0]?.text ??
                "";
            resultPayload = parseJsonFromModel(modelText);
        } catch (error) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Bedrock generation failed", error: error.message })
            };
        }

        if (!resultPayload?.summary || !resultPayload?.radar_scores || !resultPayload?.ending_type) {
            return {
                statusCode: 502,
                body: JSON.stringify({ message: "Invalid model response", raw: resultPayload })
            };
        }

        const now = new Date();
        const updatedSummary = resultPayload.summary;
        const updatedFinalResult = {
            summary: resultPayload.summary,
            radar_scores: resultPayload.radar_scores,
            ending_type: resultPayload.ending_type
        };

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: {
                    session_id: { S: body.session_id },
                    status: { S: "ended" },
                    model_id: { S: modelId },
                    world_context: toAttr(fromAttr(sessionItem.world_context) || {}),
                    player_identity: toAttr(fromAttr(sessionItem.player_identity) || {}),
                    life_goal: { S: lifeGoal },
                    player_state: toAttr(playerState),
                    current_summary: { S: updatedSummary },
                    turn: toAttr(fromAttr(sessionItem.turn)),
                    history: toAttr(history),
                    final_result: toAttr(updatedFinalResult),
                    created_at: { S: getAttrString(sessionItem.created_at) || now.toISOString() },
                    updated_at: { S: now.toISOString() },
                    ttl: { N: String(getAttrNumber(sessionItem.ttl) || Math.floor(now.getTime() / 1000) + 24 * 60 * 60) }
                }
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify(updatedFinalResult)
        };
    }

    case "/db-test": {
        if (method !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!tableName) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" })
            };
        }

        const sessionId = body.session_id || `session-${Date.now()}`;
        const payload = body.payload || "ok";
        const createdAt = new Date().toISOString();

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: {
                    session_id: { S: sessionId },
                    payload: { S: payload },
                    createdAt: { S: createdAt }
                }
            })
        );

        const read = await dynamoClient.send(
            new GetItemCommand({
                TableName: tableName,
                Key: {
                    session_id: { S: sessionId }
                }
            })
        );

        const item = read.Item
            ? {
                  session_id: read.Item.session_id?.S,
                  payload: read.Item.payload?.S,
                  createdAt: read.Item.createdAt?.S
              }
            : null;

        return {
            statusCode: 200,
            body: JSON.stringify({ session_id: sessionId, item })
        };
    }

    case "/db-health": {
        if (method !== "GET") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        if (!tableName) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" })
            };
        }

        try {
            const read = await dynamoClient.send(
                new GetItemCommand({
                    TableName: tableName,
                    Key: {
                        session_id: { S: "healthcheck" }
                    }
                })
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                    table: tableName,
                    itemExists: Boolean(read.Item)
                })
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ ok: false, error: error.message })
            };
        }
    }

    case "/lambda-health": {
        if (method !== "GET") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                timestamp: new Date().toISOString()
            })
        };
    }

    
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" })
      };
  }
};
