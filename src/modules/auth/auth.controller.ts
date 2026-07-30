import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabasePoolService } from '../database-discovery/database-pool.service.js';
import { TrocarTokenDto } from './trocar-token.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databasePool: DatabasePoolService,
  ) {}

  @Post('sessao')
  async trocarToken(@Body() dto: TrocarTokenDto): Promise<{ token: string }> {
    const decoded = this.jwtService.decode<{ database?: string }>(dto.token);
    if (!decoded?.database) {
      throw new UnauthorizedException('Token inválido');
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
      this.jwtService.verify(dto.token, { secret: controle.con_jwt_secret });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const sessionToken = this.jwtService.sign(
      { database: decoded.database },
      { secret: controle.con_jwt_secret, expiresIn: '1h' },
    );

    return { token: sessionToken };
  }
}
