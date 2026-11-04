// Instagram API with Instagram Login (Meta).
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
//
// Note: Meta's API does not expose follower *lists* for any account type.
// It only returns counts, so follower comparisons still come from data exports.

export interface InstagramConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  apiVersion: string;
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

export interface LongLivedToken {
  accessToken: string;
  userId: string;
  expiresAt: number;
}

const SCOPES = ['instagram_business_basic'];
const PROFILE_FIELDS = [
  'user_id', 'username', 'name', 'account_type', 'profile_picture_url',
  'followers_count', 'follows_count', 'media_count',
].join(',');

export class InstagramApiError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

export function loadInstagramConfig(appUrl: string): InstagramConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;
  return {
    appId,
    appSecret,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI?.trim() || `${appUrl}/auth/instagram/callback`,
    apiVersion: process.env.INSTAGRAM_API_VERSION?.trim() || 'v23.0',
  };
}

export function authorizeUrl(config: InstagramConfig, state: string): string {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(','));
  url.searchParams.set('state', state);
  return url.toString();
}

async function readJson(res: Response): Promise<any> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error || body?.error_message) {
    const message = body?.error?.message || body?.error_message || `Instagram API request failed (${res.status})`;
    throw new InstagramApiError(message, res.status === 400 || res.status === 401 ? 401 : 502);
  }
  return body;
}

/** Trades the one-time code for a long-lived (~60 day) access token. */
export async function exchangeCode(config: InstagramConfig, code: string): Promise<LongLivedToken> {
  // Instagram appends "#_" to the code in some redirects.
  const cleanCode = code.replace(/#_$/, '');

  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code: cleanCode,
    }),
  });
  const shortBody = await readJson(shortRes);
  // The response is either flat or wrapped in a `data` array depending on API version.
  const short = Array.isArray(shortBody.data) ? shortBody.data[0] : shortBody;
  if (!short?.access_token) throw new InstagramApiError('Instagram did not return an access token.');

  const longUrl = new URL('https://graph.instagram.com/access_token');
  longUrl.searchParams.set('grant_type', 'ig_exchange_token');
  longUrl.searchParams.set('client_secret', config.appSecret);
  longUrl.searchParams.set('access_token', short.access_token);
  const long = await readJson(await fetch(longUrl));

  return {
    accessToken: long.access_token,
    userId: String(short.user_id),
    expiresAt: Date.now() + Number(long.expires_in ?? 60 * 24 * 3600) * 1000,
  };
}

export async function fetchProfile(config: InstagramConfig, accessToken: string): Promise<InstagramProfile> {
  const url = new URL(`https://graph.instagram.com/${config.apiVersion}/me`);
  url.searchParams.set('fields', PROFILE_FIELDS);
  url.searchParams.set('access_token', accessToken);
  return readJson(await fetch(url));
}
