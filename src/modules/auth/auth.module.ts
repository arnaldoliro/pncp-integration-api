import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { DatabaseDiscoveryModule } from '../database-discovery/database-discovery.module.js';

@Global()
@Module({
  imports: [JwtModule.register({}), DatabaseDiscoveryModule],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
