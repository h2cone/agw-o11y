import type {
  LogEntry,
  LogsRequest,
  LogsResponse,
  SearchFormState,
} from "../types/log";
import {
  DEFAULT_FORM_STATE,
  PAGE_SIZE,
  buildLogsQuery,
  describeQuery,
  describeTimeSelection,
} from "./search";

export interface FetchLogsEffect {
  type: "fetchLogs";
  requestId: number;
  request: LogsRequest;
}

export interface LogBrowserState {
  activeForm: SearchFormState;
  activeRequest: LogsRequest;
  logs: LogEntry[];
  loading: boolean;
  requestError: string | null;
  searchError: string | null;
  hasMore: boolean;
  expandedKey: string | null;
  inFlightRequestId: number;
  lastIssuedRequestId: number;
  pendingEffect: FetchLogsEffect | null;
}

export type LogBrowserAction =
  | { type: "searchSubmitted"; form: SearchFormState }
  | { type: "loadMoreRequested" }
  | { type: "toggleExpanded"; key: string }
  | { type: "requestSucceeded"; requestId: number; response: LogsResponse }
  | { type: "requestFailed"; requestId: number; error: string };

export interface LogBrowserSummary {
  activeFilter: string;
  activeFilterCaption: string;
  timeWindow: string;
  timeWindowCaption: string;
  returnedRows: string;
  returnedRowsCaption: string;
}

export function createInitialLogBrowserState(
  initialForm: SearchFormState = DEFAULT_FORM_STATE,
): LogBrowserState {
  const request = buildLogsRequest(initialForm, PAGE_SIZE);

  return {
    activeForm: initialForm,
    activeRequest: request,
    logs: [],
    loading: true,
    requestError: null,
    searchError: null,
    hasMore: false,
    expandedKey: null,
    inFlightRequestId: 1,
    lastIssuedRequestId: 1,
    pendingEffect: {
      type: "fetchLogs",
      requestId: 1,
      request,
    },
  };
}

export function reduceLogBrowserState(
  state: LogBrowserState,
  action: LogBrowserAction,
): LogBrowserState {
  switch (action.type) {
    case "searchSubmitted":
      return submitSearch(state, action.form);
    case "loadMoreRequested":
      if (!canLoadMore(state)) {
        return state;
      }

      return issueFetch(
        state,
        {
          ...state.activeRequest,
          limit: state.activeRequest.limit + PAGE_SIZE,
        },
        {
          requestError: null,
        },
      );
    case "toggleExpanded":
      return {
        ...state,
        expandedKey: state.expandedKey === action.key ? null : action.key,
      };
    case "requestSucceeded":
      if (action.requestId !== state.inFlightRequestId) {
        return state;
      }

      return {
        ...state,
        logs: action.response.logs,
        hasMore: action.response.count >= state.activeRequest.limit,
        loading: false,
        requestError: null,
        pendingEffect: null,
      };
    case "requestFailed":
      if (action.requestId !== state.inFlightRequestId) {
        return state;
      }

      return {
        ...state,
        loading: false,
        requestError: action.error,
        pendingEffect: null,
      };
    default:
      return state;
  }
}

export function canLoadMore(state: LogBrowserState): boolean {
  return !state.loading && state.hasMore;
}

export function selectLogBrowserSummary(
  state: LogBrowserState,
): LogBrowserSummary {
  return {
    activeFilter: describeQuery(state.activeRequest.query),
    activeFilterCaption:
      state.activeForm.mode === "simple" ? "Keyword mode" : "Raw LogsQL mode",
    timeWindow: describeTimeSelection(state.activeForm),
    timeWindowCaption: "Applied via VictoriaLogs start/end parameters",
    returnedRows: String(state.logs.length),
    returnedRowsCaption: state.loading
      ? "Refreshing current query"
      : state.hasMore
        ? "More rows available"
        : "Fully loaded",
  };
}

export function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "AbortError";
}

export function toRequestErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Failed to load logs.";
}

function submitSearch(
  state: LogBrowserState,
  form: SearchFormState,
): LogBrowserState {
  try {
    const request = buildLogsRequest(form, PAGE_SIZE);

    return issueFetch(
      state,
      request,
      {
        activeForm: form,
        hasMore: false,
        expandedKey: null,
        requestError: null,
        searchError: null,
      },
    );
  } catch (reason: unknown) {
    return {
      ...state,
      searchError:
        reason instanceof Error ? reason.message : "Invalid search form.",
    };
  }
}

function issueFetch(
  state: LogBrowserState,
  request: LogsRequest,
  overrides: Partial<
    Pick<
      LogBrowserState,
      "activeForm" | "expandedKey" | "hasMore" | "requestError" | "searchError"
    >
  > = {},
): LogBrowserState {
  const requestId = state.lastIssuedRequestId + 1;

  return {
    ...state,
    ...overrides,
    activeRequest: request,
    loading: true,
    inFlightRequestId: requestId,
    lastIssuedRequestId: requestId,
    pendingEffect: {
      type: "fetchLogs",
      requestId,
      request,
    },
  };
}

function buildLogsRequest(form: SearchFormState, limit: number): LogsRequest {
  return {
    ...buildLogsQuery(form),
    limit,
  };
}
