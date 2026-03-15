# Web UI Plan for VictoriaLogs Access Logs

## Context

The agw-o11y project provides observability for AgentGateway (an LLM API gateway). Logs flow through: AgentGateway → Vector → VictoriaLogs. Rich structured fields are already being captured (provider, model, tokens, request/response bodies). Currently there is no way to browse these logs without directly calling the VictoriaLogs API. We need a minimal, focused Web UI to browse and search access logs.

## Technology Choices

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS 4 |
| Backend proxy | Go (net/http) |
| Deployment | Multi-stage Dockerfile, added to docker-compose.yaml |
| UI language | English |

## Directory Structure

```
web/
├── server/                  # Go backend proxy
│   ├── main.go
│   ├── go.mod
│   └── go.sum
├── src/                     # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css            # Tailwind directives
│   ├── api/
│   │   └── logs.ts          # API client for backend proxy
│   ├── components/
│   │   ├── Layout.tsx        # App shell: header + main content
│   │   ├── SearchBar.tsx     # Time range + keyword + LogsQL toggle
│   │   ├── LogList.tsx       # Log entries table/list
│   │   ├── LogRow.tsx        # Single log summary row
│   │   ├── LogDetail.tsx     # Expandable detail panel
│   │   └── LoadMoreButton.tsx
│   ├── hooks/
│   │   └── useLogs.ts       # Data fetching + pagination state
│   └── types/
│       └── log.ts           # TypeScript interfaces
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js       # If needed beyond CSS config
├── Dockerfile               # Multi-stage: build frontend, serve with Go
└── .dockerignore
```

## Go Backend Proxy (`web/server/`)

A minimal HTTP server with two responsibilities: serve the React SPA static files and proxy API requests to VictoriaLogs.

### Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/logs/query` | Proxy to VictoriaLogs `/select/logsql/query` |
| GET | `/*` | Serve React SPA static files (with index.html fallback) |

### `main.go` Key Logic

```go
// - Read VICTORIA_LOGS_URL env var (default "http://victoria-logs:9428")
// - /api/logs/query → forward query params (query, limit) to VictoriaLogs
//   - Read NDJSON response from VictoriaLogs
//   - Convert to JSON array and return to frontend
// - /* → serve static files from ./dist, fallback to index.html for SPA routing
// - No external dependencies (stdlib only)
```

### Query Proxy Detail

The `/api/logs/query` handler:
1. Receives `query`, `limit` params from the frontend
2. Forwards to `${VICTORIA_LOGS_URL}/select/logsql/query?query=${query}&limit=${limit}`
3. Reads the NDJSON response line-by-line
4. Wraps into a JSON array: `{ "logs": [...], "count": N }`
5. Returns with `Content-Type: application/json`

## React Frontend

### Pages / Views

**Single-page app with two states:**

1. **List View** (default) — Search bar at top, log entries below, "Load More" at bottom
2. **Detail View** — Clicking a row expands an inline detail panel (not a separate page)

### Component Design

**`Layout.tsx`**
- App header with title "Access Logs"
- Main content area

**`SearchBar.tsx`**
- Time range selector: preset buttons (5m, 15m, 1h, 6h, 24h, 7d) + custom range picker
- Keyword input field (free text)
- Toggle switch: "Simple" ↔ "LogsQL" mode
  - Simple mode: combines time range + keywords into a LogsQL query automatically
  - LogsQL mode: shows a single textarea for raw LogsQL input
- Search button

**`LogList.tsx`**
- Renders a list of `LogRow` components
- Handles empty state ("No logs found")

**`LogRow.tsx`**
- Compact summary row showing:
  - `_time` — formatted timestamp (e.g., "2026-03-15 14:32:05")
  - `llm.provider` — provider badge (e.g., "Anthropic" / "OpenAI")
  - `llm.request.model` — model name
  - `llm.is_streaming` — streaming indicator
  - `llm.usage.prompt_tokens` — input tokens
  - `llm.usage.completion_tokens` — output tokens
  - `llm.usage.total_tokens` — total tokens
