import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, MssqlDialect } from 'kysely';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';
import type { Database } from '../../database/connection.js';
import { DatabaseDiscoveryService } from './database-discovery.service.js';

@Injectable()
export class DatabasePoolService implements OnModuleDestroy {
  private readonly pools = new Map<string, Kysely<Database>>();
  private readonly pending = new Map<string, Promise<Kysely<Database>>>();

  constructor(private readonly discovery: DatabaseDiscoveryService) {}

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([...this.pools.values()].map((db) => db.destroy()));
    this.pools.clear();
  }

  async obterDatabase(databaseName: string): Promise<Kysely<Database>> {
    const existing = this.pools.get(databaseName);
    if (existing) return existing;

    const inFlight = this.pending.get(databaseName);
    if (inFlight) return inFlight;

    const promise = this.criarPool(databaseName);
    this.pending.set(databaseName, promise);
    try {
      const db = await promise;
      this.pools.set(databaseName, db);
      return db;
    } finally {
      this.pending.delete(databaseName);
    }
  }

  private async criarPool(databaseName: string): Promise<Kysely<Database>> {
    const serverConfig = await this.discovery.encontrarConexao(databaseName);
    return new Kysely<Database>({
      dialect: new MssqlDialect({
        tarn: {
          ...Tarn,
          options: { min: 2, max: 10 },
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
                database: databaseName,
                encrypt: serverConfig.encrypt,
                trustServerCertificate: serverConfig.trustServerCert,
              },
            }),
        },
      }),
    });
  }
}
