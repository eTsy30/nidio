# CHECK — статус рефакторинга

Основание: [PROJECT AUDIT](PROJECT-AUDIT.md) и [ROADMAP](ROADMAP.md).
Обновлено: 2026-09-10.

| Этап                           | Статус | Результат                                                                              |
| ------------------------------ | :----: | -------------------------------------------------------------------------------------- |
| 0 — Воспроизводимые проверки   |  [x]   | Scripts, Prisma generation, Turbo/PWA cache, CI и runtime smoke подтверждены           |
| 1 — Авторизация чата           |  [x]   | Доступ к edit/delete/reply/reactions ограничен автором и workspace для REST/WS         |
| 2 — JWT lifecycle              |  [x]   | Access/refresh разделены, refresh rotation атомарна, WebSocket принимает только access |
| 3 — Валидация REST/WS и upload |  [x]   | DTO, upload limit/signature, origin allowlist и rate limits добавлены                  |
| 4 — Frontend session           |  [x]   | Coordinator refresh, Query profile и межвкладочная сессия подтверждены                 |
| 5 — Контракты и API            |  [x]   | REST contracts профиля, auth и couple подтверждены                                     |
| 6 — State management           |  [x]   | Общий server cache, invalidation и URL state Todo/Calendar                             |
| 7 — FSD                        |  [x]   | Границы `app → screens → widgets → features → shared` проверяются в lint, без entities |
| 8 — Календарь                  |  [x]   | UTC recurrence engine, bounded reads, widget model и единый modal state готовы         |
| 9 — Чат: offline/reconnect     |  [x]   | dedupe, acknowledgement, retry, merge HTTP/WS и reconnect подтверждены                 |
| 10 — Todo                      |  [x]   | DnD model/mutations, rollback/cancel и keyboard drag подтверждены                      |
| 11 — Push                      |  [x]   | Production service worker activation и Push delivery подтверждены                      |
| 12 — Design System             |  [x]   | Shared Dialog, route states, browser zoom и основные формы унифицированы               |
| 13 — Cleanup/performance       |  [x]   | Неиспользуемые файлы и старый PWA-пакет удалены; production build подтверждён          |
| 14 — Release readiness         |  [ ]   | Не начат                                                                               |

## Этап 11 — закрыт

- Push работает через production service worker; development-режим намеренно не регистрирует service worker, чтобы избежать несоответствия PWA chunks.
- `getPushRegistration` ожидает activation до пяти секунд и объясняет требование production-сборки вместо ложного сообщения об ошибке.
- Пользователь подтвердил Chat/Calendar/Todo push в production-режиме 2026-09-10. API push, calendar scheduler и overdue tests прошли: 37 tests.

## Этап 12 — реализация

- Убрано отключение browser zoom из Next viewport.
- `TemplatePicker` переведён с самописного fixed overlay на общий Base UI Dialog с focus trap, Escape и возвратом фокуса.
- В итоге основные ручные модалки и route-level состояния переведены на общий механизм ниже.

## Этап 12 — закрыт

- Browser zoom разрешён: viewport больше не ограничивает `maximumScale` и `userScalable`.
- Template picker, редактирование задачи и редактирование календарного события используют один Base UI Dialog. Общий компонент обеспечивает focus trap, Escape, backdrop и возврат фокуса.
- Добавлены `app/loading.tsx`, `app/error.tsx` с retry и `app/global-error.tsx`, поэтому route-level сбои и загрузка не превращаются в пустой экран.
- Существующие Input и Label продолжают создавать связку `label/htmlFor/id`; бизнес-формы и их валидация остались в features.

Проверки: web typecheck, architecture/lint и production build с Serwist — PASS, 0 errors / 4 существующих warnings; `git diff --check` — PASS.

Ручная проверка: на 320/375/768/1440 px открыть шаблоны, редактирование задачи и редактирование события; проверить Escape, Tab/Shift+Tab, click backdrop, длинную форму и системный zoom. Изменения не затрагивают API, задачи или календарные данные.

## Этап 13 — закрыт

