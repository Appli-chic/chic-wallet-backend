import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  let correctRefreshToken: string;

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

    // Add a user
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'test@test.com',
        password: 'test6000',
      })
      .expect(res => {
        correctRefreshToken = res.body.refresh_token;
      });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/refresh (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: correctRefreshToken,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        if (!res.body) {
          throw new Error();
        }

        if (!res.body.access_token) {
          throw new Error();
        }
      });
  });

  it('/auth/refresh (POST) - wrong refresh token', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: '3fe852e5-1290-4ebc-aae4-b470b6ab7e03',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.message !== 'Wrong token') {
          throw new Error();
        }
      });
  });

  it('/auth/refresh (POST) - no refresh token', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send()
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.message.length !== 1) {
          throw new Error();
        }
      });
  });

  it('/auth/signup (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'test6000@test.com',
        password: 'test6000',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .expect(res => {
        if (!res.body) {
          throw new Error();
        }

        if (!res.body.access_token || !res.body.refresh_token) {
          throw new Error();
        }
      });
  });

  it('/auth/signup (POST) - User already exists', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'test6000@test.com',
        password: 'test6000',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.message !== 'User already exists') {
          throw new Error();
        }
      });
  });

  it('/auth/signup (POST) - Password too short', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'test@test.com',
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

  it('/auth/signup (POST) - Email incorrect', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'test6000test.com',
        password: 'test600',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        if (res.body.statusCode !== 400 || res.body.error !== 'Bad Request' || res.body.message.length !== 1) {
          throw new Error();
        }
      });
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@test.com',
        password: 'test6000',
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
