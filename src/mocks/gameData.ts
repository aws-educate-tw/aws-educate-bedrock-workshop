import {
  BackgroundRequest,
  BackgroundResponse,
  PlayerState,
  RadarScores,
  ResolveEventRequest,
  ResolveEventResponse,
  ResultRequest,
  ResultResponse,
  StoryRequest,
  StoryResponse,
} from "../types/game";

// Mock 遊戲狀態管理
class MockGameState {
  private sessions: Map<
    string,
    {
      modelId: string;
      background: string;
      lifeGoal: string;
      playerState: PlayerState;
      eventHistory: Array<{
        event: StoryResponse;
        selectedOption: string;
        outcome: string;
      }>;
      currentEventIndex: number;
      summary: string;
    }
  > = new Map();

  private mockEvents: StoryResponse[] = [
    {
      event_id: "childhood_1",
      event_description:
        "你在小學時期遇到了一個轉學生，他看起來很孤單。你會如何對待他？",
      options: [
        { option_id: "A", description: "主動邀請他一起玩，成為朋友" },
        { option_id: "B", description: "保持距離，觀察一段時間再說" },
      ],
    },
    {
      event_id: "student_1",
      event_description:
        "高中時期，你面臨選擇科系的重要時刻。你的興趣與父母的期望不同。",
      options: [
        { option_id: "A", description: "堅持自己的興趣，選擇藝術相關科系" },
        { option_id: "B", description: "聽從父母建議，選擇商科或理工科" },
      ],
    },
    {
      event_id: "adult_1",
      event_description:
        "剛出社會的你收到兩個工作機會：一個是大公司的穩定職位，另一個是新創公司的挑戰性工作。",
      options: [
        { option_id: "A", description: "選擇大公司，追求穩定與保障" },
        { option_id: "B", description: "加入新創公司，追求成長與挑戰" },
      ],
    },
    {
      event_id: "adult_2",
      event_description:
        "30歲的你面臨人生重要抉擇：是否要結婚定下來，還是繼續專注事業發展？",
      options: [
        { option_id: "A", description: "選擇結婚，建立穩定的家庭生活" },
        { option_id: "B", description: "專注事業，暫時不考慮結婚" },
      ],
    },
    {
      event_id: "elder_1",
      event_description:
        "50歲的你開始思考人生下半場。你想要如何度過接下來的歲月？",
      options: [
        { option_id: "A", description: "追求內心平靜，多陪伴家人" },
        { option_id: "B", description: "繼續挑戰自己，學習新事物" },
      ],
    },
  ];

