export interface ViewMapping {
  idColumn: string;
  orgaoColumn: string;
}

export const VIEW_MAPPINGS: Record<string, ViewMapping> = {
  vw_Inserir_Contratacao_6_3_1: {
    idColumn: 'LIC_COD',
    orgaoColumn: 'codigoOrgao',
  },
  vw_Documentos_ContratacaoEditalAviso_6_3: {
    idColumn: 'LIC_COD',
    orgaoColumn: 'codigoOrgao',
  },
  vw_ContratoEditalAviso_Item_6_3: {
    idColumn: 'LIC_COD',
    orgaoColumn: 'codigoOrgao',
  },
  'vw_Resultado_Item_Contratação_6_3_15': {
    idColumn: 'LIC_COD',
    orgaoColumn: 'codigoOrgao',
  },
};
