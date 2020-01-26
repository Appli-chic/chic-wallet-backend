import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import User from '../users/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import LoginUserDTO from './validators/login-user-dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TokensRepository } from './tokens.repository';
import Token from './tokens.entity';
import { DeepPartial, SaveOptions } from 'typeorm';
import SignUpUserDTO from './validators/sign-up-user-dto';
import RefreshModelDTO from './validators/refresh-model-dto';

class UsersRepositoryMock extends UsersRepository {
  save<T extends DeepPartial<User>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]> {
    return Promise.resolve(entities);
  }

  findByUsername(username: string): Promise<User> {
    if (username === 'test1@gmail.com') {
      return Promise.resolve<User>(
        new User(0, 'test1@gmail.com', '$2b$10$QSehCA70YZQv0Si.PjUyUuxeFZRKTzE3NNgVziEy9xb55kcH3EBBG'),
      );
    }

    return null;
  }
}

class TokensRepositoryMock extends TokensRepository {
  save<T extends DeepPartial<Token>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]> {
    return Promise.resolve(entities);
  }

  getTokenFromKey(key: string): Promise<Token> {
    if (key === '110e8400-e29b-11d4-a716-446655440000') {
      return Promise.resolve(
        new Token(
          0,
          '110e8400-e29b-11d4-a716-446655440000',
          null,
          null,
          new User(0, 'test1@gmail.com', '$2b$10$QSehCA70YZQv0Si.PjUyUuxeFZRKTzE3NNgVziEy9xb55kcH3EBBG'),
        ),
      );
    }

    return null;
  }
}

const usersRepositoryMock = new UsersRepositoryMock();
const tokensRepositoryMock = new TokensRepositoryMock();

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secretOrPrivateKey: 'secretKey',
          signOptions: {
            expiresIn: 3600,
          },
        }),
      ],
      providers: [
        JwtStrategy,
        UsersService,
        AuthService,
        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },
        {
          provide: TokensRepository,
          useValue: tokensRepositoryMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('validate user - right login details', async () => {
    expect(await authService.validateUser('test1@gmail.com', 'test6000')).toStrictEqual(new User(0, 'test1@gmail.com'));
  });

  it('validate user - wrong email', async () => {
    expect(await authService.validateUser('test2@gmail.com', 'test1')).toBeNull();
  });

  it('validate user - wrong password', async () => {
    expect(await authService.validateUser('test1@gmail.com', 'test2')).toBeNull();
  });

  it('validate user - wrong email and password', async () => {
    expect(await authService.validateUser('test2@gmail.com', 'test2')).toBeNull();
  });

  it('sign up', async () => {
    const signUpUserDTO = new SignUpUserDTO();
    signUpUserDTO.username = 'test5@gmail.com';
    signUpUserDTO.password = 'test5';

    expect(await authService.signUp(signUpUserDTO)).toBeDefined();
    expect(await authService.signUp(signUpUserDTO)).toHaveProperty('access_token');
    expect(await authService.signUp(signUpUserDTO)).toHaveProperty('refresh_token');
  });

  it('sign up - user already exists', async () => {
    const signUpUserDTO = new SignUpUserDTO();
    signUpUserDTO.username = 'test1@gmail.com';
    signUpUserDTO.password = 'test1';

    await expect(authService.signUp(signUpUserDTO)).rejects.toEqual(
      new HttpException('User already exists', HttpStatus.BAD_REQUEST),
    );
  });

  it('login', async () => {
    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test6000';

    expect(await authService.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toHaveProperty('access_token');
    expect(await authService.login(loginUserDTO)).toHaveProperty('refresh_token');
  });

  it('login - wrong email', async () => {
    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test2@gmail.com';
    loginUserDTO.password = 'test1';

    await expect(authService.login(loginUserDTO)).rejects.toEqual(
      new HttpException('Email or password incorrect', HttpStatus.BAD_REQUEST),
    );
  });

  it('login - wrong password', async () => {
    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test2';

    await expect(authService.login(loginUserDTO)).rejects.toEqual(
      new HttpException('Email or password incorrect', HttpStatus.BAD_REQUEST),
    );
  });

  it('login - wrong email and password', async () => {
    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test2@gmail.com';
    loginUserDTO.password = 'test2';

    await expect(authService.login(loginUserDTO)).rejects.toEqual(
      new HttpException('Email or password incorrect', HttpStatus.BAD_REQUEST),
    );
  });

  it('refresh', async () => {
    const refreshModelDTO = new RefreshModelDTO();
    refreshModelDTO.refreshToken = '110e8400-e29b-11d4-a716-446655440000';

    expect(await authService.refresh(refreshModelDTO)).toBeDefined();
    expect(await authService.refresh(refreshModelDTO)).toHaveProperty('access_token');
  });

  it('refresh - wrong refresh token', async () => {
    const refreshModelDTO = new RefreshModelDTO();
    refreshModelDTO.refreshToken = '3fe852e5-1290-4ebc-aae4-b470b6ab7e03';

    await expect(authService.refresh(refreshModelDTO)).rejects.toEqual(
      new HttpException('Wrong token', HttpStatus.BAD_REQUEST),
    );
  });
});