  generateSessionId(): string {
    return `mock_session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  createSession(modelId: string): string {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, {
      modelId,
      background:
        "你出生在一個普通的中產階級家庭，父母都是上班族。從小你就展現出好奇心旺盛的特質，喜歡探索新事物。",
      lifeGoal: "成為一個對社會有貢獻的人，同時擁有幸福的家庭生活。",
      playerState: {
        age: 8,
        career: 20,
        finance: 30,
        health: 90,
        relationships: 60,
        traits: ["好奇心旺盛", "善良"],
      },
      eventHistory: [],
      currentEventIndex: 0,
      summary: "你的人生剛剛開始...",
    });
    return sessionId;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: any) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  getCurrentEvent(sessionId: string): StoryResponse | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    if (session.currentEventIndex >= this.mockEvents.length) {
      return null; // 遊戲結束
    }

    return this.mockEvents[session.currentEventIndex];
  }

  resolveEvent(
    sessionId: string,
    selectedOptionId: string
  ): ResolveEventResponse {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const currentEvent = this.getCurrentEvent(sessionId);
    if (!currentEvent) throw new Error("No current event");

    // 模擬事件結果
    const outcomes = {
      A: {
        childhood_1: "你主動與轉學生成為朋友，這培養了你的同理心和社交能力。",
        student_1: "你堅持自己的興趣選擇，雖然路途艱辛但內心充實。",
        adult_1: "你選擇了大公司，獲得了穩定的收入和完善的福利。",
        adult_2: "你選擇結婚，建立了溫馨的家庭，獲得了情感支持。",
        elder_1: "你選擇內心平靜，與家人的關係更加緊密。",
      },
      B: {
        childhood_1: "你選擇觀察，培養了謹慎思考的習慣。",
        student_1: "你聽從父母建議，獲得了更好的就業前景。",
        adult_1: "你加入新創公司，雖然辛苦但獲得了寶貴的經驗。",
        adult_2: "你專注事業發展，在職場上取得了顯著成就。",
        elder_1: "你繼續挑戰自己，保持了年輕的心態。",
      },
    };

    const outcome =
      outcomes[selectedOptionId as "A" | "B"][
        currentEvent.event_id as keyof typeof outcomes.A
      ] || "你做出了選擇，人生繼續前進。";

    // 更新玩家狀態
    const stateChanges = this.calculateStateChanges(
      currentEvent.event_id,
      selectedOptionId
    );
    const newPlayerState = { ...session.playerState };

    Object.keys(stateChanges).forEach((key) => {
      if (key !== "traits") {
        (newPlayerState as any)[key] = Math.max(
          0,
          Math.min(100, (newPlayerState as any)[key] + stateChanges[key])
        );
      }
    });

    // 更新年齡
    newPlayerState.age += Math.floor(Math.random() * 8) + 5; // 5-12歲增長

    // 記錄事件歷史
    session.eventHistory.push({
      event: currentEvent,
      selectedOption: selectedOptionId,
      outcome,
    });

    // 更新當前事件索引
    session.currentEventIndex++;

    // 更新摘要
    session.summary = this.generateCurrentSummary(session);

    // 更新 session
    this.updateSession(sessionId, {
      playerState: newPlayerState,
      summary: session.summary,
    });

    return {
      event_outcome: outcome,
      updated_player_state: newPlayerState,
      current_summary: session.summary,
    };
  }

  private calculateStateChanges(eventId: string, selectedOption: string): any {
    const changes: any = {
      childhood_1: {
        A: { relationships: 15, health: 5 },
        B: { career: 10, relationships: -5 },
      },
      student_1: {
        A: { health: 10, relationships: 5, finance: -10 },
        B: { career: 15, finance: 10, health: -5 },
      },
      adult_1: {
        A: { finance: 20, career: 10, health: 5 },
        B: { career: 25, relationships: -5, health: -10 },
      },
      adult_2: {
        A: { relationships: 20, health: 10, career: -5 },
        B: { career: 20, finance: 15, relationships: -10 },
      },
      elder_1: {
        A: { health: 15, relationships: 15, career: -5 },
        B: { career: 10, health: 5, relationships: 5 },
      },
    };

    return changes[eventId]?.[selectedOption] || {};
  }

  private generateCurrentSummary(session: any): string {
    const summaries = [
      "你的童年充滿了學習與成長，為未來奠定了基礎。",
      "學生時期的選擇開始塑造你的人生方向。",
      "踏入社會後，你面臨更多挑戰與機會。",
      "人生中段，你在事業與家庭間找到平衡。",
      "步入人生後半段，你開始思考生命的意義。",
    ];

    const index = Math.min(session.currentEventIndex, summaries.length - 1);
    return summaries[index];
  }

  generateFinalResult(sessionId: string): ResultResponse {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const playerState = session.playerState;

    // 計算雷達分數
    const radar_scores: RadarScores = {
      financial: playerState.finance,
      career: playerState.career,
      health: playerState.health,
      relationships: playerState.relationships,
      self_fulfillment: Math.floor(
        (playerState.career + playerState.health + playerState.relationships) /
          3
      ),
    };

    // 生成最終總結
    const avgScore =
      (radar_scores.financial +
        radar_scores.career +
        radar_scores.health +
        radar_scores.relationships +
        radar_scores.self_fulfillment) /
      5;

    let summary = `經過 ${session.eventHistory.length} 個重要抉擇，你的人生畫下了句號。`;

    if (avgScore >= 80) {
      summary +=
        "你過著充實而成功的一生，在各個方面都取得了優異的成就。你的選擇展現了智慧與勇氣，為自己和他人創造了價值。";
    } else if (avgScore >= 60) {
      summary +=
        "你的人生雖有起伏，但整體而言是平衡且有意義的。你在某些領域表現出色，同時也學會了接受生活的不完美。";
    } else {
      summary +=
        "你的人生充滿挑戰，但每一次的困難都讓你變得更加堅強。雖然結果不盡如人意，但你的努力和堅持值得敬佩。";
    }

    const ending_type =
      avgScore >= 80 ? "perfect" : avgScore >= 60 ? "good" : "challenging";

    return {
      summary,
      radar_scores,
      ending_type,
    };
  }
}

// 全域 mock 狀態實例
const mockState = new MockGameState();

// Mock 服務
export const mockGameService = {
  generateBackground(request: BackgroundRequest): Promise<BackgroundResponse> {
    return Promise.resolve().then(() => {
      const sessionId = mockState.createSession(request.model_id);
      const session = mockState.getSession(sessionId)!;

      return {
        session_id: sessionId,
        background: session.background,
        player_identity: {
          age: session.playerState.age,
          profession: "學生",
          initial_traits: session.playerState.traits,
        },
        life_goal: session.lifeGoal,
      };
    });
  },

  generateStory(request: StoryRequest): Promise<StoryResponse> {
    return Promise.resolve().then(() => {
      const event = mockState.getCurrentEvent(request.session_id);
      if (!event) {
        throw new Error("No more events available");
      }
      return event;
    });
  },

  resolveEvent(request: ResolveEventRequest): Promise<ResolveEventResponse> {
    return Promise.resolve().then(() => {
      return mockState.resolveEvent(
        request.session_id,
        request.selected_option_id
      );
    });
  },

  generateResult(request: ResultRequest): Promise<ResultResponse> {
    return Promise.resolve().then(() => {
      return mockState.generateFinalResult(request.session_id);
    });
  },
};

// 導出 mock service（相容 gameService 的命名）
export const fallbackGameService = mockGameService;
