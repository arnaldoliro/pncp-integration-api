import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ServicoRequestDto {
  @IsString()
  @IsNotEmpty()
  tel_descricao_servico: string;

  @IsString()
  @IsNotEmpty()
  ORG_COD: string;

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
