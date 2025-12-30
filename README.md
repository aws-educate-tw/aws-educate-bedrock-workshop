# AI 模擬人生 RPG

一個基於 React + TypeScript + Vite 的 AI 驅動人生模擬遊戲前端原型。

## 專案結構

```
ai-life-rpg/
├── src/
│   ├── components/          # 可重用組件
│   │   └── RadarChart.tsx   # 雷達圖組件
│   ├── pages/               # 頁面組件
│   │   ├── HomePage.tsx     # Page 1: 起始頁
│   │   ├── GamePage.tsx     # Page 2: 主遊戲頁
│   │   ├── SummaryPage.tsx  # Page 3: 人生總結
│   │   └── ReportPage.tsx   # Page 4: 人生報告
│   ├── services/            # 服務層
│   │   ├── api.ts           # API 服務
│   │   ├── mock.ts          # Mock 數據
│   │   └── export.ts        # 匯出功能
│   ├── store/               # 狀態管理
│   │   └── index.ts         # Zustand store
│   ├── types/               # 類型定義
│   │   └── index.ts         # TypeScript 類型
│   ├── App.tsx              # 主應用組件
│   ├── main.tsx             # 應用入口
│   └── index.css            # 全局樣式
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 功能特色

### 頁面流程
1. **起始頁 (HomePage)**: 輸入 Model ID 和 API Base URL
2. **遊戲頁 (GamePage)**: 主要遊戲互動，包含圖片、狀態、事件和選擇
3. **總結頁 (SummaryPage)**: 顯示人生總結和五維雷達圖
4. **報告頁 (ReportPage)**: 展示成就、關鍵抉擇，支援 JPG 匯出

### 核心功能
- ✅ 四頁路由結構清晰
- ✅ Zustand 狀態管理
- ✅ Mock 數據支援開發
- ✅ 可替換的 API 服務層
- ✅ 五維雷達圖 (SVG)
- ✅ JPG 匯出功能 (html2canvas)
- ✅ 響應式設計
- ✅ 錯誤處理和載入狀態
- ✅ 字數限制 (30字)

## 安裝與啟動

### 1. 安裝依賴
```bash
cd ai-life-rpg
npm install
```

### 2. 啟動開發服務器
```bash
npm run dev
```

### 3. 建置生產版本
```bash
npm run build
```

## API 模式切換

### 使用 Mock 數據 (預設)
在 `src/services/api.ts` 中：
```typescript
const USE_MOCK = true;  // 使用 mock 數據
```

### 使用真實 API
```typescript
const USE_MOCK = false; // 使用真實 API
```

## API 規格

### 遊戲互動 API
```
POST {baseUrl}/play
Request: {
  modelId: string,
  sessionId?: string,
  actionType: "A" | "B" | "FREE",
  freeText?: string
}
Response: {
  sessionId: string,
  stage: "childhood" | "student" | "adult" | "elder",
  imageUrl?: string,
  statusText: string,
  goalText: string,
  eventText: string,
  optionA: string,
  optionB: string,
  isEnd: boolean
}
```

### 總結數據 API
```
GET {baseUrl}/summary?sessionId={sessionId}
Response: {
  lifeScore: number,
  radar: {
    wisdom: number,
    wealth: number,
    relationship: number,
    career: number,
    health: number
  },
  finalSummaryText: string,
  achievements: Array<{
    title: string,
    desc: string,
    iconUrl?: string
  }>,
  keyChoices: string[],
  finalImageUrl?: string
}
```

## 技術棧

- **框架**: React 18 + TypeScript
- **建置工具**: Vite
- **路由**: React Router v6
- **狀態管理**: Zustand
- **圖表**: 自製 SVG 雷達圖
- **匯出**: html2canvas
- **樣式**: 內聯樣式 (簡約設計)

## 設計原則

- **簡約風格**: 灰白底色、細框線、清楚字體
- **響應式**: 適配不同螢幕尺寸
- **模組化**: 清晰的檔案結構和職責分離
- **可擴展**: 易於添加新功能和修改
- **用戶友好**: 直觀的操作流程和錯誤提示

## 開發注意事項

1. **Mock 數據**: 開發時使用 mock 數據，方便測試各種情境
2. **錯誤處理**: 所有 API 調用都有錯誤處理機制
3. **載入狀態**: 提供載入指示器改善用戶體驗
4. **字數限制**: 自由輸入限制 30 字並有即時提示
5. **匯出功能**: 使用 html2canvas 將指定區域匯出為 JPG

## 後續擴展

- [ ] 打字機效果動畫
- [ ] 人生階段過場動畫
- [ ] 更豐富的視覺效果
- [ ] 多語言支援
- [ ] 更多匯出格式
- [ ] 社交分享功能