export interface ServerConfig {
  server: string;
  port: number;
  user: string;
  password: string;
  encrypt: boolean;
  trustServerCert: boolean;
}

function requireEnv(key: string, errors: string[]): string {
  const value = process.env[key];
  if (!value) errors.push(`Variável de ambiente obrigatória ausente: ${key}`);
  return value ?? '';
}

function requireInt(key: string, errors: string[]): number {
  const raw = process.env[key];
  if (!raw) {
    errors.push(`Variável de ambiente obrigatória ausente: ${key}`);
    return 0;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    errors.push(`Variável de ambiente inválida (esperado inteiro): ${key}`);
    return 0;
  }
  return parsed;
}

function parseBool(key: string): boolean {
  return process.env[key] === 'true';
}

function buildServers(encrypt: boolean, trustServerCert: boolean, errors: string[]): ServerConfig[] {
  const servers: ServerConfig[] = [];
  let n = 1;

  while (process.env[`DB_SERVER_${n}`]) {
    const server = process.env[`DB_SERVER_${n}`]!;
    const portRaw = process.env[`DB_PORT_${n}`];
    const port = portRaw ? parseInt(portRaw, 10) : 1433;
    const user = process.env[`DB_USER_${n}`];
    const password = process.env[`DB_PASSWORD_${n}`];

    if (!user) errors.push(`Variável de ambiente obrigatória ausente: DB_USER_${n}`);
    if (!password) errors.push(`Variável de ambiente obrigatória ausente: DB_PASSWORD_${n}`);

    servers.push({
      server,
      port: isNaN(port) ? 1433 : port,
      user: user ?? '',
      password: password ?? '',
      encrypt,
      trustServerCert,
    });
    n++;
  }

  if (servers.length === 0) {
    errors.push(
      'Nenhum servidor SQL Server configurado. Defina DB_SERVER_1, DB_PORT_1, DB_USER_1, DB_PASSWORD_1.',
    );
  }

  return servers;
}

function buildEnv() {
  const errors: string[] = [];

  const port = requireInt('PORT', errors);
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const encrypt = parseBool('DB_ENCRYPT');
  const trustServerCert = parseBool('DB_TRUST_SERVER_CERT');
  const servers = buildServers(encrypt, trustServerCert, errors);

  const pncp = {
    baseUrl: requireEnv('PNCP_BASE_URL', errors),
    timeout: requireInt('PNCP_TIMEOUT', errors),
    retryAttempts: requireInt('PNCP_RETRY_ATTEMPTS', errors),
    authUrl: requireEnv('PNCP_AUTH_URL', errors),
  };

  if (errors.length) {
    throw new Error(`Configuração inválida:\n${errors.join('\n')}`);
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : false;

  return { port, nodeEnv, servers, pncp, allowedOrigins };
}

export const env = buildEnv();
