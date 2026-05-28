export interface VwResultadoItemContratacaoView {
  LIC_COD: number;
  codigoOrgao: number;
  cnpj: string;
  ano: number;
  sequencial: number;
  numeroItem: number;
  numeroCompra: string;
  quantidadeHomologada: number;
  valorUnitarioHomologado: number;
  valorTotalHomologado: number;
  percentualDesconto: number;
  tipoPessoaId: string | null;
  niFornecedor: string | null;
  nomeRazaoSocialFornecedor: string;
  porteFornecedorId: number;
  naturezaJuridicaId: number | null;
  codigoPais: string;
  indicadorSubcontratacao: boolean;
  ordemClassificacaoSrp: number;
  dataResultado: string;
  aplicacaoMargemPreferencia: boolean;
  aplicacaoBeneficioMeEpp: boolean;
  aplicacaoCriterioDesempate: boolean;
}
