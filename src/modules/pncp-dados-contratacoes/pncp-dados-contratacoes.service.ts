import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';

export interface GravarSequencialDto {
  con_compra_id: string;
  con_orgao: number;
  con_sequencial: number;
  con_ano: string;
}

@Injectable()
export class PncpDadosContratacoes {
  async buscarSequencial(
    conCompraId: string,
    conOrgao: number,
    db: Kysely<Database>,
  ): Promise<{ con_sequencial: number; con_ano: string } | null> {
    const row = await db
      .selectFrom('PNCP_TABELA_CONTRATACOES')
      .select(['con_sequencial', 'con_ano'])
      .where('con_compra_id', '=', conCompraId)
      .where('con_orgao', '=', conOrgao)
      .executeTakeFirst();

    if (!row || row.con_sequencial === null || row.con_ano === null) return null;
    return { con_sequencial: row.con_sequencial, con_ano: row.con_ano };
  }

  async gravarSequencial(data: GravarSequencialDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_CONTRATACOES')
      .values({
        con_compra_id: data.con_compra_id,
        con_orgao: data.con_orgao,
        con_sequencial: data.con_sequencial,
        con_ano: data.con_ano,
      })
      .execute();
  }

  async remover(conCompraId: string, conOrgao: number, db: Kysely<Database>): Promise<void> {
    await db
      .deleteFrom('PNCP_TABELA_CONTRATACOES')
      .where('con_compra_id', '=', conCompraId)
      .where('con_orgao', '=', conOrgao)
      .execute();
  }
}
