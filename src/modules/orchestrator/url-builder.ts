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
    return String(context[key]);
  });
  return baseUrl + interpolated;
}
