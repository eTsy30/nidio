# PROJECT AUDIT

Дата: 2026-09-09. Исходный commit: `089e0ac`.

Статус: аудит завершён; изменения исходного кода не выполнялись. Этот документ — основание для согласования этапов, а не заявление о готовности продукта к production.

Проверены структура и статические импорты frontend, конфигурации monorepo, ключевые пути auth/REST/GraphQL/WebSocket, календарь и повторения, push, Todo, Prisma и существующие проверки. Инвентаризация охватывает 285 TS/TSX файлов frontend и `apps/api/src`, включая тесты. Приоритетная ручная проверка выполнена для бизнес-сценариев и границ доступа; это не построчный security review каждого файла.

Обозначения: **P0** — устранить до публичного запуска; **P1** — следующий обязательный этап; **P2** — плановая поддерживаемость. Подтверждённые выводы основаны на исходном коде; предполагаемые последствия отдельно обозначены. Эксплуатация уязвимостей на пользовательских данных не проводилась.

## 1. Архитектурные проблемы

### 1.1. P0: авторизация операций чата отсутствует на уровне сущности

Файлы: `apps/api/src/chat/chat.controller.ts`, `chat.service.ts`, `chat.repository.ts`, `apps/api/src/realtime/realtime.gateway.ts`.

- REST edit/delete передают только ID сообщения; сервис не получает actorId и не проверяет автора или workspace. Repository обновляет запись по одному ID.
- WebSocket edit/delete вызывает ту же мутацию до проверки `client.data.user` внутри обработчика.
- Добавление реакции не проверяет членство в workspace сообщения.
- `replyToId` проверяется только на существование; workspace исходного сообщения не сравнивается. Repository возвращает текст reply, что создаёт путь раскрытия сообщения из другого workspace при известном ID.

Влияние: наличие авторизованной сессии не обеспечивает изоляцию данных пары. UUID/CUID не заменяет контроль доступа.

Варианты: проверки в каждом контроллере либо единая политика в use case. Выбор: единая `ChatAccessPolicy`/проверка доступа в сервисном сценарии для REST и WS, с ограничением запросов repository по actor/workspace. Добавить негативные тесты с двумя независимыми парами до изменения структуры frontend.

### 1.2. P0: access и refresh JWT не разделены при использовании

Файлы: `auth/services/token.service.ts`, `auth/strategies/jwt.strategies.ts`, `auth/auth.service.ts`, `realtime/realtime.gateway.ts` внутри `apps/api/src`.

Refresh подписывается тем же JwtService и содержит `type: refresh`; REST strategy и WS handshake проверяют подпись/срок, но не назначение токена. По коду refresh-токен может пройти как Bearer/WS credential. `refresh()` тоже не проверяет `type`, хотя дополнительно сверяет хеш с сессиями.

Выбор: явный token kind и обязательная проверка назначения на каждом входе; отдельные функции проверки access/refresh. Отдельные ключи — дополнительный вариант усиления, но не замена проверке claims. Для существующих access без `type` понадобится согласованный переход или повторный вход.

### 1.3. P1: нет единого жизненного цикла сессии

Файлы: `apps/web/shared/api/provider/auth-provider.tsx`, `shared/api/interceptors/response.interceptor.ts`, `shared/lib/apollo-client.ts`, `features/auth/api/auth.api.ts`.

REST interceptor, AuthProvider и Apollo обновляют токен независимо. Single-flight есть только внутри Apollo. При одновременном 401 механизмы могут использовать один rotating refresh несколько раз. Backend удаляет старую сессию перед созданием новой; конкурентный запрос может получить ошибку и разлогинить рабочий клиент.

AuthProvider дополнительно повторяет `/users/me` после изменения токена и хранит пользователя и в React State, и в Query. Ошибка сети при `refreshUser` очищает пользователя, а не только ошибка авторизации. `logout` вызывает Apollo `resetStore`, который потенциально инициирует повторные активные запросы уже без сессии.

Выбор: общий session coordinator с одним refresh Promise для всех транспортов, одной политикой logout и разграничением offline/401. User profile хранить в Query; session state не дублирует profile. Отдельно проверить параллельные вкладки: один Promise в JS не решает межвкладочную конкуренцию.

### 1.4. P1: FSD пока номинальный

`apps/web/entities` отсутствует. `features/together` содержит API, сущности, виджеты доски и сценарии; `shared/api/provider/auth-provider.tsx` импортирует auth и push features. Calendar features импортируют виджеты и константы из `widgets/calendar`.

