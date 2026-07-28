import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';

export interface GravarSequencialContratoDto {
  con_numero_contrato: string;
  con_orgao: number;
  con_sequencial: number;
  con_ano: string;
  CON_DATAENVIO: Date;
}

export interface GravarDocumentoContratoDto {
  numero_contrato: string;
  tdc_sequencial: number | null;
  tdc_nome_arquivo: string;
  tdc_ano: string;
}

@Injectable()
export class PncpDadosContratos {
  async buscarSequencial(
    conNumeroContrato: string,
    conOrgao: number,
    db: Kysely<Database>,
  ): Promise<{ con_sequencial: number; con_ano: string } | null> {
    const row = await db
      .selectFrom('PNCP_TABELA_CONTRATO')
      .select(['con_sequencial', 'con_ano'])
      .where('con_numero_contrato', '=', conNumeroContrato)
      .where('con_orgao', '=', conOrgao)
      .executeTakeFirst();
    if (!row || row.con_sequencial === null || row.con_ano === null) return null;
    return { con_sequencial: row.con_sequencial, con_ano: row.con_ano };
  }

  async gravarSequencial(data: GravarSequencialContratoDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_CONTRATO')
      .values({
        con_numero_contrato: data.con_numero_contrato,
        con_orgao: data.con_orgao,
        con_sequencial: data.con_sequencial,
        con_ano: data.con_ano,
        CON_DATAENVIO: data.CON_DATAENVIO,
        con_tipo_sequencial: null,
        con_data_alteracao: new Date(),
      })
      .execute();
  }

  async remover(conNumeroContrato: string, conOrgao: number, conAno: string, db: Kysely<Database>): Promise<void> {
    await db
      .deleteFrom('PNCP_TABELA_CONTRATO')
      .where('con_numero_contrato', '=', conNumeroContrato)
      .where('con_orgao', '=', conOrgao)
      .where('con_ano', '=', conAno)
      .execute();
  }

  async gravarDocumento(data: GravarDocumentoContratoDto, db: Kysely<Database>): Promise<void> {
    await db
      .insertInto('PNCP_TABELA_DOCUMENTOS_CONTRATO')
      .values({
        numero_contrato: data.numero_contrato.substring(0, 35),
        tdc_sequencial: data.tdc_sequencial,
        tdc_nome_arquivo: data.tdc_nome_arquivo.substring(0, 100),
        tdc_ano: data.tdc_ano.substring(0, 4),
        tdc_data_alteracao: new Date(),
        TDC_DATAENVIO: new Date(),
      })
      .execute();
  }

  async removerDocumentosPorContrato(numeroContrato: string, ano: string, db: Kysely<Database>): Promise<void> {
    await db
      .deleteFrom('PNCP_TABELA_DOCUMENTOS_CONTRATO')
      .where('numero_contrato', '=', numeroContrato)
      .where('tdc_ano', '=', ano)
      .execute();
  }
}
