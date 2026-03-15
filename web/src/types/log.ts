export type SearchMode = "simple" | "logsql";
export type TimePreset = "5m" | "15m" | "1h" | "6h" | "24h" | "7d" | "custom";
export type LogFieldValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | Array<LogFieldValue>;

export interface LogEntry {
  _time?: string;
  _msg?: string;
  "llm.provider"?: string;
  "llm.request.model"?: string;
  "llm.response.model"?: string;
  "llm.usage.prompt_tokens"?: string | number;
  "llm.usage.completion_tokens"?: string | number;
  "llm.usage.total_tokens"?: string | number;
  "llm.is_streaming"?: string | boolean;
  "llm.request.body"?: string;
  "llm.response.body"?: string;
  [key: string]: LogFieldValue | undefined;
}

export interface LogsResponse {
  logs: LogEntry[];
  count: number;
}

export interface LogsQuery {
  query: string;
  start?: string;
  end?: string;
}

export interface LogsRequest extends LogsQuery {
  limit: number;
}

export interface SearchFormState {
  mode: SearchMode;
  keyword: string;
  rawQuery: string;
  timePreset: TimePreset;
  customStart: string;
  customEnd: string;
}