Статическая проверка alias-импортов выявила **23 импорта**, нарушающих направление слоёв или границы соседних features. Это нижняя оценка: не учитываются все транзитивные зависимости и будущая детализация slices.

Есть runtime-цикл `features/auth/api/auth.api.ts → shared/api/client/api.ts → shared/api/interceptors/response.interceptor.ts → auth.api.ts`, а также цикл client/interceptor. Отдельный цикл Card/types носит типовой характер; его нельзя приравнивать к runtime-циклу auth.

Выбор: сначала отделить transport/session/domain, затем переносить файлы и включать архитектурный lint. Простое переименование `screens` в `pages` проблемы зависимостей не решает.

### 1.5. P1: frontend-контракты не соответствуют серверу

`features/auth/model/auth.types.ts` обещает `User.relationship` и `updatedAt`; `UsersService.getMe()` их не возвращает. Именно это объясняет предыдущие ошибки имени/аватара партнёра. `AuthResponse` обещает refreshToken в JSON, хотя сервер кладёт его в HttpOnly cookie. `CurrentCoupleResponse` не nullable, хотя endpoint возвращает null при отсутствии пары.

Варианты: расширить `/users/me` до агрегата либо иметь User и Couple как отдельные ресурсы. Выбор: отдельные `entities/user` и `entities/couple`, честные nullable-контракты и один composition hook для шапок. Для GraphQL — генерируемые типы операций; для REST — DTO/schema contract tests. Не переносить Prisma model напрямую в UI.

### 1.6. P1: доменные границы backend размыты

TasksService — 944 строки, CalendarService — 744, CalendarPushService — 434, RelationshipService — 424, RealtimeGateway — 393, AuthService — 338. Размер — сигнал, а не самостоятельный дефект: внутри совмещены permissions, Prisma, recurrence, оркестрация и внешние эффекты.

CalendarService импортирует проверку timezone из push, хотя это правило календарного домена. `acceptInvite` отправляет realtime-событие внутри незавершённой транзакции. Клиент может получить событие до commit или при последующем rollback.

Выбор: небольшие use cases и domain helpers; Prisma repository/query service там, где он отделяет реальную логику. Не создавать универсальный Repository с pass-through методом для каждого Prisma вызова. Внешние события — после commit, для надёжной доставки — transactional outbox.

## 2. Технический долг

### Безопасность и надёжность

| Приоритет | Наблюдение                                                                                                      | Последствие / действие                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P1        | `storage.controller.ts`: memoryStorage без `limits.fileSize`; размер проверяется после буферизации              | Ограничить поток до загрузки целого файла в память, валидировать фактический формат; MIME клиента недостаточно              |
| P1        | JWT проверяется на WS handshake; повторная проверка срока в сообщениях не найдена                               | Долгая сессия может пережить expiry/logout; определить ревокацию и переподключение                                          |
| P1        | Gateway принимает origin:true, DTO часто передаются обычными параметрами без `@MessageBody`                     | HTTP ValidationPipe не доказывает валидацию WS; нужны явные WS DTO/pipe и origin allowlist                                  |
| P1        | `CreateMessageDto` требует clientId/type, клиент WS отправляет только content                                   | REST и WS имеют разный фактический контракт; унифицировать payload и acknowledgement                                        |
| P1        | Не найден rate limit для login/reset/refresh/chat; reset перебирает все PasswordReset и выполняет Argon2 verify | Риск CPU/памяти; indexed token identifier + expiry filter, ограничение запросов. Защита на внешнем proxy не проверялась     |
| P1        | Refresh удаляет сессию, затем создаёт новую вне общей атомарной операции                                        | Сбой между операциями теряет сессию; нужны atomic consume/rotate и race tests                                               |
| P1        | `generateRefreshToken` не задаёт уникальный jti                                                                 | Для одного пользователя и одинакового JWT timestamp возможны одинаковые токены разных входов; добавить идентификатор сессии |
| P1        | `ChatController` принимает неограниченный limit; task move принимает scalar body без DTO                        | Нужны диапазоны, конечные числовые значения и единая валидация                                                              |
| P1        | `BoardService.getBoard` делает findUnique → create                                                              | Два первых GET могут конкурировать по unique coupleId; upsert/retry conflict                                                |
| P2        | Частые generic Error/console.error, нет общего безопасного error envelope и correlation ID                      | Пользователь получает непонятную ошибку, диагностика теряет контекст                                                        |

