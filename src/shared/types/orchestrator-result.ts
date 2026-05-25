export interface OrchestratorDetalhe {
  id: unknown;
  sucesso: boolean;
  mensagem?: string;
}

export interface OrchestratorResult {
  total: number;
  enviados: number;
  erros: number;
  ignorados: number;
  detalhes: OrchestratorDetalhe[];
}
