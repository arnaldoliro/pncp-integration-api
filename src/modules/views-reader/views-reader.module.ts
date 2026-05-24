import { Module } from '@nestjs/common';
import { ViewsReaderService } from './views-reader.service.js';

@Module({
  providers: [ViewsReaderService],
  exports: [ViewsReaderService],
})
export class ViewsReaderModule {}
