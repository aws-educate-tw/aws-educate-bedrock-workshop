const { BedrockAgentRuntimeClient, RetrieveCommand } = require("@aws-sdk/client-bedrock-agent-runtime");

const client = new BedrockAgentRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
});

// 動態儲存當前會話的 Knowledge Base ID
let currentKnowledgeBaseId = null;

/**
 * 設定當前使用的 Knowledge Base ID
 * @param {string} knowledgeBaseId - Knowledge Base ID
 */
const setKnowledgeBaseId = (knowledgeBaseId) => {
    currentKnowledgeBaseId = knowledgeBaseId;
};

/**
 * 取得當前使用的 Knowledge Base ID
 * @returns {string|null} - Knowledge Base ID
 */
const getKnowledgeBaseId = () => {
    return currentKnowledgeBaseId;
};

/**
 * 從知識庫檢索相關內容（支援滑動窗口機制）
 * @param {string} query - 查詢文字
 * @param {object} options - 選項
 * @param {number} options.numberOfResults - 返回結果數量 (預設: 5)
 * @param {number} options.turn - 當前回合數，用於計算滑動窗口偏移
 * @param {number} options.windowSize - 窗口大小，實際使用的結果數量 (預設: 3)
 * @returns {Promise<string>} - 格式化的檢索結果
 */
const retrieve = async (query, options = {}) => {
    const {
        numberOfResults = 8,  // 多搜尋一些結果
        turn = 0,
        windowSize = 3        // 每次實際使用的數量
    } = options;
    const knowledgeBaseId = currentKnowledgeBaseId;

    if (!knowledgeBaseId) {
        console.warn("Knowledge Base ID not configured, skipping retrieval");
        return "";
    }

    try {
        const response = await client.send(
            new RetrieveCommand({
                knowledgeBaseId: knowledgeBaseId,
                retrievalQuery: { text: query },
                retrievalConfiguration: {
                    vectorSearchConfiguration: {
                        numberOfResults,
                    },
                },
            })
        );

        const results = response.retrievalResults || [];
        if (results.length === 0) return "";

        // 滑動窗口：根據回合數偏移起始位置
        // turn 0: 使用 index 0, 1, 2
        // turn 1: 使用 index 1, 2, 3
        // turn 2: 使用 index 2, 3, 4
        // ...以此類推，讓每回合接觸到不同的角色/內容
        const startIndex = Math.min(turn, Math.max(0, results.length - windowSize));
        const endIndex = Math.min(startIndex + windowSize, results.length);
        const windowedResults = results.slice(startIndex, endIndex);

        return windowedResults
            .map((r, i) => `[參考 ${i + 1}]: ${r.content?.text || ""}`)
            .join("\n\n");
    } catch (error) {
        console.error("Knowledge Base retrieval failed:", error.message);
        return "";
    }
};

module.exports = { retrieve, setKnowledgeBaseId, getKnowledgeBaseId };
