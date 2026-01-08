const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
});

const MODEL_ID = "amazon.nova-canvas-v1:0";

const STYLE_PREFIX = `Stylized 2D digital art illustration in "Harry Potter: Magic Awakened" style - muted moody colors, dramatic rim lighting, gothic whimsical "Dark Academia" aesthetic.`;

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
 * 構建角色描述（用於肖像圖，強調人物）
 */
const buildCharacterDescriptionForPortrait = () => {
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

    return `a ${ageDescription} ${englishGender}, ${appearance || "average build"}`;
};

/**
 * 構建簡短角色描述（用於場景圖，不強調人物）
 */
const buildCharacterDescriptionForScene = () => {
    if (!currentCharacterAppearance) return "";

    const { gender, age } = currentCharacterAppearance;
    const englishGender = translateGender(gender);

    // 簡化的年齡描述
    let ageDesc = "young";
    if (age) {
        if (age <= 12) ageDesc = "young";
        else if (age <= 18) ageDesc = "teenage";
        else if (age <= 35) ageDesc = "young adult";
        else if (age <= 55) ageDesc = "middle-aged";
        else ageDesc = "elderly";
    }

    return `${ageDesc} ${englishGender}`;
};

/**
 * 生成角色肖像圖（專用於 generateBackground，只有人物）
 * @returns {Promise<string|null>} - Base64 編碼的圖片，失敗時返回 null
 */
const generateCharacterPortrait = async () => {
    const characterDescription = buildCharacterDescriptionForPortrait();

    if (!characterDescription) {
        return null;
    }

    const prompt = `${STYLE_PREFIX}

Character portrait of ${characterDescription}.

Framing: Upper body portrait or bust shot. Focus entirely on the character with a simple, blurred background. Show the character's face and upper body clearly. Neutral pose, looking slightly towards the camera.`;

    return await invokeImageGeneration(prompt);
};

/**
 * 使用 Amazon Nova Canvas 生成場景圖片（角色在情境中）
 * @param {string} sceneDescription - 場景描述
 * @returns {Promise<string|null>} - Base64 編碼的圖片，失敗時返回 null
 */
const generateImage = async (sceneDescription) => {
    const characterDesc = buildCharacterDescriptionForScene();

    // 構建 prompt：場景優先，角色融入場景中
    let prompt;
    if (characterDesc) {
        prompt = `${STYLE_PREFIX}

${sceneDescription}

The scene features a ${characterDesc} as the main subject.

Composition: Full scene view with the character visible in the environment. Show the character's full body at medium distance. The environment and atmosphere are equally important as the character. Do NOT crop to face or upper body only.`;
    } else {
        prompt = `${STYLE_PREFIX}

${sceneDescription}

Composition: Full scene view showing the environment and any subjects within it.`;
    }

    return await invokeImageGeneration(prompt);
};

/**
 * 呼叫 Bedrock 生成圖片
 * @param {string} prompt - 圖片生成 prompt
 * @returns {Promise<string|null>} - Base64 編碼的圖片，失敗時返回 null
 */
const invokeImageGeneration = async (prompt) => {

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

module.exports = { generateImage, generateCharacterPortrait, setCharacterAppearance, getCharacterAppearance, STYLE_PREFIX };
