import type { Generated } from 'kysely';

export interface PncpTabelaItensContratacaoResultadoTable {
  sin_ite_id: Generated<number>;
  sin_ite_numerocompra: string | null;
  sin_ite_numeroitem: string | null;
  sin_ite_ano: string | null;
  sin_ite_data_alteracao: Date | null;
  sin_ite_iditemview: string | null;
  sin_ite_sequencial: number | null;
  SIN_ITE_DATAENVIO: Date | null;
  sin_ite_fornecedor: string | null;
}
