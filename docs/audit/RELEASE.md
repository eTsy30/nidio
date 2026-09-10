# Release readiness — 2026-09-10

Этап 14 закрыт по локальным автоматическим проверкам, подтверждению пользователя и восстановлению работающего API Render. Изменения исходников/CI в рабочем дереве ещё не опубликованы; новый GitHub Actions run не запускался. Исправление схемы Neon уже применено.

## Результаты

| Проверка                                                      | Результат                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma generate, API typecheck                                | PASS                                                                                                                                                                                      |
| API unit regression                                           | PASS: 122 tests / 17 suites                                                                                                                                                               |
| API/web lint и web architecture                               | PASS                                                                                                                                                                                      |
| API/web production build, web typecheck                       | PASS                                                                                                                                                                                      |
| PostgreSQL 17: chat access, auth refresh, Todo, calendar push | PASS: четыре integration suites                                                                                                                                                           |
| Миграции на новых БД и повторный deploy                       | PASS: 24 migrations, второй deploy без изменений                                                                                                                                          |
| Production API HTTP/WebSocket                                 | PASS: четыре пользователя, две пары, profile без пары/с парой, refresh race, logout, chat acknowledgement/dedupe/reconnect, отказ чужой паре и чужому автору, Todo BOTH, GraphQL calendar |
| Storage HTTP wildcard                                         | PASS: encoded object key через production HTTP route; S3 transport stub                                                                                                                   |
| Production web start                                          | PASS: /login, /registration, /forgot-password, /sw.js — HTTP 200                                                                                                                          |
| Turbo restore service worker                                  | PASS: cache hit, восстановленный sw.js имеет исходный SHA-256                                                                                                                             |
| Browser/device acceptance                                     | Пользователь 2026-09-10 подтвердил две вкладки/logout, offline/reconnect чата, Todo drag/keyboard и реальные push: «Уже проверено — всё работает»                                         |
| Neon backup/restore/reconciliation                            | PASS: PostgreSQL 18 backup восстановлен в локальные БД, SQL проверен до production                                                                                                        |
| Neon после обновления                                         | PASS: совпадение Prisma schema, 24 миграции зарегистрированы, pending migrations отсутствуют                                                                                              |
| Render                                                        | PASS: https://nidio.onrender.com/users/me вернул 401 Unauthorized без токена после обновления Neon                                                                                        |

HTTP/WebSocket проверки не заменяют визуальную проверку браузера. Автоматические push integration используют mock transport; реальная доставка подтверждена пользователем. Ответ Render 401 подтверждает доступность процесса; проверка бизнес-сценариев выполнена на изолированной БД и пользователем в приложении.

## Исправление Render

В логе была ошибка `P2021: relation public.Task does not exist` в `TasksService.cleanupCompletedTasks`. Neon содержала 13 старых таблиц без `_prisma_migrations`. Простого `migrate deploy` для такой базы недостаточно.

Выполнено:

1. Полный backup Neon клиентом PostgreSQL 18. Файл вне репозитория: `/tmp/nidio-neon-before-release-20260910-pg18.sql`, права 0600. Он содержит данные приложения; не коммитить. `/tmp` не является долговременным backup-хранилищем.
2. Backup восстановлен в локальную PostgreSQL 18. SQL [neon-reconcile-20260910.sql](release/neon-reconcile-20260910.sql) успешно проверен на копии; `prisma migrate diff --exit-code` не обнаружил отличий.
3. В Neon SQL применён одной транзакцией с ограничением времени блокировок и проверкой контрольных сумм исходных колонок/строк всех 13 таблиц. Старые данные сохранены. `RefreshToken.jti` заполнен из `id`; добавлены четыре системных шаблона, предусмотренных исторической миграцией.
4. После проверки совпадения схемы исторические миграции зарегистрированы через `prisma migrate resolve --applied`. `migrate deploy` и `migrate status` подтверждают актуальную схему.

SQL — одноразовый план именно для обследованной старой схемы, не новая общая migration. **Повторно применять его к обновлённой Neon нельзя.** `scripts/baseline-existing.mjs` также не входит в обычный deployment: это средство восстановления истории после предварительного приведения схемы к проекту, с обязательной проверкой diff.

Дополнительно в исходниках:

- `AuthService.validate` использует одиночную nullable membership; покрыты пользователь без пары и пользователь с партнёром.
- Ошибка фоновой очистки задач логируется и не превращается в unhandled rejection; проверены повторный запуск и остановка таймера.
- Storage использует именованный wildcard `images/*path` и соответствующий параметр.

## Обычный релиз на Render

