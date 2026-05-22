import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ServicoRequestDto {
  @IsString()
  @IsNotEmpty()
  entidade: string;

  @IsString()
  @IsNotEmpty()
  orgaoId: string;

  @IsString()
  @IsOptional()
  id?: string;
}
