import type { Generated } from 'kysely';

export interface PncpTabelaContratacoesTable {
  con_id: Generated<number>;
  con_sequencial: number | null;
  con_ano: string | null;
  con_data_alteracao: Date | null;
  con_compra_id: string | null;
  CON_DATAENVIO: Date | null;
  con_orgao: number | null;
}
