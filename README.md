niDio

niDio — PWA-приложение для пар.
Проект объединяет общение, совместное пространство и инструменты для совместной жизни.

⸻

Технологии

Frontend Backend Инфраструктура
Next.js 16 NestJS pnpm workspace
React 19 TypeScript Turborepo
TypeScript Prisma ORM Docker
Tailwind CSS PostgreSQL
Feature-Sliced Design JWT authentication
TanStack Query Socket.IO realtime
React Hook Form + Zod

⸻

Возможности

Реализовано В разработке
Регистрация и авторизация Чат между пользователями
JWT access/refresh токены Совместные задачи
Работа с httpOnly cookies Заметки
Email подтверждение Уведомления
Система приглашений PWA offline режим
Создание пары через invite-ссылку
Создание общего workspace
Prisma-модели пользователей, отношений и сообщений
Подготовка realtime-инфраструктуры

⸻

Запуск проекта

1. Установить необходимые программы

Перед запуском нужно установить:

- Node.js 22+
- pnpm
- Docker Desktop

Проверить установку:

node -v
pnpm -v
docker -v

⸻

2. Скачать проект

Клонировать репозиторий:

git clone https://github.com/eTsy30/nidio.git

Перейти в папку проекта:

cd nidio

⸻

3. Установить зависимости

В папке проекта выполнить:

pnpm install

Команда установит все необходимые библиотеки для frontend и backend.

⸻

4. Настроить переменные окружения

Создать два файла:

apps/api/.env.development
apps/web/.env.development

Backend:

apps/api/.env.development

Добавить:

NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nidio"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/nidio"
JWT_SECRET="your_secret"
FRONTEND_URL="http://localhost:3000"
GMAIL_USER="your_email"
GMAIL_APP_PASSWORD="your_password"

Frontend:

apps/web/.env.development

Добавить:

NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_REALTIME_URL="http://localhost:3001"

⸻

5. Запустить базу данных

Запустить Docker:

pnpm db:up

После этого PostgreSQL будет работать локально.

⸻

6. Подготовить базу данных

Перейти в backend:

cd apps/api

Создать Prisma Client:

pnpm db:generate

Применить миграции:

pnpm db:migrate

Вернуться в корень проекта:

cd ../..

⸻

7. Запустить приложение

В корне проекта выполнить:

pnpm dev

После запуска открыть:

Frontend:

http://localhost:3000

Backend:

http://localhost:3001

⸻

Основные команды

Команда Назначение
pnpm dev Запуск проекта
pnpm typecheck Проверка TypeScript
pnpm lint Проверка кода
pnpm format Форматирование
pnpm db:up Запуск PostgreSQL
pnpm db:down Остановка PostgreSQL
pnpm prisma:studio Открыть базу данных

⸻

Структура проекта

nidio
├── apps
│ ├── web # Frontend Next.js
│ └── api # Backend NestJS
│
├── docker # Docker конфигурация
├── packages # Общие пакеты
└── tooling # Настройки проекта

⸻

Статус

Проект находится в активной разработке.
