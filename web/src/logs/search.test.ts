import { describe, expect, it } from "vitest";
import type { SearchFormState } from "../types/log";
import {
  DEFAULT_FORM_STATE,
  buildLogsQuery,
  describeQuery,
  describeTimeSelection,
  setCustomBoundary,
  setKeyword,
  setRawQuery,
  setSearchMode,
  setTimePreset,
} from "./search";

describe("logs/search", () => {
  it("builds a wildcard query for an empty simple search", () => {
    expect(buildLogsQuery(DEFAULT_FORM_STATE)).toEqual({
      query: "*",
      start: "1h",
      end: "now",
    });
  });

  it("builds a simple keyword query by trimming and joining tokens", () => {
    const form: SearchFormState = {
      ...DEFAULT_FORM_STATE,
      keyword: '  openai   "rate-limit"  timeout ',
    };
    const expectedQuery = ["openai", '"rate-limit"', "timeout"]
      .map((token) => JSON.stringify(token))
      .join(" AND ");

    expect(buildLogsQuery(form)).toEqual({
      query: expectedQuery,
      start: "1h",
      end: "now",
    });
  });

  it("preserves raw LogsQL after trimming", () => {
    const form: SearchFormState = {
      ...DEFAULT_FORM_STATE,
      mode: "logsql",
      rawQuery: '  llm.provider:openai AND "429"  ',
      timePreset: "24h",
    };

    expect(buildLogsQuery(form)).toEqual({
      query: 'llm.provider:openai AND "429"',
      start: "24h",
      end: "now",
    });
  });

  it("builds a custom range query with ISO boundaries", () => {
    const form: SearchFormState = {
      ...DEFAULT_FORM_STATE,
      mode: "logsql",
      rawQuery: "llm.provider:anthropic",
      timePreset: "custom",
      customStart: "2026-03-15T10:00",
      customEnd: "2026-03-15T11:30",
    };

    expect(buildLogsQuery(form)).toEqual({
      query: "llm.provider:anthropic",
      start: new Date("2026-03-15T10:00").toISOString(),
      end: new Date("2026-03-15T11:30").toISOString(),
    });
  });

  it("rejects a custom range with missing boundaries", () => {
    expect(() =>
      buildLogsQuery({
        ...DEFAULT_FORM_STATE,
        timePreset: "custom",
        customStart: "2026-03-15T10:00",
        customEnd: "",
      }),
    ).toThrow("Select both start and end times for a custom range.");
  });

  it("rejects a custom range with invalid boundaries", () => {
    expect(() =>
      buildLogsQuery({
        ...DEFAULT_FORM_STATE,
        timePreset: "custom",
        customStart: "not-a-date",
        customEnd: "2026-03-15T11:00",
      }),
    ).toThrow("The custom start time is invalid.");
  });

  it("rejects a custom range when start is not earlier than end", () => {
    expect(() =>
      buildLogsQuery({
        ...DEFAULT_FORM_STATE,
        timePreset: "custom",
        customStart: "2026-03-15T11:00",
        customEnd: "2026-03-15T11:00",
      }),
    ).toThrow("The custom start time must be earlier than the end time.");
  });

  it("describes preset and custom time selections", () => {
    expect(describeTimeSelection(DEFAULT_FORM_STATE)).toBe("Last 1h");

    expect(
      describeTimeSelection({
        ...DEFAULT_FORM_STATE,
        timePreset: "custom",
        customStart: "2026-03-15T10:00",
        customEnd: "2026-03-15T11:00",
      }),
    ).toBe("2026-03-15 10:00:00 to 2026-03-15 11:00:00");
  });

  it("maps wildcard and non-wildcard queries to readable labels", () => {
    expect(describeQuery("*")).toBe("All logs");
    expect(describeQuery('llm.provider:openai')).toBe("llm.provider:openai");
  });

  it("sets a custom preset with a deterministic default one-hour range", () => {
    const now = new Date(2026, 2, 15, 12, 0, 0);
    const next = setTimePreset(
      DEFAULT_FORM_STATE,
      "custom",
      now,
    );

    expect(next.timePreset).toBe("custom");
    expect(next.customStart).toBe("2026-03-15T11:00");
    expect(next.customEnd).toBe("2026-03-15T12:00");
  });

  it("preserves an existing custom range when selecting the custom preset again", () => {
    const current: SearchFormState = {
      ...DEFAULT_FORM_STATE,
      timePreset: "custom",
      customStart: "2026-03-15T08:00",
      customEnd: "2026-03-15T09:00",
    };

    expect(
      setTimePreset(current, "custom", new Date(2026, 2, 15, 12, 0, 0)),
    ).toEqual(current);
  });

  it("returns updated form copies for the small state helpers", () => {
    const nextMode = setSearchMode(DEFAULT_FORM_STATE, "logsql");
    const nextKeyword = setKeyword(DEFAULT_FORM_STATE, "anthropic");
    const nextRawQuery = setRawQuery(DEFAULT_FORM_STATE, "llm.provider:openai");
    const nextBoundary = setCustomBoundary(
      DEFAULT_FORM_STATE,
      "customStart",
      "2026-03-15T08:00",
    );

    expect(nextMode).toEqual({ ...DEFAULT_FORM_STATE, mode: "logsql" });
    expect(nextKeyword).toEqual({ ...DEFAULT_FORM_STATE, keyword: "anthropic" });
    expect(nextRawQuery).toEqual({
      ...DEFAULT_FORM_STATE,
      rawQuery: "llm.provider:openai",
    });
    expect(nextBoundary).toEqual({
      ...DEFAULT_FORM_STATE,
      customStart: "2026-03-15T08:00",
    });
    expect(nextMode).not.toBe(DEFAULT_FORM_STATE);
  });
});
