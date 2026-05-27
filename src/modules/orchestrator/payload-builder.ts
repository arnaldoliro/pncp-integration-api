import { InternalServerErrorException } from '@nestjs/common';

function substituir(
  value: unknown,
  context: Record<string, unknown>,
): unknown {
  if (typeof value === 'string') {
    const match = /^\{(\w+)\}$/.exec(value);
    if (match) return context[match[1]] ?? null;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituir(v, context));
  }
  if (value !== null && typeof value === 'object') {
    const result = Object.create(null) as Record<string, unknown>;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = substituir(v, context);
    }
    return result;
  }
  return value;
}

export function buildPayload(
  templateJson: string,
  context: Record<string, unknown>,
): Record<string, unknown> {
  let template: unknown;
  try {
    template = JSON.parse(templateJson);
  } catch {
    throw new InternalServerErrorException(
      'tel_json_consumo contém JSON inválido. Corrija a configuração em PNCP_SERVICOS.',
    );
  }
  return substituir(template, context) as Record<string, unknown>;
}
