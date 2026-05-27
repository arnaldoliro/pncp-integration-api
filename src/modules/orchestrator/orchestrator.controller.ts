import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service.js';
import { ServicoRequestDto } from '../../shared/types/servico-request.dto.js';
import type { OrchestratorResult } from '../../shared/types/orchestrator-result.js';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard.js';

@Controller('servicos')
@UseGuards(ApiKeyGuard)
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post()
  executar(@Body() dto: ServicoRequestDto): Promise<OrchestratorResult> {
    return this.orchestratorService.executar(dto);
  }
}
