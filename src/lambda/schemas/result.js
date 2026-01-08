const { z } = require("zod");

const finalScoresSchema = z.object({
    wisdom: z.number().min(0).max(100).describe("智慧最終分數 (0-100)"),
    wealth: z.number().min(0).max(100).describe("財富最終分數 (0-100)"),
    relationships: z.number().min(0).max(100).describe("人際關係最終分數 (0-100)"),
    career_development: z.number().min(0).max(100).describe("職涯發展最終分數 (0-100)"),
    wellbeing: z.number().min(0).max(100).describe("身心健康最終分數 (0-100)"),
});

const achievementSchema = z.object({
    title: z.string().describe("成就標題"),
    description: z.string().describe("成就描述"),
    icon: z.string().describe("成就圖示 emoji"),
});

const keyDecisionSchema = z.object({
    event_description: z.string().describe("事件描述"),
    decision: z.string().describe("玩家的選擇"),
    impact: z.string().describe("這個決定對人生的重大影響"),
});

const resultSchema = z.object({
    summary: z.string().describe("結局總結，描述角色的人生結局"),
    final_scores: finalScoresSchema.describe("各項數值最終分數"),
    achievements: z.array(achievementSchema).min(2).max(4).describe("獲得的成就列表（2-4個）"),
    key_decisions: z.array(keyDecisionSchema).length(3).describe("三個最關鍵的人生抉擇"),
    ending_type: z.string().describe("結局類型（如：傳奇、成功、平凡、悲劇等）"),
    ending_title: z.string().describe("結局標題"),
    image_prompt: z.string().describe("英文圖片生成提示詞，描述結局場景與角色最終狀態"),
});

module.exports = { resultSchema, finalScoresSchema, achievementSchema, keyDecisionSchema };
