// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID = 'us.amazon.nova-lite-v1:0';
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || 'us-west-1' });

export const handler = async (event) => {
    try {
        const message = event.body ? JSON.parse(event.body).message : event.message;

        const requestBody = {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: message
                        }
                    ]
                }
            ],
            inferenceConfig: {
                max_new_tokens: 4096,
                temperature: 0.7
            }
        };

        const command = new InvokeModelCommand({
            modelId: MODEL_ID,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const text =
            responseBody?.output?.message?.content?.[0]?.text ??
            responseBody?.content?.[0]?.text ??
            "";

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                raw: responseBody
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
