import { fetchWithRetry } from "./client";
import {
  DbHealthResponse,
  GenerateBackgroundRequest,
  GenerateBackgroundResponse,
  GenerateResultRequest,
  GenerateResultResponse,
  GenerateStoryRequest,
  LambdaHealthResponse,
  ResolveEventRequest,
  ResolveEventResponse,
  StoryResponse,
} from "./types";

/**
 * 規範化 Base URL：僅處理尾斜線
 * 不假設任何 stage / proxy path；若 README 未定義，不自行新增
 */
function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return "";
  // 移除尾部斜線以便統一拼接
  return baseUrl.replace(/\/$/, "");
}

const DEFAULT_API_BASE_URL = normalizeBaseUrl(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    "http://localhost:3000"
);

let API_BASE_URL = DEFAULT_API_BASE_URL;

/**
 * 設定 API Base URL（用於運行時更改）
 */
export function setApiBaseUrl(baseUrl: string): void {
  API_BASE_URL = normalizeBaseUrl(baseUrl);
}

/**
 * 取得目前的 API Base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * POST /generate-background
 * 初始化遊戲 session
 */
export async function generateBackground(
  req: GenerateBackgroundRequest
): Promise<GenerateBackgroundResponse> {
  return fetchWithRetry<GenerateBackgroundResponse>(
    `${API_BASE_URL}/generate-background`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      timeout: 60000,
      retries: 2,
    }
  );
}

/**
 * POST /generate-story
 * 取得下一個遊戲事件
 *
 * NOTE: 回應中 should_generate_result 為 optional。
 * 前端保守處理：僅在欄位顯式存在且為 true 時才觸發結束。
 * 欄位缺失不推論為最後回合或任何階段。
 */
export async function generateStory(
  req: GenerateStoryRequest
): Promise<StoryResponse> {
  return fetchWithRetry<StoryResponse>(`${API_BASE_URL}/generate-story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    timeout: 60000,
    retries: 2,
  });
}

/**
 * POST /resolve-event
 * 提交玩家選擇，取得事件結果與狀態更新
 */
export async function resolveEvent(
  req: ResolveEventRequest
): Promise<ResolveEventResponse> {
  return fetchWithRetry<ResolveEventResponse>(`${API_BASE_URL}/resolve-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    timeout: 60000,
    retries: 2,
  });
}

/**
 * POST /generate-result
 * 取得遊戲結局與雷達圖評分
 */
export async function generateResult(
  req: GenerateResultRequest
): Promise<GenerateResultResponse> {
  return fetchWithRetry<GenerateResultResponse>(
    `${API_BASE_URL}/generate-result`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      timeout: 60000,
      retries: 2,
    }
  );
}

/**
 * GET /db-health
 * 檢查 DynamoDB 連線
 */
export async function checkDbHealth(): Promise<DbHealthResponse> {
  return fetchWithRetry<DbHealthResponse>(`${API_BASE_URL}/db-health`, {
    method: "GET",
    timeout: 60000,
    retries: 1,
  });
}

/**
 * GET /lambda-health
 * 檢查 Lambda 服務狀態
 */
export async function checkLambdaHealth(): Promise<LambdaHealthResponse> {
  return fetchWithRetry<LambdaHealthResponse>(`${API_BASE_URL}/lambda-health`, {
    method: "GET",
    timeout: 60000,
    retries: 1,
  });
}