### Календарь, повторения, timezone, push

1. **P1 — Calendar read:** `CalendarService.findMany` загружает все события выбранного владельца/пары, затем фильтрует диапазон и разворачивает series в JS. Это не scheduler scan, но запрос календаря с ростом истории дорожает. Нужны SQL-предикаты для одноразовых и пересекающихся серий, максимальный диапазон и ограничение результата.
2. **P1 — Recurrence:** `getNextOccurrence` и `advanceOccurrence` реализуют UTC-арифметику отдельно. Ежедневное событие не сохраняет местное wall-clock время при DST. `setUTCMonth` допускает перенос 31-го числа в следующий месяц. Это текущая семантика, а не повод молча менять даты существующих пользователей: сначала тесты и решение clamp/skip/overflow.
3. **P1 — Ограничение раскрытия:** CalendarService ограничивает число итераций; старые серии могут тратить лимит на даты до видимого диапазона. Нужен переход к первой релевантной occurrence и общий recurrence engine с scheduler.
4. **P2 — Scheduler устроен лучше, чем первоначальный вариант:** dirty sources и due jobs выбираются отдельно; очередь читает до 100 записей, конкурентность ограничена 10. Полного перебора всех событий каждую минуту в текущем push scheduler не найдено. Сохранить эту архитектуру.
5. **P1 — Delivery semantics:** NotificationAttempt создаётся до обращения к провайдеру. Ошибки доставки в PushService логируются и поглощаются; queue может перейти к следующему occurrence. Это at-most-once attempt, не гарантия доставки. Нет подписки — фактической отправки нет. Сохранение Nudge возвращает успех независимо от доставки.
6. **P1 — Todo Overdue:** marker ставится до send; сбой процесса после claim теряет уведомление. Текущая договорённость «не повторять» соблюдается, но надёжность ограничена. При изменении продукта выбрать delivery state machine/outbox; не включать бесконтрольные ретраи.
7. **P2 — Логи доставки:** не найден регулярный retention cleanup NotificationAttempt. Нужно определить срок хранения, не разрушая dedupe старых jobs.
8. **P1 — Модель даты:** Todo date-only использует server-local startOfDay, календарь — instant/timezone, профиль relationshipAt — календарную дату UTC. Нужны явные типы LocalDate/Instant/TimeZone, а не общий Date/string для всех правил. Текущие 12:00 и BOTH-политику сохранить до отдельного согласования.
9. **P2 — Наблюдаемость:** нужны возраст oldest due job, число dirty sources, accepted/failed/expired subscriptions, overdue processed/sent. Не логировать endpoint, auth, p256dh или текст личных сообщений.

### Chat: состояние и offline

- `useLoadMessages` получает только первую страницу и заменяет весь local messages state. Сообщение, пришедшее через WS во время загрузки, может исчезнуть при позднем HTTP-ответе. Нет отмены запроса на unmount.
- Reconnect не запускает синхронизацию пропущенной истории. Socket.IO reconnect сам по себе не восстанавливает пропущенные business events.
- `useSendMessage` проверяет объект socket, но не connected; нет ack/timeout/idempotency/outbox и явного pending/failed UI. Поле clientId есть в DTO/repository, но не проходит весь сценарий.
- Read/delivered имеют серверные проверки workspace — это хорошая основа. На клиенте status обновляется без монотонности: поздний delivered может заменить read.
- Remove reaction на клиенте удаляет все реакции с emoji, тогда как сервер удаляет реакцию конкретного userId. В контракте события нужен actorId.
- Typing не имеет явного TTL на клиенте; потерянный stop оставляет устаревший индикатор.
- RealtimeProvider зависит от целого user object, поэтому обновление профиля может переподключить socket. Подписки typing существуют и в provider, и в chat hook.

### UI, производительность и Next.js

Компоненты больше 300 строк на момент проверки:

| Файл внутри apps/web                                          | Строк |
| ------------------------------------------------------------- | ----: |
| features/together/ui/BoardView.tsx                            |   601 |
| widgets/calendar/ui/CalendarWidget.tsx                        |   489 |
| features/together/ui/TaskCard.tsx                             |   397 |
| features/together/ui/CreateTaskSheet.tsx                      |   378 |
| features/profile/ui/edit-profile-dialog/EditProfileDialog.tsx |   317 |
| features/together/ui/EditTaskSheet.tsx                        |   312 |
| features/calendar/ui/SelectedDayDrawer.tsx                    |   312 |