- Удалены только файлы без входящих импортов: пустой `widgets/ui/EventCard`, дубли календарных и board types, неиспользуемый Avatar contract, старый параллельный список realtime events, `DeleteEventButton` и `AssigneeSelector`.
- Удалена неиспользуемая корневая зависимость `@ducanh2912/next-pwa` из `package.json` и lockfile. Serwist остаётся единственным PWA stack.
- Исправлены четыре lint warnings: два изображения переведены на `next/image`, пустые screen barrels заменены корректными re-export.
- Today/list UI и Prisma models сохранены: для них не подтверждён отказ от самостоятельного пользовательского сценария.
- TemplatePicker на mobile ограничен высотой выше нижней панели и safe area.

Проверки: `pnpm install --frozen-lockfile` — PASS; web typecheck, architecture/lint и production build с Serwist — PASS, 0 errors / 0 warnings; `git diff --check` — PASS.
Отдельный React profiler и bundle-анализ не запускались: после удаления кода и dependency не найдено измеренное узкое место, которое оправдывало бы функциональную оптимизацию.

## Этап 0 — закрыт

- Исправлены scripts, API entrypoint, Prisma generation, lint generated SW и Turbo outputs.
- CI выполняет install → generate → lint → typecheck → test → build.
- Проверены production build, PWA cache restore, отдельная PostgreSQL migration rehearsal и HTTP runtime smoke.
- Пользователь подтвердил работу приложения и успешный GitHub Actions job `ci`.

## Этап 7 — закрыт

- Выбранная структура: `app → screens → widgets → features → shared`; слой `entities` не используется по решению проекта.
- Общие wire-контракты вынесены в `shared/contracts`; feature не импортирует соседнюю feature.
- `AuthProvider` перенесён в `app/providers`, а `shared` хранит только auth context и transport-примитивы.
- Calendar feature больше не импортирует UI или model из calendar widget; widget использует feature UI в разрешённом направлении.
- Todo sheets получают `partnerId` от экрана, profile-card получает сохранение даты от экрана. Это убрало зависимости `together/profile → relationship`, сохранив поведение.
- `apps/web/scripts/check-architecture.mjs` проверяет алиас-импорты вверх по слоям и между feature-slices. Он запускается в `pnpm --filter web lint` и в CI.

Проверки: `pnpm --filter web typecheck` — PASS; `pnpm --filter web lint` — PASS, 0 errors / 4 существующих warnings; `pnpm --filter web build` — PASS, включая Serwist; `git diff --check` — PASS.

## Этап 8 — закрыт

- Добавлен единый `calendar/domain/recurrence.ts`: calendar read и push scheduler используют одинаковый UTC-расчёт следующего экземпляра.
- Тестами зафиксированы действующие правила: UTC-арифметика, DST для instant, overflow `31 января → 3 марта`, leap-day yearly и `NONE`.
- `CalendarService.findMany` использует SQL pre-filter: одноразовые события ограничены запрошенным диапазоном, recurring series отбираются только если серия может пересечь диапазон. Исключения и точные occurrences по-прежнему раскрываются сервисом.
- Семантика month-end и local wall-clock при DST пока не менялась: это отдельное продуктово-совместимое решение перед миграцией старых данных.
- Диапазон API календаря ограничен одним годом; UI month/week/year остаётся в этом диапазоне.
- `useCalendarEvents` отделяет GraphQL query/mutations от `CalendarWidget`; `useCalendarModal` заменяет независимые create/edit/delete boolean state на один discriminated union.

Проверки: `pnpm --filter api test -- calendar` — PASS, 26 tests / 4 suites; API typecheck/lint/build — PASS; web typecheck/lint/build — PASS; `git diff --check` — PASS. Web lint: 0 errors / 4 ранее известных warnings.

## Этап 9 — в работе

