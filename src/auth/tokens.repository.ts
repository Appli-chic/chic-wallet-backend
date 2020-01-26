import { EntityRepository, Repository } from 'typeorm';
import Token from './tokens.entity';

@EntityRepository(Token)
export class TokensRepository extends Repository<Token> {
  getTokenFromKey(key: string): Promise<Token> {
    return this.findOne({
      relations: ['user'],
      where: { key },
    });
  }
}
