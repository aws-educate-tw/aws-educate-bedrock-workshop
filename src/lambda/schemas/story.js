const { z } = require("zod");

const optionSchema = z.object({
    option_id: z.string().describe("選項 ID (option_1 或 option_2)"),
    description: z.string().describe("選項描述文字"),
});

const storySchema = z.object({
    event_id: z.string().describe("事件 ID"),
    event_description: z.string().describe("事件描述"),
    options: z.array(optionSchema).length(2).describe("必須恰好有兩個選項"),
});

module.exports = { storySchema, optionSchema };
