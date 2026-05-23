import { Module } from '@nestjs/common';
import { PncpLogService } from './pncp-log.service.js';

@Module({
  providers: [PncpLogService],
  exports: [PncpLogService],
})
export class PncpLogModule {}