- Сервер сохраняет `clientId` при создании сообщения и возвращает уже созданное сообщение при повторной отправке тем же пользователем в том же workspace. Повтор не публикует второе событие в workspace.
- WebSocket подтверждает отправку с `messageId` в течение 10 секунд. Chat UI создаёт локальное сообщение со статусом `sending`; успешное подтверждение переводит его в `sent`, а таймаут или ошибка — в `error` с кнопкой повторной отправки через тот же `clientId`.
- Загрузка REST и сообщения WebSocket объединяются по ID и `clientId`, а не заменяют массив целиком. Поэтому поздний ответ `/chat/messages` не удаляет новое сообщение.
- После reconnect UI заново загружает последние сообщения. Статусы доставки монотонны: `delivered` больше не может перезаписать `read`.
- Удаление реакции теперь передаёт `userId`, поэтому исчезает только реакция конкретного участника, а не все реакции с тем же emoji. Typing автоматически скрывается через 4 секунды, если событие stop потеряно.

Проверки текущего блока: API `chat-access` — PASS, 41 test; web typecheck и architecture/lint — PASS, 0 errors / 4 существующих warnings; `git diff --check` — PASS.

Пользователь подтвердил browser-проверку отправки, повторной отправки и reconnect 2026-09-10. Текущий чат по продуктовой модели загружает последние 20 сообщений; cursor pagination остаётся отдельной задачей при появлении требования к истории.

## Этап 10 — в работе

- Правила вычисления позиции задачи и оптимистического переноса доски вынесены из `BoardView` в чистый `model/board-dnd.ts`.
- Pointer, touch и keyboard DnD используют одну функцию `getTaskMove`; это исключает расхождение порядка при разных способах перетаскивания.
- Optimistic cache update использует `applyTaskMove` без мутации данных TanStack Query. При ошибке API сохраняется существующий rollback на исходную доску.
- Добавлен `KeyboardSensor` и `sortableKeyboardCoordinates`; отмена перетаскивания очищает overlay без запроса к API.
- Мутации перемещения задач и колонок вынесены в `model/use-board-mutations.ts`. UI больше не содержит optimistic cache и rollback-код; все Todo mutations по-прежнему используют `retry: false` и `togetherKeys.all` invalidation.
- `TaskCard`, Create/EditTaskSheet остаются единственным активным представлением и формами задач. Неиспользуемые `TodayView`, `TodayBanner` и `TaskList` не удалены: для них не подтверждён отказ от отдельного Today/list сценария.

Проверки: web typecheck, architecture/lint и production build — PASS, 0 errors / 4 существующих warnings; API typecheck/lint — PASS; Tasks/Overdue/assignment unit tests — PASS, 23 tests. `git diff --check` — PASS.

Для закрытия этапа нужна browser-проверка: создание/редактирование/удаление, обычная задача и BOTH, nudge, drag внутри/между колонками, Escape и keyboard DnD. Интеграционный `todo.integration.ts` не запускался: он требует отдельную PostgreSQL через `TODO_TEST_DATABASE_URL`, а рабочая база для него не используется.

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

## Этап 4 — закрыт

### Что изменено

- Единственный `session-coordinator` выполняет refresh для AuthProvider, Axios и Apollo через общий Promise.
- `401/403` завершает сессию; ошибки сети/5xx не удаляют access-token и не разлогинивают пользователя.
- Profile хранится в TanStack Query; AuthProvider больше не содержит отдельный React state с пользователем.
- Logout и истечение сессии очищают TanStack Query и Apollo через `clearStore`, без `resetStore` и повторных персональных запросов.
- Две вкладки используют `navigator.locks` и `BroadcastChannel`: новая сессия или logout синхронизируются между вкладками.
- Guards используют `isAuthenticated`, поэтому загрузка profile не создаёт ложный redirect после успешного login/refresh.

### Файлы

| FILE                                                     | CHANGES                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| apps/web/shared/api/session/session-coordinator.ts       | Single-flight refresh, offline/expired distinction, межвкладочная координация |
| apps/web/shared/api/interceptors/response.interceptor.ts | Axios повторяет 401 только через coordinator                                  |
| apps/web/shared/lib/apollo-client.ts                     | Apollo повторяет один раз через coordinator                                   |
| apps/web/shared/api/provider/auth-provider.tsx           | Query-backed profile, единый logout и lifecycle                               |
| apps/web/features/auth/api/auth.api.ts                   | Refresh/logout делегированы coordinator                                       |
| apps/web/shared/router/guards/{AuthGuard,GuestGuard}.tsx | Проверяют `isAuthenticated`                                                   |

