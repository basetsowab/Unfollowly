export interface ExportRow { name: string; status: string }

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function saveCsv(rows: ExportRow[], filename: string): void {
  const content = '\uFEFFusername,status\r\n' + rows.map((r) => `${cell(r.name)},${cell(r.status)}`).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
