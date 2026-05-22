// ⚠️ PLACEHOLDER — substituir nomes de colunas pelos reais após confirmar com DBA
export interface PncpServicosTable {
  id: number;
  nome: string;
  view_name: string;
  endpoint: string;
  metodo_http: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  ativo: number; // 0 = inativo, 1 = ativo
}
