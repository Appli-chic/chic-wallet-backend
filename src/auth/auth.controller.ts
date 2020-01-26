import { Controller, Body, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import LoginUserDTO from './validators/login-user-dto';
import SignUpUserDTO from './validators/sign-up-user-dto';
import RefreshModelDTO from './validators/refresh-model-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  async login(@Body() loginUserDTO: LoginUserDTO) {
    return this.authService.login(loginUserDTO);
  }

  @HttpCode(201)
  @Post('signup')
  async signUp(@Body() signUpUserDTO: SignUpUserDTO) {
    return this.authService.signUp(signUpUserDTO);
  }

  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() refreshModelDTO: RefreshModelDTO) {
    return this.authService.refresh(refreshModelDTO);
  }
}
