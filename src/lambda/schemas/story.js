const { z } = require("zod");

const optionSchema = z.object({
    option_id: z.string().describe("選項 ID"),
    description: z.string().describe("選項描述"),
});

const storySchema = z.object({
    event_id: z.string().describe("事件 ID"),
    event_description: z.string().describe("事件描述"),
    options: z.array(optionSchema).describe("可選擇的選項列表"),
});

module.exports = { storySchema, optionSchema };
