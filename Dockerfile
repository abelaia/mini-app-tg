FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.27-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend /server ./server
COPY --from=frontend /app/dist ./public
COPY backend/data/schedule.json ./data/schedule.json
ENV APP_ENV=prod STATIC_DIR=/app/public SCHEDULE_PATH=/app/data/schedule.json
EXPOSE 8080
CMD ["./server"]
