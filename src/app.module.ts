import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module.js';

@Module({
  imports: [AuthModule, OrchestratorModule],
})
export class AppModule {}
