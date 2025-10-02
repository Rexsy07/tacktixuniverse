export function withBase(url?: string | null): string | undefined | null {
  if (!url) return url ?? null;
  const base = (import.meta as any).env?.BASE_URL || '/';
  // If it's an absolute URL (http/https), return as-is
  if (/^https?:\/\//i.test(url)) return url;
  // Normalize: ensure base ends with '/'
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  // If already starts with the base, return as-is
  if (url.startsWith(normalizedBase)) return url;
  // Drop any leading slash from the url, then prefix base
  const path = url.startsWith('/') ? url.slice(1) : url;
  return normalizedBase + path;
}