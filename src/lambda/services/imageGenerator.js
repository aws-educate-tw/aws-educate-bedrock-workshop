const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
});

const MODEL_ID = "amazon.nova-canvas-v1:0";

const STYLE_PREFIX = `Stylized 2D digital art illustration in "Harry Potter: Magic Awakened" style - muted moody colors, dramatic rim lighting, gothic whimsical "Dark Academia" aesthetic. The scene and environment should be the main focus, with rich details in the background.`;

// 儲存當前角色外觀資訊（用於生成一致的角色圖像）
let currentCharacterAppearance = null;

/**
 * 設定當前角色外觀資訊
 * @param {object} appearance - 角色外觀資訊
 * @param {string} appearance.gender - 性別
 * @param {string} appearance.appearance - 外觀描述
 * @param {number} appearance.age - 年齡
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
 * 將性別轉換為英文描述
 */
const translateGender = (gender) => {
    if (!gender) return "young person";
    const g = gender.toLowerCase();
    if (g.includes("男") || g.includes("male") || g.includes("boy")) {
        return "boy";
    }
    if (g.includes("女") || g.includes("female") || g.includes("girl")) {
        return "girl";
    }
    return "young person";
};

/**
 * 構建角色描述，強調年齡和性別
 */
const buildCharacterDescription = () => {
    if (!currentCharacterAppearance) return "";

    const { gender, appearance, age } = currentCharacterAppearance;
    const englishGender = translateGender(gender);

    // 根據年齡決定描述詞
    let ageDescription = "young child";
    if (age) {
        if (age <= 8) {
            ageDescription = `${age}-year-old child`;
        } else if (age <= 11) {
            ageDescription = `${age}-year-old pre-teen`;
        } else if (age <= 14) {
            ageDescription = `${age}-year-old teenager`;
        } else if (age <= 17) {
            ageDescription = `${age}-year-old young teen`;
        } else if (age <= 25) {
            ageDescription = `${age}-year-old young adult`;
        } else if (age <= 40) {
            ageDescription = `${age}-year-old adult`;
        } else if (age <= 60) {
            ageDescription = `${age}-year-old middle-aged person`;
        } else {
            ageDescription = `${age}-year-old elderly person`;
        }
    }

    // 構建強調性的角色描述
    return `IMPORTANT - Main character MUST be: a ${ageDescription}, ${englishGender}. Physical appearance: ${appearance || "average build"}.`;
};

/**
 * 使用 Amazon Nova Canvas 生成圖片
 * @param {string} sceneDescription - 場景描述
 * @returns {Promise<string|null>} - Base64 編碼的圖片，失敗時返回 null
 */
const generateImage = async (sceneDescription) => {
    const characterDescription = buildCharacterDescription();

    // 構建更結構化的 prompt，強調場景與角色的平衡
    let prompt;
    if (characterDescription) {
        prompt = `${STYLE_PREFIX}

Scene description: ${sceneDescription}

Character in scene - ${characterDescription}

Composition: Wide or medium shot showing both the detailed environment AND the character. The environment and action should be equally important as the character. Show the character interacting with or situated within the scene described above.`;
    } else {
        prompt = `${STYLE_PREFIX}

Scene: ${sceneDescription}`;
    }

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
