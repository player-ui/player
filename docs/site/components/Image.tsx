import path from 'path';

export function withBasePrefix(location?: string): string | undefined {
  if (!location) {
    return location;
  }

  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return path.join(process.env.NEXT_PUBLIC_BASE_PATH, location);
  }

  return location;
}
