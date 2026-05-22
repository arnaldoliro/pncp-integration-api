import type { Generated } from 'kysely';

export interface PncpServicosTable {
  ser_id: Generated<number>;             
  tel_descricao_servico: string;         
  tel_entidade: string;                 
  tel_json_consumo: string | null;       
  ser_automatico: number;               
  ser_tipo: string;                     
  ser_link: string;                      
  tel_tipo_entidade: string;            
  ser_ordem: number | null;              
  tel_entidade_log: string | null;      
  ser_arquivo: number | null;           
  sin_ser_charset: string | null;       
  sin_id_servico_retificacao: number | null; 
  tel_entidade_doc: string | null;        
  ser_tipodocumento: string | null;     
  sin_ser_nome_cabecalho_json: string | null;
  sin_ser_nome_cabecalho_arquivo: string | null;
  sin_ser_chave_url_retorno: string | null;
  ser_id_padrao: number | null;
  SER_TIPO_MOV: string | null;
  SER_TIPO_PER: string | null;
}