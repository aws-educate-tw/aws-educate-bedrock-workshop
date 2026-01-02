const { z } = require("zod");

const radarScoresSchema = z.object({
    financial: z.number().min(0).max(100).describe("財務評分 (0-100)"),
    career: z.number().min(0).max(100).describe("職業評分 (0-100)"),
    health: z.number().min(0).max(100).describe("健康評分 (0-100)"),
    relationships: z.number().min(0).max(100).describe("人際關係評分 (0-100)"),
    self_fulfillment: z.number().min(0).max(100).describe("自我實現評分 (0-100)"),
});

const resultSchema = z.object({
    summary: z.string().describe("結局摘要"),
    radar_scores: radarScoresSchema.describe("雷達圖評分"),
    ending_type: z.string().describe("結局類型"),
});

module.exports = { resultSchema, radarScoresSchema };
