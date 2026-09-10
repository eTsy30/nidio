# CHECK — статус рефакторинга

Основание: [PROJECT AUDIT](PROJECT-AUDIT.md) и [ROADMAP](ROADMAP.md).
Обновлено: 2026-09-10.

| Этап                           | Статус | Результат                                                                              |
| ------------------------------ | :----: | -------------------------------------------------------------------------------------- |
| 0 — Воспроизводимые проверки   |  [x]   | Scripts, Prisma generation, Turbo/PWA cache, CI и runtime smoke подтверждены           |
| 1 — Авторизация чата           |  [x]   | Доступ к edit/delete/reply/reactions ограничен автором и workspace для REST/WS         |
| 2 — JWT lifecycle              |  [x]   | Access/refresh разделены, refresh rotation атомарна, WebSocket принимает только access |
| 3 — Валидация REST/WS и upload |  [x]   | DTO, upload limit/signature, origin allowlist и rate limits добавлены                  |
| 4 — Frontend session           |  [ ]   | Не начат                                                                               |
| 5 — Контракты и API            |  [ ]   | Не начат                                                                               |
| 6 — State management           |  [ ]   | Не начат                                                                               |
| 7 — FSD                        |  [ ]   | Не начат                                                                               |
| 8 — Календарь                  |  [ ]   | Не начат                                                                               |
| 9 — Чат: offline/reconnect     |  [ ]   | Не начат                                                                               |
| 10 — Todo                      |  [ ]   | Не начат                                                                               |
| 11 — Push                      |  [ ]   | Не начат                                                                               |
| 12 — Design System             |  [ ]   | Не начат                                                                               |
| 13 — Cleanup/performance       |  [ ]   | Не начат                                                                               |
| 14 — Release readiness         |  [ ]   | Не начат                                                                               |

## Этап 0 — закрыт

- Исправлены scripts, API entrypoint, Prisma generation, lint generated SW и Turbo outputs.
- CI выполняет install → generate → lint → typecheck → test → build.
- Проверены production build, PWA cache restore, отдельная PostgreSQL migration rehearsal и HTTP runtime smoke.
- Пользователь подтвердил работу приложения и успешный GitHub Actions job `ci`.

## Этап 1 — закрыт

### Что защищено

- Редактирование и удаление: только автор сообщения в текущем workspace.
- Reply: только на существующее, неудалённое сообщение текущего workspace.
- Реакции: только на сообщение текущего workspace; удалить можно только собственную реакцию по существующему unique key.
- REST передаёт actorId из авторизации; WebSocket проверяет пользователя до вызова мутации.
- Недоступное сообщение возвращает 404, не раскрывая принадлежность сообщения другой паре.

### Файлы

| FILE                                      | CHANGES                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| apps/api/src/chat/chat-access.policy.ts   | Общая политика доступа к сообщению и проверка автора                               |
| apps/api/src/chat/chat.repository.ts      | Scoped query: id + workspaceId + deletedAt; scoped update/delete                   |
| apps/api/src/chat/chat.service.ts         | Policy используется для всех опасных операций                                      |
| apps/api/src/chat/chat.controller.ts      | Передаёт actorId в edit/delete                                                     |
| apps/api/src/realtime/realtime.gateway.ts | Проверяет пользователя до edit/delete                                              |
| apps/api/src/chat/chat-access.spec.ts     | Unit-проверки REST/WS и отказов                                                    |
| apps/api/test/chat-access.integration.ts  | PostgreSQL integration: две независимые пары                                       |
| apps/api/prisma.config.ts                 | `PRISMA_DATABASE_URL` имеет наивысший приоритет для изолированных migration-тестов |

### Проверки этапа 1

- `pnpm --filter api test` — PASS: 95 tests / 7 suites.
- `pnpm exec turbo run typecheck lint build --filter=api` — PASS: 4 tasks.
- `PRISMA_DATABASE_URL=... prisma migrate deploy` — PASS на новой `chat_access_test`.
- `CHAT_ACCESS_TEST_DATABASE_URL=... pnpm --filter api test:chat-access:integration` — PASS.
- Integration-тест создаёт две пары и проверяет разрешённые действия партнёра и запреты для другой пары через controller и gateway. После теста записи и временный PostgreSQL удалены.

Ограничение: integration-тест вызывает controller/gateway напрямую; реальный Socket.IO handshake, JWT purpose и WS DTO относятся к этапам 2–3. UI чата не менялся.

## Следующий этап

**Этап 4 — Frontend session.**

## Этап 2 — закрыт

### Что изменено

- Access token всегда содержит `type: "access"`.
- Refresh token всегда содержит `type: "refresh"` и уникальный `jti`.
- REST guard, refresh endpoint и WebSocket handshake отклоняют токен неправильного назначения.
- WebSocket отключается при истечении access token и не принимает последующие события.
- `RefreshToken.jti` уникален; refresh получает сессию по `jti`, а не перебирает все сессии пользователя.
- Ротация удаляет старую и создаёт новую сессию в одной транзакции. Повторное конкурентное использование одного refresh token отклоняется.

