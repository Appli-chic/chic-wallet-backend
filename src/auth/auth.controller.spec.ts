import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import LoginUserDTO from './validators/login-user-dto';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import User from '../users/user.entity';
import { EntityRepository } from 'typeorm';
import { UsersRepository } from '../users/users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';

const userInDb = new User(0, 'test1@gmail.com', 'test1');

@EntityRepository(User)
export class UsersRepositoryMock extends UsersRepository {
  findByUsername(username: string): Promise<User> {
    if (username === 'test1@gmail.com') {
      return Promise.resolve<User>(userInDb);
    }

    return null;
  }
}

const mockRepository = new UsersRepositoryMock();

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
        LocalStrategy,
        UsersService,
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    authController = app.get<AuthController>(AuthController);
  });

  describe('root', () => {
    it('Login', async () => {
      const result = {
        access_token: 'accessTokenToRetrieve',
      };
      jest.spyOn(authService, 'login').mockImplementation(async () => result);

      const loginUserDTO = new LoginUserDTO();
      loginUserDTO.username = 'gbelouin@applichic.com';
      loginUserDTO.password = 'mym2yr';

      expect(await authController.login(loginUserDTO)).toBeDefined();
      expect(await authService.login(loginUserDTO)).toHaveProperty('access_token');
      expect(await authService.login(loginUserDTO)).toBe(result);
    });
  });
});
