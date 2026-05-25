import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { sql } from 'kysely';
import { db } from '../../database/connection.js';
import { VIEW_MAPPINGS } from './view-mappings.js';

@Injectable()
export class ViewsReaderService {
  async buscar(
    viewName: string,
    orgaoId: string,
    id?: string,
  ): Promise<Record<string, unknown>[]> {
    const mapping = VIEW_MAPPINGS[viewName];
    if (!mapping) {
      throw new NotFoundException(
        `Mapeamento não encontrado para a view "${viewName}". Adicione uma entrada em view-mappings.ts.`,
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (db.selectFrom(sql.table(viewName) as any) as any)
        .selectAll()
        .where(sql.ref(mapping.orgaoColumn), '=', orgaoId);

      if (id !== undefined) {
        query = query.where(sql.ref(mapping.idColumn), '=', id);
      }

      return await query.execute();
    } catch (error) {
      throw new InternalServerErrorException(
        `Falha ao consultar view "${viewName}": ${(error as Error).message}`,
      );
    }
  }
}
