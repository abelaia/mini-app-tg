# TürkDiziOnline · Telegram Mini App

Расписание онлайн-переводов турецких сериалов и напоминания от бота перед эфиром.

**Стек:** Vue 3, Pinia, Vite, SCSS · Go, PostgreSQL, Telegram Bot API

## Запуск

```bash
cd backend && cp .env.example .env && go run ./cmd/server
```

```bash
cd frontend && npm install && npm run dev
```

## Docker

```bash
docker build -t turkdizi .
docker run -d -p 8080:8080 -e DATABASE_URL=... -e BOT_TOKEN=... -e WEBAPP_URL=https://... turkdizi
```
