const { z } = require("zod");

const playerStateSchema = z.object({
    age: z.number().describe("玩家年齡"),
    career: z.string().describe("職業/身份"),
    wisdom: z.number().describe("智慧 (0-100)"),
    wealth: z.number().describe("財富 (0-100)"),
    relationships: z.number().describe("人際關係 (0-100)"),
    career_development: z.number().describe("職涯發展 (0-100)"),
    wellbeing: z.number().describe("身心健康 (0-100)"),
    traits: z.array(z.string()).describe("特質列表"),
});

const statChangeSchema = z.object({
    stat: z.string().describe("變動的數值名稱"),
    change: z.number().describe("變動量（正數為增加，負數為減少）"),
    reason: z.string().describe("變動原因說明"),
});

const resolveEventSchema = z.object({
    event_outcome: z.string().describe("事件結果描述"),
    updated_player_state: playerStateSchema.describe("更新後的玩家狀態"),
    stat_changes: z.array(statChangeSchema).describe("數值變動列表及原因說明"),
    current_summary: z.string().describe("累積式故事摘要"),
    image_prompt: z.string().describe("英文圖片生成提示詞，描述角色正在進行的動作與場景"),
});

module.exports = { resolveEventSchema, playerStateSchema };
