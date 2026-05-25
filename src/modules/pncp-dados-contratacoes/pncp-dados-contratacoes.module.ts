import { Module } from '@nestjs/common';
import { PncpDadosContratacoes } from './pncp-dados-contratacoes.service.js';

@Module({
  providers: [PncpDadosContratacoes],
  exports: [PncpDadosContratacoes],
})
export class PncpDadosContratacoesModule {}
