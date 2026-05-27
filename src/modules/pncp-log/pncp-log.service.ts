import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';

export interface GravarLogDto {
  ls_acao: string;
  ls_url: string;
  ls_cod_erro: number | null;
  ls_mensagem: string | null;
  ls_json: string | null;
  ser_id: number | null;
  ls_orgao: number | null;
  ls_id_pncp: number | null;
  ls_numeroprocesso: string | null;
}

@Injectable()
export class PncpLogService {
  async gravar(dados: GravarLogDto, db: Kysely<Database>): Promise<void> {
    await db.insertInto('PNCP_LOG_SERVICO').values(dados).execute();
  }
}
