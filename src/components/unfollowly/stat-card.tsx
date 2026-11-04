import type { ReactNode } from 'react';

interface Props { icon: ReactNode; title: string; value?: number; color: 'purple' | 'blue' | 'green' | 'pink'; testId: string }

export function StatCard({ icon, title, value, color, testId }: Props) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`} aria-hidden="true">{icon}</div>
      <span>{title}</span>
      <strong data-testid={testId}>{value === undefined ? '—' : value.toLocaleString()}</strong>
      <small>{value === undefined ? 'Upload to see insights' : 'From your comparison'}</small>
    </div>
  );
}
