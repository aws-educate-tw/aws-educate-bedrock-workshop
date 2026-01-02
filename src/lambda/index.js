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

exports.handler = async (event) => {
    const rawPath = event.path || "";
    const path = rawPath.replace(/\/+$/, "");
    const method = (event.httpMethod || "").toUpperCase();

    const routeKey = `${method} ${path}`;
    const handler = routes[routeKey];

    if (!handler) {
        const pathExists = Object.keys(routes).some((key) => key.endsWith(` ${path}`));
        if (pathExists) {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" }),
            };
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Not Found" }),
        };
    }

    const body = JSON.parse(event.body || "{}");
    return handler(body);
};
