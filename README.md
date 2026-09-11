# Nidio

Приложение для пар: чат, совместные задачи и календарь.

## Локальный запуск

Нужны Node.js 24, pnpm 11.15.1 и запущенный Docker Desktop. Все команды выполняются из корня проекта.

```bash
pnpm install --frozen-lockfile
pnpm db:up
```

Создайте `apps/api/.env.development`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nidio
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/nidio
JWT_SECRET=local-development-secret-change-before-production
FRONTEND_URL=http://localhost:3000
API_PUBLIC_URL=http://localhost:4000
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minio
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=nidio
```

Для отправки писем дополнительно задайте `GMAIL_USER` и `GMAIL_APP_PASSWORD` (пароль приложения Gmail). Без них отправка писем не работает, при старте API будет сообщение об ошибке SMTP.

Создайте `apps/web/.env.development.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_REALTIME_URL=http://localhost:4000
```

Если уже есть `apps/web/.env.local`, проверьте, что в нём нет конфликтующих адресов API.

После запуска PostgreSQL и MinIO подготовьте базу и запустите приложение:

```bash
pnpm --filter api db:deploy
pnpm --filter api db:seed:templates
pnpm dev
```

Приложение: http://localhost:3000. API: http://localhost:4000. Консоль MinIO: http://localhost:9001 (`minio` / `minioadmin`).

Для остановки приложения нажмите `Ctrl+C`, для остановки PostgreSQL и MinIO выполните `pnpm db:down`.
