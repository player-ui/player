import { isEmptyObject } from './helpers';

/**
 * Combines a URL with any additional parameters
 */
export function buildUrl(
  url: string,
  params: Record<string, unknown> = {}
): string {
  const baseUrl = new URL(url);

  if (params && isEmptyObject(params)) {
    return baseUrl.toString();
  }

  Object.keys(params).forEach((key) => {
    const value = params[key];
    baseUrl.searchParams.append(key, String(value));
  });

  return baseUrl.toString();
}
