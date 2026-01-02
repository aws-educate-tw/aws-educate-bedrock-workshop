const { generateBackground } = require("./handlers/generateBackground");
const { generateStory } = require("./handlers/generateStory");
const { resolveEvent } = require("./handlers/resolveEvent");
const { generateResult } = require("./handlers/generateResult");
const { dbHealth, lambdaHealth } = require("./handlers/health");

const routes = {
    "POST /generate-background": generateBackground,
    "POST /generate-story": generateStory,
    "POST /resolve-event": resolveEvent,
    "POST /generate-result": generateResult,
    "GET /db-health": dbHealth,
    "GET /lambda-health": lambdaHealth,
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const addCorsHeaders = (response) => ({
    ...response,
    headers: {
        ...response.headers,
        ...corsHeaders,
    },
});

exports.handler = async (event) => {
    const rawPath = event.path || "";
    const path = rawPath.replace(/\/+$/, "");
    const method = (event.httpMethod || "").toUpperCase();

    // Handle CORS preflight
    if (method === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: "",
        };
    }

    const routeKey = `${method} ${path}`;
    const handler = routes[routeKey];

    if (!handler) {
        const pathExists = Object.keys(routes).some((key) => key.endsWith(` ${path}`));
        if (pathExists) {
            return addCorsHeaders({
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" }),
            });
        }
        return addCorsHeaders({
            statusCode: 404,
            body: JSON.stringify({ message: "Not Found" }),
        });
    }

    const body = JSON.parse(event.body || "{}");
    const result = await handler(body);
    return addCorsHeaders(result);
};
