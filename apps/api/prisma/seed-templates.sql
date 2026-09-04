BEGIN;

-- =========================================================
-- 1. ПУТЕШЕСТВИЕ
-- =========================================================

INSERT INTO "Template"
  ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt")
VALUES (
  'system-template-travel',
  'Путешествие',
  '✈️',
  '#E8F1FF',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "isSystem" = true,
  "updatedAt" = NOW();

DELETE FROM "TemplateItem"
WHERE "templateId" = 'system-template-travel';

INSERT INTO "TemplateItem"
  ("id", "templateId", "title", "assigneeMode", "repeat", "order")
VALUES
  ('system-travel-1', 'system-template-travel', 'Купить билеты', 'BOTH', 'NONE', 0),
  ('system-travel-2', 'system-template-travel', 'Забронировать жильё', 'BOTH', 'NONE', 1),
  ('system-travel-3', 'system-template-travel', 'Составить маршрут', 'BOTH', 'NONE', 2),
  ('system-travel-4', 'system-template-travel', 'Проверить документы', 'ME', 'NONE', 3),
  ('system-travel-5', 'system-template-travel', 'Собрать вещи', 'BOTH', 'NONE', 4);


-- =========================================================
-- 2. УБОРКА ДОМА
-- =========================================================

INSERT INTO "Template"
  ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt")
VALUES (
  'system-template-cleaning',
  'Уборка дома',
  '🧹',
  '#FFF3E8',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "isSystem" = true,
  "updatedAt" = NOW();

DELETE FROM "TemplateItem"
WHERE "templateId" = 'system-template-cleaning';

INSERT INTO "TemplateItem"
  ("id", "templateId", "title", "assigneeMode", "repeat", "order")
VALUES
  ('system-cleaning-1', 'system-template-cleaning', 'Убраться на кухне', 'ROTATE', 'WEEKLY', 0),
  ('system-cleaning-2', 'system-template-cleaning', 'Убраться в ванной', 'ROTATE', 'WEEKLY', 1),
  ('system-cleaning-3', 'system-template-cleaning', 'Пропылесосить', 'ROTATE', 'WEEKLY', 2),
  ('system-cleaning-4', 'system-template-cleaning', 'Помыть полы', 'ROTATE', 'WEEKLY', 3),
  ('system-cleaning-5', 'system-template-cleaning', 'Поменять постельное бельё', 'BOTH', 'WEEKLY', 4);


-- =========================================================
-- 3. ПРОДУКТЫ
-- =========================================================

INSERT INTO "Template"
  ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt")
VALUES (
  'system-template-groceries',
  'Продукты',
  '🛒',
  '#EAF7EE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "isSystem" = true,
  "updatedAt" = NOW();

DELETE FROM "TemplateItem"
WHERE "templateId" = 'system-template-groceries';

INSERT INTO "TemplateItem"
  ("id", "templateId", "title", "assigneeMode", "repeat", "order")
VALUES
  ('system-groceries-1', 'system-template-groceries', 'Составить список продуктов', 'BOTH', 'WEEKLY', 0),
  ('system-groceries-2', 'system-template-groceries', 'Купить овощи и фрукты', 'ROTATE', 'WEEKLY', 1),
  ('system-groceries-3', 'system-template-groceries', 'Купить молочные продукты', 'ROTATE', 'WEEKLY', 2),
  ('system-groceries-4', 'system-template-groceries', 'Купить мясо и рыбу', 'ROTATE', 'WEEKLY', 3),
  ('system-groceries-5', 'system-template-groceries', 'Проверить запасы дома', 'BOTH', 'WEEKLY', 4);


-- =========================================================
-- 4. СВИДАНИЕ
-- =========================================================

INSERT INTO "Template"
  ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt")
VALUES (
  'system-template-date',
  'Свидание',
  '❤️',
  '#FFECEF',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "isSystem" = true,
  "updatedAt" = NOW();

DELETE FROM "TemplateItem"
WHERE "templateId" = 'system-template-date';

INSERT INTO "TemplateItem"
  ("id", "templateId", "title", "assigneeMode", "repeat", "order")
VALUES
  ('system-date-1', 'system-template-date', 'Выбрать день', 'BOTH', 'NONE', 0),
  ('system-date-2', 'system-template-date', 'Придумать идею', 'BOTH', 'NONE', 1),
  ('system-date-3', 'system-template-date', 'Забронировать место', 'ME', 'NONE', 2),
  ('system-date-4', 'system-template-date', 'Подготовиться', 'ROTATE', 'NONE', 3),
  ('system-date-5', 'system-template-date', 'Провести время вместе', 'BOTH', 'NONE', 4);


-- =========================================================
-- 5. ПОДГОТОВКА К ПРАЗДНИКУ
-- =========================================================

INSERT INTO "Template"
  ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt")
VALUES (
  'system-template-holiday',
  'Подготовка к празднику',
  '🎉',
  '#F2ECFF',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "isSystem" = true,
  "updatedAt" = NOW();

DELETE FROM "TemplateItem"
WHERE "templateId" = 'system-template-holiday';

INSERT INTO "TemplateItem"
  ("id", "templateId", "title", "assigneeMode", "repeat", "order")
VALUES
  ('system-holiday-1', 'system-template-holiday', 'Выбрать дату', 'BOTH', 'NONE', 0),
  ('system-holiday-2', 'system-template-holiday', 'Составить список гостей', 'BOTH', 'NONE', 1),
  ('system-holiday-3', 'system-template-holiday', 'Купить продукты', 'ROTATE', 'NONE', 2),
  ('system-holiday-4', 'system-template-holiday', 'Подготовить подарки', 'ROTATE', 'NONE', 3),
  ('system-holiday-5', 'system-template-holiday', 'Украсить дом', 'BOTH', 'NONE', 4);

COMMIT;