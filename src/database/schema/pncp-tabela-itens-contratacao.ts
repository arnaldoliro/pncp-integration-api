import type { Generated } from 'kysely';

export interface PncpTabelaItensContratacaoTable {
  sin_ite_id: Generated<number>;
  sin_ite_data_alteracao: Date | null;
  sin_ite_ano: string | null;
  sin_ite_numeroitem: string | null;
  sin_ite_numeropncp: string | null;
  sin_ite_numerocompra: string | null;
  ite_id_situacao: string | null;
}
