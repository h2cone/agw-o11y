# Repository Guidelines

## Project Structure & Module Organization
Root-level YAML files define the local observability stack: `agentgateway.yaml`, `vector.yaml`, and `docker-compose.yaml`. Product notes live in `docs/`. The web app is under `web/`: `web/src/` contains the React/Vite frontend, split into `components/`, `hooks/`, `api/`, `logs/`, and `types/`. The Go proxy lives in `web/server/` and serves the built SPA plus `/api/logs/query`. Treat `web/dist/` and `web/node_modules/` as generated output; do not edit or commit changes there.

## Build, Test, and Development Commands
Use `docker compose up -d` from the repository root to start AgentGateway, Vector, VictoriaLogs, VictoriaMetrics, VictoriaTraces, and the bundled web service. For UI work against logs only, run `docker compose up -d victoria-logs web`. Frontend development uses Vite: `cd web && npm install && npm run dev` starts the app on `127.0.0.1:5173`. Build production assets with `cd web && npm run build`, which runs `tsc` and `vite build`. Run frontend tests with `cd web && npm test`. Rebuild the containerized UI with `docker compose build web`. To test the Go proxy without a host Go toolchain, run `docker run --rm -v "$PWD/web/server:/src" -w /src golang:1.24-alpine /bin/sh -lc '/usr/local/go/bin/go test ./...'`.

## Coding Style & Naming Conventions
TypeScript is compiled in `strict` mode. Match the existing frontend style: 2-space indentation, semicolons, `PascalCase` component files such as `LogList.tsx`, `use...` hook names, and lower-case domain modules under `web/src/logs/`. Keep React code functional and colocate helpers near the feature they support. Go files should remain `gofmt`-formatted; use descriptive lower_snake file names like `logs_query.go`.

## Testing Guidelines
Frontend tests use Vitest and live next to the logic they cover as `*.test.ts`, for example `web/src/logs/browser.test.ts`. Go tests use the standard `*_test.go` pattern in `web/server/`. Add or update tests whenever you change query parsing, pagination, log presentation, or static asset routing.

## Commit & Pull Request Guidelines
Follow the existing commit style: short, imperative, sentence-case subjects such as `Replace observability stack with Vector and Victoria backends`. Keep commits focused so config, frontend, and Go proxy changes can be reviewed independently when practical. Pull requests should explain the operational or user-visible impact, list the commands you ran, link related issues, and include screenshots for `web/src/` UI changes. Call out port, container, or telemetry-pipeline changes explicitly.
