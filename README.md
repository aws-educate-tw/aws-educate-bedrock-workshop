# 一、整體說明（修訂版）

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

# 二、共通 API 規格（修訂版）

* **HTTP Method**：POST
* **Response 類型**：JSON
* **Content-Type**：`application/json`
* 所有 API 皆採用傳統 **Request / Response** 模式
* 遊戲狀態由 **Server 端（MongoDB）** 管理，Client 透過 `session_id` 進行識別

---

# 三、API 詳細說明（修訂版）

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

## 四、補充說明（教學用總結）

> 本專案在教學情境中採用 **session-based API 設計**，
> 將遊戲狀態集中管理於 Server 端，
> API 採用標準 Request / Response 模式，
> 以降低學習門檻並提升實作與除錯效率，
> 同時保留未來延伸為即時互動或串流回傳的彈性。
