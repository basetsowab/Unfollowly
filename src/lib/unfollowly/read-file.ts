import { extractJsonUsernames } from './parse-json';
import { parseCsv, parseTxt } from './parse-text';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function readFollowers(file: File): Promise<string[]> {
  if (file.size > MAX_FILE_BYTES) throw new Error('File is too large. Maximum size is 15 MB.');
  const lower = file.name.toLowerCase();
  const kind = lower.endsWith('.json') ? 'json' : lower.endsWith('.csv') ? 'csv' : lower.endsWith('.txt') ? 'txt' : null;
  if (!kind) throw new Error('Please select a .json, .txt, or .csv file.');
  const text = (await file.text()).replace(/^\uFEFF/, '');
  let names: string[];
  if (kind === 'json') {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error('Invalid JSON. Try exporting your Instagram data again.'); }
    names = extractJsonUsernames(parsed);
  } else names = kind === 'csv' ? parseCsv(text) : parseTxt(text);
  const unique = [...new Set(names)];
  if (!unique.length) throw new Error('No usernames found. Use a followers JSON export or a TXT/CSV list of usernames.');
  return unique;
}
