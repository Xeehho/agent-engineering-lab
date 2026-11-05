export type Category = 'bug' | 'feature' | 'question';
export type Priority = 'low' | 'medium' | 'high';
export interface TriageResult {
  category: Category;
  priority: Priority;
  summary: string;
  missingInformation: string[];
}
export interface Usage { inputTokens: number; outputTokens: number }
export interface TriageResponse {
  requestId: string;
  result: TriageResult;
  provenance: {
    provider: 'mock' | 'live';
    model: string;
    promptVersion: string;
    usage: Usage | null;
  };
}
export interface ErrorBody { error: { code: string; message: string } }
export interface ProgressEvent {
  type: 'started' | 'completed' | 'failed';
  requestId: string;
  data?: unknown;
}
