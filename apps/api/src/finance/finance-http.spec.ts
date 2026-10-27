/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AuthService } from '../auth/auth.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategies';
import { StorageController } from '../storage/storage.controller';
import { StorageService } from '../storage/storage.service';

import { CardImageController } from './card-image.controller';
import { FinanceAccess } from './finance-access.service';
import { FinanceReadController } from './finance-read.controller';
import { FinanceReadService } from './finance-read.service';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';

describe('finance HTTP authentication, validation and image isolation', () => {
  let app: INestApplication;
  const secret = 'finance-test-only-secret';
  const jwt = new JwtService({ secret });
  const token = (user = 'alice', type = 'access') =>
    jwt.sign({ sub: user, type }, { expiresIn: '5m' });
  const reads = {
    section: jest.fn(async () => ({ cards: [] })),
    budget: jest.fn(async () => ({ items: [] })),
  };
  const savings = {
    save: jest.fn(async () => ({ id: 'goal-a' })),
    entry: jest.fn(),
    remove: jest.fn(),
  };
  const storage = {
    getObject: jest.fn(async () => ({
      Body: { transformToByteArray: async () => Buffer.from('image') },
      ContentType: 'image/png',
    })),
  };
  const access = {
    read: async (user: string, fn: (db: unknown, couple: string) => unknown) =>
      fn(
        {
          loyaltyCard: {
            findFirst: async ({
              where,
            }: {
              where: { id: string; coupleId: string };
            }) =>
              where.coupleId === 'pair-a' && where.id === 'card-a'
                ? { imageKey: 'finance/pair-a/image.png' }
                : null,
          },
        },
        user === 'alice' ? 'pair-a' : 'pair-b',
      ),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        FinanceReadController,
        SavingsController,
        CardImageController,
        StorageController,
      ],
      providers: [
        JwtStrategy,
        { provide: FinanceReadService, useValue: reads },
        {
          provide: AuthService,
          useValue: { validate: async (id: string) => ({ id }) },
        },
        { provide: ConfigService, useValue: { getOrThrow: () => secret } },
        { provide: SavingsService, useValue: savings },
        { provide: FinanceAccess, useValue: access },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('authenticates and validates section/history queries', async () => {
    await request(app.getHttpServer())
      .get('/finance/sections/cards')
      .expect(401);
    await request(app.getHttpServer())
      .get('/finance/sections/cards')
      .set('Authorization', `Bearer ${token()}`)
      .expect(200)
      .expect('Cache-Control', 'private, no-store');
    expect(reads.section).toHaveBeenCalledWith('alice', 'cards');
    await request(app.getHttpServer())
      .get('/finance/budget')
      .set('Authorization', `Bearer ${token()}`)
      .query({ currency: 'invalid', start: 'oops', end: 'oops', month: 'oops' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/finance/budget')
      .set('Authorization', `Bearer ${token()}`)
      .query({
        currency: 'EUR',
        start: '2026-10-01',
        end: '2026-10-31',
        month: '2026-10',
        coupleId: 'pair-b',
      })
      .expect(400);
    expect(reads.budget).not.toHaveBeenCalled();
  });
  it('rejects missing authentication and refresh tokens', async () => {
    await request(app.getHttpServer())
      .post('/finance/goals')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post('/finance/goals')
      .set('Authorization', `Bearer ${token('alice', 'refresh')}`)
      .send({})
      .expect(401);
  });
  it('rejects arbitrary couple identifiers and malformed amounts', async () => {
    await request(app.getHttpServer())
      .post('/finance/goals')
      .set('Authorization', `Bearer ${token()}`)
      .send({ coupleId: 'pair-b', targetMinor: -1 })
      .expect(400);
    expect(savings.save).not.toHaveBeenCalled();
  });
  it('uses the authenticated author, not a client-supplied user', async () => {
    const data = {
      title: 'Отпуск',
      description: '',
      targetMinor: 1000,
      currency: 'EUR',
      icon: '🎯',
      color: 'primary',
      targetDate: null,
    };
    await request(app.getHttpServer())
      .post('/finance/goals')
      .set('Authorization', `Bearer ${token()}`)
      .send(data)
      .expect(201);
    expect(savings.save).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining(data),
    );
  });
  it('serves images only to the owning couple and disables caching', async () => {
    await request(app.getHttpServer())
      .get('/finance/cards/card-a/image')
      .set('Authorization', `Bearer ${token()}`)
      .expect(200)
      .expect('Cache-Control', 'private, no-store');
    storage.getObject.mockClear();
    await request(app.getHttpServer())
      .get('/finance/cards/card-a/image')
      .set('Authorization', `Bearer ${token('other')}`)
      .expect(404);
    expect(storage.getObject).not.toHaveBeenCalled();
  });
  it('blocks the generic image route from bypassing finance access checks', async () => {
    await request(app.getHttpServer())
      .get('/storage/images/finance%2Fpair-a%2Fimage.png')
      .set('Authorization', `Bearer ${token('other')}`)
      .expect(400);
    expect(storage.getObject).not.toHaveBeenCalled();
  });
});