- BoardView совмещает DnD, фильтрацию, optimistic cache, mutations и создание колонки. Выделить model hook, чистые функции перемещения и отдельный create-column UI; проверить rollback и drag cancel. KeyboardSensor отсутствует.
- CalendarWidget совмещает query, нормализацию, выбор периода, мутации и несколько модальных состояний. Нужна discriminated union для modal state вместо независимых boolean/event значений.
- Состояния calendar scope/month/view и Todo filter не отражаются в URL; история браузера и ссылка не восстанавливают выбранный вид. URL state подходит для этих параметров, но не для текста черновика.
- Root AuthProvider возвращает null во время bootstrap и оборачивает также public routes. Пользователь видит пустую загрузку; server-rendered содержимое дочерних страниц визуально блокируется клиентской сессией. Не переводить всё в SSR: сначала выделить public/protected composition и определить cookie/BFF стратегию для SSR доступа.
- `app/error.tsx`, `global-error.tsx`, `loading.tsx` отсутствуют. Ошибки данных в ряде мест отображаются как empty state или только console.
- `viewport` отключает user zoom; это проблема доступности. Native input labels местами не связаны через htmlFor/id. Несколько модалок ещё реализованы вручную, тогда как новые используют Base UI Dialog.
- `GET /boards` возвращает всю историю задач. До virtualization сначала измерить объём и отделить архив/пагинацию; memo без профилирования не решает большой payload.
- Apollo и Query загружаются глобально. Наличие двух клиентов само по себе допустимо: GraphQL календарь и REST Todo можно сохранить; едиными должны стать session/error contract, а не обязательно протокол.
- Серверные singleton Query/Apollo caches нельзя использовать для персонального SSR без per-request создания. Сейчас большая часть персональных запросов выполняется в браузере; доказанного межпользовательского SSR leak аудит не установил.

### TypeScript и tooling

- Strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes уже включены: это сильная сторона. Главная проблема — неверные контракты, а не массовый any.
- Явный any найден в `auth/decorators/current-user.decorator.ts`; в других текстовых совпадениях присутствуют комментарии и `expect.any`, их нельзя считать слабой типизацией.
- API lint отключает no-explicit-any целиком. JSON payload scheduler приводится через `as unknown as`, без runtime schema; GraphQL mutations не имеют генерируемых operation types.
- В root package.json два ключа `scripts.dev`: первый затенён вторым. Первый содержит принудительное завершение процесса на порту; удалить только неработающий дубль, не запускать его.
- В web package.json нет typecheck/test scripts; `turbo typecheck` не доказывает проверку web. В CI нет шага запуска тестов.
- API build создаёт `dist/src/main.js`, а `start` указывает `node dist/main`. Это подтверждено изолированной сборкой; deployment entrypoint нужно исправить.
- Turbo build outputs не включают `apps/web/public/sw.js`, хотя Serwist пишет именно туда. При cache restore возможно несоответствие `.next` и service worker. `globalDependencies` не покрывает `.env.production/.env.development`; env whitelist/hash также нужно проверить.
- Корень содержит runtime зависимости приложений, несколько версий Prisma/Next-related инструментов; API использует часть зависимостей через root. Сначала перенести ownership зависимостей в workspace, затем удалить дубли и пересоздать lockfile.

### Результаты проверок

| Проверка                                 | Результат                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| API `tsc --noEmit`                       | PASS                                                                                      |
| Web `tsc --noEmit`                       | PASS                                                                                      |
| API Jest, все найденные suites           | 6 suites, 54 tests PASS                                                                   |
| ESLint frontend + API source/test        | FAIL: 1 error, 5 warnings                                                                 |
| API production compile в временной копии | PASS; проверен фактический путь dist/src/main.js                                          |
| Web production compile в временной копии | Не подтверждён: webpack не разрешил alias @/ в изолированной копии с symlink node_modules |

Lint error относится к generated `apps/web/public/sw.js`: project service не включает этот JS. Пять warnings: два img, unused useEffect в CoupleCard, unused imports в двух screens/index. Лог: `/private/tmp/nidio-audit-eslint.json`.

