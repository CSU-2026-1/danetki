# Генератор Данеток

Система автоматически парсит реальные истории из интернета, с помощью ИИ разбивает их на открытую и закрытую части и выдаёт пользователю готовые данетки.

## Сервисы

| Сервис | Язык | Порт gRPC | Описание |
|---|---|---|---|
| API Gateway | Go | 8000 (HTTP, внутри сети) | REST API, проксирует gRPC |
| Auth Service | C# | 50051 | Регистрация, логин, JWT |
| Puzzle Service | C# | 50052 | Хранение и выдача данеток |
| AI Worker | C# | — | Обработка историй через LLM |
| Parser Service | Python | 50053 | Парсинг сайтов |

## Быстрый старт

### 1. Клонировать репозиторий
```bash
git clone https://github.com/your-org/danetka.git
cd danetka
```

### 2. Создать .env файл
```bash
cp .env.example .env
# Открыть .env и указать ROUTER_AI_KEY
```

### 3. Сгенерировать gRPC код из контрактов
```bash
# Go (Gateway)
cd services/gateway
protoc --go_out=. --go-grpc_out=. ../../contracts/*.proto

# C# (Auth, Puzzle, AI Worker)
# dotnet-grpc автоматически читает .proto при сборке

# Python (Parser)
cd services/parser-service
python -m grpc_tools.protoc -I../../contracts --python_out=. --grpc_python_out=. ../../contracts/*.proto
```

### 4. Запустить всё
```bash
docker compose up --build
```

Для балансировки Gateway на двух репликах:
```bash
docker compose up -d --build --scale gateway=2
```

## Адреса после запуска

| Сервис | Адрес |
|---|---|
| Приложение и API | http://localhost |
| REST API | http://localhost/api/v1 |

Nginx на порту **80** — единая точка входа: фронтенд и API Gateway.

## API

Базовый префикс: `/api/v1`

### Авторизация
```
POST /api/v1/auth/register   { "email": "...", "password": "...", "username": "..." }
POST /api/v1/auth/login      { "email": "...", "password": "..." }
```

### Данетки
```
GET /api/v1/puzzles?page=1&page_size=10
```

### Парсинг (требуется JWT и роль Admin)
```
POST /api/v1/parser/start    { "limit": 10, "source_url": "https://..." }
GET  /api/v1/parser/status?job_id=...
```

## Структура репозитория

```
danetka/
├── contracts/              # gRPC .proto и Kafka JSON-схемы
│   ├── auth.proto
│   ├── puzzle.proto
│   ├── parser.proto
│   └── kafka/
│       └── story.raw.json
├── services/
│   ├── gateway/            # Go
│   ├── auth-service/       # C#
│   ├── puzzle-service/     # C#
│   ├── ai-worker/          # C#
│   └── parser-service/     # Python
├── infra/
│   ├── nginx/
│   └── postgres/
│       └── init.sql
├── frontend/               # React SPA
├── docs/
│   └── architecture.txt
├── docker-compose.yml
├── .env.example
└── README.md
```

## Переменные окружения

Основные переменные описаны в `docker-compose.yml` и `.env.example`. Для локальной разработки создайте `.env`:

```env
LLM_PROVIDER=routerai
ROUTER_AI_KEY=sk-...
```
