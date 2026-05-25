import { Module } from '@nestjs/common';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module.js';

@Module({
  imports: [OrchestratorModule],
})
export class AppModule {}
