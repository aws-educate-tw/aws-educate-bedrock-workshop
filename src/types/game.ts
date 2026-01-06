// 後端 API 請求/回應型別
export interface BackgroundRequest {
  model_id: string;
}

export interface BackgroundResponse {
  session_id: string;
  background: string;
  player_identity: {
    age: number;
    profession: string;
    initial_traits: string[];
  };
  life_goal: string;
}

export interface StoryRequest {
  session_id: string;
}

export interface Option {
  option_id: string;
  description: string;
}

export interface StoryResponse {
  event_id: string;
  event_description: string;
  options: Option[];
}

export interface ResolveEventRequest {
  session_id: string;
  event: StoryResponse; // 整包事件物件傳回後端
  selected_option_id: string;
}

export interface PlayerState {
  age: number;
  career: number;
  finance: number;
  health: number;
  relationships: number;
  traits: string[];
}

export interface ResolveEventResponse {
  event_outcome: string;
  updated_player_state: PlayerState;
  current_summary: string;
}

export interface ResultRequest {
  session_id: string;
}

export interface RadarScores {
  financial: number; // 對應前端 wealth
  career: number; // 對應前端 career
  health: number; // 對應前端 health
  relationships: number; // 對應前端 relationship
  self_fulfillment: number; // 對應前端 wisdom (智慧/自我實現)
}

export interface ResultResponse {
  summary: string;
  radar_scores: RadarScores;
  ending_type: string;
}

// 前端使用的型別 (與既有系統相容)
export interface GameSession {
  sessionId: string;
  modelId: string;
  currentEvent?: StoryResponse;
  playerState?: PlayerState;
  background?: string;
  lifeGoal?: string;
  currentSummary?: string;
  eventHistory?: Array<{
    event: StoryResponse;
    selectedOption: string;
    outcome: string;
  }>;
}

// 前端雷達圖資料格式 (維持既有格式)
export interface FrontendRadarData {
  wisdom: number; // <- self_fulfillment (智慧/自我實現)
  wealth: number; // <- financial (財富)
  relationship: number; // <- relationships (人際關係)
  career: number; // <- career (職涯發展)
  health: number; // <- health (身心健康)
}

// 轉換函式：後端雷達資料 -> 前端雷達資料
export const mapRadarData = (backendData: RadarScores): FrontendRadarData => ({
  wisdom: backendData.self_fulfillment, // 智慧/自我實現
  wealth: backendData.financial, // 財富
  relationship: backendData.relationships, // 人際關係
  career: backendData.career, // 職涯發展
  health: backendData.health, // 身心健康
});

// 既有系統相容介面
export interface Achievement {
  title: string;
  desc: string;
  iconUrl?: string;
}

export type RadarDataMapper = (backendData: RadarScores) => FrontendRadarData;

// API Service 使用的類型 (mock/實時 API)
export interface PlayRequest {
  sessionId?: string;
}

export interface PlayResponse {
  sessionId: string;
  stage: "childhood" | "student" | "adult" | "elder";
  imageUrl: string;
  statusText: string;
  goalText: string;
  eventText: string;
  optionA: string;
  optionB: string;
  isEnd: boolean;
}

export interface SummaryState {
  [key: string]: any;
}
