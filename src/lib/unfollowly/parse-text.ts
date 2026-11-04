import { cleanUsernames } from './username';

/** RFC-4180-ish CSV parser supporting quoted fields, escaped quotes, and CRLF. */
export function parseCsvRows(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

const HEADER_NAMES = ['username', 'user name', 'user', 'handle', 'account', 'instagram', 'name'];

function detectDelimiter(firstLine: string): string {
  const counts = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 1 ? counts[0][0] : ',';
}

export function parseCsv(text: string): string[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const rows = parseCsvRows(text, detectDelimiter(firstLine));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  let col = -1;
  for (const name of HEADER_NAMES) {
    col = header.indexOf(name);
    if (col !== -1) break;
  }
  if (col !== -1) return cleanUsernames(rows.slice(1).map((r) => r[col] ?? ''));
  // No recognised header: drop a header-looking first row, take every cell.
  const isHeaderish = header.length > 1 && header.every((h) => /^[a-z _-]+$/.test(h) && !h.includes('.'));
  const body = isHeaderish ? rows.slice(1) : rows;
  return cleanUsernames(body.flat());
}

export function parseTxt(text: string): string[] {
  return cleanUsernames(text.split(/[\n\r,;\t]+/)).filter((n) => !['username', 'usernames'].includes(n));
}
