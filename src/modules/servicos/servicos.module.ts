import { Module } from '@nestjs/common';
import { ServicosService } from './servicos.service.js';

@Module({
  providers: [ServicosService],
  exports: [ServicosService],
})
export class ServicosModule {}
