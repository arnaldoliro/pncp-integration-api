import { IsNotEmpty, IsString } from 'class-validator';

export class TrocarTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
