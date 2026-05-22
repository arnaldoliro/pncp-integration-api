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

function buildEnv() {
  const errors: string[] = [];

  const port = requireInt('PORT', errors);
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const db = {
    server: requireEnv('DB_SERVER', errors),
    port: requireInt('DB_PORT', errors),
    database: requireEnv('DB_DATABASE', errors),
    user: requireEnv('DB_USER', errors),
    password: requireEnv('DB_PASSWORD', errors), // nunca logar
    encrypt: parseBool('DB_ENCRYPT'),
    trustServerCert: parseBool('DB_TRUST_SERVER_CERT'),
  };

  const pncp = {
    baseUrl: requireEnv('PNCP_BASE_URL', errors),
    timeout: requireInt('PNCP_TIMEOUT', errors),
    retryAttempts: requireInt('PNCP_RETRY_ATTEMPTS', errors),
    authUrl: requireEnv('PNCP_AUTH_URL', errors),
    clientId: requireEnv('PNCP_CLIENT_ID', errors),
    clientSecret: requireEnv('PNCP_CLIENT_SECRET', errors), // nunca logar
  };

  if (errors.length) {
    throw new Error(`Configuração inválida:\n${errors.join('\n')}`);
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : false;

  return { port, nodeEnv, db, pncp, allowedOrigins };
}

export const env = buildEnv();
