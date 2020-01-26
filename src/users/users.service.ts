import { Injectable } from '@nestjs/common';
import User from '../users/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(email: string): Promise<User | undefined> {
    return this.usersRepository.findByUsername(email);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
