import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';

export interface GravarDocumentoDto {
  sin_con_data_alteracao: Date;
  sin_con_ano: string;
  sin_con_numerocompra: string;
  sin_con_nome_arquivo: string;
  sequencialarquivo: number | null;
}

export interface GravarItemDto {
  sin_ite_data_alteracao: Date;
  sin_ite_ano: string;
  sin_ite_numeroitem: string;
  sin_ite_numeropncp: string;
  sin_ite_numerocompra: string;
  ite_id_situacao: string;
}

export interface GravarResultadoItemDto {
  sin_ite_numerocompra: string;
  sin_ite_numeroitem: string;
  sin_ite_ano: string;
  sin_ite_iditemview: string;
  sin_ite_sequencial: number | null;
  sin_ite_fornecedor: string;
}

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

  async gravarDocumento(data: GravarDocumentoDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_CONTRATACAO_DOCUMENTOS')
      .values({
        sin_con_data_alteracao: data.sin_con_data_alteracao,
        sin_con_ano: data.sin_con_ano,
        sin_con_numerocompra: data.sin_con_numerocompra.substring(0, 35),
        sin_con_nome_arquivo: data.sin_con_nome_arquivo.substring(0, 30),
        sequencialarquivo: data.sequencialarquivo,
      })
      .execute();
  }

  async gravarResultadoItem(data: GravarResultadoItemDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_ITENS_X_CONTRATACAO_RESULTADO')
      .values({
        sin_ite_numerocompra: data.sin_ite_numerocompra.substring(0, 35),
        sin_ite_numeroitem: data.sin_ite_numeroitem.substring(0, 20),
        sin_ite_ano: data.sin_ite_ano.substring(0, 4),
        sin_ite_data_alteracao: new Date(),
        sin_ite_iditemview: data.sin_ite_iditemview.substring(0, 20),
        sin_ite_sequencial: data.sin_ite_sequencial,
        SIN_ITE_DATAENVIO: new Date(),
        sin_ite_fornecedor: data.sin_ite_fornecedor.substring(0, 50),
      })
      .execute();
  }

  async gravarItem(data: GravarItemDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_ITENS_X_CONTRATACAO')
      .values({
        sin_ite_data_alteracao: data.sin_ite_data_alteracao,
        sin_ite_ano: data.sin_ite_ano,
        sin_ite_numeroitem: data.sin_ite_numeroitem.substring(0, 20),
        sin_ite_numeropncp: data.sin_ite_numeropncp.substring(0, 9),
        sin_ite_numerocompra: data.sin_ite_numerocompra.substring(0, 35),
        ite_id_situacao: data.ite_id_situacao,
      })
      .execute();
  }
}
