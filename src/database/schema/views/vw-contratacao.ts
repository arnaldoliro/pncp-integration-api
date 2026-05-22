export interface VwContratacaoView {
  LIC_COD: number;
  cnpj: string;
  codigoUnidadeCompradora: string;
  tipoInstrumentoConvocatorioId: number;
  modalidadeId: number;
  modoDisputaId: number;
  numeroCompra: string;
  anoCompra: number;
  numeroProcesso: string;
  objetoCompra: string;
  srp: boolean;
  amparoLegalId: number;
  codigoOrgao: number;
  dataAberturaProposta: string | null;       // obrigatório para tipoInstrumentoConvocatorioId 1 ou 2
  dataEncerramentoProposta: string | null;   // obrigatório para tipoInstrumentoConvocatorioId 1 ou 2
  informacaoComplementar: string | null;
  justificativaPresencial: string | null;
  linkSistemaOrigem: string | null;
  linkProcessoEletronico: string | null;
}
