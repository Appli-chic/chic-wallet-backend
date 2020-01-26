import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import LoginUserDTO from './validators/login-user-dto';
import User from '../users/user.entity';
import * as uuidv4 from 'uuid/v4';
import { TokensRepository } from './tokens.repository';
import Token from './tokens.entity';
import SignUpUserDTO from './validators/sign-up-user-dto';
import * as bcrypt from 'bcrypt';
import RefreshModelDTO from './validators/refresh-model-dto';

@Injectable()
export class AuthService {
  saltRounds = 10;

  constructor(
    private readonly tokensRepository: TokensRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      user.password = undefined;
      return user;
    }

    return null;
  }

  async signUp(user: SignUpUserDTO): Promise<any> {
    const userDb = await this.usersService.findOne(user.username);

    if (userDb) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hash = await bcrypt.hash(user.password, this.saltRounds);
    if (!hash) {
      throw new HttpException('Impossible to hash the password', HttpStatus.BAD_REQUEST);
    }

    // Save the new user
    const refreshToken = uuidv4();
    let newUser = new User(null, user.username, hash, [new Token(null, refreshToken)]);
    newUser = await this.usersService.save(newUser);

    const payload = { email: newUser.email, id: newUser.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async login(user: LoginUserDTO): Promise<any> {
    const userDb = await this.usersService.findOne(user.username);

    if (userDb && (await bcrypt.compare(user.password, userDb.password))) {
      let refreshToken;

      if (!userDb.tokens || userDb.tokens.length === 0) {
        // Create a refresh token in the database if it doesn't exist
        refreshToken = uuidv4();
        await this.tokensRepository.save(new Token(null, refreshToken, null, null, userDb));
      } else {
        // Get the first refresh token in the database
        refreshToken = userDb.tokens[0].key;
      }

      const payload = { email: user.username, id: userDb.id };
      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
      };
    }

    throw new HttpException('Email or password incorrect', HttpStatus.BAD_REQUEST);
  }

  async refresh(refreshModelDTO: RefreshModelDTO): Promise<any> {
    const refreshToken = await this.tokensRepository.getTokenFromKey(refreshModelDTO.refreshToken);

    if (!refreshToken) {
      throw new HttpException('Wrong token', HttpStatus.BAD_REQUEST);
    }

    const payload = { email: refreshToken.user.email, id: refreshToken.user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
