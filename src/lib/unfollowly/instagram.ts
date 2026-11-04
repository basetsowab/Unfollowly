export interface InstagramStatus {
  configured: boolean;
  connected: boolean;
}

export interface InstagramProfile {
  user_id: string;
  username: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export const INSTAGRAM_LOGIN_URL = '/auth/instagram/login';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}

export async function getInstagramStatus(): Promise<InstagramStatus> {
  try {
    return await request<InstagramStatus>('/api/instagram/status');
  } catch {
    // Static hosting with no server: treat as not configured.
    return { configured: false, connected: false };
  }
}

export const getInstagramProfile = () => request<InstagramProfile>('/api/instagram/profile');

export const disconnectInstagram = () => request<{ ok: boolean }>('/api/instagram/logout', { method: 'POST' });
