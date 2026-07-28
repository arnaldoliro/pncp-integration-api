import type { Generated } from 'kysely';

export interface PncpTabelaDocumentosContratoTable {
  tdc_id: Generated<number>;
  numero_contrato: string | null;
  tdc_sequencial: number | null;
  tdc_nome_arquivo: string | null;
  tdc_ano: string | null;
  tdc_data_alteracao: Date | null;
  TDC_DATAENVIO: Date | null;
  TDT_DATAENVIO: Date | null;
  SIN_ITE_DATAENVIO: Date | null;
}
