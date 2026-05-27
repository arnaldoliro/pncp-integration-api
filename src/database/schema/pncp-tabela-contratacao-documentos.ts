import type { Generated } from 'kysely';

export interface PncpTabelaContratacaoDocumentosTable {
  sin_con_id: Generated<number>;
  sin_con_data_alteracao: Date | null;
  sin_con_ano: string | null;
  sin_con_numerocompra: string | null;
  sin_con_nome_arquivo: string | null;
  sequencialarquivo: number | null;
}
