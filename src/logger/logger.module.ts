import { Module } from '@nestjs/common';
import { ChicLogger } from './chic-logger';

@Module({
  providers: [ChicLogger],
  exports: [ChicLogger],
})
export class LoggerModule {}
