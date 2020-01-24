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

const userInDb = new User(0, 'test1@gmail.com', 'test1');

export class UsersRepositoryMock extends UsersRepository {
  findByUsername(username: string): Promise<User> {
    if (username === 'test1@gmail.com') {
      return Promise.resolve<User>(userInDb);
    }

    return null;
  }
}

const mockRepository = new UsersRepositoryMock();

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
          useValue: mockRepository,
        },
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    authController = app.get<AuthController>(AuthController);
  });

  it('Login', async () => {
    const result = {
      access_token: 'accessTokenToRetrieve',
    };

    jest.spyOn(authService, 'login').mockImplementation(async () => result);

    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test1';

    expect(await authController.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toHaveProperty('access_token');
    expect(await authService.login(loginUserDTO)).toBe(result);
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
});
