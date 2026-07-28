export interface ViewMapping {
  idColumn: string;
  orgaoColumn: string;
}

export const VIEW_MAPPINGS: Record<string, ViewMapping> = {
  vw_Retificar_Contratacao_6_3_2: {
    idColumn: 'LIC_COD',
    orgaoColumn: 'ORG_COD',
  },
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
  vw_documento_contratacao_6_3_7: {
    idColumn: 'CodigoLicitacao',
    orgaoColumn: 'CodigoOrgao',
  },
  vw_excluir_contratacao_6_3_4: {
    idColumn: 'CodigoLicitacao',
    orgaoColumn: 'CodigoOrgao',
  },
  vw_Contrato_6_5_1: {
    idColumn: 'CTR_COD',
    orgaoColumn: 'codigoOrgao',
  },
  vw_Contrato_6_5_2: {
    idColumn: 'CTR_COD',
    orgaoColumn: 'codigoOrgao',
  },
  vw_excluir_contrato_6_5_3: {
    idColumn: 'CodigoContrato',
    orgaoColumn: 'CodigoOrgao',
  },
  vw_Documento_Contrato_6_5_4: {
    idColumn: 'CTR_COD',
    orgaoColumn: 'codigoOrgao',
  },
};
