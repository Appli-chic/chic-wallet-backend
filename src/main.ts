import { getConnection } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  // OpenAPI
  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription("Application's API")
    .setVersion('1.0')
    .addTag('/api')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

  // Hot reload
  if (module.hot) {
    const connection = getConnection();
    if (connection.isConnected) {
      await connection.close();
    }
    module.hot.accept();
    module.hot.dispose(async () => {
      app.close();
    });
  }
}

bootstrap();
