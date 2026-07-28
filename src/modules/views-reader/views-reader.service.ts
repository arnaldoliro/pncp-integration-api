import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import type { Database } from '../../database/connection.js';
import { VIEW_MAPPINGS } from './view-mappings.js';

@Injectable()
export class ViewsReaderService {
  async buscar(
    viewName: string,
    orgaoId: string,
    id: string | undefined,
    db: Kysely<Database>,
  ): Promise<Record<string, unknown>[]> {
    const mapping = VIEW_MAPPINGS[viewName];
    if (!mapping) {
      throw new InternalServerErrorException(
        `Mapeamento não encontrado para a view "${viewName}". Adicione uma entrada em view-mappings.ts.`,
      );
    }

    try {
      console.log(`[ViewsReader] buscar: view="${viewName}" orgaoColumn="${mapping.orgaoColumn}" orgaoId="${orgaoId}" idColumn="${mapping.idColumn}" id="${id}"`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (db.selectFrom(sql.table(viewName) as any) as any)
        .selectAll()
        .where(sql.ref(mapping.orgaoColumn), '=', orgaoId);

      if (id !== undefined) {
        query = query.where(sql.ref(mapping.idColumn), '=', id);
      }

      const compiled = query.compile();
      console.log(`[ViewsReader] SQL compilado:`, compiled.sql);
      console.log(`[ViewsReader] parâmetros:`, compiled.parameters);

      const results = await query.execute();
      console.log(`[ViewsReader] buscar: ${results.length} registro(s) retornado(s) da view "${viewName}"`);
      if (results.length > 0) {
        console.log(`[ViewsReader] primeiro registro:`, JSON.stringify(results[0]));
      }
      return results;
    } catch (error) {
      throw new InternalServerErrorException(
        `Falha ao consultar view "${viewName}": ${(error as Error).message}`,
      );
    }
  }
}
