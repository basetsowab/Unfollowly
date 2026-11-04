import { cleanUsernames } from './username';

/** Walks Instagram export JSON (string_list_data), objects with username, or plain string arrays. */
export function extractJsonUsernames(json: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') { out.push(node); return; }
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.string_list_data)) {
      for (const item of obj.string_list_data) {
        const v = (item as { value?: unknown } | null)?.value;
        if (typeof v === 'string') out.push(v);
      }
      return;
    }
    if (typeof obj.username === 'string') { out.push(obj.username); return; }
    for (const value of Object.values(obj)) {
      // Only descend into containers; ignore unrelated scalar strings like titles or hrefs.
      if (value && typeof value === 'object') walk(value);
    }
  };
  if (Array.isArray(json)) json.forEach(walk);
  else walk(json);
  return cleanUsernames(out);
}
