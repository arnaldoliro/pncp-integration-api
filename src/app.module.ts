import { Module } from '@nestjs/common';
import { PncpClientModule } from './modules/pncp-client/pncp-client.module.js';
import { ServicosModule } from './modules/servicos/servicos.module.js';
import { PncpLogModule } from './modules/pncp-log/pncp-log.module.js';
import { ViewsReaderModule } from './modules/views-reader/views-reader.module.js';

@Module({
  imports: [PncpClientModule, ServicosModule, PncpLogModule, ViewsReaderModule],
})
export class AppModule {}
