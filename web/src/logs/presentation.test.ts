import { describe, expect, it } from "vitest";
import {
  buildLogSummary,
  formatJsonBlock,
  getAdditionalLogFields,
  getLogKey,
  getPrimaryLogDetails,
  renderDisplayValue,
  safeStringify,
} from "./presentation";

describe("logs/presentation", () => {
  it("builds a rich log summary from structured fields", () => {
    const expectedTimestamp = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date("2026-03-15T10:20:30Z"));

    const summary = buildLogSummary({
      _time: "2026-03-15T10:20:30Z",
      _msg: "Request completed",
      "llm.provider": "openai",
      "llm.request.model": "gpt-5",
      "llm.response.model": "gpt-5",
      "llm.is_streaming": "true",
      "llm.usage.prompt_tokens": 12,
      "llm.usage.completion_tokens": 34,
      "llm.usage.total_tokens": 46,
    });

    expect(summary).toMatchObject({
      provider: "openai",
      model: "gpt-5",
      streaming: true,
      promptTokens: "12",
      completionTokens: "34",
      totalTokens: "46",
      message: "Request completed",
      timestamp: expectedTimestamp,
    });
    expect(summary.providerBadgeClass).toContain("cyan");
  });

  it("falls back when summary fields are missing or malformed", () => {
    const summary = buildLogSummary({
      _time: "not-a-date",
      "llm.response.model": "claude-3-7-sonnet",
      "llm.is_streaming": false,
    });

    expect(summary.provider).toBe("unknown");
    expect(summary.model).toBe("claude-3-7-sonnet");
    expect(summary.streaming).toBe(false);
    expect(summary.message).toBe("Structured access log event");
    expect(summary.timestamp).toBe("not-a-date");
    expect(summary.providerBadgeClass).toContain("slate");
  });

  it("derives response metadata from SSE response bodies", () => {
    const responseBody = [
      "event: response.created",
      'data: {"type":"response.created","response":{"model":"gpt-5.4"}}',
      "",
      "event: response.completed",
      'data: {"type":"response.completed","response":{"model":"gpt-5.4","usage":{"input_tokens":56119,"output_tokens":170,"total_tokens":56289}}}',
    ].join("\n");

    const entry = {
      _time: "2026-03-15T10:20:30Z",
      _msg: "Request completed",
      "llm.provider": "openai",
      "llm.request.model": "gpt-5.4",
      "llm.response.body": responseBody,
    };

    const summary = buildLogSummary(entry);
    const details = getPrimaryLogDetails(entry);

    expect(summary).toMatchObject({
      model: "gpt-5.4",
      promptTokens: "56119",
      completionTokens: "170",
      totalTokens: "56289",
    });
    expect(details[4]).toEqual({
      label: "Response model",
      value: "gpt-5.4",
    });
    expect(details[6]).toEqual({
      label: "Prompt tokens",
      value: "56119",
    });
    expect(details[7]).toEqual({
      label: "Completion tokens",
      value: "170",
    });
    expect(details[8]).toEqual({
      label: "Total tokens",
      value: "56289",
    });
  });

  it("uses the anthropic badge when appropriate", () => {
    const summary = buildLogSummary({
      "llm.provider": "anthropic",
    });

    expect(summary.providerBadgeClass).toContain("orange");
  });

  it("returns the fixed primary detail fields in order", () => {
    const fields = getPrimaryLogDetails({
      _time: "2026-03-15T10:20:30Z",
      _msg: "done",
      "llm.provider": "openai",
    });

    expect(fields).toHaveLength(9);
    expect(fields[0]).toEqual({
      label: "Timestamp",
      value: "2026-03-15T10:20:30Z",
    });
    expect(fields[1]).toEqual({
      label: "Message",
      value: "done",
    });
    expect(fields[2]).toEqual({
      label: "Provider",
      value: "openai",
    });
  });

  it("filters summary fields out of the additional field list", () => {
    const fields = getAdditionalLogFields({
      _time: "2026-03-15T10:20:30Z",
      _msg: "done",
      "llm.provider": "openai",
      route: "default/route0",
      duration: "120ms",
    });

    expect(fields).toEqual([
      { label: "route", value: "default/route0" },
      { label: "duration", value: "120ms" },
    ]);
  });

  it("builds stable row keys from timestamp, message, and index", () => {
    expect(
      getLogKey(
        {
          _time: "2026-03-15T10:20:30Z",
          _msg: "done",
        },
        7,
      ),
    ).toBe("2026-03-15T10:20:30Z::done::7");
  });

  it("renders display values consistently", () => {
    expect(renderDisplayValue(undefined)).toBe("—");
    expect(renderDisplayValue("value")).toBe("value");
    expect(renderDisplayValue({ ok: true })).toBe('{\n  "ok": true\n}');
  });

  it("formats JSON blocks, preserving plain text when JSON parsing fails", () => {
    expect(formatJsonBlock("")).toBe("No value");
    expect(formatJsonBlock('{"ok":true}')).toBe('{\n  "ok": true\n}');
    expect(formatJsonBlock("plain text")).toBe("plain text");
    expect(formatJsonBlock({ ok: true })).toBe('{\n  "ok": true\n}');
  });

  it("stringifies values safely", () => {
    expect(safeStringify({ ok: true })).toBe('{\n  "ok": true\n}');

    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(safeStringify(circular)).toContain("[object Object]");
  });
});
