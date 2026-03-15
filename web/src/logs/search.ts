import type {
  LogsQuery,
  SearchFormState,
  SearchMode,
  TimePreset,
} from "../types/log";

export const PAGE_SIZE = 50;
export const SEARCH_MODES: SearchMode[] = ["simple", "logsql"];

export const DEFAULT_FORM_STATE: SearchFormState = {
  mode: "simple",
  keyword: "",
  rawQuery: "*",
  timePreset: "1h",
  customStart: "",
  customEnd: "",
};

export const TIME_PRESETS: Array<{ value: TimePreset; label: string }> = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "custom", label: "Custom" },
];

type CustomBoundary = "customStart" | "customEnd";

export function buildLogsQuery(form: SearchFormState): LogsQuery {
  const query =
    form.mode === "logsql"
      ? form.rawQuery.trim() || "*"
      : buildSimpleKeywordQuery(form.keyword);

  if (form.timePreset === "custom") {
    if (!form.customStart || !form.customEnd) {
      throw new Error("Select both start and end times for a custom range.");
    }

    const start = toIsoString(form.customStart, "start");
    const end = toIsoString(form.customEnd, "end");

    if (new Date(start).getTime() >= new Date(end).getTime()) {
      throw new Error("The custom start time must be earlier than the end time.");
    }

    return { query, start, end };
  }

  return { query, start: form.timePreset, end: "now" };
}

export function describeTimeSelection(form: SearchFormState): string {
  if (form.timePreset !== "custom") {
    return `Last ${form.timePreset}`;
  }

  const start = formatDisplayDate(new Date(form.customStart));
  const end = formatDisplayDate(new Date(form.customEnd));
  return `${start} to ${end}`;
}

export function describeQuery(query: string): string {
  return query === "*" ? "All logs" : query;
}

export function setSearchMode(
  form: SearchFormState,
  mode: SearchMode,
): SearchFormState {
  return { ...form, mode };
}

export function setTimePreset(
  form: SearchFormState,
  preset: TimePreset,
  now: Date,
): SearchFormState {
  if (preset !== "custom") {
    return { ...form, timePreset: preset };
  }

  if (form.customStart && form.customEnd) {
    return { ...form, timePreset: preset };
  }

  return {
    ...form,
    timePreset: preset,
    ...createDefaultCustomRange(now),
  };
}

export function setKeyword(
  form: SearchFormState,
  keyword: string,
): SearchFormState {
  return { ...form, keyword };
}

export function setRawQuery(
  form: SearchFormState,
  rawQuery: string,
): SearchFormState {
  return { ...form, rawQuery };
}

export function setCustomBoundary(
  form: SearchFormState,
  field: CustomBoundary,
  value: string,
): SearchFormState {
  return { ...form, [field]: value };
}

function buildSimpleKeywordQuery(keyword: string): string {
  const tokens = keyword
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "*";
  }

  return tokens.map((token) => JSON.stringify(token)).join(" AND ");
}

function toIsoString(value: string, label: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`The custom ${label} time is invalid.`);
  }

  return date.toISOString();
}

function createDefaultCustomRange(now: Date): Pick<
  SearchFormState,
  "customStart" | "customEnd"
> {
  const end = new Date(now);
  const start = new Date(now.getTime() - 60 * 60 * 1000);

  return {
    customStart: toLocalInputValue(start),
    customEnd: toLocalInputValue(end),
  };
}

function toLocalInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDate(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}
