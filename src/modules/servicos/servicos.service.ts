import { Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Selectable } from 'kysely';
import type { Database } from '../../database/connection.js';
import type { PncpServicosTable } from '../../database/schema/pncp-servicos.js';

@Injectable()
export class ServicosService {
  async resolverPorNome(
    nomeServico: string,
    db: Kysely<Database>,
  ): Promise<Selectable<PncpServicosTable>> {
    const servico = await db
      .selectFrom('PNCP_SERVICOS')
      .selectAll()
      .where('tel_descricao_servico', '=', nomeServico)
      .executeTakeFirst();

    if (!servico) {
      throw new NotFoundException(`Serviço não encontrado: ${nomeServico}`);
    }

    return servico;
  }

  async listar(db: Kysely<Database>): Promise<{ tel_descricao_servico: string }[]> {
    return db
      .selectFrom('PNCP_SERVICOS')
      .select('tel_descricao_servico')
      .orderBy('tel_descricao_servico', 'asc')
      .execute();
  }
}
