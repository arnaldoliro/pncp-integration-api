import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';
import { env } from '../../config/env.config.js';

@Injectable()
export class PncpHttpClient {
  private readonly logger = new Logger(PncpHttpClient.name);
  private readonly tokenCache = new WeakMap<
    Kysely<Database>,
    { token: string; expiresAt: number }
  >();
  private readonly pendingAuth = new WeakMap<Kysely<Database>, Promise<string>>();

  private parseJwtExpiry(token: string): number {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString(),
      ) as { exp?: number };
      if (payload.exp) return payload.exp * 1000 - 5 * 60 * 1000;
    } catch {
      // ignorar erro de parse
    }
    return Date.now() + 50 * 60 * 1000;
  }

  private async fetchToken(db: Kysely<Database>): Promise<string> {
    const creds = await db
      .selectFrom('PNCP_CONTROLE_DADOS')
      .select(['con_usuario', 'con_senha'])
      .executeTakeFirstOrThrow();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.pncp.timeout);

    try {
      const response = await fetch(`${env.pncp.authUrl}/v1/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ login: creds.con_usuario, senha: creds.con_senha }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UnauthorizedException('Falha na autenticação PNCP');
      }

      const data = (await response.json()) as { access_token: string };
      const token = data.access_token;
      this.tokenCache.set(db, { token, expiresAt: this.parseJwtExpiry(token) });
      return token;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async authenticate(db: Kysely<Database>): Promise<string> {
    const cached = this.tokenCache.get(db);
    if (cached && Date.now() < cached.expiresAt) return cached.token;

    const inFlight = this.pendingAuth.get(db);
    if (inFlight) return inFlight;

    const promise = this.fetchToken(db);
    this.pendingAuth.set(db, promise);
    try {
      return await promise;
    } finally {
      this.pendingAuth.delete(db);
    }
  }

  private async request(
    method: string,
    url: string,
    db: Kysely<Database>,
    body?: unknown,
  ): Promise<unknown> {
    const token = await this.authenticate(db);
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= env.pncp.retryAttempts; attempt++) {
      if (attempt > 1) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, 1000 * 2 ** (attempt - 2)),
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.pncp.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const text = await response.text();

        if (!response.ok) {
          if (response.status === 401) this.tokenCache.delete(db);
          throw new HttpException(
            { statusCode: response.status, body: text },
            response.status,
          );
        }

        return text ? (JSON.parse(text) as unknown) : null;
      } catch (error) {
        if (error instanceof HttpException) throw error;
        lastError = error as Error;
        this.logger.warn(
          `Tentativa ${attempt}/${env.pncp.retryAttempts} falhou para ${method} ${url}: ${lastError.message}`,
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new InternalServerErrorException(
      `Falha ao chamar PNCP após ${env.pncp.retryAttempts} tentativas: ${lastError?.message}`,
    );
  }

  post(url: string, body: unknown, db: Kysely<Database>): Promise<unknown> {
    return this.request('POST', url, db, body);
  }

  put(url: string, body: unknown, db: Kysely<Database>): Promise<unknown> {
    return this.request('PUT', url, db, body);
  }

  patch(url: string, body: unknown, db: Kysely<Database>): Promise<unknown> {
    return this.request('PATCH', url, db, body);
  }

  delete(url: string, db: Kysely<Database>, body?: unknown): Promise<unknown> {
    return this.request('DELETE', url, db, body);
  }

  get(url: string, db: Kysely<Database>): Promise<unknown> {
    return this.request('GET', url, db);
  }
}
