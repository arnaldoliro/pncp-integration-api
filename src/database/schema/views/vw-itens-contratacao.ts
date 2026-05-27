export interface VwItensContratacaoView {
  LIC_COD: number;
  cnpj: string;
  ano: string | null;
  produtoNumero: number | null;
  numeroItem: number;
  materialOuServico: string;
  tipoBeneficioId: number | null;
  incentivoProdutivoBasico: boolean | null;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitarioEstimado: number | null;
  valorTotal: number | null;
  criterioJulgamentoId: number | null;
  orcamentoSigiloso: boolean | null;
  itemCategoriaId: number | null;
  patrimonio: string | null;
  codigoRegistroImobiliario: string | null;
  dataAlteracao: string | null;
  numeroCompra: string | null;
  codigoOrgao: number;
  aplicabilidadeMargemPreferenciaNormal: boolean | null;
  aplicabilidadeMargemPreferenciaAdicional: boolean | null;
}
