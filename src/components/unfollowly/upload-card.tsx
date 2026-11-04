import { CheckCircle2, FileJson, UploadCloud } from 'lucide-react';

interface Props {
  id: string; title: string; subtitle: string; fileName: string; count?: number; busy: boolean;
  onFile: (file: File | undefined) => void;
}

export function UploadCard({ id, title, subtitle, fileName, count, busy, onFile }: Props) {
  return (
    <label className={`upload-card ${fileName ? 'has-file' : ''} ${busy ? 'is-busy' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="file"
        accept=".json,.txt,.csv,application/json,text/plain,text/csv"
        aria-describedby={`${id}-status`}
       
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      <span className="upload-icon" aria-hidden="true">{fileName ? <CheckCircle2 size={25} /> : <UploadCloud size={25} />}</span>
      <strong>{title}</strong>
      <span className="upload-subtitle">{subtitle}</span>
      <span className="upload-filename" id={`${id}-status`} aria-live="polite">
        {busy ? 'Reading file...' : fileName ? <><FileJson size={15} aria-hidden="true" />{fileName} · {count ?? 0} users</> : 'Click or press Enter to choose a file'}
      </span>
      <span className="upload-types">JSON, TXT or CSV · max 15 MB</span>
    </label>
  );
}