Команды выполняются из корня монорепозитория. В Render Environment задать `NODE_ENV=production`, `DATABASE_URL` для runtime, `DIRECT_URL` для миграций той же Neon branch/database, `JWT_SECRET`, frontend origin allowlist, storage и VAPID параметры. Локальный `.env.production` не загружается в настройки Render автоматически. `PRISMA_DATABASE_URL` в production не задавать без специальной необходимости: он имеет приоритет над `DIRECT_URL`.

- Build Command: `pnpm install --frozen-lockfile && pnpm --filter api build`
- Pre-Deploy Command, если доступен: `pnpm --filter api db:deploy`
- Start Command при отдельном pre-deploy: `pnpm --filter api start`
- Если pre-deploy недоступен: Start Command `pnpm --filter api start:render` — миграции выполняются до запуска API, а ошибка миграции останавливает запуск.

Не менять исправный service на другую БД. Убедиться, что `FRONTEND_URL` содержит фактический frontend origin, а frontend `NEXT_PUBLIC_*_URL` указывают на Render, не localhost. Настройки Render через UI в этой сессии не изменялись: управление компьютером было недоступно.

После публикации исходников проверить GitHub job `ci`, логи Render и login/profile/chat/Todo/calendar. Старые токены без `type`/`jti` требуют повторного входа.

Источники: [Render Prisma deployment](https://render.com/docs/deploy-prisma-orm), [Render deploy lifecycle](https://render.com/docs/deploys).

## Воспроизведение проверок

```bash
pnpm install --frozen-lockfile
pnpm --filter api db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
RELEASE_TEST_DATABASE_URL=postgresql://postgres:release-test-only@127.0.0.1:5432/release_test pnpm --filter api test:release
RELEASE_TEST_DATABASE_URL=postgresql://postgres:release-test-only@127.0.0.1:5432/release_test pnpm --filter api test:runtime
```

Использовать отдельный PostgreSQL-кластер с БД `release_test` и правом создания тестовых БД. `test:release` создаёт только именованные тестовые БД и запускает четыре сценария. `test:runtime` запускает собранный API на localhost:55440, отключает реальные push и поднимает локальный S3 stub. Тестовые записи runtime остаются в изолированной `release_test`; весь кластер одноразовый. Не передавать рабочие credentials этим scripts.

CI поднимает PostgreSQL 17 service и запускает integration/migration и HTTP/WS сценарии. Web build и typecheck запускать последовательно: Next пересоздаёт `.next/types` при сборке.

## Откат

**Откат приложения:** в Render развернуть предыдущий известный рабочий commit. Для frontend выбрать предыдущий deployment. Сначала проверить совместимость старого кода с текущей схемой. В данном исправлении изменения схемы добавляющие: при откате приложения новые таблицы/колонки сохранять. Не запускать `migrate reset`, `db push --accept-data-loss` или массовое удаление migration history.

**Если миграция не завершилась:** не запускать API с неподготовленной схемой; изучить ошибку и фактическое состояние БД. `migrate resolve` использовать только после проверки/устранения причины, а не для сокрытия незавершённого SQL.

**Если нужно восстановить данные:** остановить записи приложения; восстановить backup/PITR в отдельную Neon branch/database, проверить данные и схему, затем переключить `DATABASE_URL` и `DIRECT_URL` вместе и развернуть совместимый commit. Восстановление поверх работающей БД не выполнять. Локальная репетиция `pg_dump` → пустая PostgreSQL 18 → `psql -v ON_ERROR_STOP=1` успешно выполнена; время и процедуру переключения реальной Neon branch в этой сессии не тестировали.

## Остаточные риски и владельцы

Владелец проекта/релиза: eTsy30. Задачи не считаются устранёнными только из-за закрытия этого этапа.

| Риск / следующая задача                                              | Владелец | Условие / действие                                                                               |
| -------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| Публикация изменений исходников и нового CI                          | eTsy30   | Commit/push и проверка нового GitHub/Render deployment; в этой сессии не выполнялись             |
| Долговременные backup/PITR и восстановление Neon branch              | eTsy30   | Перенести backup из /tmp в защищённое хранилище, определить retention и допустимую потерю данных |
| HTTP/WS rate limits локальны процессу/сокету                         | eTsy30   | Перед несколькими API instances добавить общее хранилище лимитов                                 |
| Chat UI показывает последние 20 сообщений                            | eTsy30   | Cursor pagination при принятии требования полной истории                                         |
| Calendar recurrence использует UTC и существующий month-end overflow | eTsy30   | Отдельно согласовать local wall-clock/DST и миграцию старых series                               |
| Визуальная доступность на всех размерах и screen reader              | eTsy30   | Продолжать ручную регрессию при UI-изменениях; автоматического browser runner нет                |

P0 исходного аудита (chat entity access и JWT purpose/rotation) покрыты unit, PostgreSQL и runtime проверками. Отдельный аудит всех возможных security-рисков этим отчётом не заявляется.
