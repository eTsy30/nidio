# Nidio

Приложение для пар: совместные задачи и календарь.

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

## Проверка API и мониторинг Render

Публичный `GET /health` (также `HEAD /health`) отвечает `200` и `{"status":"ok"}` без авторизации. Ответ не кешируется. Это проверка доступности процесса API, без запросов к базе и внешним сервисам.

После деплоя настройте внешний HTTP-монитор:

- URL: `https://<имя-api-сервиса>.onrender.com/health` — именно API, не сайт на Vercel.
- Метод: `GET`, интервал: 5 минут, ожидаемый статус: `200`.
- Для проверки уже заснувшего сервиса учитывайте холодный старт около минуты.
- В Render → Settings → Health Checks укажите `/health` для проверки состояния при деплое. Это отдельная настройка, не замена внешнему мониторингу.

Free-сервис засыпает после 15 минут без входящего трафика. Регулярные внешние запросы поддерживают активность, но не отменяют перезапуски и ограничения тарифа: 750 часов в месяц на workspace, суммарно для всех бесплатных сервисов. См. [Render Free](https://render.com/docs/free) и [Health Checks](https://render.com/docs/health-checks). Мониторинг и настройки Render не включаются автоматически этим изменением кода.

Удаление чата: новая миграция `20261017000000_remove_chat` удаляет историю сообщений и связанные таблицы. Сохраните резервную копию нужных данных перед её применением. Исторические миграции сохранены; миграция не запускается автоматически при разработке, но применяется командой `db:deploy` (в том числе при `start:render`).
