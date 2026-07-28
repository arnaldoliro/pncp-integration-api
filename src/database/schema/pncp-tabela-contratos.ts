import type { Generated } from 'kysely';

export interface PncpTabelaContratosTable {
  con_id: Generated<number>;
  con_numero_contrato: string | null;
  con_sequencial: number | null;
  con_tipo_sequencial: string | null;
  con_data_alteracao: Date | null;
  con_ano: string | null;
  CON_DATAENVIO: Date | null;
  con_orgao: number | null;
}