Изолированный запуск pnpm build сначала попытался автоматически проверить/переустановить зависимости и завершился ошибкой. Затем использованы уже установленные CLI непосредственно. Не считать ошибку aliases доказанным дефектом production исходного приложения: окружение копии отличается. Рабочие `.next` и `public/sw.js` не пересобирались.

Ограничения: живой UI/browser недоступен; Lighthouse, React profiler, bundle analyzer, нагрузочные тесты, проверка CVE по registry, production DB EXPLAIN и фактическая доставка push не выполнялись. PG integration scripts существуют, но в этом аудите повторно не запускались. 54 теста покрывают tasks/push, а не безопасность auth/chat и весь продукт. Секреты и пользовательские данные в отчёт не включены.

## 3. Дублирование

| Где                                                           | Что сделать                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AuthProvider + useMe + relationship fallbacks в шапках        | User/Couple query models + один composition hook, без второй копии server state           |
| REST refresh + Apollo refresh + AuthProvider timer            | Один session coordinator, отдельный transport retry adapter                               |
| `shared/ui/button.tsx` и `shared/ui/button/Button.tsx`        | Выбрать базовый Button API и адаптеры; оба используются, не удалять без миграции props    |
| `features/together/api/board.api.ts` и `model/board.types.ts` | Entity Board/Column DTO + view model, один источник типов                                 |
| `features/calendar/types.ts` и `create-event/model/types.ts`  | Entity event; widget/model/types сейчас re-export, а не третья независимая модель         |
| Calendar recurrence + push advanceOccurrence                  | Общий доменный recurrence engine с тестами DST/month-end                                  |
| Самописные sheets и Base UI Dialog                            | Один modal primitive с focus/escape/scroll handling и отдельными бизнес-формами           |
| TaskCard/TaskItem и не подключённые альтернативные списки     | Зафиксировать используемые представления, затем общий task entity UI и отдельные действия |
| Error parsing в формах/hooks                                  | Shared normalizeTransportError; доменные сообщения остаются у use cases                   |

Не добавлять Redux/Zustand ради архитектурного шаблона. У текущих сценариев достаточно локального React state, URL, TanStack Query и Apollo. Глобальный store оправдан только новым независимым требованием.

## 4. Что удалить

Ничего не удалено. Ниже кандидаты после подтверждения. Статический поиск не доказывает отсутствие внешних потребителей; barrel exports и динамическое подключение требуют проверки.

| DELETE                                                                                | REASON                                                          | RISK                                                    | BENEFIT                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------- |
| `apps/web/widgets/ui/EventCard.tsx`                                                   | Пустой файл; входящих импортов не найдено                       | Низкий                                                  | Убрать ложный компонент             |
| `apps/web/features/calendar/create-event/model/types.ts`                              | Дублирует event types, входящих импортов не найдено             | Низкий после повторного graph check                     | Единый контракт календаря           |
| `apps/web/features/together/model/board.types.ts`                                     | Дубль Board/Column, входящих импортов не найдено                | Низкий после сверки DTO                                 | Исключить расхождение моделей       |
| `apps/web/shared/ui/avatar-pair/avatar-pair.types.ts`                                 | Отдельный неиспользуемый контракт, props объявлены в компоненте | Низкий                                                  | Один источник props                 |
| `apps/web/features/calendar/delete-event/ui/DeleteEventButton.tsx`                    | Не подключён к текущим маршрутам                                | Средний: возможен запланированный UI                    | Убрать неиспользуемую оболочку      |
| `apps/web/features/together/ui/AssigneeSelector.tsx`                                  | Формы реализуют выбор сами, входящих импортов нет               | Средний: возможно лучше переиспользовать, чем удалить   | Сократить альтернативные реализации |
| `apps/web/shared/realtime/lib/events.ts`                                              | Нет импортов, параллельный каталог имён событий                 | Средний: предпочтительно сначала унифицировать протокол | Убрать рассинхронизацию имён        |
| Root `@ducanh2912/next-pwa` dependency                                                | Используется Serwist, импортов старого plugin не найдено        | Средний: lockfile/build/PWA smoke                       | Один PWA stack                      |
| Закомментированный `relationship:sync`, старый auth me endpoint, первый `scripts.dev` | Неисполняемый код и затенённая настройка                        | Низкий                                                  | Убрать ложные точки входа           |

