import { useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  AlertCircle, ArrowLeftRight, ArrowUpRight, ChartNoAxesCombined, Download, Info, Instagram,
  RotateCcw, Search, ShieldCheck, Sparkles, UserMinus, UserPlus, Users,
} from 'lucide-react';
import { StatCard } from '@/components/unfollowly/stat-card';
import { UploadCard } from '@/components/unfollowly/upload-card';
import { InstagramAccount } from '@/components/unfollowly/instagram-account';
import { compareSnapshots } from '@/lib/unfollowly/compare';
import { DEMO_NEW, DEMO_OLD } from '@/lib/unfollowly/demo';
import { saveCsv } from '@/lib/unfollowly/export-csv';
import { readFollowers } from '@/lib/unfollowly/read-file';
import '@/unfollowly.css';

type Slot = 'older' | 'newer';
type Tab = 'lost' | 'gained' | 'unchanged';

const TAB_LABEL: Record<Tab, string> = { lost: 'Unfollowed', gained: 'New', unchanged: 'Still here' };
const STATUS: Record<Tab, [string, string]> = {
  lost: ['Missing now', 'status-lost'],
  gained: ['New follower', 'status-gained'],
  unchanged: ['Still following', 'status-stayed'],
};

export default function Home() {
  const [older, setOlder] = useState<string[] | null>(null);
  const [newer, setNewer] = useState<string[] | null>(null);
  const [olderName, setOlderName] = useState('');
  const [newerName, setNewerName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Record<Slot, boolean>>({ older: false, newer: false });
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState<Tab>('lost');
  const [search, setSearch] = useState('');
  // Per-slot request tokens: any reset/demo/new selection bumps them so stale reads are discarded.
  const tokens = useRef<Record<Slot, number>>({ older: 0, newer: 0 });
  const demoRef = useRef(false);

  const results = useMemo(() => (older && newer ? compareSnapshots(older, newer) : null), [older, newer]);

  function invalidateReads() {
    tokens.current.older++; tokens.current.newer++;
    setBusy({ older: false, newer: false });
  }

  async function onFile(which: Slot, file: File | undefined) {
    if (!file) return;
    const token = ++tokens.current[which];
    setError('');
    setBusy((b) => ({ ...b, [which]: true }));
    try {
      const list = await readFollowers(file);
      if (tokens.current[which] !== token) return;
      if (demoRef.current) {
        // Never mix fictional demo data with a real snapshot.
        demoRef.current = false;
        setDemo(false);
        setOlder(null); setNewer(null); setOlderName(''); setNewerName('');
        setSearch('');
      }
      if (which === 'older') { setOlder(list); setOlderName(file.name); }
      else { setNewer(list); setNewerName(file.name); }
    } catch (e) {
      if (tokens.current[which] !== token) return;
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally {
      if (tokens.current[which] === token) setBusy((b) => ({ ...b, [which]: false }));
    }
  }

  function loadDemo() {
    invalidateReads();
    demoRef.current = true;
    setOlder(DEMO_OLD); setNewer(DEMO_NEW);
    setOlderName('demo-followers-october.json'); setNewerName('demo-followers-november.json');
    setDemo(true); setError(''); setTab('lost'); setSearch('');
  }

  function clear() {
    invalidateReads();
    demoRef.current = false;
    setOlder(null); setNewer(null); setOlderName(''); setNewerName('');
    setError(''); setDemo(false); setSearch(''); setTab('lost');
  }

  const current = results ? results[tab] : [];
  const q = search.trim().toLowerCase().replace(/^@/, '');
  const filtered = current.filter((n) => n.includes(q));

  function exportCsv() {
    if (!results) return;
    saveCsv([
      ...results.lost.map((name) => ({ name, status: 'Missing from newer snapshot' })),
      ...results.gained.map((name) => ({ name, status: 'New follower' })),
    ], demo ? 'unfollowly-demo-comparison.csv' : 'unfollowly-comparison.csv');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon" aria-hidden="true"><Instagram size={23} /></span><span>unfollowly<span className="brand-dot">.</span></span></div>
        <div className="side-label">WORKSPACE</div>
        <div className="side-active" aria-current="page"><ChartNoAxesCombined size={19} aria-hidden="true" /> Overview</div>
        <div className="side-note"><ShieldCheck size={19} aria-hidden="true" /><div><strong>Privacy first</strong><p>Your follower lists never leave this browser.</p></div></div>
        <div className="side-bottom">Built for curious creators<small>Hackathon prototype · v0.2</small></div>
      </aside>

      <main className="main">
        <header className="topbar"><span className="eyebrow">SOCIAL INSIGHTS / OVERVIEW</span><span className="top-privacy"><ShieldCheck size={15} aria-hidden="true" /> Local-only analysis</span></header>

        <section className="hero">
          <div>
            <div className="pill"><span className="live-dot" /> YOUR FOLLOWER INTELLIGENCE</div>
            <h1>Know your circle<span className="accent">.</span></h1>
            <p>See who stayed, who left, and who's new. Compare two Instagram follower snapshots in seconds — no password needed.</p>
            <div className="hero-actions">
              <button type="button" className="primary" onClick={loadDemo} data-testid="button-demo"><Sparkles size={17} aria-hidden="true" /> Try live demo</button>
              <a className="subtle-link" href="#upload" data-testid="link-upload">Upload your data <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" /><div className="orb orb-two" />
            <div className="hero-floating"><Users size={25} /><div><b>Circle insights</b><span>Understand your audience</span></div><div className="floating-graph">▂▄▃▆█</div></div>
          </div>
        </section>

        {demo && (
          <div className="demo-banner" role="status" data-testid="banner-demo">
            <Info size={17} aria-hidden="true" />
            <span><strong>Demo mode:</strong> You're viewing fictional sample usernames. Upload your own exports to analyze real data — your first upload replaces both demo lists.</span>
            <button type="button" onClick={clear} data-testid="button-exit-demo">Exit demo</button>
          </div>
        )}

        <div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Follower overview</h2></div><span className="muted" data-testid="text-comparison-state">{results ? 'Comparison ready' : 'Awaiting your data'}</span></div>
        <div className="stats">
          <StatCard icon={<Users />} title="Previous followers" value={results?.oldCount} color="purple" testId="stat-previous" />
          <StatCard icon={<Users />} title="Current followers" value={results?.newCount} color="blue" testId="stat-current" />
          <StatCard icon={<UserPlus />} title="New followers" value={results?.gained.length} color="green" testId="stat-gained" />
          <StatCard icon={<UserMinus />} title="Unfollowed" value={results?.lost.length} color="pink" testId="stat-lost" />
        </div>

        <InstagramAccount />

        <section id="upload" className="upload-section" aria-labelledby="upload-heading">
          <div className="section-heading"><div><span className="eyebrow">GET STARTED</span><h2 id="upload-heading">Compare your snapshots</h2></div><button type="button" className="reset" onClick={clear} data-testid="button-reset"><RotateCcw size={15} aria-hidden="true" /> Reset</button></div>
          <p className="section-description">Upload your older and newer Instagram followers exports, or use a simple list of usernames (.json, .txt, .csv).</p>
          <div className="upload-grid">
            <UploadCard id="older-snapshot" title="Older snapshot" subtitle="Your previous followers list" fileName={olderName} count={older?.length} busy={busy.older} onFile={(f) => onFile('older', f)} />
            <UploadCard id="newer-snapshot" title="Newer snapshot" subtitle="Your most recent followers list" fileName={newerName} count={newer?.length} busy={busy.newer} onFile={(f) => onFile('newer', f)} />
          </div>
          {error && <div className="error" role="alert" data-testid="text-error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
          <div className="hint"><Info size={16} aria-hidden="true" /><span>Tip: Instagram exports can be requested in Accounts Center → Your information and permissions → Download your information. Export followers data as JSON. Save an export now and another later to detect changes.</span></div>
        </section>

        <section className="results" aria-labelledby="results-heading">
          <div className="section-heading"><div><span className="eyebrow">YOUR RESULTS</span><h2 id="results-heading">People &amp; changes</h2></div>{results && <button type="button" className="export" onClick={exportCsv} data-testid="button-export"><Download size={16} aria-hidden="true" /> Export CSV</button>}</div>
          <div className="results-card">
            <div className="result-toolbar">
              <div className="tabs" role="tablist" aria-label="Result categories">
                {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'selected' : ''} onClick={() => { setTab(t); setSearch(''); }} data-testid={`tab-${t}`}>
                    {TAB_LABEL[t]} <span>{results ? results[t].length : '–'}</span>
                  </button>
                ))}
              </div>
              <label className="search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="Search usernames" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search usernames" data-testid="input-search" /></label>
            </div>
            {results && tab === 'lost' && results.lost.length > 0 && (
              <p className="caveat" data-testid="text-caveat"><Info size={15} aria-hidden="true" /><span>An account missing from your newer snapshot didn't necessarily unfollow you — it may have been renamed, deactivated, deleted, or restricted. Treat this list as "no longer in the export".</span></p>
            )}
            {!results ? (
              <div className="empty"><div className="empty-icon" aria-hidden="true"><ArrowLeftRight size={29} /></div><h3>Your insights are waiting</h3><p>Upload two follower snapshots above or click "Try live demo" to see how Unfollowly works.</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty small"><h3>No accounts found</h3><p>{search ? 'Try a different search.' : 'No changes in this category.'}</p></div>
            ) : (
              <ul className="people" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label={`${TAB_LABEL[tab]} accounts`}>
                {filtered.map((name, i) => (
                  <li className="person" key={name} data-testid={`row-person-${name}`}>
                    <span className="avatar" aria-hidden="true" style={{ '--hue': (name.length * 37 + i * 17) % 360 } as CSSProperties}>{name[0].toUpperCase()}</span>
                    <div className="person-name"><strong>@{name}</strong><small>Instagram username</small></div>
                    <span className={`status ${STATUS[tab][1]}`}>{STATUS[tab][0]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer><ShieldCheck size={16} aria-hidden="true" /> All analysis happens on your device. No passwords, scraping, or server uploads. <span>Unfollowly © 2026</span></footer>
      </main>
    </div>
  );
}
