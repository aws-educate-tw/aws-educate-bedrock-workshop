const { ChatBedrockConverse } = require("@langchain/aws");
const { retrieve } = require("./knowledgeBase");

const DEFAULT_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";

const parseJsonFromModel = (text) => {
    const cleanedText = text
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
    return JSON.parse(cleanedText);
};

const createLLM = (modelId = DEFAULT_MODEL_ID) => {
    return new ChatBedrockConverse({
        model: modelId,
        region: process.env.BEDROCK_REGION || "us-east-1",
        temperature: 0.7,
        maxTokens: 5120,
    });
};

const invokeWithSchema = async (llm, prompt, schema, variables = {}) => {
    const formattedPrompt = await prompt.formatMessages(variables);

    try {
        const structuredLlm = llm.withStructuredOutput(schema);
        return await structuredLlm.invoke(formattedPrompt);
    } catch (error) {
        // Fallback: 如果 withStructuredOutput 失敗，改用一般 invoke + 手動解析
        console.warn("withStructuredOutput failed, falling back to manual parsing:", error.message);
        const response = await llm.invoke(formattedPrompt);
        const content = typeof response.content === "string"
            ? response.content
            : response.content[0]?.text || "";
        return parseJsonFromModel(content);
    }
};

const invokeRaw = async (llm, prompt, variables = {}) => {
    const formattedPrompt = await prompt.formatMessages(variables);
    const response = await llm.invoke(formattedPrompt);
    const content = typeof response.content === "string"
        ? response.content
        : response.content[0]?.text || "";
    return parseJsonFromModel(content);
};

/**
 * 使用 RAG 的 invoke（先檢索再生成，支援滑動窗口）
 * @param {object} llm - LLM instance
 * @param {object} prompt - ChatPromptTemplate
 * @param {object} schema - Zod schema
 * @param {object} variables - prompt 變數
 * @param {object} ragOptions - RAG 選項
 * @param {string} ragOptions.query - 檢索查詢
 * @param {number} ragOptions.numberOfResults - 總搜尋數量 (預設: 8)
 * @param {number} ragOptions.turn - 當前回合數，用於滑動窗口 (預設: 0)
 * @param {number} ragOptions.windowSize - 每次實際使用的結果數量 (預設: 3)
 */
const invokeWithRAG = async (llm, prompt, schema, variables = {}, ragOptions = {}) => {
    const {
        query,
        numberOfResults = 8,
        turn = 0,
        windowSize = 3
    } = ragOptions;

    // 1. 檢索知識庫（使用滑動窗口機制）
    let context = "";
    if (query) {
        context = await retrieve(query, { numberOfResults, turn, windowSize });
    }

    // 2. 將檢索結果加入變數
    const enhancedVariables = {
        ...variables,
        ragContext: context || "（無相關參考資料）",
    };

    // 3. 呼叫 LLM
    return invokeWithSchema(llm, prompt, schema, enhancedVariables);
};

module.exports = {
    createLLM,
    invokeWithSchema,
    invokeWithRAG,
    invokeRaw,
    parseJsonFromModel,
};
