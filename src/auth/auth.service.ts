import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import LoginUserDTO from './validators/login-user-dto';
import User from '../users/user.entity';
import * as uuidv4 from 'uuid/v4';
import { TokensRepository } from './tokens.repository';
import Token from './tokens.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokensRepository: TokensRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      user.password = undefined;
      return user;
    }

    return null;
  }

  async login(user: LoginUserDTO): Promise<any> {
    const userDb = await this.usersService.findOne(user.username);

    if (userDb && userDb.password === user.password) {
      let refreshToken;

      if (!userDb.tokens || userDb.tokens.length === 0) {
        // Create a refresh token if non exists
        refreshToken = uuidv4();
        await this.tokensRepository.save(new Token(null, refreshToken, null, null, userDb));
      } else {
        // Get the first refresh token in the database
        refreshToken = userDb.tokens[0].key;
      }

      const payload = { email: user.username };
      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
      };
    }

    throw new HttpException('Email or password incorrect', HttpStatus.BAD_REQUEST);
  }
}
