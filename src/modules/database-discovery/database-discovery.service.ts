import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Kysely, MssqlDialect, sql } from 'kysely';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';
import { env, type ServerConfig } from '../../config/env.config.js';

@Injectable()
export class DatabaseDiscoveryService {
  private readonly logger = new Logger(DatabaseDiscoveryService.name);
  private readonly cache = new Map<string, { config: ServerConfig; at: number }>();
  private readonly TTL = 60 * 60 * 1000; // 1h

  async encontrarConexao(databaseName: string): Promise<ServerConfig> {
    const cached = this.cache.get(databaseName);
    if (cached && Date.now() - cached.at < this.TTL) {
      return cached.config;
    }

    let successfulProbes = 0;

    for (const serverConfig of env.servers) {
      const tempDb = new Kysely<Record<string, never>>({
        dialect: new MssqlDialect({
          tarn: {
            ...Tarn,
            options: { min: 1, max: 1 },
          },
          tedious: {
            ...Tedious,
            connectionFactory: () =>
              new Tedious.Connection({
                server: serverConfig.server,
                authentication: {
                  type: 'default',
                  options: {
                    userName: serverConfig.user,
                    password: serverConfig.password,
                  },
                },
                options: {
                  port: serverConfig.port,
                  database: 'master',
                  encrypt: serverConfig.encrypt,
                  trustServerCertificate: serverConfig.trustServerCert,
                },
              }),
          },
        }),
      });

      try {
        const result = await sql<{ name: string }>`
          SELECT TOP 1 name FROM sys.databases WHERE name = ${databaseName}
        `.execute(tempDb);

        await tempDb.destroy();
        successfulProbes++;

        if (result.rows.length > 0) {
          this.cache.set(databaseName, { config: serverConfig, at: Date.now() });
          return serverConfig;
        }
      } catch (err) {
        this.logger.warn(`Falha ao conectar em ${serverConfig.server}: ${(err as Error).message}`);
        try {
          await tempDb.destroy();
        } catch {
          // ignorar erros ao destruir pool com falha
        }
      }
    }

    if (successfulProbes === 0) {
      throw new InternalServerErrorException(
        'Erro ao conectar aos servidores para descobrir database',
      );
    }

    throw new BadRequestException(
      `Database '${databaseName}' não encontrado em nenhum servidor configurado`,
    );
  }
}
