import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { DatabasePoolService } from '../../modules/database-discovery/database-pool.service.js';

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databasePool: DatabasePoolService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { database: string }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de sessão ausente');
    }

    const token = authHeader.slice(7);

    const decoded = this.jwtService.decode<{ database?: string }>(token);
    if (!decoded?.database) {
      throw new UnauthorizedException('Token de sessão inválido');
    }

    const db = await this.databasePool.obterDatabase(decoded.database);
    const controle = await db
      .selectFrom('PNCP_CONTROLE_DADOS')
      .select('con_jwt_secret')
      .executeTakeFirst();

    if (!controle?.con_jwt_secret) {
      throw new UnauthorizedException('Configuração JWT ausente');
    }

    try {
      this.jwtService.verify(token, { secret: controle.con_jwt_secret });
    } catch {
      throw new UnauthorizedException('Token de sessão inválido ou expirado');
    }

    request.database = decoded.database;
    return true;
  }
}
