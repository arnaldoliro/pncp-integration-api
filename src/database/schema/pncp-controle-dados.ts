import type { Generated } from 'kysely';

// ⚠️ Tabela contém credenciais — nunca logar, nunca retornar em responses
export interface PncpControleDadosTable {
  con_id: Generated<number>;
  con_usuario: string;
  con_senha: string; // ⚠️ nunca logar ou expor
  con_link_principal: string | null;
  con_jwt_secret: string | null; // ⚠️ nunca logar ou expor
}
