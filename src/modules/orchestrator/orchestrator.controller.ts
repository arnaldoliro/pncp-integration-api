import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OrchestratorService } from './orchestrator.service.js';
import { ServicoRequestDto } from '../../shared/types/servico-request.dto.js';
import type { OrchestratorResult } from '../../shared/types/orchestrator-result.js';
import { JwtSessionGuard } from '../../shared/guards/jwt-session.guard.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { DatabasePoolService } from '../database-discovery/database-pool.service.js';

type AuthRequest = Request & { database: string };

@Controller('servicos')
@UseGuards(JwtSessionGuard)
export class OrchestratorController {
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly servicosService: ServicosService,
    private readonly databasePool: DatabasePoolService,
  ) {}

  @Get()
  async listar(@Req() req: AuthRequest) {
    const db = await this.databasePool.obterDatabase(req.database);
    return this.servicosService.listar(db);
  }

  @Post()
  executar(@Req() req: AuthRequest, @Body() dto: ServicoRequestDto): Promise<OrchestratorResult> {
    return this.orchestratorService.executar(dto, req.database);
  }
}
