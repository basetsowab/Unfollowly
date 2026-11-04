export function normalizeUsername(input: unknown): string {
  return String(input ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/?(?:\?.*)?$/, '')
    .toLowerCase();
}

export function isValidUsername(s: string): boolean {
  return /^[a-z0-9._]{1,30}$/.test(s);
}

export function cleanUsernames(raw: unknown[]): string[] {
  return raw.map(normalizeUsername).filter(isValidUsername);
}