`TodayView`, `TodayBanner`, `TaskList`, `use-task-completion` не имеют входящих импортов в текущем статическом графе маршрутов. **Не удалять автоматически:** это ранее обсуждавшаяся функциональность, а не просто мусор. Сначала подтвердить, нужен ли отдельный Today/list view. Пустые barrels screens следует исправить или удалить после проверки public API, а не считать бизнес-компоненты неиспользуемыми из-за неправильного export.

`Space`, `Block`, `EmailVerification` в Prisma — кандидаты на отдельное продуктово-данное исследование, не на удаление в frontend cleanup. Наличие существующих записей не проверялось.

## 5. Что переработать

Ниже предлагаемые изменения в требуемом формате. Это план, не выполненные переносы.

### FILE: session orchestration

OLD: `apps/web/shared/api/provider/auth-provider.tsx`, `shared/api/interceptors/response.interceptor.ts`, `shared/lib/apollo-client.ts`

NEW: `apps/web/src/app/providers/`, `src/entities/session/model/`, `src/shared/api/transport/`

REASON: session orchestration не является generic HTTP utility.

PROBLEM: циклы, параллельный refresh, duplicated user state.

CHANGES: application composition, единый refresh lifecycle, transport adapters, User query.

BENEFIT: одинаковое поведение REST/GraphQL/WS, тестируемые offline/logout сценарии.

### FILE: calendar

OLD: `apps/web/widgets/calendar/ui/CalendarWidget.tsx`, `features/calendar/types.ts`, `widgets/calendar/model/constants.ts`

NEW: `src/entities/event/`, `src/widgets/calendar/{ui,model}/`, `src/features/create-event/`, `edit-event/`, `delete-event/`

REASON: event model используется и чтением, и действиями.

PROBLEM: features импортируют widgets; modal/query/mutation state смешаны.

CHANGES: entity types/queries, widget orchestration, отдельные mutation features; SelectedDayDrawer поднимается в calendar widget.

BENEFIT: разрешённые зависимости, независимые тесты действий и времени.

### FILE: Todo

OLD: `apps/web/features/together/ui/BoardView.tsx`, `TaskCard.tsx`, формы

NEW: `src/entities/task/`, `src/entities/board/`, `src/widgets/task-board/`, `src/features/create-task/`, `edit-task/`, `complete-task/`, `nudge-task/`

REASON: доска — композиция, task — сущность, создание/выполнение — действия.

PROBLEM: огромный feature slice, mutations и DnD в UI.

CHANGES: pure move helpers, model hook, entity query keys, действие nudge с явным результатом, общий modal UI.

BENEFIT: сохранение поведения BOTH/Overdue при независимом изменении представлений.

### FILE: backend domain use cases

OLD: `apps/api/src/{auth,chat,tasks,calendar,relationship}/*.service.ts`

NEW: те же модули с `application/`, `domain/`, `infrastructure/` только там, где это уменьшает реальную связанность

REASON: изоляция permissions/recurrence/persistence/effects.

PROBLEM: транзакции и внешние события пересекаются, transport paths применяют разные правила.

CHANGES: общие access policies, bounded queries, atomic session rotation, recurrence tests, post-commit effects.

BENEFIT: контроллеры и resolver используют одинаковые бизнес-инварианты.

### Предлагаемая FSD структура с Next.js

```text
apps/web/
  app/                 # тонкие Next App Router entrypoints, layout, loading/error, sw entry
  src/
    app/               # FSD composition: providers, configs, styles
    screens/           # логический FSD Pages, без конфликта с Next Pages Router
    widgets/
    features/
    entities/
    shared/
  public/
```

Причина отклонения от буквального имени `src/pages`: Next распознаёт `pages` как Pages Router, а не произвольный FSD слой. Поэтому предлагается сохранить имя `screens` для логического слоя Pages и явно закрепить его уровень в lint. Это безопаснее механического переноса с возможным появлением лишних маршрутов. Альтернатива с буквальным `pages` требует отдельного routing adapter и проверки Next discovery; её не следует вводить молча. Для корневого `app` остаются только Next entrypoints, для `src/app` — application composition, которую Next не должен считать вторым router. Aliases и Serwist paths учитывают перемещения; public/env остаются в корне приложения.

`shared/api` содержит transport, error normalization и общие wire primitives. Доменные endpoints/hooks размещаются в entities/features: помещение всех бизнес-endpoints в shared противоречило бы запрету бизнес-логики в shared.

## 6. Что оставить

