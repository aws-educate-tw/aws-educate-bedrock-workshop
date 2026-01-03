const { BedrockAgentRuntimeClient, RetrieveCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { getKnowledgeBase } = require("../config/knowledgeBases");

const client = new BedrockAgentRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
});

/**
 * 從知識庫檢索相關內容
 * @param {string} query - 查詢文字
 * @param {object} options - 選項
 * @param {string} options.knowledgeBaseName - 知識庫名稱 (預設: "default")
 * @param {number} options.numberOfResults - 返回結果數量 (預設: 3)
 * @returns {Promise<string>} - 格式化的檢索結果
 */
const retrieve = async (query, options = {}) => {
    const { knowledgeBaseName = "default", numberOfResults = 3 } = options;
    const kb = getKnowledgeBase(knowledgeBaseName);

    if (!kb.knowledgeBaseId) {
        console.warn("Knowledge Base ID not configured, skipping retrieval");
        return "";
    }

    try {
        const response = await client.send(
            new RetrieveCommand({
                knowledgeBaseId: kb.knowledgeBaseId,
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

        return results
            .map((r, i) => `[參考 ${i + 1}]: ${r.content?.text || ""}`)
            .join("\n\n");
    } catch (error) {
        console.error("Knowledge Base retrieval failed:", error.message);
        return "";
    }
};

module.exports = { retrieve };
