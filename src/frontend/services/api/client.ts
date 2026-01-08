import { ApiError } from "./types";

const DEFAULT_TIMEOUT_MS = 60000;
const DEBUG_API = (import.meta.env.VITE_DEBUG_API as string | undefined) === "true";
const MAX_RETRIES = 2;
const RETRY_BACKOFF_MS = 1000;

/**
 * 基礎 fetch 邏輯，支援逾時、重試、錯誤分類
 *
 * 重試策略（嚴格遵循約束）：
 * - 僅對「網路錯誤（fetch throw）」與「HTTP 5xx」重試
 * - 4xx 與 429 不重試（不做語意推論）
 * - 指數退避：delay = RETRY_BACKOFF_MS * 2^attempt
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & { timeout?: number; retries?: number } = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    retries = MAX_RETRIES,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 建立 AbortController 以實現逾時
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);

        // 捕捉網路錯誤或逾時
        if (
          fetchErr instanceof DOMException &&
          fetchErr.name === "AbortError"
        ) {
          // 逾時
          lastError = new ApiError(
            null,
            "timeout",
            `Request timeout after ${timeout}ms`
          );
        } else {
          // 其他網路錯誤
          lastError = new ApiError(
            null,
            "network",
            `Network error: ${
              fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
            }`
          );
        }

        // 網路錯誤可重試
        if (attempt < retries) {
          const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw lastError;
        }
      }

      // Log response body without consuming the main stream.
      if (DEBUG_API) {
        response
          .clone()
          .text()
          .then((text) => {
            const trimmed = text.trim();
            if (!trimmed) {
              console.log("[API Response]", url, "(empty body)");
              return;
            }
            try {
              const parsed = JSON.parse(trimmed);
              console.log("[API Response]", url, parsed);
            } catch {
              console.log("[API Response]", url, trimmed);
            }
          })
          .catch(() => {
            console.log("[API Response]", url, "(failed to read body)");
          });
      }

      // 判斷 HTTP 狀態碼
      if (response.status >= 500) {
        // 5xx：伺服器錯誤，可重試
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = response.statusText || "Unknown error";
        }

        lastError = new ApiError(
          response.status,
          "5xx",
          `Server error: [${response.status}] ${errorBody}`
        );

        if (attempt < retries) {
          const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw lastError;
        }
      }

      if (response.status >= 400 && response.status < 500) {
        // 4xx：用戶端錯誤，不重試
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = response.statusText || "Unknown error";
        }

        throw new ApiError(
          response.status,
          "4xx",
          `Client error: [${response.status}] ${errorBody}`
        );
      }

      if (!response.ok) {
        // 其他非 2xx 狀態，作為 5xx 處理
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = response.statusText || "Unknown error";
        }

        throw new ApiError(
          response.status,
          "5xx",
          `HTTP ${response.status}: ${errorBody}`
        );
      }

      // 解析 JSON
      try {
        const data = (await response.json()) as T;
        return data;
      } catch (parseErr) {
        throw new ApiError(
          response.status,
          "parse",
          `Failed to parse JSON response: ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`
        );
      }
    } catch (err) {
      // 已知的 ApiError，直接拋出
      if (err instanceof ApiError) {
        throw err;
      }

      // 未預期的錯誤，作為最後錯誤儲存
      lastError = new Error(
        `Unexpected error: ${err instanceof Error ? err.message : String(err)}`
      );
      throw lastError;
    }
  }

  throw lastError || new Error("Retry exhausted");
}
