const { z } = require("zod");

const optionSchema = z.object({
    option_id: z.string().describe("選項 ID (option_1 或 option_2)"),
    description: z.string().describe("選項描述文字"),
});

const storySchema = z.object({
    event_id: z.string().describe("事件 ID"),
    event_description: z.string().describe("事件描述"),
    options: z.array(optionSchema).length(2).describe("必須恰好有兩個選項"),
    image_prompt: z.string().describe("英文圖片生成提示詞，描述事件發生的場景與角色狀態"),
});

module.exports = { storySchema, optionSchema };
