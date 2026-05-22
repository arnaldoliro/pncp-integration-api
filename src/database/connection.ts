import { Kysely, MssqlDialect } from 'kysely';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';
import { env } from '../config/env.config.js';
import type { PncpServicosTable } from './schema/pncp-servicos.js';
import type { PncpLogServicoTable } from './schema/pncp-log.js';
import type { VwContratacaoView } from './schema/views/vw-contratacao.js';
import type { VwDocumentosContratacaoView } from './schema/views/vw-documentos-contratacao.js';

interface Database {
  PNCP_SERVICOS: PncpServicosTable;
  PNCP_LOG_SERVICO: PncpLogServicoTable;
  vw_Inserir_Contratacao_6_3_1: VwContratacaoView;
  vw_Documentos_ContratacaoEditalAviso_6_3: VwDocumentosContratacaoView;
}

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
          server: env.db.server,
          authentication: {
            type: 'default',
            options: {
              userName: env.db.user,
              password: env.db.password,
            },
          },
          options: {
            port: env.db.port,
            database: env.db.database,
            encrypt: env.db.encrypt,
            trustServerCertificate: env.db.trustServerCert,
          },
        }),
    },
  });
}

export const db = new Kysely<Database>({ dialect: createDialect() });
