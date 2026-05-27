import { InternalServerErrorException } from '@nestjs/common';

export function buildUrl(
  serLink: string,
  baseUrl: string,
  context: Record<string, unknown>,
): string {
  const interpolated = serLink.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in context)) {
      throw new InternalServerErrorException(
        `Placeholder "{${key}}" não encontrado no contexto para montar a URL.`,
      );
    }
    const value = context[key];
    if (value === null || value === undefined) {
      throw new InternalServerErrorException(
        `Placeholder "{${key}}" tem valor nulo no contexto para montar a URL.`,
      );
    }
    return encodeURIComponent(String(value));
  });
  return baseUrl + interpolated;
}
