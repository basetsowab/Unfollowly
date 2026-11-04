import { useEffect, useState } from 'react';
import { AlertCircle, Info, Instagram, LogOut, RefreshCw } from 'lucide-react';
import {
  disconnectInstagram, getInstagramProfile, getInstagramStatus, INSTAGRAM_LOGIN_URL,
  type InstagramProfile, type InstagramStatus,
} from '@/lib/unfollowly/instagram';

function formatCount(value?: number) {
  return value === undefined ? '—' : value.toLocaleString();
}

function readRedirectError(): string {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('instagram_error') ?? '';
  if (params.has('instagram') || params.has('instagram_error')) {
    // Clean the OAuth result out of the address bar.
    params.delete('instagram'); params.delete('instagram_error');
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
  }
  return error;
}

export function InstagramAccount() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(readRedirectError);

  async function load() {
    setLoading(true);
    try {
      const next = await getInstagramStatus();
      setStatus(next);
      setProfile(next.connected ? await getInstagramProfile() : null);
    } catch (e) {
      setProfile(null);
      setError(e instanceof Error ? e.message : 'Could not load your Instagram account.');
      setStatus(await getInstagramStatus());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function disconnect() {
    setLoading(true);
    try { await disconnectInstagram(); } catch { /* the session is gone either way */ }
    setProfile(null);
    setStatus((s) => (s ? { ...s, connected: false } : s));
    setLoading(false);
  }

  return (
    <section className="ig-section" aria-labelledby="ig-heading">
      <div className="section-heading">
        <div><span className="eyebrow">CONNECTED ACCOUNT</span><h2 id="ig-heading">Instagram account</h2></div>
        {profile && (
          <div className="ig-actions">
            <button type="button" className="reset" onClick={() => void load()} disabled={loading} data-testid="button-ig-refresh"><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
            <button type="button" className="reset" onClick={() => void disconnect()} disabled={loading} data-testid="button-ig-disconnect"><LogOut size={15} aria-hidden="true" /> Disconnect</button>
          </div>
        )}
      </div>

      <div className="ig-card" aria-busy={loading}>
        {loading && !profile ? (
          <p className="muted">Checking Instagram connection…</p>
        ) : profile ? (
          <div className="ig-profile" data-testid="card-ig-profile">
            {profile.profile_picture_url
              ? <img className="ig-avatar" src={profile.profile_picture_url} alt="" referrerPolicy="no-referrer" />
              : <span className="ig-avatar ig-avatar-fallback" aria-hidden="true">{profile.username[0]?.toUpperCase()}</span>}
            <div className="ig-identity">
              <strong>@{profile.username}</strong>
              <small>{[profile.name, profile.account_type?.toLowerCase().replace(/_/g, ' ')].filter(Boolean).join(' · ')}</small>
            </div>
            <dl className="ig-counts">
              <div><dt>Followers</dt><dd data-testid="text-ig-followers">{formatCount(profile.followers_count)}</dd></div>
              <div><dt>Following</dt><dd data-testid="text-ig-following">{formatCount(profile.follows_count)}</dd></div>
              <div><dt>Posts</dt><dd data-testid="text-ig-posts">{formatCount(profile.media_count)}</dd></div>
            </dl>
          </div>
        ) : status?.configured ? (
          <div className="ig-connect">
            <span className="upload-icon" aria-hidden="true"><Instagram size={25} /></span>
            <div>
              <strong>Connect with Instagram</strong>
              <p>See your live follower and following counts. Works with Business and Creator accounts. Optional — you never share your password with Unfollowly.</p>
            </div>
            <a className="primary" href={INSTAGRAM_LOGIN_URL} data-testid="button-ig-connect"><Instagram size={17} aria-hidden="true" /> Connect</a>
          </div>
        ) : (
          <p className="muted" data-testid="text-ig-unconfigured">Instagram login isn't set up on this server. Add your Meta app ID and secret to <code>.env</code> to enable it.</p>
        )}
      </div>

      {error && <div className="error" role="alert" data-testid="text-ig-error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <div className="hint"><Info size={16} aria-hidden="true" /><span>Meta's official API only shares follower <em>counts</em>, not the list of who follows you. To see exactly who unfollowed, compare two data exports below.</span></div>
    </section>
  );
}
