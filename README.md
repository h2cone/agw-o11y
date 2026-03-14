# agw-o11y

Observability workspace for AgentGateway built around Vector and the VictoriaMetrics stack.

## Architecture

- AgentGateway proxy on `127.0.0.1:8009`
- OTLP ingress: Vector on `127.0.0.1:14317` (gRPC) and `127.0.0.1:14318` (HTTP)
- Logs backend: VictoriaLogs
- Metrics backend: VictoriaMetrics
- Traces backend: VictoriaTraces

The data path is:

```text
AgentGateway -> Vector -> VictoriaLogs / VictoriaMetrics / VictoriaTraces
```

Queries go directly to the native Victoria backends.

## Features

- Compose-managed AgentGateway wired to Vector and the Victoria backends
- OTLP ingress through Vector for access logs and traces
- Prometheus scrape from Vector into VictoriaMetrics for AgentGateway runtime metrics
- Native Victoria backends for all three signals
- PromQL-compatible API via VictoriaMetrics
- Tempo / TraceQL-compatible query API via VictoriaTraces
- Native LogsQL query API via VictoriaLogs
- Single AgentGateway config used directly by Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run the stack

```bash
docker compose up -d
```

This now starts:

- `agentgateway` on `127.0.0.1:8009`
- `vector` on `127.0.0.1:14317` and `127.0.0.1:14318`
- `victoria-logs` on `127.0.0.1:9428`
- `victoria-metrics` on `127.0.0.1:9090`
- `victoria-traces` on `127.0.0.1:3200`

## Access

### OTLP ingress

- Vector OTLP gRPC: `127.0.0.1:14317`
- Vector OTLP HTTP: `127.0.0.1:14318`

### AgentGateway

- Gateway listener: `http://127.0.0.1:8009`
- Admin UI / admin API: `http://127.0.0.1:15000`
- Prometheus metrics: `http://127.0.0.1:15020/metrics`

### Native Victoria endpoints

- VictoriaLogs UI and LogsQL API: `http://127.0.0.1:9428`
  - Query: `GET /select/logsql/query`
  - Stats: `GET /select/logsql/stats_query`
  - Range stats: `GET /select/logsql/stats_query_range`
- VictoriaMetrics UI and PromQL API: `http://127.0.0.1:9090`
  - Instant query: `GET /api/v1/query`
  - Range query: `GET /api/v1/query_range`
- VictoriaTraces UI and Tempo-compatible API: `http://127.0.0.1:3200`
  - Search: `GET|POST /select/tempo/api/search`
  - Tags: `GET /select/tempo/api/v2/search/tags`
  - Trace by id: `GET /select/tempo/api/v2/traces/<trace_id>`

## Query Examples

```bash
# LogsQL: list recent AgentGateway access logs
curl -G --data-urlencode 'query=*' \
  http://127.0.0.1:9428/select/logsql/query

# PromQL: verify AgentGateway metrics landed in VictoriaMetrics
curl -G --data-urlencode 'query=agentgateway_tokio_num_workers' \
  http://127.0.0.1:9090/api/v1/query

# TraceQL / Tempo search: list recent traces
curl -G --data-urlencode 'q={}' \
  http://127.0.0.1:3200/select/tempo/api/search

# TraceQL filter example
curl -G --data-urlencode 'q={ span.http.method = "GET" }' \
  http://127.0.0.1:3200/select/tempo/api/search
```

## Files

- `agentgateway.yaml` - AgentGateway configuration used by Docker Compose
- `docker-compose.yaml` - local AgentGateway + Vector + Victoria stack
- `vector.yaml` - Vector OTLP and Prometheus routing config

## License

MIT License - see [LICENSE](LICENSE)
