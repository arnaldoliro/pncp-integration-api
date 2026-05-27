import { Kysely } from 'kysely';
import type { Database } from './schema/database.types.js';

export type { Database };
export type AppKysely = Kysely<Database>;
