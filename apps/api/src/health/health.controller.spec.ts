import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';

import { HealthController } from './health.controller';
import { ReadinessController } from './readiness.controller';

describe('public health endpoint', () => {
  let app: INestApplication;
  const database = { $transaction: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController, ReadinessController],
      providers: [{ provide: PrismaService, useValue: database }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('responds without authentication or database access and is not cached', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({ status: 'ok' });
  });
  it('checks database readiness independently from liveness', async () => {
    database.$transaction.mockResolvedValueOnce(undefined);
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({ status: 'ok', database: 'ok' });
    database.$transaction.mockRejectedValueOnce(
      new Error('private database error'),
    );
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(503);
    expect(response.text).not.toContain('private database error');
    await request(app.getHttpServer()).get('/health').expect(200);
  });
  it('also accepts HEAD probes', async () => {
    await request(app.getHttpServer()).head('/health').expect(200);
  });
});
