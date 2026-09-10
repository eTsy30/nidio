# ROADMAP рефакторинга Nidio

Дата: 2026-09-10. Основание: [PROJECT AUDIT](PROJECT-AUDIT.md).

Текущее выполнение: [CHECK.md](CHECK.md). Этап 0 закрыт 2026-09-10: локальные проверки выполнены, пользователь подтвердил работу приложения и успешный job `ci`. Удалённый CI-лог агентом не просмотрен.

Этапы 0–8 закрыты. Текущий этап: **9 — Надёжность чата и reconnect**. Актуальные результаты фиксируются в CHECK.md; исторический аудит сохраняется как исходная точка.

## Правила выполнения

1. Работаем только над одним небольшим шагом текущего этапа.
2. До изменения показываем проблему, риск, решение и конкретные файлы.
3. После изменения показываем diff и FILE / OLD / NEW / CHANGES / REASON / BENEFIT.
4. Запускаем подходящие проверки и ждём проверки пользователя перед следующим изменением.
5. Этап 1 не начинается, пока Этап 0 не закрыт. Обнаруженные блокеры фиксируем отдельно; не расширяем текущий шаг молча.
6. Файлы читаем непосредственно из workspace. Повторная ручная отправка не требуется.
7. Не меняем продуктовые правила, существующие URL, поведение BOTH, правила push и календарные даты без отдельного решения.
8. До удаления приводим DELETE / REASON / RISK / BENEFIT. Неиспользуемые представления и Prisma-модели не удаляем только по отсутствию импортов.

Сложность: **S** — локальная правка; **M** — несколько связанных модулей; **L** — сквозной сценарий с контрактами и регрессионными тестами. Это оценка объёма и риска, не обещание срока.

## Порядок этапов

| Этап | Название                                | Сложность | Зависит от | Статус   |
| ---- | --------------------------------------- | --------- | ---------- | -------- |
| 0    | Воспроизводимые проверки                | M         | —          | Закрыт   |
| 1    | Авторизация чата                        | M         | 0          | Закрыт   |
| 2    | JWT lifecycle                           | L         | 1          | Закрыт   |
| 3    | Валидация и ограничения входящих данных | M         | 2          | Закрыт   |
| 4    | Единый frontend session lifecycle       | L         | 2–3        | Закрыт   |
| 5    | Контракты и API слой                    | M         | 4          | Закрыт   |
| 6    | State management                        | M         | 5          | Закрыт   |
| 7    | FSD структура и границы импортов        | L         | 5–6        | Закрыт   |
| 8    | Календарь и recurring events            | L         | 7          | Закрыт   |
| 9    | Надёжность чата и reconnect             | L         | 1–7        | Не начат |
| 10   | Todo и DnD                              | L         | 6–7        | Не начат |
| 11   | Push pipeline                           | L         | 8–10       | Не начат |
| 12   | UI Design System и доступность          | M–L       | 7–10       | Не начат |
| 13   | Очистка и performance                   | M–L       | 11–12      | Не начат |
| 14   | Итоговая регрессия и release readiness  | L         | 0–13       | Не начат |

Таблица задаёт порядок выполнения. Зависимости показывают технические предпосылки; они не разрешают автоматически начинать несколько этапов. Тесты пишутся и выполняются в каждом этапе, а не только в этапе 14. Эта нумерация уточняет крупные блоки исходного аудита; при выполнении используем её.

## Этап 0 — Воспроизводимые проверки

**Цель:** получить воспроизводимую исходную точку без изменения архитектуры и бизнес-логики.

### STAGE 0 AUDIT: актуальные конфигурации

Прочитаны: корневые package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, eslint.config.mjs, tooling/eslint/base.mjs, .github/workflows/ci.yml; API package.json, nest-cli.json, tsconfig.json, tsconfig.build.json, prisma.config.ts; web package.json, tsconfig.json, next.config.ts.

