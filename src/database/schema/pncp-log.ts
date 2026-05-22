import type { Generated } from 'kysely';

export interface PncpLogServicoTable {
  ls_codigo: Generated<number>;
  ls_usuario: number | null;
  ls_acao: string | null;
  ls_json: string | null;
  ls_cod_erro: number | null;
  ls_mensagem: string | null;
  ls_url: string | null;
  ls_dt_registro: Generated<Date>;
  ser_id: number | null;
  ls_descricao: string | null;
  ls_caminho_ftp: string | null;
  ls_numeroprocesso: string | null;
  ls_id_pncp: number | null;
  ls_orgao: number | null;
}
