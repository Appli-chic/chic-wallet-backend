import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import User from './user.entity';
import { EntityRepository } from 'typeorm';
import { UsersRepository } from './users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';

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

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('find one - user exists', async () => {
    expect(await service.findOne('test1@gmail.com')).toBeDefined();
    expect(await service.findOne('test1@gmail.com')).toBe(userInDb);
  });

  it("find one - user does't exist", async () => {
    expect(await service.findOne('test2@gmail.com')).toBeNull();
  });
});
