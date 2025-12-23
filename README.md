# 一、整體說明

本專案提供一組以 **大型語言模型（LLM）** 為核心的人生模擬遊戲 API。
遊戲透過多個 API，逐步生成玩家背景、人生事件、事件結果與最終評分，營造沉浸式的互動體驗。

系統於遊戲開始時建立一組 **session_id**，並將該局遊戲的基本狀態與隨機環境設定儲存於 **MongoDB** 中。
後續所有 API 呼叫皆透過 `session_id` 識別同一局人生模擬流程。

---

## 遊戲流程概覽（Session-based）

1. **POST /generate-background**
   → 建立遊戲 session，產生世界觀、玩家初始身份與人生目標
   → 回傳 `session_id`

2. **POST /generate-story**
   → 依 session_id 讀取目前狀態，生成一個人生事件與選項

3. **POST /resolve-event**
   → 處理玩家選擇，更新玩家狀態與人生摘要

4. **POST /generate-result**
   → 根據最終狀態產生結局與雷達圖評分

---

# 二、共通 API 規格

* **HTTP Method**：POST
* **Response 類型**：JSON
* **Content-Type**：`application/json`
* 所有 API 皆採用傳統 **Request / Response** 模式
* 遊戲狀態由 **Server 端（MongoDB）** 管理，Client 透過 `session_id` 進行識別

---

# 三、API 詳細說明

---

## 1️⃣ POST /generate-background

### 功能說明

初始化一局新遊戲，建立一組新的遊戲 session，
隨機生成世界觀、玩家初始身份與本次人生模擬的核心目標，
並將初始資料儲存至 MongoDB。

### Request Body

```json
{
  "model_id": "string"
}
```

### 參數說明

| 欄位       | 型別     | 說明         |
| -------- | ------ | ---------- |
| model_id | string | 使用的語言模型 ID |

---

### Response（範例）

```json
{
  "session_id": "session_abc123",
  "background": "世界觀與時代背景描述",
  "player_identity": {
    "age": 22,
    "profession": "應屆畢業生",
    "initial_traits": ["理性", "內向"]
  },
  "life_goal": "在穩定生活與自我實現之間找到平衡"
}
```

### 備註

* 每一局遊戲 **僅需呼叫一次**
* `session_id` 為後續所有 API 的識別依據
* 回傳內容為完整結果，一次取得

---

## 2️⃣ POST /generate-story

### 功能說明

根據 `session_id` 讀取目前玩家狀態與人生摘要，
生成一個即將發生的人生事件，並提供可選擇的行動選項。

### Request Body

```json
{
  "session_id": "session_abc123"
}
```

---

### Response（範例）

```json
{
  "event_id": "event_1024",
  "event_description": "你收到一份高薪但工時極長的工作邀請。",
  "options": [
    {
      "option_id": "A",
      "description": "接受這份工作"
    },
    {
      "option_id": "B",
      "description": "拒絕，維持目前生活"
    }
  ]
}
```

### 備註

* 本 API 可於遊戲過程中 **多次呼叫**
* 事件內容會依據 MongoDB 中的玩家狀態與人生摘要動態生成
* Server 端負責維持敘事連貫性

---

## 3️⃣ POST /resolve-event

### 功能說明

處理玩家對人生事件的選擇，
計算事件結果、更新玩家狀態，並產生新的「人生現況摘要」。

### Request Body

```json
{
  "session_id": "session_abc123",
  "event": { ... },
  "selected_option_id": "A"
}
```

---

### Response（範例）

```json
{
  "event_outcome": "你獲得了更高的收入，但長時間加班讓你感到疲憊。",
  "updated_player_state": {
    "age": 26,
    "career": "資深工程師",
    "finance": 80,
    "health": 55,
    "relationships": 40,
    "traits": ["理性", "內向", "工作導向"]
  },
  "current_summary": "你在職涯上快速成長，但健康與人際關係開始承受壓力。"
}
```

### 備註

* 本 API 負責 **人生狀態轉移（State Transition）**
* 所有屬性變化與副作用皆於此處處理
* 更新後的狀態與摘要會寫回 MongoDB
* `current_summary` 將作為下一次 `/generate-story` 的敘事上下文

---

## 4️⃣ POST /generate-result

### 功能說明

根據 `session_id` 讀取最終人生狀態，
生成遊戲結局敘述與雷達圖評分結果。

### Request Body

```json
{
  "session_id": "session_abc123"
}
```

---

### Response（範例）

```json
{
  "summary": "你在職涯上取得成功，但在人際與健康上付出代價。",
  "radar_scores": {
    "financial": 85,
    "career": 90,
    "health": 45,
    "relationships": 40,
    "self_fulfillment": 70
  },
  "ending_type": "高成就但失衡的人生"
}
```

### 備註

* 僅在遊戲結束時呼叫一次
* 雷達圖分數範圍為 0–100
* 適合用於前端視覺化呈現（Radar Chart / Canvas）

---

## 5️⃣ GET /db-health

### 功能說明

確認 DynamoDB 是否可讀取，回傳資料庫連線狀態。

### Response（範例）

```json
{
  "ok": true,
  "table": "GameSessions",
  "itemExists": false
}
```

---

## 6️⃣ GET /lambda-health

### 功能說明

確認 Lambda 服務可正常回應，回傳簡單健康狀態與時間戳。

### Response（範例）

```json
{
  "ok": true,
  "timestamp": "2025-12-23T15:30:00.000Z"
}
```

---

# 四、資料儲存設計（DynamoDB Schema）