- Click to expand `LogDetail`

**`LogDetail.tsx`**
- Expanded panel below the clicked row
- Shows all fields including:
  - `llm.response.model`
  - `llm.request.body` — formatted JSON (collapsible)
  - `llm.response.body` — formatted JSON (collapsible)
  - Any other fields from the log entry
- Close button to collapse

**`LoadMoreButton.tsx`**
- "Load More" button at list bottom
- Fetches next page by increasing limit or using time cursor

### State Management

Use React hooks only (no Redux/Zustand). Core state in `useLogs.ts`:

```typescript
interface UseLogsState {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// useLogs(query, limit) → { logs, loading, error, hasMore, loadMore, search }
```

### Pagination Strategy

VictoriaLogs doesn't have cursor-based pagination. Strategy:
- Initial load: `limit=50`
- "Load More": increase limit by 50, re-query with `limit=100`, `limit=150`, etc.
- Use the oldest `_time` from current results to set a time bound for the next query to avoid duplicates

### API Client (`api/logs.ts`)

```typescript
// fetchLogs(query: string, limit: number): Promise<LogEntry[]>
// Calls GET /api/logs/query?query=...&limit=...
// Default query: "_time:1h | sort by (_time) desc" to get recent logs
```

### TypeScript Types (`types/log.ts`)

```typescript
interface LogEntry {
  _time: string;
  _msg: string;
  "llm.provider"?: string;
  "llm.request.model"?: string;
  "llm.response.model"?: string;
  "llm.usage.prompt_tokens"?: string;
  "llm.usage.completion_tokens"?: string;
  "llm.usage.total_tokens"?: string;
  "llm.is_streaming"?: string;
  "llm.request.body"?: string;
  "llm.response.body"?: string;
  [key: string]: string | undefined;  // Other dynamic fields
}
```

## Docker Setup

### `web/Dockerfile` (multi-stage)

```dockerfile
# Stage 1: Build React app
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Go server
FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY server/ .
RUN go build -o server .

# Stage 3: Final image
FROM alpine:3.21
COPY --from=backend /app/server /usr/local/bin/server
COPY --from=frontend /app/dist /srv/dist
ENV VICTORIA_LOGS_URL=http://victoria-logs:9428
EXPOSE 3000
CMD ["server"]
```

### docker-compose.yaml Addition

```yaml
  web:
    build: ./web
    container_name: agw-web
    ports:
      - "127.0.0.1:${AGW_WEB_HOST_PORT:-3000}:3000"
    environment:
      - VICTORIA_LOGS_URL=http://victoria-logs:9428
    depends_on:
      - victoria-logs
```

## Files to Modify

| File | Change |
|------|--------|
| `docker-compose.yaml` | Add `web` service |
| `web/**` | All new files (directory does not exist yet) |

## Implementation Order

1. Scaffold `web/` directory with Vite + React + TypeScript + Tailwind
2. Create TypeScript types and API client
3. Build components: Layout → SearchBar → LogRow → LogList → LogDetail → LoadMoreButton
4. Wire up `useLogs` hook and connect components
5. Write Go backend proxy (`web/server/main.go`)
6. Create `web/Dockerfile`
7. Add `web` service to `docker-compose.yaml`

## Verification

1. `cd web && npm install && npm run dev` — frontend dev server starts
2. `cd web/server && go run main.go` — Go proxy starts, proxies to localhost:9428
3. `docker compose up --build web` — container builds and runs
4. Open `http://localhost:3000` — see log list with recent entries
5. Test search: enter a keyword, select time range, verify results
6. Test LogsQL mode: enter raw query like `_time:5m`, verify results
7. Test "Load More": verify additional logs are appended
8. Test detail view: click a row, verify all fields display correctly
