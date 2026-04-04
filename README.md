# agw-o11y

Observability workspace for AgentGateway built around Vector and the VictoriaMetrics stack, with a small web UI for browsing VictoriaLogs access logs.

## Architecture

- AgentGateway proxy on `127.0.0.1:18009`
- OTLP ingress: Vector on `127.0.0.1:14317` (gRPC) and `127.0.0.1:14318` (HTTP)
- Logs backend: VictoriaLogs
- Metrics backend: VictoriaMetrics
- Traces backend: VictoriaTraces
- Web UI: React SPA served by a small Go proxy on `127.0.0.1:3000`

The data path is:

```text
AgentGateway -> Vector -> VictoriaLogs / VictoriaMetrics / VictoriaTraces
                                      \
                                       -> Web UI proxy -> browser
```

Queries can go directly to the native Victoria backends, or through the bundled web UI for access-log browsing.

## Features

- Compose-managed AgentGateway wired to Vector and the Victoria backends
- OTLP ingress through Vector for access logs and traces
- Prometheus scrape from Vector into VictoriaMetrics for AgentGateway runtime metrics
- Native Victoria backends for all three signals
- PromQL-compatible API via VictoriaMetrics
- Tempo / TraceQL-compatible query API via VictoriaTraces
- Native LogsQL query API via VictoriaLogs
- Web UI for access-log search, pagination, and inline structured event inspection
- Go proxy that converts VictoriaLogs NDJSON responses into browser-friendly JSON
- Single AgentGateway config used directly by Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run the stack

```bash
docker compose up -d
```

This now starts:

- `agentgateway` on `127.0.0.1:18009`
- `vector` on `127.0.0.1:14317` and `127.0.0.1:14318`
- `victoria-logs` on `127.0.0.1:9428`
- `victoria-metrics` on `127.0.0.1:9090`
- `victoria-traces` on `127.0.0.1:3200`
- `web` on `127.0.0.1:3000`

## Access

### OTLP ingress

- Vector OTLP gRPC: `127.0.0.1:14317`
- Vector OTLP HTTP: `127.0.0.1:14318`

### AgentGateway

- Gateway listener: `http://127.0.0.1:18009`
- Admin UI / admin API: `http://127.0.0.1:15000`
- Prometheus metrics: `http://127.0.0.1:15020/metrics`

The AgentGateway container still listens on port `8009` internally. If your host
environment allows that port to be published directly, you can restore the old
mapping with `AGW_GATEWAY_HOST_PORT=8009 docker compose up -d`.

### Web UI

- Access logs UI: `http://127.0.0.1:3000`
- Query API proxy: `GET /api/logs/query`
- Supports simple keyword search, raw LogsQL, preset/custom time ranges, and inline detail panels

### Native Victoria endpoints

- VictoriaLogs UI and LogsQL API: `http://127.0.0.1:9428`
- VictoriaMetrics UI and PromQL API: `http://127.0.0.1:9090`
- VictoriaTraces UI and Tempo-compatible API: `http://127.0.0.1:3200`

## Files

- `agentgateway.yaml` - AgentGateway configuration used by Docker Compose
- `docker-compose.yaml` - local AgentGateway + Vector + Victoria stack, including the web UI
- `vector.yaml` - Vector OTLP and Prometheus routing config
- `web/` - React + Vite+ frontend, Go proxy server, and container build for the access logs UI

## Web Development

### Frontend

```bash
cd web
npm install
npm run dev
```

Vite+ runs the dev server on `http://127.0.0.1:5173` by default.
Use this for frontend iteration only. For end-to-end log queries, run the bundled `web` service with Docker so `/api/logs/query` is available on the same origin.

### Production build

```bash
cd web
npm install
npm run build
```

### Backend tests

The Go proxy is built in Docker as part of `docker compose build web`. If you want to run the backend tests without a host Go toolchain, use:

```bash
docker run --rm \
  -v "$PWD/web/server:/src" \
  -w /src \
  golang:1.24-alpine \
  /bin/sh -lc '/usr/local/go/bin/go test ./...'
```

## License

MIT License - see [LICENSE](LICENSE)
