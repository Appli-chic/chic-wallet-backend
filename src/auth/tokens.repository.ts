import { DeepPartial, EntityRepository, Repository, SaveOptions } from 'typeorm';
import Token from './tokens.entity';

@EntityRepository(Token)
export class TokensRepository extends Repository<Token> {
  // findByUsername(username: string): Promise<Token[]> {
  //   return this.find({
  //     where: { email: username, relations: ['user'] },
  //   });
  // }
}
