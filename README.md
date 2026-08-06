# 💞 niDio

**niDio** — PWA-приложение для пар.  
Объединяет общение, совместное пространство и инструменты для совместной жизни.

---

# 🚀 Технологии

## Frontend

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)

- **Next.js 16** — React framework для frontend
- **React 19** — UI библиотека
- **TypeScript** — типизация
- **Tailwind CSS** — стилизация
- **TanStack Query** — управление серверным состоянием

---

## Backend

![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?logo=jsonwebtokens)

- **NestJS** — backend framework
- **Prisma ORM** — работа с базой данных
- **PostgreSQL** — основная база данных
- **Socket.IO** — realtime коммуникация
- **JWT** — аутентификация

---

## Инфраструктура

![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

- **Turborepo** — monorepo управление
- **pnpm** — пакетный менеджер
- **Docker** — локальная инфраструктура

---

# ✨ Возможности

| Реализовано                            | В разработке         |
| -------------------------------------- | -------------------- |
| ✅ Регистрация и авторизация           | 🔄 Совместные задачи |
| ✅ JWT access / refresh токены         | 🔄 Заметки           |
| ✅ httpOnly cookies                    | 🔄 Push-уведомления  |
| ✅ Email подтверждение                 |                      |
| ✅ Система приглашений (invite-ссылка) |                      |
| ✅ Создание пары и общего workspace    |                      |
| ✅ Чат между пользователями (realtime) |                      |
| ✅ PWA offline-режим                   |                      |
| ✅ Prisma-модели + миграции            |                      |

---

# 🏁 Быстрый старт

## 1. Требования

Перед запуском необходимо установить:

- **Node.js** `>= 22`
- **pnpm** `>= 9`
- **Docker Desktop**

Проверить установку:

```bash
node -v
pnpm -v
docker -v
```

Пример:

```bash
node -v   # v22.x
pnpm -v   # 9.x
docker -v # 24.x
```

---

# 📦 Установка проекта

## 2. Клонирование репозитория

```bash
git clone https://github.com/eTsy30/nidio.git
```

Перейти в директорию проекта:

```bash
cd nidio
```

---

## 3. Установка зависимостей

В корне проекта выполнить:

```bash
pnpm install
```

Команда установит все необходимые зависимости frontend и backend.

---

# ⚙️ Настройка окружения

Создать два файла:

```
apps/api/.env.development
apps/web/.env.development
```

---

## Backend

Файл:

```
apps/api/.env.development
```

Добавить:

```env
NODE_ENV=development

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nidio"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/nidio"

JWT_SECRET="your_secret"

FRONTEND_URL="http://localhost:3000"

GMAIL_USER="your_email"
GMAIL_APP_PASSWORD="your_password"
```

---

## Frontend

Файл:

```
apps/web/.env.development
```

Добавить:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_REALTIME_URL="http://localhost:3001"
```

---

# 🐘 Запуск базы данных

Запустить Docker Desktop.

Для запуска PostgreSQL:

```bash
pnpm db:up
```

После этого база данных будет доступна локально.

---

# 🗄 Подготовка базы данных

Перейти в backend:

```bash
cd apps/api
```

---

## Создание Prisma Client

```bash
pnpm db:generate
```

---

## Если база уже существует

⚠️ Команда удалит все локальные данные:

```bash
npx prisma migrate reset
```

Применить миграции:

```bash
pnpm db:migrate
```

Перегенерировать Prisma Client:

```bash
pnpm db:generate
```

---

## Если проект чистый

Выполнить:

```bash
pnpm db:migrate
```

---

Вернуться в корень проекта:

```bash
cd ../..
```

---

# ▶️ Запуск приложения

В корне проекта:

```bash
pnpm dev
```

После запуска:

Frontend:

```
http://localhost:3000
```

Backend:

```
http://localhost:3001
```

---

# 🛠 Основные команды

| Команда              | Назначение             |
| -------------------- | ---------------------- |
| `pnpm dev`           | Запуск проекта         |
| `pnpm typecheck`     | Проверка TypeScript    |
| `pnpm lint`          | Проверка качества кода |
| `pnpm format`        | Форматирование проекта |
| `pnpm db:up`         | Запуск PostgreSQL      |
| `pnpm db:down`       | Остановка PostgreSQL   |
| `pnpm prisma:studio` | Открыть Prisma Studio  |

---

# 📁 Структура проекта

```text
nidio
├── apps
│   ├── web                 # Frontend Next.js
│   └── api                 # Backend NestJS
│
├── docker                  # Docker конфигурация
├── packages                # Общие пакеты
└── tooling                 # Настройки проекта
```

---

# 📌 Статус

Проект находится в активной разработке.
