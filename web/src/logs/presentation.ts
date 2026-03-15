import type { LogEntry } from "../types/log";

const SUMMARY_FIELDS = new Set([
  "_time",
  "_msg",
  "llm.provider",
  "llm.request.model",
  "llm.response.model",
  "llm.usage.prompt_tokens",
  "llm.usage.completion_tokens",
  "llm.usage.total_tokens",
  "llm.is_streaming",
  "llm.request.body",
  "llm.response.body",
]);

const PRIMARY_DETAIL_FIELDS: Array<{ label: string; key: string }> = [
  { label: "Timestamp", key: "_time" },
  { label: "Message", key: "_msg" },
  { label: "Provider", key: "llm.provider" },
  { label: "Request model", key: "llm.request.model" },
  { label: "Response model", key: "llm.response.model" },
  { label: "Streaming", key: "llm.is_streaming" },
  { label: "Prompt tokens", key: "llm.usage.prompt_tokens" },
  { label: "Completion tokens", key: "llm.usage.completion_tokens" },
  { label: "Total tokens", key: "llm.usage.total_tokens" },
];

export interface LogSummary {
  provider: string;
  providerBadgeClass: string;
  model: string;
  streaming: boolean;
  promptTokens: string;
  completionTokens: string;
  totalTokens: string;
  message: string;
  timestamp: string;
}

export interface DetailField {
  label: string;
  value: unknown;
}

export function buildLogSummary(entry: LogEntry): LogSummary {
  const provider = stringifyValue(entry["llm.provider"]) || "unknown";
  const requestModel = stringifyValue(entry["llm.request.model"]);
  const responseModel = stringifyValue(entry["llm.response.model"]);

  return {
    provider,
    providerBadgeClass: providerBadgeClass(provider),
    model: requestModel || responseModel || "unknown-model",
    streaming: truthy(entry["llm.is_streaming"]),
    promptTokens: stringifyValue(entry["llm.usage.prompt_tokens"]),
    completionTokens: stringifyValue(entry["llm.usage.completion_tokens"]),
    totalTokens: stringifyValue(entry["llm.usage.total_tokens"]),
    message: stringifyValue(entry._msg) || "Structured access log event",
    timestamp: formatTimestamp(entry._time),
  };
}

export function getPrimaryLogDetails(entry: LogEntry): DetailField[] {
  return PRIMARY_DETAIL_FIELDS.map(({ label, key }) => ({
    label,
    value: entry[key],
  }));
}

export function getAdditionalLogFields(entry: LogEntry): DetailField[] {
  return Object.entries(entry)
    .filter(([key]) => !SUMMARY_FIELDS.has(key))
    .map(([label, value]) => ({ label, value }));
}

export function getLogKey(entry: LogEntry, index: number): string {
  return [
    entry._time ?? "no-time",
    typeof entry._msg === "string" ? entry._msg : "no-message",
    index,
  ].join("::");
}

export function renderDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  return safeStringify(value);
}

export function formatJsonBlock(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "No value";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return safeStringify(value);
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function truthy(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return String(value).toLowerCase() === "true";
}

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return "Unknown timestamp";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function providerBadgeClass(provider: string): string {
  const normalized = provider.toLowerCase();

  if (normalized.includes("openai")) {
    return "rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700";
  }
  if (normalized.includes("anthropic")) {
    return "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700";
  }
  return "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700";
}
