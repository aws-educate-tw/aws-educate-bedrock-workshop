const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
});

const MODEL_ID = "amazon.nova-canvas-v1:0";

const STYLE_PREFIX = `Medium shot illustration with a prominent main character in the foreground and detailed environment in the background. Stylized 2D digital art in "Harry Potter: Magic Awakened" style - muted moody colors, dramatic rim lighting, gothic whimsical "Dark Academia" aesthetic. Character should be clearly visible from waist up or full body, interacting with the scene.`;

// 儲存當前角色外觀資訊（用於生成一致的角色圖像）
let currentCharacterAppearance = null;

/**
 * 設定當前角色外觀資訊
 * @param {object} appearance - 角色外觀資訊
 * @param {string} appearance.gender - 性別
 * @param {string} appearance.appearance - 外觀描述
 */
const setCharacterAppearance = (appearance) => {
    currentCharacterAppearance = appearance;
};

/**
 * 取得當前角色外觀資訊
 * @returns {object|null}
 */
const getCharacterAppearance = () => {
    return currentCharacterAppearance;
};

/**
 * 使用 Amazon Nova Canvas 生成圖片
 * @param {string} sceneDescription - 場景描述
 * @returns {Promise<string|null>} - Base64 編碼的圖片，失敗時返回 null
 */
const generateImage = async (sceneDescription) => {
    let characterDescription = "";
    if (currentCharacterAppearance) {
        const { gender, appearance } = currentCharacterAppearance;
        characterDescription = `Main character: ${gender}, ${appearance}.\n\n`;
    }

    const prompt = `${STYLE_PREFIX}\n\n${characterDescription}Scene: ${sceneDescription}`;
    const seed = Math.floor(Math.random() * 858993460);

    const payload = {
        taskType: "TEXT_IMAGE",
        textToImageParams: {
            text: prompt,
        },
        imageGenerationConfig: {
            seed,
            quality: "standard",
            numberOfImages: 1,
        },
    };

    try {
        const response = await client.send(
            new InvokeModelCommand({
                modelId: MODEL_ID,
                body: JSON.stringify(payload),
            })
        );

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.images[0]; // Base64-encoded PNG
    } catch (error) {
        console.error("Image generation failed:", error.message);
        return null;
    }
};

module.exports = { generateImage, setCharacterAppearance, getCharacterAppearance, STYLE_PREFIX };
