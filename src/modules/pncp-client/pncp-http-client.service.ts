import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { inflateSync } from 'zlib';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';
import { env } from '../../config/env.config.js';

export interface DocumentoInfo {
  buffer: Buffer;
  titulo: string;
  tipoDocumentoId: number;
  extensao: string;
}

function normalizarNomeArquivo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getMimeType(extensao: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return map[extensao.toLowerCase()] ?? 'application/octet-stream';
}

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
        const body = await response.text();
        this.logger.warn(`Auth falhou status=${response.status} body=${body.substring(0, 300)}`);
        throw new UnauthorizedException('Falha na autenticação PNCP');
      }

      const authHeader = response.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token não encontrado no header Authorization da resposta PNCP');
      }

      const token = authHeader.slice('Bearer '.length);
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
    extraHeaders?: Record<string, string>,
  ): Promise<{ status: number; body: unknown }> {
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
        const isFormData = body instanceof FormData;
        const response = await fetch(url, {
          method,
          headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
          },
          body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
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

        return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
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

  post(url: string, body: unknown, db: Kysely<Database>): Promise<{ status: number; body: unknown }> {
    return this.request('POST', url, db, body);
  }

  put(url: string, body: unknown, db: Kysely<Database>): Promise<{ status: number; body: unknown }> {
    return this.request('PUT', url, db, body);
  }

  patch(url: string, body: unknown, db: Kysely<Database>): Promise<{ status: number; body: unknown }> {
    return this.request('PATCH', url, db, body);
  }

  delete(url: string, db: Kysely<Database>, body?: unknown): Promise<{ status: number; body: unknown }> {
    return this.request('DELETE', url, db, body);
  }

  get(url: string, db: Kysely<Database>): Promise<{ status: number; body: unknown }> {
    return this.request('GET', url, db);
  }

  postMultipart(
    url: string,
    jsonBody: Record<string, unknown>,
    documento: DocumentoInfo,
    db: Kysely<Database>,
    nomeJsonField: string,
    nomeArqField: string,
  ): Promise<{ status: number; body: unknown }> {
    const form = new FormData();
    form.append(nomeJsonField, new Blob([JSON.stringify(jsonBody)], { type: 'application/json' }));
    const nomeArq = `${normalizarNomeArquivo(documento.titulo)}.${documento.extensao}`;
    const buf = Buffer.isBuffer(documento.buffer) ? documento.buffer : Buffer.from(documento.buffer as unknown as ArrayBuffer);
    const isZlib = buf[0] === 0x78 && (buf[1] === 0x9c || buf[1] === 0xda || buf[1] === 0x01 || buf[1] === 0x5e);
    const bufFinal = isZlib ? inflateSync(buf) : buf;
    form.append(nomeArqField, new Blob([new Uint8Array(bufFinal)], { type: getMimeType(documento.extensao) }), nomeArq);
    return this.request('POST', url, db, form, {
      'Titulo-Documento': documento.titulo,
      'Tipo-Documento-Id': String(documento.tipoDocumentoId),
    });
  }

  postArquivo(url: string, arquivo: DocumentoInfo, db: Kysely<Database>): Promise<{ status: number; body: unknown }> {
    const form = new FormData();
    const bufArq = Buffer.isBuffer(arquivo.buffer) ? arquivo.buffer : Buffer.from(arquivo.buffer as unknown as ArrayBuffer);
    const isZlibArq = bufArq[0] === 0x78 && (bufArq[1] === 0x9c || bufArq[1] === 0xda || bufArq[1] === 0x01 || bufArq[1] === 0x5e);
    const bufArqFinal = isZlibArq ? inflateSync(bufArq) : bufArq;
    form.append('arquivo', new Blob([new Uint8Array(bufArqFinal)], { type: getMimeType(arquivo.extensao) }), `${normalizarNomeArquivo(arquivo.titulo)}.${arquivo.extensao}`);
    return this.request('POST', url, db, form, {
      'Titulo-Documento': arquivo.titulo,
      'Tipo-Documento-Id': String(arquivo.tipoDocumentoId),
    });
  }
}
