# Frontend — Danetka

Клиентское веб-приложение для работы с данетками: авторизация, каталог загадок, случайная данетка и панель парсера для администратора.

## Стек

- React
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- React Router

## Локальный запуск

```bash
npm install
npm run dev
```

API по умолчанию проксируется на `http://localhost:8000` (см. `vite.config.ts`). Для production задайте `VITE_API_GATEWAY_URL` в `.env.production`.

## Сборка

```bash
npm run build
```

Статика собирается в `dist/` и отдаётся через Nginx в Docker-образе сервиса.
