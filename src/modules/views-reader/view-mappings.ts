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
};
