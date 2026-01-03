const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const tableName = process.env.DDB_TABLE_NAME;

const getAttrString = (attr) => attr?.S ?? "";
const getAttrNumber = (attr) => (attr?.N ? Number(attr.N) : 0);
const getAttrList = (attr) => (Array.isArray(attr?.L) ? attr.L : []);
const getAttrMap = (attr) => (attr?.M ? attr.M : {});

const fromAttr = (attr) => {
    if (!attr) return null;
    if (attr.S !== undefined) return attr.S;
    if (attr.N !== undefined) return Number(attr.N);
    if (attr.BOOL !== undefined) return attr.BOOL;
    if (attr.NULL) return null;
    if (attr.L) return attr.L.map(fromAttr);
    if (attr.M) {
        const obj = {};
        for (const [key, value] of Object.entries(attr.M)) {
            obj[key] = fromAttr(value);
        }
        return obj;
    }
    return null;
};

const toAttr = (value) => {
    if (value === null || value === undefined) return { NULL: true };
    if (typeof value === "string") return { S: value };
    if (typeof value === "number") return { N: String(value) };
    if (typeof value === "boolean") return { BOOL: value };
    if (Array.isArray(value)) return { L: value.map(toAttr) };
    if (typeof value === "object") {
        const M = {};
        for (const [key, entry] of Object.entries(value)) {
            M[key] = toAttr(entry);
        }
        return { M };
    }
    return { S: String(value) };
};

module.exports = {
    dynamoClient,
    tableName,
    PutItemCommand,
    GetItemCommand,
    getAttrString,
    getAttrNumber,
    getAttrList,
    getAttrMap,
    fromAttr,
    toAttr,
};
