export interface VwRetificarContratacao632View {
  LIC_COD: number;
  ORG_COD: number;
  cnpj: string;
  anoCompra: number;
  sequencial: number | null;
  codigoUnidadeCompradora: string | null;
  tipoInstrumentoConvocatorioId: number | null;
  modalidadeId: number | null;
  modoDisputaId: number | null;
  numeroCompra: string | null;
  numeroProcesso: string | null;
  situacaoCompraId: number;
  objetoCompra: string | null;
  informacaoComplementar: string;
  cnpjOrgaoSubRogado: string;
  codigoUnidadeSubRogada: string;
  srp: boolean;
  dataAberturaProposta: string | null;
  dataEncerramentoProposta: string | null;
  amparoLegalId: number | null;
  linkSistemaOrigem: string;
  linkProcessoEletronico: string;
  justificativaPresencial: string;
  justificativa: string | null;
}
