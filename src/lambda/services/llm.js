const { ChatBedrockConverse } = require("@langchain/aws");
const { retrieve } = require("./knowledgeBase");

const DEFAULT_MODEL_ID = "us.amazon.nova-lite-v1:0";

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
        maxTokens: 800,
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
 * 使用 RAG 的 invoke（先檢索再生成）
 * @param {object} llm - LLM instance
 * @param {object} prompt - ChatPromptTemplate
 * @param {object} schema - Zod schema
 * @param {object} variables - prompt 變數
 * @param {object} ragOptions - RAG 選項
 * @param {string} ragOptions.query - 檢索查詢
 * @param {string} ragOptions.knowledgeBaseName - 知識庫名稱 (預設: "default")
 * @param {number} ragOptions.numberOfResults - 返回結果數量 (預設: 3)
 */
const invokeWithRAG = async (llm, prompt, schema, variables = {}, ragOptions = {}) => {
    const { query, knowledgeBaseName = "default", numberOfResults = 3 } = ragOptions;

    // 1. 檢索知識庫
    let context = "";
    if (query) {
        context = await retrieve(query, { knowledgeBaseName, numberOfResults });
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
    DEFAULT_MODEL_ID,
    createLLM,
    invokeWithSchema,
    invokeWithRAG,
    invokeRaw,
    parseJsonFromModel,
};
