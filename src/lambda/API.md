# API 文件

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

# 共通 API 規格

- **HTTP Method**：POST
- **Response 類型**：JSON
- **Content-Type**：`application/json`
- 所有 API 皆採用傳統 **Request / Response** 模式
- 遊戲狀態由 **Server 端（DynamoDB）** 管理，Client 透過 `session_id` 進行識別
- 回應中的 `image` 欄位為 Base64 PNG（可能為 `null`）

---

# API 詳細說明

---

## 1️⃣ POST /generate-background

### 功能說明

初始化一局新遊戲，建立一組新的遊戲 session，
隨機生成世界觀、玩家初始身份與本次人生模擬的核心目標，
並將初始資料儲存至 DynamoDB。

### Request Body

```json
{
  "knowledge_base_id": "string"
}
```

### 參數說明

| 欄位              | 型別   | 說明                     |
| ----------------- | ------ | ------------------------ |
| knowledge_base_id | string | 使用的 Knowledge Base ID |

---

### Response（範例）

```json
{
  "session_id": "session_abc123",
  "background": "世界觀與時代背景描述",
  "player_identity": {
    "age": 22,
    "gender": "女",
    "appearance": "短髮、綠眼、戴圓框眼鏡",
    "profession": "應屆畢業生",
    "initial_traits": ["理性", "內向"]
  },
  "life_goal": "在穩定生活與自我實現之間找到平衡",
}
```

### 備註

- 每一局遊戲 **僅需呼叫一次**
- `session_id` 為後續所有 API 的識別依據
- 回傳內容為完整結果，一次取得

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
      "option_id": "option_1",
      "description": "接受這份工作"
    },
    {
      "option_id": "option_2",
      "description": "拒絕，維持目前生活"
    }
  ],
  "image": "base64_png_string",
  "game_progress": {
    "turn": 2,
    "total_turns": 8,
    "phase": "學院初期",
    "phase_progress": "學院初期（2/2）",
    "turns_left": 6
  }
}
```

### 備註

- 本 API 可於遊戲過程中 **多次呼叫**
- 事件內容會依據 DynamoDB 中的玩家狀態與人生摘要動態生成
- Server 端負責維持敘事連貫性
- `game_progress.total_turns` 目前為 8（由 `src/lambda/config/gamePhases.js` 控制）
- `image` 為 Base64 PNG，可直接用於前端顯示
- 若遊戲已結束，會回傳 `should_generate_result: true`

---

## 3️⃣ POST /resolve-event

### 功能說明

處理玩家對人生事件的選擇，
計算事件結果、更新玩家狀態，並產生新的「人生現況摘要」。

### Request Body

```json
{
  "session_id": "session_abc123",
  "event": {
    "event_id": "event_1024",
    "event_description": "你收到一份高薪但工時極長的工作邀請。",
    "options": [
      { "option_id": "option_1", "description": "接受這份工作" },
      { "option_id": "option_2", "description": "拒絕，維持目前生活" }
    ]
  },
  "selected_option": "option_1"
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
    "wisdom": 60,
    "wealth": 80,
    "relationships": 40,
    "career_development": 75,
    "wellbeing": 55,
    "traits": ["理性", "內向", "工作導向"]
  },
  "stat_changes": [
    {
      "stat": "wealth",
      "change": 10,
      "reason": "高薪工作帶來收入提升"
    }
  ],
  "current_summary": "你在職涯上快速成長，但健康與人際關係開始承受壓力。",
  "image": "base64_png_string"
}
```

### 備註

- 本 API 負責 **人生狀態轉移（State Transition）**
- 所有屬性變化與副作用皆於此處處理
- 更新後的狀態與摘要會寫回 DynamoDB
- `current_summary` 將作為下一次 `/generate-story` 的敘事上下文
- `image` 為 Base64 PNG，可直接用於前端顯示

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
  "final_scores": {
    "wisdom": 85,
    "wealth": 90,
    "relationships": 40,
    "career_development": 70,
    "wellbeing": 45
  },
  "achievements": [
    {
      "title": "學院之星",
      "description": "在學院階段表現卓越，奠定未來基礎",
      "icon": "⭐"
    },
    {
      "title": "社會新星",
      "description": "在職涯初期快速成長，獲得肯定",
      "icon": "🚀"
    }
  ],
  "key_decisions": [
    {
      "event_description": "你選擇進入幻霧學園。",
      "decision": "接受錄取",
      "impact": "開啟魔法人生的新篇章"
    },
    {
      "event_description": "你選擇專研黑魔法。",
      "decision": "加入禁忌研究小組",
      "impact": "獲得強大力量，但人際關係受損"
    },
    {
      "event_description": "你選擇成為魔法導師。",
      "decision": "留在學院任教",
      "impact": "影響下一代魔法學徒的命運"
    }
  ],
  "ending_type": "高成就但失衡的人生",
  "ending_title": "榮耀與代價",
  "image": "base64_png_string"
}
```

### 備註

- 僅在遊戲結束時呼叫一次
- 雷達圖分數範圍為 0–100
- 適合用於前端視覺化呈現（Radar Chart / Canvas）
- `image` 為 Base64 PNG，可直接用於前端顯示

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

## 7️⃣ POST /upload-poster

### 功能說明

將前端產生的海報圖片（Base64）上傳到 S3，回傳公開圖片 URL。

### Request Body

```json
{
  "image_base64": "data:image/png;base64,...."
}
```

### Response（範例）

```json
{
  "url": "https://<bucket>.s3.<region>.amazonaws.com/posters/<file>.png"
}
```
