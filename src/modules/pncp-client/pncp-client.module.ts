import { Module } from '@nestjs/common';
import { PncpHttpClient } from './pncp-http-client.service.js';

@Module({
  providers: [PncpHttpClient],
  exports: [PncpHttpClient],
})
export class PncpClientModule {}
