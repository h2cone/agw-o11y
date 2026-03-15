import { describe, expect, it } from "vitest";
import type { SearchFormState } from "../types/log";
import {
  canLoadMore,
  createInitialLogBrowserState,
  isAbortError,
  reduceLogBrowserState,
  selectLogBrowserSummary,
  toRequestErrorMessage,
} from "./browser";
import { DEFAULT_FORM_STATE } from "./search";

describe("logs/browser", () => {
  it("creates an initial state with a pending fetch effect", () => {
    const initial = createInitialLogBrowserState();

    expect(initial.loading).toBe(true);
    expect(initial.activeRequest).toEqual({
      query: "*",
      start: "1h",
      end: "now",
      limit: 50,
    });
    expect(initial.pendingEffect).toEqual({
      type: "fetchLogs",
      requestId: 1,
      request: initial.activeRequest,
    });
    expect(initial.requestError).toBeNull();
    expect(initial.searchError).toBeNull();
  });

  it("submits a valid search by issuing a new fetch and resetting UI state", () => {
    const current = {
      ...createInitialLogBrowserState(),
      loading: false,
      hasMore: true,
      expandedKey: "row-1",
      requestError: "network down",
      lastIssuedRequestId: 4,
      inFlightRequestId: 4,
      pendingEffect: null,
    };
    const form: SearchFormState = {
      ...DEFAULT_FORM_STATE,
      mode: "logsql",
      rawQuery: '  llm.provider:openai AND "429"  ',
      timePreset: "24h",
    };

    const next = reduceLogBrowserState(current, {
      type: "searchSubmitted",
      form,
    });

    expect(next.activeForm).toEqual(form);
    expect(next.activeRequest).toEqual({
      query: 'llm.provider:openai AND "429"',
      start: "24h",
      end: "now",
      limit: 50,
    });
    expect(next.loading).toBe(true);
    expect(next.hasMore).toBe(false);
    expect(next.expandedKey).toBeNull();
    expect(next.requestError).toBeNull();
    expect(next.searchError).toBeNull();
    expect(next.pendingEffect).toEqual({
      type: "fetchLogs",
      requestId: 5,
      request: next.activeRequest,
    });
  });

  it("captures validation errors without mutating the active query", () => {
    const current = {
      ...createInitialLogBrowserState(),
      loading: false,
      pendingEffect: null,
      expandedKey: "row-1",
    };

    const next = reduceLogBrowserState(current, {
      type: "searchSubmitted",
      form: {
        ...DEFAULT_FORM_STATE,
        timePreset: "custom",
        customStart: "",
        customEnd: "2026-03-15T11:00",
      },
    });

    expect(next.activeRequest).toEqual(current.activeRequest);
    expect(next.expandedKey).toBe("row-1");
    expect(next.searchError).toBe(
      "Select both start and end times for a custom range.",
    );
    expect(next.pendingEffect).toBeNull();
  });

  it("loads more only when the browser is ready", () => {
    const blocked = reduceLogBrowserState(createInitialLogBrowserState(), {
      type: "loadMoreRequested",
    });

    expect(blocked).toEqual(createInitialLogBrowserState());

    const ready = {
      ...createInitialLogBrowserState(),
      loading: false,
      hasMore: true,
      pendingEffect: null,
    };

    const next = reduceLogBrowserState(ready, {
      type: "loadMoreRequested",
    });

    expect(next.activeRequest.limit).toBe(100);
    expect(next.loading).toBe(true);
    expect(next.pendingEffect?.requestId).toBe(2);
  });

  it("applies request results only for the active request", () => {
    const inFlight = {
      ...createInitialLogBrowserState(),
      activeRequest: {
        query: "foo",
        start: "24h",
        end: "now",
        limit: 100,
      },
      loading: true,
      hasMore: true,
      inFlightRequestId: 3,
      lastIssuedRequestId: 3,
      pendingEffect: {
        type: "fetchLogs" as const,
        requestId: 3,
        request: {
          query: "foo",
          start: "24h",
          end: "now",
          limit: 100,
        },
      },
    };

    const stale = reduceLogBrowserState(inFlight, {
      type: "requestSucceeded",
      requestId: 2,
      response: { logs: [{ _time: "stale" }], count: 1 },
    });

    expect(stale).toEqual(inFlight);

    const next = reduceLogBrowserState(inFlight, {
      type: "requestSucceeded",
      requestId: 3,
      response: {
        logs: Array.from({ length: 100 }, (_, index) => ({
          _time: `2026-03-15T10:${String(index).padStart(2, "0")}:00Z`,
        })),
        count: 100,
      },
    });

    expect(next.loading).toBe(false);
    expect(next.hasMore).toBe(true);
    expect(next.pendingEffect).toBeNull();
    expect(next.logs).toHaveLength(100);
  });

  it("tracks expanded rows and derives summary labels", () => {
    const toggled = reduceLogBrowserState(createInitialLogBrowserState(), {
      type: "toggleExpanded",
      key: "row-1",
    });

    expect(toggled.expandedKey).toBe("row-1");

    const summary = selectLogBrowserSummary({
      ...toggled,
      loading: false,
      logs: [{ _time: "2026-03-15T10:00:00Z" }],
      hasMore: false,
      pendingEffect: null,
    });

    expect(summary.activeFilter).toBe("All logs");
    expect(summary.activeFilterCaption).toBe("Keyword mode");
    expect(summary.timeWindow).toBe("Last 1h");
    expect(summary.returnedRows).toBe("1");
    expect(summary.returnedRowsCaption).toBe("Fully loaded");
  });

  it("reports pagination readiness and maps async errors", () => {
    expect(
      canLoadMore({
        ...createInitialLogBrowserState(),
        loading: false,
        hasMore: true,
        pendingEffect: null,
      }),
    ).toBe(true);

    expect(
      canLoadMore({
        ...createInitialLogBrowserState(),
        loading: true,
        hasMore: true,
      }),
    ).toBe(false);

    const abortError = new DOMException("cancelled", "AbortError");

    expect(isAbortError(abortError)).toBe(true);
    expect(isAbortError(new Error("boom"))).toBe(false);
    expect(toRequestErrorMessage(new Error("boom"))).toBe("boom");
    expect(toRequestErrorMessage("boom")).toBe("Failed to load logs.");
  });
});