### Автоматические проверки

- `pnpm --filter web typecheck` — PASS.
- `pnpm --filter web lint` — PASS, 0 errors; 5 ранее известных warnings вне этапа.
- `pnpm --filter web build` — PASS, включая production Serwist service worker.
- `git diff --check` — PASS.

### Проверка в браузере

1. Войти, обновить страницу и открыть chat/calendar/together/profile: сессия и профиль сохраняются.
2. В двух вкладках одного браузера обновить защищённую страницу одновременно: обе остаются авторизованными.
3. Выйти в первой вкладке: вторая возвращается на `/login`; после нового входа не видны данные прежней сессии.
4. Отключить сеть, обновить уже авторизованную вкладку, затем вернуть сеть: временный сбой не должен сам разлогинить пользователя.

Пользователь подтвердил browser-проверку 2026-09-10: login/reload, две вкладки, logout и offline/recovery работают.

## Этап 5 — закрыт

### Что изменено

- `/users/me` и `PATCH /users/me` документированы точным `UserMeDto`: только профиль, без relationship и `updatedAt`.
- Auth REST responses документированы как `{ accessToken }`; refresh-token остаётся только в HttpOnly cookie.
- `GET /relationship/couple` типизирован как `CurrentCoupleResponse | null`.
- Frontend перестал читать несуществующий `user.relationship`; шапка, чат, overlay и Todo получают партнёра только из couple query.
- Добавлены unit-tests контрактов auth response и profile select.

### Файлы

| FILE                                                  | CHANGES                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| apps/api/src/users/dto/user-me.dto.ts                 | Точный Swagger DTO профиля                           |
| apps/api/src/{users,auth,relationship}/*controller.ts | Response contracts для REST                          |
| apps/api/src/auth/dto/auth.dto.ts                     | Только access-token в JSON                           |
| apps/web/features/auth/model/auth.types.ts            | Честные `AuthResponse` и `User`                      |
| apps/web/features/relationship/{api,hook}/            | Nullable couple contract                             |
| apps/web/screens, apps/web/widgets/chat               | Используют couple как единственный источник партнёра |
| apps/api/src/{auth,users}/*.spec.ts                   | Регрессии HTTP-contract                              |

### Автоматические проверки

- `pnpm --filter api test` — PASS: 112 tests / 14 suites.
- `pnpm --filter api typecheck` и `pnpm --filter web typecheck` — PASS.
- `pnpm --filter api lint` — PASS; `pnpm --filter web lint` — 0 errors, 5 прежних warnings.
- `pnpm --filter api build` и `pnpm --filter web build` — PASS.
- `git diff --check` — PASS.

### Нужна проверка в браузере

1. В паре проверить имя и аватар партнёра в главной, чате и Todo.
2. Без пары открыть главную, чат, Todo и профиль: нет ошибки, показывается приглашение.
3. Отредактировать профиль и обновить страницу: имя, аватар и email сохраняются.

Пользователь подтвердил проверку и перешёл к этапу 6 2026-09-10.

## Этап 6 — State management: в работе

- `useMe` больше не принудительно запрашивает `/users/me` на каждом focus: AuthProvider и экраны используют один Query cache.
- Todo filter хранится в URL: `/together?filter=me`, `partner`, `together` или `rotate`; значение `all` URL не засоряет.
- Некорректное значение filter безопасно становится `all`; Back/Forward и ссылка восстанавливают фильтр.

Проверка первого шага: `pnpm --filter web typecheck` — PASS; ESLint без ошибок, 5 прежних warnings.

### Завершение

- Profile и couple используют Query cache; profile update обновляет cache сразу, invite/accept/update/leave инвалидируют связанные couple/invite keys.
- Повторы мутаций выключены по умолчанию: потеря ответа не создаёт повторную запись автоматически.
- Todo filter и calendar scope/view/date отражаются в URL; формы и модалки не попадают в URL.
- Проверки: web typecheck, lint, production build и `git diff --check` — PASS.
