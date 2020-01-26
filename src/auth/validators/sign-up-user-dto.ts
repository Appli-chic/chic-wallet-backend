import { IsNotEmpty, IsEmail, Length } from 'class-validator';

export default class SignUpUserDTO {
  @IsEmail()
  username: string;

  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}
