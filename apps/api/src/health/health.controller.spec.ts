import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { HealthController } from './health.controller';

describe('public health endpoint', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
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
  it('also accepts HEAD probes', async () => {
    await request(app.getHttpServer()).head('/health').expect(200);
  });
});
