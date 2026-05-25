import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service.js';
import { OrchestratorController } from './orchestrator.controller.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import { ViewsReaderModule } from '../views-reader/views-reader.module.js';
import { PncpClientModule } from '../pncp-client/pncp-client.module.js';
import { PncpLogModule } from '../pncp-log/pncp-log.module.js';
import { PncpDadosContratacoesModule } from '../pncp-dados-contratacoes/pncp-dados-contratacoes.module.js';

@Module({
  imports: [ServicosModule, ViewsReaderModule, PncpClientModule, PncpLogModule, PncpDadosContratacoesModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
})
export class OrchestratorModule {}
