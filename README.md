# agw-o11y

Observability setup for AgentGateway using OpenTelemetry, Prometheus, Loki, Tempo, and Grafana.

## Features

- AgentGateway config with tracing and access-log enrichment
- OpenTelemetry Collector for receiving OTLP logs and traces
- Tempo backend for trace storage
- Loki backend for log storage
- Prometheus scraping for AgentGateway and collector metrics
- Docker Compose stack for local observability services

## Getting Started

### Prerequisites

- Docker and Docker Compose
- An AgentGateway instance exposing metrics on `host.docker.internal:15020`
- AgentGateway configured to send tracing data to `localhost:14317`

### Run the observability stack

```bash
docker compose -f docker-compose.observability.yaml up -d
```

The observability services do not set a Docker restart policy, so they stay stopped after Docker Desktop restarts until you start them again explicitly.

The collector binds host ports `14317` and `14318` by default because `4317` and `4318` are commonly reserved or left in a bad state by Docker Desktop port forwarding. Override them if needed:

```bash
AGW_OTLP_GRPC_HOST_PORT=4317 AGW_OTLP_HTTP_HOST_PORT=4318 docker compose -f docker-compose.observability.yaml up -d
```

### Files

- `config.yaml` — sample AgentGateway configuration with tracing and access-log fields
- `docker-compose.observability.yaml` — local observability stack
- `observability/otel-collector.yaml` — OTLP receiver and exporters
- `observability/prometheus.yaml` — Prometheus scrape config
- `observability/loki.yaml` — Loki config
- `observability/tempo.yaml` — Tempo config

### Access services

- Grafana: http://127.0.0.1:3001
- Prometheus: http://127.0.0.1:9090
- Loki: http://127.0.0.1:3100
- Tempo: http://127.0.0.1:3200

## License

MIT License — see [LICENSE](LICENSE)
