const { z } = require("zod");

const playerStateSchema = z.object({
    age: z.number().describe("玩家年齡"),
    career: z.string().describe("職業"),
    finance: z.number().describe("財務狀態 (0-100)"),
    health: z.number().describe("健康狀態 (0-100)"),
    relationships: z.number().describe("人際關係 (0-100)"),
    traits: z.array(z.string()).describe("特質列表"),
});

const resolveEventSchema = z.object({
    event_outcome: z.string().describe("事件結果描述"),
    updated_player_state: playerStateSchema.describe("更新後的玩家狀態"),
    current_summary: z.string().describe("當前故事摘要"),
});

module.exports = { resolveEventSchema, playerStateSchema };
