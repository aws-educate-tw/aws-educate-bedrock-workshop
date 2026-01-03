const knowledgeBases = {
    default: {
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
        description: "主要遊戲知識庫",
    },
    // 未來可擴展更多知識庫
    // gameRules: {
    //     knowledgeBaseId: process.env.GAME_RULES_KB_ID,
    //     description: "遊戲規則知識庫",
    // },
    // characters: {
    //     knowledgeBaseId: process.env.CHARACTERS_KB_ID,
    //     description: "角色設定知識庫",
    // },
};

const getKnowledgeBase = (name = "default") => {
    return knowledgeBases[name] || knowledgeBases.default;
};

module.exports = { knowledgeBases, getKnowledgeBase };