- Monorepo pnpm/Turbo, Next App Router, React 19, NestJS/Prisma: замена стека не решает обнаруженные дефекты.
- TanStack Query для REST server state и Apollo для GraphQL на переходный период; сначала унифицировать auth, а не мигрировать протоколы одновременно.
- In-memory access token и HttpOnly refresh cookie; не переносить refresh в localStorage. Исправить назначение JWT, rotation и error lifecycle.
- Prisma unique constraints для couple membership, completions, notification dedupe; существующие row locks для BOTH/nudge и ограниченные worker batches.
- ScheduledNotification с lease/sourceVersion и dirty planning. Для текущего объёма PostgreSQL queue достаточна; Redis/BullMQ не обязательны без требований и измерений.
- Существующие unit и PG integration tests задач/push. Расширять покрытие security/calendar/chat, не заменять его тестами структуры папок.
- UI tokens, cn, Base UI primitives и строгий TS. Собрать design system из них вместо новой UI библиотеки.
- Todo без polling/WS, push правила self/partner/BOTH, 12:00 календаря и существующие URL. Архитектурный рефакторинг не должен менять продуктовые договорённости.

## 7. План рефакторинга

### Step 1 — воспроизводимые проверки и P0 безопасность

1. Исправить lint generated files, scripts/CI typecheck/tests, API start path и Turbo SW outputs.
2. Добавить негативные тесты доступа чата: собственное сообщение, партнёр, другая пара, reply, reactions, REST/WS.
3. Ввести chat access policy и token-purpose validation, WS payload validation, streaming upload limits.

Критерий: действующие сценарии сохранены, чужие записи недоступны, refresh не принимается как access. Это первый рекомендуемый пакет к подтверждению; не переносить все папки одновременно с security fix.

### Step 2 — auth и контракты данных

Единый refresh coordinator, atomic backend rotation, разделение unauthorized/offline, честные User/Couple/AuthResponse types. Проверить одновременные REST/GraphQL 401, reload, logout, две вкладки, истечение токена при WS reconnect. Убрать дублирование profile state и повторяющиеся partner fallbacks.

### Step 3 — каркас FSD и правила импортов

Создать src layers, начать с entities user/couple/session и application providers. Тонкие Next entrypoints оставить с прежними URL. Public API slices и lint направления зависимостей. Переносить по одному вертикальному сценарию; переходные re-exports удалять только после миграции потребителей.

### Step 4 — календарь

Общий recurrence domain engine, SQL range filtering, тесты DST/31 января/29 февраля/exclusions/following/delete/смена timezone. Затем отделить CalendarWidget model, формы и actions. Продуктовую семантику recurring дат согласовать отдельно до изменения сохранённых расписаний.

### Step 5 — чат

Typed protocol, ack + clientId uniqueness, bounded cursor pagination, единый message cache с merge, reconnect catch-up, monotonic receipts, actor-specific reactions, typing TTL и видимые offline/error/retry состояния.

### Step 6 — Todo

Entities task/board, task-board widget, pure DnD helpers, keyboard/cancel/rollback, отдельные mutation features. Сохранить отсутствие polling/WS; архив/пагинация только с проверкой пользовательских сценариев. Зафиксировать статус Today/list view до удаления.

### Step 7 — push observability и надёжность

Типизированный delivery result, metrics, retention, явные retry rules, outbox при требовании гарантированного enqueue. Проверить crash after claim и несколько workers. Не выдавать provider accepted за показ на устройстве.

### Step 8 — design system, cleanup и performance

Единые Button/Input/Modal/Avatar/Card/Dropdown/Skeleton/EmptyState/ErrorState; route boundaries; доступность zoom/focus/labels. Удалять только подтверждённых кандидатов с DELETE/REASON/RISK/BENEFIT. Затем bundle/profile на реальных данных и адресные lazy loading/virtualization, если измерения покажут необходимость.

### Проверки после каждого этапа

- TypeScript обоих приложений и архитектурный lint.
- Unit/regression tests изменённого сценария, существующие tests без регрессии.
- PG integration для транзакций на отдельной базе, не production.
- Production build API/web и smoke запуска фактического entrypoint.
- Browser smoke 320/375/768/1440 px, keyboard navigation, login/logout, chat reconnect, calendar timezone, BOTH/nudge, SW update.
- Список изменённых файлов в формате FILE/OLD/NEW/REASON/PROBLEM/CHANGES/BENEFIT и отдельный перечень удалений.

Переход к изменению кода — только после подтверждения пользователя, как указано в последнем задании.
