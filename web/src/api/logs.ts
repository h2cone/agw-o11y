import type { LogsRequest, LogsResponse } from "../types/log";

export async function fetchLogs(
  request: LogsRequest,
  signal?: AbortSignal,
): Promise<LogsResponse> {
  const params = new URLSearchParams({
    query: request.query,
    limit: String(request.limit),
  });

  if (request.start) {
    params.set("start", request.start);
  }
  if (request.end) {
    params.set("end", request.end);
  }

  const response = await fetch(`/api/logs/query?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `VictoriaLogs query failed with status ${response.status}.`);
  }

  return (await response.json()) as LogsResponse;
}
