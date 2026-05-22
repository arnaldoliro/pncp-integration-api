export interface VwDocumentosContratacaoView {
  LIC_COD: number;
  cnpj: string;
  Ano: number;
  TituloDocumento: string;
  TipoDocumentoId: number;
  arquivo: Buffer;
  numeroCompra: string;
  Extencao: string;
  codigoOrgao: number;
  chaveAnexo: number;
}
