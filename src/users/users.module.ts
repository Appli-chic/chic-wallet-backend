import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UserRepository } from './users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserRepository])],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}