| Файл                              | Проблема или необходимая проверка                                                            | Риск                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| package.json                      | Два scripts.dev, первый затенён; нет общей test-команды                                      | Неочевидная конфигурация и неполные проверки                                                                      |
| apps/web/package.json             | Нет typecheck; TypeScript не объявлен явно среди зависимостей приложения                     | Turbo пропускает web typecheck; зависимость от локального окружения                                               |
| apps/api/package.json             | Нет test-script; start указывает dist/main                                                   | Тесты не входят в стандартный pipeline; entrypoint не соответствует результату предыдущей сборки dist/src/main.js |
| eslint.config.mjs                 | Generated public/sw.js не исключён                                                           | Lint падает на артефакте, а не на исходнике                                                                       |
| turbo.json                        | outputs не включают public/sw.js и связанные артефакты; нет test task                        | Восстановленная сборка может не соответствовать SW; тесты не запускаются через общий pipeline                     |
| turbo.json                        | Нет явного шага Prisma generation в task dependencies; env inputs неполные                   | Чистая сборка зависит от ранее сгенерированного клиента; возможен неверный cache hit                              |
| .github/workflows/ci.yml          | Нет тестов; Prisma вызывается из root, где версия CLI отличается от API                      | CI не отражает локальные проверки; риск несовпадения генератора и клиента                                         |
| apps/api/prisma.config.ts         | Выбор env зависит от NODE_ENV и cwd; DIRECT_URL имеет приоритет                              | Неправильный cwd/окружение может выбрать другую БД                                                                |
| pnpm-workspace.yaml               | Workspace apps/*; native install scripts управляются allowBuilds                             | Сохранить ограничения; проверить чистую установку, не разрешать все scripts автоматически                         |
| apps/web/next.config.ts           | Serwist пишет в public/sw.js только в production                                             | Проверять PWA через build/start; dev не подтверждает работу production SW                                         |
| tsconfig.base.json, app tsconfigs | Strict уже включён; API rootDir=. влияет на выходные пути; web включает generated Next types | Не ослаблять проверки; подтвердить typecheck из чистого checkout                                                  |
| tooling/eslint/base.mjs           | Общие правила уже существуют                                                                 | Не менять архитектурные ограничения и стиль всего проекта в инфраструктурном шаге                                 |

### Маленькие шаги

**0.1 — scripts и entrypoint (S).**

FILE / OLD: package.json, apps/api/package.json, apps/web/package.json.

NEW: те же пути, без переносов.

REASON: общие команды должны проверять оба приложения и запускать существующий build output.

CHANGES: удалить только затенённый dev; добавить web typecheck и API test; исправить API start по фактической сборке. Явно определить TypeScript ownership и совместимую версию без массового обновления зависимостей. Если меняются зависимости — включить pnpm-lock.yaml в проверяемый diff.

BENEFIT: воспроизводимые команды вместо ручных исключений.

Проверка: package scripts, API build/output, оба typecheck, существующие Jest tests. Затем проверка пользователя.

**0.2 — lint generated files (S).**

FILE / OLD: eslint.config.mjs; при необходимости устаревший .eslintignore после чтения.

NEW: те же пути либо согласованное удаление устаревшего ignore-файла.

REASON: generated SW не является редактируемым исходным кодом.

CHANGES: узкие ignores для фактических Serwist outputs. Не исключать app/sw.ts, весь public или application source ради зелёного lint. Имеющиеся warnings зафиксировать; не отключать правила, скрывающие ошибки.

BENEFIT: одинаковый lint до и после сборки.

Проверка: lint исходников до/после production build. Затем проверка пользователя.

**0.3 — Prisma generation и migration workflow (M).**

FILE / OLD: apps/api/package.json, apps/api/prisma.config.ts, turbo.json, документация запуска.

NEW: те же пути; отдельная инструкция при необходимости.

REASON: генерация клиента и изменение базы — разные операции.

CHANGES: запускать Prisma CLI из API workspace; определить generation dependency перед build/typecheck/tests и безопасные cache outputs. Генерация клиента не должна зависеть от наличия production credentials. Зафиксировать dev migration и production deploy как разные команды. Не применять миграции к пользовательской БД в рамках проверки конфигурации.

BENEFIT: чистый checkout собирается; CI не изменяет production schema.

Проверка: generation из чистого состояния; prisma validate; миграции — только на отдельной тестовой базе. Затем проверка пользователя.

**0.4 — Turbo cache и PWA (M).**

FILE / OLD: turbo.json, apps/web/next.config.ts только если текущих настроек недостаточно.

NEW: те же пути.

REASON: .next и SW относятся к одной сборке.

CHANGES: учесть фактические SW outputs, убрать build cache из публикуемых outputs при необходимости; определить build env inputs и передачу env без вывода секретов. Добавить test task. Проверить, что ^build отражает реальные workspace dependencies, а не считать его автоматической генерацией Prisma.

BENEFIT: cache hit восстанавливает согласованную сборку.

Проверка: cache miss → cache hit; восстановление SW и chunks; смена public build env инвалидирует кеш. Не пересобирать рабочую директорию одновременно с работающим next start.

**0.5 — GitHub Actions (M).**

FILE / OLD: .github/workflows/ci.yml.

NEW: тот же путь.

REASON: CI должен воспроизводить локальный gate.

CHANGES: проверить совместимость выбранных Node/pnpm; frozen-lockfile install → Prisma generation → lint → typecheck → tests → build. Зафиксировать безопасное тестовое окружение. pnpm store cache не заменяет корректные build artifacts. Production migration не включать в PR workflow.

BENEFIT: pull request не проходит без проверок всего workspace.

Проверка: полный CI run из чистого checkout и повторный запуск с кешем. Затем проверка пользователя.

**0.6 — runtime и закрытие (M).**

Запустить production API/web на свободных портах с тестовым окружением; проверить entrypoint, загрузку маршрутов, GraphQL и SW/chunks. API startup может запускать scheduler: использовать отдельную БД и отключённую реальную push-доставку. Зафиксировать команды, версии, результаты и ограничения.

### Команды проверки

Текущие прямые команды из корня (не выполнялись при написании этого roadmap):

```bash
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma validate
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm --filter api exec jest --runInBand --watchman=false
pnpm lint
pnpm --filter api build
pnpm --filter web build
```

Целевой общий gate после добавления scripts/task dependencies:

```bash
pnpm install --frozen-lockfile
pnpm --filter api db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Runtime после исправления start и настройки тестового окружения, в отдельных терминалах:

```bash
pnpm --filter api start
pnpm --filter web start
```

Миграции: `pnpm --filter api db:migrate` — создание/применение в development; `NODE_ENV=production pnpm --filter api db:deploy` — только отдельный согласованный deploy workflow с явно выбранной БД. `db:push` не заменяет versioned migrations для release.

**Этап 0 закрыт, когда:** чистая установка, generation, lint, оба typecheck, tests, обе production builds и runtime smoke подтверждены; cache restore сохраняет SW; CI выполняет те же проверки. Непройденный или недоступный runtime не отмечается PASS.

## Этап 1 — Авторизация чата

**Цель / риск:** устранить изменение и раскрытие чужих сообщений. Разные transport paths не должны обходить permissions.

**Файлы:** apps/api/src/chat/chat.controller.ts, chat.service.ts, chat.repository.ts; realtime/realtime.gateway.ts; новые regression tests.

**Шаги:** сначала негативные тесты двух пар; затем общая access policy; actor/workspace в repository mutations; проверки reply/reactions; применение одинаковых правил в REST/WS. Права редактирования — автор, права чтения и реакций — участник текущего workspace.

**Проверка / выход:** разрешённые действия работают, другой workspace недоступен, отклонённый запрос ничего не меняет и не отправляет событие. Проверены отсутствующая сессия, удалённые сообщения, выход из пары. FSD и механизм сессии здесь не переписываются.

## Этап 2 — JWT lifecycle

**Цель / риск:** refresh не должен приниматься вместо access; rotating session должна выдерживать конкурентные запросы.

**Файлы:** apps/api/src/auth/services/token.service.ts, session.service.ts; auth.service.ts; strategies/jwt.strategies.ts; guards; realtime/realtime.gateway.ts; Prisma schema/migrations только при необходимости.

**Шаги:** 2.1 token-purpose validation REST/GraphQL/WS; 2.2 уникальный session/jti; 2.3 atomic consume/rotate; 2.4 политика expiry/logout для долгого WS соединения. Отдельно описать совместимость старых токенов и необходимость повторного входа.

**Проверка / выход:** access и refresh не взаимозаменяемы, подпись/expiry проверяются, два refresh не создают неконтролируемые сессии, сбой транзакции не оставляет частичную запись. Успешные login/reload/logout сохранены.

## Этап 3 — Валидация и ограничения

**Цель / риск:** не принимать произвольные WS payload и не буферизовать неограниченные загрузки.

**Файлы:** realtime gateway и DTO; chat DTO/controller; tasks DTO/controller; storage controller; auth endpoints и конфигурация ограничений.

**Шаги:** явная WS validation; согласованный message payload; ограничения pagination/move; upload size на входе и проверка формата; origin allowlist; ограничение частоты чувствительных auth/chat запросов. Согласовать численные лимиты и поведение ошибок до включения.

**Проверка / выход:** malformed/oversized payload отклоняется до бизнес-операции; допустимые сообщения и изображения продолжают работать; UI получает понятную ошибку.

## Этап 4 — Frontend session lifecycle

**Цель / риск:** убрать конкурирующие refresh и разлогинивание из-за offline.

**Файлы:** shared/api/provider/auth-provider.tsx, shared/api/interceptors/response.interceptor.ts, shared/lib/apollo-client.ts, shared/lib/token.ts, features/auth/api/auth.api.ts, realtime provider/socket.

**Шаги:** один coordinator для REST/GraphQL; ограниченный retry; разграничение network/401; logout без повторного чтения персональных данных; согласование WS reconnect. Межвкладочную конкуренцию проверять отдельно от single-flight одной вкладки.

**Проверка / выход:** параллельные 401, reload, offline/recovery, logout и две вкладки не создают refresh storm; кеш предыдущей сессии не виден новой.

## Этап 5 — Контракты и API слой

**Цель / риск:** типы должны отражать реальный response, а не скрывать отсутствующие поля.

**Файлы:** auth/relationship/profile types и API; UsersService/DTO; calendar GraphQL operations; shared transport/error utilities.

**Шаги:** честные User/Couple/AuthResponse, nullable couple; единая error normalization; типы GraphQL operations; разделение transport и доменных endpoints. Переиспользуемые HTTP utilities остаются shared; user/task/event endpoints относятся к бизнес-слоям.

**Проверка / выход:** contract tests для profile, couple=null, login и calendar mutations; TypeScript без маскирующих casts; UI не ожидает refreshToken в JSON.

## Этап 6 — State management

**Цель / риск:** исключить рассинхронизацию нескольких копий server state.

**Файлы:** AuthProvider/useMe, query keys/providers, relationship hooks, page composition и cache mutations.

**Шаги:** профиль и пара в server cache; modal/form drafts в React state; filter/scope/view в URL по согласованной UX-семантике; централизованная invalidation. Redux/Zustand не добавлять без отдельной потребности.

**Проверка / выход:** смена имени/аватара, пары и logout согласованы во всех представлениях; back/forward восстанавливает URL state; отсутствуют лишние циклы запросов.

## Этап 7 — FSD структура

**Цель / риск:** сделать направление зависимостей проверяемым и убрать циклы, сохранив маршруты.

**Слои:** app → pages → widgets → features → entities → shared. Запрещены вверх направленные импорты и прямые зависимости соседних feature slices.

**Файлы:** app entrypoints/providers, screens, widgets, features, будущие entities, aliases, ESLint и Serwist config.

**Шаги:** согласовать Next routing adapter; ввести entities user/couple/session; переносить по одному вертикальному сценарию; public API slices; архитектурный lint; удалить переходные re-exports после миграции потребителей.

**Важное решение:** логический FSD Pages обязателен; физическое имя `pages` нельзя вводить без проверки Next Pages Router discovery. Вариант из аудита — screens как физическое имя логического Pages. Если требуется буквальный pages, сначала отдельный routing/build smoke, затем утверждение структуры.

**Проверка / выход:** прежние URL, отсутствие новых случайных routes, отсутствие runtime import cycles и новых нарушений FSD; shared не знает бизнес-сценарии. Не объединять массовые перемещения с изменением бизнес-правил.

## Этап 8 — Календарь и recurrence

**Цель / риск:** bounded calendar reads и одинаковые расчёты UI/API/scheduler.

**Файлы:** calendar.service.ts, calendar-notification-time.ts, calendar-push.service.ts; CalendarWidget; event types/forms; новые domain tests.

**Шаги:** зафиксировать текущую семантику тестами; согласовать DST и month-end поведение; общий recurrence engine; SQL range predicates; выделить widget model и actions; объединить modal state.

**Проверка / выход:** DST, 31 января, 29 февраля, all-day, исключения, THIS/FOLLOWING/ALL, смена timezone и напоминаний. Старые расписания не меняются молча; миграция данных — отдельный проверяемый шаг.

## Этап 9 — Надёжность чата

**Цель / риск:** восстановление пропущенных сообщений и явный результат отправки.

**Файлы:** chat service/repository/DTO, gateway и event types; Chat/useLoadMessages/useChatRealtime/useSendMessage; message cache.

**Шаги:** typed protocol; clientId и dedupe; ack/timeout; cursor pagination; merge HTTP+WS; reconnect catch-up; монотонные receipts; reaction actorId; typing TTL; pending/failed/retry UI.

**Проверка / выход:** поздний HTTP не стирает новые сообщения; reconnect восстанавливает историю; повтор отправки не дублирует сообщение; delivered не заменяет read; удаляется только нужная реакция.

## Этап 10 — Todo и DnD

**Цель / риск:** отделить доску и действия от task entity без регрессии BOTH.

**Файлы:** BoardView, TaskCard, Create/EditTaskSheet, task/board API и hooks; TasksService при выделении use cases.

**Шаги:** task/board entities; task-board widget; pure move helpers; mutations отдельно от UI; rollback/cancel; keyboard DnD; единый task display. Определить судьбу Today/list view перед удалением.

**Проверка / выход:** создание/редактирование/удаление, BOTH concurrency, смена исполнителя, nudge и Overdue; drag cancel/rollback; mobile scroll. Polling/WS не добавляются; query refetch/invalidation сохраняются.

## Этап 11 — Push pipeline

**Цель / риск:** различать запись действия, попытку отправки, принятие провайдером и фактический показ.

**Файлы:** push.service.ts, calendar-push.service.ts, task-overdue.service.ts, nudge endpoint/hook; notification Prisma models при согласованном изменении.

**Шаги:** типизированный delivery result; безопасные диагностические события и metrics; retention; решение retry policy; transactional outbox только при требовании надёжного enqueue. Сохранить dirty planning/leases и bounded batch.

**Проверка / выход:** нет subscription, expired subscription, provider error, crash after claim, concurrent workers, отмена события и выход из пары. Не обещать exactly-once показ; не включать ретраи неоднозначной доставки автоматически.

## Этап 12 — Design System и доступность

**Цель / риск:** единое поведение элементов и состояний без новой UI-библиотеки.

**Файлы:** shared/ui, styles/tokens, forms/modals, app loading/error boundaries, viewport и page compositions.

**Шаги:** согласовать Button API; унифицировать Input/Modal/Avatar/Card/Dropdown; Skeleton/EmptyState/ErrorState; route boundaries; zoom, focus, labels и клавиатура. Формы используют бизнес-модель вне shared UI.

**Проверка / выход:** размеры 320/375/768/1440 px, клавиатура, focus trap/restore, screen-reader names, длинный контент, safe areas, error/retry/empty states. Визуальные изменения проверяются отдельно от функциональных.

## Этап 13 — Очистка и performance

**Цель / риск:** уменьшить подтверждённый долг, не удалив будущую или динамически подключаемую функциональность.

**Файлы:** кандидаты из аудита, package manifests/lockfile, крупные lists/widgets, query endpoints.

**Шаги:** повторная проверка потребителей непосредственно перед удалением; DELETE/REASON/RISK/BENEFIT; перенос ownership зависимостей; удаление старого PWA plugin после проверки; измерение bundles/render/network; адресные pagination/lazy loading/virtualization.

**Проверка / выход:** clean install/build, отсутствие потерянных маршрутов и функций; измерения до/после на одинаковых данных. Не применять memo повсеместно и не удалять Prisma-модели без исследования данных.

## Этап 14 — Итоговая регрессия

**Цель:** подтвердить результат всего плана в release-подобном окружении.

**Работы:** сквозные auth/chat/calendar/Todo/push сценарии, две пары и две сессии, offline/reconnect, race tests на отдельной PostgreSQL, migration rehearsal, deploy/start/cache/SW update. Проверить эксплуатационные инструкции и rollback миграций/релиза.

**Выход:** воспроизводимый CI, пройденные runtime/browser сценарии, закрытые P0, документированные оставшиеся риски и конкретные владельцы следующих задач. Недоступные проверки явно отмечаются; статус production-ready не ставится только по зелёному TypeScript.

## Карточка изменения

```text
ЭТАП / ШАГ:
ЦЕЛЬ:
ТЕКУЩАЯ ПРОБЛЕМА:
АРХИТЕКТУРНЫЙ РИСК:
РЕШЕНИЕ:
ФАЙЛЫ:

FILE:
OLD:
NEW:
CHANGES:
REASON:
BENEFIT:

ПРОВЕРКИ:
TypeScript:
ESLint:
Tests:
Build:
Runtime:
ОГРАНИЧЕНИЯ:
СТАТУС: ожидает проверки / подтверждён / заблокирован
```

Если файл не переносится, OLD и NEW совпадают. После проверки пользователь подтверждает завершение шага; только затем начинается следующий. Для текущего запроса создан только этот roadmap, реализация 0.1 не начата.
