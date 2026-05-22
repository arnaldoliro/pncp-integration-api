import { Kysely, MssqlDialect } from 'kysely';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';
import type { Database } from './schema/database.js';

function createDialect(): MssqlDialect {
  return new MssqlDialect({
    tarn: {
      ...Tarn,
      options: {
        min: 2,
        max: 10,
      },
    },
    tedious: {
      ...Tedious,
      connectionFactory: () =>
        new Tedious.Connection({
          server: process.env.DB_SERVER ?? '',
          authentication: {
            type: 'default',
            options: {
              userName: process.env.DB_USER ?? '',
              password: process.env.DB_PASSWORD ?? '',
            },
          },
          options: {
            port: parseInt(process.env.DB_PORT ?? '1433', 10),
            database: process.env.DB_DATABASE ?? '',
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
          },
        }),
    },
  });
}

export const db = new Kysely<Database>({ dialect: createDialect() });
