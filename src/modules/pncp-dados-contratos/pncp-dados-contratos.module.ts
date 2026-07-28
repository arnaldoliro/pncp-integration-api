import { Module } from '@nestjs/common';
import { PncpDadosContratos } from './pncp-dados-contratos.service.js';

@Module({
  providers: [PncpDadosContratos],
  exports: [PncpDadosContratos],
})
export class PncpDadosContratosModule {}