本專案使用 **Amazon DynamoDB** 作為遊戲狀態與 session 資料的儲存層。
DynamoDB 為無伺服器（serverless）NoSQL 服務，適合以 **session_id 為唯一識別** 的應用場景，
可在高併發下維持穩定效能，且不需管理連線或容量配置。

---

## 4.1 資料表說明

### Table Name

`GameSessions`

---

## 4.2 Primary Key 設計

| Key 類型        | 欄位名稱         | 型別     | 說明            |
| ------------- | ------------ | ------ | ------------- |
| Partition Key | `session_id` | String | 每一局人生模擬的唯一識別碼 |

> 本專案不使用 Sort Key。
> 每一筆 DynamoDB item 對應一局完整的人生模擬流程。

---

## 4.3 Item 結構（Schema）

```json
{
  "session_id": "session_abc123",
  "status": "active",

  "model_id": "anthropic.claude-3-5-sonnet",

  "world_context": {
    "era": "modern",
    "theme": "career-focused"
  },

  "player_identity": {
    "age": 22,
    "profession": "應屆畢業生",
    "initial_traits": ["理性", "內向"]
  },

  "life_goal": "在穩定生活與自我實現之間找到平衡",

  "player_state": {
    "age": 22,
    "career": "學生",
    "finance": 50,
    "health": 80,
    "relationships": 60,
    "traits": ["理性", "內向"]
  },

  "current_summary": "你剛踏入人生的起點，對未來充滿期待。",

  "turn": 0,

  "history": [
    {
      "event_id": "event_001",
      "event_description": "你選擇了第一份工作。",
      "selected_option_id": "A",
      "outcome_summary": "你獲得了穩定的收入。",
      "timestamp": "2025-12-22T14:40:00Z"
    }
  ],

  "final_result": null,

  "created_at": "2025-12-22T14:30:00Z",
  "updated_at": "2025-12-22T14:40:00Z",

  "ttl": 1766400000
}
```

---

## 4.4 欄位說明

### Session 基本資訊

| 欄位           | 型別     | 說明                            |
| ------------ | ------ | ----------------------------- |
| `session_id` | String | 遊戲 session 的唯一識別碼             |
| `status`     | String | Session 狀態：`active` / `ended` |
| `model_id`   | String | 本局使用的 LLM 模型 ID               |

---

### 世界觀與角色設定

| 欄位                | 型別     | 說明            |
| ----------------- | ------ | ------------- |
| `world_context`   | Map    | 隨機生成的世界觀與環境設定 |
| `player_identity` | Map    | 玩家初始身份（基本不變）  |
| `life_goal`       | String | 本局人生模擬的核心目標   |

---

### 動態人生狀態

| 欄位                | 型別     | 說明               |
| ----------------- | ------ | ---------------- |
| `player_state`    | Map    | 玩家當前人生狀態（會隨事件變動） |
| `current_summary` | String | 近期人生摘要，用於維持敘事連貫性 |
| `turn`            | Number | 已發生的人生事件數        |

---

### 歷史與結果

| 欄位             | 型別         | 說明            |
| -------------- | ---------- | ------------- |
| `history`      | List       | 歷史事件紀錄（依時間順序） |
| `final_result` | Map / Null | 遊戲結束後的人生總結與評分 |

---

### 系統欄位

| 欄位           | 型別           | 說明                             |
| ------------ | ------------ | ------------------------------ |
| `created_at` | String (ISO) | Session 建立時間                   |
| `updated_at` | String (ISO) | 最後更新時間                         |
| `ttl`        | Number       | DynamoDB TTL（Unix Timestamp，秒） |

> `ttl` 用於自動清除過期 session（例如 24 小時後刪除），
> 適合 Workshop 與測試環境使用。

---

## 4.5 設計說明與優點

* 以 `session_id` 作為單一查詢條件，避免複雜索引設計
* 所有狀態集中於單一 item，方便除錯與教學
* 適合 Lambda 無狀態（stateless）架構
* DynamoDB 無需管理連線與容量，降低 Workshop 操作門檻

---

> 本資料結構設計以「教學清楚、實作簡單、可擴充」為核心原則，
> 可在未來延伸至多玩家、長期儲存或分析用途。

---

# 五、SAM Local 測試指令

前置需求：已安裝 Docker 並啟動。

## 1) 安裝依賴與建置

```bash
sam build -t src/template/template.yaml
```

## 2) 啟動本機 API

```bash
sam local start-api -t src/template/template.yaml --env-vars ./src/template/env.json
```

## 3) 呼叫 API（範例）

```bash
curl -X POST http://127.0.0.1:3000/generate-background \
  -H "Content-Type: application/json" \
  -d '{"model_id":"us.amazon.nova-lite-v1:0"}'
```

```bash
curl -X POST http://127.0.0.1:3000/generate-story \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123"}'
```

```bash
curl -X POST http://127.0.0.1:3000/resolve-event \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123","event":{},"selected_option_id":"A"}'
```

```bash
curl -X POST http://127.0.0.1:3000/generate-result \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123"}'
```

如果遇到 Docker 拉不到映像檔，可以先拉基底映像：

```bash
docker pull public.ecr.aws/lambda/nodejs:18-arm64
```

---

# 六、部署到 AWS

前置需求：已設定 AWS CLI/認證與 SAM CLI。

## 1) 建置

```bash
sam build -t src/template/template.yaml
```

## 2) 部署

```bash
sam deploy --guided
```

## 3) 取得 API URL

部署完成後，在 CloudFormation Outputs 取得 `ApiBaseUrl`，
或用以下指令查詢：

```bash
aws cloudformation describe-stacks \
  --stack-name bedrock-workshop-stack \
  --query "Stacks[0].Outputs"
```
