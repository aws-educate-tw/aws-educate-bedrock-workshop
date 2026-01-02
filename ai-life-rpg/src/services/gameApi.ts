import { 
  BackgroundRequest, BackgroundResponse, 
  StoryRequest, StoryResponse,
  ResolveEventRequest, ResolveEventResponse,
  ResultRequest, ResultResponse 
} from '../types/game';
import { mockGameService } from '../mocks/gameData';

export class GameApiService {
  private baseURL: string;
  private useMock: boolean;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || '';
    this.useMock = !baseURL || baseURL.trim() === '';
  }

  private async apiCall<T>(endpoint: string, data: any): Promise<T> {
    if (this.useMock) {
      // 使用 mock 服務
      switch (endpoint) {
        case '/generate-background':
          return mockGameService.generateBackground(data) as T;
        case '/generate-story':
          return mockGameService.generateStory(data) as T;
        case '/resolve-event':
          return mockGameService.resolveEvent(data) as T;
        case '/generate-result':
          return mockGameService.generateResult(data) as T;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API call failed, falling back to mock data:`, error);
      // API 失敗時自動 fallback 到 mock
      this.useMock = true;
      return this.apiCall(endpoint, data);
    }
  }

  async generateBackground(request: BackgroundRequest): Promise<BackgroundResponse> {
    return this.apiCall<BackgroundResponse>('/generate-background', request);
  }

  async generateStory(request: StoryRequest): Promise<StoryResponse> {
    return this.apiCall<StoryResponse>('/generate-story', request);
  }

  async resolveEvent(request: ResolveEventRequest): Promise<ResolveEventResponse> {
    return this.apiCall<ResolveEventResponse>('/resolve-event', request);
  }

  async generateResult(request: ResultRequest): Promise<ResultResponse> {
    return this.apiCall<ResultResponse>('/generate-result', request);
  }
}