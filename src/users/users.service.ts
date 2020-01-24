import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from '../users/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: UsersRepository,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    return this.usersRepository.findByUsername(email);
  }
}
