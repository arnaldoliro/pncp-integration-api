import type { PncpServicosTable } from './pncp-servicos.js';
import type { PncpLogServicoTable } from './pncp-log.js';
import type { PncpTabelaContratacoesTable } from './pncp-tabela-contratacoes.js';
import type { PncpTabelaContratacaoDocumentosTable } from './pncp-tabela-contratacao-documentos.js';
import type { PncpTabelaItensContratacaoTable } from './pncp-tabela-itens-contratacao.js';
import type { VwContratacaoView } from './views/vw-contratacao.js';
import type { VwDocumentosContratacaoView } from './views/vw-documentos-contratacao.js';
import type { VwItensContratacaoView } from './views/vw-itens-contratacao.js';
import type { PncpControleDadosTable } from './pncp-controle-dados.js';

export interface Database {
  PNCP_SERVICOS: PncpServicosTable;
  PNCP_LOG_SERVICO: PncpLogServicoTable;
  PNCP_TABELA_CONTRATACOES: PncpTabelaContratacoesTable;
  PNCP_TABELA_CONTRATACAO_DOCUMENTOS: PncpTabelaContratacaoDocumentosTable;
  PNCP_TABELA_ITENS_X_CONTRATACAO: PncpTabelaItensContratacaoTable;
  vw_Inserir_Contratacao_6_3_1: VwContratacaoView;
  vw_Documentos_ContratacaoEditalAviso_6_3: VwDocumentosContratacaoView;
  vw_ContratoEditalAviso_Item_6_3: VwItensContratacaoView;
  PNCP_CONTROLE_DADOS: PncpControleDadosTable;
}
