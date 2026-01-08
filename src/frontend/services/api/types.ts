// ============ Request Types ============

export interface GenerateBackgroundRequest {
  knowledge_base_id: string;
}

export interface GenerateStoryRequest {
  session_id: string;
}

export interface ResolveEventRequest {
  session_id: string;
  event: StoryResponse;
  selected_option: string;
}

export interface GenerateResultRequest {
  session_id: string;
}

// ============ Response Types ============

export interface PlayerIdentity {
  age: number;
  gender: string;
  appearance: string;
  profession: string;
  initial_traits: string[];
}

export interface GenerateBackgroundResponse {
  session_id: string;
  background: string;
  player_identity: PlayerIdentity;
  life_goal: string;
  image: string | null;
}

export interface GameProgressInfo {
  turn: number;
  total_turns: number;
  phase: string;
  phase_progress: string;
  turns_left: number;
}

export interface StoryOption {
  option_id: string;
  description: string;
}

export interface StoryResponse {
  event_id: string;
  event_description: string;
  options: StoryOption[];
  image: string | null;
  game_progress: GameProgressInfo;
  should_generate_result?: boolean;
}

export interface StatChange {
  stat: string;
  change: number;
  reason: string;
}

export interface UpdatedPlayerState {
  age: number;
  career: string;
  wisdom: number;
  wealth: number;
  relationships: number;
  career_development: number;
  wellbeing: number;
  traits: string[];
}

export interface ResolveEventResponse {
  event_outcome: string;
  updated_player_state: UpdatedPlayerState;
  stat_changes: StatChange[];
  current_summary: string;
  image: string | null;
}

export interface Achievement {
  title: string;
  description: string;
  icon: string;
}

export interface KeyDecision {
  event_description: string;
  decision: string;
  impact: string;
}

export interface FinalScores {
  wisdom: number;
  wealth: number;
  relationships: number;
  career_development: number;
  wellbeing: number;
}

export interface GenerateResultResponse {
  summary: string;
  final_scores: FinalScores;
  achievements: Achievement[];
  key_decisions: KeyDecision[];
  ending_type: string;
  ending_title: string;
  image: string | null;
}

// ============ Health Check Types ============

export interface DbHealthResponse {
  ok: boolean;
  table: string;
  itemExists: boolean;
}

export interface LambdaHealthResponse {
  ok: boolean;
  timestamp: string;
}

// ============ API Error Type ============

export class ApiError extends Error {
  constructor(
    public statusCode: number | null,
    public errorType: "network" | "timeout" | "4xx" | "5xx" | "parse",
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