### Файлы

| FILE                                                                        | CHANGES                                                  |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| apps/api/prisma/schema.prisma                                               | Обязательное уникальное поле `RefreshToken.jti`          |
| apps/api/prisma/migrations/20260910010000_refresh_token_jti/migration.sql   | Backfill `jti` для существующих строк и unique index     |
| apps/api/src/auth/services/token.service.ts                                 | Выпуск и проверка typed access/refresh tokens            |
| apps/api/src/auth/services/session.service.ts                               | Поиск по `jti` и атомарная `rotate`                      |
| apps/api/src/auth/auth.service.ts                                           | Безопасная refresh-ротация                               |
| apps/api/src/auth/strategies/jwt.strategies.ts                              | REST принимает только access token                       |
| apps/api/src/realtime/realtime.gateway.ts                                   | WS принимает только access token и отключается по expiry |
| apps/api/src/auth/**/*.spec.ts, apps/api/src/realtime/realtime-auth.spec.ts | Регрессионные unit-тесты                                 |
| apps/api/test/auth-refresh.integration.ts                                   | PostgreSQL integration для конкурентного refresh         |

### Проверки этапа 2

- `pnpm --filter api test` — PASS: 103 tests / 10 suites.
- `pnpm exec turbo run typecheck lint build --filter=api` — PASS: 4 tasks.
- Новая временная PostgreSQL `auth_refresh_test`: 24 migrations applied — PASS.
- `AUTH_REFRESH_TEST_DATABASE_URL=... pnpm --filter api test:auth-refresh:integration` — PASS: из двух одновременных refresh успешен ровно один; остаётся одна новая сессия с новым `jti`.

### Deployment

Перед запуском новой API версии применить migration:

```bash
NODE_ENV=production pnpm --filter api db:deploy
```

Затем развернуть API. Старые access и refresh token намеренно больше не принимаются: пользователям потребуется войти заново. Новая migration не применялась к рабочей базе в ходе рефакторинга.

## Этап 3 — закрыт

### Что изменено

- REST `GET /chat/messages` принимает `limit` только от 1 до 100; `cursor` ограничен по длине.
- Перемещение Todo использует DTO: `columnId` обязателен, `order` — конечное целое число от 0 до 1 000 000.
- Все chat WebSocket payload получают DTO с whitelist и запретом неизвестных полей; read batch ограничен 100 ID.
- WebSocket `chat:send` теперь получает `clientId` и `type: "TEXT"`, как REST контракт.
- Upload ограничен Multer до выделения большого buffer; проверяется реальная сигнатура JPEG/PNG/WebP и соответствие MIME.
- REST и WebSocket принимают origin только из `FRONTEND_URL` (через запятую можно указать несколько адресов). Запросы без Origin допускаются для server-to-server.
- HTTP limits: login 10/15 мин, register 5/час, reset 5/15 мин, refresh 30/мин, chat REST 60/мин. WebSocket: 60 событий/мин на сокет.

### Файлы

| FILE                                                               | CHANGES                                           |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| apps/api/src/chat/dto/{ws-chat,chat-messages-query}.dto.ts         | DTO WebSocket и пагинации                         |
| apps/api/src/tasks/dto/move-task.dto.ts                            | DTO DnD move                                      |
| apps/api/src/storage/storage.controller.ts                         | Streaming file-size limit и magic-byte validation |
| apps/api/src/config/origin.ts                                      | Общая origin allowlist                            |
| apps/api/src/main.ts                                               | REST CORS и rate limits                           |
| apps/api/src/realtime/realtime.gateway.ts                          | WS origin, payload validation и event limit       |
| apps/web/widgets/chat/model/useSendMessage.ts                      | Полный WS send contract                           |
| apps/web/shared/realtime/types/events.ts                           | Типизированный send payload                       |
| apps/api/src/{input-validation,storage/storage.controller}.spec.ts | Проверки DTO, origin и image signature            |

### Проверки этапа 3

- `pnpm --filter api test` — PASS: 110 tests / 12 suites.
- `pnpm exec turbo run typecheck lint build --filter=api` — PASS: 4 tasks.
- `pnpm --filter web typecheck` — PASS.
- `git diff --check` — PASS.

После deployment проверить: отправку сообщения через чат, upload JPG/PNG/WebP до `UPLOAD_MAX_IMAGE_SIZE_MB`, а также значение `FRONTEND_URL`. Если есть несколько frontend-доменов, перечислить их через запятую без пробелов в production env. HTTP rate limit хранится в памяти процесса, WS limit — в памяти сокета; для нескольких API-инстансов глобальный distributed limit остаётся отдельной инфраструктурной задачей.
