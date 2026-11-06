'use client';
import { useCallback, useEffect, useState } from 'react';
import { House, ScanFace, ListChecks, MessagesSquare, History as HistoryIcon, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { api } from '@/lib/client';
import { Logo, Toast, Skeleton } from '@/components/ui';
import Welcome from '@/components/Welcome';
import Home from '@/components/Home';
import { Scan } from '@/components/Scan';
import Results from '@/components/Results';
import Plan from '@/components/Plan';
import Coach from '@/components/Coach';
import History from '@/components/History';
import Settings from '@/components/Settings';

const NAV = [['home', 'Overview', House], ['scan', 'New scan', ScanFace], ['plan', 'Plan', ListChecks], ['coach', 'Coach', MessagesSquare], ['history', 'History', HistoryIcon], ['settings', 'Settings', SettingsIcon]];
const TABS = [['home', 'Home', House], ['scan', 'Scan', ScanFace], ['plan', 'Plan', ListChecks], ['coach', 'Coach', MessagesSquare], ['history', 'History', HistoryIcon]];
const VIEWS = ['home', 'scan', 'results', 'plan', 'coach', 'history', 'settings'];
const NARROW = ['plan', 'coach', 'settings'];

// Hash routes (#/plan, #/results/<id>) give real browser back/forward and shareable deep links
// without a server round trip.
const readRoute = () => {
  const [v, id] = location.hash.replace(/^#\/?/, '').split('/');
  return { v: VIEWS.includes(v) ? v : 'home', id: id || null };
};

export default function App() {
  const [route, setRoute] = useState(null), [me, setMe] = useState(null), [scan, setScan] = useState(undefined), [err, setErr] = useState(''), [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const [m, s] = await Promise.all([api('me'), api('scan')]);
      setMe(m); setScan(s.scan);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const sync = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    sync(); load();
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, [load]);

  const go = useCallback((v, id, opts = {}) => {
    const hash = `#/${v}${id ? '/' + id : ''}`;
    if (opts.replace) { history.replaceState(null, '', hash); setRoute(readRoute()); window.scrollTo(0, 0); }
    else if (location.hash !== hash) location.hash = hash;
    else window.scrollTo(0, 0);
  }, []);
  const setCoachLeft = useCallback(n => setMe(m => ({ ...m, limits: { ...m.limits, coach: { ...m.limits.coach, remaining: n } } })), []);
  const clearToast = useCallback(() => setToast(''), []);

  if (err) return <main className="welcome"><div className="card stack" style={{ maxWidth: 440, margin: '0 auto' }}>
    <WifiOff size={28} color="var(--light)" aria-hidden />
    <h1 style={{ fontSize: 24 }}>Can't reach Maxora</h1>
    <p>{err}</p>
    <button className="btn btn-primary" onClick={load}>Try again</button>
  </div></main>;

  if (!me || !route || scan === undefined) return <div className="shell"><aside className="sidebar" /><main className="main"><div className="content"><Skeleton /></div></main></div>;

  if (!me.profile?.onboarded) return <Welcome done={async () => { await load(); go('scan', null, { replace: true }); }} />;

  const { v, id } = route;
  const screen = {
    home: <Home me={me} scan={scan} go={go} />,
    scan: <Scan me={me} go={go} reload={load} />,
    results: <Results id={id} latest={scan} go={go} />,
    plan: <Plan scan={scan} setScan={setScan} go={go} />,
    coach: <Coach me={me} scan={scan} go={go} onLimit={setCoachLeft} />,
    history: <History go={go} />,
    settings: <Settings me={me} setMe={setMe} toast={setToast} reset={() => { setMe(null); setScan(undefined); history.replaceState(null, '', '#/'); load(); }} />,
  }[v];
  const active = v === 'results' ? (id ? 'history' : 'home') : v;

  return <div className="shell">
    <a href="#main" className="skip" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <aside className="sidebar" aria-label="Sidebar">
      <a className="brand" href="#/home"><Logo size={36} />Maxora</a>
      <nav className="nav" aria-label="Main">
        {NAV.map(([k, label, Icon]) => <a key={k} href={`#/${k}`} className="nav-item" aria-current={active === k ? 'page' : undefined} style={{ textDecoration: 'none' }}><Icon size={20} aria-hidden />{label}</a>)}
      </nav>
      <div className="sidebar-foot">
        <p className="meta"><span style={{ color: 'var(--fg)', fontWeight: 600 }}>{me.limits.scan.remaining} of {me.limits.scan.max}</span> scans left today</p>
        <div className="allowance" aria-hidden style={{ margin: '8px 0 0' }}>{Array.from({ length: me.limits.scan.max }, (_, i) => <span key={i} className={i < me.limits.scan.remaining ? 'on' : ''} />)}</div>
      </div>
    </aside>
    <header className="topbar">
      <a className="brand" href="#/home"><Logo size={32} />Maxora</a>
      <a className="icon-btn" href="#/settings" aria-label="Settings" aria-current={active === 'settings' ? 'page' : undefined} style={active === 'settings' ? { color: 'var(--accent-fg)' } : undefined}><SettingsIcon size={22} aria-hidden /></a>
    </header>
    <main className="main" id="main" tabIndex={-1} style={{ outline: 'none' }}>
      <div className={`content${NARROW.includes(v) ? ' narrow' : ''}`} key={v + (id || '')}>{screen}</div>
    </main>
    <nav className="tabbar" aria-label="Main">
      {TABS.map(([k, label, Icon]) => <a key={k} href={`#/${k}`} className="tab" aria-current={active === k ? 'page' : undefined} style={{ textDecoration: 'none' }}><Icon size={22} aria-hidden />{label}</a>)}
    </nav>
    <Toast msg={toast} onDone={clearToast} />
  </div>;
}
