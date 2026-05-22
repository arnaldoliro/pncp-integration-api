import type { Generated } from 'kysely';

// ⚠️ PLACEHOLDER — substituir nomes de colunas pelos reais após confirmar com DBA
export interface PncpLogServicoTable {
  id: Generated<number>;      // identity — gerado pelo banco, omitido automaticamente em INSERT
  servico: string;
  entidade: string;
  registro_id: string;
  orgao_id: string;
  status_code: number | null;
  sucesso: number;            // 0 = falhou, 1 = sucesso
  payload_enviado: string | null;  // ⚠️ pode conter dados sensíveis — avaliar mascaramento antes de salvar
  resposta_pncp: string | null;    // ⚠️ pode conter tokens — nunca logar fora do banco
  mensagem_erro: string | null;
  criado_em: Generated<Date>; // default GETDATE() no banco, omitido automaticamente em INSERT
}
