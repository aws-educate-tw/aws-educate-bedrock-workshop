const { dynamoClient, tableName, GetItemCommand } = require("../utils/dynamodb");

const dbHealth = async () => {
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Missing DDB_TABLE_NAME" }),
        };
    }

    try {
        const read = await dynamoClient.send(
            new GetItemCommand({
                TableName: tableName,
                Key: { session_id: { S: "healthcheck" } },
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                table: tableName,
                itemExists: Boolean(read.Item),
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ ok: false, error: error.message }),
        };
    }
};

const lambdaHealth = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            ok: true,
            timestamp: new Date().toISOString(),
        }),
    };
};

module.exports = { dbHealth, lambdaHealth };
