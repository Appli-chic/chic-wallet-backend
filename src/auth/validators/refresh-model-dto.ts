import { IsNotEmpty } from 'class-validator';

export default class RefreshModelDTO {
  @IsNotEmpty()
  refreshToken: string;
}
