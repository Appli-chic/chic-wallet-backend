import { EntityRepository, Repository } from 'typeorm';
import User from './user.entity';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  findByUsername(username: string): Promise<User> {
    return this.findOne({
      relations: ['tokens'],
      where: { email: username },
    });
  }
}
