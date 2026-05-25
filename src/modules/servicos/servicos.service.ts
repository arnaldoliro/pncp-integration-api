import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../database/connection.js';
import type { Selectable } from 'kysely';
import type { PncpServicosTable } from '../../database/schema/pncp-servicos.js';

@Injectable()
export class ServicosService {
  async resolverPorNome(
    nomeServico: string,
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
}
