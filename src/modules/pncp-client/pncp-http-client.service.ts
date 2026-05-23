import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { db } from '../../database/connection.js';
import { env } from '../../config/env.config.js';

@Injectable()
export class PncpHttpClient {
  private readonly logger = new Logger(PncpHttpClient.name);

  private async authenticate(): Promise<string> {
    const creds = await db
      .selectFrom('PNCP_CONTROLE_DADOS')
      .select(['con_usuario', 'con_senha'])
      .executeTakeFirstOrThrow();

    const response = await fetch(`${env.pncp.authUrl}/v1/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ login: creds.con_usuario, senha: creds.con_senha }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Falha na autenticação PNCP');
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  private async request(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<unknown> {
    const token = await this.authenticate();
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

  post(url: string, body: unknown): Promise<unknown> {
    return this.request('POST', url, body);
  }

  put(url: string, body: unknown): Promise<unknown> {
    return this.request('PUT', url, body);
  }

  patch(url: string, body: unknown): Promise<unknown> {
    return this.request('PATCH', url, body);
  }

  delete(url: string): Promise<unknown> {
    return this.request('DELETE', url);
  }

  get(url: string): Promise<unknown> {
    return this.request('GET', url);
  }
}
