import { NestFactory } from '@nestjs/core';
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

  await app.listen(3000);

  // Hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      app.close();
    });
  }
}

bootstrap();
