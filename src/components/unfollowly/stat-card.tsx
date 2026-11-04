import type { ReactNode } from 'react';

interface Props { icon: ReactNode; title: string; value?: number; color: 'purple' | 'blue' | 'green' | 'pink' }

export function StatCard({ icon, title, value, color }: Props) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`} aria-hidden="true">{icon}</div>
      <span>{title}</span>
      <strong>{value === undefined ? '—' : value.toLocaleString()}</strong>
      <small>{value === undefined ? 'Upload to see insights' : 'From your comparison'}</small>
    </div>
  );
}
