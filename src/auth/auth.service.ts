import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import LoginUserDTO from './validators/login-user-dto';
import User from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      user.password = undefined;
      return user;
    }

    return null;
  }

  async login(user: LoginUserDTO): Promise<{ access_token: string }> {
    const payload = { email: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
