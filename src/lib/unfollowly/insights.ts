import type { Comparison } from './compare';

export interface Insights {
  summary: string;
  patterns: { title: string; detail: string }[];
  possibleSpam: string[];
  suggestions: string[];
}

export async function getInsightsStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/insights/status');
    return res.ok && (await res.json()).configured === true;
  } catch {
    return false;
  }
}

/** Sends only the changed usernames and counts, never the full follower list. */
export async function requestInsights(results: Comparison): Promise<Insights> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lost: results.lost,
      gained: results.gained,
      oldCount: results.oldCount,
      newCount: results.newCount,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as Insights;
}
