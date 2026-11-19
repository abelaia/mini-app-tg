# TürkDiziOnline · Telegram Mini App

Расписание онлайн-переводов турецких сериалов и напоминания от бота перед эфиром.

**Стек:** Vue 3, Pinia, Vite, SCSS · Go, PostgreSQL, Telegram Bot API

## Что нужно установить

| Что                                                                                                     | Версия | Зачем                          |
| ------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| [Go](https://go.dev/dl/)                                                                                | 1.27+  | бэкенд                         |
| [Node.js](https://nodejs.org/)                                                                          | 22+    | фронтенд                       |
| [PostgreSQL](https://www.postgresql.org/download/)                                                      | 17     | база данных                    |
| [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | любая  | только для проверки в Telegram |

Команды ниже — для Git Bash на Windows. Если PostgreSQL стоит в другой папке, поправь путь в `PG=...`.

## Быстрый запуск (без Telegram)

Так приложение открывается в обычном браузере. В режиме `APP_ENV=dev` бэкенд пускает без Telegram — от имени тестового пользователя `DEV_USER_ID`.

### 1. База данных (один раз)

Отдельная учебная база прямо в папке `backend/.pgdata` на порту **5433**: пароль не нужен и она не мешает основному PostgreSQL.

```bash
cd backend
PG="/c/Program Files/PostgreSQL/17/bin"
"$PG/initdb.exe" -D .pgdata -U postgres -A trust -E UTF8 --locale=C
"$PG/pg_ctl.exe" -D .pgdata -o "-p 5433" -l .pgdata/server.log start
"$PG/createdb.exe" -h localhost -p 5433 -U postgres turkdizi
```

Таблицы создавать не нужно: бэкенд сам применяет миграции из `internal/storage/migrations` при старте.

### 2. Бэкенд

```bash
cd backend
cp .env.example .env
go run ./cmd/server
```

В `.env.example` уже прописана учебная база. Должно появиться `server started addr=:8080`. Проверка: http://localhost:8080/api/health → `{"status":"ok"}`.

Предупреждение `BOT_TOKEN is empty` — нормально: без токена всё работает, кроме бота и уведомлений.

### 3. Фронтенд

Во втором терминале:

```bash
cd frontend
npm install
npm run dev
```

Открой http://localhost:5173. Запросы `/api` Vite сам перенаправляет на бэкенд `:8080`.

## Запуск в Telegram

Mini App открывается только по HTTPS, поэтому локальный сервер выставляется наружу через туннель.

1. Создай бота у [@BotFather](https://t.me/BotFather) командой `/newbot` и скопируй токен.
2. Собери фронтенд — бэкенд будет раздавать его сам, тогда хватит одного туннеля:
    ```bash
    cd frontend && npm run build
    ```
3. Запусти туннель в отдельном терминале и скопируй адрес вида `https://....trycloudflare.com`:
    ```bash
    cloudflared tunnel --url http://localhost:8080
    ```
4. Заполни `backend/.env`:
    ```
    BOT_TOKEN=токен_от_BotFather
    WEBAPP_URL=https://....trycloudflare.com
    STATIC_DIR=../frontend/dist
    ```
5. Перезапусти бэкенд (`go run ./cmd/server`), открой бота в Telegram и нажми `/start` → «Открыть».

Адрес `trycloudflare.com` меняется при каждом запуске туннеля — после перезапуска обнови `WEBAPP_URL` и перезапусти бэкенд.

## Переменные окружения

Все лежат в `backend/.env` (файл не попадает в git), образец — `backend/.env.example`.

| Переменная        | По умолчанию         | Что это                                                                                                                          |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`         | `prod`               | `dev` — пускает без Telegram от имени `DEV_USER_ID` и не требует `BOT_TOKEN`                                                     |
| `HTTP_ADDR`       | `:8080`              | адрес сервера (или `PORT`, как на Render)                                                                                        |
| `DATABASE_URL`    | —                    | **обязательно**, строка подключения к PostgreSQL                                                                                 |
| `BOT_TOKEN`       | —                    | токен бота; в `prod` обязателен                                                                                                  |
| `WEBAPP_URL`      | —                    | HTTPS-адрес мини-приложения для кнопки «Открыть»                                                                                 |
| `SCHEDULE_PATH`   | `data/schedule.json` | расписание сериалов                                                                                                              |
| `STATIC_DIR`      | —                    | папка собранного фронтенда, если раздавать его с бэкенда                                                                         |
| `ALLOWED_ORIGINS` | —                    | откуда разрешены запросы (CORS), через запятую                                                                                   |
| `INIT_DATA_TTL`   | `24h`                | сколько живёт подпись Telegram                                                                                                   |
| `REMIND_BEFORE`   | `10m`                | за сколько до эфира присылать напоминание                                                                                        |
| `BOT_MODE`        | `auto`               | `auto` - вебхук, если задан `WEBAPP_URL`, иначе long polling; можно явно `webhook` или `polling`                                 |
| `DEV_USER_ID`     | `0`                  | тестовый пользователь для `APP_ENV=dev`                                                                                          |
| `ADMIN_IDS`       | —                    | Telegram user id админов через запятую; у них в мини-приложении вкладка «Админ». В `dev` при пустом списке берётся `DEV_USER_ID` |

## Тесты

```bash
cd backend
go test ./...
```

Для тестов базы поднимать не нужно: они запускают свой временный PostgreSQL (при первом запуске скачивают его, это ~1 минута).

## Остановить и снова запустить базу

```bash
cd backend
"/c/Program Files/PostgreSQL/17/bin/pg_ctl.exe" -D .pgdata stop
"/c/Program Files/PostgreSQL/17/bin/pg_ctl.exe" -D .pgdata -o "-p 5433" -l .pgdata/server.log start
```

После перезагрузки компьютера база сама не стартует — выполни вторую команду.

## Docker и деплой

```bash
docker build -t turkdizi .
docker run -d -p 8080:8080 -e DATABASE_URL=... -e BOT_TOKEN=... -e WEBAPP_URL=https://... turkdizi
```

Образ собирает фронтенд и бэкенд вместе и сразу раздаёт приложение на `:8080`. Для [Render](https://render.com) есть готовый `render.yaml`: `DATABASE_URL`, `BOT_TOKEN`, `WEBAPP_URL` и `ADMIN_IDS` задаются в панели Render.

### Админка

Расписание и баннер-анонс хранятся в PostgreSQL (не в файле на диске Render). Открой мини-приложение под Telegram-аккаунтом из `ADMIN_IDS` — появится вкладка «Админ». Там можно править день, время, переводчика, площадку, выключать сериал и менять текст анонса. Обычные зрители эту вкладку не видят: доступ проверяется по подписи Telegram `initData`.

**Локально вкладка есть только если крутится бэкенд** (`go run ./cmd/server`) с `APP_ENV=dev`, `DEV_USER_ID=1`, `ADMIN_IDS=1`. Один `npm run dev` недостаточен: `/api/session` не отвечает, и права админа не приходят. В Vite для удобства включён `VITE_DEV_ADMIN=1` (файл `frontend/.env.development`) — вкладка видна даже без API, но сохранение заработает только с бэкендом и Postgres.
