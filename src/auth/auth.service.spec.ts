import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import User from '../users/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import LoginUserDTO from './validators/login-user-dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export class UsersRepositoryMock extends UsersRepository {
  findByUsername(username: string): Promise<User> {
    if (username === 'test1@gmail.com') {
      return Promise.resolve<User>(new User(0, 'test1@gmail.com', 'test1'));
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
          provide: UsersRepository,
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
    expect(await authService.validateUser('test1@gmail.com', 'test1')).toStrictEqual(new User(0, 'test1@gmail.com'));
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
});
