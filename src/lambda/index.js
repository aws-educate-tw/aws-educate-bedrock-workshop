import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const tableName = process.env.DDB_TABLE_NAME;
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || "us-east-1" });
const defaultModelId = "us.amazon.nova-lite-v1:0";

export const handler = async (event) => {
  const rawPath = event.path || "";
  const path = rawPath.replace(/\/+$/, ""); 

  const method = (event.httpMethod || "").toUpperCase();
  const body = JSON.parse(event.body || "{}");

  switch (path) {
    case "/generate-background":
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
            const cleanedText = modelText
                .trim()
                .replace(/^```(?:json)?/i, "")
                .replace(/```$/, "")
                .trim();
            backgroundPayload = JSON.parse(cleanedText);
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

    case "/generate-story":
    //   return handleGenerateStory(body);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "generate-story" })
        };
    case "/resolve-event":
    //   return handleResolveEvent(body);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "resolve-event" })
        };


    case "/generate-result":
    //   return handleGenerateResult(body);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "generate-result" })
        };

    
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" })
      };
  }
};
