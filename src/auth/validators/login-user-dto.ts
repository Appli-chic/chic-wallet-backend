import { IsNotEmpty, IsEmail } from 'class-validator';

export default class LoginUserDTO {
  @IsEmail()
  username: string;

  @IsNotEmpty()
  password: string;
}
