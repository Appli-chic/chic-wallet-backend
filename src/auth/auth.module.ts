import {Module} from '@nestjs/common';
import {AuthController} from './auth.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import User from './entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
})
export class AuthModule {
}
