# DynamoDB Schema

本專案使用 **Amazon DynamoDB** 作為遊戲狀態與 session 資料的儲存層。
DynamoDB 為無伺服器（serverless）NoSQL 服務，適合以 **session_id 為唯一識別** 的應用場景，
可在高併發下維持穩定效能，且不需管理連線或容量配置。

---

## 4.1 資料表說明

### Table Name

`GameSessions`

---

## 4.2 Primary Key 設計

| Key 類型      | 欄位名稱     | 型別   | 說明                       |
| ------------- | ------------ | ------ | -------------------------- |
| Partition Key | `session_id` | String | 每一局人生模擬的唯一識別碼 |

> 本專案不使用 Sort Key。
> 每一筆 DynamoDB item 對應一局完整的人生模擬流程。

---

## 4.3 Item 結構（Schema）

```json
{
  "session_id": "session_abc123",
  "status": "active",

  "knowledge_base_id": "kb_abc123",

  "world_context": {
    "era": "modern",
    "theme": "career-focused"
  },

  "player_identity": {
    "age": 22,
    "gender": "女",
    "appearance": "短髮、綠眼、戴圓框眼鏡",
    "profession": "應屆畢業生",
    "initial_traits": ["理性", "內向"]
  },

  "life_goal": "在穩定生活與自我實現之間找到平衡",

  "player_state": {
    "age": 22,
    "career": "學生",
    "wisdom": 50,
    "wealth": 50,
    "relationships": 60,
    "career_development": 50,
    "wellbeing": 80,
    "traits": ["理性", "內向"]
  },

  "current_summary": "你剛踏入人生的起點，對未來充滿期待。",

  "turn": 0,

  "history": [
    {
      "event_id": "event_001",
      "event_description": "你選擇了第一份工作。",
      "selected_option": "A",
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

| 欄位                | 型別   | 說明                             |
| ------------------- | ------ | -------------------------------- |
| `session_id`        | String | 遊戲 session 的唯一識別碼        |
| `status`            | String | Session 狀態：`active` / `ended` |
| `knowledge_base_id` | String | 本局使用的 Knowledge Base ID     |

---

### 世界觀與角色設定

| 欄位              | 型別   | 說明                       |
| ----------------- | ------ | -------------------------- |
| `world_context`   | Map    | 隨機生成的世界觀與環境設定 |
| `player_identity` | Map    | 玩家初始身份（基本不變）   |
| `life_goal`       | String | 本局人生模擬的核心目標     |

---

### 動態人生狀態

| 欄位              | 型別   | 說明                             |
| ----------------- | ------ | -------------------------------- |
| `player_state`    | Map    | 玩家當前人生狀態（會隨事件變動） |
| `current_summary` | String | 近期人生摘要，用於維持敘事連貫性 |
| `turn`            | Number | 已發生的人生事件數               |

---

### 歷史與結果

| 欄位           | 型別       | 說明                       |
| -------------- | ---------- | -------------------------- |
| `history`      | List       | 歷史事件紀錄（依時間順序） |
| `final_result` | Map / Null | 遊戲結束後的人生總結與評分 |

---

### 系統欄位

| 欄位         | 型別         | 說明                               |
| ------------ | ------------ | ---------------------------------- |
| `created_at` | String (ISO) | Session 建立時間                   |
| `updated_at` | String (ISO) | 最後更新時間                       |
| `ttl`        | Number       | DynamoDB TTL（Unix Timestamp，秒） |

> `ttl` 用於自動清除過期 session（例如 24 小時後刪除），
> 適合 Workshop 與測試環境使用。

---

## 4.5 設計說明與優點

- 以 `session_id` 作為單一查詢條件，避免複雜索引設計
- 所有狀態集中於單一 item，方便除錯與教學
- 適合 Lambda 無狀態（stateless）架構
- DynamoDB 無需管理連線與容量，降低 Workshop 操作門檻

---

> 本資料結構設計以「教學清楚、實作簡單、可擴充」為核心原則，
> 可在未來延伸至多玩家、長期儲存或分析用途。
