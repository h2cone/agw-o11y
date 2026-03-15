import { startTransition, useEffect, useReducer } from "react";
import { fetchLogs } from "../api/logs";
import {
  createInitialLogBrowserState,
  isAbortError,
  type LogBrowserSummary,
  reduceLogBrowserState,
  selectLogBrowserSummary,
  toRequestErrorMessage,
} from "../logs/browser";
import type { LogEntry, SearchFormState } from "../types/log";

interface UseLogBrowserState {
  logs: LogEntry[];
  loading: boolean;
  requestError: string | null;
  searchError: string | null;
  hasMore: boolean;
  expandedKey: string | null;
  summary: LogBrowserSummary;
  submitSearch: (form: SearchFormState) => void;
  loadMore: () => void;
  toggleExpanded: (key: string) => void;
}

export function useLogBrowser(): UseLogBrowserState {
  const [state, dispatch] = useReducer(
    reduceLogBrowserState,
    undefined,
    createInitialLogBrowserState,
  );
  const pendingRequestId = state.pendingEffect?.requestId;

  useEffect(() => {
    const effect = state.pendingEffect;

    if (!effect) {
      return;
    }

    const controller = new AbortController();

    fetchLogs(effect.request, controller.signal)
      .then((response) => {
        dispatch({
          type: "requestSucceeded",
          requestId: effect.requestId,
          response,
        });
      })
      .catch((reason: unknown) => {
        if (isAbortError(reason)) {
          return;
        }

        dispatch({
          type: "requestFailed",
          requestId: effect.requestId,
          error: toRequestErrorMessage(reason),
        });
      });

    return () => {
      controller.abort();
    };
  }, [pendingRequestId]);

  return {
    logs: state.logs,
    loading: state.loading,
    requestError: state.requestError,
    searchError: state.searchError,
    hasMore: state.hasMore,
    expandedKey: state.expandedKey,
    summary: selectLogBrowserSummary(state),
    submitSearch: (form) => {
      startTransition(() => {
        dispatch({ type: "searchSubmitted", form });
      });
    },
    loadMore: () => {
      startTransition(() => {
        dispatch({ type: "loadMoreRequested" });
      });
    },
    toggleExpanded: (key) => {
      dispatch({ type: "toggleExpanded", key });
    },
  };
}
