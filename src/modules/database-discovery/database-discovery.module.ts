import { Module } from '@nestjs/common';
import { DatabaseDiscoveryService } from './database-discovery.service.js';
import { DatabasePoolService } from './database-pool.service.js';

@Module({
  providers: [DatabaseDiscoveryService, DatabasePoolService],
  exports: [DatabasePoolService],
})
export class DatabaseDiscoveryModule {}
