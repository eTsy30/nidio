import { PrismaPg } from '@prisma/adapter-pg';
import { EventScope, EventType, PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

config({
  path: resolve(process.cwd(), envFile),
});

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`Не найден DATABASE_URL или DIRECT_URL в ${envFile}`);
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// ======================================================
// USERS / COUPLE
// ======================================================

const EVGEN_ID = 'cmthnoaut0000twzoav5p2sak';
const INNA_ID = 'cmthnpawb0003twzofegu8qw1';
const COUPLE_ID = 'cmthnpay90005twzoysty9ovv';

const SEED_PREFIX = '[SEED]';

// ======================================================
// DATA
// ======================================================

const PERSONAL_TITLES = [
  'Тренировка',
  'Рабочая встреча',
  'Созвон',
  'Врач',
  'Занятие',
  'Работа',
  'Дедлайн',
  'Обед',
  'Прогулка',
  'Велотренировка',
  'Покупки',
  'Важная задача',
];

const COUPLE_TITLES = [
  'Свидание',
  'Ужин вместе',
  'Кино',
  'Прогулка',
  'Поездка',
  'Наш вечер',
  'Ресторан',
  'Выходные вместе',
  'Покупки',
  'Отпуск',
  'День без телефонов',
  'Совместная тренировка',
  'Завтрак вместе',
  'Вечер дома',
];

const DESCRIPTIONS = [
  'Тестовое событие календаря',
  'Создано для проверки интерфейса',
  'Seed event',
  'Проверка отображения события',
  null,
];

// ======================================================
// HELPERS
// ======================================================

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  const timestamp =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());

  return new Date(timestamp);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function startOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function createEventDate(start: Date, end: Date): Date {
  const date = randomDate(start, end);

  date.setHours(randomInt(8, 21), randomItem([0, 15, 30, 45]), 0, 0);

  return date;
}

function randomEventType(): EventType {
  return randomItem([
    EventType.DATE,
    EventType.BIRTHDAY,
    EventType.ANNIVERSARY,
    EventType.OTHER,
  ]);
}

// ======================================================
// VALIDATION
// ======================================================

async function validateUsers(): Promise<void> {
  const [evgen, inna] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: EVGEN_ID,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: INNA_ID,
      },
    }),
  ]);

  if (!evgen) {
    throw new Error(`Evgen не найден: ${EVGEN_ID}`);
  }

  if (!inna) {
    throw new Error(`Inna не найдена: ${INNA_ID}`);
  }

  console.log(`Evgen: ${evgen.email}`);
  console.log(`Inna: ${inna.email}`);
}

async function validateCouple(): Promise<void> {
  const couple = await prisma.couple.findUnique({
    where: {
      id: COUPLE_ID,
    },
  });

  if (!couple) {
    throw new Error(`Couple не найдена: ${COUPLE_ID}`);
  }

  const members = await prisma.coupleMember.findMany({
    where: {
      coupleId: COUPLE_ID,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
  });

  console.log(`Couple: ${COUPLE_ID}`);
  console.log(`Members: ${members.length}`);

  for (const member of members) {
    console.log(`  - ${member.user.email}`);
  }
}

// ======================================================
// CLEAN OLD SEED DATA
// ======================================================

async function clearSeedEvents(): Promise<void> {
  const result = await prisma.event.deleteMany({
    where: {
      OR: [
        {
          title: {
            startsWith: SEED_PREFIX,
          },
        },
        {
          description: 'Seed event',
        },
      ],
    },
  });

  console.log(`Удалено старых seed-событий: ${result.count}`);
}

// ======================================================
// PERSONAL EVENTS
// ======================================================

async function createPersonalEvents(start: Date, end: Date, count: number) {
  const events = [];

  for (let index = 0; index < count; index += 1) {
    const startAt = createEventDate(start, end);

    const allDay = Math.random() < 0.2;

    const endAt = allDay
      ? null
      : addMinutes(startAt, randomItem([30, 60, 90, 120, 180]));

    const event = await prisma.event.create({
      data: {
        title: `${SEED_PREFIX} ${randomItem(PERSONAL_TITLES)}`,

        description: randomItem(DESCRIPTIONS),

        startAt,
        endAt,

        type: randomEventType(),

        scope: EventScope.PERSONAL,

        createdById: EVGEN_ID,

        userId: EVGEN_ID,
      },
    });

    events.push(event);
  }

  return events;
}

// ======================================================
// COUPLE EVENTS
// ======================================================

async function createCoupleEvents(start: Date, end: Date, count: number) {
  const events = [];

  for (let index = 0; index < count; index += 1) {
    const startAt = createEventDate(start, end);

    const allDay = Math.random() < 0.2;

    const endAt = allDay
      ? null
      : addMinutes(startAt, randomItem([60, 90, 120, 180, 240]));

    // Часть событий создаёт Evgen,
    // часть Inna.
    const createdById = Math.random() < 0.5 ? EVGEN_ID : INNA_ID;

    const event = await prisma.event.create({
      data: {
        title: `${SEED_PREFIX} ${randomItem(COUPLE_TITLES)}`,

        description: randomItem(DESCRIPTIONS),

        startAt,
        endAt,

        type: randomEventType(),

        scope: EventScope.COUPLE,

        createdById,

        coupleId: COUPLE_ID,
      },
    });

    events.push(event);
  }

  return events;
}

// ======================================================
// MAIN
// ======================================================

async function main(): Promise<void> {
  console.log('');
  console.log('=================================');
  console.log('       NIDIO CALENDAR SEED       ');
  console.log('=================================');
  console.log('');

  // Проверяем пользователей
  await validateUsers();

  // Проверяем пару
  await validateCouple();

  console.log('');

  // Удаляем предыдущие seed-события
  console.log('Удаляем старые seed-события...');

  await clearSeedEvents();

  // ====================================================
  // DATE RANGE
  // ====================================================

  const today = startOfDay(new Date());

  const from = new Date(today);
  from.setMonth(from.getMonth() - 1);

  const to = new Date(today);
  to.setMonth(to.getMonth() + 2);

  console.log('');

  console.log(`FROM: ${from.toISOString()}`);

  console.log(`TO:   ${to.toISOString()}`);

  console.log('');

  // ====================================================
  // PERSONAL
  // ====================================================

  console.log('Создаём PERSONAL events...');

  const personalEvents = await createPersonalEvents(from, to, 100);

  console.log(`Создано PERSONAL: ${personalEvents.length}`);

  console.log('');

  // ====================================================
  // COUPLE
  // ====================================================

  console.log('Создаём COUPLE events...');

  const coupleEvents = await createCoupleEvents(from, to, 100);

  console.log(`Создано COUPLE: ${coupleEvents.length}`);

  // ====================================================
  // RESULT
  // ====================================================

  console.log('');

  console.log('=================================');
  console.log('           COMPLETED             ');
  console.log('=================================');

  console.log('');

  console.log(`PERSONAL: ${personalEvents.length}`);

  console.log(`COUPLE:   ${coupleEvents.length}`);

  console.log(`TOTAL:    ${personalEvents.length + coupleEvents.length}`);

  console.log('');
}

// ======================================================
// RUN
// ======================================================

main()
  .catch((error: unknown) => {
    console.error('');
    console.error('SEED FAILED');
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
