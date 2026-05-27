import { IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ServicoRequestDto {
  @IsInt()
  @IsNotEmpty()
  usuario!: number;

  @IsString()
  @IsNotEmpty()
  tel_descricao_servico!: string;

  @IsNumberString()
  @IsNotEmpty()
  ORG_COD!: string;

  @IsString()
  @IsNotEmpty()
  database!: string;

  @IsString()
  @IsOptional()
  LIC_COD?: string;

  @IsOptional()
  @ValidateIf((o: ServicoRequestDto) => o.ID2 !== null)
  @IsString()
  ID2?: string | null;

  @IsString()
  @IsOptional()
  justificativa?: string;
}
