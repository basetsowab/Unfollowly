import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import {
  authorizeUrl, exchangeCode, fetchProfile, InstagramApiError, loadInstagramConfig, type LongLivedToken,
} from './instagram';

try { process.loadEnvFile(); } catch { /* no .env file */ }

const isProd = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, '');
const secureCookies = appUrl.startsWith('https://');
const root = path.resolve(import.meta.dirname, '..');
const instagram = loadInstagramConfig(appUrl);

// Tokens live only in server memory, keyed by a random session id cookie.
// They are cleared when the server restarts or the user disconnects.
const sessions = new Map<string, LongLivedToken>();
const SESSION_COOKIE = 'uf_sid';
const STATE_COOKIE = 'uf_oauth_state';

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function cookieOptions(maxAgeMs: number) {
  return { httpOnly: true, sameSite: 'lax' as const, secure: secureCookies, path: '/', maxAge: maxAgeMs };
}

function currentSession(req: Request): [string, LongLivedToken] | null {
  const sid = readCookie(req, SESSION_COOKIE);
  const session = sid ? sessions.get(sid) : undefined;
  if (!sid || !session) return null;
  if (session.expiresAt <= Date.now()) { sessions.delete(sid); return null; }
  return [sid, session];
}

const app = express();
app.disable('x-powered-by');

app.get('/api/instagram/status', (req, res) => {
  res.json({ configured: Boolean(instagram), connected: Boolean(currentSession(req)) });
});

app.get('/auth/instagram/login', (_req, res) => {
  if (!instagram) { res.status(503).send('Instagram login is not configured on this server.'); return; }
  const state = randomBytes(24).toString('hex');
  res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));
  res.redirect(authorizeUrl(instagram, state));
});

app.get('/auth/instagram/callback', async (req: Request, res: Response) => {
  const back = (params: Record<string, string>) => res.redirect(`/?${new URLSearchParams(params)}`);
  const expectedState = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, { path: '/' });

  if (!instagram) return back({ instagram_error: 'Instagram login is not configured on this server.' });
  const { code, state, error_description: denied } = req.query as Record<string, string | undefined>;
  if (denied) return back({ instagram_error: denied });
  if (!code || !state || state !== expectedState) {
    return back({ instagram_error: 'Login could not be verified. Please try again.' });
  }

  try {
    const token = await exchangeCode(instagram, code);
    const sid = randomBytes(32).toString('hex');
    sessions.set(sid, token);
    res.cookie(SESSION_COOKIE, sid, cookieOptions(token.expiresAt - Date.now()));
    back({ instagram: 'connected' });
  } catch (e) {
    console.error('Instagram token exchange failed:', e);
    back({ instagram_error: e instanceof Error ? e.message : 'Could not connect to Instagram.' });
  }
});

app.get('/api/instagram/profile', async (req, res) => {
  const current = currentSession(req);
  if (!instagram || !current) { res.status(401).json({ error: 'Not connected to Instagram.' }); return; }
  try {
    res.json(await fetchProfile(instagram, current[1].accessToken));
  } catch (e) {
    if (e instanceof InstagramApiError && e.status === 401) {
      // Token was revoked or expired on Meta's side.
      sessions.delete(current[0]);
      res.clearCookie(SESSION_COOKIE, { path: '/' });
    }
    const status = e instanceof InstagramApiError ? e.status : 502;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Instagram request failed.' });
  }
});

app.post('/api/instagram/logout', (req, res) => {
  const current = currentSession(req);
  if (current) sessions.delete(current[0]);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

if (isProd) {
  const dist = path.join(root, 'dist');
  if (!existsSync(dist)) throw new Error('Missing dist/ folder. Run "npm run build" first.');
  app.use(express.static(dist, { index: false }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Unfollowly running at ${appUrl}${isProd ? '' : ' (dev)'}`);
  if (!instagram) console.log('Instagram login disabled: set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET in .env');
});
