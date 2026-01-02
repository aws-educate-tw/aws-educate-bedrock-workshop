const { z } = require("zod");

const playerIdentitySchema = z.object({
    age: z.number().describe("玩家初始年齡"),
    gender: z.string().describe("玩家性別"),
    appearance: z.string().describe("玩家外觀描述（髮色、眼睛顏色、膚色、身材特徵等）"),
    profession: z.string().describe("玩家職業"),
    initial_traits: z.array(z.string()).describe("玩家初始特質列表"),
});

const backgroundSchema = z.object({
    background: z.string().describe("世界觀與時代背景描述"),
    player_identity: playerIdentitySchema.describe("玩家身份資訊"),
    life_goal: z.string().describe("本局人生目標"),
});

module.exports = { backgroundSchema, playerIdentitySchema };
