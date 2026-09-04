-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "columnId" DROP NOT NULL;
-- Системные шаблоны
INSERT INTO "Template" ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, 'Продукты', 'shopping-cart', '#E8F5E9', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Уборка', 'sparkles', '#FFF3E0', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Путешествие', 'plane', '#E3F2FD', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Дом', 'home', '#F3E5F5', true, NOW(), NOW());

-- Примеры задач в шаблонах (опционально, можно добавить позже через API)