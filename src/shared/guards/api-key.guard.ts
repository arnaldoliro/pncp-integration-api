import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../../config/env.config.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || apiKey !== env.apiKey) {
      this.logger.warn(`Acesso negado: API Key inválida ou ausente`);
      throw new UnauthorizedException('API Key inválida ou ausente');
    }

    return true;
  }
}
