FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY server/ ./server/
WORKDIR /app/server
RUN go build -o /tmp/server .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
COPY --from=backend /tmp/server /usr/local/bin/server
COPY --from=frontend /app/dist /srv/dist
ENV PORT=3000
ENV STATIC_DIR=/srv/dist
ENV VICTORIA_LOGS_URL=http://victoria-logs:9428
EXPOSE 3000
CMD ["server"]
