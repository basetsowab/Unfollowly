// Audience insights powered by Muse Spark through the Meta Model API.
// Docs: https://dev.meta.ai/docs/quickstart
//
// Only the usernames that changed between snapshots are sent, and only when
// the user asks for insights. The full follower list stays in the browser.

export interface InsightsRequest {
  lost: string[];
  gained: string[];
  oldCount: number;
  newCount: number;
}

export interface Insights {
  summary: string;
  patterns: { title: string; detail: string }[];
  possibleSpam: string[];
  suggestions: string[];
}

export class InsightsError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

const MAX_NAMES = 300;
const BASE_URL = (process.env.META_API_BASE_URL?.trim() || 'https://api.meta.ai/v1').replace(/\/$/, '');

export function insightsConfigured(): boolean {
  return Boolean(process.env.MODEL_API_KEY?.trim());
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && /^[a-z0-9._]{1,30}$/.test(v))
    .slice(0, MAX_NAMES);
}

export function parseInsightsRequest(body: unknown): InsightsRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const request = {
    lost: cleanList(b.lost),
    gained: cleanList(b.gained),
    oldCount: Number(b.oldCount) || 0,
    newCount: Number(b.newCount) || 0,
  };
  if (!request.lost.length && !request.gained.length) {
    throw new InsightsError('There are no follower changes to analyze.', 400);
  }
  return request;
}

function buildPrompt(r: InsightsRequest): string {
  return `You help Instagram creators understand changes in their audience.

Two follower snapshots were compared.
- Followers before: ${r.oldCount}
- Followers now: ${r.newCount}
- Accounts no longer in the list (${r.lost.length}${r.lost.length === MAX_NAMES ? ', truncated' : ''}): ${r.lost.join(', ') || 'none'}
- New followers (${r.gained.length}${r.gained.length === MAX_NAMES ? ', truncated' : ''}): ${r.gained.join(', ') || 'none'}

You only have usernames, so base everything on what the names suggest (themes, niches, naming styles, bot-like patterns) and be clear when something is a guess. An account missing from the newer list may have been renamed, deactivated or restricted rather than unfollowing.

Reply with only a JSON object, no markdown, in this shape:
{
  "summary": "2-3 sentence plain-language overview of what changed",
  "patterns": [{"title": "short label", "detail": "one sentence with example usernames"}],
  "possibleSpam": ["usernames that look like spam or bot accounts"],
  "suggestions": ["short, practical tip for the creator"]
}
Give at most 4 patterns and 3 suggestions. Use an empty list when nothing fits.`;
}

function extractText(body: any): string {
  if (typeof body?.output_text === 'string') return body.output_text;
  for (const item of body?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  return '';
}

function toInsights(text: string): Insights {
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    throw new InsightsError('Muse Spark returned an answer that could not be read. Please try again.');
  }
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
  return {
    summary: typeof data.summary === 'string' ? data.summary : '',
    patterns: (Array.isArray(data.patterns) ? data.patterns : [])
      .filter((p: any) => typeof p?.title === 'string' && typeof p?.detail === 'string')
      .slice(0, 4),
    possibleSpam: strings(data.possibleSpam).slice(0, 20),
    suggestions: strings(data.suggestions).slice(0, 3),
  };
}

export async function generateInsights(request: InsightsRequest): Promise<Insights> {
  const apiKey = process.env.MODEL_API_KEY?.trim();
  if (!apiKey) throw new InsightsError('AI insights are not configured on this server.', 503);

  const res = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.META_MODEL?.trim() || 'muse-spark-1.3',
      input: buildPrompt(request),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Meta Model API error:', res.status, body);
    const message = body?.error?.message || `Meta Model API request failed (${res.status}).`;
    throw new InsightsError(message, res.status === 429 ? 429 : 502);
  }
  return toInsights(extractText(body));
}
