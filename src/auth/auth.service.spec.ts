import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import User from '../users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EntityRepository } from 'typeorm';
import { UsersRepository } from '../users/users.repository';
import LoginUserDTO from './validators/login-user-dto';

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
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('validate user - right login details', async () => {
    expect(await authService.validateUser('test1@gmail.com', 'test1')).toBe(userInDb);
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

  it('login', async () => {
    const loginUserDTO = new LoginUserDTO();
    loginUserDTO.username = 'test1@gmail.com';
    loginUserDTO.password = 'test1';

    expect(await authService.login(loginUserDTO)).toBeDefined();
    expect(await authService.login(loginUserDTO)).toHaveProperty('access_token');
  });
});
