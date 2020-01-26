import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import LoginUserDTO from './validators/login-user-dto';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import User from '../users/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { TokensRepository } from './tokens.repository';
import { DeepPartial, SaveOptions } from 'typeorm';
import Token from './tokens.entity';
import SignUpUserDTO from './validators/sign-up-user-dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import RefreshModelDTO from './validators/refresh-model-dto';

const userInDb = new User(0, 'test1@gmail.com', 'test1');

class UsersRepositoryMock extends UsersRepository {
  findByUsername(username: string): Promise<User> {
    if (username === 'test1@gmail.com') {
      return Promise.resolve<User>(userInDb);
    }

    return null;
  }
}

class TokensRepositoryMock extends TokensRepository {
  save<T extends DeepPartial<Token>>(entities: T[], options: SaveOptions & { reload: false }): Promise<T[]> {
    return Promise.resolve(entities);
  }
}

const usersRepositoryMock = new UsersRepositoryMock();
const tokensRepositoryMock = new TokensRepositoryMock();

const resultError = {
  statusCode: 400,
  message: 'Email or password incorrect',
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secretOrPrivateKey: 'secretKey',
          signOptions: {
            expiresIn: 3600,
          },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
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

    authService = app.get<AuthService>(AuthService);
    authController = app.get<AuthController>(AuthController);
  });

  it('Login', async () => {
    const result = {
      access_token: 'accessTokenToRetrieve',
      refresh_token: 'refreshTokenToRetrieve',
    };

    jest.spyOn(authService, 'login').mockImplementation(async () => result);

    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test1';

    expect(await authController.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toHaveProperty('access_token');
    expect(await authService.login(loginUserDTO)).toHaveProperty('refresh_token');
    expect(await authService.login(loginUserDTO)).toBe(result);
  });

  it('Signup', async () => {
    const result = {
      access_token: 'accessTokenToRetrieve',
      refresh_token: 'refreshTokenToRetrieve',
    };

    jest.spyOn(authService, 'signUp').mockImplementation(async () => result);

    const signUpUserDTO = new SignUpUserDTO();
    signUpUserDTO.username = 'test2@gmail.com';
    signUpUserDTO.password = 'test2';

    expect(await authController.signUp(signUpUserDTO)).toBeDefined();
    expect(await authService.signUp(signUpUserDTO)).toHaveProperty('access_token');
    expect(await authService.signUp(signUpUserDTO)).toHaveProperty('refresh_token');
    expect(await authService.signUp(signUpUserDTO)).toBe(result);
  });

  it('Signup - User already exists', async () => {
    const result = new HttpException('User already exists', HttpStatus.BAD_REQUEST);

    jest.spyOn(authService, 'signUp').mockImplementation(async () => result);

    const signUpUserDTO = new SignUpUserDTO();
    signUpUserDTO.username = 'test1@gmail.com';
    signUpUserDTO.password = 'test6000';

    expect(await authController.signUp(signUpUserDTO)).toBeDefined();
    expect(await authService.signUp(signUpUserDTO)).toBe(result);
  });

  it('Login - wrong email', async () => {
    jest.spyOn(authService, 'login').mockImplementation(async () => resultError);

    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test2@gmail.com';
    loginUserDTO.password = 'test1';

    expect(await authController.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toBe(resultError);
  });

  it('Login - wrong password', async () => {
    jest.spyOn(authService, 'login').mockImplementation(async () => resultError);

    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test2';

    expect(await authController.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toBe(resultError);
  });

  it('Login - wrong email and password', async () => {
    jest.spyOn(authService, 'login').mockImplementation(async () => resultError);

    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test2@gmail.com';
    loginUserDTO.password = 'test2';

    expect(await authController.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toBe(resultError);
  });

  it('Refresh', async () => {
    const resultRefresh = new Token(
      0,
      '110e8400-e29b-11d4-a716-446655440000',
      null,
      null,
      new User(0, 'test1@gmail.com', '$2b$10$QSehCA70YZQv0Si.PjUyUuxeFZRKTzE3NNgVziEy9xb55kcH3EBBG'),
    );

    jest.spyOn(authService, 'refresh').mockImplementation(async () => resultRefresh);

    const refreshModelDTO = new RefreshModelDTO();
    refreshModelDTO.refreshToken = '110e8400-e29b-11d4-a716-446655440000';

    expect(await authController.refresh(refreshModelDTO)).toBeDefined();
    expect(await authService.refresh(refreshModelDTO)).toBe(resultRefresh);
  });

  it('Refresh - wrong refresh token', async () => {
    const resultErrorRefresh = {
      statusCode: 400,
      message: 'Wrong token',
    };

    jest.spyOn(authService, 'refresh').mockImplementation(async () => resultErrorRefresh);

    const refreshModelDTO = new RefreshModelDTO();
    refreshModelDTO.refreshToken = '110e8400-e29b-11d4-a716-446655440000';

    expect(await authController.refresh(refreshModelDTO)).toBeDefined();
    expect(await authService.refresh(refreshModelDTO)).toBe(resultErrorRefresh);
  });
});
