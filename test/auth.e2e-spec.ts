import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());

    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@test.com',
        password: 'test',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        if (!res.body) {
          throw new Error();
        }

        if (!res.body.access_token || !res.body.refresh_token) {
          throw new Error();
        }
      });
  });

  it('/auth/login (POST) - wrong email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@test2.com',
        password: 'test',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Email or password incorrect',
      });
  });

  it('/auth/login (POST) - wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@test.com',
        password: 'test2',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Email or password incorrect',
      });
  });

  it('/auth/login (POST) - wrong email and password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test2@test.com',
        password: 'test2',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Email or password incorrect',
      });
  });

  it('/auth/login (POST) - no username', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        password: 'test',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.error !== 'Bad Request' || res.body.message.length !== 1) {
          throw new Error();
        }
      });
  });

  it('/auth/login (POST) - no password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@test.com',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.error !== 'Bad Request' || res.body.message.length !== 1) {
          throw new Error();
        }
      });
  });

  it('/auth/login (POST) - no data', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send()
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.error !== 'Bad Request' || res.body.message.length !== 2) {
          throw new Error();
        }
      });
  });
});
